import type { ReactNode } from "react"

export function Annotation({ children }: { children: ReactNode }) {
  return <p className="annotation">{children}</p>
}
