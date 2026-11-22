"""Contrato común de los clasificadores de pertinencia."""

from __future__ import annotations

import json
from dataclasses import dataclass


class ClassifierError(Exception):
    """El clasificador no pudo determinar la pertinencia."""


@dataclass
class Classification:
    relevant: bool
    reason: str
    confidence: float = 0.0


class Classifier:
    """Interfaz que implementan OpenAI, Gemini y el modo heurístico."""

    name = "base"
    model = ""

    def classify(
        self,
        *,
        factor_name: str,
        factor_description: str,
        keywords: list[str],
        articles: list[dict],
    ) -> list[Classification]:
        raise NotImplementedError


def _confidence(value) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, number))


def parse_results(raw: str, count: int) -> list[Classification]:
    """Convierte la respuesta JSON del modelo en una lista alineada."""
    try:
        data = json.loads(raw)
    except (TypeError, ValueError) as exc:
        raise ClassifierError("El modelo no devolvió un JSON válido.") from exc

    if isinstance(data, dict):
        items = data.get("results") or data.get("articles") or []
    elif isinstance(data, list):
        items = data
    else:
        items = []

    by_index: dict[int, Classification] = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        try:
            index = int(item.get("index"))
        except (TypeError, ValueError):
            continue
        by_index[index] = Classification(
            relevant=bool(item.get("relevant")),
            reason=str(item.get("reason") or "").strip(),
            confidence=_confidence(item.get("confidence")),
        )

    return [
        by_index.get(
            index,
            Classification(False, "El modelo no clasificó este artículo.", 0.0),
        )
        for index in range(count)
    ]
