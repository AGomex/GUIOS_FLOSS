"""Clasificador heurístico: funciona sin clave de IA.

La recuperación de artículos sigue siendo real (OpenAlex/Crossref); solo la
decisión de pertinencia es determinista y basada en términos. Se usa cuando no
hay clave configurada o para demostraciones sin conexión a un modelo.
"""

from __future__ import annotations

import re

from .base import Classification, Classifier

GENERIC_WORDS = {
    "software",
    "system",
    "systems",
    "user",
    "users",
    "open",
    "source",
    "case",
    "study",
    "total",
    "cost",
    "time",
    "adoption",
    "implementation",
    "adopt",
}

ADOPTION_HINTS = (
    "adoption",
    "adopt",
    "implementation",
    "implement",
    "acceptance",
    "diffusion",
    "deployment",
    "migration",
)


class HeuristicClassifier(Classifier):
    name = "mock"
    model = "heuristic-v1"

    def classify(
        self,
        *,
        factor_name: str,
        factor_description: str,
        keywords: list[str],
        articles: list[dict],
    ) -> list[Classification]:
        terms = [term.lower() for term in keywords if term]
        words = {
            word
            for term in terms
            for word in re.findall(r"[a-z\-]{5,}", term)
            if word not in GENERIC_WORDS
        }
        # Si el filtro deja el conjunto vacío (p. ej. "tiempo de adopción"),
        # se usan las frases completas como respaldo.
        candidates = set(words)
        candidates.update(term for term in terms if len(term) >= 6)

        results = []
        for article in articles:
            title = (article.get("title") or "").lower()
            text = f"{title} {article.get('abstract') or ''}".lower()

            title_hits = [item for item in candidates if item in title]
            text_hits = [item for item in candidates if item in text]
            adoption_hit = any(hint in text for hint in ADOPTION_HINTS)

            relevant = (
                bool(title_hits) or (adoption_hit and len(text_hits) >= 1) or len(text_hits) >= 2
            )

            if title_hits:
                reason = (
                    f"El título menciona {', '.join(sorted(title_hits)[:3])}; "
                    "es un estudio directamente relacionado con el factor."
                )
            elif relevant:
                reason = (
                    f"El resumen aborda {', '.join(sorted(text_hits)[:3])} "
                    "en un contexto de adopción o implantación de software."
                )
            else:
                reason = (
                    "El artículo no aborda el factor de forma sustantiva en el "
                    "título ni en el resumen."
                )

            score = 0.4 + 0.2 * len(title_hits) + 0.1 * len(text_hits)
            results.append(
                Classification(
                    relevant=relevant,
                    reason=reason,
                    confidence=round(min(1.0, score), 2) if relevant else 0.1,
                )
            )
        return results
