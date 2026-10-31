"""Registro de evaluaciones en el admin de Django."""

from django.contrib import admin

from .models import Evaluation, EvaluationFactor, EvaluationResult, EvaluationSubfactor


class EvaluationSubfactorInline(admin.TabularInline):
    model = EvaluationSubfactor
    extra = 0
    fields = ("code", "text", "ps", "source", "note", "order")
    readonly_fields = ("code", "text")


class EvaluationFactorInline(admin.TabularInline):
    model = EvaluationFactor
    extra = 0
    fields = ("name", "dimension_name", "scope", "id_value", "ir", "is_relevant", "pm", "foda")
    readonly_fields = ("name", "dimension_name", "ir", "is_relevant", "pm", "foda")
    show_change_link = True


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ("code", "software", "evaluator", "organization", "status", "created_at")
    list_filter = ("status", "software__provider")
    search_fields = ("code", "evaluator", "organization", "software__name")
    readonly_fields = ("code", "config_snapshot", "created_at", "updated_at")
    inlines = [EvaluationFactorInline]


@admin.register(EvaluationFactor)
class EvaluationFactorAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "evaluation",
        "dimension_name",
        "scope",
        "id_value",
        "ir",
        "is_relevant",
        "pm",
        "foda",
    )
    list_filter = ("scope", "is_relevant", "foda", "evaluation")
    search_fields = ("name", "code", "evaluation__code")
    inlines = [EvaluationSubfactorInline]


@admin.register(EvaluationSubfactor)
class EvaluationSubfactorAdmin(admin.ModelAdmin):
    list_display = ("text", "evaluation_factor", "ps", "source")
    list_filter = ("evaluation_factor__evaluation",)
    search_fields = ("text", "code")


@admin.register(EvaluationResult)
class EvaluationResultAdmin(admin.ModelAdmin):
    list_display = (
        "evaluation",
        "global_score",
        "percentage",
        "score_5",
        "recommendation",
    )
    list_filter = ("recommendation",)
