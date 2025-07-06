"""
Embedding Service for generating text embeddings
"""
import os
import asyncio
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import openai
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating text embeddings"""
    
    def __init__(self):
        self.local_model = None
        self.openai_client = None
        self.model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        
        # Initialize embedding models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize embedding models"""
        try:
            # Initialize local sentence transformer model
            self.local_model = SentenceTransformer(self.model_name)
            logger.info(f"Local embedding model initialized: {self.model_name}")
        except Exception as e:
            logger.warning(f"Failed to initialize local embedding model: {str(e)}")
        
        # Initialize OpenAI client if API key is available
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.openai_client = openai.AsyncOpenAI(api_key=openai_key)
            logger.info("OpenAI embedding client initialized")
    
    async def embed_text(
        self,
        text: str,
        model: Optional[str] = None,
        use_openai: bool = False
    ) -> List[float]:
        """Generate embedding for a single text"""
        if use_openai and self.openai_client:
            return await self._embed_with_openai(text, model)
        else:
            return await self._embed_with_local_model(text)
    
    async def embed_texts(
        self,
        texts: List[str],
        model: Optional[str] = None,
        use_openai: bool = False,
        batch_size: int = 32
    ) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        if use_openai and self.openai_client:
            # Process in batches for OpenAI
            embeddings = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                batch_embeddings = await asyncio.gather(*[
                    self._embed_with_openai(text, model) for text in batch
                ])
                embeddings.extend(batch_embeddings)
            return embeddings
        else:
            return await self._embed_with_local_model_batch(texts)
    
    async def _embed_with_openai(
        self,
        text: str,
        model: Optional[str] = None
    ) -> List[float]:
        """Generate embedding using OpenAI API"""
        model = model or "text-embedding-3-small"
        
        try:
            response = await self.openai_client.embeddings.create(
                model=model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"OpenAI embedding error: {str(e)}")
            # Fallback to local model
            return await self._embed_with_local_model(text)
    
    async def _embed_with_local_model(self, text: str) -> List[float]:
        """Generate embedding using local model"""
        if not self.local_model:
            raise ValueError("No embedding model available")
        
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                None, self.local_model.encode, text
            )
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Local embedding error: {str(e)}")
            raise
    
    async def _embed_with_local_model_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts using local model"""
        if not self.local_model:
            raise ValueError("No embedding model available")
        
        try:
            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                None, self.local_model.encode, texts
            )
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Local batch embedding error: {str(e)}")
            raise
    
    def get_embedding_dimension(self, use_openai: bool = False, model: Optional[str] = None) -> int:
        """Get the dimension of embeddings"""
        if use_openai:
            model = model or "text-embedding-3-small"
            if model == "text-embedding-3-small":
                return 1536
            elif model == "text-embedding-3-large":
                return 3072
            else:
                return 1536  # Default
        else:
            if self.local_model:
                return self.local_model.get_sentence_embedding_dimension()
            else:
                return 384  # Default for all-MiniLM-L6-v2
    
    async def compute_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """Compute cosine similarity between two embeddings"""
        try:
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Compute cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        except Exception as e:
            logger.error(f"Similarity computation error: {str(e)}")
            return 0.0
    
    async def find_most_similar(
        self,
        query_embedding: List[float],
        candidate_embeddings: List[List[float]],
        top_k: int = 5
    ) -> List[tuple]:
        """Find most similar embeddings to query"""
        try:
            similarities = []
            
            for i, candidate in enumerate(candidate_embeddings):
                similarity = await self.compute_similarity(query_embedding, candidate)
                similarities.append((i, similarity))
            
            # Sort by similarity (descending)
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            return similarities[:top_k]
        except Exception as e:
            logger.error(f"Similarity search error: {str(e)}")
            return []
