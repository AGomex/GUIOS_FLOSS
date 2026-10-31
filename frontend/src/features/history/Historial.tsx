import { ClipboardList, Plus, RotateCcw, SlidersHorizontal } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import {
  api,
  type EvaluationLog,
  type EvaluationStatus,
  type EvaluationSummary,
  type Software,
} from "@/lib/api"

const STATUS_TONE: Record<
  EvaluationStatus,
  "neutral" | "green" | "amber" | "red" | "blue"
> = {
  borrador: "neutral",
  en_evaluacion: "blue",
  finalizada: "green",
  reabierta: "amber",
  cancelada: "red",
}

const STATUS_OPTIONS = [
  { value: "borrador", label: "Borrador" },
  { value: "en_evaluacion", label: "En evaluación" },
  { value: "finalizada", label: "Finalizada" },
  { value: "reabierta", label: "Reabierta" },
  { value: "cancelada", label: "Cancelada" },
]

function formatDate(value: string, withTime = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  const day = date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  if (!withTime) return day
  const time = date.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${day} · ${time}`
}

function scoreTone(score: number) {
  if (score >= 4) return "green"
  if (score >= 3) return "amber"
  return "red"
}

export function Historial() {
  const navigate = useNavigate()
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([])
  const [softwares, setSoftwares] = useState<Software[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [logs, setLogs] = useState<EvaluationLog[]>([])
  const [search, setSearch] = useState("")
  const [softwareFilter, setSoftwareFilter] = useState("")
  const [evaluatorFilter, setEvaluatorFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reopening, setReopening] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [reopenError, setReopenError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [page, softwarePage] = await Promise.all([
          api.evaluations(),
          api.softwares(),
        ])
        setEvaluations(page.results)
        setSoftwares(softwarePage.results)
        setSelectedId(page.results[0]?.id ?? null)
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudo cargar el historial.",
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (selectedId === null) {
      setLogs([])
      return
    }

    let cancelled = false
    api
      .evaluationLogs(selectedId)
      .then((items) => {
        if (!cancelled) setLogs(items)
      })
      .catch(() => {
        if (!cancelled) setLogs([])
      })

    return () => {
      cancelled = true
    }
  }, [selectedId])

  useEffect(() => {
    setReason("")
    setNotice(null)
    setReopenError(null)
  }, [selectedId])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return evaluations.filter((item) => {
      const matchesSearch =
        !term ||
        [item.code, item.software_label, item.evaluator, item.organization]
          .join(" ")
          .toLowerCase()
          .includes(term)
      const matchesSoftware =
        !softwareFilter || String(item.software) === softwareFilter
      const matchesEvaluator =
        !evaluatorFilter || item.evaluator === evaluatorFilter
      const matchesStatus = !statusFilter || item.status === statusFilter
      return (
        matchesSearch && matchesSoftware && matchesEvaluator && matchesStatus
      )
    })
  }, [evaluations, evaluatorFilter, search, softwareFilter, statusFilter])

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null)
      return
    }
    if (!filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  const selected = useMemo(
    () => evaluations.find((item) => item.id === selectedId) ?? null,
    [evaluations, selectedId],
  )

  const evaluatorOptions = useMemo(
    () =>
      [...new Set(evaluations.map((item) => item.evaluator))]
        .sort((left, right) => left.localeCompare(right))
        .map((name) => ({ value: name, label: name })),
    [evaluations],
  )

  const softwareOptions = useMemo(
    () =>
      softwares.map((software) => ({
        value: String(software.id),
        label: `${software.name} v${software.version}`,
      })),
    [softwares],
  )

  const activeRow = filtered.findIndex((item) => item.id === selectedId)

  async function handleReopen() {
    if (!selected || reason.trim().length < 5) return
    setReopening(true)
    setNotice(null)
    setReopenError(null)
    try {
      const updated = await api.reopenEvaluation(selected.id, reason.trim())
      setEvaluations((current) =>
        current.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item,
        ),
      )
      setLogs(await api.evaluationLogs(updated.id))
      setReason("")
      if (statusFilter === "finalizada") setStatusFilter("")
      setNotice(
        `Evaluación ${updated.code} reabierta. Ya puede corregir la calificación.`,
      )
    } catch (caught) {
      setReopenError(
        caught instanceof Error
          ? caught.message
          : "No se pudo reabrir la evaluación.",
      )
    } finally {
      setReopening(false)
    }
  }

  const rows = filtered.map((item) => [
    <strong key={`${item.id}-code`}>{item.code}</strong>,
    <div className="cell-stack" key={`${item.id}-software`}>
      <span>{item.software_label}</span>
      <small>{item.provider_name}</small>
    </div>,
    item.evaluator,
    <Status key={`${item.id}-status`} tone={STATUS_TONE[item.status]}>
      {item.status_label}
    </Status>,
    item.score_5 ? (
      <span
        className={`score score--${scoreTone(Number(item.score_5))}`}
        key={`${item.id}-score`}
      >
        {item.score_5}
      </span>
    ) : (
      "—"
    ),
    item.recommendation ? (
      <span className="cell-stack" key={`${item.id}-rec`}>
        <strong>{item.recommendation}</strong>
        <small>{item.recommendation_label}</small>
      </span>
    ) : (
      "—"
    ),
    formatDate(item.created_at),
  ])

  return (
    <Layout
      action={
        <div className="header-actions">
          <Button
            onClick={() => navigate("/evaluaciones/nueva")}
            variant="secondary"
          >
            <Plus size={15} />
            Nueva evaluación
          </Button>
          <Button onClick={() => navigate("/comparacion")}>
            <SlidersHorizontal size={15} />
            Comparar
          </Button>
        </div>
      }
      screen="history"
    >
      <div className="split-panel split-panel--history">
        <div className="split-panel__main">
          <div className="filters filters--history">
            <Field
              label="Buscar"
              onChange={setSearch}
              placeholder="Código, software, evaluador"
              value={search}
            />
            <Field
              kind="select"
              label="Software"
              onChange={setSoftwareFilter}
              options={softwareOptions}
              placeholder="Todos"
              value={softwareFilter}
            />
            <Field
              kind="select"
              label="Evaluador"
              onChange={setEvaluatorFilter}
              options={evaluatorOptions}
              placeholder="Todos"
              value={evaluatorFilter}
            />
            <Field
              kind="select"
              label="Estado"
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              placeholder="Todos"
              value={statusFilter}
            />
          </div>

          <Section
            action={
              <span className="annotation">
                {filtered.length} de {evaluations.length} evaluaciones
              </span>
            }
            title="Evaluaciones"
          >
            {loading ? (
              <p className="annotation">Cargando historial…</p>
            ) : error ? (
              <p className="form-message form-message--error">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="annotation">
                No hay evaluaciones que coincidan con los filtros.
              </p>
            ) : (
              <DataTable
                activeRow={activeRow}
                headers={[
                  "Código",
                  "Software",
                  "Evaluador",
                  "Estado",
                  "Resultado",
                  "Recomendación",
                  "Fecha",
                ]}
                onRowClick={(index) =>
                  setSelectedId(filtered[index]?.id ?? null)
                }
                rows={rows}
              />
            )}
          </Section>
        </div>

        <aside className="drawer drawer--detail">
          <h2>Detalle</h2>
          {!selected ? (
            <p className="annotation">
              Seleccione una evaluación para ver su bitácora.
            </p>
          ) : (
            <>
              <span className="eyebrow">
                {selected.code} · {selected.software_label}
              </span>

              <div className="detail-meta">
                <div>
                  <span>Estado</span>
                  <Status tone={STATUS_TONE[selected.status]}>
                    {selected.status_label}
                  </Status>
                </div>
                <div>
                  <span>Evaluador</span>
                  <strong>{selected.evaluator}</strong>
                </div>
                <div>
                  <span>Organización</span>
                  <strong>{selected.organization || "—"}</strong>
                </div>
                <div>
                  <span>Registro</span>
                  <strong>{formatDate(selected.created_at, true)}</strong>
                </div>
                <div>
                  <span>Resultado</span>
                  <strong>
                    {selected.score_5 ? `${selected.score_5} / 5` : "—"}
                  </strong>
                </div>
                <div>
                  <span>Recomendación</span>
                  <strong>
                    {selected.recommendation
                      ? `${selected.recommendation} · ${selected.recommendation_label}`
                      : "—"}
                  </strong>
                </div>
              </div>

              <div className="drawer-actions">
                {selected.score_5 && (
                  <Button
                    onClick={() => navigate(`/resultados/${selected.id}`)}
                    variant="secondary"
                  >
                    Ver resultados
                  </Button>
                )}
                {selected.status !== "finalizada" && (
                  <Button
                    onClick={() => navigate(`/calificacion/${selected.id}`)}
                    variant="secondary"
                  >
                    <ClipboardList size={15} />
                    Abrir calificación
                  </Button>
                )}
              </div>

              <h3>Bitácora de cambios</h3>
              <div className="log-list">
                {logs.length === 0 ? (
                  <div>
                    <span>Sin movimientos registrados.</span>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id}>
                      <strong>
                        {log.action_label} · {formatDate(log.created_at, true)}
                      </strong>
                      <span>{log.actor || "—"}</span>
                      <small>{log.description || "—"}</small>
                      {log.reason && <small>Motivo: {log.reason}</small>}
                    </div>
                  ))
                )}
              </div>

              {selected.status === "finalizada" ? (
                <>
                  <label className="field">
                    <span>Motivo para reabrir</span>
                    <textarea
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Obligatorio, mínimo 5 caracteres"
                      rows={2}
                      value={reason}
                    />
                  </label>
                  {reopenError && (
                    <p className="form-message form-message--error">
                      {reopenError}
                    </p>
                  )}
                  {notice && (
                    <p className="form-message form-message--ok">{notice}</p>
                  )}
                  <Button
                    disabled={reason.trim().length < 5 || reopening}
                    onClick={handleReopen}
                  >
                    <RotateCcw size={15} />
                    {reopening ? "Reabriendo…" : "Reabrir evaluación"}
                  </Button>
                </>
              ) : selected.status === "reabierta" ? (
                <div className="notice">
                  <RotateCcw size={16} />
                  La evaluación está reabierta. Corrija la calificación y
                  vuelva a finalizarla.
                </div>
              ) : (
                <p className="annotation">
                  Solo las evaluaciones finalizadas se pueden reabrir.
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </Layout>
  )
}
