from __future__ import annotations

import httpx
from openai import OpenAI

from dataclasses import dataclass

from config import Settings


@dataclass(frozen=True)
class ChatResult:
    content: str
    reasoning: str


class ChatClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._openai: OpenAI | None = None
        if settings.llm_provider == "qwen":
            if not settings.qwen_api_key:
                raise RuntimeError("QWEN_API_KEY is required when LLM_PROVIDER=qwen")
            self._openai = OpenAI(
                base_url=settings.qwen_base_url,
                api_key=settings.qwen_api_key,
            )
        elif settings.use_openai:
            self._openai = OpenAI(
                base_url=settings.openai_base_url,
                api_key=settings.openai_api_key,
            )

    @property
    def model_name(self) -> str:
        if self.settings.llm_provider == "qwen":
            return self.settings.qwen_chat_model
        if self.settings.use_openai:
            return self.settings.openai_chat_model
        return self.settings.ollama_chat_model

    def complete(self, system_prompt: str, user_prompt: str) -> ChatResult:
        if self._openai is not None:
            return self._complete_openai(system_prompt, user_prompt)
        return self._complete_ollama(system_prompt, user_prompt)

    def _complete_openai(self, system_prompt: str, user_prompt: str) -> ChatResult:
        assert self._openai is not None
        extra_body = None
        if self.settings.llm_provider == "qwen":
            extra_body = {"reasoning_effort": "none"}
        response = self._openai.chat.completions.create(
            model=self.model_name,
            temperature=0.2,
            max_tokens=80,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                    + "\nAnswer the question directly in one or two short sentences. "
                    "Never ask for more details, never say \"if you mean\", "
                    "and never offer follow-up help. Do not describe your thinking.",
                },
                {"role": "user", "content": user_prompt},
            ],
            extra_body=extra_body,
            timeout=180,
        )
        message = response.choices[0].message
        reasoning = getattr(message, "reasoning", None) or ""
        return ChatResult(
            content=(message.content or "").strip(),
            reasoning=str(reasoning).strip(),
        )

    def _complete_ollama(self, system_prompt: str, user_prompt: str) -> ChatResult:
        url = f"{self.settings.ollama_base_url}/api/chat"
        with httpx.Client(timeout=180.0) as client:
            response = client.post(
                url,
                json={
                    "model": self.settings.ollama_chat_model,
                    "stream": False,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            response.raise_for_status()
            payload = response.json()
            message = payload.get("message") or {}
            content = message.get("content")
            if not content:
                raise RuntimeError(
                    "Ollama chat response missing content. "
                    f"Is model '{self.settings.ollama_chat_model}' pulled?"
                )
            return ChatResult(content=str(content).strip(), reasoning="")
