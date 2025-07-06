import * as WebSocket from 'ws';
import * as vscode from 'vscode';

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private clientId: string;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    constructor(baseUrl: string) {
        this.url = baseUrl;
        this.clientId = this.generateClientId();
    }

    private generateClientId(): string {
        return `vscode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    connect(): void {
        try {
            const wsUrl = `${this.url}/ws/${this.clientId}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.on('open', () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                vscode.window.showInformationMessage('AI Assistant connected');
            });

            this.ws.on('message', (data: WebSocket.Data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            });

            this.ws.on('close', () => {
                console.log('WebSocket disconnected');
                this.ws = null;
                this.attemptReconnect();
            });

            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                vscode.window.showErrorMessage(`AI Assistant connection error: ${error.message}`);
            });

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
        }
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            vscode.window.showWarningMessage('AI Assistant connection lost. Please check your backend server.');
        }
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    sendMessage(message: any): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
            }
        } else {
            console.warn('WebSocket not connected, message not sent:', message);
        }
    }

    private handleMessage(message: any): void {
        switch (message.type) {
            case 'chat_response':
                this.handleChatResponse(message.response);
                break;
            
            case 'completion':
                this.handleCompletion(message.completion);
                break;
            
            case 'error':
                this.handleError(message.message);
                break;
            
            case 'notification':
                this.handleNotification(message);
                break;
            
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    private handleChatResponse(response: string): void {
        // This would be handled by the chat provider
        vscode.commands.executeCommand('intelligentCodingAssistant.handleChatResponse', response);
    }

    private handleCompletion(completion: string): void {
        // This would be handled by the completion provider
        vscode.commands.executeCommand('intelligentCodingAssistant.handleCompletion', completion);
    }

    private handleError(errorMessage: string): void {
        vscode.window.showErrorMessage(`AI Assistant Error: ${errorMessage}`);
    }

    private handleNotification(notification: any): void {
        if (notification.level === 'info') {
            vscode.window.showInformationMessage(notification.message);
        } else if (notification.level === 'warning') {
            vscode.window.showWarningMessage(notification.message);
        } else if (notification.level === 'error') {
            vscode.window.showErrorMessage(notification.message);
        }
    }

    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
