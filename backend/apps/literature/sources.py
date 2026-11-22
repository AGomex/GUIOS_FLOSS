"""Fuentes académicas usadas para recuperar artículos científicos."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

OPENALEX_URL = "https://api.openalex.org/works"
CROSSREF_URL = "https://api.crossref.org/works"
SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"


class LiteratureSourceError(Exception):
    """Ninguna fuente académica devolvió resultados."""


@dataclass
class SourceArticle:
    external_id: str = ""
    title: str = ""
    abstract: str = ""
    year: int | None = None
    venue: str = ""
    authors: str = ""
    url: str = ""
    doi: str = ""

    @property
    def key(self) -> str:
        return (self.doi or self.external_id or self.title).strip().lower()


def _clean(value) -> str:
    if not value:
        return ""
    return " ".join(str(value).split())


def _abstract_from_inverted(index) -> str:
    """OpenAlex entrega el resumen como índice invertido."""
    if not index:
        return ""
    positions: list[tuple[int, str]] = []
    for word, indexes in index.items():
        for position in indexes or []:
            positions.append((position, word))
    positions.sort()
    return " ".join(word for _, word in positions)


def _authors(authorships) -> str:
    names = []
    for item in (authorships or [])[:4]:
        name = (item.get("author") or {}).get("display_name")
        if name:
            names.append(name)
    return ", ".join(names)


def _from_openalex(item: dict) -> SourceArticle:
    location = item.get("primary_location") or {}
    source = location.get("source") or {}
    return SourceArticle(
        external_id=_clean(item.get("id", "")).rsplit("/", 1)[-1],
        title=_clean(item.get("title") or item.get("display_name")),
        abstract=_abstract_from_inverted(item.get("abstract_inverted_index")),
        year=item.get("publication_year"),
        venue=_clean(source.get("display_name")),
        authors=_authors(item.get("authorships")),
        url=_clean(location.get("landing_page_url") or item.get("id")),
        doi=_clean(item.get("doi", "")).replace("https://doi.org/", ""),
    )


def search_openalex(
    terms: str,
    *,
    year_from: int,
    year_to: int,
    limit: int,
    timeout: float,
    contact_email: str = "",
) -> list[SourceArticle]:
    params = {
        "search": terms,
        "filter": (
            f"from_publication_date:{year_from}-01-01,"
            f"to_publication_date:{year_to}-12-31,type:article"
        ),
        "per-page": min(max(limit, 1), 100),
        "sort": "relevance_score:desc",
    }
    if contact_email:
        params["mailto"] = contact_email
    response = httpx.get(OPENALEX_URL, params=params, timeout=timeout)
    response.raise_for_status()
    return [_from_openalex(item) for item in response.json().get("results", [])]


def _from_crossref(item: dict) -> SourceArticle:
    titles = item.get("title") or []
    containers = item.get("container-title") or []
    issued = (item.get("issued") or {}).get("date-parts") or [[None]]
    year = issued[0][0] if issued and issued[0] else None
    authors = []
    for author in (item.get("author") or [])[:4]:
        name = " ".join(part for part in [author.get("given"), author.get("family")] if part)
        if name:
            authors.append(name)
    return SourceArticle(
        external_id=_clean(item.get("DOI", "")),
        title=_clean(titles[0] if titles else ""),
        abstract=_clean(item.get("abstract", "")),
        year=year,
        venue=_clean(containers[0] if containers else ""),
        authors=", ".join(authors),
        url=_clean(item.get("URL", "")),
        doi=_clean(item.get("DOI", "")),
    )


def search_crossref(
    terms: str,
    *,
    year_from: int,
    year_to: int,
    limit: int,
    timeout: float,
    contact_email: str = "",
) -> list[SourceArticle]:
    params = {
        "query": terms,
        "filter": (
            f"from-pub-date:{year_from}-01-01,until-pub-date:{year_to}-12-31,type:journal-article"
        ),
        "rows": min(max(limit, 1), 100),
        "select": "DOI,title,abstract,issued,container-title,author,URL",
    }
    if contact_email:
        params["mailto"] = contact_email
    response = httpx.get(CROSSREF_URL, params=params, timeout=timeout)
    response.raise_for_status()
    items = (response.json().get("message") or {}).get("items", [])
    return [_from_crossref(item) for item in items]


def _from_semantic_scholar(item: dict) -> SourceArticle:
    external = item.get("externalIds") or {}
    return SourceArticle(
        external_id=_clean(item.get("paperId", "")),
        title=_clean(item.get("title")),
        abstract=_clean(item.get("abstract")),
        year=item.get("year"),
        venue=_clean(item.get("venue")),
        authors=", ".join(
            author.get("name", "") for author in (item.get("authors") or [])[:4]
        ).strip(", "),
        url=_clean(item.get("url")),
        doi=_clean(external.get("DOI", "")),
    )


def search_semantic_scholar(
    terms: str,
    *,
    year_from: int,
    year_to: int,
    limit: int,
    timeout: float,
    api_key: str = "",
) -> list[SourceArticle]:
    params = {
        "query": terms,
        "limit": min(max(limit, 1), 100),
        "year": f"{year_from}-{year_to}",
        "fields": "title,abstract,year,venue,authors,url,externalIds",
    }
    headers = {"x-api-key": api_key} if api_key else {}
    response = httpx.get(SEMANTIC_SCHOLAR_URL, params=params, headers=headers, timeout=timeout)
    response.raise_for_status()
    return [_from_semantic_scholar(item) for item in response.json().get("data", [])]


def search_articles(
    terms: str,
    *,
    year_from: int,
    year_to: int,
    limit: int,
    timeout: float,
    contact_email: str = "",
    semantic_scholar_key: str = "",
) -> tuple[list[SourceArticle], str]:
    """Consulta las fuentes en orden y devuelve la primera con resultados."""
    attempts = [
        (
            "openalex",
            lambda: search_openalex(
                terms,
                year_from=year_from,
                year_to=year_to,
                limit=limit,
                timeout=timeout,
                contact_email=contact_email,
            ),
        ),
        (
            "crossref",
            lambda: search_crossref(
                terms,
                year_from=year_from,
                year_to=year_to,
                limit=limit,
                timeout=timeout,
                contact_email=contact_email,
            ),
        ),
        (
            "semantic_scholar",
            lambda: search_semantic_scholar(
                terms,
                year_from=year_from,
                year_to=year_to,
                limit=limit,
                timeout=timeout,
                api_key=semantic_scholar_key,
            ),
        ),
    ]

    errors: list[str] = []
    for name, call in attempts:
        try:
            articles = call()
        except Exception as exc:  # noqa: BLE001 - se registra y se prueba la siguiente
            logger.warning("Fuente %s falló: %s", name, exc)
            errors.append(f"{name}: {exc}")
            continue
        if articles:
            return articles, name
        errors.append(f"{name}: sin resultados")

    raise LiteratureSourceError(
        "No se pudo recuperar artículos de ninguna fuente académica. " + "; ".join(errors)
    )
