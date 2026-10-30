# Infraestructura

Servicios opcionales para desarrollo y despliegue. El flujo por defecto usa
**SQLite** y no requiere Docker.

## 1. PostgreSQL opcional

```bash
cd infra
docker compose up -d
```

| Servicio | Puerto | Credenciales |
|---|---|---|
| `db` (PostgreSQL 16) | `5432` | `guiospro` / `guiospro` |
| `adminer` | `8080` | Servidor `db`, usuario `guiospro` |

Luego, en `.env`:

```dotenv
DB_ENGINE=postgres
POSTGRES_DB=guiospro
POSTGRES_USER=guiospro
POSTGRES_PASSWORD=guiospro
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Y ejecutar las migraciones:

```bash
cd ../backend
.venv/Scripts/python.exe manage.py migrate
```

> En Linux/macOS: `.venv/bin/python manage.py migrate`.

Para volver a SQLite: `DB_ENGINE=sqlite`.

## 2. Variables de entorno

El archivo `.env.example` de la raíz documenta todas las variables. Copiarlo a
`.env` antes de arrancar el backend:

```bash
cp .env.example .env
```

## 3. Respaldo

| Entorno | Comando |
|---|---|
| SQLite | copiar `backend/db.sqlite3` |
| PostgreSQL | `docker compose exec db pg_dump -U guiospro guiospro > backup.sql` |

Restauración PostgreSQL:

```bash
docker compose exec -T db psql -U guiospro guiospro < backup.sql
```

## 4. Detener y limpiar

```bash
docker compose down          # detiene los contenedores
docker compose down -v       # además elimina el volumen de datos
```
