"""Siembra proveedores y softwares de prueba desde data/software.json."""

import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.software.models import Provider, Software

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "software.json"


class Command(BaseCommand):
    help = "Siembra proveedores y softwares de prueba (idempotente)."

    def handle(self, *args, **options):
        payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))

        with transaction.atomic():
            providers = {}
            for item in payload["providers"]:
                provider, _ = Provider.objects.update_or_create(
                    name=item["name"],
                    defaults={
                        "description": item.get("description", ""),
                        "website": item.get("website", ""),
                        "is_active": True,
                    },
                )
                providers[item["name"]] = provider

            softwares = 0
            for item in payload["softwares"]:
                Software.objects.update_or_create(
                    name=item["name"],
                    version=item["version"],
                    provider=providers[item["provider"]],
                    defaults={
                        "license_type": item.get("license_type", Software.LicenseType.FREE),
                        "category": item.get("category", ""),
                        "description": item.get("description", ""),
                        "website": item.get("website", ""),
                        "is_active": True,
                    },
                )
                softwares += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Proveedores y softwares sembrados: {len(providers)} proveedores, "
                f"{softwares} softwares."
            )
        )
