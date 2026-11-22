"""Casos de uso de la actualización de literatura con IA."""

from __future__ import annotations

import logging
import threading

from django.conf import settings
from django.db import close_old_connections, connection, transaction
from django.utils import timezone

from apps.catalog.models import Factor

from .keywords import build_search_chain, factor_terms, source_query
from .models import Article, FactorSearch, LiteratureRun
from .providers import get_classifier
from .providers.base import Classification, ClassifierError
from .quartiles import assign_importance
from .sources import LiteratureSourceError, search_articles

logger = logging.getLogger(__name__)

BATCH_SIZE = 20


class LiteratureError(Exception):
    """La actualización de literatura no puede ejecutarse."""


def _model_for(config: dict, provider: str) -> str:
    if provider == "openai":
        return config["openai_model"]
    if provider == "gemini":
        return config["gemini_model"]
    return "heuristic-v1"


def config_payload() -> dict:
    config = settings.LITERATURE
    provider = config["provider"]
    return {
        "provider": provider,
        "model": _model_for(config, provider),
        "prompt_version": config["prompt_version"],
        "year_from": config["year_from"],
        "year_to": config["year_to"],
        "max_candidates": config["max_candidates"],
        "providers": [
            {
                "value": "openai",
                "label": "OpenAI",
                "model": config["openai_model"],
                "configured": bool(config["openai_api_key"]),
            },
            {
                "value": "gemini",
                "label": "Google Gemini",
                "model": config["gemini_model"],
                "configured": bool(config["gemini_api_key"]),
            },
            {
                "value": "mock",
                "label": "Heurístico (sin IA)",
                "model": "heuristic-v1",
                "configured": True,
            },
        ],
    }


def create_run(
    *,
    provider: str | None = None,
    model: str = "",
    year_from: int | None = None,
    year_to: int | None = None,
    max_candidates: int | None = None,
    triggered_by: str = "",
) -> LiteratureRun:
    config = settings.LITERATURE
    provider = provider or config["provider"]

    if provider in {"openai", "gemini"} and not config[f"{provider}_api_key"]:
        raise LiteratureError(
            f"Falta la clave de {provider.upper()} en el archivo .env. "
            "Puedes usar el modo heurístico para probar sin clave."
        )

    year_from = year_from or config["year_from"]
    year_to = year_to or config["year_to"]
    if year_from > year_to:
        raise LiteratureError("El año inicial no puede ser mayor que el año final.")

    return LiteratureRun.objects.create(
        status=LiteratureRun.Status.PENDING,
        provider=provider,
        model=model or _model_for(config, provider),
        prompt_version=config["prompt_version"],
        year_from=year_from,
        year_to=year_to,
        max_candidates=max_candidates or config["max_candidates"],
        triggered_by=triggered_by,
    )


def start_run(run_id: int) -> None:
    """Ejecuta la corrida en segundo plano para no bloquear la petición."""
    thread = threading.Thread(target=_execute_safely, args=(run_id,), daemon=True)
    thread.start()


def _execute_safely(run_id: int) -> None:
    close_old_connections()
    try:
        execute_run(run_id)
    except Exception as exc:  # noqa: BLE001 - el error se guarda para la interfaz
        logger.exception("La corrida de literatura %s falló", run_id)
        LiteratureRun.objects.filter(pk=run_id).update(
            status=LiteratureRun.Status.FAILED,
            error=str(exc),
            finished_at=timezone.now(),
        )
    finally:
        connection.close()


def execute_run(run_id: int) -> None:
    run = LiteratureRun.objects.get(pk=run_id)
    run.status = LiteratureRun.Status.RUNNING
    run.started_at = timezone.now()
    run.error = ""
    run.save(update_fields=["status", "started_at", "error", "updated_at"])

    classifier = get_classifier(run.provider)
    if classifier.model and classifier.model != run.model:
        run.model = classifier.model
        run.save(update_fields=["model", "updated_at"])

    factors = list(
        Factor.objects.filter(is_active=True)
        .select_related("dimension")
        .order_by("dimension__order", "order")
    )
    run.factors_total = len(factors)
    run.factors_done = 0
    run.save(update_fields=["factors_total", "factors_done", "updated_at"])

    cache = _classification_cache(run)
    for factor in factors:
        _process_factor(run, factor, classifier, cache)
        run.factors_done += 1
        run.save(update_fields=["factors_done", "updated_at"])

    searches = list(run.searches.select_related("factor").all())
    if not any(search.relevant for search in searches):
        raise LiteratureError(
            "La búsqueda no encontró artículos pertinentes en ninguna fuente; "
            "no se generó un juego de valores IA."
        )

    ratios = [search.tc_after / max(1, search.factor.ns) for search in searches]
    importances, limits = assign_importance(ratios)
    with transaction.atomic():
        for search, value in zip(searches, importances, strict=True):
            search.il_after = value
            search.save(update_fields=["il_after", "updated_at"])
        run.quartiles = {key: round(value, 4) for key, value in limits.items()}
        run.status = LiteratureRun.Status.COMPLETED
        run.finished_at = timezone.now()
        run.save(update_fields=["quartiles", "status", "finished_at", "updated_at"])


def _process_factor(
    run: LiteratureRun,
    factor: Factor,
    classifier,
    cache: dict[int, dict[str, Classification]],
) -> None:
    chain = build_search_chain(factor.code, run.year_from, run.year_to)
    with transaction.atomic():
        search, _ = FactorSearch.objects.update_or_create(
            run=run,
            factor=factor,
            defaults={
                "query": chain,
                "tc_before": factor.tc,
                "il_before": factor.il,
                "status": FactorSearch.Status.RUNNING,
                "error": "",
            },
        )
        search.articles.all().delete()

    try:
        articles, _source = search_articles(
            source_query(factor.code),
            year_from=run.year_from,
            year_to=run.year_to,
            limit=run.max_candidates,
            timeout=settings.LITERATURE["timeout"],
            contact_email=settings.LITERATURE["contact_email"],
            semantic_scholar_key=settings.LITERATURE["semantic_scholar_key"],
        )
        unique = _dedupe(articles)[: run.max_candidates]
        classifications = _classify(factor, unique, classifier, cache)
    except (LiteratureSourceError, ClassifierError) as exc:
        FactorSearch.objects.filter(pk=search.pk).update(
            status=FactorSearch.Status.FAILED,
            error=str(exc),
        )
        raise

    rows = []
    for index, (article, classification) in enumerate(zip(unique, classifications, strict=True)):
        rows.append(
            Article(
                factor_search=search,
                external_id=article.external_id[:160],
                doi=article.doi[:200],
                title=article.title,
                year=article.year,
                venue=article.venue[:255],
                authors=article.authors[:255],
                url=article.url[:500],
                is_relevant=classification.relevant,
                reason=classification.reason,
                confidence=classification.confidence,
                order=index,
            )
        )

    with transaction.atomic():
        Article.objects.bulk_create(rows)
        search.retrieved = len(unique)
        search.relevant = sum(1 for item in classifications if item.relevant)
        search.tc_after = search.relevant
        search.status = FactorSearch.Status.COMPLETED
        search.save()


def _classify(
    factor: Factor,
    articles: list,
    classifier,
    cache: dict[int, dict[str, Classification]],
) -> list[Classification]:
    known = cache.get(factor.id, {})
    results: list[Classification | None] = [None] * len(articles)
    pending: list[tuple[int, object]] = []

    for index, article in enumerate(articles):
        cached = known.get(article.key)
        if cached is not None:
            results[index] = cached
        else:
            pending.append((index, article))

    keywords = factor_terms(factor.code)
    for start in range(0, len(pending), BATCH_SIZE):
        chunk = pending[start : start + BATCH_SIZE]
        payload = [
            {
                "title": article.title,
                "abstract": article.abstract,
                "year": article.year,
                "venue": article.venue,
            }
            for _, article in chunk
        ]
        classified = classifier.classify(
            factor_name=factor.name,
            factor_description=factor.description,
            keywords=keywords,
            articles=payload,
        )
        for (index, _), classification in zip(chunk, classified, strict=True):
            results[index] = classification

    return [item or Classification(False, "Sin clasificación.", 0.0) for item in results]


def _dedupe(articles: list) -> list:
    seen: set[str] = set()
    unique = []
    for article in articles:
        if not article.title:
            continue
        key = article.key
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(article)
    return unique


def _classification_cache(
    run: LiteratureRun,
) -> dict[int, dict[str, Classification]]:
    """Reutiliza veredictos previos con el mismo modelo y versión de prompt."""
    cache: dict[int, dict[str, Classification]] = {}
    rows = (
        Article.objects.filter(
            factor_search__run__status=LiteratureRun.Status.COMPLETED,
            factor_search__run__model=run.model,
            factor_search__run__prompt_version=run.prompt_version,
        )
        .exclude(factor_search__run=run)
        .order_by("-created_at")
        .values(
            "factor_search__factor_id",
            "doi",
            "external_id",
            "is_relevant",
            "reason",
            "confidence",
        )
    )
    for row in rows:
        key = (row["doi"] or row["external_id"] or "").strip().lower()
        if not key:
            continue
        cache.setdefault(row["factor_search__factor_id"], {}).setdefault(
            key,
            Classification(
                relevant=row["is_relevant"],
                reason=row["reason"],
                confidence=row["confidence"],
            ),
        )
    return cache
