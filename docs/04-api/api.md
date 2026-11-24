# API REST

Base: `/api/v1/`
Documentación interactiva: `/api/docs/` · Esquema OpenAPI: `/api/schema/`

## 1. Convenciones

| Tema | Convención |
|---|---|
| Formato | JSON (`application/json`) |
| Fechas | ISO 8601 con zona horaria |
| Idioma | Código y nombres de campo en inglés; mensajes en español |
| Identificadores | Enteros autoincrementales |
| Paginación | `PageNumberPagination`, 100 por página |
| Filtros | `django-filter`, `search` y `ordering` |
| Validación | En serializers (RNF-06), nunca solo en el cliente |
| Autenticación | Ninguna en el alcance inicial |

### 1.1 Respuesta paginada

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/v1/softwares/?page=2",
  "previous": null,
  "results": []
}
```

### 1.2 Sobre de error

Todos los errores usan la misma estructura, producida por
`apps.core.exceptions.api_exception_handler`.

```json
{
  "error": {
    "code": "invalid",
    "message": "La versión es obligatoria.",
    "detail": {
      "version": ["Este campo es obligatorio."]
    }
  }
}
```

| Campo | Descripción |
|---|---|
| `code` | Código estable de DRF (`invalid`, `not_found`, `permission_denied`, …) |
| `message` | Primer mensaje legible, en español |
| `detail` | Detalle completo por campo |

### 1.3 Códigos de estado

| Código | Uso |
|---|---|
| `200` | Consulta o actualización correcta |
| `201` | Recurso creado |
| `204` | Recurso eliminado |
| `400` | Datos inválidos |
| `404` | Recurso inexistente |
| `409` | Conflicto de estado (p. ej. finalizar dos veces) |
| `422` | Regla de negocio incumplida (p. ej. subfactores pendientes) |

## 2. Recursos

### 2.1 Proveedores

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/providers` | Lista con filtros `search`, `is_active` |
| `POST` | `/providers` | Crea un proveedor |
| `GET` | `/providers/{id}` | Detalle |
| `PATCH` | `/providers/{id}` | Actualización parcial |
| `DELETE` | `/providers/{id}` | Baja lógica (`is_active=false`) |

```json
{
  "id": 1,
  "name": "Odoo S.A.",
  "description": "Proveedor del ERP Odoo",
  "website": "https://www.odoo.com",
  "is_active": true
}
```

### 2.2 Softwares

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/softwares` | Filtros `provider`, `license_type`, `category`, `is_active`, `search` |
| `POST` | `/softwares` | Crea un software |
| `GET` | `/softwares/{id}` | Detalle |
| `PATCH` | `/softwares/{id}` | Actualización parcial |
| `DELETE` | `/softwares/{id}` | Baja lógica |

Restricción de unicidad: `(name, version, provider)`.

```json
{
  "id": 3,
  "name": "Odoo ERP",
  "version": "17",
  "provider": 1,
  "license_type": "libre",
  "category": "ERP",
  "description": "ERP modular de código abierto",
  "website": "https://www.odoo.com",
  "is_active": true
}
```

### 2.3 Catálogo

| Método | Ruta | Descripción |
|---|---|---|
| `GET/POST` | `/catalog/dimensions` | Dimensiones |
| `GET/PATCH/DELETE` | `/catalog/dimensions/{id}` | Detalle |
| `GET/POST` | `/catalog/factors` | Factores; filtros `dimension`, `scope`, `is_active` |
| `GET/PATCH/DELETE` | `/catalog/factors/{id}` | Detalle |
| `GET/POST` | `/catalog/subfactors` | Subfactores; filtro `factor` |
| `GET/PATCH/DELETE` | `/catalog/subfactors/{id}` | Detalle |
| `GET/PATCH` | `/catalog/settings` | Configuración única (escala, umbral, relevancia) |

Factor:

```json
{
  "id": 1,
  "dimension": 1,
  "code": "compatibility",
  "name": "Compatibilidad",
  "description": "Capacidad de interactuar con otros sistemas",
  "scope": "externo",
  "ns": 8,
  "tc": 33,
  "ie": 3,
  "il": 3,
  "is_value": 3,
  "search_chain": "(…) AND from_publication_date:2020-01-01 to_publication_date:2026-12-31",
  "order": 1,
  "is_active": true
}
```

Configuración:

```json
{
  "scale_min": 1,
  "scale_max": 4,
  "foda_threshold": "3.00",
  "relevance_min": 2
}
```

### 2.4 Evaluaciones

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/evaluations` | Filtros `status`, `software`, `software__provider`, `evaluator`, búsqueda por código/evaluador/necesidad |
| `POST` | `/evaluations` | Crea la evaluación y su snapshot |
| `GET` | `/evaluations/{id}` | Detalle con factores y subfactores aplicados |
| `PATCH` | `/evaluations/{id}` | Edita datos generales mientras no esté finalizada |
| `GET/PUT` | `/evaluations/{id}/config` | Importancia del decisor (ID) y alcance por factor |
| `GET/PUT` | `/evaluations/{id}/scores` | Calificaciones PS por subfactor |
| `POST` | `/evaluations/{id}/preview` | Calcula sin persistir resultados |
| `POST` | `/evaluations/{id}/finalize` | Valida y persiste resultados |
| `GET` | `/evaluations/{id}/results` | Resultados, FODA, recomendación y factores |
| `POST` | `/evaluations/{id}/reopen` | Reabre una evaluación finalizada con motivo obligatorio |
| `GET` | `/evaluations/{id}/logs` | Bitácora de cambios de la evaluación |
| `POST` | `/evaluations/{id}/literature` | Cambia el juego de literatura (base o corrida IA) |

Estados: `borrador`, `en_evaluacion`, `finalizada`, `cancelada`, `reabierta`.

Crear evaluación:

```http
POST /api/v1/evaluations
Content-Type: application/json

{
  "software": 3,
  "evaluator": "Carlos Mendoza",
  "organization": "Dirección Financiera",
  "need": "Gestión contable e inventario",
  "literature_run": null
}
```

`literature_run` es opcional: `null` usa el juego base de la Tabla 5.3; un ID usa
una corrida IA **completada**. Se puede cambiar después con
`POST /evaluations/{id}/literature`.

```json
{
  "id": 5,
  "code": "EV-005",
  "software": 3,
  "software_label": "Odoo ERP v17",
  "software_version": "17",
  "provider_name": "Odoo S.A.",
  "evaluator": "Carlos Mendoza",
  "organization": "Dirección Financiera",
  "need": "Gestión contable e inventario",
  "status": "borrador",
  "status_label": "Borrador",
  "score_5": null,
  "recommendation": null,
  "recommendation_label": null,
  "literature_run": null,
  "literature_run_label": "Base del estudio",
  "scale_min": 1,
  "scale_max": 4,
  "created_at": "2026-09-28T10:15:00-05:00",
  "factors": [
    {
      "id": 1,
      "factor": 1,
      "code": "compatibility",
      "name": "Compatibilidad",
      "dimension_name": "Tecnológica",
      "scope": "externo",
      "ie": 3,
      "il": 3,
      "is_value": 3,
      "id_value": 3,
      "ir": 3,
      "is_relevant": true,
      "pm": null,
      "foda": "",
      "foda_label": "",
      "weight": 3,
      "subfactors": [{"id": 1, "code": "compatibility-01", "text": "…", "ps": null}]
    }
  ]
}
```

Configurar ID y alcance:

```http
PUT /api/v1/evaluations/5/config
Content-Type: application/json

{
  "factors": [
    {"factor": 1, "id_value": 4, "scope": "interno"},
    {"factor": 12, "id_value": 2}
  ]
}
```

Guardar calificaciones:

```http
PUT /api/v1/evaluations/5/scores
Content-Type: application/json

{
  "scores": [
    {"subfactor": 1, "ps": 4, "source": "Observación directa", "note": ""},
    {"subfactor": 2, "ps": 3, "source": "Información del proveedor", "note": ""}
  ]
}
```

El rango válido de `ps` e `id_value` se toma del **snapshot** de la evaluación,
no de la configuración global. Si la evaluación se creó con escala 1–5, se acepta
`5` y se rechaza `6`; si se creó con 1–4, se rechaza `5`.

Previsualización:

```http
POST /api/v1/evaluations/5/preview
```

```json
{
  "global": "3.25",
  "percentage": "75.00",
  "score_5": "4.00",
  "factors": [
    {
      "code": "compatibility",
      "name": "Compatibilidad",
      "dimension": "Tecnológica",
      "scope": "externo",
      "ie": 3,
      "il": 3,
      "is_value": 3,
      "id_value": 3,
      "ir": 3,
      "is_relevant": true,
      "pm": "3.63",
      "weight": 3,
      "foda": "oportunidad",
      "foda_label": "Oportunidad",
      "pending": false
    }
  ],
  "swot": {
    "fortalezas": [],
    "oportunidades": ["Compatibilidad"],
    "debilidades": ["Soporte"],
    "amenazas": []
  },
  "recommendation": {
    "code": "B",
    "label": "Adoptar con reservas",
    "reasons": ["Soporte es Debilidad con IR 2."]
  },
  "pending": 0
}
```

Finalizar:

```http
POST /api/v1/evaluations/5/finalize
```

- `200` con `{"status": "finalizada", "result": {…}}`.
- `422` si quedan factores relevantes sin calificar o no hay factores relevantes.
- `409` si la evaluación ya está finalizada.

Resultados:

```http
GET /api/v1/evaluations/5/results
```

Devuelve la evaluación, el resultado global, la recomendación, el resumen FODA,
los conteos, la escala aplicada, el desempeño por dimensión y el detalle de los
factores con su PM y clasificación.

```json
{
  "global": "3.87",
  "percentage": "95.56",
  "score_5": "4.82",
  "scale": {"min": 1, "max": 4, "foda_threshold": "3.00"},
  "dimensions": [
    {"name": "Tecnológica", "average": "4.00", "percentage": "100.00", "factors": 9}
  ],
  "recommendation": {"code": "C", "label": "Proporcionar recursos y mejorar", "reasons": ["…"]},
  "swot": {"fortalezas": ["…"], "oportunidades": ["…"], "debilidades": ["…"], "amenazas": []},
  "counts": {"strengths": 7, "opportunities": 10, "weaknesses": 1, "threats": 0},
  "literature": {"run": 4, "label": "IA 2020–2026 · 21/11/2026 21:22"},
  "factors": [{"name": "Compatibilidad", "pm": "3.63", "ir": 3, "foda": "oportunidad"}]
}
```

Reabrir:

```http
POST /api/v1/evaluations/5/reopen
Content-Type: application/json

{"reason": "Se recibió nueva evidencia de soporte técnico.", "actor": "Carlos Mendoza"}
```

- `200` con la evaluación en estado `reabierta`.
- `400` si el motivo tiene menos de 5 caracteres.
- `409` si la evaluación no está finalizada.

El motivo es obligatorio y queda en la bitácora. Tras la reapertura la
evaluación vuelve a admitir cambios de configuración y calificaciones; al
finalizar de nuevo se actualiza el resultado.

Bitácora:

```http
GET /api/v1/evaluations/5/logs
```

```json
[
  {
    "id": 12,
    "action": "reopened",
    "action_label": "Reapertura",
    "description": "Evaluación reabierta para revisión.",
    "reason": "Se recibió nueva evidencia de soporte técnico.",
    "actor": "Carlos Mendoza",
    "created_at": "2026-09-30T09:12:00-05:00"
  }
]
```

Acciones registradas: `created`, `configured`, `scored`, `finalized`,
`reopened`, `updated`. La bitácora es de solo lectura desde el admin.

Cambiar el juego de literatura:

```http
POST /api/v1/evaluations/5/literature
Content-Type: application/json

{"literature_run": 4}
```

- `200` con la evaluación recalculada (`IS`, `IR`, `weight` por factor).
- `{"literature_run": null}` vuelve al juego base de la tesis.
- `409` si la evaluación está finalizada.
- Las calificaciones `PS` ya registradas se conservan; solo cambian `TC` e `IL`.

### 2.5 Comparación

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/comparisons?ids=1,2,3` | Compara 2 o 3 evaluaciones con resultados |
| `POST` | `/comparisons` | Igual que `GET`, con los IDs en el cuerpo |

La comparación es calculada al vuelo; no se persiste.

```http
POST /api/v1/comparisons
Content-Type: application/json

{"evaluations": [1, 2, 3]}
```

```json
{
  "need": "Gestión documental",
  "same_need": false,
  "normalized": false,
  "dimensions": ["Tecnológica", "Organizacional", "Económica"],
  "evaluations": [
    {
      "id": 1,
      "code": "EV-001",
      "software": "Odoo ERP",
      "software_version": "17",
      "provider": "Odoo S.A.",
      "evaluator": "Ana Torres",
      "organization": "Dirección",
      "need": "Gestión documental",
      "status": "finalizada",
      "status_label": "Finalizada",
      "global": "3.87",
      "percentage": "95.56",
      "score_5": "4.82",
      "recommendation": "C",
      "recommendation_label": "Proporcionar recursos y mejorar",
      "scale": {"min": 1, "max": 4, "foda_threshold": "3.00"},
      "dimensions": [
        {"name": "Tecnológica", "average": "4.00", "percentage": "100.00", "factors": 9}
      ],
      "strengths": ["Compatibilidad", "Operabilidad"],
      "weaknesses": ["Soporte técnico"]
    }
  ]
}
```

- `normalized` es `true` cuando las evaluaciones usan escalas distintas; en ese
  caso conviene comparar los porcentajes.
- `same_need` es `false` si las evaluaciones corresponden a necesidades
  distintas; la comparación sigue siendo válida como referencia.
- Las evaluaciones deben tener resultados (finalizadas o reabiertas con
  resultado previo).

### 2.6 Dashboard

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/dashboard/summary` | Totales, estados, recomendaciones y promedios |

```json
{
  "softwares": {"total": 9, "evaluated": 6},
  "evaluations": {
    "draft": 1,
    "in_progress": 2,
    "finished": 4,
    "reopened": 0,
    "cancelled": 0,
    "total": 7
  },
  "recommendations": {"A": 1, "B": 2, "C": 1},
  "average_score": "3.68",
  "recent": [
    {
      "id": 4,
      "code": "EV-004",
      "software": "Odoo ERP",
      "software_version": "17",
      "provider": "Odoo S.A.",
      "status": "finalizada",
      "status_label": "Finalizada",
      "score_5": "3.91",
      "recommendation": "C",
      "recommendation_label": "Proporcionar recursos y mejorar",
      "updated_at": "2026-11-05T21:30:00-05:00"
    }
  ]
}
```

### 2.7 Literatura con IA

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/literature/config` | Proveedor vigente, modelo, años, candidatos y proveedores disponibles |
| `GET` | `/literature/runs` | Corridas registradas (paginado, más recientes primero) |
| `POST` | `/literature/runs` | Crea y lanza una corrida; responde `202` |
| `GET` | `/literature/runs/{id}` | Detalle con los resultados de los 18 factores |
| `GET` | `/literature/runs/{id}/factors` | Resultados por factor, sin artículos |
| `GET` | `/literature/runs/{id}/factors/{code}` | Detalle del factor con sus artículos clasificados |

Configuración:

```json
{
  "provider": "mock",
  "model": "heuristic-v1",
  "prompt_version": "1",
  "year_from": 2020,
  "year_to": 2026,
  "max_candidates": 25,
  "providers": [
    {"value": "openai", "label": "OpenAI", "model": "gpt-4o-mini", "configured": false},
    {"value": "gemini", "label": "Google Gemini", "model": "gemini-3.5-flash-lite", "configured": false},
    {"value": "mock", "label": "Heurístico (sin IA)", "model": "heuristic-v1", "configured": true}
  ]
}
```

El proveedor Gemini espacia las peticiones para respetar el nivel gratuito: por
defecto espera 4,5 s entre llamadas (`GEMINI_MIN_INTERVAL`), lo que mantiene el
uso por debajo de 15 RPM. Ante un `429` respeta el `retryDelay` que indica Google
(tope de 60 s) y hace hasta 4 intentos. Si el `429` corresponde al cupo diario
(500 RPD), detiene la corrida con un mensaje claro en lugar de reintentar.

Lanzar una corrida:

```http
POST /api/v1/literature/runs
Content-Type: application/json

{
  "provider": "openai",
  "year_from": 2020,
  "year_to": 2026,
  "max_candidates": 25,
  "triggered_by": "Carlos Mendoza"
}
```

- `202` con la corrida en estado `pendiente`. La búsqueda se ejecuta en segundo
  plano para no bloquear la petición.
- La interfaz consulta `GET /literature/runs/{id}` hasta que el estado sea
  `completada` o `fallida`.
- `400` si el proveedor elegido no tiene clave en `.env` o el rango de años es
  inválido.

Estados: `pendiente`, `ejecutando`, `completada`, `fallida`.

Corrida completada:

```json
{
  "id": 4,
  "status": "completada",
  "status_label": "Completada",
  "provider": "mock",
  "provider_label": "Heurístico (sin IA)",
  "model": "heuristic-v1",
  "prompt_version": "1",
  "year_from": 2020,
  "year_to": 2026,
  "max_candidates": 25,
  "factors_total": 18,
  "factors_done": 18,
  "quartiles": {"q1": 3.75, "q2": 9.125, "q3": 12.5},
  "totals": {"relevant": 383, "before": 243, "after": 383},
  "searches": [
    {
      "factor": 1,
      "factor_code": "compatibility",
      "factor_name": "Compatibilidad",
      "dimension_name": "Tecnológica",
      "query": "(…) AND from_publication_date:2020-01-01 to_publication_date:2026-12-31",
      "retrieved": 25,
      "relevant": 25,
      "tc_before": 33,
      "tc_after": 25,
      "il_before": 3,
      "il_after": 1,
      "status": "completada",
      "status_label": "Completada",
      "error": ""
    }
  ]
}
```

`tc_after` es el TC de la corrida: reemplaza al de la tesis, no se suma.
`il_after` sale de los cuartiles de `tc_after / ns`. `tc_before` e `il_before`
conservan el juego base para comparar.

Detalle de un factor con artículos:

```json
{
  "factor_code": "compatibility",
  "retrieved": 25,
  "relevant": 25,
  "articles": [
    {
      "id": 101,
      "doi": "10.1016/j.example.2024.01.001",
      "title": "Interoperability in open-source enterprise systems",
      "year": 2024,
      "venue": "Journal of Systems and Software",
      "authors": "Ana Ruiz, Li Wei",
      "url": "https://doi.org/10.1016/j.example.2024.01.001",
      "is_relevant": true,
      "reason": "El resumen aborda compatibilidad e interoperabilidad en un contexto de adopción.",
      "confidence": 0.92,
      "order": 0
    }
  ]
}
```

El clasificador solo etiqueta artículos recuperados de las fuentes; no genera
citas. `confidence` es una estimación del modelo y `reason` explica la decisión
en español.

### 2.8 Salud

```http
GET /api/v1/health/
```

```json
{"status": "ok", "service": "guiospro-floss-api"}
```

## 3. Reglas de validación

| Regla | Respuesta |
|---|---|
| `PS` fuera de la escala configurada | `400` |
| `ID` fuera de la escala configurada | `400` |
| Subfactor que no pertenece a la evaluación | `400` |
| Evaluación finalizada editada | `409` |
| Reapertura sin motivo | `400` |
| Reapertura de una evaluación no finalizada | `409` |
| Comparación con menos de 2 o más de 3 evaluaciones | `400` |
| Comparación con una evaluación sin resultados | `400` |
| Corrida de literatura con proveedor sin clave o años inválidos | `400` |
| Cambiar la literatura de una evaluación finalizada | `409` |
| Finalizar con subfactores relevantes pendientes | `422` |
| Finalizar sin factores relevantes | `422` |

## 4. Ejemplo de consumo (frontend)

```ts
const response = await fetch("/api/v1/evaluations/5/preview", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
});

if (!response.ok) {
  const { error } = await response.json();
  throw new Error(error.message);
}

const result = await response.json();
```

El cliente centralizado vive en `frontend/src/lib/api.ts` (Fase 1).
