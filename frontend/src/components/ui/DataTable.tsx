import type { ReactNode } from "react"

type DataTableProps = {
  headers: string[]
  rows: ReactNode[][]
  selectable?: boolean
  activeRow?: number
  onRowClick?: (rowIndex: number) => void
}

export function DataTable({
  headers,
  rows,
  selectable = false,
  activeRow,
  onRowClick,
}: DataTableProps) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {selectable && (
              <th className="check-cell">
                <input aria-label="Seleccionar todas" type="checkbox" />
              </th>
            )}
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              className={[
                onRowClick ? "row--clickable" : "",
                activeRow === rowIndex ? "row--active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={rowIndex}
              onClick={() => onRowClick?.(rowIndex)}
            >
              {selectable && (
                <td className="check-cell">
                  <input
                    aria-label={`Seleccionar fila ${rowIndex + 1}`}
                    type="checkbox"
                  />
                </td>
              )}
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
