"""
LLM Service for handling different language model providers
"""
import os
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
import openai
import anthropic
import logging
from enum import Enum

logger = logging.getLogger(__name__)

class LLMProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"

class LLMService:
    """Service for interacting with various LLM providers"""
    
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        self.default_provider = LLMProvider.OPENAI
        
        # Initialize clients based on available API keys
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize LLM clients based on available API keys"""
        openai_key = os.getenv("OPENAI_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        
        if openai_key:
            self.openai_client = openai.AsyncOpenAI(api_key=openai_key)
            logger.info("OpenAI client initialized")
        
        if anthropic_key:
            self.anthropic_client = anthropic.AsyncAnthropic(api_key=anthropic_key)
            self.default_provider = LLMProvider.ANTHROPIC  # Prefer Claude for coding
            logger.info("Anthropic client initialized")
        
        if not openai_key and not anthropic_key:
            logger.warning("No LLM API keys found. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY")
    
    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.1,
        provider: Optional[LLMProvider] = None
    ) -> str:
        """Generate a completion using the specified or default provider"""
        provider = provider or self.default_provider
        
        try:
            if provider == LLMProvider.ANTHROPIC and self.anthropic_client:
                return await self._generate_anthropic_completion(
                    prompt, system_prompt, max_tokens, temperature
                )
            elif provider == LLMProvider.OPENAI and self.openai_client:
                return await self._generate_openai_completion(
                    prompt, system_prompt, max_tokens, temperature
                )
            else:
                raise ValueError(f"Provider {provider} not available or not configured")
        
        except Exception as e:
            logger.error(f"LLM completion error: {str(e)}")
            raise
    
    async def _generate_anthropic_completion(
        self,
        prompt: str,
        system_prompt: Optional[str],
        max_tokens: int,
        temperature: float
    ) -> str:
        """Generate completion using Anthropic Claude"""
        messages = [{"role": "user", "content": prompt}]
        
        response = await self.anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt or "You are an expert software engineer and coding assistant.",
            messages=messages
        )
        
        return response.content[0].text
    
    async def _generate_openai_completion(
        self,
        prompt: str,
        system_prompt: Optional[str],
        max_tokens: int,
        temperature: float
    ) -> str:
        """Generate completion using OpenAI GPT"""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return response.choices[0].message.content
    
    async def generate_streaming_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.1,
        provider: Optional[LLMProvider] = None
    ) -> AsyncGenerator[str, None]:
        """Generate a streaming completion"""
        provider = provider or self.default_provider
        
        try:
            if provider == LLMProvider.ANTHROPIC and self.anthropic_client:
                async for chunk in self._generate_anthropic_streaming(
                    prompt, system_prompt, max_tokens, temperature
                ):
                    yield chunk
            elif provider == LLMProvider.OPENAI and self.openai_client:
                async for chunk in self._generate_openai_streaming(
                    prompt, system_prompt, max_tokens, temperature
                ):
                    yield chunk
            else:
                raise ValueError(f"Provider {provider} not available or not configured")
        
        except Exception as e:
            logger.error(f"Streaming completion error: {str(e)}")
            raise
    
    async def _generate_anthropic_streaming(
        self,
        prompt: str,
        system_prompt: Optional[str],
        max_tokens: int,
        temperature: float
    ) -> AsyncGenerator[str, None]:
        """Generate streaming completion using Anthropic Claude"""
        messages = [{"role": "user", "content": prompt}]
        
        async with self.anthropic_client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt or "You are an expert software engineer and coding assistant.",
            messages=messages
        ) as stream:
            async for text in stream.text_stream:
                yield text
    
    async def _generate_openai_streaming(
        self,
        prompt: str,
        system_prompt: Optional[str],
        max_tokens: int,
        temperature: float
    ) -> AsyncGenerator[str, None]:
        """Generate streaming completion using OpenAI GPT"""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        stream = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True
        )
        
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    def get_available_providers(self) -> List[LLMProvider]:
        """Get list of available LLM providers"""
        providers = []
        
        if self.openai_client:
            providers.append(LLMProvider.OPENAI)
        
        if self.anthropic_client:
            providers.append(LLMProvider.ANTHROPIC)
        
        return providers
    
    def is_provider_available(self, provider: LLMProvider) -> bool:
        """Check if a specific provider is available"""
        if provider == LLMProvider.OPENAI:
            return self.openai_client is not None
        elif provider == LLMProvider.ANTHROPIC:
            return self.anthropic_client is not None
        
        return False
