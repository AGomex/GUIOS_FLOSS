import { AlertTriangle, CheckCircle2, RefreshCw, Save, Send } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import {
  api,
  type EvaluationDetail,
  type EvaluationFactor,
  type EvaluationPreview,
  type LiteratureRun,
  type ScoringSettings,
} from "@/lib/api"
import { Scale } from "./Scale"

type ScoreDraft = {
  ps: number | null
  source: string
  note: string
}

type ConfigDraft = {
  id_value: number
  scope: "interno" | "externo"
}

const SOURCE_OPTIONS = [
  "Observación directa",
  "Información del proveedor",
  "Experiencia previa",
  "Documentación técnica",
]

const FODA_TONE: Record<string, "green" | "blue" | "red" | "amber"> = {
  fortaleza: "green",
  oportunidad: "blue",
  debilidad: "red",
  amenaza: "amber",
}

function statusTone(status: string) {
  if (status === "finalizada") return "green"
  if (status === "en_evaluacion") return "blue"
  return "amber"
}

export function Calificacion() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null)
  const [settings, setSettings] = useState<ScoringSettings | null>(null)
  const [scores, setScores] = useState<Record<number, ScoreDraft>>({})
  const [config, setConfig] = useState<Record<number, ConfigDraft>>({})
  const [preview, setPreview] = useState<EvaluationPreview | null>(null)
  const [literatureRuns, setLiteratureRuns] = useState<LiteratureRun[]>([])
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [swapError, setSwapError] = useState<string | null>(null)
  const [swapMessage, setSwapMessage] = useState<string | null>(null)

  const hydrate = useCallback((target: EvaluationDetail) => {
    const scoreDraft: Record<number, ScoreDraft> = {}
    const configDraft: Record<number, ConfigDraft> = {}
    for (const factor of target.factors) {
      configDraft[factor.id] = {
        id_value: factor.id_value,
        scope: factor.scope,
      }
      for (const subfactor of factor.subfactors) {
        scoreDraft[subfactor.id] = {
          ps: subfactor.ps,
          source: subfactor.source,
          note: subfactor.note,
        }
      }
    }
    setEvaluation(target)
    setScores(scoreDraft)
    setConfig(configDraft)
    setDirty(false)
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let target: EvaluationDetail | null = null
        if (id) {
          target = await api.evaluation(Number(id))
        } else {
          const page = await api.evaluations()
          const pending = page.results.find(
            (item) =>
              item.status === "borrador" ||
              item.status === "en_evaluacion" ||
              item.status === "reabierta",
          )
          target = pending ? await api.evaluation(pending.id) : null
        }

        if (!target) {
          setEvaluation(null)
          return
        }

        hydrate(target)
        const [configuration, result, runPage] = await Promise.all([
          api.settings(),
          api.previewEvaluation(target.id),
          api.literatureRuns(),
        ])
        setSettings(configuration)
        setPreview(result)
        setLiteratureRuns(
          runPage.results.filter((run) => run.status === "completada"),
        )
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudo cargar la evaluación.",
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [hydrate, id])

  const persist = useCallback(async () => {
    if (!evaluation) return null
    await api.updateConfig(
      evaluation.id,
      Object.entries(config).map(([factor, value]) => ({
        factor: Number(factor),
        id_value: value.id_value,
        scope: value.scope,
      })),
    )
    await api.updateScores(
      evaluation.id,
      Object.entries(scores).map(([subfactor, value]) => ({
        subfactor: Number(subfactor),
        ps: value.ps,
        source: value.source,
        note: value.note,
      })),
    )
    const result = await api.previewEvaluation(evaluation.id)
    setPreview(result)
    setDirty(false)
    return result
  }, [config, evaluation, scores])

  // Vista previa automática: guarda y recalcula tras un breve silencio.
  useEffect(() => {
    if (!dirty || !evaluation || evaluation.status === "finalizada") return
    const timer = setTimeout(() => {
      setSaving(true)
      persist()
        .then(() => setError(null))
        .catch((caught) => {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudo guardar el avance.",
          )
          setDirty(false)
        })
        .finally(() => setSaving(false))
    }, 1200)
    return () => clearTimeout(timer)
  }, [dirty, evaluation, persist])

  const previewByCode = useMemo(() => {
    const map = new Map<string, EvaluationPreview["factors"][number]>()
    for (const factor of preview?.factors ?? []) {
      map.set(factor.code, factor)
    }
    return map
  }, [preview])

  const groups = useMemo(() => {
    const map = new Map<string, EvaluationFactor[]>()
    for (const factor of evaluation?.factors ?? []) {
      const list = map.get(factor.dimension_name) ?? []
      list.push(factor)
      map.set(factor.dimension_name, list)
    }
    return [...map.entries()]
  }, [evaluation])

  const requiredIds = useMemo(() => {
    const relevance = new Map<string, boolean>()
    for (const factor of evaluation?.factors ?? []) {
      relevance.set(factor.code, factor.is_relevant)
    }
    for (const factor of preview?.factors ?? []) {
      relevance.set(factor.code, factor.is_relevant)
    }
    const ids = new Set<number>()
    for (const factor of evaluation?.factors ?? []) {
      if (!relevance.get(factor.code)) continue
      for (const subfactor of factor.subfactors) ids.add(subfactor.id)
    }
    return ids
  }, [evaluation, preview])

  const requiredTotal = requiredIds.size
  const answered = [...requiredIds].filter(
    (subfactor) => scores[subfactor]?.ps != null,
  ).length
  const progress = requiredTotal
    ? Math.round((answered / requiredTotal) * 100)
    : 0
  const locked = evaluation?.status === "finalizada"

  function updateScore(subfactor: number, changes: Partial<ScoreDraft>) {
    setScores((current) => ({
      ...current,
      [subfactor]: {
        ps: current[subfactor]?.ps ?? null,
        source: current[subfactor]?.source ?? "",
        note: current[subfactor]?.note ?? "",
        ...changes,
      },
    }))
    setDirty(true)
    setMessage(null)
  }

  function updateConfig(factor: number, changes: Partial<ConfigDraft>) {
    setConfig((current) => ({
      ...current,
      [factor]: { ...current[factor], ...changes },
    }))
    setDirty(true)
    setMessage(null)
  }

  async function saveProgress() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await persist()
      setMessage("Avance guardado y vista previa recalculada.")
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo guardar el avance.",
      )
    } finally {
      setSaving(false)
    }
  }

  async function swapLiterature(value: string) {
    if (!evaluation) return
    setSwapping(true)
    setSwapError(null)
    setSwapMessage(null)
    const previous = evaluation
    const previousPreview = preview
    try {
      const updated = await api.swapEvaluationLiterature(
        evaluation.id,
        value ? Number(value) : null,
      )
      const beforeByCode = new Map(
        previous.factors.map((factor) => [factor.code, factor]),
      )
      let ilChanges = 0
      let scoreChanges = 0
      for (const factor of updated.factors) {
        const before = beforeByCode.get(factor.code)
        if (!before) continue
        if (before.il !== factor.il) ilChanges += 1
        if (before.is_value !== factor.is_value || before.ir !== factor.ir) {
          scoreChanges += 1
        }
      }
      hydrate(updated)
      const result = await api.previewEvaluation(updated.id)
      setPreview(result)

      const summary =
        ilChanges === 0 && scoreChanges === 0
          ? "Este juego produce los mismos valores calculados."
          : `${ilChanges} ${
              ilChanges === 1 ? "factor cambió" : "factores cambiaron"
            } IL y ${scoreChanges} ${
              scoreChanges === 1 ? "cambió" : "cambiaron"
            } IS/IR.`
      const globalNote = !previousPreview
        ? `Global ${result.global}.`
        : previousPreview.global === result.global
          ? `Global sin cambios (${result.global}).`
          : `Global ${previousPreview.global} → ${result.global}.`
      setSwapMessage(
        `Juego aplicado: ${updated.literature_run_label}. ${summary} ${globalNote}`,
      )
    } catch (caught) {
      setSwapError(
        caught instanceof Error
          ? caught.message
          : "No se pudo cambiar el juego de literatura.",
      )
    } finally {
      setSwapping(false)
    }
  }

  async function finish() {
    if (!evaluation) return
    setFinalizing(true)
    setError(null)
    setMessage(null)
    try {
      await persist()
      await api.finalizeEvaluation(evaluation.id)
      navigate(`/resultados/${evaluation.id}`)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo finalizar la evaluación.",
      )
    } finally {
      setFinalizing(false)
    }
  }

  if (loading) {
    return (
      <Layout screen="scoring">
        <Section title="Calificación">
          <p className="annotation">Cargando evaluación…</p>
        </Section>
      </Layout>
    )
  }

  if (!evaluation) {
    return (
      <Layout screen="scoring">
        <Section title="Calificación">
          <p className="annotation">
            No hay evaluaciones en curso. Crea una nueva evaluación para comenzar.
          </p>
          <div className="page-actions">
            <Button onClick={() => navigate("/evaluaciones/nueva")}>
              Nueva evaluación
            </Button>
          </div>
        </Section>
      </Layout>
    )
  }

  const min = evaluation.scale_min ?? settings?.scale_min ?? 1
  const max = evaluation.scale_max ?? settings?.scale_max ?? 4

  return (
    <Layout
      action={
        <Button
          disabled={saving || locked}
          onClick={() => void saveProgress()}
          variant="secondary"
        >
          <Save size={15} />
          {saving ? "Guardando…" : "Guardar avance"}
        </Button>
      }
      screen="scoring"
    >
      <Section className="evaluation-summary">
        <div>
          <span className="eyebrow">Software</span>
          <strong>{evaluation.software_label}</strong>
        </div>
        <div>
          <span className="eyebrow">Necesidad</span>
          <strong>{evaluation.need}</strong>
        </div>
        <Status tone={statusTone(evaluation.status)}>
          {evaluation.status_label}
        </Status>
        <div className="progress-wrap">
          <div className="progress-label">
            <span>
              Avance · {answered} de {requiredTotal}
            </span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </Section>

      <Section title="Importancia de la literatura">
        <div className="literature-swap">
          <label className="field">
            <span>Juego de valores</span>
            <select
              disabled={locked || swapping}
              onChange={(event) => void swapLiterature(event.target.value)}
              value={evaluation.literature_run ? String(evaluation.literature_run) : ""}
            >
              <option value="">Base del estudio</option>
              {literatureRuns.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.label} · {run.totals.relevant} artículos
                </option>
              ))}
            </select>
          </label>
          <p className="body-copy literature-swap__note">
            {evaluation.literature_run ? (
              <>
                Usando la corrida IA:{" "}
                <strong>{evaluation.literature_run_label}</strong>.
              </>
            ) : (
              "Usando los valores base de importancia de la literatura."
            )}{" "}
            Al cambiar el juego se recalculan IS, IR y el peso de cada factor. Las
            calificaciones ya registradas se conservan.
          </p>
        </div>
        {swapping && (
          <div className="form-message">Aplicando juego de literatura…</div>
        )}
        {swapError && (
          <div className="form-message form-message--error">{swapError}</div>
        )}
        {swapMessage && (
          <div className="form-message form-message--ok">{swapMessage}</div>
        )}
      </Section>

      <Section
        action={
          <Button
            disabled={saving || locked}
            onClick={() => void saveProgress()}
            variant="secondary"
          >
            <RefreshCw size={14} />
            Recalcular
          </Button>
        }
        title="Vista previa del cálculo"
      >
        <div className="preview-grid">
          <div className="preview-card">
            <span>Resultado global</span>
            <strong>{preview?.global ?? "—"}</strong>
            <small>Escala {min}–{max}</small>
          </div>
          <div className="preview-card">
            <span>Equivalente 1–5</span>
            <strong>{preview?.score_5 ?? "—"}</strong>
            <small>{preview?.percentage ? `${preview.percentage}%` : "Sin datos"}</small>
          </div>
          <div className="preview-card">
            <span>Recomendación</span>
            <strong>{preview?.recommendation.code ?? "—"}</strong>
            <small>{preview?.recommendation.label ?? "Sin datos"}</small>
          </div>
          <div className="preview-card">
            <span>Factores pendientes</span>
            <strong>{preview?.pending ?? 0}</strong>
            <small>Requieren calificación</small>
          </div>
        </div>
        {preview && (
          <div className="preview-note">
            <span>
              FODA: {preview.swot.fortalezas.length} fortalezas ·{" "}
              {preview.swot.oportunidades.length} oportunidades ·{" "}
              {preview.swot.debilidades.length} debilidades ·{" "}
              {preview.swot.amenazas.length} amenazas
            </span>
            {preview.recommendation.reasons.map((reason) => (
              <span key={reason}>· {reason}</span>
            ))}
          </div>
        )}
        {error && <div className="form-message form-message--error">{error}</div>}
        {message && <div className="form-message form-message--ok">{message}</div>}
        {locked && (
          <div className="form-message form-message--ok">
            Esta evaluación está finalizada. Consulta sus resultados.
          </div>
        )}
      </Section>

      <Section
        action={<span className="annotation">Escala de cumplimiento {min}–{max}</span>}
        title="Calificación de criterios"
      >
        <div className="score-head">
          <span>Dimensión / Factor / Subfactor</span>
          <span>Calificación</span>
          <span>Fuente</span>
          <span>Observación</span>
        </div>
        {groups.map(([dimension, factors]) => (
          <div className="factor-group" key={dimension}>
            <div className="score-group">
              <strong>{dimension}</strong>
              <span>{factors.length} factores</span>
            </div>
            {factors.map((factor) => {
              const result = previewByCode.get(factor.code)
              const factorConfig = config[factor.id]
              return (
                <div className="factor-block" key={factor.id}>
                  <div className="factor-head">
                    <div>
                      <strong>{factor.name}</strong>
                      <small>
                        NS {factor.ns} · <b>TC {factor.tc}</b> · IL {factor.il} · IS{" "}
                        {factor.is_value} · IR {result?.ir ?? factor.ir} · peso{" "}
                        {result?.weight ?? factor.weight}
                      </small>
                    </div>
                    <label className="factor-control">
                      <span>ID</span>
                      <select
                        disabled={locked}
                        onChange={(event) =>
                          updateConfig(factor.id, {
                            id_value: Number(event.target.value),
                          })
                        }
                        value={factorConfig?.id_value ?? factor.id_value}
                      >
                        {Array.from(
                          { length: max - min + 1 },
                          (_, index) => min + index,
                        ).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="factor-control">
                      <span>Alcance</span>
                      <select
                        disabled={locked}
                        onChange={(event) =>
                          updateConfig(factor.id, {
                            scope: event.target.value as "interno" | "externo",
                          })
                        }
                        value={factorConfig?.scope ?? factor.scope}
                      >
                        <option value="interno">Interno</option>
                        <option value="externo">Externo</option>
                      </select>
                    </label>
                    <div className="factor-result">
                      {result?.foda ? (
                        <Status tone={FODA_TONE[result.foda] ?? "neutral"}>
                          {result.foda_label}
                        </Status>
                      ) : (
                        <Status tone="neutral">Sin calcular</Status>
                      )}
                      <small>PM {result?.pm ?? "—"}</small>
                    </div>
                  </div>
                  {factor.subfactors.map((subfactor) => {
                    const draft = scores[subfactor.id]
                    return (
                      <div className="score-row" key={subfactor.id}>
                        <span>{subfactor.text}</span>
                        <Scale
                          disabled={locked}
                          max={max}
                          min={min}
                          onChange={(value) =>
                            updateScore(subfactor.id, { ps: value })
                          }
                          value={draft?.ps ?? null}
                        />
                        <select
                          disabled={locked}
                          onChange={(event) =>
                            updateScore(subfactor.id, {
                              source: event.target.value,
                            })
                          }
                          value={draft?.source ?? ""}
                        >
                          <option value="">Seleccionar fuente</option>
                          {SOURCE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <input
                          disabled={locked}
                          onChange={(event) =>
                            updateScore(subfactor.id, {
                              note: event.target.value,
                            })
                          }
                          placeholder="Observación (opcional)"
                          value={draft?.note ?? ""}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </Section>

      <div className="finish-bar">
        <span>
          {answered < requiredTotal ? (
            <>
              <AlertTriangle size={15} /> Quedan{" "}
              <strong>{requiredTotal - answered} subfactores</strong> relevantes sin
              calificar. Puedes guardar el avance y continuar después.
            </>
          ) : (
            <>
              <CheckCircle2 size={15} /> Todos los subfactores relevantes están
              calificados. Revisa la vista previa antes de finalizar.
            </>
          )}
        </span>
        <div className="button-row">
          <Button
            disabled={saving || locked}
            onClick={() => void saveProgress()}
            variant="secondary"
          >
            <Save size={15} />
            {saving ? "Guardando…" : "Guardar avance"}
          </Button>
          <Button
            disabled={
              saving ||
              finalizing ||
              locked ||
              answered < requiredTotal
            }
            onClick={() => void finish()}
          >
            <Send size={15} />
            {finalizing ? "Finalizando…" : "Finalizar evaluación"}
          </Button>
        </div>
      </div>
    </Layout>
  )
}
