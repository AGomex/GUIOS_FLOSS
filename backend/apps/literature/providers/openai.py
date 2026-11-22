"""Clasificador basado en OpenAI."""

from __future__ import annotations

import httpx

from .base import Classification, Classifier, ClassifierError, parse_results
from .prompt import SYSTEM_PROMPT, build_prompt

OPENAI_URL = "https://api.openai.com/v1/chat/completions"


class OpenAIClassifier(Classifier):
    name = "openai"

    def __init__(self, *, model: str, api_key: str, timeout: float = 90):
        self.model = model
        self.api_key = api_key
        self.timeout = timeout

    def classify(
        self,
        *,
        factor_name: str,
        factor_description: str,
        keywords: list[str],
        articles: list[dict],
    ) -> list[Classification]:
        if not self.api_key:
            raise ClassifierError("Falta OPENAI_API_KEY en el archivo .env.")

        payload = {
            "model": self.model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": build_prompt(
                        factor_name=factor_name,
                        factor_description=factor_description,
                        keywords=keywords,
                        articles=articles,
                    ),
                },
            ],
        }

        try:
            response = httpx.post(
                OPENAI_URL,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ClassifierError(f"OpenAI no respondió correctamente: {exc}") from exc

        try:
            content = response.json()["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError) as exc:
            raise ClassifierError("OpenAI devolvió una respuesta inesperada.") from exc

        return parse_results(content, len(articles))
