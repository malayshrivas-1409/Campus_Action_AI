"""Embedding generation service using sentence-transformers."""

import logging
from typing import List, Optional
import numpy as np

from sentence_transformers import SentenceTransformer
from app.logger import logger


class EmbeddingService:
    """Generate embeddings for text using BGE model."""

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        """
        Initialize embedding service.

        Args:
            model_name: HuggingFace model name for embeddings
        """
        self.model_name = model_name
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load the embedding model."""
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"Model loaded successfully. Embedding dimension: {self.model.get_sentence_embedding_dimension()}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise

    def get_embedding_dimension(self) -> int:
        """Get the embedding dimension."""
        if not self.model:
            raise RuntimeError("Model not loaded")
        return self.model.get_sentence_embedding_dimension()

    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            Embedding vector as list of floats
        """
        if not self.model:
            raise RuntimeError("Model not loaded")

        try:
            # Generate embedding
            embedding = self.model.encode(text, convert_to_numpy=True)
            
            # Convert to list and ensure it's float32
            embedding_list = embedding.astype(np.float32).tolist()
            
            return embedding_list
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    def embed_texts(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed
            batch_size: Batch size for encoding

        Returns:
            List of embedding vectors
        """
        if not self.model:
            raise RuntimeError("Model not loaded")

        if not texts:
            return []

        try:
            # Generate embeddings with batching for efficiency
            embeddings = self.model.encode(texts, batch_size=batch_size, convert_to_numpy=True)
            
            # Convert to list of lists
            embeddings_list = embeddings.astype(np.float32).tolist()
            
            return embeddings_list
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise

    def similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Similarity score (0-1)
        """
        try:
            arr1 = np.array(embedding1, dtype=np.float32)
            arr2 = np.array(embedding2, dtype=np.float32)
            
            # Cosine similarity
            dot_product = np.dot(arr1, arr2)
            norm1 = np.linalg.norm(arr1)
            norm2 = np.linalg.norm(arr2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            raise


# Global embedding service instance
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """Get or create global embedding service instance."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
