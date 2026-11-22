"""Clasificador basado en Google Gemini."""

from __future__ import annotations

import httpx

from .base import Classification, Classifier, ClassifierError, parse_results
from .prompt import SYSTEM_PROMPT, build_prompt

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiClassifier(Classifier):
    name = "gemini"

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
            raise ClassifierError("Falta GEMINI_API_KEY en el archivo .env.")

        payload = {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": build_prompt(
                                factor_name=factor_name,
                                factor_description=factor_description,
                                keywords=keywords,
                                articles=articles,
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0,
                "responseMimeType": "application/json",
            },
        }

        try:
            response = httpx.post(
                GEMINI_URL.format(model=self.model),
                params={"key": self.api_key},
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ClassifierError(f"Gemini no respondió correctamente: {exc}") from exc

        try:
            content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, ValueError) as exc:
            raise ClassifierError("Gemini devolvió una respuesta inesperada.") from exc

        return parse_results(content, len(articles))
