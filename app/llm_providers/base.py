"""
Base class for LLM providers.
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional
from pydantic import BaseModel


class LLMMessage(BaseModel):
    """Standard message format for LLM interactions."""
    role: str  # system, user, assistant
    content: str


class LLMResponse(BaseModel):
    """Standard response format from LLM providers."""
    content: str
    usage: Optional[Dict[str, Any]] = None  # Changed to Any to handle nested objects
    model: Optional[str] = None
    finish_reason: Optional[str] = None


class BaseLLMProvider(ABC):
    """Abstract base class for all LLM providers."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.provider_name = config.get("provider", "unknown")
        self.model_name = config.get("model_name", "default")
        self.endpoint = config.get("endpoint")
        self.api_key = config.get("api_key")
        self.context_tokens = config.get("context_tokens", 4000)
    
    @abstractmethod
    async def generate(self, messages: list[LLMMessage]) -> LLMResponse:
        """Generate a single response from the LLM."""
        pass
    
    @abstractmethod
    async def stream_generate(self, messages: list[LLMMessage]) -> AsyncGenerator[str, None]:
        """Stream response tokens from the LLM."""
        pass
    
    @abstractmethod
    async def test_connection(self) -> tuple[bool, Optional[str]]:
        """Test if the provider is accessible and configured correctly."""
        pass
    
    def estimate_tokens(self, text: str) -> int:
        """Rough estimation of token count for text."""
        # Simple estimation: ~4 characters per token
        return len(text) // 4
    
    def can_handle_context(self, text: str) -> bool:
        """Check if text fits within model's context window."""
        estimated_tokens = self.estimate_tokens(text)
        return estimated_tokens <= self.context_tokens
    
    def chunk_text(self, text: str, overlap: int = 100) -> list[str]:
        """Split text into chunks that fit within context limits."""
        max_chunk_size = self.context_tokens * 4 - overlap  # Convert tokens to chars
        chunks = []
        
        start = 0
        while start < len(text):
            end = start + max_chunk_size
            
            # Try to break at a reasonable boundary (line break)
            if end < len(text):
                last_newline = text.rfind('\n', start, end)
                if last_newline > start:
                    end = last_newline
            
            chunk = text[start:end]
            chunks.append(chunk)
            
            start = end - overlap if end < len(text) else end
        
        return chunks