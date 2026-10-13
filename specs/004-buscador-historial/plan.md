# Plan: Buscador del historial de sesiones

Spec de referencia: `specs/004-buscador-historial/spec.md` (aprobada).

> **Nota de alcance**: este plan crea 2 archivos nuevos (`logica-busqueda.js`,
> `test-busqueda.js`). `AGENTS.md` pide preguntar antes de crear archivos, pero **ambos
> están autorizados por el usuario en la spec** (decisión 5 y RF-10). No se crea ningún
> archivo más ni ninguna clave nueva de `localStorage`.

> **Nota de fechas**: ninguna función de este plan lee el reloj ni recibe `hoy`: el mes se
> deduce del **string** `fecha` (`"AAAA-MM-DD"`) con una expresión regular, sin `Date`, sin
> `toISOString()` y sin `new Date("AAAA-MM-DD")` (reglas del proyecto, RF-3).

---

## Archivos a crear o modificar

| Archivo | Acción | Responsabilidad | RF cubiertos |
|---|---|---|---|
| `logica-busqueda.js` | **Crear** | Funciones puras: normalización de texto y filtrado de sesiones | RF-3, RF-4, RF-5, RF-10 |
| `test-busqueda.js` | **Crear** | Tests con `node --test` de las funciones puras | RF-3, RF-4, RF-5, RF-10 |
| `index.html` | Modificar | Buscador entre `<h2>` y `<ul>` (fuera de `#form-sesion` y de `.objetivo`), región `aria-live`, cargar `logica-busqueda.js` antes de `app.js` | RF-1, RF-6, RF-10, RF-11 |
| `styles.css` | Modificar | Estilos del campo, botón "Limpiar búsqueda", foco visible, 375 px, claro/oscuro | RF-11, NNF |
| `app.js` | Modificar | Lectura del texto, `pintarHistorial`/`renderizarHistorial`, mensajes de "sin resultados" vs "historial vacío", eventos (`input`, limpiar, `submit` con `preventDefault`) | RF-1, RF-2, RF-5, RF-6, RF-7, RF-8, RF-9 |
| `AGENTS.md`, `MEMORY.md` | Modificar | 4 archivos de test + nueva sección "Buscador"; decisiones de la spec 004 | Criterio de finalización |
| `logica-mapa.js`, `logica-objetivo.js`, `test-mapa.js`, `test-edit.js`, `test-objetivo.js` | Sin cambios | — | — |

---

## Funciones puras (en `logica-busqueda.js`, patrón IIFE → `globalThis`)

Autocontenido: define **su propia** normalización y **su propio** array de nombres de mes
dentro del IIFE; no llama a `logica-mapa.js` ni a `logica-objetivo.js` (cada test evalúa un
archivo por separado) y no toca DOM ni `localStorage`.

### 1. `normalizarTexto(texto)`
- **Qué hace** (RF-4, en este orden):
  1. si `texto` no es un `string` → devuelve `""` (nunca lanza excepción);
  2. `trim()` (quita espacios de los extremos);
  3. `toLowerCase()`;
  4. quita diacríticos: `normalizar("NFD")` + `replace(/[\u0300-\u036F]/g, "")` →
     `á→a, é→e, í→i, ó→o, ú→u, ü→u, ñ→n`. **No** toca los guiones (`2026-10` exige los dos).
- **RF**: RF-4

### 2. `filtrarSesiones(sesiones, texto)`
- **Qué hace**: devuelve **array nuevo** con las sesiones que coinciden, **en el mismo
  orden en que entraron** (no ordena: el orden del historial lo aplica la interfaz).
  `sesiones` que no es array → `[]`.
- **Regla de coincidencia** (`q = normalizarTexto(texto)`):
  - `q === ""` → devolver todas (RF-5);
  - si no, `coincide = tema.includes(q) || (fechaValida && (fecha.includes(q) || mes.startsWith(q)))`
    donde `tema = normalizarTexto(sesion.tema)`, `fecha = normalizarTexto(sesion.fecha)`,
    `mes = nombre del mes en minúsculas` y `q` es prefijo del mes (`startsWith`).
- **RF**: RF-3, RF-4, RF-5, RF-10

### Helpers internos (dentro del IIFE, no se exportan)

#### 3. `esFechaValida(fecha)`
- `string` que cumple `/^\d{4}-\d{2}-\d{2}$/` **y** mes entre 01–12 **y** día entre 01–31.
- Cualquier otra cosa (`""`, `"abc"`, `undefined`, ausente, `"2026-13-05"`) → `false`:
  la sesión **no participa en la búsqueda por fecha** (ni substring ni mes) y **no lanza
  excepción**; solo podrá coincidir por su tema.
- **RF**: RF-3

#### 4. `nombreMesDeFecha(fecha)`
- `mes = parseInt(fecha.slice(5, 7), 10)` → `NOMBRES_MESES_LOCAL[mes - 1]` en minúsculas
  (`"enero" … "diciembre"`, con `"septiembre"`, la misma grafía que usa la app).
- **Sin `Date`**: se lee el string; así no hay zona horaria que desplace el día (regla del
  proyecto: una sesión del `2026-01-01` se encuentra con `enero`).
- **RF**: RF-3

### Pseudocódigo completo

```
(function (global) {
    'use strict'

    const NOMBRES_MESES = ["enero","febrero","marzo","abril","mayo","junio",
                           "julio","agosto","septiembre","octubre","noviembre","diciembre"]

    function normalizarTexto(texto):                     // RF-4
        si typeof texto !== "string": retornar ""
        retornar texto.trim()
                       .toLowerCase()
                       .normalize("NFD")
                       .replace(/[\u0300-\u036F]/g, "")  // guiones intactos

    function esFechaValida(fecha):                       // RF-3
        si typeof fecha !== "string": retornar false
        m = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/)     // sin Date, sin UTC
        si m == null: retornar false
        mes = Number(m[2]); dia = Number(m[3])
        retornar mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31

    function nombreMesDeFecha(fecha):                    // RF-3
        retornar NOMBRES_MESES[Number(fecha.slice(5, 7)) - 1]   // solo si esFechaValida

    function filtrarSesiones(sesiones, texto):            // RF-3, RF-5, RF-10
        si !Array.isArray(sesiones): retornar []
        q = normalizarTexto(texto)
        si q === "": retornar sesiones.filter(() => true)      // RF-5: se ve todo
        retornar sesiones.filter(sesion =>                      // mismo orden de entrada
            normalizarTexto(sesion.tema).includes(q)            // tema por substring
            || (
                esFechaValida(sesion.fecha)
                && (
                    normalizarTexto(sesion.fecha).includes(q)   // 1) substring del AAAA-MM-DD
                    || nombreMesDeFecha(sesion.fecha).startsWith(q)   // 2) prefijo del mes
                )
            )
        )

    global.normalizarTexto = normalizarTexto
    global.filtrarSesiones = filtrarSesiones
})(globalThis)
```

**Robustez sin excepciones**: `sesion.tema` o `sesion.fecha` ausentes/`undefined` pasan por
`normalizarTexto` (→ `""`) y por `esFechaValida` (→ `false`); `sesion.fecha = "abc"` no
coincide por fecha; `minutos`, `hora` e `id` **no se consultan en ningún sitio**.

**Casos que la lógica cubre sola** (verificados por tests): `ingles`→`Inglés`,
`maticas`→`Matemáticas`, `mateamaticas`✗, ` Historia `→`Historia`, `2026-10`/`10-05`/`05`,
`octubre`/`oct`✓, `tob`/`ubre`✗, `05/10/2026`✗, `o`→octubre, `a`→abril+agosto, `e`→enero,
`i`→ningún mes, `2026-01-01`+`enero`✓.

---

## Funciones impuras (en `app.js`, solo DOM/localStorage)

- `pintarHistorial(sesiones)` → lee `campoBusqueda.value`, llama a `filtrarSesiones` y pasa
  el resultado **y el total guardado** a `mostrarSesiones`. **Nunca escribe en el campo.**
- `renderizarHistorial()` → `pintarHistorial(cargarSesiones())`: se usa **solo** en el evento
  `input` para repintar la lista sin recalcular mapa ni estadísticas.
- `mostrarSesiones(sesionesVisibles, totalGuardadas)` → la existente, con **firma ampliada**
  para decidir el mensaje (RF-6) y limpiar/anunciar en la región `aria-live` (RF-11).
- `renderizar()` → su línea `mostrarSesiones(sesiones)` pasa a `pintarHistorial(sesiones)`;
  el resto (rachas, totales, días, objetivo, mapa) sigue recibiendo `sesiones` **completas**
  (RF-8) y **no se toca el campo** (RF-2).
- Listeners en `iniciar()`: `input`, clic en `#btn-limpiar`, `submit` de `#form-busqueda`.
- **Sin persistencia**: no se crea ninguna clave; el texto solo vive en el `value` del input.
- **Modo edición (RF-9)**: cero cambios en `manejarClickEditar`, `salirModoEdicion` ni en el
  `submit` de `#form-sesion`; ellos ya llaman a `renderizar()`, que ahora repinta filtrado.

### Algoritmo en pseudocódigo (app.js)

```
// ---------- Pintado (RF-2, RF-5, RF-6, RF-8) ----------
function mostrarSesiones(sesionesVisibles, totalGuardadas):
    lista.innerHTML = ""
    si sesionesVisibles.length === 0:
        si totalGuardadas === 0:
            #sin-sesiones visible                 // "Aún no hay sesiones registradas."
            #aviso-busqueda.textContent = ""       // región vacía: nada que anunciar
        si no:
            #sin-sesiones oculto                   // NO se muestra el aviso de vacío (RF-6)
            #aviso-busqueda.textContent =
                "No se encontraron sesiones que coincidan con la búsqueda."   // texto exacto
        retornar
    #sin-sesiones oculto
    #aviso-busqueda.textContent = ""               // con resultados la región queda vacía (RF-11)
    ... resto intacto: ordenar de más reciente a más antigua y pintar filas ...

function pintarHistorial(sesiones):                // RF-2, RF-5
    texto = campoBusqueda.value                    // se LEE, nunca se escribe
    mostrarSesiones(filtrarSesiones(sesiones, texto), sesiones.length)

function renderizarHistorial():                    // solo lista + mensaje, por tecla
    pintarHistorial(cargarSesiones())

function renderizar():
    sesiones = cargarSesiones()
    ... rachas, total semanal, días del mes, objetivo con sesiones COMPLETAS (RF-8) ...
    pintarHistorial(sesiones)                      // ← antes: mostrarSesiones(sesiones)
    renderizarMapa(sesiones, tema)


// ---------- Eventos (en iniciar()) ----------
campoBusqueda = document.getElementById("buscador")

campoBusqueda.addEventListener("input", renderizarHistorial)     // filtrado inmediato (RF-2)

formBusqueda.addEventListener("submit", (evento) => {
    evento.preventDefault()                                      // Intro no envía ni recarga (RF-2)
    renderizarHistorial()
})

btnLimpiar.addEventListener("click", () => {
    campoBusqueda.value = ""                                     // una sola acción (RF-7)
    renderizarHistorial()
    campoBusqueda.focus()                                        // el foco vuelve al campo
})

// Sin cambios: submit de #form-sesion, btn-cancelar, delegación de #lista-sesiones
renderizar()                                                     // al abrir: campo vacío = todo (RF-1)
```

---

## Estructura HTML (modificaciones en `index.html`)

```html
<!-- Lista de sesiones -->
<section class="sesiones">
    <h2>Historial</h2>

    <!-- Buscador (spec 004): dentro del historial, entre el <h2> y la lista (RF-1).
         Fuera de #form-sesion y de la tarjeta de objetivo: no comparte estado con ellos. -->
    <form id="form-busqueda" class="busqueda" role="search">
        <div class="campo">
            <label for="buscador">Buscar en el historial</label>
            <input type="search" id="buscador"
                   placeholder="Tema o fecha, p. ej. octubre o 2026-10"
                   autocomplete="off">
        </div>
        <button type="button" id="btn-limpiar" class="btn-limpiar">Limpiar búsqueda</button>
    </form>

    <ul id="lista-sesiones"></ul>
    <!-- Región viva (RF-11): con resultados queda vacía; solo anuncia el aviso de 0
         coincidencias. Nunca cifras ni "X de Y" (decisión cerrada del usuario). -->
    <p id="aviso-busqueda" class="vacio" role="status" aria-live="polite"></p>
    <p id="sin-sesiones" class="vacio">Aún no hay sesiones registradas.</p>
</section>
```

```html
<!-- Orden de carga de <script>: la lógica pura SIEMPRE antes de app.js,
     que las usa desde globalThis en iniciar() -->
<script src="logica-mapa.js"></script>
<script src="logica-objetivo.js"></script>
<script src="logica-busqueda.js"></script>   <!-- NUEVO -->
<script src="app.js"></script>
```

- `#sin-sesiones` **no se mueve ni se reescribe**: conserva su texto exacto y su lógica de
  "historial vacío"; los dos mensajes son excluyentes y ya nunca se ven a la vez.

---

## Estilos CSS (modificaciones en `styles.css`, solo lo esencial)

```css
/* ===== Buscador del historial (spec 004) ===== */
.busqueda {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}
.busqueda .campo { margin-bottom: 0; }   /* el hueco lo pone el gap */

/* El input ya hereda .campo input (width:100%, borde, radio, 1rem);
   se añade el foco visible que RF-11 exige (border-color solo no basta) */
#buscador:focus {
    outline: 2px solid var(--color-primario);
    outline-offset: 2px;
    border-color: var(--color-primario);
}
#buscador::placeholder { color: var(--color-texto-suave); }

/* Botón limpiar: texto con color de la paleta y borde, legible en ambos temas */
.btn-limpiar {
    align-self: flex-start;
    background: transparent;
    border: 1px solid var(--color-borde);
    color: var(--color-texto);
    border-radius: var(--radio);
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    font-family: inherit;
    cursor: pointer;
}
.btn-limpiar:hover { border-color: var(--color-primario); color: var(--color-primario); }
.btn-limpiar:focus { outline: 2px solid var(--color-primario); outline-offset: 2px; }

/* #aviso-busqueda reutiliza .vacio (ya existente): sin CSS nuevo */
```

- **Sin variables nuevas** de color: se reutilizan `--color-primario`, `--color-borde`,
  `--color-texto` y `--color-texto-suave`, que ya existen en `:root` y en
  `[data-tema="oscuro"]` → claro/oscuro gratis.
- **375 px**: input a `width:100%` + botón debajo (`align-self:flex-start`) → nada
  desborda; verificar `scrollWidth === 375`.

---

## Decisiones técnicas justificadas

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Archivo nuevo `logica-busqueda.js` (IIFE → `globalThis`) | Meter el filtrado en `logica-mapa.js` o dentro de `app.js` | Cerrado con el usuario (RF-10): un archivo de lógica = un archivo de tests; `app.js` mezclaría DOM con datos (principio 3) |
| Normalizar con `normalize("NFD")` + `replace(/[\u0300-\u036F]/g,"")` | Mapa manual `replace(/á/g,"a").replace(/é/g,"e")…` | La versión NFD es corta, cubre todos los diacríticos (incluida la diéresis) y no se olvida ninguna letra al mantenerla; el mapa manual son 10+ sustituciones duplicadas en cada mantenimiento |
| Mes derivado del **string** con `slice(5,7)` + array propio | `new Date(fecha)` / `toISOString()`; `toLocaleDateString("es-ES")` | `new Date("AAAA-MM-DD")` interpreta en UTC y desplaza el día (prohibido); `toLocaleDateString` depende del locale del entorno y en Node sin ICU completo devuelve `october` → tests rojos. El string no tiene zona horaria |
| Array de meses **propio dentro del IIFE** (minúsculas) | Reusar `NOMBRES_MESES` de `app.js` | RF-10 exige archivo autocontenido (el test evalúa un solo archivo); además el de `app.js` vive en la capa UI y está en mayúsculas (`"Octubre"`) |
| `esFechaValida` = regex `AAAA-MM-DD` + rangos mes 1-12 / día 1-31 | Construir un `Date` local y comparar los campos (detectaría `2026-02-31`) | `new Date(2026, 1, 31)` **enrolla** a 3 de marzo: hay que comparar 3 campos y el código se complica para un dato que la app nunca guarda (el `<input type="date">` solo genera fechas reales); el rango basta para lo que exige RF-3 |
| Mes por `startsWith` (prefijo) | `indexOf(q) === 0` (equivalente) o `includes(q)` sobre el mes | `startsWith` dice lo mismo con nombre legible; `includes` está **descartado por la spec**: `tob` y `ubre` no deben encontrar octubre |
| Comparar también el campo `fecha` normalizado | Comparar la fecha cruda y el mes normalizado a medias | Una sola regla ("normalizar ambos lados igual, RF-4") es más fácil de explicar y el resultado es idéntico (la fecha solo tiene dígitos y guiones) |
| `filtrarSesiones` devuelve array nuevo con `.filter` y **no ordena** | Ordenar dentro de la función | El orden del historial (más reciente primero) ya lo aplica `mostrarSesiones`; ordenar dos veces duplica lógica y ocultaría errores de orden |
| El texto se **lee del campo** en cada pintado (`campoBusqueda.value`) | Variable de estado `let textoBusqueda` + `localStorage` | Sin estado duplicado que se desincronice; como el texto no persiste (RF-1) el campo vacío al cargar ya da "ver todo" sin código extra |
| Función aparte `renderizarHistorial()` (solo lista + mensaje) | Llamar a `renderizar()` completo en cada tecla | RF-2/RF-8: por tecla **no** se deben recalcular ni repintar mapa, rachas, totales ni objetivo |
| `mostrarSesiones(sesionesVisibles, totalGuardadas)` decide el mensaje con esos 2 datos | Añadir un tercer flag `filtroActivo` | Con `visibles === 0`: si `totalGuardadas === 0` gana el aviso de vacío y si no, el de "sin resultados" (RF-6). El flag sería redundante y podría contradecir a los datos |
| Elemento nuevo `#aviso-busqueda` con `aria-live` para el aviso de 0 resultados | Reutilizar `#sin-sesiones` cambiándole el texto | Reescribir el texto fijo del historial vacío pondría en riesgo su cadena exacta y su significado; una región viva **vacía desde el inicio** es lo que el lector de pantalla anuncia al aparecer, y los dos mensajes quedan excluyentes por construcción |
| `#aviso-busqueda` va tras el `<ul>` y `#sin-sesiones` se queda donde está | Mover `#sin-sesiones` o meter el aviso dentro del `<ul>` | El aviso ocupa el hueco de la lista vacía (misma posición visual que el aviso actual) y no se altera un nodo que ya funciona |
| Campo dentro de `<form id="form-busqueda">` con `submit` + `preventDefault()` | Campo suelto (sin `<form>`) o `keydown` interceptando Intro | La spec contempla explícitamente el caso "si va en un form"; el `<form>` da semántica de grupo (con `role="search"`) y un único punto declarativo para cancelar el envío. Con campo suelto RF-2 quedaría sin implementación verificable |
| `type="search"` + botón visible "Limpiar búsqueda" (`type="button"`) | Solo la × nativa del navegador; o `type="text"` | RF-7 pide una acción de limpiar **visible y propia** (la × nativa no existe en todos los navegadores y varía); `type="search"` aporta el × extra como atajo sin romper nada y declara la intención del campo |
| Tras limpiar, `campoBusqueda.focus()` | Limpiar sin mover el foco | El usuario pulsa un botón del campo: devolverle el foco al input permite seguir escribiendo de inmediato (RF-11) |
| Botón limpiar propio con borde y `color: var(--color-texto)` | Reusar `.btn-cancelar` (fondo `--color-texto-suave`, texto blanco) | Blanco sobre `#A8A8B8` en modo oscuro no llega a 4,5:1; además "cancelar edición" y "limpiar búsqueda" son acciones distintas y no deben verse idénticas |
| Sin contador de resultados ni "X de Y" | Mostrar "3 de 40 sesiones" | Decisión cerrada del usuario (RF-11): con resultados la región `aria-live` queda **vacía** |
| Sin clave nueva en `localStorage` | `diarioEstudio.busqueda` | RF-1: el texto no se guarda ni se conserva al recargar; además cada apertura con campo vacío = historial completo gratis |

---

## Estrategia de tests con `node --test`

### Archivo: `test-busqueda.js`

Mismo patrón que `test-mapa.js`: `readFileSync` + `eval` de `logica-busqueda.js` y toma de
las funciones desde `globalThis`. **Sin reloj y sin fechas actuales**: todas las sesiones de
prueba llevan fechas fijas (`2026-10-05`, `2026-01-01`…). Se ejecuta con los demás archivos:
`node --test`.

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
eval(readFileSync(join(__dirname, 'logica-busqueda.js'), 'utf8'));
const { normalizarTexto, filtrarSesiones } = globalThis;

// RF-4: minúsculas, tildes y espacios sobrantes
test('normalizarTexto: quita espacios, pasa a minúsculas y quita tildes', () => {
    assert.equal(normalizarTexto('  Matemáticas '), 'matematicas');
    assert.equal(normalizarTexto('ÑU') , 'nu');
});

// RF-3: mes por prefijo, con caso negativo
test('filtrarSesiones: "oct" encuentra octubre y "tob" no', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, 'oct').length, 1);
    assert.equal(filtrarSesiones(sesiones, 'tob').length, 0);
});
```

### Casos a cubrir (≈35 tests → total ≈115 en verde)

| Función | Casos |
|---|---|
| `normalizarTexto` (RF-4) | `' Historia '`→`historia`; `HISTORIA`→`historia`; `Matemáticas`→`matematicas`; `Matemáticas`→`matematicas`; `ñü`→`nu`; guiones **intactos** (`2026-10`→`2026-10`); `""`, `undefined`, `null`, número → `""` sin excepción |
| Filtrado por **tema** (RF-3/RF-4) | `ingles`→`Inglés`; `maticas`→`Matemáticas`; `historia`→`HISTORIA`; ` Historia ` coincide; `mateamaticas` **no** coincide; tema vacío (`""`) y tema ausente → no coinciden por tema, sin excepción; query más larga que el tema nunca coincide |
| Fecha **substring** (RF-3) | `2026-10-05` completo; `2026`; `2026-10`; `10-05`; `05`; consulta de 1 carácter numérico; `05/10/2026`, `5-10-2026`, `5 de octubre` → **0**; `viernes` (día de la semana) → **0**; `viernes, 5 de octubre` (texto formateado) → **0** |
| Fecha **mes por prefijo** (RF-3) | `octubre` y `oct` → sí; `tob` y `ubre` → **no**; `enero` encuentra `2026-01-01`; `o` → solo octubre; `a` → abril y agosto (no marzo); `e` → enero; `i` → **ningún** mes; `sept` → septiembre; `setiembre` → 0 (grafía no usada) |
| Fecha **inválida** (RF-3, RF-10) | `fecha: "abc"`, `""`, `undefined`, ausente, `"2026-13-05"` → **no lanza excepción** y no coinciden por fecha; la misma sesión **sí** coincide por su tema |
| Campos no buscables (RF-3) | sesión con `minutos: 90`, `hora: "15:40"`, `id: 1234` → busquedas `"90"`, `"15:40"`, `"1234"` devuelven 0 |
| Generales (RF-5, RF-10) | texto vacío y solo espacios → **todas**; `undefined` como texto → todas; sin coincidencias → `[]`; **orden de salida idéntico al de entrada** (mezcla de fechas para verlo); no se modifica el array de entrada; `filtrarSesiones("no-array")` → `[]` |
| Límite de los RF | ninguna sesión se muta (deep-equal del array antes/después) |

**Verificación**: `node --test` en verde (los **4** archivos: `test-mapa`, `test-edit`,
`test-objetivo`, `test-busqueda`; hoy 80 tests = 30 + 11 + 39) antes de dar por hecha
cualquier tarea.

---

## Cobertura de RF por componente

| RF | `logica-busqueda.js` | `test-busqueda.js` | `app.js` | `index.html` | `styles.css` | `AGENTS.md` |
|---|---|---|---|---|---|---|
| RF-1 Acceso en el historial | — | — | no escribe el campo ni `localStorage` | `<form id="form-busqueda">` entre `<h2>` y `<ul>`, fuera de `#form-sesion` | — | sección "Buscador" |
| RF-2 Filtrado inmediato | `filtrarSesiones` | ✅ | `renderizarHistorial`, `pintarHistorial`, listener `input`, `submit`+`preventDefault` | campo dentro de `<form>` | — | — |
| RF-3 Tema y fecha (substring + prefijo de mes) | `filtrarSesiones`, `esFechaValida`, `nombreMesDeFecha` | ✅ | — | — | — | — |
| RF-4 Normalización | `normalizarTexto` | ✅ | — | — | — | — |
| RF-5 Vacío = ver todo | `filtrarSesiones` (q vacío) | ✅ | `pintarHistorial` | — | — | — |
| RF-6 Ninguna coincidencia | — | — | `mostrarSesiones(visibles, total)` | `#aviso-busqueda`, `#sin-sesiones` intacto | reutiliza `.vacio` | textos exactos |
| RF-7 Limpiar | — | — | listener `#btn-limpiar` (vaciar + repintar + foco) | `<button type="button" id="btn-limpiar">` | `.btn-limpiar` | — |
| RF-8 Solo filtra la lista | no toca estadísticas | — | `renderizarHistorial` pinta **solo** historial; el resto sigue con todas las sesiones | — | — | — |
| RF-9 Convivencia con edición | — | — | sin cambios: los flujos existentes llaman a `renderizar()` | — | — | — |
| RF-10 Lógica pura y testeable | IIFE autocontenida, 2 funciones en `globalThis` | ✅ (eval de un solo archivo) | solo llama a `filtrarSesiones` | `<script src="logica-busqueda.js">` **antes** de `app.js` | — | 4 archivos de test |
| RF-11 Accesibilidad y móvil | — | — | `aria-live` vacío con resultados, mensaje solo con 0 | `label for`, `role="search"`, `aria-live="polite"` | foco visible, 375 px, claro/oscuro | — |

---

## Orden de implementación

1. **`logica-busqueda.js`**: crear con `normalizarTexto`, `filtrarSesiones` y sus helpers, y
   añadir su `<script>` en `index.html` **antes de `app.js`** (sin tocar `app.js`: nada la
   usa todavía → cero cambio de comportamiento visible).
2. **`test-busqueda.js`**: crear y dejar `node --test` en verde (4 archivos).
3. **`index.html`**: `<form id="form-busqueda">` con label, input y botón + `#aviso-busqueda`.
4. **`styles.css`**: `.busqueda`, `#buscador:focus`, `.btn-limpiar` (claro/oscuro, 375 px).
5. **`app.js` — pintado**: ampliar `mostrarSesiones(visibles, totalGuardadas)` con los dos
   mensajes, crear `pintarHistorial`/`renderizarHistorial`, cambiar la llamada de
   `renderizar()` y añadir el listener `input`.
6. **`app.js` — eventos**: botón limpiar (con foco) y `submit` de `#form-busqueda` con
   `preventDefault()`; comprobar modo edición intacto.
7. **`AGENTS.md` + `MEMORY.md`**: 4 archivos de test y sección "Buscador".
8. **Verificación**: `node --test` completo + Chrome DevTools (checklist de la spec, consola
   limpia, claro/oscuro, móvil 375 px sin scroll horizontal, solo claves conocidas de
   `localStorage`).
