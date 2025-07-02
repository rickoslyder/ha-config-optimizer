"""
Factory for creating LLM provider instances.
"""
from typing import Dict, Any, Optional
import logging

from app.llm_providers.base import BaseLLMProvider
from app.llm_providers.openai import OpenAIProvider
from app.models.schemas import LLMProfile
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMProviderFactory:
    """Factory for creating LLM provider instances."""
    
    @staticmethod
    def create_provider(profile: LLMProfile) -> Optional[BaseLLMProvider]:
        """Create an LLM provider from a profile configuration."""
        
        # Validate profile has required fields
        if not profile.provider:
            logger.error(f"Profile {profile.id} missing provider")
            return None
            
        if not profile.endpoint:
            logger.error(f"Profile {profile.id} missing endpoint")
            return None
        
        # Check if API key is required for this provider
        supported_providers = LLMProviderFactory.get_supported_providers()
        provider_info = supported_providers.get(profile.provider.lower())
        
        if provider_info and provider_info.get('requires_api_key', True):
            # Use environment config as fallback for missing profile values
            env_config = settings.get_llm_config(profile.provider)
            api_key = profile.api_key or env_config.get("api_key")
            
            if not api_key:
                logger.error(f"Profile {profile.id} ({profile.provider}) missing required API key")
                return None
                
            # Decrypt API key if it's encrypted
            try:
                from app.utils.crypto import decrypt_api_key, is_api_key_encrypted
                if is_api_key_encrypted(api_key):
                    api_key = decrypt_api_key(api_key)
            except Exception as e:
                logger.error(f"Failed to decrypt API key for profile {profile.id}: {e}")
                return None
        else:
            # For providers that don't require API key (like Ollama)
            env_config = settings.get_llm_config(profile.provider)
            api_key = profile.api_key or env_config.get("api_key", "")
        
        config = {
            "provider": profile.provider,
            "model_name": profile.model_name or env_config.get("model_name"),
            "endpoint": profile.endpoint or env_config.get("endpoint"),
            "api_key": api_key,
            "context_tokens": profile.context_tokens or env_config.get("context_tokens"),
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
    def create_provider_from_env(provider_name: str, role: str = "optimize") -> Optional[BaseLLMProvider]:
        """Create an LLM provider directly from environment configuration."""
        try:
            config = settings.get_llm_config(provider_name)
            config["role"] = role
            
            if provider_name.lower() == "openai":
                return OpenAIProvider(config)
            elif provider_name.lower() == "anthropic":
                # TODO: Implement AnthropicProvider
                logger.warning("Anthropic provider not yet implemented")
                return None
            elif provider_name.lower() == "groq":
                # TODO: Implement GroqProvider (OpenAI-compatible)
                logger.warning("Groq provider not yet implemented")
                return None
            elif provider_name.lower() == "ollama":
                # TODO: Implement OllamaProvider
                logger.warning("Ollama provider not yet implemented")
                return None
            else:
                logger.error(f"Unknown LLM provider: {provider_name}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to create LLM provider {provider_name} from env: {e}")
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