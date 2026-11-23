"""Clasificador basado en Google Gemini."""

from __future__ import annotations

import time

import httpx

from .base import Classification, Classifier, ClassifierError, parse_results
from .prompt import SYSTEM_PROMPT, build_prompt

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
RETRY_STATUSES = {429, 503}
RETRY_DELAYS = (2, 5)
SUGGESTED_MODELS = "gemini-3.5-flash-lite o gemini-3.8-flash"


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

        response = self._post(payload)

        try:
            content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, ValueError) as exc:
            raise ClassifierError("Gemini devolvió una respuesta inesperada.") from exc

        return parse_results(content, len(articles))

    def _post(self, payload: dict) -> httpx.Response:
        """Envía la petición y reintenta ante saturación o límite de cuota."""
        url = GEMINI_URL.format(model=self.model)
        attempts = len(RETRY_DELAYS) + 1

        for attempt in range(attempts):
            try:
                response = httpx.post(
                    url,
                    headers={"x-goog-api-key": self.api_key},
                    json=payload,
                    timeout=self.timeout,
                )
            except httpx.TimeoutException as exc:
                if attempt < attempts - 1:
                    time.sleep(RETRY_DELAYS[attempt])
                    continue
                raise ClassifierError(
                    "Gemini tardó demasiado en responder. Vuelve a intentarlo en unos minutos."
                ) from exc
            except httpx.HTTPError as exc:
                raise ClassifierError(
                    "No se pudo conectar con Gemini. Revisa la conexión a internet."
                ) from exc

            if response.status_code in RETRY_STATUSES and attempt < attempts - 1:
                time.sleep(RETRY_DELAYS[attempt])
                continue
            if response.status_code >= 400:
                raise ClassifierError(self._error_message(response))
            return response

        raise ClassifierError("Gemini no respondió correctamente.")

    def _error_message(self, response: httpx.Response) -> str:
        """Traduce el error de Google sin exponer la clave ni la URL."""
        status = response.status_code
        detail = ""
        reason = ""
        try:
            error = response.json().get("error", {})
            detail = self._sanitize(str(error.get("message", "")).strip())
            reason = str(error.get("status", "")).strip()
        except ValueError:
            pass

        lowered = detail.lower()
        if status == 404:
            return (
                f"El modelo «{self.model}» no existe o fue retirado por Google. "
                f"Configura GEMINI_MODEL con un modelo vigente: {SUGGESTED_MODELS}."
            )
        if status in {401, 403} or reason == "PERMISSION_DENIED":
            return "La clave de Gemini no es válida o no tiene permisos para este modelo."
        if "api key" in lowered and ("not valid" in lowered or "invalid" in lowered):
            return "La clave de Gemini no es válida. Revisa GEMINI_API_KEY en el archivo .env."
        if status == 429:
            return "Se agotó el límite gratuito de Gemini. Espera unos minutos antes de reintentar."
        if status in {500, 502, 503, 504}:
            return (
                "Gemini está con alta demanda en este momento. Vuelve a intentarlo en unos minutos."
            )

        message = f"Gemini respondió con error {status}"
        if detail:
            message = f"{message}: {detail}"
        return f"{message}."

    def _sanitize(self, text: str) -> str:
        """Elimina la clave del texto por si Google la incluyera en el mensaje."""
        if self.api_key and self.api_key in text:
            return text.replace(self.api_key, "***")
        return text
