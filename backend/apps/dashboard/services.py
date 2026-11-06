"""Agregados para el dashboard."""

from django.db.models import Avg, Count

from apps.evaluation.models import Evaluation, EvaluationResult
from apps.scoring.engine import round2
from apps.software.models import Software


def summary() -> dict:
    """Totales, estados, recomendaciones y evaluaciones recientes."""
    status_counts = {value: 0 for value in Evaluation.Status.values}
    for row in Evaluation.objects.values("status").annotate(total=Count("id")):
        status_counts[row["status"]] = row["total"]

    recommendation_counts = {"A": 0, "B": 0, "C": 0}
    for row in EvaluationResult.objects.values("recommendation").annotate(total=Count("id")):
        recommendation_counts[row["recommendation"]] = row["total"]

    average = EvaluationResult.objects.aggregate(value=Avg("score_5"))["value"]

    recent = []
    for evaluation in Evaluation.objects.select_related("software__provider", "result").order_by(
        "-updated_at"
    )[:6]:
        result = getattr(evaluation, "result", None)
        recent.append(
            {
                "id": evaluation.id,
                "code": evaluation.code,
                "software": evaluation.software.name,
                "software_version": evaluation.software.version,
                "provider": evaluation.software.provider.name,
                "status": evaluation.status,
                "status_label": evaluation.get_status_display(),
                "score_5": format(result.score_5, "f") if result else None,
                "recommendation": result.recommendation if result else None,
                "recommendation_label": (result.get_recommendation_display() if result else None),
                "updated_at": evaluation.updated_at.isoformat(),
            }
        )

    return {
        "softwares": {
            "total": Software.objects.count(),
            "evaluated": Evaluation.objects.filter(result__isnull=False)
            .values("software")
            .distinct()
            .count(),
        },
        "evaluations": {
            "draft": status_counts["borrador"],
            "in_progress": status_counts["en_evaluacion"],
            "finished": status_counts["finalizada"],
            "reopened": status_counts["reabierta"],
            "cancelled": status_counts["cancelada"],
            "total": Evaluation.objects.count(),
        },
        "recommendations": recommendation_counts,
        "average_score": format(round2(average), "f") if average is not None else None,
        "recent": recent,
    }
