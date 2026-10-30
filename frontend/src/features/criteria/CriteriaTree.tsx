import { CheckCircle2 } from "lucide-react"

function TreeRow({
  level,
  name,
  weight,
  relevant = false,
}: {
  level: 0 | 1 | 2
  name: string
  weight: string
  relevant?: boolean
}) {
  return (
    <div className={`tree-row tree-row--${level}`}>
      <div className="tree-name">
        <span>{level < 2 ? "−" : "·"}</span>
        {name}
      </div>
      {relevant ? (
        <label className="check-label">
          <input defaultChecked type="checkbox" /> Relevante
        </label>
      ) : (
        <label className="switch-label">
          <input defaultChecked type="checkbox" /> Activo
        </label>
      )}
      <label className="weight-field">
        <span>{relevant ? "Peso editable %" : "Peso por defecto %"}</span>
        <input defaultValue={weight} />
      </label>
    </div>
  )
}

export function CriteriaTree({
  relevant = false,
  invalid = false,
}: {
  relevant?: boolean
  invalid?: boolean
}) {
  return (
    <div className="tree">
      <TreeRow level={0} name="Funcionalidad" relevant={relevant} weight="40" />
      <TreeRow level={1} name="Adecuación" relevant={relevant} weight="60" />
      <TreeRow
        level={2}
        name="Cobertura de requerimientos"
        relevant={relevant}
        weight="50"
      />
      <TreeRow
        level={2}
        name="Precisión de resultados"
        relevant={relevant}
        weight="50"
      />
      <div className={`sum-row ${invalid ? "sum-row--error" : ""}`}>
        <span>Suma de Adecuación</span>
        {invalid ? (
          <strong>Faltan 10% para completar 100%</strong>
        ) : (
          <strong>
            <CheckCircle2 size={13} /> 100%
          </strong>
        )}
      </div>
      <TreeRow
        level={1}
        name="Interoperabilidad"
        relevant={relevant}
        weight="40"
      />
      <TreeRow
        level={2}
        name="Integración con sistemas existentes"
        relevant={relevant}
        weight="60"
      />
      <TreeRow
        level={2}
        name="Formatos de intercambio de datos"
        relevant={relevant}
        weight="40"
      />
      <div className="sum-row">
        <span>Suma de Funcionalidad</span>
        <strong>
          <CheckCircle2 size={13} /> 100%
        </strong>
      </div>
      <TreeRow level={0} name="Usabilidad" relevant={relevant} weight="30" />
      <TreeRow
        level={1}
        name="Facilidad de aprendizaje"
        relevant={relevant}
        weight="50"
      />
      <TreeRow
        level={2}
        name="Tiempo de adaptación del usuario"
        relevant={relevant}
        weight="50"
      />
      <TreeRow
        level={2}
        name="Calidad del material de ayuda"
        relevant={relevant}
        weight="50"
      />
      <TreeRow level={1} name="Operabilidad" relevant={relevant} weight="50" />
      <TreeRow
        level={2}
        name="Claridad de la interfaz"
        relevant={relevant}
        weight="60"
      />
      <TreeRow
        level={2}
        name="Eficiencia en tareas frecuentes"
        relevant={relevant}
        weight="40"
      />
      <div className="sum-row">
        <span>Suma de Usabilidad</span>
        <strong>
          <CheckCircle2 size={13} /> 100%
        </strong>
      </div>
      <TreeRow
        level={0}
        name="Soporte y proveedor"
        relevant={relevant}
        weight="15"
      />
      <TreeRow
        level={1}
        name="Soporte técnico"
        relevant={relevant}
        weight="100"
      />
      <TreeRow
        level={2}
        name="Disponibilidad de soporte"
        relevant={relevant}
        weight="50"
      />
      <TreeRow level={2} name="Documentación" relevant={relevant} weight="50" />
      <div className="sum-row">
        <span>Suma de Soporte y proveedor</span>
        <strong>
          <CheckCircle2 size={13} /> 100%
        </strong>
      </div>
      <TreeRow
        level={0}
        name="Costo y licenciamiento"
        relevant={relevant}
        weight="15"
      />
      <TreeRow level={1} name="Costo total" relevant={relevant} weight="100" />
      <TreeRow
        level={2}
        name="Costo de licencias"
        relevant={relevant}
        weight="50"
      />
      <TreeRow
        level={2}
        name="Costo de implementación"
        relevant={relevant}
        weight="50"
      />
      <div className="sum-row">
        <span>Suma de Costo y licenciamiento</span>
        <strong>
          <CheckCircle2 size={13} /> 100%
        </strong>
      </div>
    </div>
  )
}
