# Plan: Objetivo semanal de estudio

Spec de referencia: `specs/003-objetivo-semanal/spec.md` (aprobada).

> **Nota de alcance**: este plan crea un archivo nuevo (`logica-objetivo.js`,
> `test-objetivo.js`). `AGENTS.md` pide preguntar antes de crear archivos → se solicita
> visto bueno al aprobar este plan. El patrón ya está probado en el proyecto
> (`logica-mapa.js` + `test-mapa.js` con `node --test`).

---

## Archivos a crear o modificar

| Archivo | Acción | Responsabilidad | RF cubiertos |
|---|---|---|---|
| `logica-objetivo.js` | **Crear** | Funciones puras: semana, cálculo del total/progreso, validación e interpretación del objetivo, formatos de texto | RF-2, RF-3, RF-4, RF-6, RF-8, RF-9, RF-10 |
| `test-objetivo.js` | **Crear** | Tests con `node --test` de todas las funciones puras | RF-2, RF-3, RF-4, RF-6, RF-8, RF-9, RF-10 |
| `index.html` | Modificar | Tarjeta de objetivo (fuera del `form`), `#progreso-detalle` en la zona de minutos, cargar `logica-objetivo.js` | RF-1, RF-3, RF-9, RF-10 |
| `styles.css` | Modificar | Estilos de la tarjeta, detalle de progreso, indicador "meta cumplida" (claro/oscuro), foco visible | RF-8, NNF accesibilidad |
| `app.js` | Modificar | Persistencia en localStorage, pintado, eventos de la tarjeta, detección de cambio de semana; **se elimina** la `calcularMinutosSemana` antigua | RF-1–RF-9 |
| `AGENTS.md` | Modificar | Sección "Total semanal" (nuevo formato + fechas futuras) y sección "Datos" (clave nueva) | Criterio finalización |
| `logica-mapa.js`, `test-mapa.js`, `test-edit.js` | Sin cambios | — | — |

---

## Funciones puras (en `logica-objetivo.js`, patrón IIFE → `globalThis`)

Todas reciben la fecha de referencia como **parámetro** (`hoy` o su derivado): ninguna
lee el reloj, así que son testeables con fechas fijas.

### 1. `obtenerRangoSemana(hoy)`
- **Qué hace**: devuelve `{ lunes, domingo }` como `Date` locales (medianoche local) de
  la semana en curso de `hoy` (lunes a domingo, ajuste domingo = semana anterior).
- **RF**: RF-4, RF-6

### 2. `calcularMinutosSemana(sesiones, hoy)` *(migrada desde `app.js` y corregida)*
- **Qué hace**: suma los minutos de las sesiones con `lunes <= fecha <= domingo`.
  **Cambio 1B**: el tope superior pasa de `hoy` a `domingo` → las sesiones con fecha
  futura dentro de la semana en curso **sí cuentan**.
- **RF**: RF-4 (y RF-3, RF-5 vía el total semanal)

### 3. `validarObjetivo(texto)`
- **Qué hace**: valida la entrada de la tarjeta. Devuelve:
  - `{ accion: "guardar", minutos }` → entero 1–10080 (se hace `trim`; solo dígitos)
  - `{ accion: "eliminar" }` → campo vacío o solo espacios (no es error)
  - `{ accion: "rechazar", error: "Introduce un número entero entre 1 y 10080 minutos." }`
- **RF**: RF-10

### 4. `interpretarObjetivoGuardado(valorCrudo)`
- **Qué hace**: convierte lo que hay en `localStorage` a `number | null`. Devuelve
  `null` si la clave no existe, está vacía o el valor no es un entero 1–10080 (texto
  no numérico, decimales, fuera de rango, corrupto) → estado "sin objetivo".
- **RF**: RF-2, RF-9

### 5. `formatearTotalSemana(acumulado, objetivo)`
- **Qué hace**: `"Esta semana: ${acumulado} min"` si `objetivo == null`;
  `"Esta semana: ${acumulado}/${objetivo} min"` en caso contrario.
- **RF**: RF-3, RF-9

### 6. `formatearDetalleProgreso(acumulado, objetivo)`
- **Qué hace** (devuelve `null` si `objetivo == null`):
  - `acumulado < objetivo` → `"Te faltan ${objetivo - acumulado} min para la meta."`
  - `acumulado === objetivo` → `"Meta cumplida 🎉"`
  - `acumulado > objetivo` → `"Meta cumplida 🎉 Has superado la meta en ${acumulado - objetivo} min."`
- **RF**: RF-3, RF-8
- *Propuesta de diseño (las dudas abiertas de la spec dejan estos textos sin cerrar).*

### 7. `haCambiadoSemana(lunesGuardado, hoy)`
- **Qué hace**: `true` si el lunes de `hoy` no coincide (año/mes/día) con
  `lunesGuardado`.
- **RF**: RF-6

**Autocontención**: dentro del IIFE se define un helper local `textoAFecha` (igual que
el de `app.js`). No se depende de `app.js` ni de `logica-mapa.js` para que los tests en
Node puedan evaluar el archivo por separado (mismo motivo que `fechaATexto` en
`logica-mapa.js`).

### Funciones impuras (en `app.js`, solo localStorage/DOM)

- `cargarObjetivo()` → `interpretarObjetivoGuardado(localStorage.getItem(CLAVE_OBJETIVO))`
- `guardarObjetivo(minutos)` / `eliminarObjetivo()` → `setItem` / `removeItem` de
  `diarioEstudio.objetivo` (valor: `String(minutos)`, entero plano, no JSON)
- `mostrarMinutosSemana(acumulado, objetivo)` → pinta `#minutos-semana` +
  `#progreso-detalle` (texto y clase `.cumplida`)
- `reflejarObjetivoEnCampo()` → escribe el objetivo actual en el input **solo al cargar
  y tras guardar/eliminar** (nunca en `renderizar()`, para no pisar lo que el usuario
  esté escribiendo)
- `manejarSubmitObjetivo(evento)` → validación + persistencia + `renderizar()`
- `comprobarCambioSemana()` → llamada en el tick del reloj

---

## Algoritmo en pseudocódigo

```
// ---------- Persistencia (app.js) ----------
const CLAVE_OBJETIVO = "diarioEstudio.objetivo"

function cargarObjetivo():
    crudo = localStorage.getItem(CLAVE_OBJETIVO)
    retornar interpretarObjetivoGuardado(crudo)     // number | null (RF-2)

function guardarObjetivo(minutos):
    localStorage.setItem(CLAVE_OBJETIVO, String(minutos))

function eliminarObjetivo():
    localStorage.removeItem(CLAVE_OBJETIVO)


// ---------- Pintado (app.js) ----------
function mostrarMinutosSemana(acumulado, objetivo):          // RF-3, RF-9
    #minutos-semana.textContent = formatearTotalSemana(acumulado, objetivo)
    si objetivo == null:
        #progreso-detalle.hidden = true
        #progreso-detalle.classList.remove("cumplida")
    si no:
        #progreso-detalle.textContent = formatearDetalleProgreso(acumulado, objetivo)
        #progreso-detalle.classList.toggle("cumplida", esMetaCumplida(acumulado, objetivo))   // RF-8 (única fuente de verdad, ver logica-objetivo.js)
        #progreso-detalle.hidden = false

function mostrarInvitacionObjetivo(objetivo):                // RF-9
    #objetivo-vacio.hidden = (objetivo != null)


// ---------- Submit de la tarjeta (app.js) ----------
function manejarSubmitObjetivo(evento):
    evento.preventDefault()
    resultado = validarObjetivo(inputObjetivo.value)         // RF-10
    si resultado.accion == "rechazar":
        #objetivo-error.textContent = resultado.error        // texto exacto RF-10
        retornar                                             // no toca el objetivo anterior
    #objetivo-error.textContent = ""
    si resultado.accion == "eliminar":
        eliminarObjetivo()
    si no:
        guardarObjetivo(resultado.minutos)
    reflejarObjetivoEnCampo()                                // input = guardado o vacío
    renderizar()                                             // RF-5, RF-7


// ---------- Renderizado (app.js) ----------
let semanaMostrada   // lunes de la semana que se está mostrando

function renderizar():
    sesiones = cargarSesiones()
    objetivo = cargarObjetivo()                              // se relee en cada pintado
    hoy = new Date()
    mostrarMinutosSemana(calcularMinutosSemana(sesiones, hoy), objetivo)
    mostrarInvitacionObjetivo(objetivo)
    semanaMostrada = obtenerRangoSemana(hoy).lunes           // RF-6
    ... resto igual (racha, días mes, historial, mapa)


// ---------- Detección de cambio de semana (app.js) ----------
// Se añade a la llamada que ya existe del reloj (setInterval 1 s)
function comprobarCambioSemana():
    si haCambiadoSemana(semanaMostrada, new Date()):
        renderizar()                                          // semana nueva, mismo objetivo

setInterval(() => { actualizarReloj(); comprobarCambioSemana(); }, 1000)
```

**Cálculo corregido de la semana** (RF-4, decisión 1B):

```
function calcularMinutosSemana(sesiones, hoy):
    rango = obtenerRangoSemana(hoy)
    total = 0
    para cada sesion:
        fecha = textoAFecha(sesion.fecha)
        si fecha >= rango.lunes && fecha <= rango.domingo:    // antes: fecha <= hoy
            total += sesion.minutos
    retornar total
```

---

## Estructura HTML (modificaciones en `index.html`)

```html
<!-- Nueva tarjeta de objetivo, FUERA de #form-sesion (decisión 2C),
     colocada entre "Mejor racha" y "Registrar sesión" -->
<section class="objetivo" aria-labelledby="titulo-objetivo">
    <h2 id="titulo-objetivo">Objetivo semanal</h2>
    <form id="form-objetivo" novalidate>
        <div class="campo">
            <label for="objetivo-minutos">Minutos que quieres estudiar esta semana</label>
            <input type="number" id="objetivo-minutos" min="1" max="10080" step="1"
                   inputmode="numeric" placeholder="Ej: 300"
                   aria-describedby="objetivo-error">
        </div>
        <button type="submit" id="btn-objetivo">Guardar objetivo</button>
    </form>
    <p id="objetivo-error" class="error" role="alert"></p>
    <p id="objetivo-vacio" class="objetivo-vacio">
        Aún no tienes objetivo. Fija los minutos que quieres estudiar cada semana.
    </p>
</section>
```

```html
<!-- Zona de minutos: el total se reescribe y se añade el detalle (RF-3, decisión 3B) -->
<p id="minutos-semana" class="minutos-semana">Esta semana: 0 min</p>
<p id="progreso-detalle" class="progreso-detalle" hidden></p>
<p id="dias-mes" class="dias-mes">0 días este mes</p>
```

```html
<!-- Orden de scripts: la lógica pura se carga antes de app.js -->
<script src="logica-mapa.js"></script>
<script src="logica-objetivo.js"></script>
<script src="app.js"></script>
```

---

## Estilos CSS (modificaciones en `styles.css`, solo lo esencial)

```css
:root {
    /* ...existentes... */
    --color-exito: #2A9D8F;      /* nuevo: estado positivo, separado del rojo de error */
}
[data-tema="oscuro"] {
    --color-exito: #57CC99;      /* contraste sobre fondo oscuro */
}

/* Tarjeta de objetivo: mismo patrón de tarjeta que .formulario */
.objetivo { background: var(--color-tarjeta); border: 1px solid var(--color-borde);
            border-radius: var(--radio); padding: ...; }

/* Invitación cuando no hay objetivo (RF-9) */
.objetivo-vacio { color: var(--color-texto-suave); font-size: .9rem; }

/* Foco visible en el campo del objetivo (NNF accesibilidad) */
#objetivo-minutos:focus { outline: 2px solid var(--color-primario); outline-offset: 2px; }

/* Detalle de progreso junto al total */
.progreso-detalle { text-align: center; font-size: .9rem; color: var(--color-texto-suave); }

/* Indicador de meta cumplida (RF-8): color + borde + emoji "🎉" en el texto,
   para distinguirse también sin depender del color */
.progreso-detalle.cumplida { color: var(--color-exito); border: 1px solid var(--color-exito);
                             border-radius: var(--radio); font-weight: 700; }
```

Responsive: la tarjeta reutiliza el ancho de las tarjetas existentes; el input admite
números de hasta 5 dígitos (10080) sin desbordar a 375 px.

---

## Decisiones técnicas justificadas

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Archivo nuevo `logica-objetivo.js` (IIFE → `globalThis`) | Copiar las funciones dentro del test (patrón `test-edit.js`) | Copiar hace que los tests dejen de probar el código real y puedan desviarse; el patrón IIFE ya funciona con `node --test` (`test-mapa.js`) |
| Reescribir `calcularMinutosSemana` (mismo nombre, criterio `<= domingo`) | Crear una 2.ª función `calcularProgresoObjetivo` y dejar la vieja | RF-3 exige que el total `X` **sea** el progreso: dos cálculos podrían divergir y mostrar cifras distintas. Efecto visible también en el total sin objetivo (los futuros pasan a contar) → se documenta en `AGENTS.md` |
| `hoy` como parámetro de `obtenerRangoSemana` y `calcularMinutosSemana` | `new Date()` dentro de la función (como hoy) | Requisito de la plantilla: testear sin depender del reloj |
| Clave `diarioEstudio.objetivo` con valor entero plano (`String(minutos)`) | JSON `{"minutos":300}` | Lo exige RF-2: valor simple, se lee sin `JSON.parse` y es consistente con el resto de claves |
| `interpretarObjetivoGuardado` devuelve `null` ante cualquier valor inválido | Lanzar error o corregir el valor | RF-2: valor corrupto → estado "sin objetivo", sin errores en consola ni bloqueo del arranque |
| Input `type="number"` + `novalidate` en `#form-objetivo` y validación propia | Dejar la validación nativa (`min`/`max`/`required`) | El mensaje nativo sale en el idioma del navegador (RF-10 lo prohíbe) y bloquea el `submit`, impidiendo tratar "vacío = eliminar" |
| Guardar con botón "Guardar objetivo" (submit de la tarjeta) | Guardar automáticamente al escribir o al perder el foco | Guardar por tecla persistiría valores intermedios inválidos; el botón da un punto único para validar, mostrar el error y aplicar "vacío = eliminar" |
| El detalle y el indicador viven en `#progreso-detalle`, junto a `#minutos-semana` | Duplicar el indicador también en la tarjeta de objetivo | RF-3 sitúa objetivo + acumulado + falta/superado en la zona de minutos; un solo indicador evita dos fuentes con posibles estados distintos |
| Reutilizar el `setInterval` del reloj (1 s) comparando el lunes | `setInterval` propio cada minuto; o comprobar solo al interactuar | Ya existe un temporizador y comparar un par de fechas es negligible; comprobar solo al interactuar incumple RF-6 (pestaña abierta sin eventos) |
| Releer el objetivo de localStorage en cada `renderizar()` | Cachearlo en una variable durante la sesión | Mismo patrón que `cargarSesiones()`: una sola fuente de verdad, sin estado duplicado que pueda desincronizarse |
| Actualizar el input solo al cargar y tras guardar/eliminar | Escribir el valor del input en cada `renderizar()` | `renderizar()` se dispara al crear/editar sesiones; pisaría lo que el usuario esté escribiendo en la tarjeta |
| Variable nueva `--color-exito` + emoji/texto en el indicador | Usar `--color-primario` (rojo) | El rojo es el color de error/acciones de la paleta; el estado positivo necesita color propio y el texto garantiza distinguibilidad sin depender solo del color (NNF) |
| La tarjeta va antes del `form` de sesión, como sección hermana | Dentro de la tarjeta "Registrar sesión" pero fuera del `<form>`; o al final de la página | Fuera del formulario de sesión de punta a punta (RF-1: no interfere con el modo edición de la spec 002); antes del formulario se lee como "primero la meta, luego el registro" y queda visible sin scroll largo en móvil |

---

## Estrategia de tests con `node --test`

### Archivo: `test-objetivo.js`

Mismo patrón que `test-mapa.js`: se lee `logica-objetivo.js` con `readFileSync` y se
`eval`úa; las funciones se toman de `globalThis`. Sin dependencias, sin reloj: todas las
fechas son fijas.

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
eval(readFileSync(join(__dirname, 'logica-objetivo.js'), 'utf8'));
const { obtenerRangoSemana, calcularMinutosSemana, validarObjetivo,
        interpretarObjetivoGuardado, formatearTotalSemana,
        formatearDetalleProgreso, haCambiadoSemana } = globalThis;

// RF-4 (decisión 1B): la sesión futura de la MISMA semana sí cuenta
test('calcularMinutosSemana: incluye sesiones futuras dentro de la semana', () => {
    const hoy = new Date(2026, 9, 7);            // miércoles 7 oct 2026
    const sesiones = [
        { fecha: '2026-10-05', minutos: 30 },    // lunes (pasado)
        { fecha: '2026-10-09', minutos: 45 },    // viernes (futuro) → SÍ cuenta
        { fecha: '2026-10-04', minutos: 999 },   // domingo anterior → NO cuenta
        { fecha: '2026-10-12', minutos: 999 },   // lunes siguiente → NO cuenta
    ];
    assert.equal(calcularMinutosSemana(sesiones, hoy), 75);
});

// RF-10: texto exacto de rechazo
test('validarObjetivo: rechaza fuera de rango con el texto exacto', () => {
    const r = validarObjetivo('10081');
    assert.equal(r.accion, 'rechazar');
    assert.equal(r.error, 'Introduce un número entero entre 1 y 10080 minutos.');
});
```

### Casos a cubrir (≈25 tests)

| Función | Casos |
|---|---|
| `obtenerRangoSemana` | miércoles → lunes/domingo correctos; hoy = lunes; hoy = domingo; cruce de año (sáb 2 ene → lun 30 dic) |
| `calcularMinutosSemana` | futuro dentro de la semana **sí** cuenta (RF-4); semana anterior no; lunes siguiente no; varias sesiones mismo día suman; sesiones antiguas sin `hora` cuentan; sin sesiones → 0; fechas fijas, cero dependencia del reloj |
| `validarObjetivo` | `"300"` → guardar 300; `" 120 "` → guardar 120; `"1"` y `"10080"` límites → guardar; `"0"`, `"-5"`, `"10081"`, `"45.5"`, `"abc"`, `""`→rechazar… (con `""` y `"   "` → **eliminar**, no error); mensaje exacto RF-10 en todos los rechazos |
| `interpretarObjetivoGuardado` | `null`/`""`/`"abc"`/`"0"`/`"45.5"`/`"10081"` → `null` (sin objetivo, RF-2/RF-9); `"300"` → `300` |
| `formatearTotalSemana` | sin objetivo → `"Esta semana: 45 min"`; con objetivo → `"Esta semana: 45/300 min"`; acumulado 0 → `"Esta semana: 0/300 min"` |
| `formatearDetalleProgreso` | falta (`Te faltan…`); igual que la meta (`Meta cumplida 🎉`); superado (`Has superado…`); sin objetivo → `null` |
| `haCambiadoSemana` | mismo lunes → `false`; semana siguiente → `true`; cambio de año → `true` |

**Verificación**: `node --test` en verde (los 3 archivos de test) antes de dar por
hecha cualquier tarea.

---

## Cobertura de RF por componente

| RF | `logica-objetivo.js` | `test-objetivo.js` | `app.js` | `index.html` | `styles.css` | `AGENTS.md` |
|---|---|---|---|---|---|---|
| RF-1 Fijar objetivo | `validarObjetivo` | ✅ | `manejarSubmitObjetivo`, `guardarObjetivo` | tarjeta `#form-objetivo` | `.objetivo` | clave nueva |
| RF-2 Persistencia | `interpretarObjetivoGuardado` | ✅ | `cargar/guardar/eliminarObjetivo` | — | — | clave documentada |
| RF-3 Visualización | `formatearTotalSemana`, `formatearDetalleProgreso` | ✅ | `mostrarMinutosSemana` | `#progreso-detalle` | `.progreso-detalle` | formato nuevo |
| RF-4 Cálculo (futuros sí) | `calcularMinutosSemana(sesiones, hoy)`, `obtenerRangoSemana` | ✅ | `renderizar()` | — | — | criterio futuros |
| RF-5 Actualización inmediata | — | — | `renderizar()` en submit de sesión | — | — | — |
| RF-6 Cambio de semana | `haCambiadoSemana`, `obtenerRangoSemana` | ✅ | tick del reloj + `renderizar()` | — | — | — |
| RF-7 Cambiar objetivo | — | — | `manejarSubmitObjetivo` (fuera del form) | tarjeta separada | — | — |
| RF-8 Meta cumplida | `formatearDetalleProgreso` | ✅ | `mostrarMinutosSemana` (clase `.cumplida`) | `#progreso-detalle` | `.cumplida`, `--color-exito` | — |
| RF-9 Sin objetivo | `interpretarObjetivoGuardado` → `null` | ✅ | `mostrarInvitacionObjetivo` | `#objetivo-vacio` | `.objetivo-vacio` | — |
| RF-10 Validación | `validarObjetivo` (texto exacto) | ✅ | muestra el error en `#objetivo-error` | `novalidate`, `role="alert"` | `.error` | — |

---

## Orden de implementación

1. **`logica-objetivo.js`**: crear con las 7 funciones puras y cargarla en `index.html`
   antes de `app.js` (sin tocar aún `app.js`: su `calcularMinutosSemana` antigua sigue
   mandando porque se carga después → cero cambio de comportamiento).
2. **`test-objetivo.js`**: crear y dejar `node --test` en verde.
3. **`index.html`**: tarjeta de objetivo + `#progreso-detalle`.
4. **`styles.css`**: tarjeta, invitación, detalle, indicador `.cumplida`, foco.
5. **`app.js`**: persistencia → pintado (eliminar la `calcularMinutosSemana` antigua,
   migrar a la de `logica-objetivo.js` con `hoy`) → eventos de la tarjeta → detección de
   cambio de semana en el tick del reloj.
6. **`AGENTS.md` + `MEMORY.md`**: documentar formato `X/Y`, clave y criterio de futuros.
7. **Verificación**: `node --test` completo + Chrome DevTools (flujo entero, modo edición
   de la spec 002 intacto, claro/oscuro, móvil 375 px, consola limpia).
