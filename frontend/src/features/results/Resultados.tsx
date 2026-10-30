import { useNavigate } from "react-router-dom"

import { Layout } from "@/app/Layout"
import { FactorBars } from "@/components/charts/FactorBars"
import { RadarChart } from "@/components/charts/RadarChart"
import { Button } from "@/components/ui/Button"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"

export function Resultados() {
  const navigate = useNavigate()

  return (
    <Layout
      action={
        <Button variant="secondary" onClick={() => navigate("/historial")}>
          Volver al historial
        </Button>
      }
      screen="results"
    >
      <Section className="result-heading">
        <div>
          <span className="eyebrow">Software evaluado</span>
          <strong>Odoo ERP · versión 17</strong>
        </div>
        <Status tone="green">Finalizada</Status>
        <div>
          <span className="eyebrow">Fecha</span>
          <strong>28/09/2026</strong>
        </div>
      </Section>
      <div className="result-top">
        <Section title="Resultado global">
          <div className="big-score big-score--amber">
            3.85 <span>/ 5</span>
          </div>
          <small className="score-caption">
            Nivel favorable con aspectos por fortalecer
          </small>
        </Section>
        <Section title="Recomendación de adopción">
          <Status tone="amber">Adoptar con reservas</Status>
          <p className="body-copy">
            Fuerte en funcionalidad y usabilidad; débil en soporte técnico.
          </p>
        </Section>
      </div>
      <div className="two-col">
        <Section title="Desempeño por dimensiones">
          <RadarChart />
        </Section>
        <Section title="Desempeño por factor">
          <FactorBars />
        </Section>
      </div>
      <Section title="Matriz FODA">
        <div className="swot">
          {[
            ["Fortalezas", "Adecuación · Operabilidad · Costo total", "green"],
            ["Oportunidades", "Interoperabilidad", "blue"],
            ["Debilidades", "Soporte técnico", "red"],
            ["Amenazas", "Sin aspectos en esta categoría", "amber"],
          ].map(([title, text, tone]) => (
            <div className={`swot--${tone}`} key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Comentario del evaluador">
        <div className="text-box">
          Odoo cubre la gestión contable e inventario. Se recomienda acordar un
          esquema de soporte antes de la adopción.
        </div>
      </Section>
      <Section title="Detalle de resultados">
        {[
          "Funcionalidad · 4.14",
          "Usabilidad · 4.30",
          "Soporte y proveedor · 2.00",
          "Costo y licenciamiento · 4.00",
        ].map((item) => (
          <div className="accordion-row" key={item}>
            <span>+</span>
            <strong>{item}</strong>
            <span>Ver factores y subfactores</span>
          </div>
        ))}
      </Section>
    </Layout>
  )
}
