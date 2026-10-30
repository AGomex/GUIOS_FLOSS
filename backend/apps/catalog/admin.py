"""Registro del catálogo en el admin."""

from django.contrib import admin

from .models import Dimension, Factor, ScoringSettings, Subfactor


class SubfactorInline(admin.TabularInline):
    model = Subfactor
    extra = 0
    fields = ("code", "text", "citations", "order", "is_active")


@admin.register(Dimension)
class DimensionAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "order", "is_active")
    list_editable = ("order", "is_active")
    search_fields = ("name", "code")
    prepopulated_fields = {"code": ("name",)}


@admin.register(Factor)
class FactorAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "dimension",
        "scope",
        "ns",
        "tc",
        "ie",
        "il",
        "is_value",
        "order",
        "is_active",
    )
    list_filter = ("dimension", "scope", "is_active")
    list_editable = ("ns", "tc", "ie", "il", "is_value", "order", "is_active")
    search_fields = ("name", "code")
    inlines = [SubfactorInline]


@admin.register(Subfactor)
class SubfactorAdmin(admin.ModelAdmin):
    list_display = ("text", "factor", "citations", "order", "is_active")
    list_filter = ("factor__dimension", "factor", "is_active")
    search_fields = ("text", "code")


@admin.register(ScoringSettings)
class ScoringSettingsAdmin(admin.ModelAdmin):
    list_display = ("__str__", "updated_at")

    def has_add_permission(self, request):
        return not ScoringSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
