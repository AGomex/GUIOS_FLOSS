# AGENTS.md — Convenciones del proyecto

Guía para agentes y colaboradores que trabajen en GUIOSPRO_FLOSS.

## 1. Regla principal

**Después de cada cambio relevante, actualizar [`MEMORY.md`](./MEMORY.md).**

Cada entrada debe indicar:

1. Fecha y título del cambio.
2. Qué se hizo y por qué.
3. Archivos afectados.
4. Cómo se verificó (comandos y resultado).
5. Qué queda pendiente o bloqueado.

El plan maestro es [`PLAN.md`](./PLAN.md). Si una decisión cambia, se actualizan
ambos documentos.

## 2. Estructura

| Carpeta | Responsabilidad |
|---|---|
| `backend/` | API Django + DRF. Toda la lógica de negocio y cálculo. |
| `frontend/` | SPA React + Vite + TypeScript. Solo presentación y consumo de API. |
| `docs/` | Requisitos, dominio, arquitectura y API. |
| `reference/` | Sistema anterior y diseño de Figma. **No modificar.** |

## 3. Backend

- Python 3.12, PEP 8, `ruff` con línea de 100.
- Nombres de código en inglés; textos de interfaz y mensajes de error en español.
- Capas: `models` → `serializers` → `services` → `views`.
- **Una sola implementación del cálculo** en `apps/scoring/engine/`.
  - Funciones puras, sin importar Django.
  - Deterministas, con redondeo explícito.
  - Cubiertas por tests contra la Tabla 5.3 de la tesis.
- Validación siempre en el servidor (RNF-06).
- Migraciones versionadas; nunca editar una migración ya aplicada.
- Cada app nueva requiere: `apps.py`, `models.py`, `serializers.py`, `views.py`,
  `urls.py`, `migrations/`, `tests/`.

### Comandos

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\ruff.exe check .
.\.venv\Scripts\ruff.exe format .
```

## 4. Frontend

- TypeScript estricto; sin `any` implícito.
- Una carpeta por feature en `src/features/`.
- Componentes reutilizables en `src/components/ui/` y `src/components/charts/`.
- Cliente HTTP centralizado en `src/lib/api.ts` (Fase 1).
- **No duplicar fórmulas**: los resultados se piden al backend.
- Estilos en `src/styles/index.css` con los tokens existentes.
- Paleta: navy `#1F3A5F`, naranja `#F28C28`, fondo neutro claro.
- Interfaz en español; código en inglés.
- Diseño responsive: escritorio, tableta y móvil (RNF-03).

### Comandos

```bash
cd frontend
npm run dev
npm run typecheck
npm run build
```

## 5. Dominio

Antes de tocar cálculos, leer [`docs/02-dominio/calculos.md`](./docs/02-dominio/calculos.md).

Reglas que no se deben romper:

```text
IS = max(1, floor((IE + IL) / 2))
IR = max(1, floor((IS + ID) / 2))
relevante = IR >= 2
PM = media aritmética de PS
FODA según PM, umbral y alcance
Recomendación A/B/C por Debilidad/Amenaza e IR
global = Σ(PM × IR) / Σ(IR)
```

- La tesis (Tabla 5.3) es la fuente de verdad sobre `factors.csv`.
- Los valores de IL se siembran; no se recalculan.
- Un único `ScoringSettings` editable (escala, umbral, relevancia mínima).
- Cada evaluación guarda un snapshot JSON del catálogo y la configuración.
- El catálogo se administra desde **Django admin**, no desde un CRUD propio.

## 6. API

- Base `/api/v1/`.
- Errores con el sobre `{"error": {"code", "message", "detail"}}`.
- Documentación en [`docs/04-api/api.md`](./docs/04-api/api.md).
- Toda ruta nueva debe registrarse en `config/api_urls.py`.
- OpenAPI se genera con `drf-spectacular`.

## 7. Pruebas

| Nivel | Herramienta |
|---|---|
| Motor de cálculo (obligatorio) | pytest contra la Tabla 5.3 |
| Tipado y build frontend | tsc + vite |

No se escriben tests de endpoints, E2E ni integración. El único test que se
mantiene es el del motor, porque garantiza los valores automáticos.

Ningún cambio se considera terminado si `pytest`, `ruff check` o
`npm run build` fallan.

## 8. Git

- Ramas: `main` estable; `feat/<fase>-<tema>` para trabajo nuevo.
- Commits en Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`.
- Un commit por cambio coherente; no mezclar refactor y funcionalidad.
- No versionar `.env`, `db.sqlite3`, `node_modules/` ni `dist/`.

## 9. Idioma

- Código, nombres de variables, tablas y endpoints: inglés.
- Interfaz, mensajes de validación y documentación de usuario: español.
- Comentarios y docstrings: español, breves y útiles.

## 10. Lista de verificación antes de cerrar una tarea

- [ ] Cambio implementado y probado.
- [ ] `ruff check .` y `pytest` en verde.
- [ ] `npm run typecheck` y `npm run build` en verde (si aplica).
- [ ] Documentación actualizada.
- [ ] `MEMORY.md` actualizado.
- [ ] `git status` revisado; sin artefactos.
