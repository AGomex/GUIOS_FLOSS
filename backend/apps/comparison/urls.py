"""Rutas de comparación."""

from django.urls import path

from .views import ComparisonView

urlpatterns = [
    path("comparisons/", ComparisonView.as_view(), name="comparison"),
]
