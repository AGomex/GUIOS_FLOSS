type ScaleProps = {
  value: number | null
  min?: number
  max?: number
  disabled?: boolean
  onChange?: (value: number) => void
}

const LABELS = ["No cumple", "Desconozco", "Cumple parcialmente", "Cumple"]

export function Scale({
  value,
  min = 1,
  max = 4,
  disabled = false,
  onChange,
}: ScaleProps) {
  const tone =
    value === null
      ? ""
      : value >= max
        ? "green"
        : value >= max - 1
          ? "amber"
          : "red"

  const options = Array.from({ length: max - min + 1 }, (_, index) => min + index)

  return (
    <div className="scale" aria-label="Escala de calificación">
      {options.map((option) => (
        <button
          aria-label={LABELS[option - 1] ?? String(option)}
          className={option === value ? `scale__selected scale__${tone}` : ""}
          disabled={disabled}
          key={option}
          onClick={() => onChange?.(option)}
          title={LABELS[option - 1] ?? String(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  )
}
