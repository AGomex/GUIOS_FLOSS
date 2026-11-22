"""Vistas de la actualización de literatura."""

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import api_error

from . import services
from .models import LiteratureRun
from .serializers import (
    FactorSearchDetailSerializer,
    FactorSearchSerializer,
    LiteratureRunDetailSerializer,
    LiteratureRunSerializer,
    RunCreateSerializer,
)


class LiteratureConfigView(APIView):
    """Configuración vigente del proveedor y del rango de años."""

    def get(self, request):
        return Response(services.config_payload())


class LiteratureRunViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Corridas de búsqueda con IA."""

    queryset = LiteratureRun.objects.prefetch_related("searches").all()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return LiteratureRunDetailSerializer
        return LiteratureRunSerializer

    def create(self, request, *args, **kwargs):
        serializer = RunCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            run = services.create_run(**serializer.validated_data)
        except services.LiteratureError as exc:
            return api_error(str(exc), "invalid", status.HTTP_400_BAD_REQUEST)

        services.start_run(run.id)
        return Response(
            LiteratureRunDetailSerializer(run).data,
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=True, methods=["get"], url_path="factors")
    def factors(self, request, pk=None):
        run = self.get_object()
        return Response(FactorSearchSerializer(run.searches.all(), many=True).data)

    @action(
        detail=True,
        methods=["get"],
        url_path=r"factors/(?P<code>[^/.]+)",
    )
    def factor_detail(self, request, pk=None, code=None):
        run = self.get_object()
        search = get_object_or_404(
            run.searches.select_related("factor").prefetch_related("articles"),
            factor__code=code,
        )
        return Response(FactorSearchDetailSerializer(search).data)
