export function RadarChart({ comparison = false }: { comparison?: boolean }) {
  return (
    <div className="radar-chart">
      <svg
        aria-label={
          comparison
            ? "Radar comparativo de tres softwares"
            : "Radar por dimensiones"
        }
        viewBox="0 0 360 190"
      >
        <g className="radar-grid">
          <polygon points="180,18 322,77 268,170 92,170 38,77" />
          <polygon points="180,48 284,91 244,159 116,159 76,91" />
          <polygon points="180,78 246,105 220,148 140,148 114,105" />
          <line x1="180" y1="18" x2="180" y2="130" />
          <line x1="322" y1="77" x2="180" y2="130" />
          <line x1="268" y1="170" x2="180" y2="130" />
          <line x1="92" y1="170" x2="180" y2="130" />
          <line x1="38" y1="77" x2="180" y2="130" />
        </g>
        <polygon
          className="radar-series radar-series--one"
          points="180,29 298,86 251,163 109,162 68,88"
        />
        {comparison && (
          <polygon
            className="radar-series radar-series--two"
            points="180,23 303,83 259,168 117,157 59,85"
          />
        )}
        {comparison && (
          <polygon
            className="radar-series radar-series--three"
            points="180,34 310,81 213,145 137,151 48,80"
          />
        )}
      </svg>
      <div className="radar-labels">
        <span>Funcionalidad</span>
        <span>Usabilidad</span>
        <span>Soporte</span>
        <span>Costo</span>
      </div>
    </div>
  )
}
