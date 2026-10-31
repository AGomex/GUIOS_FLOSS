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

export type EvaluationStatus =
  | "borrador"
  | "en_evaluacion"
  | "finalizada"
  | "reabierta"
  | "cancelada"

export type EvaluationSummary = {
  id: number
  code: string
  software: number
  software_label: string
  software_version: string
  provider_name: string
  evaluator: string
  organization: string
  need: string
  status: EvaluationStatus
  status_label: string
  score_5: string | null
  recommendation: "A" | "B" | "C" | null
  recommendation_label: string | null
  created_at: string
  updated_at: string
}

export type EvaluationLog = {
  id: number
  action:
    | "created"
    | "configured"
    | "scored"
    | "finalized"
    | "reopened"
    | "updated"
  action_label: string
  description: string
  reason: string
  actor: string
  created_at: string
}

export type EvaluationSubfactor = {
  id: number
  code: string
  text: string
  ps: number | null
  source: string
  note: string
  order: number
}

export type EvaluationFactor = {
  id: number
  factor: number
  code: string
  name: string
  dimension_name: string
  scope: "interno" | "externo"
  ns: number
  tc: number
  ie: number
  il: number
  is_value: number
  id_value: number
  ir: number
  is_relevant: boolean
  pm: string | null
  foda: string
  foda_label: string
  weight: number
  order: number
  subfactors: EvaluationSubfactor[]
}

export type EvaluationDetail = EvaluationSummary & {
  factors: EvaluationFactor[]
}

export type EvaluationInput = {
  software: number
  evaluator: string
  organization?: string
  need: string
}

export type ScoreItem = {
  subfactor: number
  ps: number | null
  source?: string
  note?: string
}

export type ConfigItem = {
  factor: number
  id_value?: number
  scope?: "interno" | "externo"
}

export type SwotSummary = {
  fortalezas: string[]
  oportunidades: string[]
  debilidades: string[]
  amenazas: string[]
}

export type PreviewFactor = {
  code: string
  name: string
  dimension: string
  scope: string
  ie: number
  il: number
  is_value: number
  id_value: number
  ir: number
  is_relevant: boolean
  pm: string | null
  weight: number
  foda: string | null
  foda_label: string
  pending: boolean
}

export type EvaluationPreview = {
  factors: PreviewFactor[]
  swot: SwotSummary
  recommendation: {
    code: "A" | "B" | "C"
    label: string
    reasons: string[]
  }
  pending: number
  global: string | null
  percentage: string | null
  score_5: string | null
}

export type ResultFactor = {
  id: number
  name: string
  dimension: string
  scope: "interno" | "externo"
  ir: number
  is_relevant: boolean
  pm: string | null
  foda: string
  foda_label: string
  weight: number
}

export type ResultDimension = {
  name: string
  average: string | null
  percentage: string | null
  factors: number
}

export type EvaluationResults = {
  evaluation: {
    id: number
    code: string
    software: string
    software_version: string
    evaluator: string
    organization: string
    need: string
    status: EvaluationStatus
    status_label: string
    finished_at: string
  }
  global: string
  percentage: string
  score_5: string
  scale: {
    min: number
    max: number
    foda_threshold: string
  }
  recommendation: {
    code: "A" | "B" | "C"
    label: string
    reasons: string[]
  }
  swot: SwotSummary
  counts: {
    strengths: number
    opportunities: number
    weaknesses: number
    threats: number
  }
  dimensions: ResultDimension[]
  factors: ResultFactor[]
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
  evaluations: (params?: {
    status?: string
    software?: string
    evaluator?: string
    search?: string
  }) => {
    const query = new URLSearchParams()
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })
    const suffix = query.toString() ? `?${query.toString()}` : ""
    return request<Paginated<EvaluationSummary>>(`/evaluations/${suffix}`)
  },
  evaluation: (id: number) => request<EvaluationDetail>(`/evaluations/${id}/`),
  createEvaluation: (data: EvaluationInput) =>
    request<EvaluationDetail>("/evaluations/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEvaluation: (id: number, data: Partial<EvaluationInput>) =>
    request<EvaluationDetail>(`/evaluations/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  updateConfig: (id: number, factors: ConfigItem[]) =>
    request<EvaluationFactor[]>(`/evaluations/${id}/config/`, {
      method: "PUT",
      body: JSON.stringify({ factors }),
    }),
  updateScores: (id: number, scores: ScoreItem[]) =>
    request<EvaluationSubfactor[]>(`/evaluations/${id}/scores/`, {
      method: "PUT",
      body: JSON.stringify({ scores }),
    }),
  previewEvaluation: (id: number) =>
    request<EvaluationPreview>(`/evaluations/${id}/preview/`, {
      method: "POST",
    }),
  finalizeEvaluation: (id: number) =>
    request<{ status: string; result: EvaluationPreview }>(
      `/evaluations/${id}/finalize/`,
      { method: "POST" },
    ),
  evaluationResults: (id: number) =>
    request<EvaluationResults>(`/evaluations/${id}/results/`),
  evaluationLogs: (id: number) =>
    request<EvaluationLog[]>(`/evaluations/${id}/logs/`),
  reopenEvaluation: (id: number, reason: string, actor = "") =>
    request<EvaluationDetail>(`/evaluations/${id}/reopen/`, {
      method: "POST",
      body: JSON.stringify({ reason, actor }),
    }),
}
