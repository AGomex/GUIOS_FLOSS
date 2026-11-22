"""Rellena la cadena de búsqueda documentada de cada factor."""

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.catalog.models import Factor

from ...keywords import build_search_chain


class Command(BaseCommand):
    help = "Genera y guarda la cadena de búsqueda de los factores existentes."

    def handle(self, *args, **options):
        config = settings.LITERATURE
        updated = 0
        for factor in Factor.objects.all():
            factor.search_chain = build_search_chain(
                factor.code, config["year_from"], config["year_to"]
            )
            factor.save(update_fields=["search_chain", "updated_at"])
            updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Cadenas de búsqueda actualizadas: {updated} factores.")
        )
