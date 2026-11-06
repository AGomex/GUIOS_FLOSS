import {
  Boxes,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { DashboardBars } from "@/components/charts/DashboardBars"
import { RecommendationDonut } from "@/components/charts/RecommendationDonut"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import { api, type DashboardSummary } from "@/lib/api"

const RECOMMENDATION_TONE = {
  A: "green",
  B: "amber",
  C: "red",
} as const

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("es-EC", {
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

export function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        setSummary(await api.dashboardSummary())
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudo cargar el dashboard.",
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const action = (
    <Button onClick={() => navigate("/evaluaciones/nueva")}>
      <Plus size={16} />
      Nueva evaluación
    </Button>
  )

  if (loading) {
    return (
      <Layout action={action} screen="dashboard">
        <Section title="Dashboard">
          <p className="annotation">Cargando indicadores…</p>
        </Section>
      </Layout>
    )
  }

  if (error || !summary) {
    return (
      <Layout action={action} screen="dashboard">
        <Section title="Dashboard">
          <p className="form-message form-message--error">
            {error ?? "No hay datos disponibles."}
          </p>
        </Section>
      </Layout>
    )
  }

  const inProgress =
    summary.evaluations.draft +
    summary.evaluations.in_progress +
    summary.evaluations.reopened

  const metrics: [string, string, LucideIcon][] = [
    ["Softwares registrados", String(summary.softwares.total), Boxes],
    ["Softwares evaluados", String(summary.softwares.evaluated), CheckCircle2],
    ["Evaluaciones en curso", String(inProgress), Clock3],
    ["Evaluaciones finalizadas", String(summary.evaluations.finished), ShieldCheck],
  ]

  const bars = [
    { label: "Borrador", value: summary.evaluations.draft, tone: "neutral" as const },
    {
      label: "En evaluación",
      value: summary.evaluations.in_progress,
      tone: "blue" as const,
    },
    {
      label: "Finalizadas",
      value: summary.evaluations.finished,
      tone: "green" as const,
    },
    {
      label: "Reabiertas",
      value: summary.evaluations.reopened,
      tone: "amber" as const,
    },
    {
      label: "Canceladas",
      value: summary.evaluations.cancelled,
      tone: "red" as const,
    },
  ]

  const recent = summary.recent
  const rows = recent.map((item) => [
    <div className="cell-stack" key={`${item.id}-software`}>
      <span>
        {item.software} v{item.software_version}
      </span>
      <small>
        {item.code} · {item.provider}
      </small>
    </div>,
    item.score_5 ? (
      <strong
        className={`score score--${scoreTone(Number(item.score_5))}`}
        key={`${item.id}-score`}
      >
        {item.score_5}
      </strong>
    ) : (
      "—"
    ),
    item.recommendation ? (
      <Status
        key={`${item.id}-recommendation`}
        tone={RECOMMENDATION_TONE[item.recommendation]}
      >
        {item.recommendation_label}
      </Status>
    ) : (
      <Status key={`${item.id}-recommendation`} tone="blue">
        {item.status_label}
      </Status>
    ),
    formatDate(item.updated_at),
  ])

  return (
    <Layout action={action} screen="dashboard">
      <div className="metric-grid">
        {metrics.map(([label, value, Icon]) => (
          <div className="metric" key={label}>
            <div className="metric__icon">
              <Icon size={20} />
            </div>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <Section title="Evaluaciones por estado">
            <DashboardBars bars={bars} />
          </Section>
          <Section
            action={
              <span className="annotation">
                Promedio {summary.average_score ?? "—"} / 5
              </span>
            }
            title="Distribución de recomendaciones"
          >
            <RecommendationDonut counts={summary.recommendations} />
          </Section>
        </div>
        <Section
          action={
            <span className="annotation">
              {summary.evaluations.total} evaluaciones registradas
            </span>
          }
          title="Resultados recientes"
        >
          {recent.length === 0 ? (
            <p className="annotation">
              Todavía no hay evaluaciones registradas.
            </p>
          ) : (
            <DataTable
              headers={["Software", "Resultado", "Recomendación", "Fecha"]}
              onRowClick={(index) => {
                const item = recent[index]
                if (!item) return
                navigate(
                  item.score_5
                    ? `/resultados/${item.id}`
                    : `/calificacion/${item.id}`,
                )
              }}
              rows={rows}
            />
          )}
        </Section>
      </div>
    </Layout>
  )
}
