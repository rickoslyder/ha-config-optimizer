"""
Anthropic Claude LLM provider implementation.
"""
import httpx
import json
from typing import AsyncGenerator, Optional
import logging

from .base import BaseLLMProvider, LLMMessage, LLMResponse

logger = logging.getLogger(__name__)


class AnthropicProvider(BaseLLMProvider):
    """Anthropic API provider for Claude models."""
    
    def __init__(self, config):
        super().__init__(config)
        self.base_url = config.get("endpoint", "https://api.anthropic.com/v1")
        self.model = config.get("model_name", "claude-sonnet-4")
        self.anthropic_version = "2023-06-01"  # API version
    
    async def generate(self, messages: list[LLMMessage]) -> LLMResponse:
        """Generate a single response from Anthropic Claude."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "x-api-key": self.api_key,
                    "anthropic-version": self.anthropic_version,
                    "Content-Type": "application/json"
                }
                
                # Convert messages to Anthropic format
                # Anthropic expects a system message separately and user/assistant alternating
                system_message = None
                anthropic_messages = []
                
                for msg in messages:
                    if msg.role == "system":
                        system_message = msg.content
                    else:
                        # Anthropic uses "user" and "assistant" roles only
                        role = "user" if msg.role == "user" else "assistant"
                        anthropic_messages.append({
                            "role": role,
                            "content": msg.content
                        })
                
                payload = {
                    "model": self.model,
                    "messages": anthropic_messages,
                    "max_tokens": min(4096, self.context_tokens // 4),
                    "temperature": 0.1
                }
                
                if system_message:
                    payload["system"] = system_message
                
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    raise Exception(f"Anthropic API error: {response.status_code} - {response.text}")
                
                data = response.json()
                logger.debug(f"Anthropic API response: {data}")
                
                # Extract content from the response
                content = ""
                if data.get("content"):
                    # Claude returns content as an array of blocks
                    for block in data["content"]:
                        if block["type"] == "text":
                            content += block["text"]
                
                if not content:
                    logger.warning("Anthropic returned empty content")
                    content = ""
                
                return LLMResponse(
                    content=content,
                    usage={
                        "input_tokens": data.get("usage", {}).get("input_tokens", 0),
                        "output_tokens": data.get("usage", {}).get("output_tokens", 0)
                    },
                    model=data.get("model"),
                    finish_reason=data.get("stop_reason")
                )
                
        except Exception as e:
            logger.error(f"Anthropic generation error: {e}")
            raise
    
    async def stream_generate(self, messages: list[LLMMessage]) -> AsyncGenerator[str, None]:
        """Stream response tokens from Anthropic Claude."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "x-api-key": self.api_key,
                    "anthropic-version": self.anthropic_version,
                    "Content-Type": "application/json"
                }
                
                # Convert messages to Anthropic format
                system_message = None
                anthropic_messages = []
                
                for msg in messages:
                    if msg.role == "system":
                        system_message = msg.content
                    else:
                        role = "user" if msg.role == "user" else "assistant"
                        anthropic_messages.append({
                            "role": role,
                            "content": msg.content
                        })
                
                payload = {
                    "model": self.model,
                    "messages": anthropic_messages,
                    "max_tokens": min(4096, self.context_tokens // 4),
                    "temperature": 0.1,
                    "stream": True
                }
                
                if system_message:
                    payload["system"] = system_message
                
                async with client.stream(
                    "POST",
                    f"{self.base_url}/messages",
                    headers=headers,
                    json=payload,
                    timeout=120.0
                ) as response:
                    
                    if response.status_code != 200:
                        raise Exception(f"Anthropic API error: {response.status_code}")
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]  # Remove "data: " prefix
                            
                            if data_str.strip() == "[DONE]":
                                break
                            
                            try:
                                data = json.loads(data_str)
                                
                                # Handle different event types
                                if data.get("type") == "content_block_delta":
                                    delta = data.get("delta", {})
                                    if delta.get("type") == "text_delta":
                                        yield delta.get("text", "")
                                
                            except json.JSONDecodeError:
                                continue
                                
        except Exception as e:
            logger.error(f"Anthropic streaming error: {e}")
            yield f"Error: {str(e)}"
    
    async def test_connection(self) -> tuple[bool, Optional[str]]:
        """Test Anthropic API connection."""
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
        """List available Anthropic models."""
        # Anthropic doesn't have a models endpoint, so we return known models
        return [
            "claude-opus-4",
            "claude-sonnet-4", 
            "claude-3.5-sonnet",
            "claude-3.5-haiku",
            "claude-3-opus",
            "claude-3-sonnet",
            "claude-3-haiku"
        ]