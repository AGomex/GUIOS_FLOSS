"""Serializers de comparación."""

from rest_framework import serializers


class ComparisonRequestSerializer(serializers.Serializer):
    evaluations = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=2,
        max_length=3,
    )
