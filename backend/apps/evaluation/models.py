"""Evaluaciones, factores aplicados y resultados."""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel
from apps.software.models import Software


class Evaluation(TimeStampedModel):
    """Proceso de evaluación de un software."""

    class Status(models.TextChoices):
        DRAFT = "borrador", "Borrador"
        IN_PROGRESS = "en_evaluacion", "En evaluación"
        FINISHED = "finalizada", "Finalizada"
        REOPENED = "reabierta", "Reabierta"
        CANCELLED = "cancelada", "Cancelada"

    code = models.CharField("código", max_length=12, unique=True, blank=True)
    software = models.ForeignKey(
        Software,
        on_delete=models.PROTECT,
        related_name="evaluations",
        verbose_name="software",
    )
    evaluator = models.CharField("evaluador", max_length=120)
    organization = models.CharField("organización", max_length=160, blank=True)
    need = models.TextField("necesidad organizacional")
    status = models.CharField(
        "estado",
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    config_snapshot = models.JSONField("snapshot de configuración", default=dict)

    class Meta:
        verbose_name = "evaluación"
        verbose_name_plural = "evaluaciones"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} · {self.software}"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self._next_code()
        super().save(*args, **kwargs)

    @classmethod
    def _next_code(cls) -> str:
        last = cls.objects.order_by("-id").values_list("id", flat=True).first() or 0
        return f"EV-{last + 1:03d}"


class EvaluationLog(TimeStampedModel):
    """Entrada de bitácora de una evaluación."""

    class Action(models.TextChoices):
        CREATED = "created", "Creación"
        CONFIGURED = "configured", "Configuración"
        SCORED = "scored", "Calificación"
        FINALIZED = "finalized", "Finalización"
        REOPENED = "reopened", "Reapertura"
        UPDATED = "updated", "Actualización"

    evaluation = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        related_name="logs",
        verbose_name="evaluación",
    )
    action = models.CharField("acción", max_length=20, choices=Action.choices)
    description = models.CharField("descripción", max_length=255, blank=True)
    reason = models.TextField("motivo", blank=True)
    actor = models.CharField("responsable", max_length=120, blank=True)

    class Meta:
        verbose_name = "entrada de bitácora"
        verbose_name_plural = "bitácora"
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.evaluation.code} · {self.get_action_display()}"


class EvaluationFactor(TimeStampedModel):
    """Copia del factor de catálogo aplicada a una evaluación."""

    evaluation = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        related_name="factors",
        verbose_name="evaluación",
    )
    factor = models.ForeignKey(
        "catalog.Factor",
        on_delete=models.PROTECT,
        related_name="evaluation_factors",
        verbose_name="factor de catálogo",
    )
    code = models.SlugField("código", max_length=60)
    name = models.CharField("nombre", max_length=120)
    dimension_name = models.CharField("dimensión", max_length=80)
    scope = models.CharField(
        "alcance",
        max_length=10,
        choices=[("interno", "Interno"), ("externo", "Externo")],
        default="interno",
    )
    ns = models.PositiveSmallIntegerField("número de subfactores", default=0)
    tc = models.PositiveIntegerField("total de citas", default=0)
    ie = models.PositiveSmallIntegerField("importancia del experto", default=3)
    il = models.PositiveSmallIntegerField("importancia de la literatura", default=3)
    is_value = models.PositiveSmallIntegerField("importancia sugerida", default=3)
    id_value = models.PositiveSmallIntegerField(
        "importancia del decisor",
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(4)],
    )
    ir = models.PositiveSmallIntegerField("importancia relativa", default=1)
    is_relevant = models.BooleanField("relevante", default=False)
    pm = models.DecimalField(
        "ponderación media",
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
    )
    foda = models.CharField("categoría FODA", max_length=12, blank=True)
    weight = models.PositiveSmallIntegerField("peso", default=0)
    order = models.PositiveSmallIntegerField("orden", default=0)

    class Meta:
        verbose_name = "factor de evaluación"
        verbose_name_plural = "factores de evaluación"
        ordering = ["order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["evaluation", "code"],
                name="unique_factor_per_evaluation",
            )
        ]

    def __str__(self):
        return f"{self.evaluation.code} · {self.name}"


class EvaluationSubfactor(TimeStampedModel):
    """Subfactor aplicado, con su calificación PS."""

    evaluation_factor = models.ForeignKey(
        EvaluationFactor,
        on_delete=models.CASCADE,
        related_name="subfactors",
        verbose_name="factor de evaluación",
    )
    subfactor = models.ForeignKey(
        "catalog.Subfactor",
        on_delete=models.PROTECT,
        related_name="evaluation_subfactors",
        verbose_name="subfactor de catálogo",
    )
    code = models.SlugField("código", max_length=80)
    text = models.TextField("texto")
    ps = models.PositiveSmallIntegerField(
        "cumplimiento",
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(4)],
    )
    source = models.CharField("fuente", max_length=120, blank=True)
    note = models.TextField("observación", blank=True)
    order = models.PositiveSmallIntegerField("orden", default=0)

    class Meta:
        verbose_name = "subfactor de evaluación"
        verbose_name_plural = "subfactores de evaluación"
        ordering = ["order"]

    def __str__(self):
        return self.text[:80]


class EvaluationResult(TimeStampedModel):
    """Resultado persistido de una evaluación finalizada."""

    class Recommendation(models.TextChoices):
        A = "A", "Adoptar"
        B = "B", "Adoptar con reservas"
        C = "C", "Proporcionar recursos y mejorar"

    evaluation = models.OneToOneField(
        Evaluation,
        on_delete=models.CASCADE,
        related_name="result",
        verbose_name="evaluación",
    )
    global_score = models.DecimalField("resultado global", max_digits=4, decimal_places=2)
    percentage = models.DecimalField("porcentaje", max_digits=5, decimal_places=2)
    score_5 = models.DecimalField("escala 1–5", max_digits=3, decimal_places=2)
    strengths = models.PositiveSmallIntegerField("fortalezas", default=0)
    opportunities = models.PositiveSmallIntegerField("oportunidades", default=0)
    weaknesses = models.PositiveSmallIntegerField("debilidades", default=0)
    threats = models.PositiveSmallIntegerField("amenazas", default=0)
    recommendation = models.CharField(
        "recomendación",
        max_length=1,
        choices=Recommendation.choices,
    )
    justification = models.JSONField("justificación", default=dict)

    class Meta:
        verbose_name = "resultado"
        verbose_name_plural = "resultados"

    def __str__(self):
        return f"{self.evaluation.code} · {self.score_5}"
