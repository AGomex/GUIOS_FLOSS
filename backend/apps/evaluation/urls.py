"""Rutas de evaluaciones."""

from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("evaluations", views.EvaluationViewSet, basename="evaluation")

urlpatterns = router.urls
