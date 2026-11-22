"""Cobertura de los términos de búsqueda de los 18 factores."""

import json
from pathlib import Path

from django.conf import settings

from apps.literature.keywords import (
    FACTOR_TERMS,
    build_search_chain,
    factor_terms,
    source_query,
)


def _factor_codes() -> list[str]:
    path = Path(settings.BASE_DIR) / "apps" / "catalog" / "data" / "catalog.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    return [factor["code"] for factor in payload["factors"]]


def test_every_catalog_factor_has_search_terms():
    for code in _factor_codes():
        assert code in FACTOR_TERMS, code
        assert factor_terms(code), code


def test_search_chain_contains_terms_and_year_range():
    chain = build_search_chain("compatibility", 2020, 2026)

    assert '"software compatibility"' in chain
    assert '"software adoption"' in chain
    assert "from_publication_date:2020-01-01" in chain
    assert "to_publication_date:2026-12-31" in chain


def test_source_query_is_plain_text():
    query = source_query("compatibility")

    assert "compatibility" in query
    assert "OR" not in query
