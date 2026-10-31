"""Serializers de evaluaciones."""

from rest_framework import serializers

from apps.software.models import Software

from .models import Evaluation, EvaluationFactor, EvaluationSubfactor

FODA_LABELS = {
    "fortaleza": "Fortaleza",
    "oportunidad": "Oportunidad",
    "debilidad": "Debilidad",
    "amenaza": "Amenaza",
}


class EvaluationSubfactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationSubfactor
        fields = ["id", "code", "text", "ps", "source", "note", "order"]


class EvaluationSubfactorDetailSerializer(EvaluationSubfactorSerializer):
    factor = serializers.IntegerField(source="evaluation_factor_id", read_only=True)
    factor_name = serializers.CharField(source="evaluation_factor.name", read_only=True)

    class Meta(EvaluationSubfactorSerializer.Meta):
        fields = [*EvaluationSubfactorSerializer.Meta.fields, "factor", "factor_name"]


class EvaluationFactorSerializer(serializers.ModelSerializer):
    subfactors = EvaluationSubfactorSerializer(many=True, read_only=True)
    foda_label = serializers.SerializerMethodField()

    class Meta:
        model = EvaluationFactor
        fields = [
            "id",
            "factor",
            "code",
            "name",
            "dimension_name",
            "scope",
            "ns",
            "tc",
            "ie",
            "il",
            "is_value",
            "id_value",
            "ir",
            "is_relevant",
            "pm",
            "foda",
            "foda_label",
            "weight",
            "order",
            "subfactors",
        ]

    def get_foda_label(self, obj):
        return FODA_LABELS.get(obj.foda, "")


class EvaluationListSerializer(serializers.ModelSerializer):
    software_label = serializers.CharField(source="software", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    score_5 = serializers.SerializerMethodField()

    class Meta:
        model = Evaluation
        fields = [
            "id",
            "code",
            "software",
            "software_label",
            "evaluator",
            "organization",
            "need",
            "status",
            "status_label",
            "score_5",
            "created_at",
            "updated_at",
        ]

    def get_score_5(self, obj):
        result = getattr(obj, "result", None)
        return format(result.score_5, "f") if result else None


class EvaluationDetailSerializer(EvaluationListSerializer):
    factors = EvaluationFactorSerializer(many=True, read_only=True)

    class Meta(EvaluationListSerializer.Meta):
        fields = [*EvaluationListSerializer.Meta.fields, "factors"]
        read_only_fields = ["code", "software", "status", "created_at", "updated_at"]


class EvaluationCreateSerializer(serializers.Serializer):
    software = serializers.PrimaryKeyRelatedField(queryset=Software.objects.filter(is_active=True))
    evaluator = serializers.CharField(max_length=120)
    organization = serializers.CharField(
        max_length=160, required=False, allow_blank=True, default=""
    )
    need = serializers.CharField()


class ConfigItemSerializer(serializers.Serializer):
    factor = serializers.IntegerField()
    id_value = serializers.IntegerField(min_value=1, max_value=4, required=False)
    scope = serializers.ChoiceField(choices=["interno", "externo"], required=False)


class ConfigSerializer(serializers.Serializer):
    factors = ConfigItemSerializer(many=True)


class ScoreItemSerializer(serializers.Serializer):
    subfactor = serializers.IntegerField()
    ps = serializers.IntegerField(min_value=1, max_value=4, required=False, allow_null=True)
    source = serializers.CharField(max_length=120, required=False, allow_blank=True)
    note = serializers.CharField(required=False, allow_blank=True)


class ScoresSerializer(serializers.Serializer):
    scores = ScoreItemSerializer(many=True)
