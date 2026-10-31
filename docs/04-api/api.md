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
| `GET` | `/evaluations` | Filtros `status`, `software`, búsqueda por código/evaluador/necesidad |
| `POST` | `/evaluations` | Crea la evaluación y su snapshot |
| `GET` | `/evaluations/{id}` | Detalle con factores y subfactores aplicados |
| `PATCH` | `/evaluations/{id}` | Edita datos generales mientras no esté finalizada |
| `GET/PUT` | `/evaluations/{id}/config` | Importancia del decisor (ID) y alcance por factor |
| `GET/PUT` | `/evaluations/{id}/scores` | Calificaciones PS por subfactor |
| `POST` | `/evaluations/{id}/preview` | Calcula sin persistir resultados |
| `POST` | `/evaluations/{id}/finalize` | Valida y persiste resultados |
| `GET` | `/evaluations/{id}/results` | Resultados, FODA, recomendación y factores |
| `POST` | `/evaluations/{id}/reopen` | Reabre con motivo (Fase 4) |
| `GET` | `/evaluations/{id}/audit` | Bitácora de cambios (Fase 4) |

Estados: `borrador`, `en_evaluacion`, `finalizada`, `cancelada`, `reabierta`.

Crear evaluación:

```http
POST /api/v1/evaluations
Content-Type: application/json

{
  "software": 3,
  "evaluator": "Carlos Mendoza",
  "organization": "Dirección Financiera",
  "need": "Gestión contable e inventario"
}
```

```json
{
  "id": 5,
  "code": "EV-005",
  "software": 3,
  "software_label": "Odoo ERP v17",
  "evaluator": "Carlos Mendoza",
  "organization": "Dirección Financiera",
  "need": "Gestión contable e inventario",
  "status": "borrador",
  "status_label": "Borrador",
  "score_5": null,
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
  "factors": [{"name": "Compatibilidad", "pm": "3.63", "ir": 3, "foda": "oportunidad"}]
}
```

Reabrir (Fase 4):

```http
POST /api/v1/evaluations/5/reopen
Content-Type: application/json

{"reason": "Se recibió nueva evidencia de soporte técnico."}
```

`reason` es obligatorio y queda en la bitácora.

### 2.5 Comparación

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/comparisons` | Comparaciones guardadas |
| `POST` | `/comparisons` | Crea una comparación de 2 a 3 evaluaciones |
| `GET` | `/comparisons/{id}` | Detalle |

```json
{
  "need": "Gestión contable e inventario",
  "evaluations": [5, 6, 7]
}
```

Las evaluaciones comparadas deben usar la misma configuración; si no, se
normalizan a porcentaje para la tabla comparativa.

### 2.6 Dashboard

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/dashboard/summary` | Totales, estados, recomendaciones y promedios |

```json
{
  "softwares": {"total": 9, "evaluated": 6},
  "evaluations": {"draft": 1, "in_progress": 2, "finished": 4, "cancelled": 0},
  "recommendations": {"A": 1, "B": 2, "C": 1},
  "average_score": "3.68",
  "recent": []
}
```

### 2.7 Salud

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
| Comparación con menos de 2 o más de 3 evaluaciones | `400` |
| Comparación de evaluaciones de necesidades distintas | `400` |
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
