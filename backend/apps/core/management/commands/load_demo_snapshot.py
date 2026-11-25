"""Carga el snapshot de demostración en una base de datos vacía."""

from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from apps.catalog.models import Dimension, Factor, Subfactor
from apps.evaluation.models import Evaluation
from apps.literature.models import LiteratureRun
from apps.software.models import Provider, Software

FIXTURE = Path(settings.BASE_DIR) / "data" / "demo_snapshot.json.gz"

BUSINESS_MODELS = (
    Dimension,
    Factor,
    Subfactor,
    Provider,
    Software,
    LiteratureRun,
    Evaluation,
)


class Command(BaseCommand):
    help = (
        "Carga data/demo_snapshot.json.gz si la base no tiene datos de negocio. "
        "En redespliegues no duplica nada."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Carga el snapshot aunque ya existan datos (puede duplicar).",
        )

    def handle(self, *args, **options):
        if not FIXTURE.exists():
            raise CommandError(f"No se encontró el snapshot en {FIXTURE}.")

        existing = self._counts()
        if any(existing.values()) and not options["force"]:
            self.stdout.write(
                self.style.WARNING(
                    "La base ya tiene datos; no se carga el snapshot de demostración."
                )
            )
            self._print_counts(existing)
            return

        with transaction.atomic():
            call_command("loaddata", str(FIXTURE), verbosity=0)
            self._reset_sequences()

        self.stdout.write(self.style.SUCCESS("Snapshot de demostración cargado correctamente."))
        self._print_counts(self._counts())

    def _counts(self) -> dict[str, int]:
        return {model._meta.label: model.objects.count() for model in BUSINESS_MODELS}

    def _print_counts(self, counts: dict[str, int]) -> None:
        for label, total in counts.items():
            self.stdout.write(f"  {label:28} {total:>6}")

    def _reset_sequences(self) -> None:
        """Sincroniza las secuencias de PostgreSQL con los PK cargados."""
        if connection.vendor != "postgresql":
            return
        statements = connection.ops.sequence_reset_sql(self.style, BUSINESS_MODELS)
        with connection.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)
        self.stdout.write(f"Secuencias reiniciadas: {len(statements)}.")
