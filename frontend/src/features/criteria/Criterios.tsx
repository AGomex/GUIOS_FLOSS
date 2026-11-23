import { RefreshCw, Save } from "lucide-react"
import { useEffect, useState } from "react"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import {
  api,
  type Dimension,
  type Factor,
  type ScoringSettings,
  type Subfactor,
} from "@/lib/api"
import { CriteriaTree } from "./CriteriaTree"
import { LiteraturePanel } from "./LiteraturePanel"

type SettingsForm = {
  scale_min: string
  scale_max: string
  foda_threshold: string
  relevance_min: string
}

const EMPTY_FORM: SettingsForm = {
  scale_min: "1",
  scale_max: "4",
  foda_threshold: "3.00",
  relevance_min: "2",
}

export function Criterios() {
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [factors, setFactors] = useState<Factor[]>([])
  const [subfactors, setSubfactors] = useState<Subfactor[]>([])
  const [settings, setSettings] = useState<ScoringSettings | null>(null)
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [dimensionPage, factorPage, subfactorPage, configuration] =
        await Promise.all([
          api.dimensions(),
          api.factors(),
          api.subfactors(),
          api.settings(),
        ])

      setDimensions(dimensionPage.results)
      setFactors(factorPage.results)
      setSubfactors(subfactorPage.results)
      setSettings(configuration)
      setForm({
        scale_min: String(configuration.scale_min),
        scale_max: String(configuration.scale_max),
        foda_threshold: configuration.foda_threshold,
        relevance_min: String(configuration.relevance_min),
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el catálogo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function save() {
    const minimum = Number(form.scale_min)
    const maximum = Number(form.scale_max)
    const threshold = Number(form.foda_threshold)
    const relevance = Number(form.relevance_min)

    if (!form.scale_min.trim() || !Number.isInteger(minimum) || minimum < 1) {
      setMessage(null)
      setError("El valor mínimo debe ser un entero mayor o igual a 1.")
      return
    }
    if (!form.scale_max.trim() || !Number.isInteger(maximum) || maximum <= minimum) {
      setMessage(null)
      setError("El valor máximo debe ser un entero mayor que el mínimo.")
      return
    }
    if (!form.relevance_min.trim() || !Number.isInteger(relevance) || relevance < 1) {
      setMessage(null)
      setError("La relevancia mínima debe ser un entero mayor o igual a 1.")
      return
    }
    if (
      !form.foda_threshold.trim() ||
      !Number.isFinite(threshold) ||
      threshold < minimum ||
      threshold > maximum
    ) {
      setMessage(null)
      setError(`El umbral FODA debe estar entre ${minimum} y ${maximum}.`)
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await api.updateSettings({
        scale_min: minimum,
        scale_max: maximum,
        foda_threshold: form.foda_threshold,
        relevance_min: relevance,
      })
      setSettings(updated)
      setMessage("Configuración guardada correctamente.")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo guardar.")
    } finally {
      setSaving(false)
    }
  }

  const totalSubfactors = factors.reduce((total, factor) => total + factor.ns, 0)

  return (
    <Layout
      action={
        <Button onClick={() => void load()} variant="secondary">
          <RefreshCw size={15} />
          Recargar
        </Button>
      }
      screen="criteria"
    >
      <Section title="Configuración del cálculo">
        <div className="inline-fields inline-fields--settings">
          <Field
            label="Valor mínimo"
            min={1}
            onChange={(value) => setForm({ ...form, scale_min: value })}
            step={1}
            type="number"
            value={form.scale_min}
          />
          <Field
            label="Valor máximo"
            min={2}
            onChange={(value) => setForm({ ...form, scale_max: value })}
            step={1}
            type="number"
            value={form.scale_max}
          />
          <Field
            label="Umbral FODA"
            max={Number(form.scale_max) || undefined}
            min={Number(form.scale_min) || undefined}
            onChange={(value) => setForm({ ...form, foda_threshold: value })}
            step={0.01}
            type="number"
            value={form.foda_threshold}
          />
          <Field
            label="Relevancia mínima (IR)"
            min={1}
            onChange={(value) => setForm({ ...form, relevance_min: value })}
            step={1}
            type="number"
            value={form.relevance_min}
          />
          <Button disabled={saving} onClick={() => void save()}>
            <Save size={15} />
            {saving ? "Guardando…" : "Guardar configuración"}
          </Button>
        </div>
        {settings && (
          <p className="annotation">
            Última actualización: {new Date(settings.updated_at).toLocaleString("es-EC")}
          </p>
        )}
        {message && <div className="form-message form-message--ok">{message}</div>}
        {error && <div className="form-message form-message--error">{error}</div>}
      </Section>

      <LiteraturePanel />

      <Section
        action={
          <span className="annotation">
            {dimensions.length} dimensiones · {factors.length} factores ·{" "}
            {totalSubfactors} subfactores
          </span>
        }
        title="Estructura de criterios"
      >
        <div className="tree-head">
          <span>Dimensión / Factor / Subfactor</span>
          <span>Alcance</span>
          <span>Métricas</span>
        </div>
        {loading ? (
          <p className="annotation">Cargando catálogo…</p>
        ) : (
          <CriteriaTree
            dimensions={dimensions}
            factors={factors}
            subfactors={subfactors}
          />
        )}
      </Section>
    </Layout>
  )
}
