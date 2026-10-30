# Documentos fuente

Esta carpeta contiene los documentos originales del proyecto. **No se versionan**
en Git porque son material académico y pesado.

Coloca aquí manualmente, con estos nombres exactos:

| Archivo | Contenido |
|---|---|
| `TESIS.pdf` | Tesis: capítulos 4 y 5, dimensiones, factores y métricas |
| `S7-COMPONENTE PRACTICO_1.pdf` | Requisitos funcionales y no funcionales, modelo de datos |

Se excluyen mediante la regla `*.pdf` de `.gitignore`. Esto incluye también el
manual técnico del sistema anterior en `reference/legacy-guiospro/`.

Los datos que el sistema necesita ya están transcritos en:

- [`../02-dominio/calculos.md`](../02-dominio/calculos.md) — fórmulas y Tabla 5.3.
- [`../01-requisitos/requisitos.md`](../01-requisitos/requisitos.md) — RF y RNF.

Si necesitas compartir los PDFs, usa un release, Drive o el repositorio
institucional, no el historial de Git.
