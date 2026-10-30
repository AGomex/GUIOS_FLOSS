# MEMORY.md — Bitácora del proyecto GUIOSPRO_FLOSS

Este archivo registra **qué se hizo, qué se está haciendo y qué sigue** en cada
sesión de trabajo. Debe actualizarse **después de cada cambio relevante**.

- **Plan maestro:** [`PLAN.md`](./PLAN.md)
- **Convenciones:** [`AGENTS.md`](./AGENTS.md)
- **Última actualización:** 2026-10-29

---

## Estado actual

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Infraestructura y reorganización | **Completada** |
| 1 | Catálogo y softwares (RF-01, RF-02, RF-03) | Pendiente |
| 2 | Evaluación y cálculo (RF-04, RF-05, RF-06) | Pendiente |
| 3 | Resultados y recomendación (RF-07, RF-08, RF-09) | Pendiente |
| 4 | Historial y trazabilidad (RF-10, RF-11) | Pendiente |
| 5 | Comparación y dashboard (RF-12, RF-13) | Pendiente |
| 6 | QA y RNF | Pendiente |

**Próximo paso:** iniciar la Fase 1 — sembrar el catálogo (3 dimensiones, 18
factores, 61 subfactores) y construir el CRUD de proveedores y softwares.

---

## Decisiones vigentes

- Backend: **Django 5 + DRF**, Python 3.12.
- Base de datos: **SQLite** en desarrollo, configuración preparada para PostgreSQL.
- Cálculo: **GUIOS de la tesis** por defecto, normalizado y configurable por perfiles.
- Resultado global: **ponderado por IR**, mostrado en % y escala 1–5.
- Alcance: **13 RF en 6 fases**.
- Frontend: **React 19 + Vite + TypeScript**, refactor del diseño de Figma.
- Motor de cálculo: **solo en Python**; el frontend no duplica fórmulas.
- Sin autenticación en el alcance inicial.

---

## Registro de cambios

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
