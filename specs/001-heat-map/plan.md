# Plan: Mapa de calor de estudio (rediseño por meses)

## Archivos a crear o modificar

| Archivo | Acción | Responsabilidad | RF cubiertos |
|---|---|---|---|
| `index.html` | Modificar | Contenedor del mapa, controles de navegación (prev/next), selector de meses, tooltip | RF-1, RF-2, RF-3, RF-7, RF-8, RF-9 |
| `styles.css` | Modificar | Estilos del mapa por meses, grid por mes, navegación, selector, tooltips, responsive | RF-1, RF-2, RF-3, RF-4, RF-5, RF-6 |
| `app.js` | Modificar | Renderizado por meses, navegación, selector de meses, eventos de tooltip | RF-1–RF-11 |
| `logica-mapa.js` | Modificar | Funciones puras para meses (rango de meses, clasificación, tooltip, color) | RF-1–RF-11 |
| `test-mapa.js` | Modificar | Tests para nuevas funciones de meses y navegación | Todos los RF |

---

## Funciones puras de lógica (en `logica-mapa.js`)

Todas reciben `hoy` como parámetro `Date` (medianoche local) para facilitar tests.

### 1. `obtenerRangoMeses(hoy, numMeses = 3, mesInicial = null)`
- **Qué hace**: devuelve array de meses, cada mes es un objeto `{ anio, mes, semanas: [semana1, semana2, ...] }`. Cada semana es array de 7 objetos `{ fecha: Date, esFuturo: boolean, esMesActual: boolean }`.
- **RF**: RF-1, RF-2, RF-3, RF-11
- **Parámetros**:
  - `hoy`: Date actual
  - `numMeses`: cuántos meses mostrar (1-12)
  - `mesInicial`: `{ anio, mes }` desde donde empezar (null = mes actual)
- **Algoritmo**:
  ```
  si mesInicial es null: mesInicial = { anio: hoy.getFullYear(), mes: hoy.getMonth() }
  para i en [0, numMeses):
      anio = mesInicial.anio + floor((mesInicial.mes + i) / 12)
      mes = (mesInicial.mes + i) % 12
      primerDia = new Date(anio, mes, 1)
      diaSemana = primerDia.getDay() // 0=domingo
      diferencia = diaSemana === 0 ? -6 : 1 - diaSemana
      lunesPrimero = new Date(anio, mes, 1 + diferencia)
      semanas = []
      para semanaIdx desde 0:
          semana = []
          para diaIdx en [0..6]:
              fecha = new Date(lunesPrimero)
              fecha.setDate(fecha.getDate() + semanaIdx*7 + diaIdx)
              si fecha.getMonth() !== mes: break (fin del mes)
              esFuturo = fecha > hoy
              esMesActual = (fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth())
              semana.push({ fecha, esFuturo, esMesActual })
          si semana.length === 0: break
          semanas.push(semana)
      añadir { anio, mes, semanas }
  ```

### 2. `agruparSesionesPorDia(sesiones)` — *sin cambios*
- **Qué hace**: devuelve `Map<fechaTexto, { minutosTotales: number, temaPrimera: string }>`.
- **RF**: RF-4, RF-7
- **Filtro**: ignora sesiones con `minutos <= 0` o `tema.trim() === ""`.

### 3. `clasificarDia(fecha, esFuturo, sesionesPorDia)` — *sin cambios*
- **Qué hace**: devuelve `"estudiado" | "sin-estudio" | "futuro"`.
- **RF**: RF-4, RF-5, RF-6
- **Prioridad**: `futuro` > `estudiado` > `sin-estudio`.

### 4. `obtenerTooltip(fecha, esFuturo, sesionesPorDia)` — *sin cambios*
- **Qué hace**: devuelve el texto del tooltip según la clasificación.
- **RF**: RF-7, RF-8, RF-9

### 5. `obtenerColor(clasificacion, tema)` — *sin cambios*
- **Qué hace**: devuelve el color de fondo según la clasificación y el tema (claro/oscuro).
- **RF**: RF-4, RF-5, RF-6

### 6. `obtenerMesSiguiente(anio, mes)`
- **Qué hace**: devuelve `{ anio, mes }` del mes siguiente.
- **RF**: RF-3

### 7. `obtenerMesAnterior(anio, mes)`
- **Qué hace**: devuelve `{ anio, mes }` del mes anterior.
- **RF**: RF-3

---

## Algoritmo del mapa en pseudocódigo

```
function renderizarMapa(sesiones, tema, numMeses, mesInicial):
    rango = obtenerRangoMeses(hoy, numMeses, mesInicial)
    sesionesPorDia = agruparSesionesPorDia(sesiones)
    
    para cada mesObj in rango:
        contenedorMes = crearContenedorMes(mesObj.anio, mesObj.mes)
        cabeceraMes = crearCabecera(mesObj.anio, mesObj.mes)
        contenedorMes.añadir(cabeceraMes)
        
        etiquetasDias = crearEtiquetasDias()
        contenedorMes.añadir(etiquetasDias)
        
        gridMes = crearGrid()
        para cada semana in mesObj.semanas:
            para cada dia in semana:
                si dia.esMesActual === false: // día de mes anterior/siguiente en la grid
                    clasificacion = "vacio"
                sino:
                    clasificacion = clasificarDia(dia.fecha, dia.esFuturo, sesionesPorDia)
                color = obtenerColor(clasificacion, tema)
                tooltip = obtenerTooltip(dia.fecha, dia.esFuturo, sesionesPorDia)
                celda = crearCelda(dia.fecha.getDate(), color, tooltip, dia.esMesActual)
                gridMes.añadir(celda)
        contenedorMes.añadir(gridMes)
        mapa.añadir(contenedorMes)
```

---

## Estructura HTML (en `index.html`)

```html
<section class="mapa-calor">
    <div class="mapa-controles">
        <h2>Mapa de estudio</h2>
        <div class="mapa-navegacion">
            <button id="btn-mes-prev" aria-label="Mes anterior">‹</button>
            <span id="mes-actual">Octubre 2026</span>
            <button id="btn-mes-next" aria-label="Mes siguiente">›</button>
        </div>
        <div class="mapa-selector">
            <label for="num-meses">Meses visibles:</label>
            <select id="num-meses">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3" selected>3</option>
                ...
                <option value="12">12</option>
            </select>
        </div>
    </div>
    <div id="mapa-calor" class="mapa-contenedor"></div>
    <div id="tooltip" class="tooltip" hidden></div>
</section>
```

---

## Estilos CSS (en `styles.css`)

### Contenedor principal
```css
.mapa-contenedor {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
```

### Cada mes
```css
.mapa-mes {
    background: var(--color-tarjeta);
    border-radius: var(--radio);
    padding: 1rem;
    border: 1px solid var(--color-borde);
    box-shadow: var(--sombra);
}

.mapa-mes-cabecera {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    font-family: var(--fuente-display);
    font-size: 1rem;
    font-weight: 600;
}
```

### Grid del mes
```css
.mapa-mes-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
}

.mapa-mes-grid .celda {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 600;
    border-radius: 3px;
    cursor: pointer;
    transition: transform 0.1s;
}

.mapa-mes-grid .celda.vacio {
    background: transparent;
    cursor: default;
    color: transparent;
}
```

### Controles de navegación
```css
.mapa-controles {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.mapa-navegacion {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.mapa-navegacion button {
    background: var(--color-tarjeta);
    border: 1px solid var(--color-borde);
    border-radius: var(--radio);
    padding: 0.4rem 0.75rem;
    font-size: 1.25rem;
    cursor: pointer;
    box-shadow: var(--sombra);
}

.mapa-selector select {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--color-borde);
    border-radius: var(--radio);
    background: var(--color-tarjeta);
    font-family: inherit;
    font-size: 0.9rem;
}
```

### Responsive móvil (375px)
- En móvil: apilar controles verticalmente
- Celdas mínimo 24px
- Scroll horizontal si hay muchos meses

---

## Decisiones técnicas justificadas

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Meses como grids separados | Un solo grid gigante | Más legible, permite scroll por meses, mejor en móvil |
| `mesInicial` como estado en app.js | Solo calcular desde hoy | Permite navegación persistente al recargar |
| Selector de meses (1-12) | Input number | Más controlado, evita valores inválidos |
| Días de mes anterior/siguiente en grid | Dejar huecos | Estética de calendario real, usa clase `.vacio` |
| Navegación con botones prev/next | Solo selector de mes | Más rápido para navegar mes a mes |

---

## Estrategia de tests con `node --test`

### Tests nuevos para funciones de meses

| Función | Tests | RF |
|---|---|---|
| `obtenerRangoMeses` | 3 meses generados, estructura correcta, semanas completas, días futuros marcados | RF-1, RF-2, RF-3 |
| `obtenerRangoMeses` con mesInicial | Inicio en mes específico, cruce de año | RF-3 |
| `obtenerMesSiguiente` / `obtenerMesAnterior` | Transición dic-ene, ene-dic | RF-3 |
| `agruparSesionesPorDia` | (existentes) | RF-4, RF-7 |
| `clasificarDia` | (existentes) | RF-4, RF-5, RF-6 |
| `obtenerTooltip` | (existentes) | RF-7, RF-8, RF-9 |
| `obtenerColor` | (existentes) | RF-4, RF-5, RF-6 |

---

## Cobertura de RF por componente

| RF | `logica-mapa.js` | `app.js` | `index.html` | `styles.css` | `test-mapa.js` |
|---|---|---|---|---|---|
| RF-1 | ✅ `obtenerRangoMeses` | ✅ renderizado | ✅ contenedor | ✅ grid por mes | ✅ |
| RF-2 | ✅ `obtenerRangoMeses` | ✅ selector | ✅ select | ✅ | ✅ |
| RF-3 | ✅ `obtenerMesSiguiente/Anterior` | ✅ botones | ✅ botones | ✅ | ✅ |
| RF-4 | ✅ `clasificarDia` | ✅ | ✅ | ✅ color | ✅ |
| RF-5 | ✅ `clasificarDia` | ✅ | ✅ | ✅ color | ✅ |
| RF-6 | ✅ `clasificarDia` | ✅ | ✅ | ✅ color | ✅ |
| RF-7 | ✅ `obtenerTooltip` | ✅ eventos | ✅ tooltip | ✅ tooltip | ✅ |
| RF-8 | ✅ `obtenerTooltip` | ✅ eventos | ✅ tooltip | ✅ tooltip | ✅ |
| RF-9 | ✅ `obtenerTooltip` | ✅ eventos | ✅ tooltip | ✅ tooltip | ✅ |
| RF-10 | — | ✅ en `renderizar()` | — | — | — |
| RF-11 | ✅ `obtenerRangoMeses` | ✅ | — | — | ✅ |

---

## Orden de implementación

1. **Modificar `logica-mapa.js`**: reemplazar `obtenerRangoSemanas` por `obtenerRangoMeses`, añadir `obtenerMesSiguiente/Anterior`, mantener el resto.
2. **Modificar `test-mapa.js`**: actualizar tests para nuevas funciones, añadir tests de meses.
3. **Ejecutar `node --test test-mapa.js`** → todo verde.
4. **Modificar `index.html`**: nuevo contenedor con navegación, selector, estructura por meses.
5. **Modificar `styles.css`**: estilos para meses, navegación, selector, responsive.
6. **Modificar `app.js`**: nuevo `renderizarMapa` por meses, estado `mesInicial` y `numMeses`, eventos de navegación y selector.
7. **Verificar con Chrome DevTools**: vista móvil 375px, modo claro/oscuro, navegación, selector.