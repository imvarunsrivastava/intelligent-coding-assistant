"""
Code Service - Main service for code-related operations
"""
import os
import ast
import re
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import tree_sitter
import tree_sitter_python
import tree_sitter_javascript
import tree_sitter_typescript
import logging

from .llm_service import LLMService
from .embedding_service import EmbeddingService
from .vector_service import VectorService
from ..utils.prompt_templates import PromptTemplates

logger = logging.getLogger(__name__)

class CodeService:
    """Main service for code analysis and generation"""
    
    def __init__(self, embedding_service: EmbeddingService, vector_service: VectorService):
        self.embedding_service = embedding_service
        self.vector_service = vector_service
        self.llm_service = LLMService()
        self.prompt_templates = PromptTemplates()
        
        # Initialize tree-sitter parsers
        self.parsers = {}
        self._initialize_parsers()
    
    def _initialize_parsers(self):
        """Initialize tree-sitter parsers for different languages"""
        try:
            # Python parser
            python_language = tree_sitter.Language(tree_sitter_python.language(), "python")
            python_parser = tree_sitter.Parser()
            python_parser.set_language(python_language)
            self.parsers["python"] = python_parser
            
            # JavaScript parser
            js_language = tree_sitter.Language(tree_sitter_javascript.language(), "javascript")
            js_parser = tree_sitter.Parser()
            js_parser.set_language(js_language)
            self.parsers["javascript"] = js_parser
            
            # TypeScript parser
            ts_language = tree_sitter.Language(tree_sitter_typescript.language(), "typescript")
            ts_parser = tree_sitter.Parser()
            ts_parser.set_language(ts_language)
            self.parsers["typescript"] = ts_parser
            
            logger.info("Tree-sitter parsers initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize some parsers: {str(e)}")
    
    async def generate_code(
        self,
        description: str,
        language: str,
        context: Optional[Dict[str, Any]] = None,
        style: str = "clean"
    ) -> str:
        """Generate code from natural language description"""
        try:
            # Get relevant context from vector database
            context_code = await self._get_relevant_context(description, language)
            
            # Build prompt
            prompt = self.prompt_templates.code_generation_prompt(
                description=description,
                language=language,
                context=context_code,
                style=style,
                additional_context=context
            )
            
            # Generate code
            generated_code = await self.llm_service.generate_completion(
                prompt=prompt,
                max_tokens=1500,
                temperature=0.1
            )
            
            return self._extract_code_from_response(generated_code, language)
        
        except Exception as e:
            logger.error(f"Code generation error: {str(e)}")
            raise
    
    async def explain_code(
        self,
        code: str,
        language: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Explain code functionality"""
        try:
            # Parse code to understand structure
            code_structure = self._parse_code_structure(code, language)
            
            # Build prompt
            prompt = self.prompt_templates.code_explanation_prompt(
                code=code,
                language=language,
                structure=code_structure,
                context=context
            )
            
            # Generate explanation
            explanation = await self.llm_service.generate_completion(
                prompt=prompt,
                max_tokens=1000,
                temperature=0.2
            )
            
            return explanation
        
        except Exception as e:
            logger.error(f"Code explanation error: {str(e)}")
            raise
    
    async def refactor_code(
        self,
        code: str,
        language: str,
        goals: List[str],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Refactor code with specific goals"""
        try:
            # Parse code structure
            code_structure = self._parse_code_structure(code, language)
            
            # Build prompt
            prompt = self.prompt_templates.code_refactoring_prompt(
                code=code,
                language=language,
                goals=goals,
                structure=code_structure,
                context=context
            )
            
            # Generate refactored code
            response = await self.llm_service.generate_completion(
                prompt=prompt,
                max_tokens=2000,
                temperature=0.1
            )
            
            # Parse response to extract code and improvements
            refactored_code = self._extract_code_from_response(response, language)
            improvements = self._extract_improvements_from_response(response)
            
            return {
                "code": refactored_code,
                "improvements": improvements
            }
        
        except Exception as e:
            logger.error(f"Code refactoring error: {str(e)}")
            raise
    
    async def generate_tests(
        self,
        code: str,
        language: str,
        test_framework: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate test cases for code"""
        try:
            # Parse code to understand functions/classes
            code_structure = self._parse_code_structure(code, language)
            
            # Determine test framework if not specified
            if not test_framework:
                test_framework = self._get_default_test_framework(language)
            
            # Build prompt
            prompt = self.prompt_templates.test_generation_prompt(
                code=code,
                language=language,
                test_framework=test_framework,
                structure=code_structure,
                context=context
            )
            
            # Generate tests
            test_code = await self.llm_service.generate_completion(
                prompt=prompt,
                max_tokens=1500,
                temperature=0.1
            )
            
            return self._extract_code_from_response(test_code, language)
        
        except Exception as e:
            logger.error(f"Test generation error: {str(e)}")
            raise
    
    async def debug_code(
        self,
        code: str,
        error_message: Optional[str],
        language: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Debug code and provide suggestions"""
        try:
            # Parse code structure
            code_structure = self._parse_code_structure(code, language)
            
            # Build prompt
            prompt = self.prompt_templates.debug_prompt(
                code=code,
                error_message=error_message,
                language=language,
                structure=code_structure,
                context=context
            )
            
            # Generate debug suggestions
            response = await self.llm_service.generate_completion(
                prompt=prompt,
                max_tokens=1000,
                temperature=0.2
            )
            
            # Parse response
            suggestions = self._extract_debug_suggestions(response)
            fixed_code = self._extract_code_from_response(response, language)
            
            return {
                "suggestions": suggestions,
                "fixed_code": fixed_code if fixed_code != code else None
            }
        
        except Exception as e:
            logger.error(f"Debug error: {str(e)}")
            raise
    
    async def chat(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """Chat with the AI assistant"""
        try:
            # Get relevant code context if available
            relevant_context = ""
            if context and context.get("current_file"):
                relevant_context = await self._get_file_context(context["current_file"])
            
            # Build prompt with conversation history
            prompt = self.prompt_templates.chat_prompt(
                message=message,
                context=relevant_context,
                conversation_history=conversation_history or [],
                additional_context=context
            )
            
            # Generate response
            response = await self.llm_service.generate_completion(
                prompt=prompt,
                max_tokens=800,
                temperature=0.3
            )
            
            return response
        
        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            raise
    
    async def complete_code(
        self,
        code: str,
        cursor_position: int,
        language: str
    ) -> List[str]:
        """Generate code completions"""
        try:
            # Extract context around cursor
            before_cursor = code[:cursor_position]
            after_cursor = code[cursor_position:]
            
            # Build prompt for completion
            prompt = self.prompt_templates.code_completion_prompt(
                before_cursor=before_cursor,
                after_cursor=after_cursor,
                language=language
            )
            
            # Generate completions
            completion = await self.llm_service.generate_completion(
                prompt=prompt,
                max_tokens=200,
                temperature=0.2
            )
            
            # Parse and return completions
            completions = self._parse_completions(completion)
            return completions[:3]  # Return top 3 completions
        
        except Exception as e:
            logger.error(f"Code completion error: {str(e)}")
            return []
    
    async def index_project(
        self,
        project_path: str,
        project_id: str,
        file_patterns: List[str] = None
    ) -> bool:
        """Index a project for semantic search"""
        try:
            if not file_patterns:
                file_patterns = ["*.py", "*.js", "*.ts", "*.java", "*.cpp", "*.c", "*.h"]
            
            # Find all code files
            code_files = []
            project_root = Path(project_path)
            
            for pattern in file_patterns:
                code_files.extend(project_root.rglob(pattern))
            
            # Process files in chunks
            vectors = []
            payloads = []
            
            for file_path in code_files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Chunk the file content
                    chunks = self._chunk_code(content, str(file_path))
                    
                    for chunk in chunks:
                        # Generate embedding
                        embedding = await self.embedding_service.embed_text(chunk["text"])
                        vectors.append(embedding)
                        
                        # Create payload
                        payload = {
                            "project_id": project_id,
                            "file_path": str(file_path),
                            "chunk_type": chunk["type"],
                            "start_line": chunk["start_line"],
                            "end_line": chunk["end_line"],
                            "text": chunk["text"]
                        }
                        payloads.append(payload)
                
                except Exception as e:
                    logger.warning(f"Failed to process file {file_path}: {str(e)}")
                    continue
            
            # Ensure collection exists
            collection_name = f"project_{project_id}"
            embedding_dim = self.embedding_service.get_embedding_dimension()
            await self.vector_service.ensure_collection(collection_name, embedding_dim)
            
            # Add vectors to database
            success = await self.vector_service.add_vectors(
                collection_name=collection_name,
                vectors=vectors,
                payloads=payloads
            )
            
            logger.info(f"Indexed {len(vectors)} code chunks for project {project_id}")
            return success
        
        except Exception as e:
            logger.error(f"Project indexing error: {str(e)}")
            return False
    
    def _parse_code_structure(self, code: str, language: str) -> Dict[str, Any]:
        """Parse code structure using tree-sitter"""
        try:
            if language not in self.parsers:
                return {"functions": [], "classes": [], "imports": []}
            
            parser = self.parsers[language]
            tree = parser.parse(bytes(code, "utf8"))
            
            structure = {
                "functions": [],
                "classes": [],
                "imports": []
            }
            
            # Extract functions, classes, and imports
            self._extract_code_elements(tree.root_node, structure, code)
            
            return structure
        
        except Exception as e:
            logger.warning(f"Code parsing error: {str(e)}")
            return {"functions": [], "classes": [], "imports": []}
    
    def _extract_code_elements(self, node, structure: Dict, code: str):
        """Recursively extract code elements from AST"""
        if node.type == "function_definition":
            func_name = self._get_node_text(node.child_by_field_name("name"), code)
            structure["functions"].append(func_name)
        
        elif node.type == "class_definition":
            class_name = self._get_node_text(node.child_by_field_name("name"), code)
            structure["classes"].append(class_name)
        
        elif node.type == "import_statement" or node.type == "import_from_statement":
            import_text = self._get_node_text(node, code)
            structure["imports"].append(import_text)
        
        # Recursively process children
        for child in node.children:
            self._extract_code_elements(child, structure, code)
    
    def _get_node_text(self, node, code: str) -> str:
        """Get text content of a tree-sitter node"""
        if node is None:
            return ""
        return code[node.start_byte:node.end_byte]
    
    def _chunk_code(self, content: str, file_path: str) -> List[Dict[str, Any]]:
        """Chunk code content for embedding"""
        chunks = []
        lines = content.split('\n')
        
        # Simple chunking by functions/classes
        current_chunk = []
        current_start = 1
        
        for i, line in enumerate(lines, 1):
            current_chunk.append(line)
            
            # Check if this is a good place to split
            if (len(current_chunk) >= 50 or 
                (line.strip().startswith('def ') or line.strip().startswith('class ')) and len(current_chunk) > 10):
                
                chunk_text = '\n'.join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "type": "code_block",
                    "start_line": current_start,
                    "end_line": i
                })
                
                current_chunk = []
                current_start = i + 1
        
        # Add remaining chunk
        if current_chunk:
            chunk_text = '\n'.join(current_chunk)
            chunks.append({
                "text": chunk_text,
                "type": "code_block",
                "start_line": current_start,
                "end_line": len(lines)
            })
        
        return chunks
    
    def _extract_code_from_response(self, response: str, language: str) -> str:
        """Extract code from LLM response"""
        # Look for code blocks
        code_block_pattern = rf"```{language}?\n(.*?)\n```"
        matches = re.findall(code_block_pattern, response, re.DOTALL | re.IGNORECASE)
        
        if matches:
            return matches[0].strip()
        
        # If no code blocks, return the response as is
        return response.strip()
    
    def _extract_improvements_from_response(self, response: str) -> List[str]:
        """Extract improvement descriptions from response"""
        improvements = []
        
        # Look for bullet points or numbered lists
        improvement_patterns = [
            r"[-*]\s+(.+)",
            r"\d+\.\s+(.+)",
            r"Improvement:\s*(.+)"
        ]
        
        for pattern in improvement_patterns:
            matches = re.findall(pattern, response, re.MULTILINE)
            improvements.extend(matches)
        
        return improvements[:5]  # Return top 5 improvements
    
    def _extract_debug_suggestions(self, response: str) -> List[str]:
        """Extract debug suggestions from response"""
        suggestions = []
        
        # Look for suggestions in the response
        suggestion_patterns = [
            r"Suggestion:\s*(.+)",
            r"Fix:\s*(.+)",
            r"Solution:\s*(.+)",
            r"[-*]\s+(.+)"
        ]
        
        for pattern in suggestion_patterns:
            matches = re.findall(pattern, response, re.MULTILINE)
            suggestions.extend(matches)
        
        return suggestions[:3]  # Return top 3 suggestions
    
    def _parse_completions(self, completion_text: str) -> List[str]:
        """Parse completion suggestions from response"""
        # Split by lines and filter meaningful completions
        lines = completion_text.split('\n')
        completions = []
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and len(line) > 2:
                completions.append(line)
        
        return completions
    
    def _get_default_test_framework(self, language: str) -> str:
        """Get default test framework for language"""
        frameworks = {
            "python": "pytest",
            "javascript": "jest",
            "typescript": "jest",
            "java": "junit",
            "cpp": "gtest",
            "c": "unity"
        }
        return frameworks.get(language, "unittest")
    
    async def _get_relevant_context(self, query: str, language: str) -> str:
        """Get relevant code context from vector database"""
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.embed_text(query)
            
            # Search in default collection
            results = await self.vector_service.search_vectors(
                collection_name="code_embeddings",
                query_vector=query_embedding,
                limit=3,
                score_threshold=0.7
            )
            
            # Extract relevant code snippets
            context_snippets = []
            for result in results:
                if result["payload"].get("text"):
                    context_snippets.append(result["payload"]["text"])
            
            return "\n\n".join(context_snippets)
        
        except Exception as e:
            logger.warning(f"Failed to get relevant context: {str(e)}")
            return ""
    
    async def _get_file_context(self, file_path: str) -> str:
        """Get context from current file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Return first 1000 characters as context
            return content[:1000] + "..." if len(content) > 1000 else content
        
        except Exception as e:
            logger.warning(f"Failed to get file context: {str(e)}")
            return ""
