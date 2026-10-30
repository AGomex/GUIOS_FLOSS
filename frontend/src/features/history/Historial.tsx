import { useNavigate } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { EvolutionChart } from "@/components/charts/EvolutionChart"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"

export function Historial() {
  const navigate = useNavigate()

  const rows = [
    [
      "EV-006",
      "ERPNext",
      "15",
      "Carlos Mendoza",
      <Status tone="green">Finalizada</Status>,
      <span className="score score--green">4.02</span>,
      "30/09/26",
    ],
    [
      "EV-005",
      "Odoo ERP",
      "17",
      "Carlos Mendoza",
      <Status tone="green">Finalizada</Status>,
      <span className="score score--amber">3.85</span>,
      "28/09/26",
    ],
    [
      "EV-004",
      "SAP Business One",
      "10",
      "Carlos Mendoza",
      <Status tone="green">Finalizada</Status>,
      <span className="score score--amber">3.60</span>,
      "25/09/26",
    ],
    [
      "EV-003",
      "Dolibarr",
      "18",
      "Lucía Herrera",
      <Status tone="green">Finalizada</Status>,
      <span className="score score--red">2.85</span>,
      "18/09/26",
    ],
    [
      "EV-002",
      "Tryton",
      "7",
      "Carlos Mendoza",
      <Status tone="blue">En evaluación</Status>,
      "—",
      "12/09/26",
    ],
    [
      "EV-001",
      "Odoo ERP",
      "16",
      "Carlos Mendoza",
      <Status tone="blue">En evaluación</Status>,
      "3.55",
      "18/03/26",
    ],
  ]

  return (
    <Layout
      action={
        <Button onClick={() => navigate("/comparacion")}>
          Comparar seleccionadas
        </Button>
      }
      screen="history"
    >
      <div className="split-panel split-panel--history">
        <div className="split-panel__main">
          <div className="filters filters--history">
            <Field kind="select" label="Software" />
            <Field kind="select" label="Proveedor" />
            <Field kind="select" label="Versión" />
            <Field kind="select" label="Evaluador" />
            <Field kind="select" label="Estado" />
            <Field
              label="Rango de fechas"
              placeholder="dd/mm/aaaa — dd/mm/aaaa"
            />
          </div>
          <Section title="Evaluaciones">
            <DataTable
              headers={[
                "Código",
                "Software",
                "Versión",
                "Evaluador",
                "Estado",
                "Resultado",
                "Fecha",
              ]}
              onRowClick={() => navigate("/resultados")}
              rows={rows}
              selectable
            />
          </Section>
        </div>
        <aside className="drawer drawer--detail">
          <h2>Detalle</h2>
          <span className="eyebrow">Odoo ERP · EV-005</span>
          <EvolutionChart />
          <h3>Bitácora de cambios</h3>
          <div className="log-list">
            <div>
              <strong>28/09/2026 · C. Mendoza</strong>
              <span>Calificación Disponibilidad de soporte</span>
              <small>3 → 2</small>
            </div>
            <div>
              <strong>27/09/2026 · C. Mendoza</strong>
              <span>Estado</span>
              <small>Borrador → En evaluación</small>
            </div>
            <div>
              <strong>25/09/2026 · C. Mendoza</strong>
              <span>Observación</span>
              <small>Sin valor → Evidencia agregada</small>
            </div>
          </div>
          <label className="field">
            <span>Motivo para reabrir</span>
            <textarea placeholder="Obligatorio al reabrir" rows={2} />
          </label>
          <Button variant="secondary">Reabrir evaluación</Button>
        </aside>
      </div>
    </Layout>
  )
}
