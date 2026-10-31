"""Vistas de evaluaciones."""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.exceptions import api_error

from . import services
from .models import Evaluation, EvaluationSubfactor
from .serializers import (
    ConfigSerializer,
    EvaluationCreateSerializer,
    EvaluationDetailSerializer,
    EvaluationFactorSerializer,
    EvaluationListSerializer,
    EvaluationSubfactorDetailSerializer,
    ScoresSerializer,
)


class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = (
        Evaluation.objects.select_related("software", "result")
        .prefetch_related("factors__subfactors")
        .all()
    )
    filterset_fields = ["status", "software"]
    search_fields = ["code", "evaluator", "organization", "need", "software__name"]
    ordering_fields = ["created_at", "code"]

    def get_serializer_class(self):
        if self.action == "create":
            return EvaluationCreateSerializer
        if self.action == "list":
            return EvaluationListSerializer
        return EvaluationDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evaluation = services.create_evaluation(**serializer.validated_data)
        return Response(
            EvaluationDetailSerializer(evaluation).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        evaluation = self.get_object()
        if evaluation.status == Evaluation.Status.FINISHED:
            return api_error("La evaluación está finalizada.", "conflict", 409)
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["get", "put"], url_path="config")
    def config(self, request, pk=None):
        evaluation = self.get_object()

        if request.method == "GET":
            return Response(EvaluationFactorSerializer(evaluation.factors.all(), many=True).data)

        serializer = ConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            services.apply_config(evaluation, serializer.validated_data["factors"])
        except services.EvaluationStateError as exc:
            return api_error(str(exc), "conflict", 409)
        except services.EvaluationError as exc:
            return api_error(str(exc), "invalid", 400)

        return Response(EvaluationFactorSerializer(evaluation.factors.all(), many=True).data)

    @action(detail=True, methods=["get", "put"], url_path="scores")
    def scores(self, request, pk=None):
        evaluation = self.get_object()

        if request.method == "GET":
            subfactors = EvaluationSubfactor.objects.filter(
                evaluation_factor__evaluation=evaluation
            ).select_related("evaluation_factor")
            return Response(EvaluationSubfactorDetailSerializer(subfactors, many=True).data)

        serializer = ScoresSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            services.apply_scores(evaluation, serializer.validated_data["scores"])
        except services.EvaluationStateError as exc:
            return api_error(str(exc), "conflict", 409)
        except services.EvaluationError as exc:
            return api_error(str(exc), "invalid", 400)

        subfactors = EvaluationSubfactor.objects.filter(
            evaluation_factor__evaluation=evaluation
        ).select_related("evaluation_factor")
        return Response(EvaluationSubfactorDetailSerializer(subfactors, many=True).data)

    @action(detail=True, methods=["post"])
    def preview(self, request, pk=None):
        evaluation = self.get_object()
        return Response(services.preview(evaluation))

    @action(detail=True, methods=["post"])
    def finalize(self, request, pk=None):
        evaluation = self.get_object()
        try:
            result = services.finalize(evaluation)
        except services.EvaluationStateError as exc:
            return api_error(str(exc), "conflict", 409)
        except services.IncompleteEvaluation as exc:
            return api_error(str(exc), "incomplete", 422)
        return Response({"status": "finalizada", "result": result})

    @action(detail=True, methods=["get"])
    def results(self, request, pk=None):
        evaluation = self.get_object()
        try:
            payload = services.results_payload(evaluation)
        except Evaluation.result.RelatedObjectDoesNotExist:
            return api_error("La evaluación aún no tiene resultados.", "not_found", 404)
        return Response(payload)
