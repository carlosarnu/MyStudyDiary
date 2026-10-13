# Tareas: Buscador del historial de sesiones

Spec: `specs/004-buscador-historial/spec.md` · Plan: `specs/004-buscador-historial/plan.md`

## Fase 1: Lógica pura y tests

- [x] **T1** (hecha 2026-10-10): Crear `logica-busqueda.js` (IIFE → `globalThis`, patrón `logica-mapa.js`, sin
  DOM ni reloj) con `normalizarTexto(texto)` (trim + minúsculas + diacríticos, no-string →
  `""`) y `filtrarSesiones(sesiones, texto)` (q vacío → todas; tema por substring; fecha
  `AAAA-MM-DD` por substring; mes **por prefijo** con array propio en minúsculas; fecha
  inválida no participa; orden de entrada conservado), más sus helpers internos
  `esFechaValida` y `nombreMesDeFecha`; añadir `<script src="logica-busqueda.js">` en
  `index.html` **antes de `app.js`**.
  - **RF**: RF-3, RF-4, RF-5, RF-10
  - **Archivos**: `logica-busqueda.js`, `index.html`
  - **Hecho cuando**: las 2 funciones están en `globalThis`, `node --test` sigue en verde
    (80) y la app carga sin errores de consola **sin ningún cambio visible** (nada usa la
    función todavía). Verificado también en consola de DevTools:
    `filtrarSesiones([{fecha:'2026-10-05', tema:'Inglés'}], 'oct').length === 1`.

- [x] **T2** (hecha 2026-10-10): Crear `test-busqueda.js` con `node --test` (eval de `logica-busqueda.js` como
  en `test-mapa.js`, sesiones con fechas fijas, sin reloj) cubriendo la lista RF-10: la
  normalización (mayúsculas, tildes, espacios, guiones intactos, no-string), el filtrado
  por tema (`ingles`, `maticas`, `mateamaticas`✗), la fecha en todas las formas (`2026-10-05`,
  `2026-10`, `10-05`, `05`, `octubre`/`oct`✓, `tob`/`ubre`✗, `05/10/2026`✗, `viernes`✗),
  las consultas de 1 carácter (`o`, `a`, `e`, `i`), la `fecha` inválida (`"abc"`, `""`,
  `undefined`) y el `tema` vacío **sin excepción**, `minutos`/`hora`/`id` no buscables,
  texto vacío, sin coincidencias y orden de salida.
  - **RF**: RF-3, RF-4, RF-5, RF-10
  - **Archivos**: `test-busqueda.js`
  - **Hecho cuando**: `node --test` pasa en verde con los ~35 tests nuevos (total ≈115)
    y los 80 existentes siguen sin romperse; incluidos los casos de prefijo negativo
    (`tob`), de 1 carácter (`a` → abril y agosto) y la sesión del `2026-01-01` que
    coincide con `enero`.
  - **Verificado**: `node --test` → 115 tests, 115 pass, 0 fail (35 de `test-busqueda.js`
    + 80 existentes). Sin fechas actuales ni `Date`: solo strings `AAAA-MM-DD` fijos.

## Fase 2: Interfaz (HTML y CSS)

- [x] **T3** (hecha 2026-10-10): Modificar `index.html` — dentro de `<section class="sesiones">`, entre el
  `<h2>Historial</h2>` y el `<ul id="lista-sesiones">`, añadir `<form id="form-busqueda"
  class="busqueda" role="search">` con `<label for="buscador">Buscar en el historial</label>`,
  `<input type="search" id="buscador">` (placeholder de ejemplo, `autocomplete="off"`) y
  `<button type="button" id="btn-limpiar" class="btn-limpiar">Limpiar búsqueda</button>`;
  añadir `#aviso-busqueda` (`class="vacio"`, `role="status"`, `aria-live="polite"`, **vacío**)
  justo después del `<ul>`, dejando `#sin-sesiones` intacto.
  - **RF**: RF-1, RF-6, RF-11
  - **Archivos**: `index.html`
  - **Hecho cuando**: el buscador está **dentro** de la sección del historial y **fuera** de
  `#form-sesion` y de la tarjeta `.objetivo`; el campo tiene etiqueta visible en español; la
  región `aria-live` existe y arranca vacía; "Guardar sesión"/"Guardar cambios"/"Cancelar" y
  la tarjeta de objetivo se ven y funcionan igual que antes.
  - **Verificado**: `node --test` → 115 tests, 115 pass, 0 fail. Chrome DevTools (consola sin
    mensajes): hijos de `section.sesiones` = `h2 → form#form-busqueda.busqueda →
    ul#lista-sesiones → p#aviso-busqueda.vacio → p#sin-sesiones.vacio`; `role="search"`,
    etiqueta "Buscar en el historial" asociada (`for="buscador"`), `input type="search"`,
    botón `type="button"`; fuera de `#form-sesion` y de `section.objetivo`; `#aviso-busqueda`
    con `role="status" aria-live="polite"` y arranca vacío; scripts en orden
    `logica-mapa → logica-objetivo → logica-busqueda → app.js` (`filtrarSesiones` y
    `normalizarTexto` en `globalThis`). A 375 px `document.scrollWidth === 375` (sin
    desborde). Registrar sesión y modo edición funcionan igual. localStorage restaurado
    (solo `diarioEstudio.tema`).

- [x] **T4** (hecha 2026-10-10): Modificar `styles.css` — sección "Buscador": `.busqueda` (flex columna,
  `gap .5rem`, `margin-bottom 1rem`), `.busqueda .campo { margin-bottom: 0 }`,
  `#buscador:focus` con `outline: 2px solid var(--color-primario)` + `outline-offset`,
  `#buscador::placeholder` con `--color-texto-suave` y `.btn-limpiar` (transparente, borde
  `--color-borde`, texto `--color-texto`, hover con `--color-primario`, `:focus` con
  outline, `align-self: flex-start`). `#aviso-busqueda` reutiliza `.vacio` más una regla
  defensiva por id con `--color-texto-suave` (siempre mensaje neutro, nunca rojo de error,
  aunque le añadan una clase en T5/T6). Decisión menor: padding del botón `0.65rem 1rem`
  (altura ≈ 44 px) para toque cómodo en móvil.
  - **RF**: RF-11 + NNF (claro/oscuro, móvil)
  - **Archivos**: `styles.css`
  - **Hecho cuando**: el foco del campo y del botón es **visible** en ambos temas, el botón
  es legible en claro y en oscuro (sin blanco sobre gris claro) y a 375 px
  `document.getElementById('buscador')` no desborda: `scrollWidth` del documento = 375.
  Sin variables de color nuevas.
  - **Verificado**: `node --test` → 115 tests, 115 pass, 0 fail. Chrome DevTools (consola sin
    mensajes): `#buscador:focus` → `outline: rgb(230,57,70) solid 2px`, `outline-offset: 2px`
    (gana a `.campo input:focus { outline: none }`) y borde a `--color-primario`; `.btn-limpiar`
    transparente con texto `#1A1A2E`/`#FAF7F2` y borde `--color-borde` (secundario, no el
    primario rojo), 148×43 px; `#aviso-busqueda` en `--color-texto-suave` (`#4A4A68` /
    `#A8A8B8`), mensaje neutro. A 375 px con `emulate`: `document.scrollWidth === 375`, campo
    301 px, sin desborde, en claro y en oscuro; capturas de escritorio y móvil en ambos
    temas. localStorage restaurado (solo `diarioEstudio.tema = "oscuro"`).

## Fase 3: Integración en `app.js`

- [x] **T5** (hecha 2026-10-10): Modificar el pintado — ampliar `mostrarSesiones` a
  `mostrarSesiones(sesionesVisibles, totalGuardadas)` (con 0 visibles: si
  `totalGuardadas === 0` gana `#sin-sesiones`; si no, `#sin-sesiones` oculto y
  `#aviso-busqueda` con el texto exacto `No se encontraron sesiones que coincidan con la búsqueda.`;
  con visibles, ambos ocultos y `#aviso-busqueda` vacío); crear `pintarHistorial(sesiones)`
  (lee `campoBusqueda.value` y llama a `filtrarSesiones`, **nunca escribe el campo**) y
  `renderizarHistorial()`; cambiar la línea de `renderizar()` para que llame a
  `pintarHistorial(sesiones)`; añadir el listener `campoBusqueda.addEventListener("input", renderizarHistorial)`.
  - **RF**: RF-2, RF-3, RF-5, RF-6, RF-8, RF-9
  - **Archivos**: `app.js`
  - **Hecho cuando**: escribir y borrar filtra la lista al instante manteniendo el orden
  (más reciente primero) y **sin repintar mapa, rachas, totales ni objetivo** (comprobar en
  DevTools que no se reconstruye `#mapa-calor` por tecla); con texto escrito, crear o editar
  una sesión repinta **filtrada** y **el campo conserva lo escrito**; los 3 mensajes son los
  correctos (coincidencias → nada; 0 con sesiones guardadas → el texto exacto de RF-6 sin el
  aviso de vacío; historial vacío con texto → `Aún no hay sesiones registradas.`); recargar
  con texto escrito muestra el campo vacío y todo el historial.
  - **Verificado**: `node --test` → 115 tests, 115 pass, 0 fail. Chrome DevTools (móvil 375 px
    emulado, consola sin mensajes): con 4 sesiones de prueba, `octubre`/`2026-10` filtran a las
    3 de octubre y `ingles` a `Inglés` **al escribir tecla a tecla** (sin recarga); Backspace
    borra carácter a carácter y devuelve la lista completa; `zzz` → lista vacía + texto exacto
    `No se encontraron sesiones que coincidan con la búsqueda.` (con `#sin-sesiones` oculto);
    historial vacío con texto → gana `Aún no hay sesiones registradas.`; con filtro activo
    racha/mejor/días/semana/mapa idénticos y **el nodo del mapa no se recrea por tecla**
    (identidad de nodo + misma longitud de HTML); RF-9: editar `Inglés` con filtro `historia`
    (la sesión sale de la lista pero sigue en "Guardar cambios"/"Cancelar"), guardar repinta
    filtrado sin perder la sesión, y editar `Historia`→`Química` la saca de la vista con el
    modo edición saliendo limpio; crear `Historia de Roma` con filtro activo repinta filtrado
    y **el campo conserva `historia`**; 375 px sin scroll horizontal. localStorage restaurado
    (solo `diarioEstudio.tema = "oscuro"`). Corrección aplicada durante la tarea: el cuerpo de
    `mostrarSesiones` seguía usando el viejo nombre `sesiones` en el `[...].sort(...)` (debe
    ser `sesionesVisibles`); sin eso la función lanzaba `ReferenceError` al pintar filas.

- [x] **T6** (hecha 2026-10-10): Añadir los eventos restantes en `iniciar()`: clic en `#btn-limpiar` (vaciar el
  campo → `renderizarHistorial()` → `campoBusqueda.focus()`) y `submit` de `#form-busqueda`
  con `evento.preventDefault()`; comprobar que no se ha tocado el modo edición de la spec 002.
  - **RF**: RF-7, RF-2, RF-9
  - **Archivos**: `app.js`
  - **Hecho cuando**: "Limpiar búsqueda" vacía el campo, restaura la lista completa y
  devuelve el foco al input; pulsar **Intro** en el campo no recarga la página ni envía
  nada; con una sesión en edición, escribir en el buscador **no sale del modo edición**
  (sigue "Guardar cambios"/"Cancelar") aunque la sesión deje de ser visible, y
  guardar/cancelar repinta con el filtro activo sin perder ni duplicar la sesión; en
  Application → Local Storage **no aparece ninguna clave nueva** (el texto no persiste).
  - **Verificado**: `node --test` → 115 tests, 115 pass, 0 fail. Chrome DevTools (móvil 375 px
    emulado, consola sin mensajes): con 4 sesiones de prueba, `historia` filtra a 1 y
    **Intro dispara el `submit` (contado con un listener de prueba) sin recargar**: marcador
    en `window` sigue vivo, URL intacta y el filtro permanece; clic en "Limpiar búsqueda" →
    campo vacío, lista completa (4 filas en orden), foco vuelve al `#buscador`;
    `zzz` → 0 filas + texto exacto de RF-6 y al limpiar el aviso queda vacío
    (`#sin-sesiones` sigue oculto); con sesión en edición (editandoId + "Guardar cambios" +
    "Cancelar") filtro `zzz` y clic en limpiar → **modo edición intacto** y el formulario
    conserva la sesión editada, cancelar sale limpio; en Local Storage solo
    `diarioEstudio.sesiones` (de prueba, borrada al terminar) y `diarioEstudio.tema`:
    ninguna clave nueva. `document.documentElement.scrollWidth === 375`. Sin ocultar el
    botón (decisión de T3). localStorage restaurado (solo `diarioEstudio.tema = "oscuro"`).

## Fase 4: Documentación y verificación

- [x] **T7** (hecha 2026-10-10): Actualizar `AGENTS.md` — sección "Comandos" con **4** archivos de test
  (`test-mapa.js`, `test-edit.js`, `test-objetivo.js`, `test-busqueda.js`) y nueva sección
  "Buscador" (busca tema y fecha; fecha por substring del `AAAA-MM-DD` y mes **por prefijo**
  en español; mayúsculas/tildes ignoradas; el texto no se persiste y el campo arranca vacío;
  `renderizarHistorial()` repinta solo la lista sin tocar el campo; los mensajes exactos de
  "sin resultados" y "historial vacío"; el buscador está fuera de `#form-sesion`); actualizar
  `MEMORY.md` con la spec 004 y sus decisiones (NFD, array de meses propio, `#aviso-busqueda`).
  - **RF**: Criterio de finalización "Documentación"
  - **Archivos**: `AGENTS.md`, `MEMORY.md`
  - **Hecho cuando**: `AGENTS.md` no contradice el código (4 archivos de test, sección del
  buscador con las reglas anteriores) y `MEMORY.md` refleja el estado de la spec 004 sin
  pasar de ~50 líneas de contenido útil.
  - **Verificado**: `node --test` → 115 tests, 115 pass, 0 fail (solo documentación, sin
  tocar ningún archivo de código). `AGENTS.md` actualizado en 4 puntos: "Comandos" y
  "Verificación" con los 4 archivos de test; "Stack y estructura" con `logica-busqueda.js`
  y el orden de los `<script>`; nueva sección "Buscador del historial" (ubicación dentro
  del historial y fuera de `#form-sesion`, tema y fecha por substring, mes por prefijo,
  normalización, sin persistencia, sin contador, mensajes exactos, `filtrarSesiones` en
  `logica-busqueda.js`). `MEMORY.md` reescrito (57 líneas, ≈50 de contenido útil): estado
  de la spec 004 (T1–T7 hechas, T8 pendiente en ese momento, hoy cerrada; 115 tests), las 5 decisiones cerradas + mes
  por prefijo + fecha inválida, y errores a evitar (sort de `sesionesVisibles`, orden de
  los `<script>`, `renderizar()` sin reescribir el campo).

- [x] **T8** (hecha 2026-10-10): Verificación completa — `node --test` en verde (4 archivos, ≈115 tests) +
  Chrome DevTools: recorrer la checklist RF-1…RF-11 (filtrado inmediato, todas las formas
  de fecha y mes con prefijo negativo, texto exacto de "sin resultados" vs aviso de vacío,
  botón limpiar, Intro sin recarga, estadísticas idénticas con y sin filtro, modo edición
  intacto) + consola sin errores + modo claro y oscuro + móvil 375 px (`emulate`, sin scroll
  horizontal) + restaurar el localStorage (solo `diarioEstudio.tema`).
  - **RF**: RF-1–RF-11
  - **Archivos**: ninguno (salvo correcciones que esta tarea pueda motivar)
  - **Hecho cuando**: `node --test` está en verde, los criterios de finalización de la spec
  quedan marcados, la consola no tiene mensajes, la captura a 375 px muestra campo, botón y
  mensajes sin desbordar en ambos temas, y no se ha añadido ninguna clave a `localStorage`.
  - **Verificado**: `node --test` → 115 tests, 115 pass, 0 fail (4 archivos). Chrome DevTools
    (móvil 375 px emulado, **consola sin mensajes**, claro y oscuro, con 5 sesiones de prueba
    y objetivo 300): RF-1 hijos de `section.sesiones` = `h2 → form#form-busqueda → ul →
    #aviso-busqueda → #sin-sesiones`, etiqueta "Buscar en el historial" asociada, campo vacío
    tras recargar con texto escrito; RF-2 tecla a tecla y con `type_text` real, sin recarga,
    orden conservado, `renderizar()` con filtro activo repinta filtrada y **no reescribe el
    campo** (crear "Historia de Roma" con filtro `historia` conserva el texto); RF-3
    `2026-10`/`10-05`/`05`/`octubre`/`oct`✓, `tob`/`ubre`/`viernes`/`5 de octubre`/
    `05/10/2026`/`minutos`/`17:00`/id✗; RF-4 `HISTORIA`, `maticas`, `espanol`, ` Historia `✓
    y `mateamaticas`✗; RF-5 vacío/espacios = todo; RF-6 texto exacto con `#sin-sesiones`
    oculto y gana el aviso de vacío con historial vacío; RF-7 clic limpiar → vacío, lista
    completa, foco vuelve al campo; RF-8 racha/mejor/semana/días idénticas con y sin filtro y
    nodo + HTML del mapa idénticos por tecla; RF-9 editar `Inglés` con filtro `historia`
    mantiene "Guardar cambios"/"Cancelar" y cancelar sale limpio, e editar
    `Historia`→`Química` la saca de la vista con la estadística intacta; RF-10
    `logica-busqueda.js` sin `document`/`localStorage`/`Date`; RF-11 foco `outline 2px
    rgb(230,57,70)` visible en ambos temas, `aria-live` vacío con resultados, sin contador
    "X de Y", Intro dispara `submit` (preventDefault) sin recargar, `scrollWidth === 375`.
    `fecha` inválida (`'abc'`) sin excepción en el navegador. localStorage restaurado (solo
    `diarioEstudio.tema = "oscuro"`). Observación conocida confirmada y no bloqueante:
    `esFechaValida` acepta día 1–31 sin validar el calendario (`2026-02-31` cuenta para el
    mes), permitida por la decisión 2 de la spec.
