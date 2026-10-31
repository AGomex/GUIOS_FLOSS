"""Casos de uso de evaluaciones: creación, configuración, calificación y cierre."""

from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.catalog.models import Factor, ScoringSettings
from apps.scoring.engine import FactorInput, evaluate, importance, round2

from .models import Evaluation, EvaluationFactor, EvaluationResult, EvaluationSubfactor


class EvaluationError(Exception):
    """Error de negocio de una evaluación."""


class EvaluationStateError(EvaluationError):
    """La evaluación no admite la operación en su estado actual."""


class IncompleteEvaluation(EvaluationError):
    """Faltan calificaciones para finalizar."""


def settings_payload() -> dict:
    settings = ScoringSettings.load()
    return {
        "scale_min": settings.scale_min,
        "scale_max": settings.scale_max,
        "foda_threshold": str(settings.foda_threshold),
        "relevance_min": settings.relevance_min,
    }


def snapshot_settings(evaluation: Evaluation) -> dict:
    return evaluation.config_snapshot.get("settings", settings_payload())


def json_safe(value):
    """Convierte Decimal a cadena para JSON."""
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(item) for item in value]
    return value


@transaction.atomic
def create_evaluation(*, software, evaluator, organization="", need) -> Evaluation:
    """Crea la evaluación y copia el catálogo vigente como snapshot."""
    settings = settings_payload()
    evaluation = Evaluation.objects.create(
        software=software,
        evaluator=evaluator,
        organization=organization,
        need=need,
    )

    factors = (
        Factor.objects.filter(is_active=True)
        .select_related("dimension")
        .prefetch_related("subfactors")
        .order_by("dimension__order", "order")
    )

    snapshot_factors = []
    for factor in factors:
        scope = factor.scope if factor.scope in {"interno", "externo"} else "interno"
        is_value = importance(factor.ie, factor.il)
        ir = importance(is_value, 3)
        is_relevant = ir >= settings["relevance_min"]

        evaluation_factor = EvaluationFactor.objects.create(
            evaluation=evaluation,
            factor=factor,
            code=factor.code,
            name=factor.name,
            dimension_name=factor.dimension.name,
            scope=scope,
            ns=factor.ns,
            tc=factor.tc,
            ie=factor.ie,
            il=factor.il,
            is_value=is_value,
            id_value=3,
            ir=ir,
            is_relevant=is_relevant,
            weight=ir if is_relevant else 0,
            order=factor.order,
        )

        subfactor_texts = []
        for subfactor in factor.subfactors.filter(is_active=True):
            EvaluationSubfactor.objects.create(
                evaluation_factor=evaluation_factor,
                subfactor=subfactor,
                code=subfactor.code,
                text=subfactor.text,
                order=subfactor.order,
            )
            subfactor_texts.append({"code": subfactor.code, "text": subfactor.text})

        snapshot_factors.append(
            {
                "code": factor.code,
                "name": factor.name,
                "dimension": factor.dimension.name,
                "scope": scope,
                "ie": factor.ie,
                "il": factor.il,
                "is_value": is_value,
                "tc": factor.tc,
                "subfactors": subfactor_texts,
            }
        )

    evaluation.config_snapshot = {
        "settings": settings,
        "factors": snapshot_factors,
        "captured_at": timezone.now().isoformat(),
    }
    evaluation.save(update_fields=["config_snapshot", "updated_at"])
    return evaluation


def build_inputs(evaluation: Evaluation) -> list[FactorInput]:
    factors = evaluation.factors.prefetch_related("subfactors")
    return [
        FactorInput(
            code=factor.code,
            name=factor.name,
            dimension=factor.dimension_name,
            scope=factor.scope,
            ie=factor.ie,
            il=factor.il,
            id_value=factor.id_value,
            scores=[
                subfactor.ps for subfactor in factor.subfactors.all() if subfactor.ps is not None
            ],
        )
        for factor in factors
    ]


def compute(evaluation: Evaluation) -> dict:
    return evaluate(build_inputs(evaluation), snapshot_settings(evaluation))


def preview(evaluation: Evaluation) -> dict:
    return json_safe(compute(evaluation))


@transaction.atomic
def apply_config(evaluation: Evaluation, items: list[dict]) -> None:
    if evaluation.status == Evaluation.Status.FINISHED:
        raise EvaluationStateError("La evaluación está finalizada.")

    settings = snapshot_settings(evaluation)
    factors = {factor.id: factor for factor in evaluation.factors.all()}

    for item in items:
        factor = factors.get(item.get("factor"))
        if factor is None:
            raise EvaluationError(f"El factor {item.get('factor')} no pertenece a la evaluación.")

        scope = item.get("scope")
        if scope is not None and scope not in {"interno", "externo"}:
            raise EvaluationError("El alcance debe ser 'interno' o 'externo'.")

        if scope:
            factor.scope = scope
        if item.get("id_value") is not None:
            factor.id_value = int(item["id_value"])

        if factor.id_value < settings["scale_min"] or factor.id_value > settings["scale_max"]:
            raise EvaluationError("La importancia del decisor está fuera de la escala.")

        factor.is_value = importance(factor.ie, factor.il)
        factor.ir = importance(factor.is_value, factor.id_value)
        factor.is_relevant = factor.ir >= settings["relevance_min"]
        factor.weight = factor.ir if factor.is_relevant else 0
        factor.save()


@transaction.atomic
def apply_scores(evaluation: Evaluation, items: list[dict]) -> None:
    if evaluation.status == Evaluation.Status.FINISHED:
        raise EvaluationStateError("La evaluación está finalizada.")

    settings = snapshot_settings(evaluation)
    subfactors = {
        subfactor.id: subfactor
        for subfactor in EvaluationSubfactor.objects.filter(
            evaluation_factor__evaluation=evaluation
        )
    }

    for item in items:
        subfactor = subfactors.get(item.get("subfactor"))
        if subfactor is None:
            raise EvaluationError(
                f"El subfactor {item.get('subfactor')} no pertenece a la evaluación."
            )

        ps = item.get("ps")
        if ps is not None:
            ps = int(ps)
            if ps < settings["scale_min"] or ps > settings["scale_max"]:
                raise EvaluationError("La calificación está fuera de la escala.")

        subfactor.ps = ps
        subfactor.source = item.get("source", subfactor.source)
        subfactor.note = item.get("note", subfactor.note)
        subfactor.save()

    if evaluation.status == Evaluation.Status.DRAFT:
        evaluation.status = Evaluation.Status.IN_PROGRESS
        evaluation.save(update_fields=["status", "updated_at"])


@transaction.atomic
def finalize(evaluation: Evaluation) -> dict:
    if evaluation.status == Evaluation.Status.FINISHED:
        raise EvaluationStateError("La evaluación ya está finalizada.")

    result = compute(evaluation)
    missing = EvaluationSubfactor.objects.filter(
        evaluation_factor__evaluation=evaluation,
        evaluation_factor__is_relevant=True,
        ps__isnull=True,
    ).count()
    if missing:
        raise IncompleteEvaluation(f"Quedan {missing} subfactores relevantes sin calificar.")
    if result["pending"]:
        raise IncompleteEvaluation(f"Quedan {result['pending']} factores relevantes sin calificar.")
    if result["global"] is None:
        raise IncompleteEvaluation("No hay factores relevantes evaluados.")

    by_code = {item["code"]: item for item in result["factors"]}
    for factor in evaluation.factors.all():
        calculated = by_code.get(factor.code)
        if not calculated:
            continue
        factor.is_value = calculated["is_value"]
        factor.ir = calculated["ir"]
        factor.is_relevant = calculated["is_relevant"]
        factor.pm = calculated["pm"]
        factor.foda = calculated["foda"] or ""
        factor.weight = calculated["weight"]
        factor.save()

    EvaluationResult.objects.update_or_create(
        evaluation=evaluation,
        defaults={
            "global_score": result["global"],
            "percentage": result["percentage"],
            "score_5": result["score_5"],
            "strengths": len(result["swot"]["fortalezas"]),
            "opportunities": len(result["swot"]["oportunidades"]),
            "weaknesses": len(result["swot"]["debilidades"]),
            "threats": len(result["swot"]["amenazas"]),
            "recommendation": result["recommendation"]["code"],
            "justification": {
                "reasons": result["recommendation"]["reasons"],
                "swot": result["swot"],
            },
        },
    )

    evaluation.status = Evaluation.Status.FINISHED
    evaluation.save(update_fields=["status", "updated_at"])
    return json_safe(result)


def _dimension_summary(
    evaluation: Evaluation, factors: list[dict], scale_min, scale_max
) -> list[dict]:
    """Promedio ponderado por IR de los factores relevantes de cada dimensión."""
    order: list[str] = []
    for item in evaluation.config_snapshot.get("factors", []):
        name = item.get("dimension")
        if name and name not in order:
            order.append(name)
    for factor in factors:
        if factor["dimension"] not in order:
            order.append(factor["dimension"])

    summary = []
    for name in order:
        items = [
            factor
            for factor in factors
            if factor["dimension"] == name and factor["is_relevant"] and factor["pm"] is not None
        ]
        average = None
        percentage = None
        if items:
            total_weight = sum(factor["ir"] for factor in items)
            weighted = sum(Decimal(factor["pm"]) * factor["ir"] for factor in items)
            average = round2(weighted / total_weight)
            percentage = round2(
                (average - Decimal(scale_min)) / (Decimal(scale_max) - Decimal(scale_min)) * 100
            )
        summary.append(
            {
                "name": name,
                "average": format(average, "f") if average is not None else None,
                "percentage": format(percentage, "f") if percentage is not None else None,
                "factors": len(items),
            }
        )
    return summary


def results_payload(evaluation: Evaluation) -> dict:
    result = evaluation.result
    foda_labels = {
        "fortaleza": "Fortaleza",
        "oportunidad": "Oportunidad",
        "debilidad": "Debilidad",
        "amenaza": "Amenaza",
    }
    factors = [
        {
            "id": factor.id,
            "name": factor.name,
            "dimension": factor.dimension_name,
            "scope": factor.scope,
            "ir": factor.ir,
            "is_relevant": factor.is_relevant,
            "pm": format(factor.pm, "f") if factor.pm is not None else None,
            "foda": factor.foda,
            "foda_label": foda_labels.get(factor.foda, ""),
            "weight": factor.weight,
        }
        for factor in evaluation.factors.all()
    ]
    settings = evaluation.config_snapshot.get("settings", {})
    scale_min = int(settings.get("scale_min", 1))
    scale_max = int(settings.get("scale_max", 4))
    return {
        "evaluation": {
            "id": evaluation.id,
            "code": evaluation.code,
            "software": evaluation.software.name,
            "software_version": evaluation.software.version,
            "evaluator": evaluation.evaluator,
            "organization": evaluation.organization,
            "need": evaluation.need,
            "status": evaluation.status,
            "status_label": evaluation.get_status_display(),
            "finished_at": evaluation.updated_at,
        },
        "global": format(result.global_score, "f"),
        "percentage": format(result.percentage, "f"),
        "score_5": format(result.score_5, "f"),
        "scale": {
            "min": scale_min,
            "max": scale_max,
            "foda_threshold": str(settings.get("foda_threshold", "3.00")),
        },
        "recommendation": {
            "code": result.recommendation,
            "label": result.get_recommendation_display(),
            "reasons": result.justification.get("reasons", []),
        },
        "swot": result.justification.get("swot", {}),
        "counts": {
            "strengths": result.strengths,
            "opportunities": result.opportunities,
            "weaknesses": result.weaknesses,
            "threats": result.threats,
        },
        "dimensions": _dimension_summary(evaluation, factors, scale_min, scale_max),
        "factors": factors,
    }
