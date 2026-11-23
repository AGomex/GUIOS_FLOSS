from decimal import Decimal

from django.db import migrations


def repair_settings(apps, schema_editor):
    """Corrige configuraciones fuera de rango creadas antes de la validación."""
    ScoringSettings = apps.get_model("catalog", "ScoringSettings")

    for settings in ScoringSettings.objects.all():
        changed = False

        if settings.scale_min < 1:
            settings.scale_min = 1
            changed = True
        if settings.scale_max <= settings.scale_min:
            settings.scale_max = settings.scale_min + 1
            changed = True
        if settings.relevance_min < 1:
            settings.relevance_min = 1
            changed = True

        minimum = Decimal(settings.scale_min)
        maximum = Decimal(settings.scale_max)
        threshold = Decimal(settings.foda_threshold)
        if threshold < minimum or threshold > maximum:
            settings.foda_threshold = min(max(Decimal("3.00"), minimum), maximum)
            changed = True

        if changed:
            settings.save(
                update_fields=[
                    "scale_min",
                    "scale_max",
                    "foda_threshold",
                    "relevance_min",
                ]
            )


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0002_factor_search_chain"),
    ]

    operations = [
        migrations.RunPython(repair_settings, migrations.RunPython.noop),
    ]
