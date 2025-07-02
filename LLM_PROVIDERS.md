# LLM Provider Reference Guide

*Last Updated: July 2025*

This guide provides comprehensive information about the latest LLM providers and models supported by the Home Assistant Config Optimizer. Consult this guide when implementing LLM features or updating provider configurations.

## Table of Contents
- [Provider Overview](#provider-overview)
- [OpenAI Models](#openai-models)
- [Anthropic Claude Models](#anthropic-claude-models)
- [Google Gemini Models](#google-gemini-models)
- [Meta Llama Models](#meta-llama-models)
- [Other Providers](#other-providers)
- [Model Selection Guide](#model-selection-guide)
- [Pricing Considerations](#pricing-considerations)

## Provider Overview

| Provider | Best Models | Max Context | Strengths | API Endpoint |
|----------|-------------|-------------|-----------|--------------|
| OpenAI | o4-mini, o3, GPT-4o | 128k tokens | Reasoning, coding, multimodal | api.openai.com |
| Anthropic | Claude 4 Opus/Sonnet | 200k tokens | Writing, coding, safety | api.anthropic.com |
| Google | Gemini 2.5 Pro/Flash | 1M-2M tokens | Massive context, video | generativelanguage.googleapis.com |
| Meta | Llama 4 | 10M tokens | Open source, huge context | Various |
| Groq | Mixtral, Llama variants | 32k tokens | Ultra-fast inference | api.groq.com |

## OpenAI Models

### o4-mini ⭐ (Recommended Default)
- **Model ID**: `o4-mini`
- **Context**: 128k tokens (estimated)
- **Pricing**: $0.60/1M input, $2.40/1M output
- **Strengths**: 
  - Best cost-performance ratio
  - Excellent at math, coding, and visual tasks
  - 99.5% on AIME 2025 benchmarks
  - Supports tool use and function calling
- **Use Cases**: General optimization, code analysis, automation suggestions
- **Variants**: `o4-mini-high` (higher reasoning effort)

### o3
- **Model ID**: `o3`
- **Context**: 128k tokens
- **Pricing**: Higher tier
- **Strengths**: Advanced reasoning, complex problem-solving
- **Use Cases**: Complex configuration analysis, advanced optimizations

### GPT-4o
- **Model ID**: `gpt-4o`
- **Context**: 128k tokens
- **Strengths**: Multimodal (text + images), natural conversation
- **Use Cases**: Visual configuration analysis, documentation with images

## Anthropic Claude Models

### Claude 4 Opus
- **Model ID**: `claude-opus-4`
- **Context**: 200k tokens
- **Strengths**: 
  - Superior writing and editing
  - Excellent code understanding
  - Strong safety guardrails
- **Use Cases**: Configuration documentation, complex YAML refactoring

### Claude 4 Sonnet
- **Model ID**: `claude-sonnet-4`
- **Context**: 200k tokens
- **Strengths**: Balanced performance and cost
- **Use Cases**: General optimization tasks

## Google Gemini Models

### Gemini 2.5 Pro ⭐
- **Model ID**: `gemini-2.5-pro`
- **Context**: 1M tokens
- **Pricing**: Competitive
- **Strengths**: 
  - Massive context window
  - Top benchmark performance
  - Multimodal capabilities
- **Use Cases**: Analyzing entire HA configurations at once

### Gemini 2.5 Flash
- **Model ID**: `gemini-2.5-flash`
- **Context**: 1M tokens
- **Speed**: 479 tokens/second
- **Strengths**: Fast inference, good for real-time
- **Use Cases**: Quick suggestions, real-time analysis

### Gemini 2.0 Flash
- **Model ID**: `gemini-2.0-flash`
- **Speed**: 718 tokens/second (fastest)
- **Use Cases**: Rapid iteration, development testing

## Meta Llama Models

### Llama 4
- **Model ID**: `llama-4`
- **Context**: Up to 10M tokens (largest available)
- **Strengths**: 
  - Open source
  - Massive context capability
  - Can be self-hosted
- **Use Cases**: Analyzing massive configurations, entire HA setups

### Llama 3.3
- **Model ID**: `llama-3.3-70b`
- **Context**: 128k tokens
- **Strengths**: Open source, good performance
- **Use Cases**: Self-hosted deployments

## Other Providers

### Groq
- **Models**: Mixtral-8x7b, Llama variants
- **API**: api.groq.com/openai/v1
- **Strengths**: Ultra-fast inference (10x+ faster)
- **Context**: 32k tokens
- **Use Cases**: Real-time suggestions, rapid iterations

### Ollama (Local)
- **Models**: Various open-source models
- **API**: localhost:11434
- **Strengths**: Privacy, no API costs, offline capable
- **Use Cases**: Privacy-sensitive configurations

### DeepSeek
- **Model**: DeepSeek-R1
- **Strengths**: Excellent reasoning, competitive pricing
- **Use Cases**: Complex logic analysis

## Model Selection Guide

### For Home Assistant Config Optimization:

1. **General Use** → `o4-mini`
   - Best balance of cost, performance, and capabilities
   - Handles most optimization tasks effectively

2. **Large Configurations** → `Gemini 2.5 Pro`
   - 1M token context handles entire HA setups
   - Excellent for comprehensive analysis

3. **Privacy-Sensitive** → `Ollama` with Llama models
   - Run locally, no data leaves your network
   - Good performance with modern hardware

4. **Budget-Conscious** → `o4-mini` or `Groq`
   - o4-mini: $0.60/1M tokens input
   - Groq: Fast and affordable

5. **Complex Refactoring** → `Claude 4 Opus`
   - Best for understanding complex YAML structures
   - Superior at maintaining code style

## Pricing Considerations

### Most Economical (per million tokens):
1. **Gemma 3**: $0.03
2. **Llama 3.2**: $0.03
3. **o4-mini**: $0.60 input / $2.40 output
4. **Groq Mixtral**: ~$0.27

### Best Value:
- **o4-mini**: Exceptional performance per dollar
- **Gemini 2.5 Flash**: Fast and affordable
- **Claude 4 Sonnet**: Good balance for complex tasks

### Premium Options:
- **o3**: Advanced reasoning
- **Claude 4 Opus**: Best-in-class capabilities
- **Gemini 2.5 Pro**: Massive context

## Configuration Examples

### OpenAI o4-mini (Recommended)
```json
{
  "name": "OpenAI Config Optimizer",
  "provider": "openai",
  "endpoint": "https://api.openai.com/v1",
  "model_name": "o4-mini",
  "context_tokens": 128000,
  "api_key": "your-api-key"
}
```

### Gemini 2.5 Pro (Large Configs)
```json
{
  "name": "Gemini Large Context",
  "provider": "google",
  "endpoint": "https://generativelanguage.googleapis.com/v1",
  "model_name": "gemini-2.5-pro",
  "context_tokens": 1048576,
  "api_key": "your-api-key"
}
```

### Local Ollama
```json
{
  "name": "Local Llama",
  "provider": "ollama",
  "endpoint": "http://localhost:11434",
  "model_name": "llama3.3:70b",
  "context_tokens": 128000
}
```

## Notes for Implementation

1. **Context Budgeting**: Reserve 20% of context for system prompts and responses
2. **Streaming**: All providers except some local ones support streaming
3. **Rate Limits**: Implement exponential backoff for all providers
4. **Fallbacks**: Consider implementing fallback chains (e.g., o3 → o4-mini → Groq)
5. **Caching**: Cache responses for identical configurations to reduce costs

## Future Models to Watch

- **GPT-5**: Expected late 2025
- **Claude 5**: Anticipated Q4 2025
- **Gemini 3.0**: Rumored 10M+ context
- **Llama 5**: Open source alternative

---

*This guide should be updated quarterly or when major model releases occur.*