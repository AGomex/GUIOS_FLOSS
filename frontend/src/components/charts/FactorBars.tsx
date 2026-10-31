type FactorBar = {
  name: string
  value: number
  label?: string
}

type FactorBarsProps = {
  bars: FactorBar[]
  max?: number
}

export function FactorBars({ bars, max = 4 }: FactorBarsProps) {
  if (bars.length === 0) {
    return <p className="annotation">No hay factores relevantes evaluados.</p>
  }

  return (
    <div className="factor-bars">
      {bars.map((bar) => {
        const tone =
          bar.value >= max ? "green" : bar.value >= max - 1 ? "amber" : "red"
        const width = Math.min(100, Math.max(0, (bar.value / max) * 100))
        return (
          <div key={bar.name}>
            <span title={bar.name}>{bar.name}</span>
            <i>
              <b
                className={`fill fill--${tone}`}
                style={{ width: `${width}%` }}
              />
            </i>
            <strong>{bar.label ?? bar.value.toFixed(2)}</strong>
          </div>
        )
      })}
    </div>
  )
}
