from __future__ import annotations

import re

import httpx
from openai import APIStatusError, OpenAI

from config import Settings

_THINK_BLOCK = re.compile(r"<think>.*?</think>", re.DOTALL)


def _friendly_api_error(exc: APIStatusError, *, provider: str, base_url: str) -> RuntimeError:
    body = ""
    try:
        body = exc.response.text or ""
    except Exception:  # noqa: BLE001
        body = str(exc)
    snippet = body.lstrip()[:200].lower()
    if "<!doctype html" in snippet or "<html" in snippet:
        return RuntimeError(
            f"{provider} endpoint returned HTML (HTTP {exc.status_code}) instead of JSON. "
            f"QWEN_BASE_URL / API base is probably a website origin, not an OpenAI-compatible "
            f"API. Use a URL ending in /v1 (e.g. https://host/v1). Current base: {base_url}"
        )
    detail = body.strip().replace("\n", " ")
    if len(detail) > 240:
        detail = detail[:237] + "..."
    return RuntimeError(
        f"{provider} API error HTTP {exc.status_code} at {base_url}: {detail or exc.message}"
    )


class ChatClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._openai: OpenAI | None = None
        self._api_base = ""
        self._provider_name = settings.provider_label
        if settings.llm_provider == "qwen":
            if not settings.qwen_api_key:
                raise RuntimeError("QWEN_API_KEY is required when LLM_PROVIDER=qwen")
            self._api_base = settings.qwen_base_url
            self._openai = OpenAI(
                base_url=settings.qwen_base_url,
                api_key=settings.qwen_api_key,
            )
        elif settings.use_gemini:
            if not settings.gemini_api_key:
                raise RuntimeError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini")
            self._api_base = settings.gemini_base_url
            self._openai = OpenAI(
                base_url=settings.gemini_base_url,
                api_key=settings.gemini_api_key,
            )
        elif settings.use_openai:
            self._api_base = settings.openai_base_url
            self._openai = OpenAI(
                base_url=settings.openai_base_url,
                api_key=settings.openai_api_key,
            )

    @property
    def model_name(self) -> str:
        if self.settings.llm_provider == "qwen":
            return self.settings.qwen_chat_model
        if self.settings.use_gemini:
            return self.settings.gemini_chat_model
        if self.settings.use_openai:
            return self.settings.openai_chat_model
        return self.settings.ollama_chat_model

    def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 300,
    ) -> str:
        if self._openai is not None:
            text = self._complete_openai(system_prompt, user_prompt, max_tokens)
        else:
            text = self._complete_ollama(system_prompt, user_prompt, max_tokens)
        return _THINK_BLOCK.sub("", text).strip()

    def _complete_openai(self, system_prompt: str, user_prompt: str, max_tokens: int) -> str:
        assert self._openai is not None
        extra_body = None
        if self.settings.llm_provider == "qwen":
            extra_body = {"reasoning_effort": "none"}
        try:
            response = self._openai.chat.completions.create(
                model=self.model_name,
                temperature=0.2,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                extra_body=extra_body,
                timeout=120,
            )
        except APIStatusError as exc:
            raise _friendly_api_error(
                exc, provider=self._provider_name, base_url=self._api_base
            ) from None
        return response.choices[0].message.content or ""

    def _complete_ollama(self, system_prompt: str, user_prompt: str, max_tokens: int) -> str:
        url = f"{self.settings.ollama_base_url}/api/chat"
        with httpx.Client(timeout=180.0) as client:
            response = client.post(
                url,
                json={
                    "model": self.settings.ollama_chat_model,
                    "stream": False,
                    "options": {"temperature": 0.2, "num_predict": max_tokens},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            response.raise_for_status()
            content = (response.json().get("message") or {}).get("content")
            if not content:
                raise RuntimeError(
                    "Ollama chat response missing content. "
                    f"Is model '{self.settings.ollama_chat_model}' pulled?"
                )
            return str(content)
