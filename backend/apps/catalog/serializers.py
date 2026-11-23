"""Serializers del catálogo."""

from decimal import Decimal

from rest_framework import serializers

from .models import Dimension, Factor, ScoringSettings, Subfactor


class DimensionSerializer(serializers.ModelSerializer):
    factors_count = serializers.IntegerField(source="factors.count", read_only=True)

    class Meta:
        model = Dimension
        fields = [
            "id",
            "code",
            "name",
            "description",
            "order",
            "is_active",
            "factors_count",
        ]


class SubfactorSerializer(serializers.ModelSerializer):
    factor_name = serializers.CharField(source="factor.name", read_only=True)

    class Meta:
        model = Subfactor
        fields = [
            "id",
            "factor",
            "factor_name",
            "code",
            "text",
            "citations",
            "order",
            "is_active",
        ]


class FactorSerializer(serializers.ModelSerializer):
    dimension_name = serializers.CharField(source="dimension.name", read_only=True)
    subfactors_count = serializers.IntegerField(source="subfactors.count", read_only=True)
    scope_label = serializers.CharField(source="get_scope_display", read_only=True)

    class Meta:
        model = Factor
        fields = [
            "id",
            "dimension",
            "dimension_name",
            "code",
            "name",
            "description",
            "scope",
            "scope_label",
            "ns",
            "tc",
            "ie",
            "il",
            "is_value",
            "order",
            "is_active",
            "subfactors_count",
        ]


class FactorDetailSerializer(FactorSerializer):
    subfactors = SubfactorSerializer(many=True, read_only=True)

    class Meta(FactorSerializer.Meta):
        fields = [*FactorSerializer.Meta.fields, "subfactors"]


class ScoringSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoringSettings
        fields = ["scale_min", "scale_max", "foda_threshold", "relevance_min", "updated_at"]
        read_only_fields = ["updated_at"]

    def validate(self, attrs):
        scale_min = attrs.get("scale_min", self.instance.scale_min)
        scale_max = attrs.get("scale_max", self.instance.scale_max)
        threshold = Decimal(str(attrs.get("foda_threshold", self.instance.foda_threshold)))
        relevance_min = attrs.get("relevance_min", self.instance.relevance_min)

        errors = {}
        if scale_min < 1:
            errors["scale_min"] = "El valor mínimo debe ser al menos 1."
        if scale_max <= scale_min:
            errors["scale_max"] = "El valor máximo debe ser mayor que el mínimo."
        if relevance_min < 1:
            errors["relevance_min"] = "La relevancia mínima debe ser al menos 1."
        if threshold < Decimal(scale_min) or threshold > Decimal(scale_max):
            errors["foda_threshold"] = f"El umbral FODA debe estar entre {scale_min} y {scale_max}."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs
