import * as vscode from 'vscode';
import { ApiClient } from '../services/apiClient';
import * as path from 'path';

export class CommandHandler {
    private apiClient: ApiClient;
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(apiClient: ApiClient, context: vscode.ExtensionContext) {
        this.apiClient = apiClient;
        this.context = context;
        this.outputChannel = vscode.window.createOutputChannel('AI Assistant');
    }

    async explainCode(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        
        if (!code.trim()) {
            vscode.window.showErrorMessage('No code selected or found');
            return;
        }

        const language = editor.document.languageId;

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Explaining code...",
                cancellable: false
            }, async () => {
                const explanation = await this.apiClient.explainCode({
                    code,
                    language,
                    context: this.getFileContext(editor.document)
                });

                this.showResult('Code Explanation', explanation);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to explain code: ${error}`);
        }
    }

    async refactorCode(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        
        if (!code.trim()) {
            vscode.window.showErrorMessage('No code selected or found');
            return;
        }

        // Ask user for refactoring goals
        const goals = await vscode.window.showQuickPick([
            'Improve readability',
            'Optimize performance',
            'Reduce complexity',
            'Follow best practices',
            'Add error handling',
            'Improve maintainability'
        ], {
            canPickMany: true,
            placeHolder: 'Select refactoring goals'
        });

        if (!goals || goals.length === 0) {
            return;
        }

        const language = editor.document.languageId;

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Refactoring code...",
                cancellable: false
            }, async () => {
                const result = await this.apiClient.refactorCode({
                    code,
                    language,
                    goals,
                    context: this.getFileContext(editor.document)
                });

                await this.showRefactoredCode(result.code, result.improvements, selection);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refactor code: ${error}`);
        }
    }

    async generateCode(): Promise<void> {
        const description = await vscode.window.showInputBox({
            prompt: 'Describe the code you want to generate',
            placeHolder: 'e.g., Create a function to sort an array of objects by name'
        });

        if (!description) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        const language = editor?.document.languageId || 'python';

        // Ask for code style preference
        const style = await vscode.window.showQuickPick([
            'clean',
            'functional',
            'object-oriented',
            'minimal',
            'documented'
        ], {
            placeHolder: 'Select code style preference'
        });

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating code...",
                cancellable: false
            }, async () => {
                const generatedCode = await this.apiClient.generateCode({
                    description,
                    language,
                    style: style || 'clean',
                    context: editor ? this.getFileContext(editor.document) : undefined
                });

                await this.insertGeneratedCode(generatedCode);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate code: ${error}`);
        }
    }

    async generateTests(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        
        if (!code.trim()) {
            vscode.window.showErrorMessage('No code selected or found');
            return;
        }

        const language = editor.document.languageId;

        // Suggest test framework based on language
        const testFrameworks = this.getTestFrameworks(language);
        const testFramework = await vscode.window.showQuickPick(testFrameworks, {
            placeHolder: 'Select test framework'
        });

        if (!testFramework) {
            return;
        }

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating tests...",
                cancellable: false
            }, async () => {
                const testCode = await this.apiClient.generateTests({
                    code,
                    language,
                    test_framework: testFramework,
                    context: this.getFileContext(editor.document)
                });

                await this.createTestFile(testCode, editor.document.fileName, testFramework);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate tests: ${error}`);
        }
    }

    async debugCode(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        
        if (!code.trim()) {
            vscode.window.showErrorMessage('No code selected or found');
            return;
        }

        // Ask for error message (optional)
        const errorMessage = await vscode.window.showInputBox({
            prompt: 'Enter error message (optional)',
            placeHolder: 'e.g., TypeError: Cannot read property of undefined'
        });

        const language = editor.document.languageId;

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Analyzing code for debugging...",
                cancellable: false
            }, async () => {
                const result = await this.apiClient.debugCode({
                    code,
                    error_message: errorMessage,
                    language,
                    context: this.getFileContext(editor.document)
                });

                await this.showDebugResults(result.suggestions, result.fixed_code, selection);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to debug code: ${error}`);
        }
    }

    async optimizeCode(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        
        if (!code.trim()) {
            vscode.window.showErrorMessage('No code selected or found');
            return;
        }

        // Ask for optimization goals
        const goals = await vscode.window.showQuickPick([
            'Improve performance',
            'Reduce memory usage',
            'Optimize algorithms',
            'Reduce complexity',
            'Improve readability'
        ], {
            canPickMany: true,
            placeHolder: 'Select optimization goals'
        });

        if (!goals || goals.length === 0) {
            return;
        }

        const language = editor.document.languageId;

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Optimizing code...",
                cancellable: false
            }, async () => {
                const result = await this.apiClient.optimizeCode({
                    code,
                    language,
                    optimization_goals: goals,
                    context: this.getFileContext(editor.document)
                });

                await this.showOptimizedCode(result.optimized_code, result.improvements, selection);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to optimize code: ${error}`);
        }
    }

    async generateDocumentation(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        
        if (!code.trim()) {
            vscode.window.showErrorMessage('No code selected or found');
            return;
        }

        const language = editor.document.languageId;

        // Ask for documentation style
        const docStyles = this.getDocumentationStyles(language);
        const docStyle = await vscode.window.showQuickPick(docStyles, {
            placeHolder: 'Select documentation style'
        });

        if (!docStyle) {
            return;
        }

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating documentation...",
                cancellable: false
            }, async () => {
                const documentedCode = await this.apiClient.generateDocumentation({
                    code,
                    language,
                    doc_style: docStyle,
                    include_examples: true,
                    context: this.getFileContext(editor.document)
                });

                await this.replaceCodeWithDocumented(documentedCode, selection);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate documentation: ${error}`);
        }
    }

    async openChat(): Promise<void> {
        vscode.commands.executeCommand('intelligentCodingAssistant.showChatView');
    }

    async indexProject(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const projectPath = workspaceFolders[0].uri.fsPath;
        const projectId = path.basename(projectPath);

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Indexing project...",
                cancellable: false
            }, async () => {
                const success = await this.apiClient.indexProject(projectPath, projectId);
                
                if (success) {
                    vscode.window.showInformationMessage('Project indexed successfully!');
                } else {
                    vscode.window.showErrorMessage('Failed to index project');
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to index project: ${error}`);
        }
    }

    private getFileContext(document: vscode.TextDocument): any {
        return {
            file_path: document.fileName,
            language: document.languageId,
            line_count: document.lineCount
        };
    }

    private getTestFrameworks(language: string): string[] {
        const frameworks: { [key: string]: string[] } = {
            'python': ['pytest', 'unittest', 'nose2'],
            'javascript': ['jest', 'mocha', 'jasmine'],
            'typescript': ['jest', 'mocha', 'jasmine'],
            'java': ['junit', 'testng'],
            'cpp': ['gtest', 'catch2'],
            'c': ['unity', 'cmocka']
        };
        return frameworks[language] || ['unittest'];
    }

    private getDocumentationStyles(language: string): string[] {
        const styles: { [key: string]: string[] } = {
            'python': ['google', 'numpy', 'sphinx'],
            'javascript': ['jsdoc', 'google'],
            'typescript': ['tsdoc', 'jsdoc'],
            'java': ['javadoc'],
            'cpp': ['doxygen'],
            'c': ['doxygen']
        };
        return styles[language] || ['google'];
    }

    private async showResult(title: string, content: string): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'aiAssistantResult',
            title,
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = this.getResultHtml(title, content);
    }

    private async showRefactoredCode(code: string, improvements: string[], selection: vscode.Selection): Promise<void> {
        const action = await vscode.window.showInformationMessage(
            'Code refactored successfully!',
            'Apply Changes',
            'Show Diff',
            'Cancel'
        );

        if (action === 'Apply Changes') {
            await this.replaceCode(code, selection);
        } else if (action === 'Show Diff') {
            await this.showDiff('Original', 'Refactored', selection, code);
        }

        // Show improvements
        if (improvements.length > 0) {
            this.outputChannel.appendLine('Refactoring Improvements:');
            improvements.forEach((improvement, index) => {
                this.outputChannel.appendLine(`${index + 1}. ${improvement}`);
            });
            this.outputChannel.show();
        }
    }

    private async showDebugResults(suggestions: string[], fixedCode?: string, selection?: vscode.Selection): Promise<void> {
        // Show suggestions
        this.outputChannel.appendLine('Debug Suggestions:');
        suggestions.forEach((suggestion, index) => {
            this.outputChannel.appendLine(`${index + 1}. ${suggestion}`);
        });
        this.outputChannel.show();

        // Offer to apply fixed code if available
        if (fixedCode && selection) {
            const action = await vscode.window.showInformationMessage(
                'Debug suggestions generated!',
                'Apply Fix',
                'Show Diff'
            );

            if (action === 'Apply Fix') {
                await this.replaceCode(fixedCode, selection);
            } else if (action === 'Show Diff') {
                await this.showDiff('Original', 'Fixed', selection, fixedCode);
            }
        }
    }

    private async showOptimizedCode(code: string, improvements: string[], selection: vscode.Selection): Promise<void> {
        const action = await vscode.window.showInformationMessage(
            'Code optimized successfully!',
            'Apply Changes',
            'Show Diff',
            'Cancel'
        );

        if (action === 'Apply Changes') {
            await this.replaceCode(code, selection);
        } else if (action === 'Show Diff') {
            await this.showDiff('Original', 'Optimized', selection, code);
        }

        // Show improvements
        if (improvements.length > 0) {
            this.outputChannel.appendLine('Optimization Improvements:');
            improvements.forEach((improvement, index) => {
                this.outputChannel.appendLine(`${index + 1}. ${improvement}`);
            });
            this.outputChannel.show();
        }
    }

    private async insertGeneratedCode(code: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            // Create new document
            const document = await vscode.workspace.openTextDocument({
                content: code,
                language: 'python' // Default language
            });
            await vscode.window.showTextDocument(document);
        } else {
            // Insert at cursor position
            const position = editor.selection.active;
            await editor.edit(editBuilder => {
                editBuilder.insert(position, code);
            });
        }
    }

    private async replaceCode(newCode: string, selection: vscode.Selection): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        await editor.edit(editBuilder => {
            if (selection.isEmpty) {
                editBuilder.replace(new vscode.Range(0, 0, editor.document.lineCount, 0), newCode);
            } else {
                editBuilder.replace(selection, newCode);
            }
        });
    }

    private async replaceCodeWithDocumented(documentedCode: string, selection: vscode.Selection): Promise<void> {
        const action = await vscode.window.showInformationMessage(
            'Documentation generated successfully!',
            'Apply Changes',
            'Show Diff',
            'Cancel'
        );

        if (action === 'Apply Changes') {
            await this.replaceCode(documentedCode, selection);
        } else if (action === 'Show Diff') {
            await this.showDiff('Original', 'Documented', selection, documentedCode);
        }
    }

    private async createTestFile(testCode: string, originalFileName: string, framework: string): Promise<void> {
        const testFileName = this.generateTestFileName(originalFileName, framework);
        
        const document = await vscode.workspace.openTextDocument({
            content: testCode,
            language: path.extname(originalFileName).substring(1)
        });

        await vscode.window.showTextDocument(document);
        
        // Suggest saving the file
        vscode.window.showInformationMessage(
            `Test file created! Save as: ${testFileName}`,
            'Save As'
        ).then(action => {
            if (action === 'Save As') {
                vscode.commands.executeCommand('workbench.action.files.saveAs');
            }
        });
    }

    private generateTestFileName(originalFileName: string, framework: string): string {
        const ext = path.extname(originalFileName);
        const baseName = path.basename(originalFileName, ext);
        const dir = path.dirname(originalFileName);
        
        return path.join(dir, `test_${baseName}${ext}`);
    }

    private async showDiff(leftTitle: string, rightTitle: string, selection: vscode.Selection, newCode: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const originalCode = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
        
        // Create temporary documents for diff
        const leftDoc = await vscode.workspace.openTextDocument({
            content: originalCode,
            language: editor.document.languageId
        });

        const rightDoc = await vscode.workspace.openTextDocument({
            content: newCode,
            language: editor.document.languageId
        });

        // Show diff
        await vscode.commands.executeCommand('vscode.diff', leftDoc.uri, rightDoc.uri, `${leftTitle} ↔ ${rightTitle}`);
    }

    private getResultHtml(title: string, content: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    margin: 20px;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                }
                pre {
                    background-color: var(--vscode-textBlockQuote-background);
                    padding: 15px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                code {
                    background-color: var(--vscode-textBlockQuote-background);
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                h1 { color: var(--vscode-textLink-foreground); }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <div>${content.replace(/\n/g, '<br>')}</div>
        </body>
        </html>
        `;
    }
}
