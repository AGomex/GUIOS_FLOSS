"""Registro de proveedores y softwares en el admin."""

from django.contrib import admin

from .models import Provider, Software


@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display = ("name", "website", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(Software)
class SoftwareAdmin(admin.ModelAdmin):
    list_display = ("name", "version", "provider", "license_type", "category", "is_active")
    list_filter = ("license_type", "category", "is_active", "provider")
    search_fields = ("name", "version", "provider__name")
