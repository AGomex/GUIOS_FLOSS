export function FactorBars() {
  const bars = [
    ["Adecuación", 90, "green", "4.50"],
    ["Interoperabilidad", 72, "amber", "3.60"],
    ["Facilidad de aprendizaje", 80, "green", "4.00"],
    ["Operabilidad", 92, "green", "4.60"],
    ["Soporte técnico", 40, "red", "2.00"],
    ["Costo total", 80, "green", "4.00"],
  ]
  return (
    <div className="factor-bars">
      {bars.map(([name, width, tone, value]) => (
        <div key={name}>
          <span>{name}</span>
          <i>
            <b
              className={`fill fill--${tone}`}
              style={{ width: `${width}%` }}
            />
          </i>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}
