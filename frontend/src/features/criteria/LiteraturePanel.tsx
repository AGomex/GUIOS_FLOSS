import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { Fragment, useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/Button"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import {
  api,
  type LiteratureConfig,
  type LiteratureProvider,
  type LiteratureRun,
  type LiteratureRunDetail,
  type LiteratureRunStatus,
  type LiteratureSearchDetail,
} from "@/lib/api"

type LiteratureForm = {
  provider: LiteratureProvider
  year_from: string
  year_to: string
  max_candidates: string
}

const EMPTY_FORM: LiteratureForm = {
  provider: "mock",
  year_from: "2020",
  year_to: "2026",
  max_candidates: "25",
}

function runTone(status: LiteratureRunStatus) {
  if (status === "completada") return "green"
  if (status === "fallida") return "red"
  if (status === "ejecutando") return "blue"
  return "amber"
}

function importanceTone(value: number) {
  if (value >= 4) return "green"
  if (value === 3) return "amber"
  if (value === 2) return "blue"
  return "neutral"
}

function isActive(status: LiteratureRunStatus | undefined) {
  return status === "pendiente" || status === "ejecutando"
}

export function LiteraturePanel() {
  const [config, setConfig] = useState<LiteratureConfig | null>(null)
  const [runs, setRuns] = useState<LiteratureRun[]>([])
  const [detail, setDetail] = useState<LiteratureRunDetail | null>(null)
  const [form, setForm] = useState<LiteratureForm>(EMPTY_FORM)
  const [articles, setArticles] = useState<Record<string, LiteratureSearchDetail>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [onlyRelevant, setOnlyRelevant] = useState(true)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const refreshRuns = useCallback(async () => {
    const page = await api.literatureRuns()
    setRuns(page.results)
  }, [])

  const selectRun = useCallback(async (runId: number) => {
    setError(null)
    setMessage(null)
    setExpanded(null)
    setArticles({})
    try {
      const data = await api.literatureRun(runId)
      setDetail(data)
      setStarting(isActive(data.status))
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo cargar la corrida.",
      )
    }
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [configuration, page] = await Promise.all([
          api.literatureConfig(),
          api.literatureRuns(),
        ])
        setConfig(configuration)
        setForm({
          provider: configuration.provider,
          year_from: String(configuration.year_from),
          year_to: String(configuration.year_to),
          max_candidates: String(configuration.max_candidates),
        })
        setRuns(page.results)
        if (page.results.length > 0) {
          const first = await api.literatureRun(page.results[0].id)
          setDetail(first)
          setStarting(isActive(first.status))
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudo cargar la configuración de literatura.",
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const running = isActive(detail?.status)
  const detailId = detail?.id

  // Sondeo del estado mientras la corrida se ejecuta en el servidor.
  useEffect(() => {
    if (!detailId || !running) return
    const runId = detailId
    const timer = setInterval(() => {
      void (async () => {
        try {
          const updated = await api.literatureRun(runId)
          setDetail(updated)
          if (updated.status === "completada") {
            setStarting(false)
            setMessage(
              `Corrida completada: ${updated.totals.relevant} artículos pertinentes para los 18 factores.`,
            )
            void refreshRuns()
          } else if (updated.status === "fallida") {
            setStarting(false)
            setError(updated.error || "La corrida de literatura falló.")
            void refreshRuns()
          }
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudo consultar el estado de la corrida.",
          )
        }
      })()
    }, 2500)
    return () => clearInterval(timer)
  }, [detailId, running, refreshRuns])

  const providerOption = useMemo(
    () => config?.providers.find((item) => item.value === form.provider) ?? null,
    [config, form.provider],
  )

  const providerBlocked =
    form.provider !== "mock" && providerOption !== null && !providerOption.configured

  const totals = useMemo(() => {
    const searches = detail?.searches ?? []
    return {
      retrieved: searches.reduce((total, item) => total + item.retrieved, 0),
      relevant: searches.reduce((total, item) => total + item.relevant, 0),
    }
  }, [detail])

  const percent =
    detail && detail.factors_total
      ? Math.round((detail.factors_done / detail.factors_total) * 100)
      : 0

  async function toggleFactor(code: string) {
    if (expanded === code) {
      setExpanded(null)
      return
    }
    setExpanded(code)
    if (!detail || articles[code]) return
    try {
      const data = await api.literatureFactor(detail.id, code)
      setArticles((current) => ({ ...current, [code]: data }))
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar los artículos del factor.",
      )
    }
  }

  async function start() {
    if (!config) return
    const label = providerOption?.label ?? form.provider
    const confirmed = window.confirm(
      `Se buscarán artículos científicos (${form.year_from}–${form.year_to}) ` +
        `para los 18 factores y se clasificará su pertinencia con ${label}. ` +
        "El cálculo reemplaza el TC de la tesis para esta corrida y puede tardar " +
        "varios minutos. ¿Deseas continuar?",
    )
    if (!confirmed) return

    setStarting(true)
    setError(null)
    setMessage(null)
    setExpanded(null)
    setArticles({})
    try {
      const run = await api.createLiteratureRun({
        provider: form.provider,
        year_from: Number(form.year_from),
        year_to: Number(form.year_to),
        max_candidates: Number(form.max_candidates),
      })
      setDetail(run)
      setMessage("Corrida iniciada. Los resultados se actualizarán automáticamente.")
      void refreshRuns()
    } catch (caught) {
      setStarting(false)
      setError(
        caught instanceof Error ? caught.message : "No se pudo iniciar la corrida.",
      )
    }
  }

  const disabledStart = loading || starting || running || providerBlocked

  return (
    <Section
      action={
        <span className="literature-badge">
          <Sparkles size={13} />
          Búsqueda asistida por IA
        </span>
      }
      title="Importancia de la literatura con IA"
    >
      <p className="body-copy">
        Analiza la literatura científica reciente para medir qué tan respaldado
        está cada factor. Recupera artículos de 2020 a 2026, descarta los que no
        abordan el tema y cuenta los pertinentes: ese total es el TC del factor.
        Con los 18 valores se calcula el IL por cuartiles de{" "}
        <strong>TC / NS</strong>. El resultado es un juego de valores alternativo
        que solo se aplica si lo eliges al crear o calificar una evaluación.
      </p>

      <div className="literature-form">
        <label className="field">
          <span>Proveedor</span>
          <select
            disabled={starting || running || loading}
            onChange={(event) =>
              setForm({ ...form, provider: event.target.value as LiteratureProvider })
            }
            value={form.provider}
          >
            {(config?.providers ?? []).map((option) => (
              <option
                disabled={option.value !== "mock" && !option.configured}
                key={option.value}
                value={option.value}
              >
                {option.label} · {option.model}
                {option.value !== "mock" && !option.configured ? " (sin clave)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Año inicial</span>
          <input
            disabled={starting || running || loading}
            onChange={(event) => setForm({ ...form, year_from: event.target.value })}
            type="number"
            value={form.year_from}
          />
        </label>
        <label className="field">
          <span>Año final</span>
          <input
            disabled={starting || running || loading}
            onChange={(event) => setForm({ ...form, year_to: event.target.value })}
            type="number"
            value={form.year_to}
          />
        </label>
        <label className="field">
          <span>Candidatos por factor</span>
          <input
            disabled={starting || running || loading}
            onChange={(event) =>
              setForm({ ...form, max_candidates: event.target.value })
            }
            type="number"
            value={form.max_candidates}
          />
        </label>
        <Button disabled={disabledStart} onClick={() => void start()}>
          <Sparkles size={15} />
          {starting || running ? "Calculando…" : "Actualizar los 18 factores"}
        </Button>
      </div>

      {providerBlocked && (
        <div className="form-message form-message--error">
          El proveedor {providerOption?.label} no tiene clave configurada. Agrega la
          clave en el archivo <code>.env</code> o usa el modo heurístico.
        </div>
      )}
      {message && <div className="form-message form-message--ok">{message}</div>}
      {error && <div className="form-message form-message--error">{error}</div>}

      {detail && (
        <>
          {running && (
            <div className="literature-progress">
              <div className="progress-label">
                <span>
                  Procesando factores… {detail.factors_done} de{" "}
                  {detail.factors_total || 18}
                </span>
                <strong>{percent}%</strong>
              </div>
              <div className="progress">
                <span style={{ width: `${percent}%` }} />
              </div>
              <p className="literature-hint">
                La corrida se ejecuta en el servidor. Puedes seguir usando el sistema
                mientras termina.
              </p>
            </div>
          )}

          <div className="preview-grid literature-summary">
            <div className="preview-card">
              <span>Proveedor</span>
              <strong className="literature-summary__text">
                {detail.provider_label}
              </strong>
              <small>{detail.model}</small>
            </div>
            <div className="preview-card">
              <span>Artículos pertinentes</span>
              <strong>{totals.relevant}</strong>
              <small>{totals.retrieved} recuperados en total</small>
            </div>
            <div className="preview-card">
              <span>TC tesis → IA</span>
              <strong>
                {detail.totals.before} → {detail.totals.after}
              </strong>
              <small>Suma de los 18 factores</small>
            </div>
            <div className="preview-card">
              <span>Cuartiles TC / NS</span>
              <strong className="literature-summary__text">
                {detail.quartiles.q1 != null
                  ? Number(detail.quartiles.q1).toFixed(2)
                  : "—"}{" "}
                ·{" "}
                {detail.quartiles.q2 != null
                  ? Number(detail.quartiles.q2).toFixed(2)
                  : "—"}{" "}
                ·{" "}
                {detail.quartiles.q3 != null
                  ? Number(detail.quartiles.q3).toFixed(2)
                  : "—"}
              </strong>
              <small>Cortes que asignan IL 1–4</small>
            </div>
          </div>

          {detail.searches.length > 0 && (
            <div className="table-wrap literature-table">
              <table>
                <thead>
                  <tr>
                    <th>Factor</th>
                    <th>Recuperados</th>
                    <th>Pertinentes</th>
                    <th>TC tesis</th>
                    <th>TC IA</th>
                    <th>IL tesis</th>
                    <th>IL IA</th>
                    <th>Artículos</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.searches.map((search) => (
                    <Fragment key={search.id}>
                      <tr
                        className="row--clickable"
                        onClick={() => void toggleFactor(search.factor_code)}
                      >
                        <td>
                          <span className="cell-stack">
                            <strong>{search.factor_name}</strong>
                            <small>{search.dimension_name}</small>
                          </span>
                        </td>
                        <td>{search.retrieved}</td>
                        <td>{search.relevant}</td>
                        <td>{search.tc_before}</td>
                        <td>
                          <strong>{search.tc_after}</strong>
                        </td>
                        <td>{search.il_before}</td>
                        <td>
                          <Status tone={importanceTone(search.il_after)}>
                            {search.il_after}
                          </Status>
                        </td>
                        <td>
                          <span className="table-actions">
                            {expanded === search.factor_code ? (
                              <ChevronUp size={13} />
                            ) : (
                              <ChevronDown size={13} />
                            )}
                            {expanded === search.factor_code ? "Ocultar" : "Ver"}
                          </span>
                        </td>
                      </tr>
                      {expanded === search.factor_code && (
                        <tr className="literature-articles-row">
                          <td colSpan={8}>
                            <FactorArticles
                              data={articles[search.factor_code]}
                              onlyRelevant={onlyRelevant}
                              onToggleRelevant={() => setOnlyRelevant(!onlyRelevant)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {detail.status === "fallida" && detail.error && (
            <div className="form-message form-message--error">{detail.error}</div>
          )}
        </>
      )}

      {runs.length > 0 && (
        <>
          <h3 className="literature-subtitle">Corridas registradas</h3>
          <div className="literature-history">
            {runs.map((run) => (
              <button
                className={`literature-history__item ${
                  detail?.id === run.id ? "literature-history__item--active" : ""
                }`}
                key={run.id}
                onClick={() => void selectRun(run.id)}
                type="button"
              >
                <span className="cell-stack">
                  <strong>{run.label}</strong>
                  <small>
                    {run.provider_label} · {run.model} · {run.year_from}–{run.year_to}
                  </small>
                </span>
                <Status tone={runTone(run.status)}>{run.status_label}</Status>
                <small>{run.totals.relevant} pertinentes</small>
              </button>
            ))}
          </div>
        </>
      )}

      {!loading && runs.length === 0 && !detail && (
        <p className="literature-hint">
          Aún no hay corridas. Configura el proveedor y pulsa el botón para generar el
          primer juego de valores IA.
        </p>
      )}
    </Section>
  )
}

function FactorArticles({
  data,
  onlyRelevant,
  onToggleRelevant,
}: {
  data: LiteratureSearchDetail | undefined
  onlyRelevant: boolean
  onToggleRelevant: () => void
}) {
  if (!data) {
    return (
      <p className="literature-hint">
        <RefreshCw size={12} /> Cargando artículos…
      </p>
    )
  }

  const visible = onlyRelevant
    ? data.articles.filter((article) => article.is_relevant)
    : data.articles

  return (
    <div className="literature-articles">
      <div className="literature-articles__head">
        <span>
          {data.retrieved} recuperados · {data.relevant} pertinentes
        </span>
        <label className="check-label">
          <input
            checked={onlyRelevant}
            onChange={onToggleRelevant}
            type="checkbox"
          />
          Solo pertinentes
        </label>
      </div>
      {visible.length === 0 ? (
        <p className="literature-hint">No hay artículos para este filtro.</p>
      ) : (
        visible.map((article) => (
          <article className="literature-article" key={article.id}>
            <div className="literature-article__head">
              {article.url ? (
                <a href={article.url} rel="noreferrer" target="_blank">
                  {article.title}
                  <ExternalLink size={11} />
                </a>
              ) : (
                <strong>{article.title}</strong>
              )}
              <Status tone={article.is_relevant ? "green" : "neutral"}>
                {article.is_relevant ? "Pertinente" : "Descartado"}
              </Status>
            </div>
            <small>
              {[article.year, article.venue, article.authors]
                .filter(Boolean)
                .join(" · ") || "Sin metadatos"}
            </small>
            <p>{article.reason}</p>
          </article>
        ))
      )}
      <p className="literature-query">
        <strong>Cadena de búsqueda:</strong> <code>{data.query}</code>
      </p>
    </div>
  )
}
