import * as vscode from 'vscode';
import { ApiClient } from './services/apiClient';
import { ChatProvider } from './providers/chatProvider';
import { CompletionProvider } from './providers/completionProvider';
import { CommandHandler } from './commands/commandHandler';
import { WebSocketClient } from './services/webSocketClient';

let apiClient: ApiClient;
let chatProvider: ChatProvider;
let completionProvider: CompletionProvider;
let commandHandler: CommandHandler;
let webSocketClient: WebSocketClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('Intelligent Coding Assistant is now active!');

    // Initialize services
    const config = vscode.workspace.getConfiguration('intelligentCodingAssistant');
    const apiUrl = config.get<string>('apiUrl', 'http://localhost:8000');
    
    apiClient = new ApiClient(apiUrl);
    chatProvider = new ChatProvider(apiClient);
    completionProvider = new CompletionProvider(apiClient);
    commandHandler = new CommandHandler(apiClient, context);
    
    // Initialize WebSocket if enabled
    if (config.get<boolean>('enableWebSocket', true)) {
        webSocketClient = new WebSocketClient(apiUrl.replace('http', 'ws'));
        webSocketClient.connect();
    }

    // Register commands
    const commands = [
        vscode.commands.registerCommand('intelligentCodingAssistant.explain', () => commandHandler.explainCode()),
        vscode.commands.registerCommand('intelligentCodingAssistant.refactor', () => commandHandler.refactorCode()),
        vscode.commands.registerCommand('intelligentCodingAssistant.generate', () => commandHandler.generateCode()),
        vscode.commands.registerCommand('intelligentCodingAssistant.generateTests', () => commandHandler.generateTests()),
        vscode.commands.registerCommand('intelligentCodingAssistant.debug', () => commandHandler.debugCode()),
        vscode.commands.registerCommand('intelligentCodingAssistant.optimize', () => commandHandler.optimizeCode()),
        vscode.commands.registerCommand('intelligentCodingAssistant.document', () => commandHandler.generateDocumentation()),
        vscode.commands.registerCommand('intelligentCodingAssistant.openChat', () => commandHandler.openChat()),
        vscode.commands.registerCommand('intelligentCodingAssistant.indexProject', () => commandHandler.indexProject())
    ];

    // Register providers
    const providers = [
        // Code completion provider
        vscode.languages.registerCompletionItemProvider(
            { scheme: 'file' },
            completionProvider,
            '.'
        ),
        
        // Hover provider for explanations
        vscode.languages.registerHoverProvider(
            { scheme: 'file' },
            {
                provideHover(document: vscode.TextDocument, position: vscode.Position) {
                    return completionProvider.provideHover(document, position);
                }
            }
        )
    ];

    // Register chat view
    const chatViewProvider = vscode.window.createWebviewPanel(
        'intelligentCodingAssistant.chat',
        'AI Assistant Chat',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    chatProvider.setupWebview(chatViewProvider);

    // Add all disposables to context
    context.subscriptions.push(...commands, ...providers, chatViewProvider);

    // Set context for views
    vscode.commands.executeCommand('setContext', 'intelligentCodingAssistant.chatViewEnabled', true);

    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(robot) AI Assistant";
    statusBarItem.tooltip = "Intelligent Coding Assistant";
    statusBarItem.command = 'intelligentCodingAssistant.openChat';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('intelligentCodingAssistant')) {
            const newConfig = vscode.workspace.getConfiguration('intelligentCodingAssistant');
            const newApiUrl = newConfig.get<string>('apiUrl', 'http://localhost:8000');
            
            if (newApiUrl !== apiUrl) {
                apiClient.updateBaseUrl(newApiUrl);
                
                if (webSocketClient) {
                    webSocketClient.disconnect();
                    webSocketClient = new WebSocketClient(newApiUrl.replace('http', 'ws'));
                    webSocketClient.connect();
                }
            }
        }
    });

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && webSocketClient) {
            const document = editor.document;
            webSocketClient.sendMessage({
                type: 'context_update',
                file_path: document.fileName,
                language: document.languageId,
                content: document.getText()
            });
        }
    });

    // Listen for text document changes for real-time features
    vscode.workspace.onDidChangeTextDocument(event => {
        if (webSocketClient && event.document === vscode.window.activeTextEditor?.document) {
            // Debounce the updates
            clearTimeout((global as any).documentChangeTimeout);
            (global as any).documentChangeTimeout = setTimeout(() => {
                webSocketClient.sendMessage({
                    type: 'document_change',
                    file_path: event.document.fileName,
                    language: event.document.languageId,
                    changes: event.contentChanges.map(change => ({
                        range: {
                            start: { line: change.range.start.line, character: change.range.start.character },
                            end: { line: change.range.end.line, character: change.range.end.character }
                        },
                        text: change.text
                    }))
                });
            }, 1000);
        }
    });
}

export function deactivate() {
    if (webSocketClient) {
        webSocketClient.disconnect();
    }
    console.log('Intelligent Coding Assistant deactivated');
}
