"""
Application configuration management using environment variables.
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # =============================================================================
    # LLM Provider Configuration
    # =============================================================================
    
    # OpenAI
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_base_url: str = Field(default="https://api.openai.com/v1", alias="OPENAI_BASE_URL")
    openai_model: str = Field(default="gpt-3.5-turbo", alias="OPENAI_MODEL")
    openai_max_tokens: int = Field(default=4000, alias="OPENAI_MAX_TOKENS")
    
    # Anthropic
    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_base_url: str = Field(default="https://api.anthropic.com", alias="ANTHROPIC_BASE_URL")
    anthropic_model: str = Field(default="claude-3-haiku-20240307", alias="ANTHROPIC_MODEL")
    anthropic_max_tokens: int = Field(default=200000, alias="ANTHROPIC_MAX_TOKENS")
    
    # Groq
    groq_api_key: Optional[str] = Field(default=None, alias="GROQ_API_KEY")
    groq_base_url: str = Field(default="https://api.groq.com/openai/v1", alias="GROQ_BASE_URL")
    groq_model: str = Field(default="llama-3-70b-8192", alias="GROQ_MODEL")
    groq_max_tokens: int = Field(default=8000, alias="GROQ_MAX_TOKENS")
    
    # Ollama
    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="llama3", alias="OLLAMA_MODEL")
    ollama_max_tokens: int = Field(default=8000, alias="OLLAMA_MAX_TOKENS")
    
    # =============================================================================
    # Application Configuration
    # =============================================================================
    
    environment: str = Field(default="development", alias="ENVIRONMENT")
    database_url: str = Field(default="sqlite:///./data/optimizer.db", alias="DATABASE_URL")
    config_path: str = Field(default="/config", alias="CONFIG_PATH")
    
    # =============================================================================
    # Security Configuration
    # =============================================================================
    
    secret_key: str = Field(default="change-this-secret-key-in-production", alias="SECRET_KEY")
    encrypt_api_keys: bool = Field(default=True, alias="ENCRYPT_API_KEYS")
    
    # =============================================================================
    # Application Settings
    # =============================================================================
    
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    max_scan_duration: int = Field(default=600, alias="MAX_SCAN_DURATION")
    max_concurrent_scans: int = Field(default=3, alias="MAX_CONCURRENT_SCANS")
    llm_request_timeout: int = Field(default=60, alias="LLM_REQUEST_TIMEOUT")
    
    # =============================================================================
    # Feature Flags
    # =============================================================================
    
    enable_automation_suggestions: bool = Field(default=True, alias="ENABLE_AUTOMATION_SUGGESTIONS")
    enable_scheduled_scans: bool = Field(default=True, alias="ENABLE_SCHEDULED_SCANS")
    enable_advanced_chunking: bool = Field(default=True, alias="ENABLE_ADVANCED_CHUNKING")
    enable_experimental_features: bool = Field(default=False, alias="ENABLE_EXPERIMENTAL_FEATURES")
    
    # =============================================================================
    # Development Settings
    # =============================================================================
    
    debug: bool = Field(default=False, alias="DEBUG")
    log_api_requests: bool = Field(default=False, alias="LOG_API_REQUESTS")
    use_mock_llm: bool = Field(default=False, alias="USE_MOCK_LLM")
    test_mode: bool = Field(default=False, alias="TEST_MODE")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    def get_llm_config(self, provider: str) -> dict:
        """Get LLM configuration for a specific provider."""
        provider_lower = provider.lower()
        
        if provider_lower == "openai":
            return {
                "provider": "openai",
                "api_key": self.openai_api_key,
                "endpoint": self.openai_base_url,
                "model_name": self.openai_model,
                "context_tokens": self.openai_max_tokens
            }
        elif provider_lower == "anthropic":
            return {
                "provider": "anthropic",
                "api_key": self.anthropic_api_key,
                "endpoint": self.anthropic_base_url,
                "model_name": self.anthropic_model,
                "context_tokens": self.anthropic_max_tokens
            }
        elif provider_lower == "groq":
            return {
                "provider": "groq",
                "api_key": self.groq_api_key,
                "endpoint": self.groq_base_url,
                "model_name": self.groq_model,
                "context_tokens": self.groq_max_tokens
            }
        elif provider_lower == "ollama":
            return {
                "provider": "ollama",
                "api_key": None,  # Ollama doesn't require API key
                "endpoint": self.ollama_base_url,
                "model_name": self.ollama_model,
                "context_tokens": self.ollama_max_tokens
            }
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")
    
    def get_available_providers(self) -> list[str]:
        """Get list of providers that have API keys configured."""
        available = []
        
        if self.openai_api_key:
            available.append("openai")
        if self.anthropic_api_key:
            available.append("anthropic")
        if self.groq_api_key:
            available.append("groq")
        
        # Ollama is always available if endpoint is configured
        if self.ollama_base_url:
            available.append("ollama")
        
        return available


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the global settings instance."""
    return settings