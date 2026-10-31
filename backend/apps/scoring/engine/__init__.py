"""Motor de cálculo GUIOS. Funciones puras, sin dependencias de Django."""

from .core import (
    CalculationError,
    FactorInput,
    calculate_factor,
    classify_foda,
    evaluate,
    factor_mean,
    global_score,
    importance,
    is_relevant,
    recommend,
    round2,
    summarize_swot,
)

__all__ = [
    "CalculationError",
    "FactorInput",
    "calculate_factor",
    "classify_foda",
    "evaluate",
    "factor_mean",
    "global_score",
    "importance",
    "is_relevant",
    "recommend",
    "round2",
    "summarize_swot",
]
