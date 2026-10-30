"""Vistas compartidas."""

from django.http import JsonResponse


def health(request):
    """Comprobación simple de disponibilidad del backend."""

    return JsonResponse({"status": "ok", "service": "guiospro-floss-api"})
