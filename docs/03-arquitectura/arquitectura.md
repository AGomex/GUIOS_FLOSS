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
| `catalog` | Escalas, dimensiones, factores, subfactores, perfiles |
| `software` | Proveedores y softwares |
| `evaluation` | Evaluaciones, snapshots y calificaciones |
| `scoring` | Motor de cálculo puro |
| `results` | PM, FODA, recomendación, reportes |
| `history` | Bitácora y reapertura |
| `comparison` | Comparación de alternativas |
| `dashboard` | Indicadores |

### Flujo de una evaluación

```text
1. POST /evaluations          → crea evaluación + snapshot del catálogo/perfil
2. PUT  /evaluations/{id}/scores → guarda PS, fuente y observación
3. POST /evaluations/{id}/preview → calcula PM/FODA sin persistir
4. POST /evaluations/{id}/finalize → valida, calcula y guarda resultados
5. GET  /evaluations/{id}/results → devuelve resultados y justificación
```

## 3. Motor de cálculo

- Única implementación en Python.
- Sin dependencias de Django: recibe estructuras simples y devuelve resultados.
- Determinista y con redondeo half-up.
- El frontend consume `/preview`; no replica fórmulas.

## 4. Snapshot y trazabilidad

- Al crear una evaluación se copia el catálogo y el perfil aplicados.
- `EvaluationFactor` y `EvaluationSubfactor` guardan los valores usados.
- `AuditLog` registra creación, cambios, finalización y reapertura.
- Editar el catálogo no altera evaluaciones anteriores (RF-11).

## 5. Perfiles de configuración

`ImportanceProfile` es versionado y define:

- escala (mínimo, máximo, etiquetas);
- matrices IS/IR;
- umbral FODA;
- modo de ponderación (`IR`, `pesos`, `simple`);
- reglas de recomendación.

Solo un perfil puede estar activo por defecto. Cada evaluación referencia el perfil usado.

## 6. Entornos

| Entorno | Settings | Base de datos | DEBUG |
|---|---|---|---|
| Desarrollo | `config.settings.dev` | SQLite | Sí |
| Producción | `config.settings.prod` | PostgreSQL | No |

Variables en `.env` (ver `.env.example`).

## 7. Seguridad

- Sin autenticación en el alcance inicial (S7).
- El nombre del evaluador es texto libre y queda en la bitácora.
- En producción: cookies seguras, `DEBUG=False`, CORS restringido.
- Preparado para incorporar autenticación por token sin reestructurar (RNF-09).

## 8. Frontend

- React 19 + Vite + TypeScript estricto.
- Rutas con React Router.
- Una carpeta por feature; componentes de UI reutilizables.
- Estilos globales en `src/styles/index.css` con tokens de la identidad visual.
- Sin lógica de negocio: solo presentación y llamadas a la API.

## 9. Pruebas

| Nivel | Herramienta | Ubicación |
|---|---|---|
| Unitarias backend | pytest + pytest-django | `backend/apps/*/tests/` |
| Golden del motor | pytest | `backend/apps/scoring/tests/` |
| Integración API | DRF APITestCase | `backend/apps/*/tests/` |
| Tipado y build frontend | tsc + vite | `frontend/` |
| E2E | Playwright | Fase 6 |
