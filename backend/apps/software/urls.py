"""Rutas de proveedores y softwares."""

from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("providers", views.ProviderViewSet, basename="provider")
router.register("softwares", views.SoftwareViewSet, basename="software")

urlpatterns = router.urls
