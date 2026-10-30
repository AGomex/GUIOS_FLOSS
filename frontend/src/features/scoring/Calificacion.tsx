import { Save } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import { Scale } from "./Scale"

const scoringRows = [
  ["Cobertura de requerimientos", "Adecuación", 5],
  ["Precisión de resultados", "Adecuación", 4],
  ["Integración con sistemas existentes", "Interoperabilidad", 4],
  ["Formatos de intercambio de datos", "Interoperabilidad", 3],
  ["Tiempo de adaptación del usuario", "Facilidad de aprendizaje", 4],
  ["Calidad del material de ayuda", "Facilidad de aprendizaje", 4],
  ["Claridad de la interfaz", "Operabilidad", null],
  ["Eficiencia en tareas frecuentes", "Operabilidad", null],
  ["Disponibilidad de soporte", "Soporte técnico", null],
  ["Documentación", "Soporte técnico", null],
  ["Costo de licencias", "Costo total", null],
  ["Costo de implementación", "Costo total", null],
] as const

export function Calificacion() {
  const navigate = useNavigate()

  return (
    <Layout
      action={<Button variant="secondary">Guardar avance</Button>}
      screen="scoring"
    >
      <Section className="evaluation-summary">
        <div>
          <span className="eyebrow">Software</span>
          <strong>Odoo ERP · versión 17</strong>
        </div>
        <div>
          <span className="eyebrow">Necesidad</span>
          <strong>Gestión contable e inventario</strong>
        </div>
        <Status tone="blue">En evaluación</Status>
        <div className="progress-wrap">
          <div className="progress-label">
            <span>Avance</span>
            <strong>60%</strong>
          </div>
          <div className="progress">
            <span />
          </div>
        </div>
      </Section>
      <Section title="Calificación de criterios">
        <div className="score-head">
          <span>Dimensión / Factor / Subfactor</span>
          <span>Calificación</span>
          <span>Fuente</span>
          <span>Observación</span>
        </div>
        <div className="score-group">
          <strong>Funcionalidad, Usabilidad, Soporte y Costo</strong>
          <span>Escala configurada: 1 a 5</span>
        </div>
        {scoringRows.map(([name, group, value]) => (
          <div className="score-row" key={name}>
            <span>
              <small>{group}</small>
              {name}
            </span>
            <Scale value={value} />
            <select defaultValue={value ? "Observación directa" : ""}>
              <option value="">Seleccionar fuente</option>
              <option>Observación directa</option>
              <option>Información del proveedor</option>
              <option>Experiencia previa</option>
            </select>
            <input placeholder="Observación (opcional)" />
          </div>
        ))}
      </Section>
      <div className="finish-bar">
        <span>
          <strong>Quedan 6 subfactores pendientes.</strong> Complete todas las
          calificaciones para finalizar.
        </span>
        <div className="button-row">
          <Button variant="secondary">
            <Save size={15} />
            Guardar avance
          </Button>
          <Button disabled onClick={() => navigate("/resultados")}>
            Finalizar evaluación
          </Button>
        </div>
      </div>
    </Layout>
  )
}
