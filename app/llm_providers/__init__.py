"""
LLM Provider factory and exports.
"""
from typing import Optional
from .base import BaseLLMProvider, LLMMessage, LLMResponse
from .openai import OpenAIProvider
from .anthropic import AnthropicProvider
from .google import GoogleProvider
from .groq import GroqProvider
from .ollama import OllamaProvider


def get_llm_provider(provider_type: str, config: dict) -> Optional[BaseLLMProvider]:
    """
    Factory function to create LLM provider instances.
    
    Args:
        provider_type: Type of provider (openai, anthropic, google, groq, ollama)
        config: Provider configuration dictionary
        
    Returns:
        LLM provider instance or None if provider type not found
    """
    providers = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "google": GoogleProvider,
        "groq": GroqProvider,
        "ollama": OllamaProvider
    }
    
    provider_class = providers.get(provider_type.lower())
    if provider_class:
        return provider_class(config)
    
    return None


__all__ = [
    "BaseLLMProvider",
    "LLMMessage", 
    "LLMResponse",
    "OpenAIProvider",
    "AnthropicProvider",
    "GoogleProvider",
    "GroqProvider",
    "OllamaProvider",
    "get_llm_provider"
]