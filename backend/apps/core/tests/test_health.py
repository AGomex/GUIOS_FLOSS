"""Pruebas del núcleo."""

import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


def test_health_endpoint(client):
    response = client.get(reverse("health"))

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
