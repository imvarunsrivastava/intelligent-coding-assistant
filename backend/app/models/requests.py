"""
Pydantic models for API requests
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CodeGenerationRequest(BaseModel):
    """Request model for code generation"""
    description: str = Field(..., description="Natural language description of the code to generate")
    language: str = Field(..., description="Programming language (python, javascript, etc.)")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context like file structure, imports, etc.")
    style: Optional[str] = Field("clean", description="Code style preference (clean, functional, oop, etc.)")
    max_tokens: Optional[int] = Field(1000, description="Maximum tokens to generate")

class CodeExplanationRequest(BaseModel):
    """Request model for code explanation"""
    code: str = Field(..., description="Code to explain")
    language: str = Field(..., description="Programming language")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    detail_level: Optional[str] = Field("medium", description="Level of detail (brief, medium, detailed)")

class CodeRefactorRequest(BaseModel):
    """Request model for code refactoring"""
    code: str = Field(..., description="Code to refactor")
    language: str = Field(..., description="Programming language")
    goals: List[str] = Field(..., description="Refactoring goals (performance, readability, etc.)")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    preserve_functionality: bool = Field(True, description="Whether to preserve original functionality")

class TestGenerationRequest(BaseModel):
    """Request model for test generation"""
    code: str = Field(..., description="Code to generate tests for")
    language: str = Field(..., description="Programming language")
    test_framework: Optional[str] = Field(None, description="Test framework (pytest, jest, etc.)")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    test_types: List[str] = Field(["unit"], description="Types of tests to generate")

class DebugRequest(BaseModel):
    """Request model for debugging assistance"""
    code: str = Field(..., description="Code with issues")
    error_message: Optional[str] = Field(None, description="Error message if available")
    language: str = Field(..., description="Programming language")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    expected_behavior: Optional[str] = Field(None, description="Expected behavior description")

class ChatRequest(BaseModel):
    """Request model for chat interactions"""
    message: str = Field(..., description="User message")
    context: Optional[Dict[str, Any]] = Field(None, description="Current context (file, project, etc.)")
    conversation_history: List[Dict[str, str]] = Field([], description="Previous conversation messages")
    max_tokens: Optional[int] = Field(500, description="Maximum tokens in response")

class CodeCompletionRequest(BaseModel):
    """Request model for code completion"""
    code: str = Field(..., description="Code context")
    cursor_position: int = Field(..., description="Cursor position in the code")
    language: str = Field(..., description="Programming language")
    max_completions: int = Field(3, description="Maximum number of completion suggestions")

class ProjectAnalysisRequest(BaseModel):
    """Request model for project-wide analysis"""
    project_path: str = Field(..., description="Path to the project directory")
    query: str = Field(..., description="Analysis query")
    file_patterns: List[str] = Field(["*.py", "*.js", "*.ts", "*.java", "*.cpp"], description="File patterns to include")
    exclude_patterns: List[str] = Field(["node_modules", "__pycache__", ".git"], description="Patterns to exclude")

class EmbeddingRequest(BaseModel):
    """Request model for creating embeddings"""
    text: str = Field(..., description="Text to embed")
    model: Optional[str] = Field(None, description="Embedding model to use")

class SearchRequest(BaseModel):
    """Request model for semantic search"""
    query: str = Field(..., description="Search query")
    project_path: Optional[str] = Field(None, description="Project path to search within")
    top_k: int = Field(5, description="Number of results to return")
    threshold: float = Field(0.7, description="Similarity threshold")

class FileIndexRequest(BaseModel):
    """Request model for indexing files"""
    file_paths: List[str] = Field(..., description="List of file paths to index")
    project_id: str = Field(..., description="Project identifier")
    chunk_size: int = Field(1000, description="Size of text chunks for embedding")
    overlap: int = Field(200, description="Overlap between chunks")

class OptimizationRequest(BaseModel):
    """Request model for code optimization"""
    code: str = Field(..., description="Code to optimize")
    language: str = Field(..., description="Programming language")
    optimization_goals: List[str] = Field(..., description="Optimization goals (speed, memory, readability)")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    constraints: List[str] = Field([], description="Optimization constraints")

class DocumentationRequest(BaseModel):
    """Request model for documentation generation"""
    code: str = Field(..., description="Code to document")
    language: str = Field(..., description="Programming language")
    doc_style: str = Field("google", description="Documentation style (google, numpy, sphinx)")
    include_examples: bool = Field(True, description="Whether to include usage examples")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
