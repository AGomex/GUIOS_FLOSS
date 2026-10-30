"""Rutas del catálogo."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("dimensions", views.DimensionViewSet, basename="dimension")
router.register("factors", views.FactorViewSet, basename="factor")
router.register("subfactors", views.SubfactorViewSet, basename="subfactor")

urlpatterns = [
    path("settings/", views.ScoringSettingsView.as_view(), name="scoring-settings"),
    *router.urls,
]
