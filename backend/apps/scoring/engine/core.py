"""Motor de cálculo GUIOS.

Funciones puras, sin dependencias de Django. Todas las entradas son valores
simples y todas las salidas son deterministas.
"""

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

TWO_PLACES = Decimal("0.01")
VALID_SCOPES = {"interno", "externo"}
FODA_LABELS = {
    "fortaleza": "Fortaleza",
    "oportunidad": "Oportunidad",
    "debilidad": "Debilidad",
    "amenaza": "Amenaza",
}
RECOMMENDATION_LABELS = {
    "A": "Adoptar",
    "B": "Adoptar con reservas",
    "C": "Proporcionar recursos y mejorar",
}


class CalculationError(ValueError):
    """Error de negocio del motor de cálculo."""


def _decimal(value) -> Decimal:
    return value if isinstance(value, Decimal) else Decimal(str(value))


def round2(value) -> Decimal:
    """Redondeo half-up a dos decimales."""
    return _decimal(value).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def importance(first: int, second: int, minimum: int = 1, maximum: int = 4) -> int:
    """Matriz de importancia: max(min, floor((a + b) / 2))."""
    for value in (first, second):
        if value < minimum or value > maximum:
            raise CalculationError(f"El valor {value} está fuera de la escala {minimum}–{maximum}.")
    return max(minimum, min(maximum, (first + second) // 2))


def is_relevant(ir: int, relevance_min: int = 2) -> bool:
    """Un factor es relevante cuando su IR alcanza el mínimo configurado."""
    return ir >= relevance_min


def factor_mean(scores: list[int]) -> Decimal:
    """PM: media aritmética de los PS del factor."""
    if not scores:
        raise CalculationError("El factor no tiene calificaciones.")
    return round2(sum(_decimal(score) for score in scores) / len(scores))


def classify_foda(pm, scope: str, threshold=3) -> str:
    """Clasifica un factor según su PM, alcance y umbral."""
    if scope not in VALID_SCOPES:
        raise CalculationError(f"El alcance '{scope}' debe resolverse a 'interno' o 'externo'.")

    value = _decimal(pm)
    limit = _decimal(threshold)

    if scope == "interno":
        return "fortaleza" if value >= limit else "debilidad"
    return "oportunidad" if value >= limit else "amenaza"


@dataclass
class FactorInput:
    """Datos mínimos de un factor para calcularlo."""

    code: str
    name: str
    dimension: str
    scope: str
    ie: int
    il: int
    id_value: int
    scores: list[int]


def calculate_factor(factor: FactorInput, settings: dict) -> dict:
    """Calcula IS, IR, PM y FODA de un factor."""
    is_value = importance(factor.ie, factor.il)
    ir = importance(is_value, factor.id_value)
    relevant = is_relevant(ir, settings.get("relevance_min", 2))

    pm = None
    foda = None
    if relevant and factor.scores:
        pm = factor_mean(factor.scores)
        foda = classify_foda(pm, factor.scope, settings.get("foda_threshold", 3))

    return {
        "code": factor.code,
        "name": factor.name,
        "dimension": factor.dimension,
        "scope": factor.scope,
        "ie": factor.ie,
        "il": factor.il,
        "is_value": is_value,
        "id_value": factor.id_value,
        "ir": ir,
        "is_relevant": relevant,
        "pm": pm,
        "weight": ir if relevant else 0,
        "foda": foda,
        "foda_label": FODA_LABELS.get(foda or "", ""),
        "pending": relevant and not factor.scores,
    }


def recommend(factors: list[dict]) -> dict:
    """Recomendación A/B/C según Debilidad/Amenaza e IR."""
    severe = [
        factor
        for factor in factors
        if factor["is_relevant"]
        and factor["foda"] in {"debilidad", "amenaza"}
        and factor["ir"] >= 3
    ]
    moderate = [
        factor
        for factor in factors
        if factor["is_relevant"]
        and factor["foda"] in {"debilidad", "amenaza"}
        and factor["ir"] == 2
    ]

    if severe:
        code = "C"
        reasons = [
            f"{factor['name']} es {factor['foda_label']} con IR {factor['ir']}."
            for factor in severe
        ]
    elif moderate:
        code = "B"
        reasons = [
            f"{factor['name']} es {factor['foda_label']} con IR {factor['ir']}."
            for factor in moderate
        ]
    else:
        code = "A"
        reasons = ["No hay debilidades ni amenazas relevantes."]

    return {
        "code": code,
        "label": RECOMMENDATION_LABELS[code],
        "reasons": reasons,
    }


def global_score(factors: list[dict], scale_min=1, scale_max=4) -> dict:
    """Resultado global ponderado por IR, en crudo, porcentaje y escala 1–5."""
    evaluated = [factor for factor in factors if factor["is_relevant"] and factor["pm"] is not None]
    if not evaluated:
        raise CalculationError("No hay factores relevantes evaluados.")

    minimum = _decimal(scale_min)
    maximum = _decimal(scale_max)
    if maximum <= minimum:
        raise CalculationError("La escala máxima debe ser mayor que la mínima.")

    total_weight = sum(factor["ir"] for factor in evaluated)
    weighted_sum = sum(_decimal(factor["pm"]) * factor["ir"] for factor in evaluated)
    raw = weighted_sum / total_weight
    percentage = (raw - minimum) / (maximum - minimum) * 100
    score_5 = 1 + 4 * percentage / 100

    return {
        "global": round2(raw),
        "percentage": round2(percentage),
        "score_5": round2(score_5),
    }


def summarize_swot(factors: list[dict]) -> dict:
    """Agrupa los factores evaluados por categoría FODA."""
    summary = {"fortalezas": [], "oportunidades": [], "debilidades": [], "amenazas": []}
    keys = {
        "fortaleza": "fortalezas",
        "oportunidad": "oportunidades",
        "debilidad": "debilidades",
        "amenaza": "amenazas",
    }
    for factor in factors:
        key = keys.get(factor["foda"] or "")
        if key:
            summary[key].append(factor["name"])
    return summary


def evaluate(factors: list[FactorInput], settings: dict) -> dict:
    """Calcula una evaluación completa."""
    calculated = [calculate_factor(factor, settings) for factor in factors]

    result = {
        "factors": calculated,
        "swot": summarize_swot(calculated),
        "recommendation": recommend(calculated),
        "pending": sum(1 for factor in calculated if factor["pending"]),
    }

    try:
        result.update(
            global_score(
                calculated,
                settings.get("scale_min", 1),
                settings.get("scale_max", 4),
            )
        )
    except CalculationError:
        result.update({"global": None, "percentage": None, "score_5": None})

    return result
