export type DashboardBar = {
  label: string
  value: number
  tone?: "blue" | "green" | "amber" | "red" | "neutral"
}

export function DashboardBars({ bars }: { bars: DashboardBar[] }) {
  const max = Math.max(1, ...bars.map((bar) => bar.value))

  return (
    <div className="bar-chart">
      {bars.map((bar) => (
        <div key={bar.label}>
          <span>{bar.label}</span>
          <i
            className={bar.tone ? `bar--${bar.tone}` : undefined}
            style={{
              width: bar.value ? `${Math.max(4, (bar.value / max) * 100)}%` : "0%",
            }}
          />
          <strong>{bar.value}</strong>
        </div>
      ))}
    </div>
  )
}
