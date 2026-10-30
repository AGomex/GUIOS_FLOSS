"""Catálogo de criterios y configuración del cálculo."""

from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel

IMPORTANCE_VALIDATORS = [MinValueValidator(1), MaxValueValidator(4)]


class Dimension(TimeStampedModel):
    """Dimensión del modelo GUIOS: tecnológica, organizacional o económica."""

    code = models.SlugField("código", max_length=40, unique=True)
    name = models.CharField("nombre", max_length=80)
    description = models.TextField("descripción", blank=True)
    order = models.PositiveSmallIntegerField("orden", default=0)
    is_active = models.BooleanField("activo", default=True)

    class Meta:
        verbose_name = "dimensión"
        verbose_name_plural = "dimensiones"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Factor(TimeStampedModel):
    """Factor de evaluación con sus métricas de la Tabla 5.3."""

    class Scope(models.TextChoices):
        INTERNAL = "interno", "Interno"
        EXTERNAL = "externo", "Externo"
        BOTH = "ambos", "Ambos"

    dimension = models.ForeignKey(
        Dimension,
        on_delete=models.PROTECT,
        related_name="factors",
        verbose_name="dimensión",
    )
    code = models.SlugField("código", max_length=60, unique=True)
    name = models.CharField("nombre", max_length=120)
    description = models.TextField("descripción", blank=True)
    scope = models.CharField(
        "alcance",
        max_length=10,
        choices=Scope.choices,
        default=Scope.EXTERNAL,
    )
    ns = models.PositiveSmallIntegerField("número de subfactores", default=0)
    tc = models.PositiveIntegerField("total de citas", default=0)
    ie = models.PositiveSmallIntegerField(
        "importancia del experto", default=3, validators=IMPORTANCE_VALIDATORS
    )
    il = models.PositiveSmallIntegerField(
        "importancia de la literatura", default=3, validators=IMPORTANCE_VALIDATORS
    )
    is_value = models.PositiveSmallIntegerField(
        "importancia sugerida", default=3, validators=IMPORTANCE_VALIDATORS
    )
    order = models.PositiveSmallIntegerField("orden", default=0)
    is_active = models.BooleanField("activo", default=True)

    class Meta:
        verbose_name = "factor"
        verbose_name_plural = "factores"
        ordering = ["dimension__order", "order", "name"]

    def __str__(self):
        return self.name


class Subfactor(TimeStampedModel):
    """Criterio concreto que se califica dentro de un factor."""

    factor = models.ForeignKey(
        Factor,
        on_delete=models.CASCADE,
        related_name="subfactors",
        verbose_name="factor",
    )
    code = models.SlugField("código", max_length=80, unique=True)
    text = models.TextField("texto")
    citations = models.PositiveIntegerField("citas", default=0)
    order = models.PositiveSmallIntegerField("orden", default=0)
    is_active = models.BooleanField("activo", default=True)

    class Meta:
        verbose_name = "subfactor"
        verbose_name_plural = "subfactores"
        ordering = ["factor__order", "order"]

    def __str__(self):
        return self.text[:80]


class ScoringSettings(models.Model):
    """Configuración única del cálculo (singleton)."""

    scale_min = models.PositiveSmallIntegerField("valor mínimo", default=1)
    scale_max = models.PositiveSmallIntegerField("valor máximo", default=4)
    foda_threshold = models.DecimalField(
        "umbral FODA",
        max_digits=4,
        decimal_places=2,
        default=Decimal("3.00"),
    )
    relevance_min = models.PositiveSmallIntegerField(
        "relevancia mínima", default=2, validators=[MinValueValidator(1)]
    )
    updated_at = models.DateTimeField("fecha de actualización", auto_now=True)

    class Meta:
        verbose_name = "configuración de cálculo"
        verbose_name_plural = "configuración de cálculo"

    def __str__(self):
        return f"Escala {self.scale_min}–{self.scale_max} · umbral {self.foda_threshold}"

    def save(self, *args, **kwargs):
        # Fuerza un único registro.
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
