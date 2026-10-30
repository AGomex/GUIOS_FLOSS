"""Serializers de proveedores y softwares."""

from rest_framework import serializers

from .models import Provider, Software


class ProviderSerializer(serializers.ModelSerializer):
    softwares_count = serializers.IntegerField(source="softwares.count", read_only=True)

    class Meta:
        model = Provider
        fields = [
            "id",
            "name",
            "description",
            "website",
            "is_active",
            "softwares_count",
        ]


class SoftwareSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source="provider.name", read_only=True)
    license_label = serializers.CharField(source="get_license_type_display", read_only=True)

    class Meta:
        model = Software
        fields = [
            "id",
            "name",
            "version",
            "provider",
            "provider_name",
            "license_type",
            "license_label",
            "category",
            "description",
            "website",
            "is_active",
        ]
        # La unicidad se valida abajo con un mensaje en español.
        validators = []

    def validate(self, attrs):
        provider = attrs.get("provider", getattr(self.instance, "provider", None))
        name = attrs.get("name", getattr(self.instance, "name", ""))
        version = attrs.get("version", getattr(self.instance, "version", ""))
        queryset = Software.objects.filter(name=name, version=version, provider=provider)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                {"version": "Ya existe un software con ese nombre, versión y proveedor."}
            )
        return attrs
