# Modelo de cálculo GUIOS

Fuente: `docs/source/TESIS.pdf`, capítulos 4 y 5, y sistema anterior `reference/legacy-guiospro/`.

## 1. Escalas

**Importancia (IE, IL, IS, ID, IR)**

| Valor | Etiqueta |
|---|---|
| 1 | Irrelevante |
| 2 | Opcional |
| 3 | Importante |
| 4 | Fundamental |

**Cumplimiento del subfactor (PS)**

| Valor | Etiqueta |
|---|---|
| 1 | No cumple el requisito |
| 2 | Desconozco si cumple el requisito |
| 3 | Cumple parcialmente el requisito |
| 4 | Cumple el requisito |

## 2. Matriz de importancia

La misma matriz se usa para `IS = f(IE, IL)` y para `IR = f(IS, ID)`.

| IE / IL | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| **1** | 1 | 1 | 2 | 2 |
| **2** | 1 | 2 | 2 | 3 |
| **3** | 2 | 2 | 3 | 3 |
| **4** | 2 | 3 | 3 | 4 |

Equivale a `max(1, floor((a + b) / 2))`. La matriz se verifica con un test contra las 18 filas de la Tabla 5.3 de la tesis.

## 3. Cadena de cálculo

```text
NS  = número de subfactores del factor
TC  = total de citas del factor
IE  = importancia del experto (1–4)
IL  = importancia de la literatura (1–4)
IS  = max(1, floor((IE + IL) / 2))
ID  = importancia del decisor (1–4)
IR  = max(1, floor((IS + ID) / 2))

relevante = IR >= 2
```

Solo se evalúan los subfactores de factores relevantes.

```text
PS  = cumplimiento de cada subfactor (1–4)
PM  = media aritmética de los PS del factor
```

## 4. FODA

```text
FODA(PM, alcance) =
  Fortaleza   si PM >= umbral y alcance = interno
  Debilidad   si PM <  umbral y alcance = interno
  Oportunidad si PM >= umbral y alcance = externo
  Amenaza     si PM <  umbral y alcance = externo
```

Umbral por defecto: `3`. Es editable en `ScoringSettings` (registro único).

Alcance por defecto de cada factor (Tabla 5.4):

| Internos | Externos |
|---|---|
| Formación | Compatibilidad |
| Tiempo de adopción | Personalización |
| Centralidad de TIC | Prueba |
| Apoyo de la alta dirección | Fiabilidad |
| Soporte (*) | Reusabilidad |
| Actitud hacia el cambio | Usabilidad |
| Coste total de propiedad | Mantenibilidad |
| | Portabilidad |
| | Documentación |
| | Casos de estudio de adopción FLOSS |
| | Bloqueo de proveedores |

`(*)` Soporte puede ser interno o externo; el decisor lo resuelve en cada evaluación.

## 5. Recomendación

| Código | Condición | Mensaje base |
|---|---|---|
| C | Existe Debilidad o Amenaza con IR ≥ 3 | Proporcionar recursos y mejorar |
| B | Existe Debilidad o Amenaza con IR = 2 | Es posible adoptar con revisión |
| A | No existe Debilidad ni Amenaza relevante | Adoptar |

La recomendación se acompaña de la lista de factores que la sustentan. El conteo de fortalezas/oportunidades frente a debilidades/amenazas se muestra como información secundaria y **no** sobrescribe la regla A/B/C.

## 6. Resultado global

GUIOS no define un puntaje global. Se adopta:

```text
global = Σ(PM_i × IR_i) / Σ(IR_i)     sobre factores relevantes evaluados
pct    = (global - min) / (max - min) × 100
score5 = 1 + 4 × pct / 100
```

Ejemplo con escala 1–4: `global = 3.25` → `pct = 75 %` → `score5 = 4.00`.

### 6.1 Desempeño por dimensión

Para los gráficos de la pantalla de resultados se usa el mismo criterio ponderado,
aplicado a los factores relevantes de cada dimensión:

```text
dimension = Σ(PM_i × IR_i) / Σ(IR_i)     sobre factores relevantes de la dimensión
```

El resultado se presenta en la escala original y en porcentaje. Es un indicador
de presentación: no altera el resultado global ni la recomendación.

## 7. Ejemplo completo

Factor **Compatibilidad** (externo):

- `IE = 3`, `IL = 3` → `IS = 3`
- Decisor: `ID = 3` → `IR = 3` → relevante
- `PS = [4, 3, 4, 4, 3, 4, 3, 4]` → `PM = 3.625`
- `PM >= 3` y externo → **Oportunidad**

Factor **Soporte** (interno, elegido por el decisor):

- `IS = 3`, `ID = 2` → `IR = 2` → relevante
- `PS = [2, 2, 1, 2, 2, 2]` → `PM = 1.833`
- `PM < 3` e interno → **Debilidad**

Recomendación: existe una Debilidad con `IR = 2` → **B**.

## 8. Importancia de la literatura (IL)

```text
r_i = c_i / n_i
```

donde `c_i` son las citas del factor y `n_i` su número de subfactores. Luego se asigna un cuartil:

```text
IL(r_i) = 1 si r_i <= rq1
          2 si rq1 < r_i <= rq2
          3 si rq2 < r_i <= rq3
          4 si rq3 < r_i <= rq4
```

**Nota importante:** los valores de IL publicados en la Tabla 5.3 no se reproducen exactamente con cuartiles estándar sobre los 18 valores de `r_i` (por ejemplo, Documentación tiene `r = 1.82` y `IL = 1`). Por eso:

- El sistema **siembra** los valores publicados en la Tabla 5.3.
- **No** se recalcula IL: la tesis es la fuente de verdad.
- Si se editara un factor, el cambio afecta solo a las evaluaciones nuevas
  (las anteriores conservan su snapshot).

## 9. Datos de referencia

| Dimensión | Factor | NS | TC | IE | IL | IS |
|---|---|---|---|---|---|---|
| Tecnológica | Compatibilidad | 8 | 33 | 3 | 3 | 3 |
| Tecnológica | Fiabilidad | 5 | 19 | 3 | 3 | 3 |
| Tecnológica | Mantenibilidad | 1 | 4 | 3 | 3 | 3 |
| Tecnológica | Personalización | 6 | 30 | 3 | 4 | 3 |
| Tecnológica | Prueba | 1 | 4 | 3 | 3 | 3 |
| Tecnológica | Documentación | 11 | 20 | 3 | 1 | 2 |
| Tecnológica | Portabilidad | 2 | 4 | 3 | 2 | 2 |
| Tecnológica | Reusabilidad | 2 | 5 | 3 | 2 | 2 |
| Tecnológica | Usabilidad | 4 | 14 | 3 | 2 | 2 |
| Organizacional | Apoyo de la alta dirección | 1 | 5 | 3 | 4 | 3 |
| Organizacional | Formación | 4 | 27 | 3 | 4 | 3 |
| Organizacional | Soporte | 6 | 43 | 3 | 4 | 3 |
| Organizacional | Actitud hacia el cambio | 2 | 3 | 3 | 1 | 2 |
| Organizacional | Bloqueo de proveedores | 1 | 3 | 3 | 2 | 2 |
| Organizacional | Casos de estudio de adopción FLOSS | 1 | 1 | 3 | 1 | 2 |
| Organizacional | Centralidad de la tecnología de la información | 2 | 2 | 3 | 1 | 2 |
| Organizacional | Tiempo de adopción | 2 | 2 | 3 | 1 | 2 |
| Económica | Coste total de propiedad (TCO) | 2 | 24 | 3 | 4 | 3 |

## 10. Discrepancias conocidas

| Dato | Sistema anterior | Tesis | Decisión |
|---|---|---|---|
| Usabilidad · IS | 3 | 2 | Tesis |
| Apoyo de la alta dirección · IS | 2 | 3 | Tesis |
| Umbral de relevancia | `>2` en `Guiosad.relevant()` | `IR >= 2` | Tesis |
| Recomendación | Conteo sobrescrito por regla A/B/C | Regla A/B/C | Regla A/B/C |
