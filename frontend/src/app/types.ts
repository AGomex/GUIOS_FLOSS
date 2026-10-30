import type { LucideIcon } from "lucide-react"

export type RouteKey =
  | "dashboard"
  | "softwares"
  | "criteria"
  | "evaluations"
  | "scoring"
  | "results"
  | "history"
  | "comparison"

export type NavItem = {
  label: string
  to: string
  key: RouteKey
  icon: LucideIcon
}
