import * as vscode from 'vscode';
import { ApiClient } from '../services/apiClient';

export class CompletionProvider implements vscode.CompletionItemProvider {
    private apiClient: ApiClient;
    private lastCompletionTime = 0;
    private completionDelay = 500; // ms

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
    }

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        // Check if auto-completion is enabled
        const config = vscode.workspace.getConfiguration('intelligentCodingAssistant');
        if (!config.get<boolean>('enableAutoCompletion', true)) {
            return [];
        }

        // Debounce completions
        const now = Date.now();
        if (now - this.lastCompletionTime < this.completionDelay) {
            return [];
        }
        this.lastCompletionTime = now;

        // Get context around cursor
        const lineText = document.lineAt(position).text;
        const prefix = lineText.substring(0, position.character);
        
        // Skip if we're in a comment or string
        if (this.isInCommentOrString(document, position)) {
            return [];
        }

        // Skip if the prefix doesn't look like it needs completion
        if (!this.shouldTriggerCompletion(prefix, context)) {
            return [];
        }

        try {
            // Get surrounding context
            const contextLines = this.getContextLines(document, position, 10);
            const language = document.languageId;

            // Generate completions using the API
            const completions = await this.generateCompletions(
                contextLines,
                prefix,
                language,
                position
            );

            return completions;
        } catch (error) {
            console.error('Completion generation failed:', error);
            return [];
        }
    }

    private async generateCompletions(
        context: string,
        prefix: string,
        language: string,
        position: vscode.Position
    ): Promise<vscode.CompletionItem[]> {
        try {
            // Use chat endpoint for completions with a specific prompt
            const prompt = this.buildCompletionPrompt(context, prefix, language);
            
            const response = await this.apiClient.chat({
                message: prompt,
                max_tokens: 150
            });

            return this.parseCompletionResponse(response, prefix, position);
        } catch (error) {
            console.error('API completion request failed:', error);
            return [];
        }
    }

    private buildCompletionPrompt(context: string, prefix: string, language: string): string {
        return `Complete the following ${language} code. Provide only the completion, no explanations:

Context:
\`\`\`${language}
${context}
\`\`\`

Complete this line: ${prefix}`;
    }

    private parseCompletionResponse(response: string, prefix: string, position: vscode.Position): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        
        // Clean up the response
        const cleanResponse = response.trim();
        
        // Split by lines and filter out empty ones
        const suggestions = cleanResponse.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('```'))
            .slice(0, 5); // Limit to 5 suggestions

        suggestions.forEach((suggestion, index) => {
            // Remove the prefix if it's repeated in the suggestion
            let completionText = suggestion;
            if (suggestion.startsWith(prefix)) {
                completionText = suggestion.substring(prefix.length);
            }

            if (completionText.trim()) {
                const item = new vscode.CompletionItem(
                    completionText,
                    vscode.CompletionItemKind.Text
                );
                
                item.insertText = completionText;
                item.detail = 'AI Assistant';
                item.documentation = new vscode.MarkdownString(`AI-generated completion`);
                item.sortText = `0${index}`; // Ensure AI completions appear first
                
                completions.push(item);
            }
        });

        return completions;
    }

    private shouldTriggerCompletion(prefix: string, context: vscode.CompletionContext): boolean {
        // Don't trigger on very short prefixes
        if (prefix.trim().length < 2) {
            return false;
        }

        // Trigger on specific characters or contexts
        const triggerChars = ['.', '(', '[', '{', '=', ' '];
        const lastChar = prefix[prefix.length - 1];
        
        // Trigger if we have a trigger character or if invoked explicitly
        return triggerChars.includes(lastChar) || 
               context.triggerKind === vscode.CompletionTriggerKind.Invoke ||
               this.looksLikeCodeStart(prefix);
    }

    private looksLikeCodeStart(prefix: string): boolean {
        // Check if the prefix looks like the start of a code construct
        const codePatterns = [
            /\b(def|function|class|if|for|while|try|catch)\s*$/,
            /\b(import|from|const|let|var)\s*$/,
            /\b(public|private|protected|static)\s*$/,
            /^\s*(\/\/|#|\*)\s*\w+/ // Comments
        ];

        return codePatterns.some(pattern => pattern.test(prefix));
    }

    private isInCommentOrString(document: vscode.TextDocument, position: vscode.Position): boolean {
        const line = document.lineAt(position);
        const text = line.text.substring(0, position.character);
        
        // Simple heuristic - check for quotes and comment markers
        const inString = (text.match(/"/g) || []).length % 2 === 1 ||
                        (text.match(/'/g) || []).length % 2 === 1 ||
                        (text.match(/`/g) || []).length % 2 === 1;
        
        const inComment = text.includes('//') || text.includes('#') || text.includes('/*');
        
        return inString || inComment;
    }

    private getContextLines(document: vscode.TextDocument, position: vscode.Position, numLines: number): string {
        const startLine = Math.max(0, position.line - numLines);
        const endLine = Math.min(document.lineCount - 1, position.line + numLines);
        
        const lines: string[] = [];
        for (let i = startLine; i <= endLine; i++) {
            lines.push(document.lineAt(i).text);
        }
        
        return lines.join('\n');
    }

    async provideHover(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover | undefined> {
        // Get the word at the position
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }

        const word = document.getText(wordRange);
        if (!word || word.length < 2) {
            return undefined;
        }

        try {
            // Get context around the word
            const line = document.lineAt(position);
            const context = this.getContextLines(document, position, 5);
            
            // Use the explain API to get information about the symbol
            const explanation = await this.apiClient.explainCode({
                code: context,
                language: document.languageId,
                context: {
                    symbol: word,
                    line: line.text,
                    file_path: document.fileName
                }
            });

            if (explanation) {
                const markdown = new vscode.MarkdownString();
                markdown.appendMarkdown(`**${word}**\n\n`);
                markdown.appendMarkdown(explanation);
                
                return new vscode.Hover(markdown, wordRange);
            }
        } catch (error) {
            console.error('Hover explanation failed:', error);
        }

        return undefined;
    }

    resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CompletionItem> {
        // Add more detailed documentation if needed
        return item;
    }
}
