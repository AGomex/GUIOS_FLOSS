import { ArrowLeft, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import { api, type EvaluationResults } from "@/lib/api"

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

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function Resultados() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState<EvaluationResults | null>(null)
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
          caught instanceof Error ? caught.message : "No se pudo cargar el resultado.",
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id])

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
  const swotItems = [
    ["Fortalezas", results.swot.fortalezas ?? [], "green"],
    ["Oportunidades", results.swot.oportunidades ?? [], "blue"],
    ["Debilidades", results.swot.debilidades ?? [], "red"],
    ["Amenazas", results.swot.amenazas ?? [], "amber"],
  ] as const

  const rows = results.factors
    .filter((factor) => factor.is_relevant)
    .map((factor) => [
      factor.dimension,
      factor.name,
      factor.ir,
      factor.pm ?? "—",
      factor.foda ? (
        <Status tone={FODA_TONE[factor.foda as keyof typeof FODA_TONE] ?? "neutral"}>
          {factor.foda_label}
        </Status>
      ) : (
        "—"
      ),
      factor.weight,
    ])

  return (
    <Layout
      action={
        <Button onClick={() => navigate("/historial")} variant="secondary">
          <ArrowLeft size={15} />
          Volver al historial
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
        <Status tone="green">{evaluation.status_label}</Status>
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
          <div className="big-score big-score--amber">
            {results.score_5} <span>/ 5</span>
          </div>
          <small className="score-caption">
            Ponderación {results.global} · {results.percentage}% de la escala
          </small>
        </Section>
        <Section title="Recomendación de adopción">
          <Status tone={RECOMMENDATION_TONE[recommendation.code]}>
            {recommendation.code} · {recommendation.label}
          </Status>
          <div className="reason-list">
            {recommendation.reasons.map((reason) => (
              <span key={reason}>· {reason}</span>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Matriz FODA">
        <div className="swot">
          {swotItems.map(([title, items, tone]) => (
            <div className={`swot--${tone}`} key={title}>
              <strong>
                {title} · {items.length}
              </strong>
              <span>{items.length ? items.join(" · ") : "Sin aspectos en esta categoría"}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        action={
          <span className="annotation">
            {rows.length} factores relevantes · {evaluation.evaluator}
          </span>
        }
        title="Detalle de factores"
      >
        <DataTable
          headers={["Dimensión", "Factor", "IR", "PM", "FODA", "Peso"]}
          rows={rows}
        />
      </Section>

      <div className="page-actions">
        <Button onClick={() => navigate("/historial")} variant="secondary">
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
