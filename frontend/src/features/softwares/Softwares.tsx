import { FilePlus2, Plus, Save } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Layout } from "@/app/Layout"
import { Button } from "@/components/ui/Button"
import { DataTable } from "@/components/ui/DataTable"
import { Field } from "@/components/ui/Field"
import { Section } from "@/components/ui/Section"
import { Status } from "@/components/ui/Status"
import {
  api,
  type Provider,
  type Software,
  type SoftwareInput,
} from "@/lib/api"

type SoftwareForm = {
  name: string
  version: string
  provider: string
  license_type: string
  category: string
  description: string
}

const EMPTY_FORM: SoftwareForm = {
  name: "",
  version: "",
  provider: "",
  license_type: "libre",
  category: "",
  description: "",
}

const LICENSE_OPTIONS = [
  { value: "libre", label: "Libre" },
  { value: "propietaria", label: "Propietaria" },
  { value: "suscripcion", label: "Suscripción" },
  { value: "otra", label: "Otra" },
]

export function Softwares() {
  const [softwares, setSoftwares] = useState<Software[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [form, setForm] = useState<SoftwareForm>(EMPTY_FORM)
  const [search, setSearch] = useState("")
  const [providerFilter, setProviderFilter] = useState("")
  const [licenseFilter, setLicenseFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [softwarePage, providerPage] = await Promise.all([
        api.softwares(),
        api.providers(),
      ])
      setSoftwares(softwarePage.results)
      setProviders(providerPage.results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el listado.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const providerOptions = providers.map((provider) => ({
    value: String(provider.id),
    label: provider.name,
  }))

  const categories = useMemo(
    () => [...new Set(softwares.map((item) => item.category).filter(Boolean))],
    [softwares],
  )

  const filtered = softwares.filter((item) => {
    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term ||
      `${item.name} ${item.version} ${item.provider_name}`
        .toLowerCase()
        .includes(term)
    const matchesProvider =
      !providerFilter || item.provider === Number(providerFilter)
    const matchesLicense = !licenseFilter || item.license_type === licenseFilter
    const matchesCategory = !categoryFilter || item.category === categoryFilter
    return matchesSearch && matchesProvider && matchesLicense && matchesCategory
  })

  async function save() {
    if (!form.name.trim() || !form.version.trim() || !form.provider) {
      setError("Nombre, versión y proveedor son obligatorios.")
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const payload: SoftwareInput = {
      name: form.name.trim(),
      version: form.version.trim(),
      provider: Number(form.provider),
      license_type: form.license_type,
      category: form.category.trim(),
      description: form.description.trim(),
    }

    try {
      await api.createSoftware(payload)
      setForm(EMPTY_FORM)
      setMessage("Software registrado correctamente.")
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar.")
    } finally {
      setSaving(false)
    }
  }

  const rows = filtered.map((item) => [
    item.name,
    item.version,
    item.provider_name,
    item.license_label,
    item.category || "—",
    <Status key={item.id} tone={item.is_active ? "green" : "neutral"}>
      {item.is_active ? "Activo" : "Inactivo"}
    </Status>,
    <span className="table-actions" key={`${item.id}-action`}>
      Consultar
    </span>,
  ])

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
            <Field
              label="Buscar"
              onChange={setSearch}
              placeholder="Nombre, versión o proveedor"
              value={search}
            />
            <Field
              kind="select"
              label="Proveedor"
              onChange={setProviderFilter}
              options={providerOptions}
              placeholder="Todos"
              value={providerFilter}
            />
            <Field
              kind="select"
              label="Tipo de licencia"
              onChange={setLicenseFilter}
              options={LICENSE_OPTIONS}
              placeholder="Todas"
              value={licenseFilter}
            />
            <Field
              kind="select"
              label="Categoría"
              onChange={setCategoryFilter}
              options={categories.map((category) => ({
                value: category,
                label: category,
              }))}
              placeholder="Todas"
              value={categoryFilter}
            />
          </div>

          <Section
            action={
              <span className="annotation">
                {filtered.length} de {softwares.length}
              </span>
            }
            title="Softwares registrados"
          >
            {loading ? (
              <p className="annotation">Cargando softwares…</p>
            ) : (
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
            )}
            {!loading && filtered.length === 0 && (
              <p className="annotation">No hay softwares que coincidan con el filtro.</p>
            )}
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
            <Field
              label="Nombre"
              onChange={(value) => setForm({ ...form, name: value })}
              placeholder="Nombre comercial"
              value={form.name}
            />
            <Field
              label="Versión"
              onChange={(value) => setForm({ ...form, version: value })}
              placeholder="Ej. 17"
              value={form.version}
            />
            <Field
              kind="select"
              label="Tipo de licencia"
              onChange={(value) => setForm({ ...form, license_type: value })}
              options={LICENSE_OPTIONS}
              value={form.license_type}
            />
            <Field
              label="Categoría"
              onChange={(value) => setForm({ ...form, category: value })}
              placeholder="Ej. ERP"
              value={form.category}
            />
            <Field
              kind="textarea"
              label="Descripción"
              onChange={(value) => setForm({ ...form, description: value })}
              placeholder="Descripción breve"
              value={form.description}
            />
            <Field
              kind="select"
              label="Proveedor"
              onChange={(value) => setForm({ ...form, provider: value })}
              options={providerOptions}
              placeholder="Seleccionar proveedor"
              value={form.provider}
            />
          </div>

          {message && <div className="form-message form-message--ok">{message}</div>}
          {error && <div className="form-message form-message--error">{error}</div>}

          <div className="button-row button-row--end">
            <Button onClick={() => setForm(EMPTY_FORM)} variant="secondary">
              Cancelar
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              <Save size={15} />
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </aside>
      </div>
    </Layout>
  )
}
