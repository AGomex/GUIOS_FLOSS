# Arquitectura

## 1. Vista general

```text
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

## 2. Backend

Capas:

1. **Modelos** (`apps/*/models.py`): persistencia y reglas de integridad.
2. **Serializers** (`apps/*/serializers.py`): validación de entrada (RNF-06).
3. **Servicios** (`apps/*/services.py`): casos de uso y transacciones.
4. **Motor** (`apps/scoring/engine/`): funciones puras de cálculo.
5. **Vistas** (`apps/*/views.py`): ViewSets de DRF.

### Apps

| App | Responsabilidad |
|---|---|
| `core` | Modelos base, auditoría, errores, paginación |
| `catalog` | Configuración, dimensiones, factores y subfactores |
| `software` | Proveedores y softwares |
| `evaluation` | Evaluaciones, snapshots, calificaciones y resultados |
| `scoring` | Motor de cálculo puro |
| `results` | Reservado; los agregados de resultados viven en `evaluation` |
| `history` | Reservado; la bitácora vive en `evaluation` |
| `comparison` | Comparación al vuelo de 2–3 evaluaciones (Fase 5) |
| `dashboard` | Indicadores agregados (Fase 5) |
| `literature` | Búsqueda de artículos, clasificación IA y juego de valores IL |

### Flujo de una evaluación

```text
1. POST /evaluations              → crea evaluación + snapshot del catálogo/configuración
2. PUT  /evaluations/{id}/config  → ajusta ID y alcance por factor
3. PUT  /evaluations/{id}/scores  → guarda PS, fuente y observación
4. POST /evaluations/{id}/preview → calcula PM/FODA sin persistir
5. POST /evaluations/{id}/finalize → valida, calcula y guarda resultados
6. GET  /evaluations/{id}/results → devuelve resultados y justificación
7. POST /evaluations/{id}/reopen  → reabre con motivo obligatorio
8. GET  /evaluations/{id}/logs    → bitácora de cambios
```

### Comparación y dashboard

```text
GET /comparisons?ids=1,2,3 → compara 2–3 resultados sin persistir
GET /dashboard/summary/    → agregados de softwares, estados, recomendaciones y recientes
```

La comparación reutiliza `results_payload` y no duplica fórmulas. El dashboard
solo agrega datos persistidos; no recalcula PM, FODA ni recomendaciones.

### Literatura con IA

```text
POST /literature/runs            → crea la corrida y la ejecuta en un hilo aparte
GET  /literature/runs/{id}       → estado, progreso y 18 resultados por factor
GET  /literature/runs/{id}/factors/{code} → artículos y motivo de clasificación
POST /evaluations/{id}/literature → aplica el juego base o una corrida completada
```

Componentes:

| Módulo | Responsabilidad |
|---|---|
| `keywords.py` | Términos de adopción y por factor; cadena de búsqueda documentada |
| `sources.py` | OpenAlex → Crossref → Semantic Scholar con `httpx` |
| `providers/` | Clasificadores OpenAI, Gemini y heurístico (`mock`) |
| `quartiles.py` | Cortes y asignación de IL por `TC / NS` |
| `services.py` | Orquestación, caché de veredictos y persistencia |

La corrida se ejecuta en un hilo para no bloquear la petición; la UI consulta el
estado cada pocos segundos. La clasificación es determinista (`temperature = 0`)
y reutiliza veredictos previos con el mismo modelo y `prompt_version`, de modo
que repetir una corrida con las mismas fuentes produce el mismo conteo.

El juego base de la Tabla 5.3 nunca se modifica: cada corrida vive en
`LiteratureRun`, `FactorSearch` y `Article`, y la evaluación guarda el `run`
elegido (`null` = base). Cambiar de juego recalcula `IS`, `IR` y peso, pero no
toca las calificaciones `PS`.

## 3. Motor de cálculo

- Única implementación en Python.
- Sin dependencias de Django: recibe estructuras simples y devuelve resultados.
- Determinista y con redondeo half-up.
- El frontend consume `/preview`; no replica fórmulas.

## 4. Snapshot y trazabilidad

- Al crear una evaluación se copia el catálogo y la configuración aplicados.
- `EvaluationFactor` y `EvaluationSubfactor` guardan los valores usados.
- `EvaluationLog` registra creación, configuración, calificación, finalización y
  reapertura, con responsable, descripción y motivo cuando aplica (Fase 4).
- Editar el catálogo no altera evaluaciones anteriores (RF-11).

## 5. Configuración

Un único registro `ScoringSettings` define:

- escala (`scale_min`, `scale_max`);
- umbral FODA (`foda_threshold`);
- relevancia mínima (`relevance_min`).

Las matrices IS/IR son fijas (`floor((a + b) / 2)`) y se implementan en el motor.
Cada evaluación guarda un snapshot JSON con el catálogo y la configuración usados.

## 6. Entorno

| Entorno | Settings | Base de datos | DEBUG |
|---|---|---|---|
| Desarrollo | `config.settings.dev` | SQLite | Sí |

`config.settings.prod` se conserva como plantilla mínima, pero no se despliega.
Variables en `.env` (ver `.env.example`), ubicado en la raíz del repositorio.

Literatura con IA:

| Variable | Efecto |
|---|---|
| `LITERATURE_PROVIDER` | `openai`, `gemini` o `mock` por defecto |
| `LITERATURE_YEAR_FROM` / `_TO` | Rango de años (2020–2026) |
| `LITERATURE_MAX_CANDIDATES` | Candidatos por factor (25) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Clave y modelo de OpenAI |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Clave y modelo de Gemini |
| `SEMANTIC_SCHOLAR_API_KEY` | Clave opcional para la tercera fuente |
| `LITERATURE_CONTACT_EMAIL` | Correo de cortesía para OpenAlex/Crossref |

Sin claves, el sistema funciona con `mock`: recupera artículos reales y decide la
pertinencia con una heurística determinista.

## 7. Seguridad

- Sin autenticación en el alcance inicial (S7).
- El nombre del evaluador es texto libre.
- No se implementa endurecimiento para producción.

## 8. Frontend

- React 19 + Vite + TypeScript estricto.
- Rutas con React Router.
- Una carpeta por feature; componentes de UI reutilizables.
- Estilos globales en `src/styles/index.css` con tokens de la identidad visual.
- Sin lógica de negocio: solo presentación y llamadas a la API.
- `Criterios` incluye el panel de literatura con IA: configuración, lanzamiento,
  progreso, tabla de los 18 factores, artículos y historial de corridas.
- `NuevaEvaluacion` y `Calificacion` permiten elegir **Base (tesis)** o una
  corrida IA; la calificación puede alternar sin perder avances.

## 9. Pruebas

| Nivel | Herramienta | Ubicación |
|---|---|---|
| Motor de cálculo (obligatorio) | pytest | `backend/apps/scoring/tests/` |
| Tipado y build frontend | tsc + vite | `frontend/` |

No hay tests de endpoints, E2E ni integración.
