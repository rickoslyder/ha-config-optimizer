"""
Factory for creating LLM provider instances.
"""
from typing import Dict, Any, Optional
import logging

from app.llm_providers.base import BaseLLMProvider
from app.llm_providers.openai import OpenAIProvider
from app.models.schemas import LLMProfile

logger = logging.getLogger(__name__)


class LLMProviderFactory:
    """Factory for creating LLM provider instances."""
    
    @staticmethod
    def create_provider(profile: LLMProfile) -> Optional[BaseLLMProvider]:
        """Create an LLM provider from a profile configuration."""
        
        config = {
            "provider": profile.provider,
            "model_name": profile.model_name,
            "endpoint": profile.endpoint,
            "api_key": profile.api_key,
            "context_tokens": profile.context_tokens,
            "role": profile.role
        }
        
        try:
            if profile.provider.lower() == "openai":
                return OpenAIProvider(config)
            elif profile.provider.lower() == "anthropic":
                # TODO: Implement AnthropicProvider
                logger.warning("Anthropic provider not yet implemented")
                return None
            elif profile.provider.lower() == "groq":
                # TODO: Implement GroqProvider (OpenAI-compatible)
                logger.warning("Groq provider not yet implemented") 
                return None
            elif profile.provider.lower() == "ollama":
                # TODO: Implement OllamaProvider
                logger.warning("Ollama provider not yet implemented")
                return None
            else:
                logger.error(f"Unknown LLM provider: {profile.provider}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to create LLM provider {profile.provider}: {e}")
            return None
    
    @staticmethod
    def get_supported_providers() -> Dict[str, Dict[str, Any]]:
        """Get information about supported LLM providers."""
        return {
            "openai": {
                "name": "OpenAI",
                "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo-preview"],
                "requires_api_key": True,
                "default_endpoint": "https://api.openai.com/v1",
                "context_limits": {
                    "gpt-3.5-turbo": 4000,
                    "gpt-4": 8000,
                    "gpt-4-turbo-preview": 128000
                }
            },
            "anthropic": {
                "name": "Anthropic Claude",
                "models": ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"],
                "requires_api_key": True,
                "default_endpoint": "https://api.anthropic.com",
                "context_limits": {
                    "claude-3-haiku": 200000,
                    "claude-3-sonnet": 200000,
                    "claude-3-opus": 200000
                }
            },
            "groq": {
                "name": "Groq",
                "models": ["llama-3-70b", "mixtral-8x7b"],
                "requires_api_key": True,
                "default_endpoint": "https://api.groq.com/openai/v1",
                "context_limits": {
                    "llama-3-70b": 8000,
                    "mixtral-8x7b": 32000
                }
            },
            "ollama": {
                "name": "Ollama (Local)",
                "models": ["llama3", "codellama", "mistral"],
                "requires_api_key": False,
                "default_endpoint": "http://localhost:11434",
                "context_limits": {
                    "llama3": 8000,
                    "codellama": 16000,
                    "mistral": 8000
                }
            }
        }