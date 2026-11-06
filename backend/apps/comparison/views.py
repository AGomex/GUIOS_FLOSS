"""Vistas de comparación."""

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import api_error

from . import services
from .serializers import ComparisonRequestSerializer


class ComparisonView(APIView):
    """Compara 2 o 3 evaluaciones con resultados."""

    def get(self, request):
        raw = request.query_params.get("ids", "")
        chunks = [chunk.strip() for chunk in raw.split(",") if chunk.strip()]
        try:
            identifiers = [int(chunk) for chunk in chunks]
        except ValueError:
            return api_error(
                "Los identificadores de evaluación deben ser numéricos.",
                "invalid",
                400,
            )
        return self._respond(identifiers)

    def post(self, request):
        serializer = ComparisonRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return self._respond(serializer.validated_data["evaluations"])

    def _respond(self, identifiers: list[int]):
        try:
            return Response(services.compare(identifiers))
        except services.ComparisonError as exc:
            return api_error(str(exc), "invalid", 400)
