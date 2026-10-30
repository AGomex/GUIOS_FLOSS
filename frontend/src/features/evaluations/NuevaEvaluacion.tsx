import { Save } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"

export function NuevaEvaluacion() {
  const navigate = useNavigate()

  return (
    <Layout
      action={
        <Button onClick={() => navigate("/calificacion")}>
          <Save size={15} />
          Guardar y continuar
        </Button>
      }
      screen="evaluations"
    >
      <Section title="Datos generales">
        <div className="form-grid form-grid--two">
          <Field label="Nombre del evaluador" value="Carlos Mendoza" />
          <Field kind="select" label="Software" value="Odoo ERP v17" />
          <Field
            label="Organización solicitante"
            value="Dirección Financiera"
          />
          <Field
            kind="textarea"
            label="Necesidad organizacional"
            value="Gestión contable e inventario"
          />
        </div>
      </Section>
      <Section title="Criterios de esta evaluación">
        <p className="annotation">
          La selección de factores relevantes y sus pesos se habilitará en la Fase 2.
        </p>
      </Section>
      <div className="page-actions">
        <Button variant="secondary">Cancelar</Button>
        <Button onClick={() => navigate("/calificacion")}>
          <Save size={15} />
          Guardar y continuar
        </Button>
      </div>
    </Layout>
  )
}
