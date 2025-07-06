"""
Main FastAPI application for the Intelligent Coding Assistant
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
import logging

from app.services.llm_service import LLMService
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.code_service import CodeService
from app.api.routes import router
from app.models.requests import (
    CodeGenerationRequest,
    CodeExplanationRequest,
    CodeRefactorRequest,
    TestGenerationRequest,
    DebugRequest,
    ChatRequest
)
from app.utils.websocket_manager import WebSocketManager

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services
llm_service = None
embedding_service = None
vector_service = None
code_service = None
websocket_manager = WebSocketManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    global llm_service, embedding_service, vector_service, code_service
    
    logger.info("Initializing services...")
    
    # Initialize services
    llm_service = LLMService()
    embedding_service = EmbeddingService()
    vector_service = VectorService()
    code_service = CodeService(embedding_service, vector_service)
    
    logger.info("Services initialized successfully")
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down services...")

# Create FastAPI app
app = FastAPI(
    title="Intelligent Coding Assistant API",
    description="AI-powered coding assistant backend",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Include API routes
app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Intelligent Coding Assistant API", "status": "running"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "llm": llm_service is not None,
            "embedding": embedding_service is not None,
            "vector_db": vector_service is not None,
            "code_service": code_service is not None
        }
    }

@app.post("/api/v1/generate")
async def generate_code(request: CodeGenerationRequest):
    """Generate code from natural language description"""
    try:
        result = await code_service.generate_code(
            description=request.description,
            language=request.language,
            context=request.context,
            style=request.style
        )
        return {"generated_code": result, "success": True}
    except Exception as e:
        logger.error(f"Code generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/explain")
async def explain_code(request: CodeExplanationRequest):
    """Explain code functionality"""
    try:
        explanation = await code_service.explain_code(
            code=request.code,
            language=request.language,
            context=request.context
        )
        return {"explanation": explanation, "success": True}
    except Exception as e:
        logger.error(f"Code explanation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/refactor")
async def refactor_code(request: CodeRefactorRequest):
    """Refactor code with improvements"""
    try:
        result = await code_service.refactor_code(
            code=request.code,
            language=request.language,
            goals=request.goals,
            context=request.context
        )
        return {
            "refactored_code": result["code"],
            "improvements": result["improvements"],
            "success": True
        }
    except Exception as e:
        logger.error(f"Code refactoring error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/test")
async def generate_tests(request: TestGenerationRequest):
    """Generate test cases for code"""
    try:
        tests = await code_service.generate_tests(
            code=request.code,
            language=request.language,
            test_framework=request.test_framework,
            context=request.context
        )
        return {"test_code": tests, "success": True}
    except Exception as e:
        logger.error(f"Test generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/debug")
async def debug_code(request: DebugRequest):
    """Debug code and provide suggestions"""
    try:
        result = await code_service.debug_code(
            code=request.code,
            error_message=request.error_message,
            language=request.language,
            context=request.context
        )
        return {
            "suggestions": result["suggestions"],
            "fixed_code": result.get("fixed_code"),
            "success": True
        }
    except Exception as e:
        logger.error(f"Debug error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/chat")
async def chat(request: ChatRequest):
    """Chat with the AI assistant"""
    try:
        response = await code_service.chat(
            message=request.message,
            context=request.context,
            conversation_history=request.conversation_history
        )
        return {"response": response, "success": True}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time communication"""
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Process different message types
            if data["type"] == "chat":
                response = await code_service.chat(
                    message=data["message"],
                    context=data.get("context", {}),
                    conversation_history=data.get("history", [])
                )
                await websocket_manager.send_personal_message(
                    {"type": "chat_response", "response": response}, 
                    client_id
                )
            elif data["type"] == "code_completion":
                completion = await code_service.complete_code(
                    code=data["code"],
                    cursor_position=data["cursor_position"],
                    language=data["language"]
                )
                await websocket_manager.send_personal_message(
                    {"type": "completion", "completion": completion}, 
                    client_id
                )
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket_manager.send_personal_message(
            {"type": "error", "message": str(e)}, 
            client_id
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
