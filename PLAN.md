# PLAN.md — GUIOSPRO_FLOSS

Plan maestro del proyecto de mejora del sistema de evaluación de adopción de software libre (FLOSS).

- **Versión:** 1.0
- **Fecha:** 2026-10-29
- **Estado:** Fase 0 completada · Fase 1 pendiente
- **Bitácora de cambios:** [`MEMORY.md`](./MEMORY.md)

---

## 1. Contexto

El proyecto parte de tres insumos:

| Insumo | Ubicación | Contenido |
|---|---|---|
| Sistema anterior | `reference/legacy-guiospro/` | Prototipo GUIOSPRO_FLOSS en Python + Flexx + pandas |
| Documentación académica | `docs/source/TESIS.pdf` | Tesis: dimensiones, factores, subfactores y métricas NS, TC, IE, IL |
| Documento de trabajo | `docs/source/S7-COMPONENTE PRACTICO_1.pdf` | 13 requisitos funcionales, 12 no funcionales, modelo de datos y diseño |
| Diseño | `reference/design-figma/` | Export de Figma Make: React + Vite, 8 pantallas |

El objetivo no es reemplazar el prototipo, sino evolucionarlo a un sistema web centralizado con persistencia, validaciones, trazabilidad, historial, comparación y visualización de resultados.

---

## 2. Objetivos

1. Automatizar la cadena de cálculo de GUIOS (IE, IL, IS, ID, IR, PS, PM, FODA y recomendación).
2. Estandarizar el catálogo de criterios y las escalas.
3. Persistir softwares, proveedores, evaluaciones y resultados en base de datos.
4. Garantizar trazabilidad y reproducibilidad de cada evaluación.
5. Permitir comparar alternativas para una misma necesidad organizacional.
6. Entregar una interfaz clara, responsive y en español, basada en el diseño existente.

---

## 3. Alcance

### 3.1 Requisitos funcionales (13)

| Código | Requisito | Módulo | Fase |
|---|---|---|---|
| RF-01 | Gestión de softwares y proveedores | Gestión de softwares | 1 |
| RF-02 | Catálogo de criterios (dimensión → factor → subfactor) | Gestión de criterios | 1 |
| RF-03 | Escalas y ponderaciones por defecto | Gestión de criterios | 1 |
| RF-04 | Creación y configuración de evaluaciones | Evaluación | 2 |
| RF-05 | Registro de calificaciones con validación | Evaluación | 2 |
| RF-06 | Cálculo automático de ponderaciones y resultados | Procesamiento | 2 |
| RF-07 | Presentación de resultados y gráficos | Resultados | 3 |
| RF-08 | Clasificación FODA automática | Resultados | 3 |
| RF-09 | Recomendación de adopción | Recomendaciones | 3 |
| RF-10 | Historial y consulta de evaluaciones | Historial | 4 |
| RF-11 | Trazabilidad de las evaluaciones | Historial | 4 |
| RF-12 | Comparación de alternativas | Comparación | 5 |
| RF-13 | Dashboard de indicadores | Dashboard | 5 |

### 3.2 Requisitos no funcionales (12)

RNF-01 usabilidad · RNF-02 compatibilidad · RNF-03 diseño adaptable · RNF-04 rendimiento · RNF-05 exactitud de cálculo · RNF-06 integridad de datos · RNF-07 persistencia y centralización · RNF-08 trazabilidad y auditoría · RNF-09 mantenibilidad y extensibilidad · RNF-10 escalabilidad · RNF-11 disponibilidad y respaldo · RNF-12 claridad de mensajes.

### 3.3 Fuera de alcance inicial

- Autenticación, cuentas y roles (el evaluador se registra como texto libre).
- Notificaciones y reportes programados.
- Integraciones externas.

---

## 4. Modelo de dominio

### 4.1 Catálogo

```
Dimensión (3)
└── Factor (18)
    └── Subfactor (61)
```

- **Dimensiones:** Tecnológica, Organizacional, Económica.
- **Factores:** 18, cada uno con alcance `interno`, `externo` o `ambos`.
- **Subfactores:** 61, redactados en positivo.

Datos por factor: `NS` (nº de subfactores), `TC` (total de citas), `IE` (importancia del experto), `IL` (importancia de la literatura), `IS` (importancia sugerida).

### 4.2 Métricas e indicadores

| Indicador | Definición | Origen |
|---|---|---|
| NS | Número de subfactores del factor | Dato |
| TC | Total de citas del factor | Dato (Tabla 5.3) |
| IE | Importancia del experto, 1–4 | Encuesta (Tabla 5.3) |
| IL | Importancia de la literatura, 1–4 | Cuartil de `r_i = c_i / n` |
| IS | Importancia sugerida, 1–4 | Matriz `floor((IE + IL) / 2)` |
| ID | Importancia del decisor, 1–4 | Entrada del usuario |
| IR | Importancia relativa, 1–4 | Matriz `floor((IS + ID) / 2)` |
| PS | Ponderación del subfactor, 1–4 | Entrada del usuario |
| PM | Ponderación media del factor | Media de sus PS |

Escala de importancia: `1 Irrelevante`, `2 Opcional`, `3 Importante`, `4 Fundamental`.

Escala de cumplimiento (PS): `1 No cumple el requisito`, `2 Desconozco si cumple`, `3 Cumple parcialmente`, `4 Cumple el requisito`.

### 4.3 Reglas de cálculo

```
IS = clamp(floor((IE + IL) / 2), 1, 4)
IR = clamp(floor((IS + ID) / 2), 1, 4)
relevante = IR >= 2
PM = media aritmética de los PS del factor
```

**FODA**

```
FODA(PM, alcance) =
  Fortaleza   si PM >= umbral y alcance = interno
  Debilidad   si PM <  umbral y alcance = interno
  Oportunidad si PM >= umbral y alcance = externo
  Amenaza     si PM <  umbral y alcance = externo
```

Umbral por defecto: `3` sobre escala 1–4.

**Recomendación**

| Código | Condición |
|---|---|
| C | Existe Debilidad o Amenaza con IR ≥ 3 |
| B | Existe Debilidad o Amenaza con IR = 2 |
| A | No existe Debilidad ni Amenaza relevante |

**Resultado global**

```
global = Σ(PM_i × IR_i) / Σ(IR_i)     sobre factores relevantes evaluados
pct    = (global - min) / (max - min) × 100
score5 = 1 + 4 × pct / 100
```

### 4.4 Normalización y perfiles

- El modelo GUIOS es el valor por defecto.
- Todo valor se normaliza a porcentaje para visualización y comparación.
- Un `ImportanceProfile` versionado define: escala, matrices IS/IR, umbral FODA, modo de ponderación y reglas de recomendación.
- Cada evaluación guarda un **snapshot** del perfil y del catálogo usados.
- Si dos evaluaciones comparadas usan perfiles distintos, se normaliza y se advierte (RF-12).

### 4.5 Valores de referencia (Tabla 5.3 de la tesis)

| Dimensión | Factor | NS | TC | IE | IL | IS |
|---|---|---|---|---|---|---|
| Tecnológica | Compatibilidad | 8 | 33 | 3 | 3 | 3 |
| Tecnológica | Fiabilidad | 5 | 19 | 3 | 3 | 3 |
| Tecnológica | Mantenibilidad | 1 | 4 | 3 | 3 | 3 |
| Tecnológica | Personalización | 6 | 30 | 3 | 4 | 3 |
| Tecnológica | Prueba | 1 | 4 | 3 | 3 | 3 |
| Tecnológica | Documentación | 11 | 20 | 3 | 1 | 2 |
| Tecnológica | Portabilidad | 2 | 4 | 3 | 2 | 2 |
| Tecnológica | Reusabilidad | 2 | 5 | 3 | 2 | 2 |
| Tecnológica | Usabilidad | 4 | 14 | 3 | 2 | 2 |
| Organizacional | Apoyo de la alta dirección | 1 | 5 | 3 | 4 | 3 |
| Organizacional | Formación | 4 | 27 | 3 | 4 | 3 |
| Organizacional | Soporte | 6 | 43 | 3 | 4 | 3 |
| Organizacional | Actitud hacia el cambio | 2 | 3 | 3 | 1 | 2 |
| Organizacional | Bloqueo de proveedores | 1 | 3 | 3 | 2 | 2 |
| Organizacional | Casos de estudio de adopción FLOSS | 1 | 1 | 3 | 1 | 2 |
| Organizacional | Centralidad de la tecnología de la información | 2 | 2 | 3 | 1 | 2 |
| Organizacional | Tiempo de adopción | 2 | 2 | 3 | 1 | 2 |
| Económica | Coste total de propiedad (TCO) | 2 | 24 | 3 | 4 | 3 |

> **Nota:** `factors.csv` del sistema anterior difiere de la tesis en Usabilidad (3 vs 2) y Apoyo de la alta dirección (2 vs 3). Se usa la tesis como fuente de verdad.

---

## 5. Arquitectura

```
┌──────────────────────┐        HTTP/JSON        ┌──────────────────────┐
│  frontend/           │ ──────────────────────► │  backend/            │
│  React 19 + Vite     │ ◄────────────────────── │  Django 5 + DRF      │
│  TypeScript          │                         │  Python 3.12         │
└──────────────────────┘                         └──────────┬───────────┘
                                                            │
                                                   ┌────────▼─────────┐
                                                   │ SQLite (dev)     │
                                                   │ PostgreSQL (prod)│
                                                   └──────────────────┘
```

- El **motor de cálculo vive solo en Python** (`backend/apps/scoring`). El frontend consume `/preview` para mostrar resultados en vivo y no duplica fórmulas.
- Backend con capas: modelos → serializers (validación) → servicios (cálculo) → vistas.
- Frontend por features, con cliente API centralizado.

### 5.1 Estructura de carpetas

```
Proyecto_GUIOS_FLOSS/
├─ backend/
│  ├─ config/
│  │  ├─ settings/{base,dev,prod}.py
│  │  ├─ urls.py
│  │  ├─ asgi.py
│  │  └─ wsgi.py
│  ├─ apps/
│  │  ├─ core/            utilidades compartidas, modelos base, auditoría
│  │  ├─ catalog/         escalas, dimensiones, factores, subfactores, perfiles
│  │  ├─ software/        proveedores y softwares
│  │  ├─ evaluation/      evaluaciones, snapshots, calificaciones
│  │  ├─ scoring/         motor de cálculo puro + tests
│  │  ├─ results/         resultados, FODA, recomendación, reportes
│  │  ├─ history/         bitácora y reapertura
│  │  ├─ comparison/      comparación de alternativas
│  │  └─ dashboard/       indicadores
│  ├─ fixtures/           catálogo inicial en JSON
│  ├─ manage.py
│  ├─ requirements.txt
│  └─ pyproject.toml
├─ frontend/
│  ├─ src/
│  │  ├─ app/             router, layout, providers
│  │  ├─ components/ui/   componentes reutilizables
│  │  ├─ components/charts/
│  │  ├─ features/        una carpeta por módulo
│  │  ├─ lib/             api, hooks, formatos
│  │  └─ styles/          tokens y estilos globales
│  ├─ index.html
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ docs/
│  ├─ source/             TESIS.pdf y S7
│  ├─ 01-requisitos/
│  ├─ 02-dominio/
│  ├─ 03-arquitectura/
│  └─ 04-api/
├─ reference/
│  ├─ legacy-guiospro/    sistema anterior congelado
│  └─ design-figma/       diseño original congelado
├─ infra/                 docker-compose, .env.example
├─ .github/workflows/     CI
├─ PLAN.md
├─ MEMORY.md
└─ README.md
```

---

## 6. Modelo de datos

### 6.1 Catálogo

| Tabla | Campos principales |
|---|---|
| `Scale` | nombre, mínimo, máximo, etiquetas JSON, activo |
| `Dimension` | código, nombre, descripción, orden, activo |
| `Factor` | dimensión, código, nombre, descripción, alcance, NS, TC, IE, IL, IS, orden, activo |
| `Subfactor` | factor, código, texto, citas, orden, activo |
| `ImportanceProfile` | nombre, versión, escala, matrices IS/IR, umbral FODA, modo de ponderación, reglas, activo, por defecto |

### 6.2 Softwares

| Tabla | Campos principales |
|---|---|
| `Provider` | nombre, descripción, sitio web, activo |
| `Software` | nombre, versión, proveedor, licencia, categoría, descripción, sitio web, activo |

Restricción: único por `(nombre, versión, proveedor)`.

### 6.3 Evaluación

| Tabla | Campos principales |
|---|---|
| `Evaluation` | código, software, evaluador, organización, necesidad, estado, perfil, fechas |
| `EvaluationConfigSnapshot` | evaluación, catálogo y perfil serializados (JSON) |
| `EvaluationFactor` | evaluación, factor de catálogo, nombre, dimensión, alcance resuelto, NS, TC, IE, IL, IS, ID, IR, relevante, PM, FODA, peso |
| `EvaluationSubfactor` | factor de evaluación, subfactor de catálogo, texto, PS, fuente, observación |
| `EvaluationResult` | evaluación, global crudo, porcentaje, escala 1–5, conteos FODA, recomendación, justificación JSON |

Estados de evaluación: `borrador`, `en_evaluacion`, `finalizada`, `cancelada`, `reabierta`.

### 6.4 Soporte

| Tabla | Campos principales |
|---|---|
| `AuditLog` | evaluación, actor, acción, campo, valor anterior, valor nuevo, motivo, fecha |
| `Comparison` | necesidad, evaluaciones (2–3), resultado JSON, fecha |
| `Report` | evaluación, tipo, formato, archivo, fecha |

---

## 7. API REST

Base: `/api/v1/`

| Recurso | Endpoints |
|---|---|
| Proveedores | `GET/POST /providers`, `GET/PATCH/DELETE /providers/{id}` |
| Softwares | `GET/POST /softwares`, `GET/PATCH/DELETE /softwares/{id}` |
| Catálogo | `GET/POST /catalog/dimensions`, `/factors`, `/subfactors` |
| Escalas | `GET/POST /catalog/scales` |
| Perfiles | `GET/POST /catalog/profiles`, `POST /catalog/profiles/{id}/activate` |
| Evaluaciones | `GET/POST /evaluations`, `GET/PATCH /evaluations/{id}` |
| Configuración | `GET/PUT /evaluations/{id}/config` |
| Calificaciones | `GET/PUT /evaluations/{id}/scores` |
| Previsualización | `POST /evaluations/{id}/preview` |
| Finalizar | `POST /evaluations/{id}/finalize` |
| Reabrir | `POST /evaluations/{id}/reopen` |
| Resultados | `GET /evaluations/{id}/results` |
| Bitácora | `GET /evaluations/{id}/audit` |
| Comparación | `GET/POST /comparisons` |
| Dashboard | `GET /dashboard/summary` |
| Reportes | `GET /reports/{id}?format=pdf\|xlsx` |

Convenciones:

- Validación en serializers (RNF-06), nunca solo en el cliente.
- Errores en español con código y campo.
- Paginación por cursor o página; filtros con `django-filter`.
- Documentación OpenAPI con `drf-spectacular` en `/api/docs/`.

---

## 8. Frontend

### 8.1 Pantallas

| Código | Pantalla | Ruta |
|---|---|---|
| MK-01 | Dashboard | `/` |
| MK-02 | Softwares | `/softwares` |
| MK-03 | Criterios | `/criterios` |
| MK-04 | Nueva evaluación | `/evaluaciones/nueva` |
| MK-05 | Calificación | `/calificacion` |
| MK-06 | Resultados | `/resultados` |
| MK-07 | Historial | `/historial` |
| MK-08 | Comparación | `/comparacion` |

### 8.2 Identidad visual

- Azul marino `#1F3A5F` como color principal.
- Naranja `#F28C28` para acción principal e ítem activo.
- Fondo neutro claro, tarjetas blancas.
- Tipografía Inter.
- Semáforo de puntajes: verde ≥ 4, ámbar 3–3.99, rojo < 3.
- Responsive (RNF-03); se elimina el `min-width: 1180px` del export.

### 8.3 Componentes

`Button`, `Field`, `Select`, `Textarea`, `Section`, `Status`, `DataTable`, `Scale`, `ProgressBar`, `TreeRow`, `Modal`, `Toast`, `EmptyState`.

Gráficos con Recharts: radar por dimensión, barras por factor, dona de recomendaciones, línea de evolución.

---

## 9. Fases

| Fase | Alcance | Entregables | Estado |
|---|---|---|---|
| 0 | Infraestructura | Monorepo, git, Django + DRF + SQLite, frontend migrado y refactorizado, docs, CI | Completada |
| 1 | RF-01, RF-02, RF-03 | Catálogo, perfiles, escalas, CRUD de software y proveedor, UI de criterios | Pendiente |
| 2 | RF-04, RF-05, RF-06 | Evaluación, snapshot, calificación, motor de cálculo y tests | Pendiente |
| 3 | RF-07, RF-08, RF-09 | Resultados, gráficos, FODA y recomendación | Pendiente |
| 4 | RF-10, RF-11 | Historial, bitácora, reapertura | Pendiente |
| 5 | RF-12, RF-13 | Comparación, dashboard, reportes | Pendiente |
| 6 | RNF | QA, rendimiento, respaldos, datos demo, capturas | Pendiente |

### Criterios de aceptación por fase

- **Fase 0:** `python manage.py check` y `migrate` sin errores; `npm run build` y `npm run typecheck` sin errores; estructura de carpetas creada; documentación base.
- **Fase 1:** catálogo sembrado con 3/18/61; CRUD validado; escalas y perfiles editables; tests de modelos.
- **Fase 2:** motor con tests de las 18 filas de la Tabla 5.3; evaluación completa de punta a punta.
- **Fase 3:** resultados y FODA reproducibles; recomendación justificada.
- **Fase 4:** bitácora completa; reapertura con motivo obligatorio.
- **Fase 5:** comparación con advertencia de normalización; dashboard con datos reales.
- **Fase 6:** RNF verificados y documentados.

---

## 10. Pruebas

- **Unitarias:** `pytest` + `pytest-django` para el motor de cálculo, modelos y validaciones.
- **Golden tests:** 18 factores de la Tabla 5.3 y casos del sistema anterior.
- **Integración:** endpoints DRF con `APITestCase`.
- **E2E:** Playwright para el flujo registro → evaluación → calificación → resultados.
- **Frontend:** `tsc --noEmit` y build de producción.

Casos obligatorios del motor:

1. Matriz IS/IR contra las 18 filas.
2. Relevancia `IR >= 2`.
3. PM con 1, 2 y N subfactores.
4. FODA en los cuatro cuadrantes y en el umbral exacto.
5. Recomendación A, B y C.
6. Normalización en mínimo y máximo.
7. Errores: sin factores relevantes, subfactores pendientes, alcance sin resolver.

---

## 11. Convenciones

- **Backend:** PEP 8, nombres en inglés para código y español para textos de interfaz.
- **Frontend:** TypeScript estricto, componentes funcionales, una carpeta por feature.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).
- **Ramas:** `main` estable; `feat/<fase>-<tema>`.
- **Idioma:** interfaz y mensajes en español; código y API en inglés.

---

## 12. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| IL publicada no reproducible con cuartiles estándar | Resultados distintos a la tesis | Sembrar Tabla 5.3; recálculo explícito y documentado |
| Discrepancia de IS entre CSV y tesis | Datos inconsistentes | Usar tesis; nota en `docs/02-dominio` |
| Perfiles configurables rompen comparabilidad | Comparaciones inválidas | Perfiles versionados, snapshot y advertencia |
| Duplicación de fórmulas | Resultados divergentes | Motor único en Python |
| Escala 1–4 vs 1–5 del diseño | UI inconsistente | Escala dirigida por perfil |
| SQLite en concurrencia | Bloqueos | Un usuario; `settings/prod.py` para PostgreSQL |
| Sistema anterior no portable (Flexx) | Pérdida de lógica | Reescribir y usar como oráculo en tests |

---

## 13. Decisiones registradas

| # | Decisión | Alternativas descartadas |
|---|---|---|
| D-01 | Django 5 + DRF | FastAPI, Flask |
| D-02 | SQLite en desarrollo, PostgreSQL-ready | PostgreSQL con Docker desde el inicio |
| D-03 | GUIOS por defecto, configurable y normalizado | Solo GUIOS, solo S7 |
| D-04 | Resultado global ponderado por IR | Promedio simple, promedio por dimensiones |
| D-05 | Perfiles configurables versionados | Configuración mínima, editor completo |
| D-06 | Motor de cálculo solo en Python | Motor duplicado en TS |
| D-07 | Refactor del diseño Figma | Rehacer desde cero |
| D-08 | 13 RF en 6 fases | Solo primer producto, solo motor |
| D-09 | Sin autenticación en el alcance inicial | Login y roles desde el inicio |

---

## 14. Próximos pasos

1. ~~Completar Fase 0 y actualizar `MEMORY.md`.~~ **Hecho.**
2. Sembrar el catálogo (Fase 1).
3. Implementar el motor de cálculo con sus tests (Fase 2).
