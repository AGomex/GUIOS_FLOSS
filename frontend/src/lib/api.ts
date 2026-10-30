export type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Dimension = {
  id: number
  code: string
  name: string
  description: string
  order: number
  is_active: boolean
  factors_count: number
}

export type Factor = {
  id: number
  dimension: number
  dimension_name: string
  code: string
  name: string
  description: string
  scope: "interno" | "externo" | "ambos"
  scope_label: string
  ns: number
  tc: number
  ie: number
  il: number
  is_value: number
  order: number
  is_active: boolean
  subfactors_count: number
}

export type Subfactor = {
  id: number
  factor: number
  factor_name: string
  code: string
  text: string
  citations: number
  order: number
  is_active: boolean
}

export type ScoringSettings = {
  scale_min: number
  scale_max: number
  foda_threshold: string
  relevance_min: number
  updated_at: string
}

export type Provider = {
  id: number
  name: string
  description: string
  website: string
  is_active: boolean
  softwares_count: number
}

export type Software = {
  id: number
  name: string
  version: string
  provider: number
  provider_name: string
  license_type: string
  license_label: string
  category: string
  description: string
  website: string
  is_active: boolean
}

export type SoftwareInput = {
  name: string
  version: string
  provider: number
  license_type: string
  category?: string
  description?: string
  website?: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null
    throw new Error(payload?.error?.message ?? `Error ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const api = {
  dimensions: () => request<Paginated<Dimension>>("/catalog/dimensions/"),
  factors: () => request<Paginated<Factor>>("/catalog/factors/"),
  subfactors: () => request<Paginated<Subfactor>>("/catalog/subfactors/"),
  settings: () => request<ScoringSettings>("/catalog/settings/"),
  updateSettings: (data: Partial<ScoringSettings>) =>
    request<ScoringSettings>("/catalog/settings/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  providers: () => request<Paginated<Provider>>("/providers/"),
  softwares: () => request<Paginated<Software>>("/softwares/"),
  createSoftware: (data: SoftwareInput) =>
    request<Software>("/softwares/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}
