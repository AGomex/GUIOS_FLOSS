type ScaleProps = {
  value: number | null
}

export function Scale({ value }: ScaleProps) {
  const tone =
    value === null ? "" : value >= 4 ? "green" : value >= 3 ? "amber" : "red"

  return (
    <div className="scale" aria-label="Escala de calificación">
      {[1, 2, 3, 4, 5].map((option) => (
        <button
          className={option === value ? `scale__selected scale__${tone}` : ""}
          key={option}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  )
}
