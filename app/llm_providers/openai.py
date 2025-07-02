"""
OpenAI LLM provider implementation.
"""
import httpx
import json
from typing import AsyncGenerator, Optional
import logging

from .base import BaseLLMProvider, LLMMessage, LLMResponse

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseLLMProvider):
    """OpenAI API provider for GPT models."""
    
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get("endpoint", "https://api.openai.com/v1")
        self.model = config.get("model_name", "gpt-3.5-turbo")
    
    async def generate(self, messages: list[LLMMessage]) -> LLMResponse:
        """Generate a single response from OpenAI."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": self.model,
                    "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
                    "max_tokens": min(1000, self.context_tokens // 4),
                    "temperature": 0.1
                }
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
                
                data = response.json()
                choice = data["choices"][0]
                
                return LLMResponse(
                    content=choice["message"]["content"],
                    usage=data.get("usage"),
                    model=data.get("model"),
                    finish_reason=choice.get("finish_reason")
                )
                
        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            raise
    
    async def stream_generate(self, messages: list[LLMMessage]) -> AsyncGenerator[str, None]:
        """Stream response tokens from OpenAI."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": self.model,
                    "messages": [{"role": msg.role, "content": msg.content} for msg in messages],
                    "max_tokens": min(1000, self.context_tokens // 4),
                    "temperature": 0.1,
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
                        raise Exception(f"OpenAI API error: {response.status_code}")
                    
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
            logger.error(f"OpenAI streaming error: {e}")
            yield f"Error: {str(e)}"
    
    async def test_connection(self) -> tuple[bool, Optional[str]]:
        """Test OpenAI API connection."""
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