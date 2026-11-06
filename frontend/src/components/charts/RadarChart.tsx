type RadarPoint = {
  label: string
  value: number
}

export type RadarSeriesInput = {
  label: string
  values: number[]
}

type RadarChartProps = {
  data?: RadarPoint[]
  series?: RadarSeriesInput[]
  labels?: string[]
  max?: number
  comparison?: boolean
  ariaLabel?: string
}

const CX = 180
const CY = 105
const RADIUS = 72

function polar(index: number, count: number, ratio: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2
  return {
    x: CX + Math.cos(angle) * RADIUS * ratio,
    y: CY + Math.sin(angle) * RADIUS * ratio,
  }
}

function polygon(count: number, ratio: number) {
  return Array.from({ length: count }, (_, index) => {
    const { x, y } = polar(index, count, ratio)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
}

function StaticRadar({ comparison }: { comparison: boolean }) {
  return (
    <div className="radar-chart">
      <svg
        aria-label={
          comparison
            ? "Radar comparativo de tres softwares"
            : "Radar por dimensiones"
        }
        role="img"
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

const SERIES_CLASSES = [
  "radar-series--one",
  "radar-series--two",
  "radar-series--three",
]

function MultiRadar({
  labels,
  series,
  max,
  ariaLabel,
}: {
  labels: string[]
  series: RadarSeriesInput[]
  max: number
  ariaLabel?: string
}) {
  const count = labels.length
  const safeMax = max > 0 ? max : 1

  return (
    <div className="radar-chart">
      <svg
        aria-label={ariaLabel ?? "Radar comparativo"}
        role="img"
        viewBox="0 0 360 210"
      >
        <g className="radar-grid">
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <polygon key={ratio} points={polygon(count, ratio)} />
          ))}
          {labels.map((label, index) => {
            const { x, y } = polar(index, count, 1)
            return <line key={label} x1={CX} x2={x} y1={CY} y2={y} />
          })}
        </g>
        {series.map((item, seriesIndex) => {
          const points = item.values
            .map((value, index) => {
              const ratio = Math.min(1, Math.max(0, value / safeMax))
              const { x, y } = polar(index, count, ratio)
              return `${x.toFixed(1)},${y.toFixed(1)}`
            })
            .join(" ")
          return (
            <polygon
              className={`radar-series ${
                SERIES_CLASSES[seriesIndex] ?? SERIES_CLASSES[0]
              }`}
              key={item.label}
              points={points}
            />
          )
        })}
        {labels.map((label, index) => {
          const { x, y } = polar(index, count, 1.3)
          const anchor = x < CX - 8 ? "end" : x > CX + 8 ? "start" : "middle"
          return (
            <text
              className="radar-label"
              dominantBaseline="middle"
              key={label}
              textAnchor={anchor}
              x={x}
              y={y}
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export function RadarChart({
  data,
  series,
  labels,
  max = 4,
  comparison = false,
  ariaLabel,
}: RadarChartProps) {
  if (series && labels && labels.length >= 3) {
    return (
      <MultiRadar
        ariaLabel={ariaLabel}
        labels={labels}
        max={max}
        series={series}
      />
    )
  }

  if (!data || data.length < 3) {
    return <StaticRadar comparison={comparison} />
  }

  const points = data
    .map((item, index) => {
      const ratio = Math.min(1, Math.max(0, item.value / max))
      const { x, y } = polar(index, data.length, ratio)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <div className="radar-chart">
      <svg
        aria-label={ariaLabel ?? "Radar por dimensiones"}
        role="img"
        viewBox="0 0 360 210"
      >
        <g className="radar-grid">
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <polygon key={ratio} points={polygon(data.length, ratio)} />
          ))}
          {data.map((item, index) => {
            const { x, y } = polar(index, data.length, 1)
            return <line key={item.label} x1={CX} x2={x} y1={CY} y2={y} />
          })}
        </g>
        <polygon className="radar-series radar-series--one" points={points} />
        {data.map((item, index) => {
          const { x, y } = polar(index, data.length, 1)
          return (
            <circle
              className="radar-dot"
              cx={x}
              cy={y}
              key={item.label}
              r={3}
            />
          )
        })}
        {data.map((item, index) => {
          const { x, y } = polar(index, data.length, 1.32)
          const anchor = x < CX - 8 ? "end" : x > CX + 8 ? "start" : "middle"
          return (
            <text
              dominantBaseline="middle"
              key={item.label}
              textAnchor={anchor}
              x={x}
              y={y}
            >
              <tspan className="radar-label" x={x}>
                {item.label}
              </tspan>
              <tspan className="radar-value" dy="12" x={x}>
                {item.value.toFixed(2)}
              </tspan>
            </text>
          )
        })}
      </svg>
    </div>
  )
}
