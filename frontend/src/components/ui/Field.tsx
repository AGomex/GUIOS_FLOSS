type FieldProps = {
  label: string
  placeholder?: string
  kind?: "input" | "select" | "textarea"
  wide?: boolean
  value?: string
}

export function Field({
  label,
  placeholder = "",
  kind = "input",
  wide = false,
  value,
}: FieldProps) {
  return (
    <label className={`field ${wide ? "field--wide" : ""}`}>
      <span>{label}</span>
      {kind === "select" ? (
        <select defaultValue={value || ""}>
          <option value="" disabled>
            {placeholder || "Seleccionar"}
          </option>
          {value && <option value={value}>{value}</option>}
          <option>Opción de ejemplo</option>
        </select>
      ) : kind === "textarea" ? (
        <textarea defaultValue={value} placeholder={placeholder} rows={3} />
      ) : (
        <input defaultValue={value} placeholder={placeholder} />
      )}
    </label>
  )
}
