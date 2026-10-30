import { useState, type ReactNode } from "react"
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FilePlus2,
  GitCompareArrows,
  History,
  LayoutDashboard,
  ListChecks,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

type Screen = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

const menu: { label: string screen: Screen icon: LucideIcon }[] = [
  { label: "Dashboard", screen: 1, icon: LayoutDashboard },
  { label: "Softwares", screen: 2, icon: Boxes },
  { label: "Criterios", screen: 3, icon: ListChecks },
  { label: "Evaluaciones", screen: 4, icon: ClipboardCheck },
  { label: "Historial", screen: 7, icon: History },
  { label: "Comparación", screen: 8, icon: GitCompareArrows },
]

const screenTitles = [
  "",
  "MK-01 Dashboard",
  "MK-02 Softwares",
  "MK-03 Criterios",
  "MK-04 Nueva evaluación",
  "MK-05 Calificación",
  "MK-06 Resultados",
  "MK-07 Historial",
  "MK-08 Comparación",
]

function Button({
  children,
  variant = "primary",
  disabled = false,
  onClick,
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "text"
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className={`button button--${variant}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function Field({
  label,
  placeholder = "",
  kind = "input",
  wide = false,
  value,
}: {
  label: string
  placeholder?: string
  kind?: "input" | "select" | "textarea"
  wide?: boolean
  value?: string
}) {
  return (
    <label className={`field ${wide ? "field--wide" : ""}`}>
      <span>{label}</span>
      {kind === "select" ? (
        <select defaultValue={value || ""}>
          <option value="" disabled>
            {placeholder || "Seleccionar"}
          </option>
          {value && <option value={value}>{value}</option>}
          <option>Opción de ejemplo</option>
        </select>
      ) : kind === "textarea" ? (
        <textarea defaultValue={value} placeholder={placeholder} rows={3} />
      ) : (
        <input defaultValue={value} placeholder={placeholder} />
      )}
    </label>
  )
}

function Annotation({ children }: { children: ReactNode }) {
  return <p className="annotation">{children}</p>
}

function Section({
  title,
  children,
  className = "",
  action,
}: {
  title?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`section ${className}`}>
      {title && (
        <div className="section__head">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function ChartBox({ label, tall = false }: { label: string tall?: boolean }) {
  return (
    <div className={`chart-box ${tall ? "chart-box--tall" : ""}`}>
      <BarChart3 size={22} />
      {label}
    </div>
  )
}

function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "green" | "amber" | "red" | "blue"
}) {
  return <span className={`status status--${tone}`}>{children}</span>
}

function DashboardBars() {
  return (
    <div className="bar-chart">
      <div>
        <span>En evaluación</span>
        <i style={{ width: "50%" }} />
        <strong>2</strong>
      </div>
      <div>
        <span>Finalizadas</span>
        <i style={{ width: "88%" }} />
        <strong>4</strong>
      </div>
    </div>
  )
}

function RecommendationDonut() {
  return (
    <div className="donut-wrap">
      <div className="donut">
        <span>
          4<small>total</small>
        </span>
      </div>
      <div className="legend">
        <span>
          <i className="dot dot--green" />
          Adoptar <strong>1</strong>
        </span>
        <span>
          <i className="dot dot--amber" />
          Con reservas <strong>2</strong>
        </span>
        <span>
          <i className="dot dot--red" />
          No adoptar <strong>1</strong>
        </span>
      </div>
    </div>
  )
}

function RadarChart({ comparison = false }: { comparison?: boolean }) {
  return (
    <div className="radar-chart">
      <svg
        aria-label={
          comparison
            ? "Radar comparativo de tres softwares"
            : "Radar por dimensiones"
        }
        viewBox="0 0 360 190"
      >
        <g className="radar-grid">
          <polygon points="180,18 322,77 268,170 92,170 38,77" />
          <polygon points="180,48 284,91 244,159 116,159 76,91" />
          <polygon points="180,78 246,105 220,148 140,148 114,105" />
          <line x1="180" y1="18" x2="180" y2="130" />
          <line x1="322" y1="77" x2="180" y2="130" />
          <line x1="268" y1="170" x2="180" y2="130" />
          <line x1="92" y1="170" x2="180" y2="130" />
          <line x1="38" y1="77" x2="180" y2="130" />
        </g>
        <polygon
          className="radar-series radar-series--one"
          points="180,29 298,86 251,163 109,162 68,88"
        />
        {comparison && (
          <polygon
            className="radar-series radar-series--two"
            points="180,23 303,83 259,168 117,157 59,85"
          />
        )}
        {comparison && (
          <polygon
            className="radar-series radar-series--three"
            points="180,34 310,81 213,145 137,151 48,80"
          />
        )}
      </svg>
      <div className="radar-labels">
        <span>Funcionalidad</span>
        <span>Usabilidad</span>
        <span>Soporte</span>
        <span>Costo</span>
      </div>
    </div>
  )
}

function FactorBars() {
  const bars = [
    ["Adecuación", 90, "green", "4.50"],
    ["Interoperabilidad", 72, "amber", "3.60"],
    ["Facilidad de aprendizaje", 80, "green", "4.00"],
    ["Operabilidad", 92, "green", "4.60"],
    ["Soporte técnico", 40, "red", "2.00"],
    ["Costo total", 80, "green", "4.00"],
  ]
  return (
    <div className="factor-bars">
      {bars.map(([name, width, tone, value]) => (
        <div key={name}>
          <span>{name}</span>
          <i>
            <b
              className={`fill fill--${tone}`}
              style={{ width: `${width}%` }}
            />
          </i>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

function EvolutionChart() {
  return (
    <div className="line-chart">
      <svg aria-label="Evolución de Odoo por versión" viewBox="0 0 320 130">
        <line x1="30" y1="105" x2="300" y2="105" />
        <line x1="30" y1="20" x2="30" y2="105" />
        <polyline points="65,78 255,46" />
        <circle cx="65" cy="78" r="5" />
        <circle cx="255" cy="46" r="5" />
        <text x="43" y="124">
          v16 · Mar 2026
        </text>
        <text x="225" y="124">
          v17 · Sep 2026
        </text>
        <text x="50" y="68">
          3.55
        </text>
        <text x="245" y="36">
          3.85
        </text>
      </svg>
    </div>
  )
}

function Sidebar({
  screen,
  setScreen,
}: {
  screen: Screen
  setScreen: (screen: Screen) => void
}) {
  const active =
    screen === 5 || screen === 6
      ? "Evaluaciones"
      : menu.find((item) => item.screen === screen)?.label

  return (
    <aside className="sidebar">
      <div className="logo">GUIOSPRO_FLOSS</div>
      <nav aria-label="Navegación principal">
        {menu.map((item) => (
          <button
            className={`nav-item ${
              active === item.label ? "nav-item--active" : ""
            }`}
            key={item.label}
            onClick={() => setScreen(item.screen)}
            type="button"
          >
            <item.icon size={18} strokeWidth={1.8} />
            {item.label}
          </button>
        ))}
      </nav>
      {(screen === 4 || screen === 5 || screen === 6) && (
        <div className="subnav">
          <span>Flujo de evaluación</span>
          <button onClick={() => setScreen(4)} type="button">
            01 Datos
          </button>
          <button onClick={() => setScreen(5)} type="button">
            02 Calificación
          </button>
          <button onClick={() => setScreen(6)} type="button">
            03 Resultados
          </button>
        </div>
      )}
      <div className="sidebar__note">
        Sistema de apoyo a decisiones
        <br />
        Evaluación de software
      </div>
    </aside>
  )
}

function Layout({
  screen,
  setScreen,
  action,
  children,
}: {
  screen: Screen
  setScreen: (screen: Screen) => void
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="app-shell">
      <Sidebar screen={screen} setScreen={setScreen} />
      <main className="main">
        <header className="topbar">
          <h1>{screenTitles[screen]}</h1>
          <div>{action}</div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}

function DataTable({
  headers,
  rows,
  selectable = false,
  onRowClick,
}: {
  headers: string[]
  rows: ReactNode[][]
  selectable?: boolean
  onRowClick?: () => void
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {selectable && (
              <th className="check-cell">
                <input aria-label="Seleccionar todas" type="checkbox" />
              </th>
            )}
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} onClick={onRowClick}>
              {selectable && (
                <td className="check-cell">
                  <input
                    aria-label={`Seleccionar fila ${rowIndex + 1}`}
                    type="checkbox"
                  />
                </td>
              )}
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Dashboard({ setScreen }: { setScreen: (screen: Screen) => void }) {
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
        <Button onClick={() => setScreen(4)}>
          <Plus size={16} />
          Nueva evaluación
        </Button>
      }
      screen={1}
      setScreen={setScreen}
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
            onRowClick={() => setScreen(6)}
            rows={recent}
          />
          <Annotation>
            Cada fila lleva al detalle de la evaluación · RF-13
          </Annotation>
        </Section>
      </div>
    </Layout>
  )
}

function Softwares({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const rows = [
    [
      "Odoo ERP",
      "17",
      "Odoo S.A.",
      "Libre",
      "ERP",
      <Status tone="green">Activo</Status>,
      <span className="table-actions">
        <Pencil size={13} /> Consultar
      </span>,
    ],
    [
      "ERPNext",
      "15",
      "Frappe Technologies",
      "Libre",
      "ERP",
      <Status tone="green">Activo</Status>,
      <span className="table-actions">
        <Pencil size={13} /> Consultar
      </span>,
    ],
    [
      "SAP Business One",
      "10",
      "SAP SE",
      "Propietaria",
      "ERP",
      <Status tone="green">Activo</Status>,
      <span className="table-actions">
        <Pencil size={13} /> Consultar
      </span>,
    ],
    [
      "Dolibarr",
      "18",
      "Dolibarr Foundation",
      "Libre",
      "ERP",
      <Status tone="green">Activo</Status>,
      <span className="table-actions">
        <Pencil size={13} /> Consultar
      </span>,
    ],
    [
      "Tryton",
      "7",
      "Tryton Foundation",
      "Libre",
      "ERP",
      <Status tone="green">Activo</Status>,
      <span className="table-actions">
        <Pencil size={13} /> Consultar
      </span>,
    ],
    [
      "Oracle NetSuite",
      "2026",
      "Oracle",
      "Propietaria",
      "ERP",
      <Status tone="green">Activo</Status>,
      <span className="table-actions">
        <Pencil size={13} /> Consultar
      </span>,
    ],
    [
      "Microsoft Dynamics 365",
      "2026",
      "Microsoft",
      "Propietaria",
      "ERP",
      <Status tone="green">Activo</Status>,
      <span className="table-actions">
        <Pencil size={13} /> Consultar
      </span>,
    ],
    [
      "Holded",
      "4",
      "Holded",
      "Suscripción",
      "ERP",
      <Status tone="green">Activo</Status>,
      <span className="table-actions">
        <Pencil size={13} /> Consultar
      </span>,
    ],
    [
      "Openbravo",
      "3",
      "Openbravo",
      "Propietaria",
      "ERP",
      <Status>Inactivo</Status>,
      <span className="table-actions">
        <Pencil size={13} /> Consultar
      </span>,
    ],
  ]
  return (
    <Layout
      action={
        <Button>
          <Plus size={16} />
          Registrar software
        </Button>
      }
      screen={2}
      setScreen={setScreen}
    >
      <div className="split-panel">
        <div className="split-panel__main">
          <div className="filters filters--software">
            <Field label="Buscar" placeholder="Nombre, versión o proveedor" />
            <Field kind="select" label="Proveedor" />
            <Field kind="select" label="Tipo de licencia" />
            <Field kind="select" label="Categoría" />
          </div>
          <Section title="Softwares registrados">
            <DataTable
              headers={[
                "Nombre",
                "Versión",
                "Proveedor",
                "Licencia",
                "Categoría",
                "Estado",
                "Acciones",
              ]}
              rows={rows}
            />
          </Section>
          <Annotation>
            Consulta, búsqueda y filtrado del catálogo · RF-01
          </Annotation>
        </div>
        <aside className="drawer">
          <div className="drawer-title">
            <div className="title-icon">
              <FilePlus2 size={18} />
            </div>
            <h2>Registrar software</h2>
          </div>
          <div className="form-grid form-grid--single">
            <Field label="Nombre" placeholder="Nombre comercial" />
            <Field label="Versión" placeholder="Ej. 2.4" />
            <Field kind="select" label="Tipo de licencia" />
            <Field kind="select" label="Categoría" />
            <Field
              kind="textarea"
              label="Descripción"
              placeholder="Descripción breve"
            />
            <Field kind="select" label="Proveedor" />
            <button className="inline-link" type="button">
              Registrar nuevo proveedor
            </button>
          </div>
          <div className="validation-zone validation-zone--warning">
            <strong>Posible duplicado</strong>
            <span>
              Ya existe un software con el mismo nombre, versión y proveedor.
            </span>
          </div>
          <div className="button-row button-row--end">
            <Button variant="secondary">Cancelar</Button>
            <Button>
              <Save size={15} />
              Guardar
            </Button>
          </div>
          <Annotation>
            Formulario estandarizado, sin datos copiados en celdas sueltas ·
            RF-01
          </Annotation>
        </aside>
      </div>
    </Layout>
  )
}

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

function CriteriaTree({
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

function Criterios({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const [invalid, setInvalid] = useState(false)
  return (
    <Layout
      action={
        <Button disabled={invalid}>
          <Save size={15} />
          Guardar configuración
        </Button>
      }
      screen={3}
      setScreen={setScreen}
    >
      <Section title="Escala de calificación">
        <div className="inline-fields">
          <Field label="Valor mínimo" value="1" />
          <Field label="Valor máximo" value="5" />
          <Annotation>
            Define los valores permitidos para todas las evaluaciones · RF-02
          </Annotation>
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
        <Annotation>
          Los pesos de cada grupo deben sumar 100% · RF-03
        </Annotation>
      </Section>
    </Layout>
  )
}

function NuevaEvaluacion({
  setScreen,
}: {
  setScreen: (screen: Screen) => void
}) {
  return (
    <Layout
      action={
        <Button onClick={() => setScreen(5)}>
          <Save size={15} />
          Guardar y continuar
        </Button>
      }
      screen={4}
      setScreen={setScreen}
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
        <div className="tree-head">
          <span>Dimensión / Factor / Subfactor</span>
          <span>Aplicación</span>
          <span>Peso</span>
        </div>
        <CriteriaTree relevant />
        <Annotation>Se guarda con estado En evaluación · RF-04</Annotation>
      </Section>
      <div className="page-actions">
        <Button variant="secondary">Cancelar</Button>
        <Button onClick={() => setScreen(5)}>
          <Save size={15} />
          Guardar y continuar
        </Button>
      </div>
    </Layout>
  )
}

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

function Scale({ value }: { value: number | null }) {
  const tone =
    value === null ? "" : value >= 4 ? "green" : value >= 3 ? "amber" : "red"
  return (
    <div className="scale" aria-label="Escala de calificación">
      {[1, 2, 3, 4, 5].map((option) => (
        <button
          className={option === value ? `scale__selected scale__${tone}` : ""}
          key={option}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function Calificacion({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <Layout
      action={<Button variant="secondary">Guardar avance</Button>}
      screen={5}
      setScreen={setScreen}
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
        <Annotation>
          Se valida que el valor esté dentro de la escala · RF-05
        </Annotation>
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
          <Button disabled onClick={() => setScreen(6)}>
            Finalizar evaluación
          </Button>
        </div>
      </div>
    </Layout>
  )
}

function Resultados({ setScreen }: { setScreen: (screen: Screen) => void }) {
  return (
    <Layout
      action={<Button variant="secondary">Volver al historial</Button>}
      screen={6}
      setScreen={setScreen}
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
        <Annotation>
          Cálculo, FODA y recomendación automáticos · RF-06 a RF-09
        </Annotation>
      </Section>
    </Layout>
  )
}

function Historial({ setScreen }: { setScreen: (screen: Screen) => void }) {
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
      action={<Button>Comparar seleccionadas</Button>}
      screen={7}
      setScreen={setScreen}
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
              onRowClick={() => setScreen(6)}
              rows={rows}
              selectable
            />
          </Section>
          <Annotation>
            Selección múltiple para comparar evaluaciones · RF-10
          </Annotation>
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
          <Annotation>
            Trazabilidad de fecha, evaluador, campo y valores · RF-11
          </Annotation>
        </aside>
      </div>
    </Layout>
  )
}

function Comparacion({ setScreen }: { setScreen: (screen: Screen) => void }) {
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
      screen={8}
      setScreen={setScreen}
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
      <Annotation>
        Comparación de 2 a 3 evaluaciones para una misma necesidad · RF-12
      </Annotation>
    </Layout>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(1)

  const screens: Record<Screen, ReactNode> = {
    1: <Dashboard setScreen={setScreen} />,
    2: <Softwares setScreen={setScreen} />,
    3: <Criterios setScreen={setScreen} />,
    4: <NuevaEvaluacion setScreen={setScreen} />,
    5: <Calificacion setScreen={setScreen} />,
    6: <Resultados setScreen={setScreen} />,
    7: <Historial setScreen={setScreen} />,
    8: <Comparacion setScreen={setScreen} />,
  }

  return screens[screen]
}
