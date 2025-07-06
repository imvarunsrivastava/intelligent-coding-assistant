#!/bin/bash

# Intelligent Coding Assistant Setup Script
set -e

echo "🚀 Setting up Intelligent Coding Assistant..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. VS Code extension setup will be skipped."
        return 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_warning "Node.js version 16+ is recommended. Current version: $(node --version)"
    fi
    
    print_success "Node.js is installed: $(node --version)"
    return 0
}

# Setup environment file
setup_env() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from template"
        print_warning "Please edit .env file and add your API keys!"
        print_warning "Required: OPENAI_API_KEY and/or ANTHROPIC_API_KEY"
    else
        print_warning ".env file already exists, skipping..."
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    fi
    
    # Activate virtual environment and install dependencies
    print_status "Installing Python dependencies..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Backend dependencies installed"
    
    cd ..
}

# Setup VS Code extension
setup_vscode_extension() {
    if ! check_nodejs; then
        return
    fi
    
    print_status "Setting up VS Code extension..."
    
    cd vscode-extension
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    print_success "VS Code extension dependencies installed"
    
    # Compile TypeScript
    print_status "Compiling TypeScript..."
    npm run compile
    print_success "VS Code extension compiled"
    
    cd ..
}

# Start services with Docker
start_services() {
    print_status "Starting services with Docker..."
    
    # Start only the infrastructure services first
    docker-compose up -d qdrant redis
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are healthy
    if docker-compose ps | grep -q "unhealthy"; then
        print_error "Some services failed to start properly"
        docker-compose logs
        exit 1
    fi
    
    print_success "Infrastructure services started successfully"
    print_status "You can now start the backend manually or with Docker"
}

# Main setup function
main() {
    echo "============================================"
    echo "  Intelligent Coding Assistant Setup"
    echo "============================================"
    echo
    
    # Check prerequisites
    check_docker
    
    # Setup components
    setup_env
    setup_backend
    setup_vscode_extension
    
    # Ask user if they want to start services
    echo
    read -p "Do you want to start the infrastructure services (Qdrant, Redis) now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_services
    fi
    
    echo
    echo "============================================"
    print_success "Setup completed!"
    echo "============================================"
    echo
    echo "Next steps:"
    echo "1. Edit .env file and add your API keys"
    echo "2. Start the backend:"
    echo "   - Option A: cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
    echo "   - Option B: docker-compose up backend"
    echo "3. Install VS Code extension:"
    echo "   - Open VS Code"
    echo "   - Go to Extensions view (Ctrl+Shift+X)"
    echo "   - Click 'Install from VSIX'"
    echo "   - Select vscode-extension/intelligent-coding-assistant-*.vsix"
    echo "4. Configure the extension with your backend URL"
    echo
    print_warning "Don't forget to add your API keys to the .env file!"
}

# Run main function
main "$@"
