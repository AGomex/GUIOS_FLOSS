# MEMORY.md — Bitácora del proyecto GUIOSPRO_FLOSS

Este archivo registra **qué se hizo, qué se está haciendo y qué sigue** en cada
sesión de trabajo. Debe actualizarse **después de cada cambio relevante**.

- **Plan maestro:** [`PLAN.md`](./PLAN.md)
- **Convenciones:** [`AGENTS.md`](./AGENTS.md)
- **Última actualización:** 2026-11-23

---

## Estado actual

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Infraestructura y reorganización | **Completada** |
| 1 | Catálogo y softwares (RF-01, RF-02, RF-03) | **Completada** |
| 2 | Evaluación y cálculo (RF-04, RF-05, RF-06) | **Completada** |
| 3 | Resultados y recomendación (RF-07, RF-08, RF-09) | **Completada** |
| 4 | Historial y trazabilidad (RF-10, RF-11) | **Completada** |
| 5 | Comparación y dashboard (RF-12, RF-13) | **Completada** |
| Ext. | Actualización de IL con IA | **Completada** |

**Próximo paso:** probar la clasificación con claves reales de OpenAI o Gemini,
revisar los conteos por factor y pulir detalles de interfaz. No quedan fases
pendientes.

---

## Alcance ajustado (2026-10-29)

A petición del usuario se recortó el formalismo, priorizando funcionalidad y
automatización de valores:

- **Fuera:** CI, Docker/PostgreSQL, Playwright/E2E, reportes PDF/XLSX, tests de
  endpoints, auditoría campo por campo, perfiles versionados, hardening de
  seguridad.
- **Dentro:** un único test del motor de cálculo (Tabla 5.3, FODA,
  recomendación, global) como garantía de los valores automáticos.
- **Perfiles:** un solo `ScoringSettings` editable (escala, umbral, relevancia)
  con snapshot por evaluación.
- **Catálogo:** se administra desde Django admin; la UI de criterios es de solo
  lectura con escala y umbral editables.
- **Fases:** 5 en lugar de 6.

---

## Decisiones vigentes

- Backend: **Django 5 + DRF**, Python 3.12.
- Base de datos: **SQLite** en desarrollo, configuración preparada para PostgreSQL.
- Cálculo: **GUIOS de la tesis** por defecto, con escala y umbral configurables.
- Resultado global: **ponderado por IR**, mostrado en % y escala 1–5.
- Alcance: **13 RF en 5 fases**.
- Configuración: un único `ScoringSettings` editable + snapshot por evaluación.
- Frontend: **React 19 + Vite + TypeScript**, refactor del diseño de Figma.
- Motor de cálculo: **solo en Python**; el frontend no duplica fórmulas.
- Sin autenticación en el alcance inicial.
- Literatura con IA: **juego alternativo** de TC/IL; la Tabla 5.3 queda como base
  por defecto y el evaluador puede elegir o revertir.
- Proveedores IA: **OpenAI, Gemini o heurístico** (`mock`) configurable en `.env`
  de la raíz; sin clave se usa `mock` con recuperación real de artículos.
- Una corrida manual actualiza los **18 factores**; el resto de pantallas solo
  elige el juego.

---

## Registro de cambios

### 2026-11-23 — Corrección del proveedor Gemini

**Qué se hizo**

1. **Diagnóstico**: `gemini-2.0-flash` fue retirado por Google el 1 de junio de
   2026. El `404` no era un problema de clave: `GET /v1beta/models` respondió
   `200` y la clave `AQ.` funcionó con los modelos vigentes.
2. **Modelo por defecto** → `gemini-3.5-flash-lite`, disponible en el nivel
   gratuito y con respuesta inmediata. `gemini-3.8-flash` también es gratuito,
   pero devuelve `503` intermitente por alta demanda; se puede activar editando
   `GEMINI_MODEL` en `.env`.
3. **`GeminiClassifier`**:
   - envía la clave en la cabecera `x-goog-api-key` (ya no en la URL);
   - reintenta ante `429`/`503` y ante tiempo de espera agotado (3 intentos con
     esperas de 2 s y 5 s);
   - traduce los errores al español: modelo retirado (`404`), clave inválida,
     cuota agotada, alta demanda y timeout;
   - elimina la clave de cualquier mensaje antes de mostrarlo.
4. `LITERATURE_PROVIDER` sigue en `mock`; Gemini se elige por corrida en la
   interfaz.

**Archivos afectados**

- `backend/apps/literature/providers/gemini.py`
- `backend/config/settings/base.py`
- `.env`, `.env.example`
- `docs/04-api/api.md`
- `MEMORY.md`

**Verificación**

```text
ruff check / format ............... All checks passed
pytest ............................ 68 passed
Gemini 3.5 Flash-Lite ............. 503 → reintento → 200
Clasificación de muestra .......... artículo afín: relevante; artículo ajeno: no relevante
Modelo retirado (gemini-2.0-flash)  mensaje claro de modelo retirado; clave no filtrada
Clave inválida .................... «La clave de Gemini no es válida.»
```

**Pendiente**

- Ejecutar una corrida completa con Gemini desde la interfaz y revisar los
  conteos por factor.
- Si se prefiere más calidad que velocidad, cambiar `GEMINI_MODEL` a
  `gemini-3.8-flash` (también gratuito, con `503` intermitente).

### 2026-11-22 — Corrección de escalas y validación de criterios

**Qué se hizo**

1. **Backend**:
   - se eliminó el límite fijo `1–4` de `ps` e `id_value` en los serializers de
     evaluación; ahora el rango se valida contra el snapshot de cada evaluación;
   - nueva función `relevance_importance` en el motor: el `ID` usa la escala
     configurada y el `IR` se acota a ella;
   - `EvaluationDetailSerializer` expone `scale_min` y `scale_max`;
   - `ScoringSettingsSerializer` y `ScoringSettings.clean()` validan mínimo,
     máximo, relevancia y umbral FODA;
   - migración `catalog/0003_repair_scoring_settings` que corrige valores
     inválidos; el umbral global pasó de `-1.00` a `3.00`.
2. **Frontend**:
   - `Field` admite `min`, `max` y `step`;
   - `Criterios` valida antes de guardar y muestra mensajes en español;
   - `Calificacion` usa la escala del snapshot de la evaluación, no la global;
   - el aviso de error se limpia cuando el autoguardado vuelve a funcionar.

**Archivos afectados**

- `backend/apps/evaluation/{serializers,services}.py`
- `backend/apps/scoring/engine/{core,__init__}.py`
- `backend/apps/catalog/{models,serializers}.py`
- `backend/apps/catalog/migrations/0003_repair_scoring_settings.py`
- `frontend/src/components/ui/Field.tsx`
- `frontend/src/features/criteria/Criterios.tsx`
- `frontend/src/features/scoring/Calificacion.tsx`
- `frontend/src/lib/api.ts`
- `docs/02-dominio/calculos.md`, `docs/04-api/api.md`

**Verificación**

```text
ruff check / format ............... All checks passed
pytest ............................ 68 passed
makemigrations --check ............ No changes detected
npm run typecheck ................. sin errores
npm run build ..................... ✓ built
ID=5 en evaluación 1–5 ............ 200 · IR 4
ps=5 en evaluación 1–5 ............ 200
ps=6 en evaluación 1–5 ............ 400 «debe estar entre 1 y 5»
ps=5 en snapshot 1–4 .............. 400 «debe estar entre 1 y 4»
umbral negativo o fuera de rango .. 400
```

**Pendiente**

- Revisar visualmente en el navegador que la escala mostrada coincide con la de
  cada evaluación.
- Las evaluaciones existentes conservan su snapshot original.

### 2026-11-22 — Ajustes de textos y presentación

**Qué se hizo**

1. **Textos**: se reemplazó la referencia a la Tabla 5.3 en el panel de
   literatura por una explicación funcional del proceso (recuperar, filtrar,
   contar y calcular IL). La opción de valores base pasó de «Base (tesis)» a
   **«Base del estudio»** en la interfaz, las etiquetas del backend y la
   documentación.
2. **Historial**: botón flotante «Inicio» que aparece al bajar y vuelve arriba
   con desplazamiento suave.
3. **Comparación**: el selector «Todas» ya no se estira a la altura de la lista
   de evaluaciones (`align-items: start`).
4. **Resultados**: separación entre el bloque de dos columnas y la matriz FODA;
   el radar de dimensiones queda centrado dentro de su tarjeta.

**Archivos afectados**

- `frontend/src/features/criteria/LiteraturePanel.tsx`
- `frontend/src/features/evaluations/NuevaEvaluacion.tsx`
- `frontend/src/features/scoring/Calificacion.tsx`
- `frontend/src/features/history/Historial.tsx`
- `frontend/src/styles/index.css`
- `backend/apps/evaluation/serializers.py`, `backend/apps/evaluation/services.py`
- `docs/02-dominio/calculos.md`, `docs/03-arquitectura/arquitectura.md`,
  `docs/04-api/api.md`, `PLAN.md`, `README.md`

**Verificación**

```text
npm run typecheck ................. sin errores
npm run build ..................... ✓ built
pytest ............................ 68 passed
ruff check ........................ All checks passed
```

**Pendiente**

- Probar visualmente los seis ajustes en el navegador (escritorio, tableta y
  móvil).
- Las evaluaciones y bitácoras creadas antes del cambio conservan el texto
  «Base (tesis)» en sus registros históricos.

### 2026-11-21 — Actualización de la importancia de la literatura con IA

**Qué se hizo**

1. **Backend**:
   - nueva app `apps/literature` con `LiteratureRun`, `FactorSearch` y
     `Article`; cada corrida guarda los 18 resultados por factor y los
     artículos recuperados;
   - `keywords.py` con términos de adopción y por factor; `sources.py` consulta
     OpenAlex → Crossref → Semantic Scholar con `httpx`;
   - `providers/` con clasificadores OpenAI, Gemini y heurístico (`mock`, sin
     clave); prompt versionado y `temperature = 0`;
   - `quartiles.py` asigna `IL` por cuartiles de `TC / NS` con interpolación
     lineal (verificado 18/18 contra la Tabla 5.3);
   - `services.py` ejecuta la corrida en un hilo, informa progreso y reutiliza
     veredictos previos como caché;
   - endpoints `/literature/config/`, `GET|POST /literature/runs/`, detalle,
     `/factors/` y `/factors/{code}/`;
   - `Factor.search_chain` + comando `seed_search_chains`;
   - `Evaluation.literature_run` y `POST /evaluations/{id}/literature`;
     `create_evaluation` acepta `literature_run` y los resultados incluyen
     `literature`;
   - configuración `LITERATURE` en settings, variables en `.env.example` y
     `httpx` en `requirements.txt`.
2. **Frontend**:
   - `LiteraturePanel` dentro de `Criterios`: configuración de proveedor y años,
     confirmación, sondeo de progreso, tabla de los 18 factores, artículos
     expandibles con motivo y filtro, y historial de corridas;
   - selector **Base (tesis) / corrida IA** en `NuevaEvaluacion` y en
     `Calificacion`, con cambio reversible sin perder calificaciones;
   - tipos y métodos de literatura en `api.ts`; estilos responsive en
     `index.css`.
3. **Documentación**: `calculos.md` (regla de cuartiles y corrida IA), `api.md`
   (endpoints y ejemplos), `arquitectura.md` (app, flujo y variables),
   `PLAN.md`, `README.md` y esta bitácora.

**Archivos principales**

- `backend/apps/literature/**` (models, services, keywords, sources, quartiles,
  providers, views, serializers, admin, tests, migración)
- `backend/apps/catalog/{models,management/commands/seed_search_chains}.py`
- `backend/apps/evaluation/{models,serializers,services,views}.py`
- `backend/config/{settings/base.py,api_urls.py}`
- `backend/requirements.txt`, `.env.example`
- `frontend/src/features/criteria/LiteraturePanel.tsx`
- `frontend/src/features/criteria/Criterios.tsx`
- `frontend/src/features/evaluations/NuevaEvaluacion.tsx`
- `frontend/src/features/scoring/Calificacion.tsx`
- `frontend/src/lib/api.ts`, `frontend/src/styles/index.css`
- `docs/02-dominio/calculos.md`, `docs/03-arquitectura/arquitectura.md`,
  `docs/04-api/api.md`, `PLAN.md`, `README.md`

**Verificación**

```text
ruff check ........................ All checks passed
pytest ............................ 68 passed
makemigrations --check ............ No changes detected
npm run typecheck ................. sin errores
npm run build ..................... ✓ built
POST /literature/runs (mock) ...... 202 → completada 18/18
GET /literature/runs/4/ ........... 200 · 383 pertinentes · q1 3.75 · q2 9.125 · q3 12.5
POST /evaluations (run 4) ......... 201 · compatibility TC 25 / IL 1
POST /evaluations/{id}/literature .. 200 · vuelve a base y conserva PS
```

**Pendiente**

- Probar la clasificación con claves reales de OpenAI o Gemini; hasta ahora solo
  se validó el modo heurístico con artículos reales de OpenAlex.
- El modo heurístico es permisivo en algunos factores (varios llegan a 25/25);
  ajustar términos si se busca un conteo más estricto sin clave.
- Revisar los datos de demostración y pulir detalles de interfaz.

### 2026-11-05 — Fase 5 completada: comparación y dashboard

**Qué se hizo**

1. **Backend**:
   - `apps/comparison`: `GET /comparisons?ids=1,2,3` y `POST /comparisons`
     comparan 2–3 evaluaciones con resultados reutilizando `results_payload`;
     devuelven dimensiones, fortalezas/debilidades, recomendación, `same_need`
     y `normalized` (escalas distintas);
   - `apps/dashboard`: `GET /dashboard/summary/` agrega softwares registrados y
     evaluados, evaluaciones por estado, distribución A/B/C, promedio y
     evaluaciones recientes;
   - rutas registradas en `config/api_urls.py`.
2. **Frontend**:
   - `Dashboard` con datos reales: métricas, barras por estado, dona de
     recomendaciones, promedio y tabla de recientes navegable;
   - `Comparacion` con selección de 2–3 evaluaciones, filtro por necesidad,
     tabla con el mejor valor por criterio, radar multi-serie, leyenda y avisos
     cuando las escalas o las necesidades difieren;
   - `RadarChart` admite varias series; `DashboardBars` y
     `RecommendationDonut` reciben datos reales;
   - `api.ts` incorpora los tipos y métodos `comparison` y `dashboardSummary`.
3. **Documentación**: API, arquitectura, `PLAN.md` y `README.md` alineados con
   el comportamiento final.

**Archivos principales**

- `backend/apps/comparison/{services,serializers,views,urls}.py`
- `backend/apps/dashboard/{services,views,urls}.py`
- `backend/config/api_urls.py`
- `frontend/src/features/dashboard/Dashboard.tsx`
- `frontend/src/features/comparison/Comparacion.tsx`
- `frontend/src/components/charts/{RadarChart,DashboardBars,RecommendationDonut}.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/styles/index.css`
- `docs/03-arquitectura/arquitectura.md`, `docs/04-api/api.md`
- `PLAN.md`, `README.md`

**Verificación**

```text
manage.py check .................. sin issues
pytest ........................... 61 passed
ruff check / format .............. All checks passed
npm run typecheck ................ sin errores
npm run build .................... ✓ built
GET /dashboard/summary/ .......... 200 · 4 finalizadas · A=2 C=2 · promedio 4.02
GET /comparisons/?ids=1,2 ........ 200 · 2 evaluaciones · 3 dimensiones
POST /comparisons ................ 200
ids inválidos o cantidad fuera de rango → 400
/, /comparacion, /historial ...... 200
```

**Pendiente**

- Los datos locales de demostración comparten software y tienen necesidades
  distintas; la interfaz lo advierte, pero conviene sembrar alternativas
  comparables.
- Sin tests de endpoints por alcance; se mantiene solo el test del motor.

---

### 2026-10-30 — Fase 4 completada: historial, reapertura y bitácora

**Qué se hizo**

1. **Backend**:
   - nuevo modelo `EvaluationLog` (acción, descripción, motivo, responsable y
     fecha) con migración `0002_evaluationlog`;
   - `services.log_event` registra creación, configuración, calificación,
     finalización, actualización y reapertura;
   - `services.reopen` exige motivo de al menos 5 caracteres y solo admite
     evaluaciones finalizadas; al reabrir se conserva el último resultado hasta
     que se vuelva a finalizar;
   - el listado de evaluaciones incluye `software_version`, `provider_name`,
     `recommendation` y `recommendation_label`, y acepta filtros por
     `status`, `software`, `software__provider` y `evaluator`.
2. **API**:
   - `GET /evaluations/{id}/logs` devuelve la bitácora;
   - `POST /evaluations/{id}/reopen` reabre con `reason` obligatorio y `actor`
     opcional (`400` si el motivo es corto, `409` si no está finalizada).
3. **Frontend**:
   - `Historial` conectado a la API: búsqueda por código/software/evaluador,
     filtros de software, evaluador y estado, fila activa y contador;
   - panel de detalle con estado, evaluador, organización, fecha, resultado,
     recomendación, accesos a resultados/calificación y bitácora real;
   - reapertura con motivo obligatorio, mensajes de éxito/error y limpieza del
     filtro de estado para no ocultar la evaluación reabierta;
   - `DataTable` admite fila activa y clic por índice.
4. **Admin**: bitácora de solo lectura.

**Archivos principales**

- `backend/apps/evaluation/models.py`, `migrations/0002_evaluationlog.py`
- `backend/apps/evaluation/services.py`
- `backend/apps/evaluation/serializers.py`
- `backend/apps/evaluation/views.py`
- `backend/apps/evaluation/admin.py`
- `frontend/src/features/history/Historial.tsx`
- `frontend/src/components/ui/DataTable.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/styles/index.css`
- `docs/03-arquitectura/arquitectura.md`, `docs/04-api/api.md`
- `PLAN.md`, `README.md`

**Verificación**

```text
manage.py check .................. sin issues
migrate .......................... evaluation.0002 aplicada
pytest ........................... 61 passed
ruff check / format .............. All checks passed
npm run typecheck ................ sin errores
npm run build .................... ✓ built
GET /evaluations/ ................ 3 · campos nuevos presentes
GET /evaluations/1/logs/ ......... 2 entradas (reapertura y finalización)
POST /evaluations/2/reopen/ ...... 200 · Reabierta · motivo en bitácora
POST /evaluations/2/finalize/ .... 200 · Finalizada
GET ?status=finalizada ........... 3
GET ?search=EV-002 ............... 1
/historial, /resultados/1, /calificacion/1 → 200
```

**Pendiente**

- Fase 5: comparación de 2–3 evaluaciones y dashboard con datos reales.
- Las evaluaciones creadas antes de esta fase no tienen entrada de creación; la
  bitácora se completa desde la primera acción posterior.

---

### 2026-10-30 — Fase 3 completada: resultados, gráficos y recomendación

**Qué se hizo**

1. **Backend**: `results_payload` ahora incluye la escala aplicada
   (`min`, `max`, `foda_threshold`), el desempeño por dimensión y el detalle de
   factores. El promedio por dimensión se calcula como
   `Σ(PM × IR) / Σ(IR)` sobre los factores relevantes de la dimensión.
2. **RadarChart**: componente SVG dinámico para 3 o más dimensiones, con
   etiquetas, valores, anillos y puntos; conserva el modo estático usado por la
   comparación.
3. **FactorBars**: barras dinámicas por factor, con color según el PM y la escala.
4. **Resultados**:
   - resultado global con color según el puntaje y detalle de escala/porcentaje;
   - recomendación A/B/C con justificación y conteos FODA;
   - radar por dimensión y barras de factores ordenadas de menor a mayor PM;
   - matriz FODA con los factores y su PM;
   - tabla de factores filtrable por dimensión y por relevancia;
   - necesidad evaluada, evaluador, organización y enlace a la calificación.
5. **UI**: el placeholder de los selects ya puede seleccionarse para limpiar
   filtros; estilos para radar, barras, conteos y filtros.

**Archivos principales**

- `backend/apps/evaluation/services.py`
- `frontend/src/components/charts/{RadarChart,FactorBars}.tsx`
- `frontend/src/features/results/Resultados.tsx`
- `frontend/src/components/ui/Field.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/styles/index.css`
- `docs/02-dominio/calculos.md`, `docs/04-api/api.md`

**Verificación**

```text
manage.py check .................. sin issues
pytest ........................... 61 passed
ruff check / format .............. All checks passed
npm run typecheck ................ sin errores
npm run build .................... ✓ built
GET /evaluations/1/results/ ...... 200 · scale + 3 dimensiones + 18 factores
Dimensiones EV-001 ............... Tecnológica 4.00 · Organizacional 3.68 · Económica 4.00
Recomendación EV-001 ............. C · 7 fortalezas · 10 oportunidades · 1 debilidad
```

**Pendiente**

- Fase 4: historial con detalle, reapertura con motivo y bitácora.
- Fase 5: comparación de 2–3 evaluaciones y dashboard con datos reales.

---

### 2026-10-30 — Fase 2 completada: evaluación, cálculo y preview

**Qué se hizo**

1. **Motor de cálculo puro** (`apps/scoring/engine/`): `importance`, `is_relevant`,
   `factor_mean`, `classify_foda`, `recommend`, `global_score`, `summarize_swot`
   y `evaluate`; redondeo half-up a dos decimales y errores de negocio propios.
2. **Pruebas golden** (`apps/scoring/tests/test_engine.py`): 60 casos contra la
   Tabla 5.3, matriz IS/IR, relevancia, PM, los cuatro cuadrantes FODA, umbral
   exacto, recomendaciones A/B/C y resultado global mínimo/máximo/ponderado.
3. **Modelos de evaluación**: `Evaluation` (código `EV-00N`, estados, snapshot),
   `EvaluationFactor` (copia del factor con ID, IR, PM, FODA y peso),
   `EvaluationSubfactor` (PS, fuente y observación) y `EvaluationResult`.
4. **Servicios** (`apps/evaluation/services.py`): creación con snapshot del
   catálogo y la configuración, configuración de ID/alcance, guardado de
   calificaciones, preview, finalización y carga de resultados.
5. **API**: `POST/GET/PATCH /evaluations`, `GET/PUT /evaluations/{id}/config`,
   `GET/PUT /evaluations/{id}/scores`, `POST /preview`, `POST /finalize`,
   `GET /results`. Errores con el sobre `{"error": {...}}` vía `api_error`.
6. **Admin**: evaluación con factores inline, factores con subfactores inline y
   resultados.
7. **Frontend**:
   - `NuevaEvaluacion`: formulario real con softwares activos y creación vía API;
   - `Calificacion`: factores y subfactores reales agrupados por dimensión,
     escala configurable, ID y alcance por factor, guardado con autosave y
     vista previa con global, %, escala 1–5, recomendación y FODA;
   - `Resultados`: lectura de `/results` con resultado global, recomendación,
     matriz FODA y detalle de factores;
   - rutas `/calificacion/:id` y `/resultados/:id`, con fallback a la última
     evaluación en curso o finalizada;
   - `Scale` admite mínimo, máximo, deshabilitado y callback.

**Archivos principales**

- `backend/apps/scoring/engine/{core,__init__}.py`
- `backend/apps/scoring/tests/test_engine.py`
- `backend/apps/evaluation/{models,services,serializers,views,urls,admin}.py`
- `backend/apps/evaluation/migrations/0001_initial.py`
- `backend/apps/core/exceptions.py`
- `backend/config/api_urls.py`
- `frontend/src/lib/api.ts`
- `frontend/src/features/evaluations/NuevaEvaluacion.tsx`
- `frontend/src/features/scoring/{Calificacion,Scale}.tsx`
- `frontend/src/features/results/Resultados.tsx`
- `frontend/src/app/App.tsx`
- `frontend/src/styles/index.css`
- `docs/04-api/api.md`, `docs/03-arquitectura/arquitectura.md`

**Verificación**

```text
makemigrations evaluation ........ evaluation.0001_initial
migrate .......................... OK
manage.py check .................. sin issues
makemigrations --check ........... No changes detected
pytest ........................... 61 passed (60 motor + health)
ruff check / format .............. All checks passed
npm run typecheck ................ sin errores
npm run build .................... ✓ built in 946 ms
API crear evaluación ............. 201 · 18 factores copiados
PUT config ....................... 200 · ID y alcance actualizados
PUT scores ....................... 200 · 61 subfactores
POST preview ..................... 200 · global 3.87 · 4.82/5 · C
POST finalize .................... 200 · estado finalizada
GET results ...................... 200 · 18 factores · FODA y justificación
Finalizar incompleta ............. 422 con mensaje en español
Finalizar con 1 de 61 PS ......... 422 · «Quedan 60 subfactores relevantes sin calificar»
Results sin finalizar ............ 404 con sobre de error
Doble finalize ................... 409
```

**Pendiente**

- Fase 3: gráficos por dimensión/factor, pulido de la pantalla de resultados e
  historial de evaluaciones.
- Fase 4: reapertura con motivo y bitácora.
- Fase 5: comparación de 2–3 evaluaciones y dashboard con datos reales.

---

### 2026-10-29 — Fase 1 completada: catálogo y softwares

**Qué se hizo**

1. **Limpieza de alcance**: se eliminaron `.github/` (CI) e `infra/`
   (docker-compose); se actualizaron `PLAN.md`, `README.md`, `AGENTS.md`,
   `docs/01-requisitos`, `docs/02-dominio`, `docs/03-arquitectura` y
   `docs/04-api` para reflejar 5 fases, un solo `ScoringSettings` y la ausencia
   de CI/Docker/E2E/reportes.
2. **Modelos** (`catalog`): `Dimension`, `Factor`, `Subfactor`,
   `ScoringSettings` (singleton con `scale_min`, `scale_max`,
   `foda_threshold`, `relevance_min`).
3. **Modelos** (`software`): `Provider`, `Software` con unicidad
   `(name, version, provider)`.
4. **Migraciones**: `catalog.0001_initial`, `software.0001_initial`.
5. **Datos**: `apps/catalog/data/catalog.json` generado desde
   `guiosad_data.csv` (61 textos) + Tabla 5.3 (NS, TC, IE, IL, IS, alcance).
   Comando idempotente `manage.py seed_catalog`.
6. **Admin**: registro de catálogo (con subfactores inline), configuración,
   proveedores y softwares.
7. **API**: ViewSets de dimensiones, factores, subfactores, proveedores y
   softwares; `GET/PATCH /catalog/settings/`; filtros, búsqueda y paginación
   de 100.
8. **Frontend**:
   - `src/lib/api.ts`: cliente tipado y manejo del sobre de error;
   - `Field` ahora soporta modo controlado y opciones;
   - `Criterios`: árbol real 3/18/61 + edición de escala, umbral y relevancia;
   - `Softwares`: listado real, filtros funcionales y alta desde el drawer.
9. **Ajuste**: `NuevaEvaluacion` muestra un aviso hasta la Fase 2 (el árbol ya
   requiere datos).

**Archivos principales**

- `backend/apps/catalog/{models,admin,serializers,views,urls}.py`
- `backend/apps/catalog/data/catalog.json`
- `backend/apps/catalog/management/commands/seed_catalog.py`
- `backend/apps/software/{models,admin,serializers,views,urls}.py`
- `backend/config/api_urls.py`, `backend/config/settings/base.py`
- `frontend/src/lib/api.ts`
- `frontend/src/features/criteria/{Criterios,CriteriaTree}.tsx`
- `frontend/src/features/softwares/Softwares.tsx`
- `frontend/src/components/ui/Field.tsx`
- `frontend/src/styles/index.css`

**Verificación**

```text
manage.py check .................. sin issues
makemigrations --check ........... No changes detected
seed_catalog (x2) ................ 3 dimensiones, 18 factores, 61 subfactores
pytest ........................... 1 passed
ruff check / format .............. All checks passed
npm run typecheck ................ sin errores
npm run build .................... ✓ built in 861 ms
API (APIClient) .................. health 200 · dimensiones 3 · factores 18
                                   subfactores 61 · settings 200
                                   POST provider 201 · POST software 201
                                   duplicado 400 con mensaje en español
Proxy Vite 5173 → 8000 ........... health ok · dimensiones 3 · factores 18
```

**Pendiente**

- Fase 2: `Evaluation`, `EvaluationFactor`, `EvaluationSubfactor`, motor de
  cálculo, preview y golden test.

---

### 2026-10-29 — Publicación en GitHub

**Qué se hizo**

1. Se excluyeron **todos los PDFs** del control de versiones con la regla `*.pdf`
   en `.gitignore`:
   - `docs/source/TESIS.pdf`
   - `docs/source/S7-COMPONENTE PRACTICO_1.pdf`
   - `reference/legacy-guiospro/Manual tecnico GUIOSPRO FLOSS.pdf`
   Los archivos permanecen en disco; solo salen del índice de Git.
2. Se añadió `docs/source/README.md` explicando qué documentos van ahí y por qué
   no se versionan.
3. Se configuró el remoto `origin` → `https://github.com/AGomex/GUIOS_FLOSS.git`
   (repositorio público, creado vacío).
4. Se rehizo el commit inicial para que el historial no contenga PDFs.

**Archivos afectados**

- `.gitignore`, `docs/source/README.md`, `MEMORY.md`.
- Eliminados del índice (no del disco): los tres PDFs.

**Verificación**

- `git ls-files "*.pdf"` → sin resultados.
- `git ls-remote origin` → vacío antes del push.
- Después del push: `origin/main` apunta a `95e13db` y
  `git ls-tree -r origin/main | grep .pdf` no devuelve nada.

**Resultado**

- Publicado en https://github.com/AGomex/GUIOS_FLOSS (público).
- Rama `main` con seguimiento de `origin/main`.
- Commit publicado: `95e13db chore: inicializa estructura del proyecto y cierra fase 0`.
- Sin PDFs en el historial.

---

### 2026-10-29 — Cierre de la Fase 0

**Qué se hizo**

1. **Documentación de API** en `docs/04-api/api.md`:
   - convenciones (JSON, paginación, filtros, validación);
   - sobre de error `{"error": {code, message, detail}}`;
   - recursos de proveedores, softwares, catálogo, evaluaciones, comparación,
     dashboard y salud;
   - ejemplos de crear evaluación, guardar calificaciones, previsualizar,
     finalizar y reabrir;
   - tabla de reglas de validación con códigos HTTP.
2. **Infraestructura**:
   - `infra/docker-compose.yml` con PostgreSQL 16 + Adminer y healthcheck;
   - `infra/README.md` con uso, variables, respaldo y restauración.
3. **CI** en `.github/workflows/ci.yml`:
   - backend: Python 3.12, `ruff check`, `ruff format --check`,
     `manage.py check`, `makemigrations --check`, `pytest`;
   - frontend: Node 22, `npm ci`, `npm run typecheck`, `npm run build`.
4. **README raíz** con estructura, requisitos, puesta en marcha de backend y
   frontend, PostgreSQL opcional, comandos y estado de fases.
5. **AGENTS.md** con la regla de actualizar `MEMORY.md`, convenciones de
   backend/frontend, reglas de dominio, API, pruebas y Git.

**Archivos afectados**

- Nuevos: `docs/04-api/api.md`, `infra/docker-compose.yml`, `infra/README.md`,
  `.github/workflows/ci.yml`, `README.md`, `AGENTS.md`.
- Actualizado: `MEMORY.md`.

**Verificación**

```text
backend> python manage.py check
System check identified no issues (0 silenced).

backend> python manage.py makemigrations --check --dry-run
No changes detected

backend> python -m pytest
1 passed in 0.47s

backend> ruff check .
All checks passed!

backend> ruff format --check .
86 files already formatted

frontend> npm run typecheck
(tsc --noEmit sin errores)

frontend> npm run build
✓ 2058 modules transformed.
dist/index.html                   0.53 kB │ gzip:  0.33 kB
dist/assets/index-CPm14m3n.css   26.08 kB │ gzip:  6.28 kB
dist/assets/index-DTgsq_3c.js   294.96 kB │ gzip: 91.18 kB
✓ built in 895ms
```

**Pendiente**

- Fase 1: modelos de catálogo, migraciones, fixtures con la Tabla 5.3,
  endpoints y UI de criterios/softwares.

**Commit**

- Commit inicial de la Fase 0: `chore: inicializa estructura del proyecto y
  cierra fase 0` (árbol de trabajo limpio).

---

### 2026-10-29 — Inicio del proyecto y Fase 0

**Qué se hizo**

1. Creación de `PLAN.md` con contexto, objetivos, alcance, modelo de dominio,
   arquitectura, modelo de datos, API, fases, pruebas, riesgos y decisiones.
2. Creación de `MEMORY.md` como bitácora viva.
3. Inicialización del repositorio git (`main`) y `.gitignore`.
4. Reorganización de la raíz:
   - `GUIOSPRO_FLOSS_PROJECT/GUIOSPRO_FLOSS-main 2` → `reference/legacy-guiospro/`
   - `GUIOSPRO_FLOSS_DESIGN` → `reference/design-figma/`
   - PDFs → `docs/source/`
   - se eliminó la carpeta vacía `GUIOSPRO_FLOSS_PROJECT`.
5. Backend:
   - Django 5.2.18 + DRF 3.18.3, `cors-headers`, `django-filter`,
     `drf-spectacular`, `python-dotenv`, `pytest`, `pytest-django`, `ruff`;
   - settings por entorno (`config/settings/{base,dev,prod}.py`);
   - 9 apps: `core`, `catalog`, `software`, `evaluation`, `scoring`, `results`,
     `history`, `comparison`, `dashboard`;
   - endpoint `/api/v1/health/`, sobre de error, Swagger en `/api/docs/`;
   - SQLite migrado.
6. Frontend:
   - diseño copiado a `frontend/` y limpiado de configuración de Figma;
   - reorganizado en `app/`, `components/{ui,charts}/`, `features/*`, `lib/`,
     `styles/`;
   - React Router con las 8 rutas;
   - paleta navy/naranja conservada;
   - eliminado `min-width: 1180px` y añadidas reglas responsive.
7. Documentación base:
   - `docs/README.md`, `docs/01-requisitos/requisitos.md`,
     `docs/02-dominio/calculos.md`, `docs/03-arquitectura/arquitectura.md`.
8. Configuración de desarrollo: `.env.example`, `requirements.txt`,
   `requirements-dev.txt`, `pyproject.toml` (pytest + ruff).

**Hallazgos de la revisión previa**

- El sistema anterior usa Flexx + pandas, sin persistencia ni separación de capas.
- `Guiosad.relevant()` usa `>2` en vez de `>1` (bug); la UI usa `>0` sobre índice
  0-based, que equivale a `IR >= 2`.
- La recomendación por conteo siempre se sobrescribe con la lógica A/B/C.
- `if not foda_list[0]` falla con lista vacía.
- La Tabla 5.3 de la tesis difiere de `factors.csv` en Usabilidad (2 vs 3) y
  Apoyo de la alta dirección (3 vs 2).
- Los valores de IL publicados no coinciden con cuartiles estándar sobre `r_i`.
- El modelo del S7 tiene una tabla `criterios` plana y `proveedores` con columnas
  copiadas de `usuarios`.
- El diseño exportado está en grises y con `min-width: 1180px`; la tesis pide
  navy/naranja, Inter y responsive.

**Verificación**

- `manage.py check` sin issues; `migrate` aplicado; `pytest` 1 passed;
  `ruff check` y `ruff format` en verde.
- `npx tsc --noEmit` y `npm run build` sin errores.

---

## Bitácora de decisiones rápidas

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-10-29 | SQLite en desarrollo | Cero fricción; PostgreSQL opcional con `DB_ENGINE=postgres` |
| 2026-10-29 | Perfiles versionados con snapshot | Permite configurar sin romper evaluaciones históricas |
| 2026-10-29 | Motor único en Python | Evita divergencia de fórmulas entre cliente y servidor |
| 2026-10-29 | Tesis sobre `factors.csv` | La tesis es la fuente académica de referencia |
| 2026-10-29 | Sin autenticación inicial | Fuera del alcance del S7; se puede añadir sin reestructurar |
