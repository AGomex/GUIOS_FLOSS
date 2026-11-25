"""Crea el superusuario del admin desde variables de entorno."""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Crea el superusuario del admin si DJANGO_SUPERUSER_PASSWORD está definida. "
        "Es idempotente: si el usuario ya existe, no lo modifica."
    )

    def handle(self, *args, **options):
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "")
        if not password:
            self.stdout.write("Sin DJANGO_SUPERUSER_PASSWORD: no se crea superusuario.")
            return

        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "")
        user_model = get_user_model()

        user, created = user_model.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if not created:
            self.stdout.write(f"El usuario {username} ya existe; no se modifica.")
            return

        user.set_password(password)
        user.save(update_fields=["password"])
        self.stdout.write(self.style.SUCCESS(f"Superusuario {username} creado correctamente."))
