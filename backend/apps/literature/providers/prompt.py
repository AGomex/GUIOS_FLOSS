"""Prompt determinista para clasificar la pertinencia de los artículos."""

SYSTEM_PROMPT = (
    "Eres un revisor experto en ingeniería de software y adopción tecnológica. "
    "Tu tarea es decidir si un artículo científico aborda de forma sustantiva un "
    "factor concreto de la adopción de software. Sé estricto: una mención de paso "
    "no cuenta. Responde siempre en español y solo con el JSON solicitado."
)


def build_prompt(
    *,
    factor_name: str,
    factor_description: str,
    keywords: list[str],
    articles: list[dict],
) -> str:
    blocks = []
    for index, article in enumerate(articles):
        abstract = (article.get("abstract") or "Sin resumen disponible.")[:1600]
        blocks.append(
            f"[{index}] Año: {article.get('year') or 's/d'}\n"
            f"Título: {article.get('title') or ''}\n"
            f"Revista: {article.get('venue') or ''}\n"
            f"Resumen: {abstract}"
        )

    return (
        f"Factor evaluado: {factor_name}\n"
        f"Definición: {factor_description or 'Sin definición adicional.'}\n"
        f"Términos de búsqueda: {', '.join(keywords)}\n\n"
        "Artículos candidatos:\n\n"
        + "\n\n".join(blocks)
        + "\n\nDevuelve un objeto JSON con esta forma exacta:\n"
        '{"results": [{"index": 0, "relevant": true, '
        '"reason": "motivo breve en español", "confidence": 0.9}]}\n'
        "Incluye un elemento por cada artículo candidato, usando su índice."
    )
