"""
Groq LLM provider implementation.
"""
import httpx
import json
from typing import AsyncGenerator, Optional
import logging

from .base import BaseLLMProvider, LLMMessage, LLMResponse

logger = logging.getLogger(__name__)


class GroqProvider(BaseLLMProvider):
    """Groq API provider for fast LLM inference."""
    
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get("endpoint", "https://api.groq.com/openai/v1")
        self.model = config.get("model_name", "llama-3.3-70b-versatile")
    
    async def generate(self, messages: list[LLMMessage]) -> LLMResponse:
        """Generate a single response from Groq."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                # Groq uses OpenAI-compatible format
                payload = {
                    "model": self.model,
                    "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
                    "max_tokens": min(4096, self.context_tokens // 4),
                    "temperature": 0.1,
                    "top_p": 0.95
                }
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"Groq API error: {response.status_code} - {response.text}")
                
                data = response.json()
                logger.debug(f"Groq API response: {data}")
                
                choice = data["choices"][0]
                content = choice["message"]["content"]
                
                if not content:
                    logger.warning("Groq returned empty content")
                    content = ""
                
                return LLMResponse(
                    content=content,
                    usage=data.get("usage"),
                    model=data.get("model"),
                    finish_reason=choice.get("finish_reason")
                )
                
        except Exception as e:
            logger.error(f"Groq generation error: {e}")
            raise
    
    async def stream_generate(self, messages: list[LLMMessage]) -> AsyncGenerator[str, None]:
        """Stream response tokens from Groq."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": self.model,
                    "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
                    "max_tokens": min(4096, self.context_tokens // 4),
                    "temperature": 0.1,
                    "top_p": 0.95,
                    "stream": True
                }
                
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=120.0
                ) as response:
                    
                    if response.status_code != 200:
                        raise Exception(f"Groq API error: {response.status_code}")
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]  # Remove "data: " prefix
                            
                            if data_str.strip() == "[DONE]":
                                break
                            
                            try:
                                data = json.loads(data_str)
                                choice = data["choices"][0]
                                delta = choice.get("delta", {})
                                
                                if "content" in delta:
                                    yield delta["content"]
                                    
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            logger.error(f"Groq streaming error: {e}")
            yield f"Error: {str(e)}"
    
    async def test_connection(self) -> tuple[bool, Optional[str]]:
        """Test Groq API connection."""
        try:
            test_messages = [
                LLMMessage(role="user", content="Hello, please respond with 'OK' if you can hear me.")
            ]
            
            response = await self.generate(test_messages)
            
            if response.content:
                return True, "Connection successful"
            else:
                return False, "Empty response from API"
                
        except Exception as e:
            return False, f"Connection failed: {str(e)}"
    
    async def list_models(self) -> list[str]:
        """List available Groq models."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    models = []
                    for model in data.get("data", []):
                        model_id = model.get("id")
                        if model_id:
                            models.append(model_id)
                    return models
                else:
                    # Fallback to known models if API fails
                    return self._get_known_models()
        except Exception:
            return self._get_known_models()
    
    def _get_known_models(self) -> list[str]:
        """Return known Groq models as fallback."""
        return [
            "llama-3.3-70b-versatile",
            "llama-3.1-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "gemma2-9b-it",
            "gemma-7b-it"
        ]