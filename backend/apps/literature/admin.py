"""Administración de las corridas de literatura."""

from django.contrib import admin

from .models import Article, FactorSearch, LiteratureRun


class FactorSearchInline(admin.TabularInline):
    model = FactorSearch
    extra = 0
    readonly_fields = ["factor", "query", "retrieved", "relevant", "status"]


@admin.register(LiteratureRun)
class LiteratureRunAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "status",
        "provider",
        "model",
        "year_from",
        "year_to",
        "factors_done",
        "created_at",
    ]
    list_filter = ["status", "provider"]
    inlines = [FactorSearchInline]


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title", "year", "venue", "is_relevant", "confidence"]
    list_filter = ["is_relevant"]
    search_fields = ["title", "doi"]
