"""Rutas versionadas de la API."""

from django.urls import include, path

urlpatterns = [
    path("", include("apps.core.urls")),
]
