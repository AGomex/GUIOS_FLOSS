import { Navigate, Route, Routes } from "react-router-dom"

import { Comparacion } from "@/features/comparison/Comparacion"
import { Criterios } from "@/features/criteria/Criterios"
import { Dashboard } from "@/features/dashboard/Dashboard"
import { NuevaEvaluacion } from "@/features/evaluations/NuevaEvaluacion"
import { Historial } from "@/features/history/Historial"
import { Resultados } from "@/features/results/Resultados"
import { Calificacion } from "@/features/scoring/Calificacion"
import { Softwares } from "@/features/softwares/Softwares"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/softwares" element={<Softwares />} />
      <Route path="/criterios" element={<Criterios />} />
      <Route path="/evaluaciones/nueva" element={<NuevaEvaluacion />} />
      <Route path="/calificacion" element={<Calificacion />} />
      <Route path="/calificacion/:id" element={<Calificacion />} />
      <Route path="/resultados" element={<Resultados />} />
      <Route path="/resultados/:id" element={<Resultados />} />
      <Route path="/historial" element={<Historial />} />
      <Route path="/comparacion" element={<Comparacion />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
