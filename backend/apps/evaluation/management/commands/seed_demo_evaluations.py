"""Crea evaluaciones de demostración con perfiles A, B y C."""

import random
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Sum

from apps.catalog.models import ScoringSettings
from apps.evaluation import services
from apps.evaluation.models import Evaluation
from apps.literature.models import LiteratureRun
from apps.software.models import Software

DEMO_ORGANIZATION = "Demostración GUIOS"
DEMO_NEED = "Evaluación para demostración"
DEFAULT_SEED = 20261123

PROFILES = [
    {
        "software": ("Odoo Community", "17"),
        "profile": "alto",
        "evaluators": ["Mateo Robles", "Valeria Cedeño", "Andrés Salazar"],
    },
    {
        "software": ("Moodle", "4.4"),
        "profile": "mixto",
        "evaluators": ["Camila Torres", "Diego Mendoza", "Sofía Alvarado"],
    },
    {
        "software": ("SAP S/4HANA", "2023"),
        "profile": "bajo",
        "evaluators": ["Nicolás Paredes", "Daniela Espinoza", "Sebastián Guerrero"],
    },
]

LITERATURE_SPECS = [
    ("Base", None),
    ("Heurística", ("mock", 392)),
    ("Gemini", ("gemini", 214)),
]


def find_run(provider: str, relevant_total: int) -> LiteratureRun:
    """Busca la corrida completada más reciente con el total de pertinentes pedido."""
    run = (
        LiteratureRun.objects.filter(
            status=LiteratureRun.Status.COMPLETED,
            provider=provider,
        )
        .annotate(relevant_total=Sum("searches__relevant"))
        .filter(relevant_total=relevant_total)
        .order_by("-created_at")
        .first()
    )
    if run is None:
        raise CommandError(
            f"No hay una corrida {provider} completada con {relevant_total} "
            "artículos pertinentes. Ejecuta la búsqueda de literatura correspondiente."
        )
    return run


def generate_profile(evaluation: Evaluation, profile: str, rng: random.Random) -> tuple[dict, dict]:
    """Genera PS e ID por factor, reutilizables entre juegos de literatura."""
    scores: dict[str, dict[str, int]] = {}
    ids: dict[str, int] = {}
    factors = list(evaluation.factors.prefetch_related("subfactors").order_by("order", "name"))

    for index, factor in enumerate(factors):
        subfactors = list(factor.subfactors.all())
        if profile == "alto":
            ps_values = [rng.choice([3, 4]) for _ in subfactors]
            id_value = rng.choice([3, 4])
        elif profile == "bajo":
            ps_values = [rng.choice([1, 2]) for _ in subfactors]
            id_value = 4
        else:
            high = index % 2 == 0
            ps_values = [rng.choice([3, 4]) if high else rng.choice([1, 2]) for _ in subfactors]
            id_value = rng.choice([3, 4]) if high else 2

        scores[factor.code] = {
            subfactor.code: ps for subfactor, ps in zip(subfactors, ps_values, strict=True)
        }
        ids[factor.code] = id_value

    return scores, ids


def apply_profile(evaluation: Evaluation, scores: dict, ids: dict) -> None:
    """Aplica ID y PS a todos los factores de una evaluación."""
    factors = list(evaluation.factors.all())
    services.apply_config(
        evaluation,
        [{"factor": factor.id, "id_value": ids[factor.code]} for factor in factors],
    )

    items = []
    for factor in factors:
        for subfactor in factor.subfactors.all():
            items.append(
                {
                    "subfactor": subfactor.id,
                    "ps": scores[factor.code][subfactor.code],
                }
            )
    services.apply_scores(evaluation, items)


class Command(BaseCommand):
    help = "Crea 9 evaluaciones de demostración finalizadas (usa --reset para recrearlas)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Elimina las evaluaciones de demostración previas.",
        )
        parser.add_argument(
            "--seed",
            type=int,
            default=DEFAULT_SEED,
            help="Semilla para los valores aleatorios.",
        )

    def handle(self, *args, **options):
        with transaction.atomic():
            self._configure_settings()
            self._reset_demo(options["reset"])
            runs = self._resolve_runs()
            rng = random.Random(options["seed"])
            created = []

            for spec in PROFILES:
                software = self._software(spec["software"])
                base = self._create(software, spec["evaluators"][0], runs["Base"])
                scores, ids = generate_profile(base, spec["profile"], rng)
                apply_profile(base, scores, ids)
                services.finalize(base)
                created.append((base, "Base"))

                for (label, _), evaluator in zip(
                    LITERATURE_SPECS[1:], spec["evaluators"][1:], strict=True
                ):
                    evaluation = self._create(software, evaluator, runs[label])
                    apply_profile(evaluation, scores, ids)
                    services.finalize(evaluation)
                    created.append((evaluation, label))

            self._print_summary(created)

    def _configure_settings(self) -> None:
        settings = ScoringSettings.load()
        settings.scale_min = 1
        settings.scale_max = 4
        settings.foda_threshold = Decimal("3.00")
        settings.relevance_min = 2
        settings.full_clean()
        settings.save()
        self.stdout.write(
            f"Configuración: escala {settings.scale_min}–{settings.scale_max}, "
            f"umbral {settings.foda_threshold}, relevancia {settings.relevance_min}."
        )

    def _reset_demo(self, reset: bool) -> None:
        existing = Evaluation.objects.filter(
            organization=DEMO_ORGANIZATION,
            need=DEMO_NEED,
        )
        count = existing.count()
        if count == 0:
            return
        if not reset:
            raise CommandError(
                f"Ya existen {count} evaluaciones de demostración. "
                "Usa --reset para eliminarlas y recrearlas."
            )
        existing.delete()
        self.stdout.write(
            self.style.WARNING(f"Eliminadas {count} evaluaciones de demostración previas.")
        )

    def _resolve_runs(self) -> dict:
        runs = {"Base": None}
        for label, spec in LITERATURE_SPECS[1:]:
            provider, relevant_total = spec
            runs[label] = find_run(provider, relevant_total)
        for label in ("Heurística", "Gemini"):
            run = runs[label]
            self.stdout.write(
                f"{label}: corrida {run.id} · {run.label} ({run.relevant_total} pertinentes)."
            )
        return runs

    def _software(self, spec: tuple[str, str]) -> Software:
        name, version = spec
        software = Software.objects.filter(name=name, version=version, is_active=True).first()
        if software is None:
            raise CommandError(
                f"No se encontró el software {name} {version}. Ejecuta seed_software."
            )
        return software

    def _create(self, software: Software, evaluator: str, run) -> Evaluation:
        return services.create_evaluation(
            software=software,
            evaluator=evaluator,
            organization=DEMO_ORGANIZATION,
            need=DEMO_NEED,
            literature_run=run,
        )

    def _print_summary(self, created: list[tuple[Evaluation, str]]) -> None:
        self.stdout.write("")
        self.stdout.write(
            f"{'Código':8} {'Software':28} {'Juego':12} {'Global':>6} {'/5':>5} {'Rec.':4}"
        )
        for evaluation, label in created:
            result = evaluation.result
            self.stdout.write(
                f"{evaluation.code:8} {evaluation.software.name[:27]:28} "
                f"{label:12} {result.global_score:>6} {result.score_5:>5} "
                f"{result.recommendation:4}"
            )
        self.stdout.write(
            self.style.SUCCESS(f"\n{len(created)} evaluaciones de demostración creadas.")
        )
