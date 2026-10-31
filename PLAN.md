# PLAN.md — GUIOSPRO_FLOSS

Plan maestro del sistema de evaluación de adopción de software libre (FLOSS).

- **Versión:** 2.0 (alcance ajustado)
- **Fecha:** 2026-10-29
- **Estado:** Fases 0, 1 y 2 completadas · Fase 3 pendiente
- **Bitácora de cambios:** [`MEMORY.md`](./MEMORY.md)

> **Nota de alcance:** proyecto de universidad. Se prioriza la funcionalidad y
> la automatización de resultados sobre el formalismo (CI, Docker, E2E,
> seguridad de despliegue, auditoría granular).

---

## 1. Contexto

| Insumo | Ubicación | Contenido |
|---|---|---|
| Sistema anterior | `reference/legacy-guiospro/` | Prototipo Python + Flexx + pandas |
| Tesis | `docs/source/TESIS.pdf` (local, no versionado) | Dimensiones, factores, subfactores y métricas |
| Documento de trabajo | `docs/source/S7-COMPONENTE PRACTICO_1.pdf` (local) | 13 RF, 12 RNF y modelo de datos |
| Diseño | `reference/design-figma/` | Export de Figma: React + Vite, 8 pantallas |

El objetivo es evolucionar el prototipo a un sistema web con persistencia,
validaciones, cálculo automático, historial, comparación y visualización.

---

## 2. Objetivos

1. Automatizar la cadena de cálculo de GUIOS (IE, IL, IS, ID, IR, PS, PM, FODA y recomendación).
2. Estandarizar el catálogo de criterios y las escalas.
3. Persistir softwares, proveedores, evaluaciones y resultados.
4. Permitir comparar alternativas para una misma necesidad.
5. Entregar una interfaz clara, responsive y en español.

---

## 3. Alcance

### 3.1 Requisitos funcionales (13)

| Código | Requisito | Fase |
|---|---|---|
| RF-01 | Gestión de softwares y proveedores | 1 |
| RF-02 | Catálogo de criterios (dimensión → factor → subfactor) | 1 |
| RF-03 | Escalas y ponderaciones por defecto | 1 |
| RF-04 | Creación y configuración de evaluaciones | 2 |
| RF-05 | Registro de calificaciones con validación | 2 |
| RF-06 | Cálculo automático de ponderaciones y resultados | 2 |
| RF-07 | Presentación de resultados y gráficos | 3 |
| RF-08 | Clasificación FODA automática | 3 |
| RF-09 | Recomendación de adopción | 3 |
| RF-10 | Historial y consulta de evaluaciones | 4 |
| RF-11 | Trazabilidad de las evaluaciones | 4 |
| RF-12 | Comparación de alternativas | 5 |
| RF-13 | Dashboard de indicadores | 5 |

### 3.2 Requisitos no funcionales

Se documentan en [`docs/01-requisitos/requisitos.md`](./docs/01-requisitos/requisitos.md)
pero **no se priorizan**. Se cubren de forma implícita: interfaz en español,
responsive, validación en servidor y mensajes claros.

### 3.3 Fuera de alcance

- Autenticación, cuentas y roles.
- CI, Docker y PostgreSQL (SQLite es suficiente).
- Pruebas E2E, de integración y de endpoints.
- Reportes PDF/XLSX.
- Auditoría campo por campo.
- Perfiles de importancia versionados (se usa uno solo editable).
- Endurecimiento de seguridad para producción.

---

## 4. Modelo de dominio

```text
Dimensión (3)
└── Factor (18)
    └── Subfactor (61)
```

**Dimensiones:** Tecnológica, Organizacional, Económica.

Datos por factor: `NS` (nº de subfactores), `TC` (citas), `IE` (experto),
`IL` (literatura), `IS` (sugerida), `alcance` (`interno`, `externo`, `ambos`).

### 4.1 Métricas

| Indicador | Definición | Origen |
|---|---|---|
| NS | Número de subfactores | Dato |
| TC | Total de citas | Tabla 5.3 |
| IE | Importancia del experto, 1–4 | Tabla 5.3 |
| IL | Importancia de la literatura, 1–4 | Tabla 5.3 |
| IS | Importancia sugerida | `floor((IE + IL) / 2)` |
| ID | Importancia del decisor, 1–4 | Usuario |
| IR | Importancia relativa | `floor((IS + ID) / 2)` |
| PS | Cumplimiento del subfactor, 1–4 | Usuario |
| PM | Ponderación media del factor | Media de sus PS |

Escala de importancia: `1 Irrelevante`, `2 Opcional`, `3 Importante`, `4 Fundamental`.

Escala de cumplimiento: `1 No cumple`, `2 Desconozco`, `3 Cumple parcialmente`, `4 Cumple`.

### 4.2 Reglas

```text
IS = clamp(floor((IE + IL) / 2), 1, 4)
IR = clamp(floor((IS + ID) / 2), 1, 4)
relevante = IR >= 2
PM = media aritmética de los PS del factor
```

**FODA**

```text
Fortaleza   si PM >= umbral y alcance = interno
Debilidad   si PM <  umbral y alcance = interno
Oportunidad si PM >= umbral y alcance = externo
Amenaza     si PM <  umbral y alcance = externo
```

Umbral por defecto: `3` (editable en `ScoringSettings`).

**Recomendación**

| Código | Condición |
|---|---|
| C | Existe Debilidad o Amenaza con IR ≥ 3 |
| B | Existe Debilidad o Amenaza con IR = 2 |
| A | No existe Debilidad ni Amenaza relevante |

**Resultado global**

```text
global = Σ(PM_i × IR_i) / Σ(IR_i)     sobre factores relevantes evaluados
pct    = (global - min) / (max - min) × 100
score5 = 1 + 4 × pct / 100
```

### 4.3 Configuración

Un único registro `ScoringSettings` (singleton) con:

- `scale_min`, `scale_max`;
- `foda_threshold`;
- `relevance_min`.

Cada evaluación guarda un **snapshot JSON** del catálogo y de la configuración,
para que el historial no cambie si se edita el catálogo.

### 4.4 Valores de referencia (Tabla 5.3)

| Dimensión | Factor | NS | TC | IE | IL | IS | Alcance |
|---|---|---|---|---|---|---|---|
| Tecnológica | Compatibilidad | 8 | 33 | 3 | 3 | 3 | externo |
| Tecnológica | Fiabilidad | 5 | 19 | 3 | 3 | 3 | externo |
| Tecnológica | Mantenibilidad | 1 | 4 | 3 | 3 | 3 | externo |
| Tecnológica | Personalización | 6 | 30 | 3 | 4 | 3 | externo |
| Tecnológica | Prueba | 1 | 4 | 3 | 3 | 3 | externo |
| Tecnológica | Documentación | 11 | 20 | 3 | 1 | 2 | externo |
| Tecnológica | Portabilidad | 2 | 4 | 3 | 2 | 2 | externo |
| Tecnológica | Reusabilidad | 2 | 5 | 3 | 2 | 2 | externo |
| Tecnológica | Usabilidad | 4 | 14 | 3 | 2 | 2 | externo |
| Organizacional | Apoyo de la alta dirección | 1 | 5 | 3 | 4 | 3 | interno |
| Organizacional | Formación | 4 | 27 | 3 | 4 | 3 | interno |
| Organizacional | Soporte | 6 | 43 | 3 | 4 | 3 | ambos |
| Organizacional | Actitud hacia el cambio | 2 | 3 | 3 | 1 | 2 | interno |
| Organizacional | Bloqueo de proveedores | 1 | 3 | 3 | 2 | 2 | externo |
| Organizacional | Casos de estudio de adopción FLOSS | 1 | 1 | 3 | 1 | 2 | externo |
| Organizacional | Centralidad de la tecnología de la información | 2 | 2 | 3 | 1 | 2 | interno |
| Organizacional | Tiempo de adopción | 2 | 2 | 3 | 1 | 2 | interno |
| Económica | Coste total de propiedad | 2 | 24 | 3 | 4 | 3 | interno |

> La tesis es la fuente de verdad sobre `factors.csv`. Los textos de los 61
> subfactores provienen de `guiosad_data.csv`.

---

## 5. Arquitectura

```text
frontend/ (React 19 + Vite + TS)  ──HTTP/JSON──►  backend/ (Django 5 + DRF)
                                                        │
                                                   SQLite (dev)
```

- **Motor de cálculo único en Python** (`backend/apps/scoring/engine/`).
- El frontend consume `/preview` y no duplica fórmulas.
- Capas: modelos → serializers → servicios → vistas.

### 5.1 Estructura

```text
Proyecto_GUIOS_FLOSS/
├─ backend/
│  ├─ apps/{core,catalog,software,evaluation,scoring,results,history,comparison,dashboard}/
│  ├─ config/{settings/{base,dev,prod}.py,urls.py,api_urls.py}
│  ├─ manage.py
│  ├─ requirements.txt
│  └─ pyproject.toml
├─ frontend/
│  └─ src/{app,components,features,lib,styles}/
├─ docs/
├─ reference/
├─ PLAN.md · MEMORY.md · README.md · AGENTS.md
```

---

## 6. Modelo de datos

### 6.1 Catálogo

| Tabla | Campos |
|---|---|
| `Dimension` | code, name, description, order, is_active |
| `Factor` | dimension, code, name, description, scope, ns, tc, ie, il, is_value, order, is_active |
| `Subfactor` | factor, code, text, citations, order, is_active |
| `ScoringSettings` | scale_min, scale_max, foda_threshold, relevance_min |

### 6.2 Softwares

| Tabla | Campos |
|---|---|
| `Provider` | name, description, website, is_active |
| `Software` | name, version, provider, license_type, category, description, website, is_active |

Único por `(name, version, provider)`.

### 6.3 Evaluación (Fase 2+)

| Tabla | Campos |
|---|---|
| `Evaluation` | code, software, evaluator, organization, need, status, config_snapshot, dates |
| `EvaluationFactor` | evaluación, factor, nombre, dimensión, alcance, NS, TC, IE, IL, IS, ID, IR, relevante, PM, FODA, peso |
| `EvaluationSubfactor` | factor de evaluación, subfactor, texto, PS, fuente, observación |
| `EvaluationResult` | evaluación, global, porcentaje, escala 1–5, conteos FODA, recomendación, justificación |

Estados: `borrador`, `en_evaluacion`, `finalizada`, `reabierta`.

Al crear la evaluación, los factores con alcance `ambos` se resuelven a
`interno`; el alcance puede cambiarse después desde `/config`.

### 6.4 Soporte

| Tabla | Campos |
|---|---|
| `EvaluationLog` | evaluación, actor, acción, detalle, fecha |
| `Comparison` | necesidad, evaluaciones (2–3), resultado JSON, fecha |

---

## 7. API REST

Base: `/api/v1/`

| Recurso | Endpoints |
|---|---|
| Proveedores | `GET/POST /providers`, `GET/PATCH/DELETE /providers/{id}` |
| Softwares | `GET/POST /softwares`, `GET/PATCH/DELETE /softwares/{id}` |
| Catálogo | `GET/POST /catalog/dimensions`, `/factors`, `/subfactors` |
| Configuración | `GET/PATCH /catalog/settings` |
| Evaluaciones | `GET/POST /evaluations`, `GET/PATCH /evaluations/{id}` |
| Calificaciones | `GET/PUT /evaluations/{id}/scores` |
| Previsualización | `POST /evaluations/{id}/preview` |
| Finalizar / reabrir | `POST /evaluations/{id}/finalize`, `/reopen` |
| Resultados | `GET /evaluations/{id}/results` |
| Comparación | `GET/POST /comparisons` |
| Dashboard | `GET /dashboard/summary` |
| Salud | `GET /health/` |

Convenciones:

- Validación en serializers.
- Errores con sobre `{"error": {code, message, detail}}`.
- Documentación en [`docs/04-api/api.md`](./docs/04-api/api.md).

---

## 8. Frontend

| Código | Pantalla | Ruta |
|---|---|---|
| MK-01 | Dashboard | `/` |
| MK-02 | Softwares | `/softwares` |
| MK-03 | Criterios | `/criterios` |
| MK-04 | Nueva evaluación | `/evaluaciones/nueva` |
| MK-05 | Calificación | `/calificacion/:id` |
| MK-06 | Resultados | `/resultados/:id` |
| MK-07 | Historial | `/historial` |
| MK-08 | Comparación | `/comparacion` |

Identidad visual: navy `#1F3A5F`, naranja `#F28C28`, Inter, responsive.

El catálogo se administra desde **Django admin**. La pantalla `Criterios` es de
solo lectura y permite editar escala y umbral.

---

## 9. Fases (5)

| Fase | Alcance | Entregable | Estado |
|---|---|---|---|
| 0 | Infraestructura | Monorepo, Django + DRF + SQLite, frontend migrado, docs | Completada |
| 1 | RF-01, RF-02, RF-03 | Catálogo 3/18/61, settings, CRUD de software y proveedor, UI | Completada |
| 2 | RF-04, RF-05, RF-06 | Evaluación, calificación, motor y preview | Completada |
| 3 | RF-07, RF-08, RF-09 | Resultados, gráficos, FODA y recomendación | Pendiente |
| 4 | RF-10, RF-11 | Historial, detalle y reapertura | Pendiente |
| 5 | RF-12, RF-13 | Comparación, dashboard y pulido | Pendiente |

### Criterios de aceptación

- **Fase 1:** catálogo sembrado (3/18/61), API funcionando, UI de softwares y
  criterios con datos reales, build sin errores.
- **Fase 2:** motor con golden test de la Tabla 5.3; evaluación de punta a punta.
- **Fase 3:** resultados y FODA reproducibles; recomendación justificada.
- **Fase 4:** historial con detalle y reapertura con motivo.
- **Fase 5:** comparación de 2–3 evaluaciones y dashboard con datos reales.

---

## 10. Pruebas

- **Único test obligatorio:** motor de cálculo
  (`backend/apps/scoring/tests/test_engine.py`).
  - 18 filas de la Tabla 5.3 → IS e IR.
  - PM con 1, 2 y N subfactores.
  - FODA en los cuatro cuadrantes y en el umbral exacto.
  - Recomendación A, B y C.
  - Global en mínimo y máximo.
- Sin tests de endpoints, E2E ni integración.
- `ruff` se mantiene como ayuda de estilo (coste cero).

---

## 11. Convenciones

- Backend: PEP 8, ruff, línea de 100.
- Código en inglés; interfaz y mensajes en español.
- Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Rama `main`; commits directos por fase.

---

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| IL publicada no reproducible con cuartiles | Se siembra la Tabla 5.3; no se recalcula |
| Discrepancia CSV vs tesis | La tesis manda; nota en `docs/02-dominio` |
| Fórmulas divergentes | Motor único en Python + golden test |
| Edición del catálogo altera historial | Snapshot JSON por evaluación |
| SQLite en concurrencia | Un solo usuario; suficiente para la demo |

---

## 13. Decisiones

| # | Decisión |
|---|---|
| D-01 | Django 5 + DRF |
| D-02 | SQLite en desarrollo |
| D-03 | GUIOS de la tesis por defecto |
| D-04 | Resultado global ponderado por IR |
| D-05 | Un solo `ScoringSettings` editable + snapshot |
| D-06 | Motor de cálculo solo en Python |
| D-07 | Refactor del diseño Figma |
| D-08 | 13 RF en 5 fases |
| D-09 | Sin autenticación |
| D-10 | Sin CI, Docker, E2E, reportes ni auditoría granular |
| D-11 | Catálogo administrado desde Django admin |

---

## 14. Próximos pasos

1. Fase 1: modelos, seed, API y UI de catálogo/softwares.
2. Fase 2: motor de cálculo y evaluación.
3. Fase 3: resultados y recomendación.
