type FieldOption = {
  value: string
  label: string
}

type FieldProps = {
  label: string
  placeholder?: string
  kind?: "input" | "select" | "textarea"
  wide?: boolean
  value?: string
  name?: string
  type?: string
  required?: boolean
  options?: FieldOption[]
  onChange?: (value: string) => void
}

export function Field({
  label,
  placeholder = "",
  kind = "input",
  wide = false,
  value,
  name,
  type = "text",
  required = false,
  options,
  onChange,
}: FieldProps) {
  const controlled = onChange !== undefined
  const common = {
    name,
    required,
    value: controlled ? (value ?? "") : undefined,
    defaultValue: controlled ? undefined : value,
    onChange: (event: { target: { value: string } }) => onChange?.(event.target.value),
  }

  return (
    <label className={`field ${wide ? "field--wide" : ""}`}>
      <span>{label}</span>
      {kind === "select" ? (
        <select {...common}>
          <option value="" disabled>
            {placeholder || "Seleccionar"}
          </option>
          {(options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : kind === "textarea" ? (
        <textarea {...common} placeholder={placeholder} rows={3} />
      ) : (
        <input {...common} placeholder={placeholder} type={type} />
      )}
    </label>
  )
}
