"""Selección del clasificador según la configuración."""

from django.conf import settings

from .base import Classifier
from .gemini import GeminiClassifier
from .mock import HeuristicClassifier
from .openai import OpenAIClassifier


def get_classifier(provider: str | None = None) -> Classifier:
    config = settings.LITERATURE
    selected = provider or config["provider"]

    if selected == "openai":
        return OpenAIClassifier(
            model=config["openai_model"],
            api_key=config["openai_api_key"],
            timeout=config["timeout"],
        )
    if selected == "gemini":
        return GeminiClassifier(
            model=config["gemini_model"],
            api_key=config["gemini_api_key"],
            timeout=config["timeout"],
            min_interval=config["gemini_min_interval"],
        )
    return HeuristicClassifier()
