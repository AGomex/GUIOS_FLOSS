"""La regla de cuartiles debe reproducir la Tabla 5.3 de la tesis."""

import json
from pathlib import Path

from django.conf import settings

from apps.literature.quartiles import assign_importance, boundaries, percentile


def _catalog_factors() -> list[dict]:
    path = Path(settings.BASE_DIR) / "apps" / "catalog" / "data" / "catalog.json"
    return json.loads(path.read_text(encoding="utf-8"))["factors"]


def test_quartiles_reproduce_thesis_table():
    factors = _catalog_factors()
    ratios = [factor["tc"] / max(1, factor["ns"]) for factor in factors]

    importances, _limits = assign_importance(ratios)

    assert len(importances) == 18
    for factor, importance in zip(factors, importances, strict=True):
        assert importance == factor["il"], factor["code"]


def test_quartile_boundaries_match_verified_values():
    factors = _catalog_factors()
    ratios = [factor["tc"] / max(1, factor["ns"]) for factor in factors]

    limits = boundaries(ratios)

    assert limits["q1"] == 1.8636363636363635
    assert limits["q2"] == 3.65
    assert limits["q3"] == 4.78125


def test_percentile_handles_small_samples():
    assert percentile([], 0.5) == 0.0
    assert percentile([7.0], 0.25) == 7.0
    assert percentile([1.0, 2.0], 0.5) == 1.5


def test_assign_importance_uses_four_levels():
    values, _limits = assign_importance([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0])

    assert set(values) <= {1, 2, 3, 4}
    assert values[0] == 1
    assert values[-1] == 4
