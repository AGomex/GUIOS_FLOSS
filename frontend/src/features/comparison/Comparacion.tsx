import { Plus, SlidersHorizontal } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { RadarChart } from "@/components/charts/RadarChart"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import {
  api,
  type Comparison,
  type EvaluationSummary,
} from "@/lib/api"

const RECOMMENDATION_TONE = {
  A: "green",
  B: "amber",
  C: "red",
} as const

const SERIES_TONES = ["amber", "green", "navy"] as const

function isUniqueBest(values: (number | null)[], index: number) {
  const value = values[index]
  if (value === null || Number.isNaN(value)) return false
  return (
    values.filter((item) => item === value).length === 1 &&
    values.every((item) => item === null || item <= value)
  )
}

function cell(text: string | null, best: boolean) {
  if (text === null) return "—"
  return best ? <strong className="best-cell">{text}</strong> : text
}

export function Comparacion() {
  const navigate = useNavigate()
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [needFilter, setNeedFilter] = useState("")
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comparing, setComparing] = useState(false)
  const [comparisonError, setComparisonError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const page = await api.evaluations()
        const finished = page.results.filter((item) => item.score_5 !== null)
        setEvaluations(finished)
        setSelectedIds(finished.slice(0, 2).map((item) => item.id))
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudieron cargar las evaluaciones.",
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    if (selectedIds.length < 2) {
      setComparison(null)
      return
    }

    let cancelled = false
    setComparing(true)
    setComparisonError(null)
    api
      .comparison(selectedIds)
      .then((data) => {
        if (!cancelled) setComparison(data)
      })
      .catch((caught) => {
        if (!cancelled) {
          setComparison(null)
          setComparisonError(
            caught instanceof Error
              ? caught.message
              : "No se pudo construir la comparación.",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setComparing(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedIds])

  const filtered = useMemo(
    () =>
      evaluations.filter(
        (item) => !needFilter || item.need === needFilter,
      ),
    [evaluations, needFilter],
  )

  const needOptions = useMemo(
    () =>
      [...new Set(evaluations.map((item) => item.need))]
        .sort((left, right) => left.localeCompare(right))
        .map((need) => ({ value: need, label: need })),
    [evaluations],
  )

  function handleNeedChange(value: string) {
    setNeedFilter(value)
    const available = evaluations
      .filter((item) => !value || item.need === value)
      .map((item) => item.id)
    setSelectedIds(available.slice(0, 2))
  }

  function toggleSelection(id: number) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id)
      }
      if (current.length >= 3) return current
      return [...current, id]
    })
  }

  const rows: ReactNode[][] = []
  if (comparison) {
    const items = comparison.evaluations
    const scores = items.map((item) => Number(item.score_5))
    rows.push([
      "Resultado global",
      ...items.map((item, index) =>
        cell(
          `${item.score_5} / 5`,
          isUniqueBest(scores, index),
        ),
      ),
    ])

    for (const dimensionName of comparison.dimensions) {
      const values = items.map((item) => {
        const dimension = item.dimensions.find(
          (entry) => entry.name === dimensionName,
        )
        if (!dimension) return null
        const raw = comparison.normalized
          ? dimension.percentage
          : dimension.average
        return raw === null ? null : Number(raw)
      })
      rows.push([
        dimensionName,
        ...items.map((item, index) => {
          const dimension = item.dimensions.find(
            (entry) => entry.name === dimensionName,
          )
          if (!dimension) return "—"
          const text = comparison.normalized
            ? dimension.percentage === null
              ? null
              : `${dimension.percentage}%`
            : dimension.average
          return cell(text, isUniqueBest(values, index))
        }),
      ])
    }

    rows.push([
      "Fortalezas principales",
      ...items.map((item) => item.strengths.join(", ") || "—"),
    ])
    rows.push([
      "Debilidades principales",
      ...items.map((item) => item.weaknesses.join(", ") || "—"),
    ])
    rows.push([
      "Recomendación",
      ...items.map((item) => (
        <Status
          key={`${item.id}-recommendation`}
          tone={RECOMMENDATION_TONE[item.recommendation]}
        >
          {item.recommendation_label}
        </Status>
      )),
    ])
  }

  const radarSeries =
    comparison?.evaluations.map((item) => ({
      label: `${item.software} v${item.software_version} · ${item.code}`,
      values: comparison.dimensions.map((dimensionName) => {
        const dimension = item.dimensions.find(
          (entry) => entry.name === dimensionName,
        )
        if (!dimension) return 0
        return comparison.normalized
          ? Number(dimension.percentage ?? 0)
          : Number(dimension.average ?? 0)
      }),
    })) ?? []

  const radarMax = comparison?.normalized
    ? 100
    : Math.max(...(comparison?.evaluations.map((item) => item.scale.max) ?? [4]))

  return (
    <Layout
      action={
        <Button onClick={() => navigate("/evaluaciones/nueva")}>
          <Plus size={15} />
          Nueva evaluación
        </Button>
      }
      screen="comparison"
    >
      <Section title="Configurar comparación">
        {loading ? (
          <p className="annotation">Cargando evaluaciones…</p>
        ) : error ? (
          <p className="form-message form-message--error">{error}</p>
        ) : evaluations.length < 2 ? (
          <p className="annotation">
            Se necesitan al menos dos evaluaciones con resultados para
            comparar.
          </p>
        ) : (
          <div className="comparison-selectors">
            <Field
              kind="select"
              label="Necesidad organizacional"
              onChange={handleNeedChange}
              options={needOptions}
              placeholder="Todas"
              value={needFilter}
            />
            <div className="field field--wide">
              <span>Evaluaciones seleccionadas (2 a 3)</span>
              <div className="comparison-list">
                {filtered.length === 0 ? (
                  <p className="annotation">
                    No hay evaluaciones finalizadas para esta necesidad.
                  </p>
                ) : (
                  filtered.map((item) => {
                    const checked = selectedIds.includes(item.id)
                    const disabled =
                      !checked && selectedIds.length >= 3
                    return (
                      <label
                        className={`compare-option ${
                          checked ? "compare-option--active" : ""
                        }`}
                        key={item.id}
                      >
                        <input
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleSelection(item.id)}
                          type="checkbox"
                        />
                        <span>
                          <strong>{item.software_label}</strong>
                          <small>
                            {item.code} · {item.evaluator} · {item.need}
                          </small>
                        </span>
                        <em>{item.score_5} / 5</em>
                      </label>
                    )
                  })
                )}
              </div>
              <small className="annotation">
                {selectedIds.length} de 3 seleccionadas
              </small>
            </div>
          </div>
        )}
      </Section>

      {comparing ? (
        <Section title="Comparación de resultados">
          <p className="annotation">Calculando comparación…</p>
        </Section>
      ) : comparisonError ? (
        <Section title="Comparación de resultados">
          <p className="form-message form-message--error">
            {comparisonError}
          </p>
        </Section>
      ) : !comparison ? (
        <Section title="Comparación de resultados">
          <p className="annotation">
            Seleccione al menos dos evaluaciones para comparar.
          </p>
        </Section>
      ) : (
        <>
          <Section
            action={
              <span className="annotation">
                {comparison.evaluations.length} evaluaciones ·{" "}
                {comparison.normalized ? "porcentaje" : "escala original"}
              </span>
            }
            title="Comparación de resultados"
          >
            <DataTable
              headers={[
                "Criterio",
                ...comparison.evaluations.map(
                  (item) =>
                    `${item.software} v${item.software_version} · ${item.code}`,
                ),
              ]}
              rows={rows}
            />
          </Section>

          <Section title="Vista comparativa">
            <div className="comparison-radar">
              <RadarChart
                ariaLabel="Radar comparativo por dimensiones"
                labels={comparison.dimensions}
                max={radarMax}
                series={radarSeries}
              />
              <div className="series-legend">
                {comparison.evaluations.map((item, index) => (
                  <span key={item.id}>
                    <i className={`dot dot--${SERIES_TONES[index]}`} />
                    {item.software} v{item.software_version} · {item.code}
                  </span>
                ))}
              </div>
            </div>
          </Section>

          <div className="comparison-notices">
            {comparison.normalized && (
              <div className="notice">
                <SlidersHorizontal size={16} />
                Las evaluaciones usan escalas distintas; los valores se
                normalizan a porcentaje para poder compararlos.
              </div>
            )}
            {!comparison.same_need && (
              <div className="notice">
                <SlidersHorizontal size={16} />
                Las evaluaciones corresponden a necesidades distintas; la
                comparación es referencial.
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
