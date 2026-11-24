"""Corridas de búsqueda, resultados por factor y artículos encontrados."""

from django.db import models

from apps.core.models import TimeStampedModel


class LiteratureRun(TimeStampedModel):
    """Una corrida de búsqueda y clasificación para los 18 factores."""

    class Status(models.TextChoices):
        PENDING = "pendiente", "Pendiente"
        RUNNING = "ejecutando", "Ejecutando"
        COMPLETED = "completada", "Completada"
        FAILED = "fallida", "Fallida"

    class Provider(models.TextChoices):
        OPENAI = "openai", "OpenAI"
        GEMINI = "gemini", "Google Gemini"
        MOCK = "mock", "Heurístico (sin IA)"

    status = models.CharField(
        "estado",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    provider = models.CharField(
        "proveedor",
        max_length=20,
        choices=Provider.choices,
        default=Provider.MOCK,
    )
    model = models.CharField("modelo", max_length=80, blank=True)
    prompt_version = models.CharField("versión del prompt", max_length=20, default="1")
    year_from = models.PositiveSmallIntegerField("año inicial", default=2020)
    year_to = models.PositiveSmallIntegerField("año final", default=2026)
    max_candidates = models.PositiveSmallIntegerField("candidatos por factor", default=25)
    factors_total = models.PositiveSmallIntegerField("factores totales", default=0)
    factors_done = models.PositiveSmallIntegerField("factores procesados", default=0)
    quartiles = models.JSONField("cuartiles", default=dict, blank=True)
    error = models.TextField("error", blank=True)
    triggered_by = models.CharField("solicitado por", max_length=120, blank=True)
    started_at = models.DateTimeField("inicio", null=True, blank=True)
    finished_at = models.DateTimeField("fin", null=True, blank=True)

    class Meta:
        verbose_name = "corrida de literatura"
        verbose_name_plural = "corridas de literatura"
        ordering = ["-created_at"]

    def __str__(self):
        return self.label

    @property
    def label(self) -> str:
        providers = {"openai": "OpenAI", "gemini": "Gemini", "mock": "Heurística"}
        provider = providers.get(self.provider, self.get_provider_display())
        base = f"IA {provider} {self.year_from}–{self.year_to}"
        stamp = self.created_at.strftime("%d/%m/%Y %H:%M") if self.created_at else ""
        return f"{base} · {stamp}" if stamp else base


class FactorSearch(TimeStampedModel):
    """Resultado de la búsqueda para un factor dentro de una corrida."""

    class Status(models.TextChoices):
        PENDING = "pendiente", "Pendiente"
        RUNNING = "ejecutando", "Ejecutando"
        COMPLETED = "completada", "Completada"
        FAILED = "fallida", "Fallida"

    run = models.ForeignKey(
        LiteratureRun,
        on_delete=models.CASCADE,
        related_name="searches",
        verbose_name="corrida",
    )
    factor = models.ForeignKey(
        "catalog.Factor",
        on_delete=models.PROTECT,
        related_name="literature_searches",
        verbose_name="factor",
    )
    query = models.TextField("cadena de búsqueda", blank=True)
    retrieved = models.PositiveIntegerField("artículos recuperados", default=0)
    relevant = models.PositiveIntegerField("artículos pertinentes", default=0)
    tc_before = models.PositiveIntegerField("TC base", default=0)
    tc_after = models.PositiveIntegerField("TC calculado", default=0)
    il_before = models.PositiveSmallIntegerField("IL base", default=1)
    il_after = models.PositiveSmallIntegerField("IL calculado", default=1)
    status = models.CharField(
        "estado",
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    error = models.TextField("error", blank=True)

    class Meta:
        verbose_name = "búsqueda por factor"
        verbose_name_plural = "búsquedas por factor"
        ordering = ["factor__dimension__order", "factor__order"]
        constraints = [
            models.UniqueConstraint(
                fields=["run", "factor"],
                name="unique_factor_per_literature_run",
            )
        ]

    def __str__(self):
        return f"{self.run_id} · {self.factor_id}"


class Article(TimeStampedModel):
    """Artículo científico encontrado y su clasificación de pertinencia."""

    factor_search = models.ForeignKey(
        FactorSearch,
        on_delete=models.CASCADE,
        related_name="articles",
        verbose_name="búsqueda",
    )
    external_id = models.CharField("identificador externo", max_length=160, blank=True)
    doi = models.CharField("DOI", max_length=200, blank=True)
    title = models.TextField("título")
    year = models.PositiveSmallIntegerField("año", null=True, blank=True)
    venue = models.CharField("revista", max_length=255, blank=True)
    authors = models.CharField("autores", max_length=255, blank=True)
    url = models.URLField("enlace", max_length=500, blank=True)
    is_relevant = models.BooleanField("pertinente", default=False)
    reason = models.TextField("motivo", blank=True)
    confidence = models.FloatField("confianza", default=0)
    order = models.PositiveSmallIntegerField("orden", default=0)

    class Meta:
        verbose_name = "artículo"
        verbose_name_plural = "artículos"
        ordering = ["order", "id"]

    def __str__(self):
        return self.title[:90]
