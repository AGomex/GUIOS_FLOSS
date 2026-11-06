"""Casos de uso de comparación de evaluaciones."""

from apps.evaluation.models import Evaluation
from apps.evaluation.services import results_payload


class ComparisonError(Exception):
    """La comparación no puede construirse con los datos recibidos."""


def _serialize(evaluation: Evaluation, data: dict) -> dict:
    swot = data.get("swot", {})
    return {
        "id": evaluation.id,
        "code": evaluation.code,
        "software": data["evaluation"]["software"],
        "software_version": data["evaluation"]["software_version"],
        "provider": evaluation.software.provider.name,
        "evaluator": evaluation.evaluator,
        "organization": evaluation.organization,
        "need": evaluation.need,
        "status": evaluation.status,
        "status_label": evaluation.get_status_display(),
        "finished_at": data["evaluation"]["finished_at"],
        "global": data["global"],
        "percentage": data["percentage"],
        "score_5": data["score_5"],
        "recommendation": data["recommendation"]["code"],
        "recommendation_label": data["recommendation"]["label"],
        "scale": data["scale"],
        "dimensions": data["dimensions"],
        "strengths": swot.get("fortalezas", [])[:3],
        "weaknesses": swot.get("debilidades", [])[:3],
    }


def compare(evaluation_ids: list[int]) -> dict:
    """Construye la comparación de 2 a 3 evaluaciones con resultados."""
    unique = list(dict.fromkeys(evaluation_ids))
    if len(unique) < 2 or len(unique) > 3:
        raise ComparisonError("Seleccione entre 2 y 3 evaluaciones para comparar.")

    evaluations = {
        evaluation.id: evaluation
        for evaluation in Evaluation.objects.filter(id__in=unique)
        .select_related("software__provider", "result")
        .prefetch_related("factors")
    }
    missing = [identifier for identifier in unique if identifier not in evaluations]
    if missing:
        raise ComparisonError("Alguna de las evaluaciones seleccionadas no existe.")

    ordered = [evaluations[identifier] for identifier in unique]
    without_result = [
        evaluation.code for evaluation in ordered if not hasattr(evaluation, "result")
    ]
    if without_result:
        raise ComparisonError(
            f"Las evaluaciones {', '.join(without_result)} todavía no tienen resultados."
        )

    payloads = [_serialize(evaluation, results_payload(evaluation)) for evaluation in ordered]

    dimensions: list[str] = []
    for payload in payloads:
        for dimension in payload["dimensions"]:
            if dimension["name"] not in dimensions:
                dimensions.append(dimension["name"])

    scales = {(payload["scale"]["min"], payload["scale"]["max"]) for payload in payloads}
    needs = {payload["need"].strip().lower() for payload in payloads}

    return {
        "need": payloads[0]["need"],
        "same_need": len(needs) == 1,
        "normalized": len(scales) > 1,
        "dimensions": dimensions,
        "evaluations": payloads,
    }
