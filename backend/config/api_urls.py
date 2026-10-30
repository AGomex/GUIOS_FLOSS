"""Rutas versionadas de la API."""

from django.urls import include, path

urlpatterns = [
    path("", include("apps.core.urls")),
    path("catalog/", include("apps.catalog.urls")),
    path("", include("apps.software.urls")),
]
