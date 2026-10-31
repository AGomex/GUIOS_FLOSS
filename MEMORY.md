# MEMORY.md — Bitácora del proyecto GUIOSPRO_FLOSS

Este archivo registra **qué se hizo, qué se está haciendo y qué sigue** en cada
sesión de trabajo. Debe actualizarse **después de cada cambio relevante**.

- **Plan maestro:** [`PLAN.md`](./PLAN.md)
- **Convenciones:** [`AGENTS.md`](./AGENTS.md)
- **Última actualización:** 2026-10-30

---

## Estado actual

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Infraestructura y reorganización | **Completada** |
| 1 | Catálogo y softwares (RF-01, RF-02, RF-03) | **Completada** |
| 2 | Evaluación y cálculo (RF-04, RF-05, RF-06) | **Completada** |
| 3 | Resultados y recomendación (RF-07, RF-08, RF-09) | **Completada** |
| 4 | Historial y trazabilidad (RF-10, RF-11) | Pendiente |
| 5 | Comparación y dashboard (RF-12, RF-13) | Pendiente |

**Próximo paso:** iniciar la Fase 4 — historial de evaluaciones con detalle,
reapertura con motivo y bitácora simple.

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

---

## Registro de cambios

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
