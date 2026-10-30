"""Proveedores y softwares evaluados."""

from django.db import models

from apps.core.models import TimeStampedModel


class Provider(TimeStampedModel):
    """Empresa o comunidad que mantiene un software."""

    name = models.CharField("nombre", max_length=120, unique=True)
    description = models.TextField("descripción", blank=True)
    website = models.URLField("sitio web", blank=True)
    is_active = models.BooleanField("activo", default=True)

    class Meta:
        verbose_name = "proveedor"
        verbose_name_plural = "proveedores"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Software(TimeStampedModel):
    """Producto de software candidato a adopción."""

    class LicenseType(models.TextChoices):
        FREE = "libre", "Libre"
        PROPRIETARY = "propietaria", "Propietaria"
        SUBSCRIPTION = "suscripcion", "Suscripción"
        OTHER = "otra", "Otra"

    name = models.CharField("nombre", max_length=120)
    version = models.CharField("versión", max_length=40)
    provider = models.ForeignKey(
        Provider,
        on_delete=models.PROTECT,
        related_name="softwares",
        verbose_name="proveedor",
    )
    license_type = models.CharField(
        "tipo de licencia",
        max_length=20,
        choices=LicenseType.choices,
        default=LicenseType.FREE,
    )
    category = models.CharField("categoría", max_length=80, blank=True)
    description = models.TextField("descripción", blank=True)
    website = models.URLField("sitio web", blank=True)
    is_active = models.BooleanField("activo", default=True)

    class Meta:
        verbose_name = "software"
        verbose_name_plural = "softwares"
        ordering = ["name", "version"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "version", "provider"],
                name="unique_software_per_provider",
            )
        ]

    def __str__(self):
        return f"{self.name} v{self.version}"
