import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import { api, type Software } from "@/lib/api"

type EvaluationForm = {
  software: string
  evaluator: string
  organization: string
  need: string
}

const EMPTY_FORM: EvaluationForm = {
  software: "",
  evaluator: "",
  organization: "",
  need: "",
}

export function NuevaEvaluacion() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [softwares, setSoftwares] = useState<Software[]>([])
  const [form, setForm] = useState<EvaluationForm>({
    ...EMPTY_FORM,
    software: searchParams.get("software") ?? "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const page = await api.softwares()
        setSoftwares(page.results.filter((item) => item.is_active))
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudo cargar el listado de softwares.",
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  async function submit() {
    if (!form.software) {
      setError("Selecciona el software a evaluar.")
      return
    }
    if (!form.evaluator.trim()) {
      setError("El nombre del evaluador es obligatorio.")
      return
    }
    if (!form.need.trim()) {
      setError("Describe la necesidad organizacional.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const evaluation = await api.createEvaluation({
        software: Number(form.software),
        evaluator: form.evaluator.trim(),
        organization: form.organization.trim(),
        need: form.need.trim(),
      })
      navigate(`/calificacion/${evaluation.id}`)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "No se pudo crear la evaluación.",
      )
    } finally {
      setSaving(false)
    }
  }

  const softwareOptions = softwares.map((software) => ({
    value: String(software.id),
    label: `${software.name} v${software.version} · ${software.provider_name}`,
  }))

  return (
    <Layout
      action={
        <Button disabled={saving || loading} onClick={() => void submit()}>
          <Save size={15} />
          {saving ? "Creando…" : "Guardar y continuar"}
        </Button>
      }
      screen="evaluations"
    >
      <Section title="Datos generales">
        <div className="form-grid form-grid--two">
          <Field
            label="Nombre del evaluador"
            onChange={(value) => setForm({ ...form, evaluator: value })}
            placeholder="Nombre y apellido"
            required
            value={form.evaluator}
          />
          <Field
            kind="select"
            label="Software"
            onChange={(value) => setForm({ ...form, software: value })}
            options={softwareOptions}
            placeholder={loading ? "Cargando softwares…" : "Seleccionar software"}
            required
            value={form.software}
          />
          <Field
            label="Organización solicitante"
            onChange={(value) => setForm({ ...form, organization: value })}
            placeholder="Área o institución"
            value={form.organization}
          />
          <Field
            kind="textarea"
            label="Necesidad organizacional"
            onChange={(value) => setForm({ ...form, need: value })}
            placeholder="Problema o proceso que se busca cubrir"
            required
            value={form.need}
          />
        </div>
        {!loading && softwares.length === 0 && (
          <p className="annotation">
            No hay softwares activos. Regístralos en la pantalla de Softwares antes
            de crear una evaluación.
          </p>
        )}
        {error && <div className="form-message form-message--error">{error}</div>}
      </Section>

      <Section title="Cómo funciona la evaluación">
        <p className="body-copy">
          Al crear la evaluación se copia el catálogo vigente (3 dimensiones, 18
          factores y 61 subfactores) junto con la escala y el umbral configurados.
          En el siguiente paso calificarás cada subfactor y ajustarás la
          importancia del decisor y el alcance de cada factor.
        </p>
      </Section>

      <div className="page-actions">
        <Button onClick={() => navigate("/softwares")} variant="secondary">
          Cancelar
        </Button>
        <Button disabled={saving || loading} onClick={() => void submit()}>
          <Save size={15} />
          {saving ? "Creando…" : "Guardar y continuar"}
        </Button>
      </div>
    </Layout>
  )
}
