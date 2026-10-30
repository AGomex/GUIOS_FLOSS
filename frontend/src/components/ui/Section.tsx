import type { ReactNode } from "react"

type SectionProps = {
  title?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function Section({
  title,
  children,
  className = "",
  action,
}: SectionProps) {
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
