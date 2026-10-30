"""Modelos base reutilizables."""

from django.db import models


class TimeStampedModel(models.Model):
    """Agrega marcas de creación y actualización a cualquier modelo."""

    created_at = models.DateTimeField("fecha de creación", auto_now_add=True)
    updated_at = models.DateTimeField("fecha de actualización", auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]
