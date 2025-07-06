# Intelligent Coding Assistant - VS Code Extension

An AI-powered coding assistant that integrates with VS Code to provide intelligent code generation, explanation, refactoring, and debugging capabilities.

## Features

### 🚀 Core Features
- **Natural Language to Code**: Generate code from natural language descriptions
- **Code Explanation**: Get detailed explanations of selected code
- **Smart Refactoring**: Improve code quality with AI-suggested refactoring
- **Test Generation**: Automatically generate unit tests for your code
- **Debug Assistance**: Get help debugging errors and issues
- **Code Optimization**: Optimize code for performance and readability
- **Documentation Generation**: Auto-generate documentation for your code

### 💬 Interactive Chat
- **AI Chat Interface**: Chat with the AI about your code and project
- **Context-Aware**: The AI understands your current file and workspace
- **Code Insertion**: Insert AI-generated code directly into your editor
- **Quick Actions**: Common tasks available as quick buttons

### ⚡ Smart Completions
- **AI-Powered Completions**: Get intelligent code completions
- **Context-Aware Suggestions**: Completions based on your current code context
- **Multi-Language Support**: Works with Python, JavaScript, TypeScript, Java, C++, and more

### 🔍 Code Understanding
- **Hover Explanations**: Hover over symbols to get AI explanations
- **Project Indexing**: Index your entire project for better context understanding
- **Semantic Search**: Search your codebase using natural language

## Installation

### Prerequisites
1. VS Code 1.74.0 or higher
2. Node.js 16.x or higher
3. Backend API server running (see backend setup instructions)

### From Source
1. Clone the repository
2. Navigate to the `vscode-extension` directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Compile the extension:
   ```bash
   npm run compile
   ```
5. Press F5 to launch a new VS Code window with the extension loaded

### Package and Install
1. Install vsce (VS Code Extension Manager):
   ```bash
   npm install -g vsce
   ```
2. Package the extension:
   ```bash
   vsce package
   ```
3. Install the generated `.vsix` file in VS Code

## Configuration

Configure the extension through VS Code settings:

```json
{
    "intelligentCodingAssistant.apiUrl": "http://localhost:8000",
    "intelligentCodingAssistant.enableAutoCompletion": true,
    "intelligentCodingAssistant.completionDelay": 500,
    "intelligentCodingAssistant.maxCompletions": 5,
    "intelligentCodingAssistant.enableWebSocket": true
}
```

### Settings Description

- **apiUrl**: Backend API server URL (default: `http://localhost:8000`)
- **enableAutoCompletion**: Enable/disable AI-powered code completions (default: `true`)
- **completionDelay**: Delay in milliseconds before triggering completions (default: `500`)
- **maxCompletions**: Maximum number of completion suggestions (default: `5`)
- **enableWebSocket**: Enable real-time features via WebSocket (default: `true`)

## Usage

### Commands

Access commands through:
- **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
- **Right-click context menu** in the editor
- **Keyboard shortcuts**

Available commands:
- `Explain Code` - Explain selected code or current file
- `Refactor Code` - Refactor selected code with AI suggestions
- `Generate Code` - Generate code from natural language description
- `Generate Tests` - Create unit tests for selected code
- `Debug Code` - Get debugging help for selected code
- `Optimize Code` - Optimize code for better performance
- `Generate Documentation` - Add documentation to your code
- `Open AI Chat` - Open the AI chat interface
- `Index Project` - Index current project for better context

### Keyboard Shortcuts

- `Ctrl+Alt+E` (`Cmd+Alt+E` on Mac) - Explain Code
- `Ctrl+Alt+R` (`Cmd+Alt+R` on Mac) - Refactor Code
- `Ctrl+Alt+G` (`Cmd+Alt+G` on Mac) - Generate Code
- `Ctrl+Alt+T` (`Cmd+Alt+T` on Mac) - Generate Tests
- `Ctrl+Alt+D` (`Cmd+Alt+D` on Mac) - Debug Code
- `Ctrl+Alt+C` (`Cmd+Alt+C` on Mac) - Open Chat

### Chat Interface

1. Open the chat with `Ctrl+Alt+C` or through the command palette
2. The chat appears in a side panel
3. Ask questions about your code or request help
4. Use quick action buttons for common tasks
5. Insert generated code directly into your editor

### Code Completions

1. Start typing in any supported file
2. AI completions appear automatically after a short delay
3. Use `Tab` or `Enter` to accept suggestions
4. Completions are context-aware and consider your current code

## Supported Languages

- Python
- JavaScript
- TypeScript
- Java
- C/C++
- C#
- Go
- Rust
- PHP
- Ruby
- And more...

## Troubleshooting

### Common Issues

**Extension not working:**
1. Check that the backend API server is running
2. Verify the API URL in settings
3. Check the VS Code Developer Console for errors

**No completions appearing:**
1. Ensure `enableAutoCompletion` is set to `true`
2. Check if you're in a supported file type
3. Try increasing the `completionDelay` setting

**Chat not responding:**
1. Verify backend server connection
2. Check WebSocket connection in settings
3. Look for error messages in the chat interface

**Performance issues:**
1. Increase `completionDelay` to reduce API calls
2. Disable WebSocket if not needed
3. Reduce `maxCompletions` setting

### Getting Help

1. Check the backend server logs for API errors
2. Open VS Code Developer Tools (`Help > Toggle Developer Tools`)
3. Look for extension-related errors in the console
4. Check the "AI Assistant" output channel in VS Code

## Development

### Building from Source

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile TypeScript:
   ```bash
   npm run compile
   ```
4. Watch for changes during development:
   ```bash
   npm run watch
   ```

### Testing

Run tests with:
```bash
npm test
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### v1.0.0
- Initial release
- Core AI features (explain, refactor, generate, test, debug)
- Chat interface
- Code completions
- Multi-language support
- WebSocket integration
