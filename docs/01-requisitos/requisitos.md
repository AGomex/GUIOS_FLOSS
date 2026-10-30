# Requisitos

Fuente: `docs/source/S7-COMPONENTE PRACTICO_1.pdf`.

> **Prioridad:** proyecto de universidad. Los RF son obligatorios; los RNF se
> documentan pero **no se priorizan**. No se implementan CI, Docker, E2E,
> reportes PDF/XLSX ni auditoría campo por campo.

## Requisitos funcionales

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

## Requisitos no funcionales

| Código | Categoría | Verificación |
|---|---|---|
| RNF-01 | Usabilidad | Evaluación de prueba sin capacitación |
| RNF-02 | Compatibilidad | Chrome, Firefox, Edge y Safari vigentes |
| RNF-03 | Diseño adaptable | Escritorio, tableta y móvil |
| RNF-04 | Rendimiento | < 3 s operaciones, < 5 s resultados |
| RNF-05 | Exactitud de cálculo | Determinista, dos decimales |
| RNF-06 | Integridad de datos | Validación en servidor |
| RNF-07 | Persistencia y centralización | Base de datos única |
| RNF-08 | Trazabilidad y auditoría | Bitácora de acciones |
| RNF-09 | Mantenibilidad y extensibilidad | Catálogo editable sin código |
| RNF-10 | Escalabilidad | Volúmenes crecientes |
| RNF-11 | Disponibilidad y respaldo | Respaldo y restauración |
| RNF-12 | Claridad de mensajes | Mensajes en español |

## Historias de usuario

| ID | RF | Historia |
|---|---|---|
| HU-01 | RF-01 | Registrar software y proveedor con formulario estandarizado |
| HU-02 | RF-02 | Gestionar el catálogo de dimensiones, factores y subfactores |
| HU-03 | RF-03 | Definir escala y ponderaciones por defecto |
| HU-04 | RF-04 | Crear una evaluación con factores relevantes |
| HU-05 | RF-05 | Registrar calificaciones con validación |
| HU-06 | RF-06 | Calcular promedios y ponderaciones automáticamente |
| HU-07 | RF-07 | Ver resultados en tablas y gráficos |
| HU-08 | RF-08 | Clasificación FODA automática |
| HU-09 | RF-09 | Recomendación de adopción justificada |
| HU-10 | RF-10 | Consultar historial y evolución |
| HU-11 | RF-11 | Conservar configuración y modificaciones |
| HU-12 | RF-12 | Comparar alternativas |
| HU-13 | RF-13 | Dashboard de indicadores |
