import { ArrowLeft, ClipboardList, Plus, SlidersHorizontal } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { FactorBars } from "@/components/charts/FactorBars"
import { RadarChart } from "@/components/charts/RadarChart"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import { api, type EvaluationResults, type ResultFactor } from "@/lib/api"

const RECOMMENDATION_TONE = {
  A: "green",
  B: "amber",
  C: "red",
} as const

const FODA_TONE = {
  fortaleza: "green",
  oportunidad: "blue",
  debilidad: "red",
  amenaza: "amber",
} as const

const SWOT_GROUPS = [
  { key: "fortaleza", title: "Fortalezas", tone: "green" },
  { key: "oportunidad", title: "Oportunidades", tone: "blue" },
  { key: "debilidad", title: "Debilidades", tone: "red" },
  { key: "amenaza", title: "Amenazas", tone: "amber" },
] as const

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function scoreTone(score: number) {
  if (score >= 4) return "green"
  if (score >= 3) return "amber"
  return "red"
}

function statusTone(
  status: string,
): "green" | "amber" | "blue" | "neutral" {
  if (status === "finalizada") return "green"
  if (status === "reabierta") return "amber"
  if (status === "en_evaluacion") return "blue"
  return "neutral"
}

function fodaStatus(factor: ResultFactor) {
  if (!factor.foda) return <Status tone="neutral">—</Status>
  return (
    <Status tone={FODA_TONE[factor.foda as keyof typeof FODA_TONE] ?? "neutral"}>
      {factor.foda_label}
    </Status>
  )
}

export function Resultados() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState<EvaluationResults | null>(null)
  const [dimensionFilter, setDimensionFilter] = useState("")
  const [onlyRelevant, setOnlyRelevant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let targetId: number | null = id ? Number(id) : null
        if (targetId === null) {
          const page = await api.evaluations()
          const finished = page.results.find((item) => item.status === "finalizada")
          targetId = finished?.id ?? null
        }
        if (targetId === null) {
          setResults(null)
          return
        }
        setResults(await api.evaluationResults(targetId))
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudo cargar el resultado.",
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id])

  const bars = useMemo(() => {
    if (!results) return []
    return results.factors
      .filter((factor) => factor.is_relevant && factor.pm !== null)
      .sort((left, right) => Number(left.pm) - Number(right.pm))
      .map((factor) => ({ name: factor.name, value: Number(factor.pm) }))
  }, [results])

  const visibleFactors = useMemo(() => {
    if (!results) return []
    return results.factors.filter((factor) => {
      const matchesDimension =
        !dimensionFilter || factor.dimension === dimensionFilter
      const matchesRelevance = !onlyRelevant || factor.is_relevant
      return matchesDimension && matchesRelevance
    })
  }, [dimensionFilter, onlyRelevant, results])

  if (loading) {
    return (
      <Layout screen="results">
        <Section title="Resultados">
          <p className="annotation">Cargando resultados…</p>
        </Section>
      </Layout>
    )
  }

  if (!results) {
    return (
      <Layout screen="results">
        <Section title="Resultados">
          <p className="annotation">
            {error ?? "Todavía no hay evaluaciones finalizadas."}
          </p>
          <div className="page-actions">
            <Button onClick={() => navigate("/calificacion")} variant="secondary">
              Ir a calificación
            </Button>
            <Button onClick={() => navigate("/evaluaciones/nueva")}>
              <Plus size={15} />
              Nueva evaluación
            </Button>
          </div>
        </Section>
      </Layout>
    )
  }

  const { evaluation, recommendation } = results
  const score = Number(results.score_5)
  const radarData = results.dimensions.map((dimension) => ({
    label: dimension.name,
    value: Number(dimension.average ?? 0),
  }))
  const dimensionOptions = results.dimensions.map((dimension) => ({
    value: dimension.name,
    label: dimension.name,
  }))

  const rows = visibleFactors.map((factor) => [
    factor.dimension,
    factor.name,
    factor.scope === "interno" ? "Interno" : "Externo",
    factor.ir,
    factor.pm ?? "—",
    fodaStatus(factor),
    factor.weight,
    <Status key={`${factor.id}-relevance`} tone={factor.is_relevant ? "blue" : "neutral"}>
      {factor.is_relevant ? "Relevante" : "No relevante"}
    </Status>,
  ])

  return (
    <Layout
      action={
        <Button
          onClick={() => navigate(`/calificacion/${evaluation.id}`)}
          variant="secondary"
        >
          <ClipboardList size={15} />
          Ver calificación
        </Button>
      }
      screen="results"
    >
      <Section className="result-heading">
        <div>
          <span className="eyebrow">Software evaluado</span>
          <strong>
            {evaluation.software} · versión {evaluation.software_version}
          </strong>
        </div>
        <Status tone={statusTone(evaluation.status)}>
          {evaluation.status_label}
        </Status>
        <div>
          <span className="eyebrow">Evaluación</span>
          <strong>{evaluation.code}</strong>
        </div>
        <div>
          <span className="eyebrow">Fecha</span>
          <strong>{formatDate(evaluation.finished_at)}</strong>
        </div>
      </Section>

      <div className="result-top">
        <Section title="Resultado global">
          <div className={`big-score big-score--${scoreTone(score)}`}>
            {results.score_5} <span>/ 5</span>
          </div>
          <small className="score-caption">
            Ponderación {results.global} · {results.percentage}% de la escala ·
            escala {results.scale.min}–{results.scale.max}
          </small>
        </Section>
        <Section title="Recomendación de adopción">
          <div className="recommendation-head">
            <Status tone={RECOMMENDATION_TONE[recommendation.code]}>
              {recommendation.code} · {recommendation.label}
            </Status>
            <span className="annotation">
              Umbral FODA {results.scale.foda_threshold}
            </span>
          </div>
          <div className="reason-list">
            {recommendation.reasons.map((reason) => (
              <span key={reason}>· {reason}</span>
            ))}
          </div>
          <div className="count-strip">
            <span>
              <strong>{results.counts.strengths}</strong> fortalezas
            </span>
            <span>
              <strong>{results.counts.opportunities}</strong> oportunidades
            </span>
            <span>
              <strong>{results.counts.weaknesses}</strong> debilidades
            </span>
            <span>
              <strong>{results.counts.threats}</strong> amenazas
            </span>
          </div>
        </Section>
      </div>

      <div className="two-col">
        <Section
          action={<span className="annotation">Promedio ponderado por IR</span>}
          title="Desempeño por dimensiones"
        >
          <RadarChart
            ariaLabel="Radar de desempeño por dimensiones"
            data={radarData}
            max={results.scale.max}
          />
        </Section>
        <Section
          action={
            <span className="annotation">
              {bars.length} factores relevantes
            </span>
          }
          title="Factores de menor a mayor PM"
        >
          <FactorBars bars={bars} max={results.scale.max} />
        </Section>
      </div>

      <Section
        action={<span className="annotation">Clasificación automática</span>}
        title="Matriz FODA"
      >
        <div className="swot">
          {SWOT_GROUPS.map(({ key, title, tone }) => {
            const items = results.factors.filter((factor) => factor.foda === key)
            return (
              <div className={`swot--${tone}`} key={key}>
                <strong>
                  {title} · {items.length}
                </strong>
                {items.length ? (
                  items.map((factor) => (
                    <span key={factor.id}>
                      {factor.name} · PM {factor.pm}
                    </span>
                  ))
                ) : (
                  <span>Sin aspectos en esta categoría</span>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Detalle de factores">
        <div className="result-filters">
          <Field
            kind="select"
            label="Dimensión"
            onChange={setDimensionFilter}
            options={dimensionOptions}
            placeholder="Todas"
            value={dimensionFilter}
          />
          <label className="check-label">
            <input
              checked={onlyRelevant}
              onChange={(event) => setOnlyRelevant(event.target.checked)}
              type="checkbox"
            />
            Solo factores relevantes
          </label>
          <span className="annotation">
            {visibleFactors.length} de {results.factors.length} factores ·{" "}
            {evaluation.evaluator}
            {evaluation.organization ? ` · ${evaluation.organization}` : ""}
          </span>
        </div>
        <DataTable
          headers={[
            "Dimensión",
            "Factor",
            "Alcance",
            "IR",
            "PM",
            "FODA",
            "Peso",
            "Relevancia",
          ]}
          rows={rows}
        />
      </Section>

      <Section title="Necesidad evaluada">
        <div className="text-box">{evaluation.need}</div>
      </Section>

      <div className="notice">
        <SlidersHorizontal size={16} />
        El resultado global se calcula como Σ(PM × IR) / Σ(IR) sobre los factores
        relevantes. La clasificación FODA usa el alcance y el umbral configurado.
      </div>

      <div className="page-actions">
        <Button onClick={() => navigate("/historial")} variant="secondary">
          <ArrowLeft size={15} />
          Historial
        </Button>
        <Button onClick={() => navigate("/evaluaciones/nueva")}>
          <Plus size={15} />
          Nueva evaluación
        </Button>
      </div>
    </Layout>
  )
}
