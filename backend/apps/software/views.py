"""Vistas de proveedores y softwares."""

from rest_framework import viewsets

from .models import Provider, Software
from .serializers import ProviderSerializer, SoftwareSerializer


class ProviderViewSet(viewsets.ModelViewSet):
    queryset = Provider.objects.prefetch_related("softwares")
    serializer_class = ProviderSerializer
    filterset_fields = ["is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["name"]


class SoftwareViewSet(viewsets.ModelViewSet):
    queryset = Software.objects.select_related("provider")
    serializer_class = SoftwareSerializer
    filterset_fields = ["provider", "license_type", "category", "is_active"]
    search_fields = ["name", "version", "provider__name"]
    ordering_fields = ["name", "version"]
