import type { ReactNode } from "react"

type StatusTone = "neutral" | "green" | "amber" | "red" | "blue"

export function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: StatusTone
}) {
  return <span className={`status status--${tone}`}>{children}</span>
}
