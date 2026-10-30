import { BarChart3 } from "lucide-react"

export function ChartBox({
  label,
  tall = false,
}: {
  label: string
  tall?: boolean
}) {
  return (
    <div className={`chart-box ${tall ? "chart-box--tall" : ""}`}>
      <BarChart3 size={22} />
      {label}
    </div>
  )
}
