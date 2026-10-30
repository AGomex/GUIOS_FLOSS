import { FilePlus2, Pencil, Plus, Save } from "lucide-react"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"

export function Softwares() {
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
      screen="softwares"
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
        </aside>
      </div>
    </Layout>
  )
}
