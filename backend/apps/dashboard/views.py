"""Vistas del dashboard."""

from rest_framework.response import Response
from rest_framework.views import APIView

from . import services


class DashboardSummaryView(APIView):
    """Devuelve los indicadores del dashboard."""

    def get(self, request):
        return Response(services.summary())
