"""Pruebas golden del motor de cálculo GUIOS."""

from decimal import Decimal

import pytest

from apps.scoring.engine import (
    CalculationError,
    FactorInput,
    classify_foda,
    evaluate,
    factor_mean,
    global_score,
    importance,
    is_relevant,
    recommend,
)

# Tabla 5.3 de la tesis: (factor, IE, IL, IS esperado)
THESIS_ROWS = [
    ("Compatibilidad", 3, 3, 3),
    ("Fiabilidad", 3, 3, 3),
    ("Mantenibilidad", 3, 3, 3),
    ("Personalización", 3, 4, 3),
    ("Prueba", 3, 3, 3),
    ("Documentación", 3, 1, 2),
    ("Portabilidad", 3, 2, 2),
    ("Reusabilidad", 3, 2, 2),
    ("Usabilidad", 3, 2, 2),
    ("Apoyo de la alta dirección", 3, 4, 3),
    ("Formación", 3, 4, 3),
    ("Soporte", 3, 4, 3),
    ("Actitud hacia el cambio", 3, 1, 2),
    ("Bloqueo de proveedores", 3, 2, 2),
    ("Casos de estudio de adopción FLOSS", 3, 1, 2),
    ("Centralidad de la tecnología de la información", 3, 1, 2),
    ("Tiempo de adopción", 3, 1, 2),
    ("Coste total de propiedad", 3, 4, 3),
]


@pytest.mark.parametrize(("name", "ie", "il", "expected"), THESIS_ROWS)
def test_is_matches_thesis_table(name, ie, il, expected):
    assert importance(ie, il) == expected, name


@pytest.mark.parametrize(
    ("first", "second", "expected"),
    [
        (1, 1, 1),
        (1, 2, 1),
        (1, 3, 2),
        (1, 4, 2),
        (2, 1, 1),
        (2, 2, 2),
        (2, 3, 2),
        (2, 4, 3),
        (3, 1, 2),
        (3, 2, 2),
        (3, 3, 3),
        (3, 4, 3),
        (4, 1, 2),
        (4, 2, 3),
        (4, 3, 3),
        (4, 4, 4),
    ],
)
def test_importance_matrix(first, second, expected):
    assert importance(first, second) == expected


def test_importance_rejects_values_outside_scale():
    with pytest.raises(CalculationError):
        importance(0, 3)
    with pytest.raises(CalculationError):
        importance(3, 5)


def test_ir_uses_same_matrix():
    assert importance(3, 3) == 3
    assert importance(2, 2) == 2
    assert importance(2, 1) == 1
    assert importance(4, 4) == 4


def test_relevance_uses_ir_greater_or_equal_two():
    assert is_relevant(1) is False
    assert is_relevant(2) is True
    assert is_relevant(3) is True
    assert is_relevant(3, relevance_min=4) is False


@pytest.mark.parametrize(
    ("scores", "expected"),
    [
        ([4], Decimal("4.00")),
        ([4, 3], Decimal("3.50")),
        ([4, 3, 4, 4, 3, 4, 3, 4], Decimal("3.63")),
    ],
)
def test_factor_mean(scores, expected):
    assert factor_mean(scores) == expected


def test_factor_mean_requires_scores():
    with pytest.raises(CalculationError):
        factor_mean([])


@pytest.mark.parametrize(
    ("pm", "scope", "expected"),
    [
        ("3.00", "interno", "fortaleza"),
        ("2.99", "interno", "debilidad"),
        ("3.00", "externo", "oportunidad"),
        ("2.99", "externo", "amenaza"),
        ("4.00", "interno", "fortaleza"),
        ("1.00", "externo", "amenaza"),
    ],
)
def test_foda_quadrants_and_threshold(pm, scope, expected):
    assert classify_foda(pm, scope, 3) == expected


def test_foda_requires_resolved_scope():
    with pytest.raises(CalculationError):
        classify_foda("3.00", "ambos", 3)


def _factor(name, foda, ir, relevant=True):
    return {
        "name": name,
        "foda": foda,
        "foda_label": foda.capitalize(),
        "ir": ir,
        "is_relevant": relevant,
    }


def test_recommendation_a_without_weaknesses():
    factors = [_factor("Compatibilidad", "oportunidad", 3)]
    assert recommend(factors)["code"] == "A"


def test_recommendation_b_with_moderate_weakness():
    factors = [_factor("Soporte", "debilidad", 2)]
    assert recommend(factors)["code"] == "B"


def test_recommendation_c_with_severe_threat():
    factors = [_factor("Bloqueo de proveedores", "amenaza", 3)]
    assert recommend(factors)["code"] == "C"


def test_recommendation_c_takes_precedence_over_b():
    factors = [
        _factor("Soporte", "debilidad", 2),
        _factor("Bloqueo de proveedores", "amenaza", 3),
    ]
    result = recommend(factors)
    assert result["code"] == "C"
    assert len(result["reasons"]) == 1


def test_recommendation_ignores_irrelevant_factors():
    factors = [_factor("Soporte", "debilidad", 1, relevant=False)]
    assert recommend(factors)["code"] == "A"


def _calculated(name, pm, ir):
    return {"name": name, "pm": Decimal(str(pm)), "ir": ir, "is_relevant": True}


def test_global_score_at_maximum():
    result = global_score([_calculated("A", 4, 3)], 1, 4)
    assert result == {
        "global": Decimal("4.00"),
        "percentage": Decimal("100.00"),
        "score_5": Decimal("5.00"),
    }


def test_global_score_at_minimum():
    result = global_score([_calculated("A", 1, 3)], 1, 4)
    assert result == {
        "global": Decimal("1.00"),
        "percentage": Decimal("0.00"),
        "score_5": Decimal("1.00"),
    }


def test_global_score_is_weighted_by_ir():
    factors = [_calculated("A", "4.00", 4), _calculated("B", "2.00", 2)]
    result = global_score(factors, 1, 4)
    assert result["global"] == Decimal("3.33")
    assert result["percentage"] == Decimal("77.78")
    assert result["score_5"] == Decimal("4.11")


def test_global_score_requires_relevant_factors():
    with pytest.raises(CalculationError):
        global_score([], 1, 4)


def test_global_score_rejects_invalid_scale():
    with pytest.raises(CalculationError):
        global_score([_calculated("A", 3, 3)], 4, 4)


def test_evaluate_full_case():
    factors = [
        FactorInput(
            code="compatibility",
            name="Compatibilidad",
            dimension="Tecnológica",
            scope="externo",
            ie=3,
            il=3,
            id_value=3,
            scores=[4, 3, 4, 4, 3, 4, 3, 4],
        ),
        FactorInput(
            code="support",
            name="Soporte",
            dimension="Organizacional",
            scope="interno",
            ie=3,
            il=4,
            id_value=2,
            scores=[2, 2, 1, 2, 2, 2],
        ),
    ]
    settings = {
        "scale_min": 1,
        "scale_max": 4,
        "foda_threshold": "3.00",
        "relevance_min": 2,
    }

    result = evaluate(factors, settings)

    assert result["factors"][0]["is_value"] == 3
    assert result["factors"][0]["ir"] == 3
    assert result["factors"][0]["pm"] == Decimal("3.63")
    assert result["factors"][0]["foda"] == "oportunidad"
    assert result["factors"][1]["ir"] == 2
    assert result["factors"][1]["foda"] == "debilidad"
    assert result["recommendation"]["code"] == "B"
    assert result["global"] == Decimal("2.91")
    assert result["percentage"] == Decimal("63.67")
    assert result["score_5"] == Decimal("3.55")
    assert result["pending"] == 0
    assert result["swot"]["debilidades"] == ["Soporte"]


def test_evaluate_marks_pending_relevant_factor():
    factors = [
        FactorInput(
            code="support",
            name="Soporte",
            dimension="Organizacional",
            scope="interno",
            ie=3,
            il=4,
            id_value=3,
            scores=[],
        )
    ]
    result = evaluate(factors, {"scale_min": 1, "scale_max": 4})

    assert result["pending"] == 1
    assert result["factors"][0]["pm"] is None
    assert result["global"] is None
