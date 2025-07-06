"""
Vector Database Service using Qdrant
"""
import os
import uuid
from typing import List, Dict, Any, Optional, Tuple
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct, Filter, 
    FieldCondition, MatchValue, SearchRequest
)
import logging

logger = logging.getLogger(__name__)

class VectorService:
    """Service for vector database operations using Qdrant"""
    
    def __init__(self):
        self.client = None
        self.qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.default_collection = "code_embeddings"
        
        # Initialize Qdrant client
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Qdrant client"""
        try:
            self.client = AsyncQdrantClient(url=self.qdrant_url)
            logger.info(f"Qdrant client initialized: {self.qdrant_url}")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant client: {str(e)}")
            # Fallback to in-memory storage for development
            self.client = AsyncQdrantClient(":memory:")
            logger.info("Using in-memory Qdrant for development")
    
    async def create_collection(
        self,
        collection_name: str,
        vector_size: int,
        distance: Distance = Distance.COSINE
    ) -> bool:
        """Create a new collection"""
        try:
            await self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=distance
                )
            )
            logger.info(f"Collection created: {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to create collection {collection_name}: {str(e)}")
            return False
    
    async def collection_exists(self, collection_name: str) -> bool:
        """Check if collection exists"""
        try:
            collections = await self.client.get_collections()
            return any(col.name == collection_name for col in collections.collections)
        except Exception as e:
            logger.error(f"Error checking collection existence: {str(e)}")
            return False
    
    async def ensure_collection(
        self,
        collection_name: str,
        vector_size: int
    ) -> bool:
        """Ensure collection exists, create if not"""
        if not await self.collection_exists(collection_name):
            return await self.create_collection(collection_name, vector_size)
        return True
    
    async def add_vectors(
        self,
        collection_name: str,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]],
        ids: Optional[List[str]] = None
    ) -> bool:
        """Add vectors to collection"""
        try:
            if not ids:
                ids = [str(uuid.uuid4()) for _ in vectors]
            
            points = [
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload
                )
                for point_id, vector, payload in zip(ids, vectors, payloads)
            ]
            
            await self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            
            logger.info(f"Added {len(points)} vectors to {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to add vectors to {collection_name}: {str(e)}")
            return False
    
    async def search_vectors(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 10,
        score_threshold: Optional[float] = None,
        filter_conditions: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        try:
            search_filter = None
            if filter_conditions:
                conditions = []
                for key, value in filter_conditions.items():
                    conditions.append(
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                    )
                search_filter = Filter(must=conditions)
            
            results = await self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=search_filter,
                with_payload=True
            )
            
            return [
                {
                    "id": result.id,
                    "score": result.score,
                    "payload": result.payload
                }
                for result in results
            ]
        except Exception as e:
            logger.error(f"Search error in {collection_name}: {str(e)}")
            return []
    
    async def delete_vectors(
        self,
        collection_name: str,
        ids: List[str]
    ) -> bool:
        """Delete vectors by IDs"""
        try:
            await self.client.delete(
                collection_name=collection_name,
                points_selector=ids
            )
            logger.info(f"Deleted {len(ids)} vectors from {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete vectors from {collection_name}: {str(e)}")
            return False
    
    async def update_vector_payload(
        self,
        collection_name: str,
        point_id: str,
        payload: Dict[str, Any]
    ) -> bool:
        """Update payload for a specific vector"""
        try:
            await self.client.set_payload(
                collection_name=collection_name,
                payload=payload,
                points=[point_id]
            )
            return True
        except Exception as e:
            logger.error(f"Failed to update payload for {point_id}: {str(e)}")
            return False
    
    async def get_collection_info(self, collection_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a collection"""
        try:
            info = await self.client.get_collection(collection_name)
            return {
                "name": collection_name,
                "vectors_count": info.vectors_count,
                "indexed_vectors_count": info.indexed_vectors_count,
                "points_count": info.points_count,
                "segments_count": info.segments_count,
                "config": {
                    "vector_size": info.config.params.vectors.size,
                    "distance": info.config.params.vectors.distance.name
                }
            }
        except Exception as e:
            logger.error(f"Failed to get collection info for {collection_name}: {str(e)}")
            return None
    
    async def list_collections(self) -> List[str]:
        """List all collections"""
        try:
            collections = await self.client.get_collections()
            return [col.name for col in collections.collections]
        except Exception as e:
            logger.error(f"Failed to list collections: {str(e)}")
            return []
    
    async def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection"""
        try:
            await self.client.delete_collection(collection_name)
            logger.info(f"Collection deleted: {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete collection {collection_name}: {str(e)}")
            return False
    
    async def batch_search(
        self,
        collection_name: str,
        query_vectors: List[List[float]],
        limit: int = 10,
        score_threshold: Optional[float] = None
    ) -> List[List[Dict[str, Any]]]:
        """Perform batch search for multiple query vectors"""
        try:
            search_requests = [
                SearchRequest(
                    vector=query_vector,
                    limit=limit,
                    score_threshold=score_threshold,
                    with_payload=True
                )
                for query_vector in query_vectors
            ]
            
            results = await self.client.search_batch(
                collection_name=collection_name,
                requests=search_requests
            )
            
            return [
                [
                    {
                        "id": result.id,
                        "score": result.score,
                        "payload": result.payload
                    }
                    for result in batch_results
                ]
                for batch_results in results
            ]
        except Exception as e:
            logger.error(f"Batch search error in {collection_name}: {str(e)}")
            return []
