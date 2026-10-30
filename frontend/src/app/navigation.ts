import {
  Boxes,
  ClipboardCheck,
  GitCompareArrows,
  History,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
} from "lucide-react"

import type { NavItem, RouteKey } from "./types"

export const menu: NavItem[] = [
  { label: "Dashboard", to: "/", key: "dashboard", icon: LayoutDashboard },
  { label: "Softwares", to: "/softwares", key: "softwares", icon: Boxes },
  { label: "Criterios", to: "/criterios", key: "criteria", icon: ListChecks },
  {
    label: "Evaluaciones",
    to: "/evaluaciones/nueva",
    key: "evaluations",
    icon: ClipboardCheck,
  },
  { label: "Historial", to: "/historial", key: "history", icon: History },
  {
    label: "Comparación",
    to: "/comparacion",
    key: "comparison",
    icon: GitCompareArrows,
  },
]

export const screenTitles: Record<RouteKey, string> = {
  dashboard: "MK-01 Dashboard",
  softwares: "MK-02 Softwares",
  criteria: "MK-03 Criterios",
  evaluations: "MK-04 Nueva evaluación",
  scoring: "MK-05 Calificación",
  results: "MK-06 Resultados",
  history: "MK-07 Historial",
  comparison: "MK-08 Comparación",
}

export const evaluationFlow = [
  { label: "01 Datos", to: "/evaluaciones/nueva", key: "evaluations" },
  { label: "02 Calificación", to: "/calificacion", key: "scoring" },
  { label: "03 Resultados", to: "/resultados", key: "results" },
] as const

export type EvaluationFlowKey = (typeof evaluationFlow)[number]["key"]

export const iconByKey: Record<RouteKey, LucideIcon> = menu.reduce(
  (accumulator, item) => {
    accumulator[item.key] = item.icon
    return accumulator
  },
  {} as Record<RouteKey, LucideIcon>,
)
