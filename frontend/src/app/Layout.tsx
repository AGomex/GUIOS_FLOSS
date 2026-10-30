import type { ReactNode } from "react"
import { NavLink, useLocation } from "react-router-dom"

import { evaluationFlow, menu, screenTitles } from "./navigation"
import type { RouteKey } from "./types"

function Sidebar() {
  const location = useLocation()
  const inEvaluationFlow = ["/evaluaciones", "/calificacion", "/resultados"].some(
    (path) => location.pathname.startsWith(path),
  )

  return (
    <aside className="sidebar">
      <div className="logo">GUIOSPRO_FLOSS</div>
      <nav aria-label="Navegación principal">
        {menu.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => {
              const active =
                isActive || (item.key === "evaluations" && inEvaluationFlow)
              return `nav-item ${active ? "nav-item--active" : ""}`
            }}
          >
            <item.icon size={18} strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      {inEvaluationFlow && (
        <div className="subnav">
          <span>Flujo de evaluación</span>
          {evaluationFlow.map((step) => (
            <NavLink key={step.label} to={step.to}>
              {step.label}
            </NavLink>
          ))}
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

type LayoutProps = {
  screen: RouteKey
  action?: ReactNode
  children: ReactNode
}

export function Layout({ screen, action, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar />
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
