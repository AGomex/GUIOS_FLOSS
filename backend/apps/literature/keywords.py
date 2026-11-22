"""Términos y cadenas de búsqueda por factor."""

from __future__ import annotations

ADOPTION_TERMS = [
    "software adoption",
    "software implementation",
    "technology adoption",
    "open source adoption",
]

FACTOR_TERMS: dict[str, list[str]] = {
    "compatibility": [
        "software compatibility",
        "interoperability",
        "software integration",
    ],
    "reliability": [
        "software reliability",
        "system reliability",
        "failure rate",
    ],
    "maintainability": [
        "software maintainability",
        "maintenance effort",
        "code maintenance",
    ],
    "customization": [
        "software customization",
        "configurability",
        "tailoring",
    ],
    "testability": [
        "software testability",
        "testing effort",
        "test automation",
    ],
    "documentation": [
        "software documentation",
        "user manual",
        "technical documentation",
    ],
    "portability": [
        "software portability",
        "platform independence",
        "cross-platform",
    ],
    "reusability": [
        "software reuse",
        "reusable components",
        "code reuse",
    ],
    "usability": [
        "software usability",
        "ease of use",
        "user experience",
    ],
    "management_support": [
        "top management support",
        "management commitment",
        "organizational support",
    ],
    "training": [
        "user training",
        "staff training",
        "training programs",
    ],
    "support": [
        "technical support",
        "vendor support",
        "help desk",
    ],
    "change_attitude": [
        "resistance to change",
        "technology acceptance",
        "user attitude",
    ],
    "vendor_lock_in": [
        "vendor lock-in",
        "switching costs",
        "proprietary lock-in",
    ],
    "floss_case_studies": [
        "free software adoption",
        "open source adoption",
        "case study",
    ],
    "it_centrality": [
        "IT infrastructure",
        "IT capability",
        "IT centrality",
    ],
    "adoption_time": [
        "adoption time",
        "implementation time",
        "time to adopt",
    ],
    "tco": [
        "total cost of ownership",
        "cost of adoption",
        "implementation cost",
    ],
}


def factor_terms(code: str) -> list[str]:
    """Términos en inglés para un factor; si falta, usa su código legible."""
    return FACTOR_TERMS.get(code, [code.replace("_", " ")])


def build_search_chain(code: str, year_from: int, year_to: int) -> str:
    """Cadena booleana documentada, equivalente a la búsqueda manual de la tesis."""
    adoption = " OR ".join(f'"{term}"' for term in ADOPTION_TERMS)
    terms = " OR ".join(f'"{term}"' for term in factor_terms(code))
    return (
        f"({adoption}) AND ({terms}) "
        f"AND from_publication_date:{year_from}-01-01 "
        f"to_publication_date:{year_to}-12-31"
    )


def source_query(code: str) -> str:
    """Consulta simplificada que se envía a las fuentes académicas."""
    return " ".join(factor_terms(code))
