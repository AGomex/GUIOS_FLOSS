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
| `results` | Pantallas y agregados de resultados (Fase 3) |
| `history` | Bitácora y reapertura (Fase 4) |
| `comparison` | Comparación de alternativas (Fase 5) |
| `dashboard` | Indicadores (Fase 5) |

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
Variables en `.env` (ver `.env.example`).

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

## 9. Pruebas

| Nivel | Herramienta | Ubicación |
|---|---|---|
| Motor de cálculo (obligatorio) | pytest | `backend/apps/scoring/tests/` |
| Tipado y build frontend | tsc + vite | `frontend/` |

No hay tests de endpoints, E2E ni integración.
