"""Carga el catálogo GUIOS (3 dimensiones, 18 factores, 61 subfactores)."""

import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import Dimension, Factor, ScoringSettings, Subfactor

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "catalog.json"


class Command(BaseCommand):
    help = "Siembra el catálogo de criterios desde data/catalog.json (idempotente)."

    def handle(self, *args, **options):
        payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))

        with transaction.atomic():
            dimensions = {}
            for item in payload["dimensions"]:
                dimension, _ = Dimension.objects.update_or_create(
                    code=item["code"],
                    defaults={
                        "name": item["name"],
                        "description": item.get("description", ""),
                        "order": item.get("order", 0),
                        "is_active": True,
                    },
                )
                dimensions[item["code"]] = dimension

            factor_count = 0
            subfactor_count = 0
            for item in payload["factors"]:
                factor, _ = Factor.objects.update_or_create(
                    code=item["code"],
                    defaults={
                        "dimension": dimensions[item["dimension"]],
                        "name": item["name"],
                        "description": item.get("description", ""),
                        "scope": item["scope"],
                        "ns": item["ns"],
                        "tc": item["tc"],
                        "ie": item["ie"],
                        "il": item["il"],
                        "is_value": item["is_value"],
                        "order": item.get("order", 0),
                        "is_active": True,
                    },
                )
                factor_count += 1

                for sub in item["subfactors"]:
                    Subfactor.objects.update_or_create(
                        code=sub["code"],
                        defaults={
                            "factor": factor,
                            "text": sub["text"],
                            "citations": sub.get("citations", 0),
                            "order": sub.get("order", 0),
                            "is_active": True,
                        },
                    )
                    subfactor_count += 1

            ScoringSettings.load()

        self.stdout.write(
            self.style.SUCCESS(
                f"Catálogo sembrado: {len(dimensions)} dimensiones, "
                f"{factor_count} factores, {subfactor_count} subfactores."
            )
        )
