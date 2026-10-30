"""Vistas del catálogo."""

from rest_framework import viewsets
from rest_framework.generics import RetrieveUpdateAPIView

from .models import Dimension, Factor, ScoringSettings, Subfactor
from .serializers import (
    DimensionSerializer,
    FactorDetailSerializer,
    FactorSerializer,
    ScoringSettingsSerializer,
    SubfactorSerializer,
)


class DimensionViewSet(viewsets.ModelViewSet):
    queryset = Dimension.objects.all()
    serializer_class = DimensionSerializer
    filterset_fields = ["is_active"]
    search_fields = ["name", "code"]
    ordering_fields = ["order", "name"]


class FactorViewSet(viewsets.ModelViewSet):
    queryset = Factor.objects.select_related("dimension").prefetch_related("subfactors")
    serializer_class = FactorSerializer
    filterset_fields = ["dimension", "scope", "is_active"]
    search_fields = ["name", "code"]
    ordering_fields = ["order", "name", "ns", "tc"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return FactorDetailSerializer
        return FactorSerializer


class SubfactorViewSet(viewsets.ModelViewSet):
    queryset = Subfactor.objects.select_related("factor")
    serializer_class = SubfactorSerializer
    filterset_fields = ["factor", "factor__dimension", "is_active"]
    search_fields = ["text", "code"]
    ordering_fields = ["order", "citations"]


class ScoringSettingsView(RetrieveUpdateAPIView):
    serializer_class = ScoringSettingsSerializer

    def get_object(self):
        return ScoringSettings.load()
