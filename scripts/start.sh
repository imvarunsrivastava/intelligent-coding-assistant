#!/bin/bash

# Start script for Intelligent Coding Assistant
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found. Please run setup.sh first or copy .env.example to .env"
        exit 1
    fi
    
    # Check for required API keys
    if ! grep -q "OPENAI_API_KEY=.*[^=]" .env && ! grep -q "ANTHROPIC_API_KEY=.*[^=]" .env; then
        print_warning "No API keys found in .env file. Please add at least one API key."
        print_warning "Required: OPENAI_API_KEY or ANTHROPIC_API_KEY"
    fi
}

# Start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services..."
    docker-compose up -d qdrant redis
    
    print_status "Waiting for services to be ready..."
    sleep 5
    
    # Wait for Qdrant to be ready
    for i in {1..30}; do
        if curl -s http://localhost:6333/health > /dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    # Wait for Redis to be ready
    for i in {1..30}; do
        if redis-cli ping > /dev/null 2>&1; then
            break
        fi
        sleep 2
    done
    
    print_success "Infrastructure services are ready"
}

# Start backend service
start_backend() {
    local mode=$1
    
    if [ "$mode" = "docker" ]; then
        print_status "Starting backend with Docker..."
        docker-compose up -d backend
        
        # Wait for backend to be ready
        print_status "Waiting for backend to be ready..."
        for i in {1..60}; do
            if curl -s http://localhost:8000/health > /dev/null 2>&1; then
                break
            fi
            sleep 2
        done
        
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "Backend is ready at http://localhost:8000"
        else
            print_error "Backend failed to start"
            docker-compose logs backend
            exit 1
        fi
    else
        print_status "Starting backend in development mode..."
        cd backend
        
        if [ ! -d "venv" ]; then
            print_error "Virtual environment not found. Please run setup.sh first."
            exit 1
        fi
        
        source venv/bin/activate
        export $(cat ../.env | xargs)
        uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
        BACKEND_PID=$!
        
        cd ..
        
        # Wait for backend to be ready
        print_status "Waiting for backend to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:8000/health > /dev/null 2>&1; then
                break
            fi
            sleep 2
        done
        
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "Backend is ready at http://localhost:8000"
        else
            print_error "Backend failed to start"
            kill $BACKEND_PID 2>/dev/null || true
            exit 1
        fi
    fi
}

# Show status
show_status() {
    echo
    echo "============================================"
    echo "  Service Status"
    echo "============================================"
    
    # Check Qdrant
    if curl -s http://localhost:6333/health > /dev/null 2>&1; then
        print_success "Qdrant: Running (http://localhost:6333)"
    else
        print_error "Qdrant: Not running"
    fi
    
    # Check Redis
    if redis-cli ping > /dev/null 2>&1; then
        print_success "Redis: Running (localhost:6379)"
    else
        print_error "Redis: Not running"
    fi
    
    # Check Backend
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend API: Running (http://localhost:8000)"
        
        # Show API endpoints
        echo
        echo "Available API endpoints:"
        echo "  - Health: http://localhost:8000/health"
        echo "  - Docs: http://localhost:8000/docs"
        echo "  - WebSocket: ws://localhost:8000/ws/{client_id}"
    else
        print_error "Backend API: Not running"
    fi
    
    echo
}

# Stop all services
stop_services() {
    print_status "Stopping all services..."
    
    # Stop Docker services
    docker-compose down
    
    # Kill backend process if running locally
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    print_success "All services stopped"
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  start [dev|docker]  Start all services (default: dev)"
    echo "  stop               Stop all services"
    echo "  status             Show service status"
    echo "  logs               Show service logs"
    echo "  restart            Restart all services"
    echo "  help               Show this help message"
    echo
    echo "Options:"
    echo "  dev                Start backend in development mode"
    echo "  docker             Start backend with Docker"
    echo
    echo "Examples:"
    echo "  $0 start           Start in development mode"
    echo "  $0 start docker    Start with Docker"
    echo "  $0 stop            Stop all services"
    echo "  $0 status          Check service status"
}

# Show logs
show_logs() {
    local service=$1
    
    if [ -z "$service" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$service"
    fi
}

# Main function
main() {
    local command=${1:-start}
    local mode=${2:-dev}
    
    case $command in
        start)
            check_env
            start_infrastructure
            start_backend "$mode"
            show_status
            
            echo "============================================"
            print_success "All services started successfully!"
            echo "============================================"
            echo
            echo "VS Code Extension Setup:"
            echo "1. Open VS Code"
            echo "2. Install the extension from vscode-extension/ folder"
            echo "3. Configure API URL: http://localhost:8000"
            echo
            echo "To stop services: $0 stop"
            ;;
        stop)
            stop_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$mode"
            ;;
        restart)
            stop_services
            sleep 2
            check_env
            start_infrastructure
            start_backend "$mode"
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Handle Ctrl+C
trap 'echo; print_status "Received interrupt signal"; stop_services; exit 0' INT

# Run main function
main "$@"
