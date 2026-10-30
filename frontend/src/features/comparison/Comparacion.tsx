import { SlidersHorizontal } from "lucide-react"

import { Layout } from "@/app/Layout"
import { RadarChart } from "@/components/charts/RadarChart"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"

export function Comparacion() {
  const rows = [
    [
      "Resultado global",
      <strong className="best-cell">4.02 / 5</strong>,
      <strong className="score score--amber">3.85 / 5</strong>,
      <strong className="score score--amber">3.60 / 5</strong>,
    ],
    [
      "Funcionalidad",
      "4.20",
      "4.14",
      <strong className="best-cell">4.50</strong>,
    ],
    ["Usabilidad", <strong className="best-cell">3.80</strong>, "4.30", "3.00"],
    [
      "Soporte y proveedor",
      "3.50",
      "2.00",
      <strong className="best-cell">4.50</strong>,
    ],
    [
      "Costo y licenciamiento",
      <strong className="best-cell">4.50</strong>,
      "4.00",
      "1.50",
    ],
    [
      "Fortalezas principales",
      "Costo y funcionalidad",
      "Adecuación y operabilidad",
      "Funcionalidad y soporte",
    ],
    [
      "Debilidades principales",
      "Usabilidad",
      "Soporte técnico",
      "Costo de licencias",
    ],
    [
      "Recomendación",
      <Status tone="green">Adoptar</Status>,
      <Status tone="amber">Adoptar con reservas</Status>,
      <Status tone="amber">Adoptar con reservas</Status>,
    ],
  ]

  return (
    <Layout
      action={<Button>Exportar comparación</Button>}
      screen="comparison"
    >
      <Section title="Configurar comparación">
        <div className="comparison-selectors">
          <Field
            kind="select"
            label="Necesidad organizacional"
            value="Gestión contable e inventario"
          />
          <label className="field field--wide">
            <span>Evaluaciones seleccionadas (2 a 3)</span>
            <div className="multi-select">
              <span>ERPNext v15</span>
              <span>Odoo ERP v17</span>
              <span>SAP Business One 10</span>
            </div>
          </label>
        </div>
      </Section>
      <Section title="Comparación de resultados">
        <DataTable
          headers={[
            "Criterio",
            "ERPNext v15",
            "Odoo ERP v17",
            "SAP Business One 10",
          ]}
          rows={rows}
        />
      </Section>
      <Section title="Vista comparativa">
        <div className="comparison-radar">
          <RadarChart comparison />
          <div className="series-legend">
            <span>
              <i className="dot dot--green" />
              ERPNext
            </span>
            <span>
              <i className="dot dot--amber" />
              Odoo
            </span>
            <span>
              <i className="dot dot--navy" />
              SAP Business One
            </span>
          </div>
        </div>
      </Section>
      <div className="notice">
        <SlidersHorizontal size={16} />
        Si las escalas difieren, se normalizan y se advierte.
      </div>
    </Layout>
  )
}
