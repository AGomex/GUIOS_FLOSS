import {
  Boxes,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { DashboardBars } from "@/components/charts/DashboardBars"
import { RecommendationDonut } from "@/components/charts/RecommendationDonut"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import { Layout } from "@/app/Layout"

export function Dashboard() {
  const navigate = useNavigate()

  const recent = [
    [
      "ERPNext v15",
      <strong className="score score--green">4.02</strong>,
      <Status tone="green">Adoptar</Status>,
      "30/09/2026",
    ],
    [
      "Odoo ERP v17",
      <strong className="score score--amber">3.85</strong>,
      <Status tone="amber">Adoptar con reservas</Status>,
      "28/09/2026",
    ],
    [
      "SAP Business One 10",
      <strong className="score score--amber">3.60</strong>,
      <Status tone="amber">Adoptar con reservas</Status>,
      "25/09/2026",
    ],
    [
      "Dolibarr 18",
      <strong className="score score--red">2.85</strong>,
      <Status tone="red">No adoptar</Status>,
      "18/09/2026",
    ],
    ["Tryton 7", "—", <Status tone="blue">En evaluación</Status>, "12/09/2026"],
  ]

  const metrics: [string, string, LucideIcon][] = [
    ["Softwares registrados", "9", Boxes],
    ["Softwares evaluados", "6", CheckCircle2],
    ["Evaluaciones en evaluación", "2", Clock3],
    ["Evaluaciones finalizadas", "4", ShieldCheck],
  ]

  return (
    <Layout
      action={
        <Button onClick={() => navigate("/evaluaciones/nueva")}>
          <Plus size={16} />
          Nueva evaluación
        </Button>
      }
      screen="dashboard"
    >
      <div className="metric-grid">
        {metrics.map(([label, value, Icon]) => (
          <div className="metric" key={label}>
            <div className="metric__icon">
              <Icon size={20} />
            </div>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="stack">
          <Section title="Evaluaciones por estado">
            <DashboardBars />
          </Section>
          <Section title="Distribución de recomendaciones">
            <RecommendationDonut />
          </Section>
        </div>
        <Section title="Resultados recientes">
          <DataTable
            headers={["Software", "Resultado", "Recomendación", "Fecha"]}
            onRowClick={() => navigate("/resultados")}
            rows={recent}
          />
        </Section>
      </div>
    </Layout>
  )
}
