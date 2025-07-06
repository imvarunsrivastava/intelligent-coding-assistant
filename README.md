# Intelligent Coding Assistant

A full-stack AI-powered coding assistant similar to Cursor or Windsurf, featuring natural language to code generation, intelligent code completion, refactoring, and multi-file understanding.

## 🚀 Features

- **Natural Language to Code**: Generate code from natural language descriptions
- **Inline Code Completion**: Smart autocomplete with context awareness
- **Code Refactoring**: Intelligent code restructuring and optimization
- **Multi-file Understanding**: Project-wide context and analysis
- **Smart Queries**: File-level and project-level intelligent search
- **Debug Assistant**: Error analysis and debugging suggestions
- **Test Generation**: Automatic test case creation
- **Embedding-based Search**: Semantic code search and retrieval

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   VS Code       │    │   Backend API    │    │   Vector DB     │
│   Extension     │◄──►│   (FastAPI)      │◄──►│   (Qdrant)      │
│                 │    │                  │    │                 │
│ • Commands      │    │ • LLM Integration│    │ • Code Embeddings│
│ • Chat UI       │    │ • Context Retrieval│  │ • Semantic Search│
│ • Inline Hints  │    │ • Prompt Templates│   │ • Similarity     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   LLM Provider   │
                       │ Claude/GPT-4/    │
                       │ Code Llama       │
                       └──────────────────┘
```

## 📁 Project Structure

```
intelligent-coding-assistant/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app
│   │   ├── models/            # Data models
│   │   ├── services/          # Business logic
│   │   ├── api/               # API routes
│   │   └── utils/             # Utilities
│   ├── requirements.txt
│   └── Dockerfile
├── vscode-extension/          # VS Code extension
│   ├── src/
│   │   ├── extension.ts       # Main extension file
│   │   ├── commands/          # Command handlers
│   │   ├── providers/         # Language providers
│   │   └── ui/                # UI components
│   ├── package.json
│   └── tsconfig.json
├── shared/                    # Shared types and utilities
├── docker-compose.yml         # Development setup
└── README.md
```

## 🛠️ Technology Stack

- **Backend**: FastAPI, Python 3.9+
- **LLM**: Claude-3.5, GPT-4, or Code Llama
- **Embeddings**: BGE-M3 or OpenAI text-embedding-3-small
- **Vector Database**: Qdrant
- **Frontend**: VS Code Extension (TypeScript)
- **Deployment**: Docker, Docker Compose

## 🚀 Quick Start

### Automated Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intelligent-coding-assistant
   ```

2. **Run setup script**
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Add your API keys**
   ```bash
   # Edit .env file and add your API keys
   nano .env
   ```

4. **Start all services**
   ```bash
   chmod +x scripts/start.sh
   ./scripts/start.sh
   ```

5. **Install VS Code extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Click "Install from VSIX"
   - Select the `.vsix` file from `vscode-extension/` folder

### Manual Setup

1. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   
   # VS Code Extension
   cd vscode-extension
   npm install
   npm run compile
   cd ..
   ```

3. **Start services**
   ```bash
   # Start infrastructure
   docker-compose up -d qdrant redis
   
   # Start backend
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload
   ```

## 📝 Usage

### Commands in VS Code:
- `/explain` - Explain selected code
- `/refactor` - Refactor code with suggestions
- `/generate` - Generate code from description
- `/test` - Generate test cases
- `/debug` - Debug assistance
- `/optimize` - Performance optimization

### Chat Interface:
- Open command palette (`Ctrl+Shift+P`)
- Type "AI Assistant: Open Chat"
- Ask questions about your codebase

## 🔧 Configuration

Create `.env` file in backend directory:
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
QDRANT_URL=http://localhost:6333
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.
