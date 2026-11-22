"""Rutas de la actualización de literatura."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("runs", views.LiteratureRunViewSet, basename="literature-run")

urlpatterns = [
    path("config/", views.LiteratureConfigView.as_view(), name="literature-config"),
    *router.urls,
]
