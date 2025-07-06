import * as vscode from 'vscode';
import { ApiClient } from '../services/apiClient';

export class ChatProvider {
    private apiClient: ApiClient;
    private webviewPanel: vscode.WebviewPanel | undefined;
    private conversationHistory: Array<{role: string, content: string}> = [];

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
    }

    setupWebview(panel: vscode.WebviewPanel): void {
        this.webviewPanel = panel;
        
        panel.webview.html = this.getWebviewContent();
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'sendMessage':
                        this.handleChatMessage(message.text);
                        break;
                    case 'clearChat':
                        this.clearConversation();
                        break;
                    case 'insertCode':
                        this.insertCodeIntoEditor(message.code);
                        break;
                    case 'explainCode':
                        this.explainSelectedCode();
                        break;
                    case 'getContext':
                        this.sendEditorContext();
                        break;
                }
            },
            undefined,
            []
        );

        // Handle panel disposal
        panel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });
    }

    private async handleChatMessage(message: string): Promise<void> {
        if (!this.webviewPanel) return;

        // Add user message to history
        this.conversationHistory.push({ role: 'user', content: message });
        
        // Update UI to show user message
        this.webviewPanel.webview.postMessage({
            command: 'addMessage',
            message: {
                role: 'user',
                content: message,
                timestamp: new Date().toLocaleTimeString()
            }
        });

        // Show typing indicator
        this.webviewPanel.webview.postMessage({
            command: 'showTyping'
        });

        try {
            // Get current editor context
            const context = this.getCurrentEditorContext();
            
            // Send to API
            const response = await this.apiClient.chat({
                message,
                context,
                conversation_history: this.conversationHistory.slice(-10), // Keep last 10 messages
                max_tokens: 500
            });

            // Add assistant response to history
            this.conversationHistory.push({ role: 'assistant', content: response });

            // Hide typing indicator and show response
            this.webviewPanel.webview.postMessage({
                command: 'hideTyping'
            });

            this.webviewPanel.webview.postMessage({
                command: 'addMessage',
                message: {
                    role: 'assistant',
                    content: response,
                    timestamp: new Date().toLocaleTimeString()
                }
            });

        } catch (error) {
            console.error('Chat API error:', error);
            
            this.webviewPanel.webview.postMessage({
                command: 'hideTyping'
            });

            this.webviewPanel.webview.postMessage({
                command: 'addMessage',
                message: {
                    role: 'error',
                    content: `Sorry, I encountered an error: ${error}`,
                    timestamp: new Date().toLocaleTimeString()
                }
            });
        }
    }

    private clearConversation(): void {
        this.conversationHistory = [];
        if (this.webviewPanel) {
            this.webviewPanel.webview.postMessage({
                command: 'clearMessages'
            });
        }
    }

    private async insertCodeIntoEditor(code: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const position = editor.selection.active;
        await editor.edit(editBuilder => {
            editBuilder.insert(position, code);
        });

        // Focus back to editor
        vscode.window.showTextDocument(editor.document);
    }

    private async explainSelectedCode(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const code = selection.isEmpty ? '' : editor.document.getText(selection);
        
        if (!code.trim()) {
            vscode.window.showWarningMessage('No code selected');
            return;
        }

        // Send explanation request to chat
        const message = `Please explain this code:\n\`\`\`${editor.document.languageId}\n${code}\n\`\`\``;
        this.handleChatMessage(message);
    }

    private sendEditorContext(): void {
        if (!this.webviewPanel) return;

        const context = this.getCurrentEditorContext();
        this.webviewPanel.webview.postMessage({
            command: 'updateContext',
            context
        });
    }

    private getCurrentEditorContext(): any {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return null;

        const document = editor.document;
        const selection = editor.selection;
        
        return {
            file_path: document.fileName,
            language: document.languageId,
            selected_code: selection.isEmpty ? null : document.getText(selection),
            cursor_line: selection.active.line + 1,
            total_lines: document.lineCount,
            workspace: vscode.workspace.workspaceFolders?.[0]?.name
        };
    }

    private getWebviewContent(): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Assistant Chat</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                
                .header {
                    padding: 10px 15px;
                    background-color: var(--vscode-titleBar-activeBackground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .header h3 {
                    margin: 0;
                    color: var(--vscode-titleBar-activeForeground);
                }
                
                .header-buttons {
                    display: flex;
                    gap: 10px;
                }
                
                .btn {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .chat-container {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .message {
                    max-width: 80%;
                    padding: 10px 15px;
                    border-radius: 10px;
                    position: relative;
                }
                
                .message.user {
                    align-self: flex-end;
                    background-color: var(--vscode-inputOption-activeBackground);
                    color: var(--vscode-inputOption-activeForeground);
                }
                
                .message.assistant {
                    align-self: flex-start;
                    background-color: var(--vscode-textBlockQuote-background);
                    border-left: 3px solid var(--vscode-textLink-foreground);
                }
                
                .message.error {
                    align-self: flex-start;
                    background-color: var(--vscode-inputValidation-errorBackground);
                    color: var(--vscode-inputValidation-errorForeground);
                    border-left: 3px solid var(--vscode-inputValidation-errorBorder);
                }
                
                .message-content {
                    margin: 0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                
                .message-time {
                    font-size: 11px;
                    opacity: 0.7;
                    margin-top: 5px;
                }
                
                .code-block {
                    background-color: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 5px;
                    padding: 10px;
                    margin: 10px 0;
                    position: relative;
                    font-family: 'Courier New', monospace;
                    overflow-x: auto;
                }
                
                .code-actions {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    display: flex;
                    gap: 5px;
                }
                
                .code-btn {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 3px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                }
                
                .input-container {
                    padding: 15px;
                    border-top: 1px solid var(--vscode-panel-border);
                    background-color: var(--vscode-input-background);
                }
                
                .input-row {
                    display: flex;
                    gap: 10px;
                    align-items: flex-end;
                }
                
                .message-input {
                    flex: 1;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 5px;
                    padding: 10px;
                    resize: vertical;
                    min-height: 40px;
                    max-height: 120px;
                    font-family: inherit;
                }
                
                .send-btn {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .send-btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .typing-indicator {
                    align-self: flex-start;
                    padding: 10px 15px;
                    background-color: var(--vscode-textBlockQuote-background);
                    border-radius: 10px;
                    border-left: 3px solid var(--vscode-textLink-foreground);
                    font-style: italic;
                    opacity: 0.8;
                }
                
                .context-info {
                    font-size: 12px;
                    opacity: 0.7;
                    margin-bottom: 10px;
                    padding: 8px;
                    background-color: var(--vscode-badge-background);
                    border-radius: 3px;
                }
                
                .quick-actions {
                    display: flex;
                    gap: 5px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }
                
                .quick-action {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 5px 10px;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                .quick-action:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h3>🤖 AI Assistant</h3>
                <div class="header-buttons">
                    <button class="btn" onclick="explainCode()">Explain Selection</button>
                    <button class="btn" onclick="getContext()">Update Context</button>
                    <button class="btn" onclick="clearChat()">Clear Chat</button>
                </div>
            </div>
            
            <div class="chat-container" id="chatContainer">
                <div class="context-info" id="contextInfo">
                    Ready to help! Select code and ask questions, or just chat about your project.
                </div>
                
                <div class="quick-actions">
                    <button class="quick-action" onclick="sendQuickMessage('Explain this code')">Explain Code</button>
                    <button class="quick-action" onclick="sendQuickMessage('How can I optimize this?')">Optimize</button>
                    <button class="quick-action" onclick="sendQuickMessage('Generate tests for this')">Generate Tests</button>
                    <button class="quick-action" onclick="sendQuickMessage('Find bugs in this code')">Debug</button>
                    <button class="quick-action" onclick="sendQuickMessage('Add documentation')">Document</button>
                </div>
            </div>
            
            <div class="input-container">
                <div class="input-row">
                    <textarea 
                        id="messageInput" 
                        class="message-input" 
                        placeholder="Ask me anything about your code..."
                        rows="2"
                    ></textarea>
                    <button id="sendBtn" class="send-btn" onclick="sendMessage()">Send</button>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                // Handle messages from extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'addMessage':
                            addMessage(message.message);
                            break;
                        case 'clearMessages':
                            clearMessages();
                            break;
                        case 'showTyping':
                            showTypingIndicator();
                            break;
                        case 'hideTyping':
                            hideTypingIndicator();
                            break;
                        case 'updateContext':
                            updateContext(message.context);
                            break;
                    }
                });
                
                function sendMessage() {
                    const input = document.getElementById('messageInput');
                    const message = input.value.trim();
                    
                    if (message) {
                        vscode.postMessage({
                            command: 'sendMessage',
                            text: message
                        });
                        input.value = '';
                        input.style.height = 'auto';
                    }
                }
                
                function sendQuickMessage(message) {
                    document.getElementById('messageInput').value = message;
                    sendMessage();
                }
                
                function clearChat() {
                    vscode.postMessage({ command: 'clearChat' });
                }
                
                function explainCode() {
                    vscode.postMessage({ command: 'explainCode' });
                }
                
                function getContext() {
                    vscode.postMessage({ command: 'getContext' });
                }
                
                function insertCode(code) {
                    vscode.postMessage({
                        command: 'insertCode',
                        code: code
                    });
                }
                
                function addMessage(msg) {
                    const container = document.getElementById('chatContainer');
                    const messageDiv = document.createElement('div');
                    messageDiv.className = \`message \${msg.role}\`;
                    
                    let content = msg.content;
                    
                    // Process code blocks
                    content = content.replace(/\`\`\`(\w+)?\n([\s\S]*?)\`\`\`/g, (match, lang, code) => {
                        return \`<div class="code-block">
                            <div class="code-actions">
                                <button class="code-btn" onclick="insertCode(\\\`\${code.trim()}\\\`)">Insert</button>
                                <button class="code-btn" onclick="navigator.clipboard.writeText(\\\`\${code.trim()}\\\`)">Copy</button>
                            </div>
                            <pre><code>\${code.trim()}</code></pre>
                        </div>\`;
                    });
                    
                    // Process inline code
                    content = content.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
                    
                    messageDiv.innerHTML = \`
                        <div class="message-content">\${content}</div>
                        <div class="message-time">\${msg.timestamp}</div>
                    \`;
                    
                    container.appendChild(messageDiv);
                    container.scrollTop = container.scrollHeight;
                }
                
                function clearMessages() {
                    const container = document.getElementById('chatContainer');
                    const messages = container.querySelectorAll('.message, .typing-indicator');
                    messages.forEach(msg => msg.remove());
                }
                
                function showTypingIndicator() {
                    const container = document.getElementById('chatContainer');
                    const typingDiv = document.createElement('div');
                    typingDiv.className = 'typing-indicator';
                    typingDiv.id = 'typingIndicator';
                    typingDiv.textContent = 'AI is thinking...';
                    container.appendChild(typingDiv);
                    container.scrollTop = container.scrollHeight;
                }
                
                function hideTypingIndicator() {
                    const typing = document.getElementById('typingIndicator');
                    if (typing) {
                        typing.remove();
                    }
                }
                
                function updateContext(context) {
                    const contextInfo = document.getElementById('contextInfo');
                    if (context) {
                        contextInfo.textContent = \`📁 \${context.workspace || 'No workspace'} | 📄 \${context.language} | Line \${context.cursor_line}/\${context.total_lines}\`;
                    } else {
                        contextInfo.textContent = 'No active editor';
                    }
                }
                
                // Handle Enter key
                document.getElementById('messageInput').addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });
                
                // Auto-resize textarea
                document.getElementById('messageInput').addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = this.scrollHeight + 'px';
                });
                
                // Initialize context
                getContext();
            </script>
        </body>
        </html>
        `;
    }
}
