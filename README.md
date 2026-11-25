# GUIOSPRO_FLOSS

Sistema web para automatizar la evaluación de adopción de software libre (FLOSS)
con el modelo **GUIOS** de la tesis: dimensiones, factores, subfactores y las
métricas NS, TC, IE, IL, IS, ID, IR, PS, PM, FODA y recomendación A/B/C.

Incluye una actualización asistida por IA de la importancia de la literatura
(`IL`): busca artículos científicos 2020–2026, cuenta los pertinentes como `TC` y
recalcula `IL` por cuartiles, sin alterar el juego base de la Tabla 5.3.

- **Backend:** Django 5 + Django REST Framework, Python 3.12, SQLite.
- **Frontend:** React 19 + Vite + TypeScript.
- **Alcance:** 13 requisitos funcionales en 5 fases + extensión de literatura IA.
- **Idioma de la interfaz:** español.

| Documento | Contenido |
|---|---|
| [`PLAN.md`](./PLAN.md) | Plan maestro, fases, modelo de datos y fórmulas |
| [`MEMORY.md`](./MEMORY.md) | Bitácora viva de cambios |
| [`docs/`](./docs/README.md) | Requisitos, dominio, arquitectura y API |
| [`AGENTS.md`](./AGENTS.md) | Convenciones del proyecto |

---

## 1. Estructura

```text
Proyecto_GUIOS_FLOSS/
├─ backend/            API Django + DRF
│  ├─ apps/            core, catalog, software, evaluation, scoring, results, history, comparison, dashboard, literature
│  ├─ config/          settings por entorno, urls, asgi/wsgi
│  ├─ manage.py
│  └─ pyproject.toml   pytest + ruff
├─ frontend/           React 19 + Vite + TypeScript
│  └─ src/             app, components, features, lib, styles
├─ docs/               requisitos, dominio, arquitectura, API
├─ reference/          sistema anterior y diseño de Figma (congelados)
├─ PLAN.md · MEMORY.md · README.md · AGENTS.md
```

---

## 2. Requisitos

| Herramienta | Versión |
|---|---|
| Python | 3.12 |
| Node.js | 22 o superior |
| npm | 10 o superior |
| Git | 2.40 o superior |

---

## 3. Puesta en marcha

### 3.1 Preparar el entorno

```bash
git clone https://github.com/AGomex/GUIOS_FLOSS.git
cd GUIOS_FLOSS
cp .env.example .env
```

> Los PDFs de la tesis y del S7 no están en el repositorio. Si los necesitas,
> colócalos en `docs/source/` (ver el README de esa carpeta).

El archivo `.env` vive en la **raíz** del repositorio. Para la búsqueda con IA
puedes dejarlo con `LITERATURE_PROVIDER=mock` (sin clave) o agregar
`OPENAI_API_KEY` / `GEMINI_API_KEY` y cambiar el proveedor. Ver
[`.env.example`](./.env.example) para todas las variables.

### 3.2 Backend

Windows (PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_catalog
.\.venv\Scripts\python.exe manage.py seed_search_chains
.\.venv\Scripts\python.exe manage.py seed_software
.\.venv\Scripts\python.exe manage.py runserver
```

Linux/macOS:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py seed_catalog
python manage.py seed_search_chains
python manage.py seed_software
python manage.py runserver
```

| Recurso | URL |
|---|---|
| API | http://localhost:8000/api/v1/ |
| Salud | http://localhost:8000/api/v1/health/ |
| Swagger | http://localhost:8000/api/docs/ |
| Admin (catálogo) | http://localhost:8000/admin/ |

Para usar el admin: `python manage.py createsuperuser`.

### 3.3 Frontend

```bash
cd frontend
npm install
npm run dev
```

Disponible en http://localhost:5173. El proxy de Vite redirige `/api` a
`http://127.0.0.1:8000`.

---

## 4. Comandos útiles

### Backend

```powershell
cd backend
.\.venv\Scripts\python.exe manage.py check
.\.venv\Scripts\python.exe manage.py makemigrations
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_catalog
.\.venv\Scripts\python.exe manage.py seed_search_chains
.\.venv\Scripts\python.exe manage.py seed_software
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\ruff.exe check .
```

Para preparar datos de demostración (9 evaluaciones finalizadas con Base,
Heurística y Gemini):

```powershell
.\.venv\Scripts\python.exe manage.py seed_demo_evaluations --reset
```

El comando solo elimina las evaluaciones con organización `Demostración GUIOS`
y necesidad `Evaluación para demostración`.

### Frontend

```bash
cd frontend
npm run dev
npm run typecheck
npm run build
```

---

## 5. Estado de las fases

| Fase | Alcance | Estado |
|---|---|---|
| 0 | Infraestructura y reorganización | Completada |
| 1 | Catálogo y softwares (RF-01, RF-02, RF-03) | Completada |
| 2 | Evaluación y cálculo (RF-04, RF-05, RF-06) | Completada |
| 3 | Resultados y recomendación (RF-07, RF-08, RF-09) | Completada |
| 4 | Historial y trazabilidad (RF-10, RF-11) | Completada |
| 5 | Comparación y dashboard (RF-12, RF-13) | Completada |
| Ext. | Actualización de IL con IA | Completada |

---

## 6. Importancia de la literatura con IA

1. Entra a **Criterios** y ubica el panel *Importancia de la literatura con IA*.
2. Elige proveedor y rango de años. `mock` funciona sin claves y usa artículos
   reales de OpenAlex; OpenAI y Gemini requieren clave en `.env`.
3. Pulsa **Actualizar los 18 factores** y confirma. La corrida se ejecuta en
   segundo plano; la interfaz muestra el progreso.
4. Al terminar verás, por factor: recuperados, pertinentes (`TC` IA), `TC` de la
   tesis, `IL` de la tesis y `IL` IA. Al expandir una fila se listan los
   artículos con su motivo de clasificación.
5. Al crear o calificar una evaluación elige **Base del estudio** o una corrida IA.
   El cambio recalcula `IS`, `IR` y pesos, conserva las calificaciones y puede
   revertirse.

El `TC` de la corrida reemplaza al de la tesis (no se suma). El juego base nunca
se modifica.

---

## 7. Despliegue en Render

El repositorio incluye [`render.yaml`](./render.yaml), un Blueprint que crea tres
recursos en el plan gratuito:

| Recurso | Tipo | Función |
|---|---|---|
| `guiospro-db` | Render Postgres | Base de datos con toda la información |
| `guiospro-api` | Web Service Python | Django + Gunicorn, API y admin |
| `guiospro-frontend` | Static Site | React + Vite compilado |

### 7.1 Qué hace el build

```text
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
python manage.py load_demo_snapshot
python manage.py ensure_superuser
```

- `load_demo_snapshot` carga `backend/data/demo_snapshot.json.gz` (≈358 KB) solo
  si la base no tiene datos de negocio. En redespliegues no duplica nada.
- `ensure_superuser` crea el admin con `DJANGO_SUPERUSER_*` si la contraseña está
  definida y no modifica un usuario existente.

### 7.2 Pasos

1. Sube los cambios a `main`:

   ```bash
   git push origin main
   ```

2. En Render: **New → Blueprint**, elige el repositorio y pulsa **Apply**.
3. Render crea la base y los dos servicios y ejecuta el build (5–8 minutos).
4. En el dashboard del servicio `guiospro-api`, completa los secretos:
   - `GEMINI_API_KEY`
   - `DJANGO_SUPERUSER_EMAIL`
   - `DJANGO_SUPERUSER_PASSWORD`
5. Pulsa **Manual Deploy → Deploy latest commit** para que el build tome los
   secretos y cree el superusuario.
6. Comprueba:

   | Recurso | URL |
   |---|---|
   | Salud | `https://guiospro-api.onrender.com/api/v1/health/` |
   | Swagger | `https://guiospro-api.onrender.com/api/docs/` |
   | Admin | `https://guiospro-api.onrender.com/admin/` |
   | Frontend | `https://guiospro-frontend.onrender.com` |

Si Render asigna otros nombres porque los previstos están ocupados, ajusta
`DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` y
`VITE_API_URL` en el Blueprint.

### 7.3 Variables principales

| Variable | Valor |
|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.prod` |
| `DATABASE_URL` | desde `guiospro-db` |
| `DJANGO_ALLOWED_HOSTS` | `guiospro-api.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | `https://guiospro-frontend.onrender.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://guiospro-api.onrender.com` |
| `LITERATURE_PROVIDER` | `gemini` |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
| `GEMINI_MIN_INTERVAL` | `4.5` |
| `VITE_API_URL` | `https://guiospro-api.onrender.com/api/v1` |

### 7.4 Límites del plan gratuito

- El web service **duerme tras 15 minutos** sin tráfico; el primer acceso tarda
  cerca de un minuto. Abre `/api/v1/health/` antes de la demo.
- El Postgres gratuito **expira a los 30 días**. Si se recrea, el siguiente build
  vuelve a cargar el snapshot automáticamente.
- No hay Shell ni Jobs: por eso la carga de datos va en el build.
- Gemini depende del cupo gratuito diario; la corrida se detiene con un mensaje
  claro cuando se agota.

---

## 8. Referencias

- Fórmulas y Tabla 5.3: [`docs/02-dominio/calculos.md`](./docs/02-dominio/calculos.md).
- Sistema anterior (oráculo de cálculo): [`reference/legacy-guiospro/`](./reference/legacy-guiospro/).
- Diseño original: [`reference/design-figma/`](./reference/design-figma/).
