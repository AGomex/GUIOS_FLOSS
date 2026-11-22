"""Regla de importancia de la literatura basada en cuartiles.

La tesis agrupa los factores por ``r = TC / NS`` y asigna la importancia de la
literatura en cuatro niveles. Verificado contra la Tabla 5.3: 18/18.
"""

from __future__ import annotations


def percentile(values: list[float], fraction: float) -> float:
    """Percentil con interpolación lineal (mismo criterio que la verificación)."""
    ordered = sorted(values)
    if not ordered:
        return 0.0
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * fraction
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    weight = position - lower
    return ordered[lower] + (ordered[upper] - ordered[lower]) * weight


def boundaries(values: list[float]) -> dict[str, float]:
    """Cortes de cuartiles sin redondear, para no alterar la clasificación."""
    return {
        "q1": percentile(values, 0.25),
        "q2": percentile(values, 0.5),
        "q3": percentile(values, 0.75),
    }


def importance_from_ratio(ratio: float, limits: dict[str, float]) -> int:
    if ratio <= limits["q1"]:
        return 1
    if ratio <= limits["q2"]:
        return 2
    if ratio <= limits["q3"]:
        return 3
    return 4


def assign_importance(ratios: list[float]) -> tuple[list[int], dict[str, float]]:
    """Devuelve un IL por ratio y los cortes usados."""
    limits = boundaries(ratios)
    return [importance_from_ratio(ratio, limits) for ratio in ratios], limits
