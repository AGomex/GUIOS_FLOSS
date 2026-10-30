import { Save } from "lucide-react"
import { useState } from "react"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import { CriteriaTree } from "./CriteriaTree"

export function Criterios() {
  const [invalid, setInvalid] = useState(false)

  return (
    <Layout
      action={
        <Button disabled={invalid}>
          <Save size={15} />
          Guardar configuración
        </Button>
      }
      screen="criteria"
    >
      <Section title="Escala de calificación">
        <div className="inline-fields">
          <Field label="Valor mínimo" value="1" />
          <Field label="Valor máximo" value="5" />
        </div>
      </Section>
      <Section
        action={
          <div className="button-row">
            <Button onClick={() => setInvalid(!invalid)} variant="secondary">
              {invalid ? "Ver estado correcto" : "Ver variante con error"}
            </Button>
            <Button variant="secondary">Agregar dimensión</Button>
            <Button variant="secondary">Agregar factor</Button>
            <Button variant="secondary">Agregar subfactor</Button>
          </div>
        }
        title="Estructura de criterios"
      >
        <div className="tree-head">
          <span>Dimensión / Factor / Subfactor</span>
          <span>Estado</span>
          <span>Valor</span>
        </div>
        <CriteriaTree invalid={invalid} />
      </Section>
    </Layout>
  )
}
