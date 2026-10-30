"""Manejo uniforme de errores de la API."""

from rest_framework.views import exception_handler as drf_exception_handler


def _first_message(detail):
    if isinstance(detail, dict):
        for value in detail.values():
            message = _first_message(value)
            if message:
                return message
        return None
    if isinstance(detail, (list, tuple)):
        for value in detail:
            message = _first_message(value)
            if message:
                return message
        return None
    return str(detail)


def api_exception_handler(exc, context):
    """Envuelve los errores de DRF en un sobre estable en español."""

    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    response.data = {
        "error": {
            "code": getattr(exc, "default_code", "error"),
            "message": _first_message(response.data) or "No fue posible procesar la solicitud.",
            "detail": response.data,
        }
    }
    return response
