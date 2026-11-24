"""Clasificador basado en Google Gemini."""

from __future__ import annotations

import threading
import time

import httpx

from .base import Classification, Classifier, ClassifierError, parse_results
from .prompt import SYSTEM_PROMPT, build_prompt

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
RETRY_STATUSES = {429, 503}
RETRY_DELAYS = (2, 10, 30)
MAX_RETRY_WAIT = 60.0
SUGGESTED_MODELS = "gemini-3.5-flash-lite o gemini-3.8-flash"


class GeminiClassifier(Classifier):
    name = "gemini"

    # Estado compartido entre instancias e hilos para espaciar las peticiones.
    _throttle_lock = threading.Lock()
    _last_request = 0.0

    def __init__(
        self,
        *,
        model: str,
        api_key: str,
        timeout: float = 90,
        min_interval: float = 0,
    ):
        self.model = model
        self.api_key = api_key
        self.timeout = timeout
        self.min_interval = max(0.0, min_interval)

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
        """Envía la petición, espacia las llamadas y reintenta si hace falta."""
        url = GEMINI_URL.format(model=self.model)
        attempts = len(RETRY_DELAYS) + 1

        for attempt in range(attempts):
            self._throttle()
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

            if response.status_code == 429 and self._daily_quota_exceeded(response):
                raise ClassifierError(
                    "Se agotó el cupo diario gratuito de Gemini. Se renueva a medianoche "
                    "del Pacífico; mientras tanto puedes usar el modo heurístico o activar "
                    "la facturación."
                )
            if response.status_code in RETRY_STATUSES and attempt < attempts - 1:
                delay = RETRY_DELAYS[attempt]
                if response.status_code == 429:
                    delay = self._retry_delay(response, delay)
                time.sleep(min(delay, MAX_RETRY_WAIT))
                continue
            if response.status_code >= 400:
                raise ClassifierError(self._error_message(response))
            return response

        raise ClassifierError("Gemini no respondió correctamente.")

    def _throttle(self) -> None:
        """Espera lo necesario para no superar las peticiones por minuto."""
        if self.min_interval <= 0:
            return
        with GeminiClassifier._throttle_lock:
            elapsed = time.monotonic() - GeminiClassifier._last_request
            if elapsed < self.min_interval:
                time.sleep(self.min_interval - elapsed)
            GeminiClassifier._last_request = time.monotonic()

    @staticmethod
    def _retry_delay(response: httpx.Response, default: float) -> float:
        """Lee el retryDelay que sugiere Google cuando limita las peticiones."""
        try:
            details = response.json().get("error", {}).get("details", [])
        except ValueError:
            return default
        for item in details:
            if not isinstance(item, dict):
                continue
            value = item.get("retryDelay")
            if isinstance(value, str) and value.endswith("s"):
                try:
                    return max(1.0, float(value[:-1]))
                except ValueError:
                    continue
        return default

    @staticmethod
    def _daily_quota_exceeded(response: httpx.Response) -> bool:
        """Distingue el cupo diario del límite de peticiones por minuto."""
        try:
            error = response.json().get("error", {})
        except ValueError:
            return False
        for item in error.get("details", []) or []:
            if not isinstance(item, dict):
                continue
            for violation in item.get("violations", []) or []:
                quota = str(violation.get("quotaId", ""))
                if "PerDay" in quota or "per_day" in quota.lower():
                    return True
        message = str(error.get("message", "")).lower()
        return "per day" in message or "daily" in message

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
            return (
                "Gemini sigue limitando las solicitudes por minuto. "
                "Espera un minuto y vuelve a intentarlo."
            )
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
