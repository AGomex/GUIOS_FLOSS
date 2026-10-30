export function EvolutionChart() {
  return (
    <div className="line-chart">
      <svg aria-label="Evolución de Odoo por versión" viewBox="0 0 320 130">
        <line x1="30" y1="105" x2="300" y2="105" />
        <line x1="30" y1="20" x2="30" y2="105" />
        <polyline points="65,78 255,46" />
        <circle cx="65" cy="78" r="5" />
        <circle cx="255" cy="46" r="5" />
        <text x="43" y="124">
          v16 · Mar 2026
        </text>
        <text x="225" y="124">
          v17 · Sep 2026
        </text>
        <text x="50" y="68">
          3.55
        </text>
        <text x="245" y="36">
          3.85
        </text>
      </svg>
    </div>
  )
}
