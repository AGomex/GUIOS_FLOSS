"""Serializers de la actualización de literatura."""

from django.conf import settings
from rest_framework import serializers

from .models import Article, FactorSearch, LiteratureRun


class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = [
            "id",
            "doi",
            "title",
            "year",
            "venue",
            "authors",
            "url",
            "is_relevant",
            "reason",
            "confidence",
            "order",
        ]


class FactorSearchSerializer(serializers.ModelSerializer):
    factor_code = serializers.CharField(source="factor.code", read_only=True)
    factor_name = serializers.CharField(source="factor.name", read_only=True)
    dimension_name = serializers.CharField(source="factor.dimension.name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = FactorSearch
        fields = [
            "id",
            "factor",
            "factor_code",
            "factor_name",
            "dimension_name",
            "query",
            "retrieved",
            "relevant",
            "tc_before",
            "tc_after",
            "il_before",
            "il_after",
            "status",
            "status_label",
            "error",
        ]


class FactorSearchDetailSerializer(FactorSearchSerializer):
    articles = ArticleSerializer(many=True, read_only=True)

    class Meta(FactorSearchSerializer.Meta):
        fields = [*FactorSearchSerializer.Meta.fields, "articles"]


class LiteratureRunSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    provider_label = serializers.CharField(source="get_provider_display", read_only=True)
    label = serializers.CharField(read_only=True)
    totals = serializers.SerializerMethodField()

    class Meta:
        model = LiteratureRun
        fields = [
            "id",
            "status",
            "status_label",
            "provider",
            "provider_label",
            "model",
            "prompt_version",
            "year_from",
            "year_to",
            "max_candidates",
            "factors_total",
            "factors_done",
            "quartiles",
            "error",
            "triggered_by",
            "started_at",
            "finished_at",
            "created_at",
            "label",
            "totals",
        ]

    def get_totals(self, obj):
        searches = list(obj.searches.all())
        return {
            "relevant": sum(search.relevant for search in searches),
            "before": sum(search.tc_before for search in searches),
            "after": sum(search.tc_after for search in searches),
        }


class LiteratureRunDetailSerializer(LiteratureRunSerializer):
    searches = FactorSearchSerializer(many=True, read_only=True)

    class Meta(LiteratureRunSerializer.Meta):
        fields = [*LiteratureRunSerializer.Meta.fields, "searches"]


class RunCreateSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(
        choices=[value for value, _ in LiteratureRun.Provider.choices],
        required=False,
    )
    model = serializers.CharField(required=False, allow_blank=True, default="")
    year_from = serializers.IntegerField(min_value=2000, max_value=2100, required=False)
    year_to = serializers.IntegerField(min_value=2000, max_value=2100, required=False)
    max_candidates = serializers.IntegerField(min_value=5, max_value=100, required=False)
    triggered_by = serializers.CharField(
        max_length=120, required=False, allow_blank=True, default=""
    )

    def validate(self, attrs):
        config = settings.LITERATURE
        year_from = attrs.get("year_from") or config["year_from"]
        year_to = attrs.get("year_to") or config["year_to"]
        if year_from > year_to:
            raise serializers.ValidationError(
                {"year_to": "El año final debe ser mayor o igual al inicial."}
            )
        return attrs
