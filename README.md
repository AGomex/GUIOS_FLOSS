# GUIOSPRO_FLOSS

Sistema web para automatizar la evaluación de adopción de software libre (FLOSS)
con el modelo **GUIOS** de la tesis: dimensiones, factores, subfactores y las
métricas NS, TC, IE, IL, IS, ID, IR, PS, PM, FODA y recomendación A/B/C.

- **Backend:** Django 5 + Django REST Framework, Python 3.12, SQLite.
- **Frontend:** React 19 + Vite + TypeScript.
- **Alcance:** 13 requisitos funcionales en 5 fases.
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
│  ├─ apps/            core, catalog, software, evaluation, scoring, results, history, comparison, dashboard
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

### 3.2 Backend

Windows (PowerShell):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py seed_catalog
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
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\ruff.exe check .
```

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
| 2 | Evaluación y cálculo (RF-04, RF-05, RF-06) | Pendiente |
| 3 | Resultados y recomendación (RF-07, RF-08, RF-09) | Pendiente |
| 4 | Historial y trazabilidad (RF-10, RF-11) | Pendiente |
| 5 | Comparación y dashboard (RF-12, RF-13) | Pendiente |

---

## 6. Referencias

- Fórmulas y Tabla 5.3: [`docs/02-dominio/calculos.md`](./docs/02-dominio/calculos.md).
- Sistema anterior (oráculo de cálculo): [`reference/legacy-guiospro/`](./reference/legacy-guiospro/).
- Diseño original: [`reference/design-figma/`](./reference/design-figma/).
