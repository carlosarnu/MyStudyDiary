# Tareas: Objetivo semanal de estudio

Spec: `specs/003-objetivo-semanal/spec.md` · Plan: `specs/003-objetivo-semanal/plan.md`

## Fase 1: Lógica pura y tests

- [x] **T1**: Crear `logica-objetivo.js` (IIFE → `globalThis`, patrón `logica-mapa.js`) con
  `obtenerRangoSemana(hoy)`, `calcularMinutosSemana(sesiones, hoy)`, `validarObjetivo(texto)`,
  `interpretarObjetivoGuardado(valorCrudo)`, `formatearTotalSemana(acumulado, objetivo)`,
  `formatearDetalleProgreso(acumulado, objetivo)` y `haCambiadoSemana(lunesGuardado, hoy)`;
  añadir su `<script>` en `index.html` antes de `app.js`.
  - **RF**: RF-2, RF-3, RF-4, RF-6, RF-8, RF-9, RF-10
  - **Hecho cuando**: el archivo exporta las 7 funciones a `globalThis`, la app carga sin
    errores en consola y **no ha cambiado ningún comportamiento visible** (la versión antigua
    de `calcularMinutosSemana` de `app.js` sigue activa hasta T5).

- [x] **T2**: Crear `test-objetivo.js` con `node --test` (eval de `logica-objetivo.js` como
  en `test-mapa.js`, fechas fijas) cubriendo las 7 funciones.
  - **RF**: RF-2, RF-3, RF-4, RF-6, RF-8, RF-9, RF-10
  - **Hecho cuando**: `node --test` pasa en verde con los ~25 tests, incluidos: sesión futura
    dentro de la semana **sí cuenta** (RF-4), límites 1/10080, mensaje exacto
    `Introduce un número entero entre 1 y 10080 minutos.`, vacío = eliminar, valor corrupto
    → `null`, formato `"Esta semana: X/Y min"` y detección de cambio de semana.

## Fase 2: Interfaz (HTML y CSS)

- [x] **T3**: Modificar `index.html` — nueva `<section class="objetivo">` con `#form-objetivo`
  (`novalidate`), input `#objetivo-minutos` con etiqueta asociada, botón "Guardar objetivo",
  `#objetivo-error` (`role="alert"`) e `#objetivo-vacio`; añadir `#progreso-detalle` justo
  después de `#minutos-semana`.
  - **RF**: RF-1, RF-3, RF-9, RF-10
  - **Hecho cuando**: la tarjeta existe **fuera** de `#form-sesion` (entre "Mejor racha" y
    "Registrar sesión") y `#progreso-detalle` está en la zona de minutos, ambos con sus ids
    del plan.

- [x] **T4**: Modificar `styles.css` — variable `--color-exito` en `:root` y
  `[data-tema="oscuro"]`, estilos de `.objetivo`, `.objetivo-vacio`, `.progreso-detalle` y
  `.progreso-detalle.cumplida`, y foco visible en `#objetivo-minutos`.
  - **RF**: RF-8 + NNF accesibilidad/temas
  - **Hecho cuando**: el indicador de meta cumplida se distingue **por texto** (emoji
    "Meta cumplida 🎉") y por color en modo claro y oscuro, el foco del campo es visible, y
    la tarjeta se ve bien a 375 px sin desbordar con un objetivo de 10080.

## Fase 3: Integración en `app.js`

- [x] **T5**: Añadir persistencia — `CLAVE_OBJETIVO = "diarioEstudio.objetivo"`,
  `cargarObjetivo()`, `guardarObjetivo(minutos)`, `eliminarObjetivo()` y
  `reflejarObjetivoEnCampo()` (al cargar y tras guardar/eliminar, nunca en `renderizar()`).
  - **RF**: RF-2, RF-9
  - **Hecho cuando**: un objetivo guardado se recarga al volver a abrir la app; con la clave
    ausente, vacía o corrupta (`"abc"`, `"0"`, `"45.5"`) la app arranca en estado "sin
    objetivo" sin errores en consola.

- [x] **T6**: Modificar el pintado — **eliminar** la `calcularMinutosSemana` antigua de
  `app.js` (pasa a valer la de `logica-objetivo.js`), y hacer que `renderizar()` pase
  `new Date()` como `hoy` y llame a `mostrarMinutosSemana(acumulado, objetivo)` (total +
  `#progreso-detalle` con clase `.cumplida` + invitación `#objetivo-vacio`).
  - **RF**: RF-3, RF-4, RF-5, RF-8, RF-9
  - **Hecho cuando**: con objetivo se lee `"Esta semana: X/Y min"` + detalle, sin objetivo
    `"Esta semana: X min"` + invitación; crear/editar/borrar sesión actualiza progreso e
    indicador sin recargar; una sesión con fecha futura de la semana en curso suma (y el
    total semanal también la cuenta).

- [x] **T7**: Añadir eventos — `manejarSubmitObjetivo` (usa `validarObjetivo`: rechazo con el
  texto exacto sin modificar el objetivo anterior, vacío = eliminar) y
  `comprobarCambioSemana()` en el tick del reloj existente (1 s) llamando a `renderizar()`.
  - **RF**: RF-1, RF-6, RF-7, RF-10
  - **Hecho cuando**: guardar/cambiar/eliminar el objetivo actualiza la vista sin afectar al
    botón "Guardar sesión"/"Guardar cambios" de la spec 002; `10081` o `abc` muestran
    `Introduce un número entero entre 1 y 10080 minutos.` y dejan el objetivo intacto; con la
    pestaña abierta y sin recargar, al cruzar la medianoche de lunes el progreso pasa a la
    semana nueva conservando el objetivo.

## Fase 4: Documentación y verificación

- [x] **T8**: Actualizar `AGENTS.md` — sección "Total semanal" (nuevo formato
  `"Esta semana: X/Y min"`, inclusión de fechas futuras dentro de la semana, sin objetivo se
  mantiene `"Esta semana: X min"`) y sección "Datos" (clave `diarioEstudio.objetivo`, valor
  entero plano); actualizar `MEMORY.md` con la spec 003.
  - **RF**: Criterio de finalización "AGENTS.md refleja el nuevo formato y la clave"
  - **Hecho cuando**: `AGENTS.md` no contradice el código: documenta el formato X/Y, el
    criterio de fechas futuras y la clave nueva; `MEMORY.md` refleja el estado de la spec 003.

- [x] **T9**: Verificación completa — `node --test` en verde + Chrome DevTools: flujo entero
  (fijar → ver progreso → alcanzar meta → cambiar → eliminar), modo edición de la spec 002
  intacto, clave corrupta en Application → Local Storage, modo claro/oscuro y vista móvil.
  - **RF**: RF-1–RF-10
  - **Hecho cuando**: los 3 archivos de test pasan; en DevTools la checklist de finalización
    de la spec queda marcada, la consola está sin errores y la captura móvil (375 px) muestra
    tarjeta, total `X/Y` e indicador correctamente en ambos temas.
  - **Verificación 2026-10-08 → VEREDICTO: CAMBIOS NECESARIOS** (ver detalle abajo).
    `node --test` = **70/70 verde**; recorrido RF-1…RF-10 en DevTools: **todos pasan**
    (clave corrupta `"abc"`, `"0"`, `"45.5"`, `"10081"` y vacía → "sin objetivo" sin errores;
    sesión futura de la semana suma; meta cumplida aparece y desaparece; vacío = eliminar;
    texto exacto de RF-10; modo edición 002 intacto al guardar objetivo; claro/oscuro y
    móvil 375 px con la tarjeta, el total `X/Y` y el indicador legibles; consola sin
    mensajes). **La tarea queda abierta** por 2 fallos hallados fuera de los RF, que deben
    corregirse antes de cerrarla:
    1. `app.js:521-526` duplica `app.js:749-754` (`botonTema`, `btnPrev`, `btnNext`,
       `selectMeses`): las flechas del mapa se registran dos veces y "Mes anterior/siguiente"
       **salta 2 meses** por clic (verificado en DevTools: Oct–Dic → Ago–Oct). Probable
       regresión introducida en T7. No afecta a ningún RF de la spec 003.
    2. A 375 px hay **desbordamiento horizontal de 24 px** (scroll del documento) causado
       por las celdas del mapa de calor (`.celda`, spec 001, preexistente); la tarjeta de
       objetivo, el total y el indicador **no** desbordan (input `284/284` con `10080`).
    - Observación no bloqueante: `--color-exito` claro `#2A9D8F` da **3,32:1** sobre la
      tarjeta blanca (AA exige 4,5:1 para el texto de 14,4 px en negrita); en oscuro
      `#57CC99` da 7,95:1 y cumple. Ningún criterio de la spec exige esa ratio, pero
      convendría oscurecer el valor claro (p. ej. `#17756A`, 5,54:1).
  - **Correcciones 2026-10-10 (ronda única, usuario aprobada) → T9 CERRADA**:
    1. **Listeners duplicados**: se eliminó el bloque repetido `botonTema` / `btnPrev` /
       `btnNext` / `selectMeses` del final de `iniciar()` (antes `app.js:748-754`); el
       bloque que se conserva es el de `app.js:520-526`, junto al listener de
       `#form-objetivo`. Verificado en DevTools: "Mes anterior/siguiente" avanza
       **exactamente 1 mes** por clic y un cambio en `#num-meses` dispara **un solo**
       `renderizar()` (1 vaciado + 3 añadidos de nodos por cambio).
    2. **Contraste**: `--color-exito` en `:root` pasó de `#2A9D8F` (3,32:1) a
       **`#17756A`** (5,54:1 sobre blanco, 5,19:1 sobre `#FAF7F2` → AA). El valor
       oscuro `#57CC99` no se tocó (7,95:1).
    3. **Scroll horizontal a 375 px**: `grid-template-columns: repeat(7, minmax(0, 1fr))`
       en `.mapa-mes-grid` **y** `.mapa-mes-fechas` (`styles.css`). El `1fr` puro suma
       el mínimo automático `aspect-ratio:1` de `.celda` y cada pista crecía a 47,6 px
       (7×47,6+12 = 345 > 301 del interior de `.mapa-mes`) → `scrollWidth` 399. Con el
       mínimo a 0 las pistas son 36,4 px y `scrollWidth = 375`. En escritorio (contenedor
       480 px) las celdas siguen cuadradas (56×56) y alineadas con las etiquetas de día.
    - Verificación de cierre: `node --test` = **70/70 verde**; DevTools a 375 px
      `scrollWidth = 375` (sin scroll), consola sin mensajes, submit del objetivo guarda
      (100 → `"100"`, `"Esta semana: 0/100 min"`), `10081` muestra el texto exacto sin
      cambiar el objetivo, vacío = eliminar, `.cumplida` en modo claro con `#17756A`
      (5,54:1) y modo oscuro intacto (`#57CC99`).
  - **Ronda de correcciones 2026-10-10 (6 hallazgos menores de la revisión, única ronda)
    → TODOS CORREGIDOS**:
    1. **Contraste del error (RF-10)**: `--color-error` claro pasó de `#E63946`
       (4,17:1 sobre `#FFFFFF`, 3,90:1 sobre `#FAF7F2`) a **`#C1121F`**
       (**6,22:1** sobre blanco, **5,82:1** sobre `#FAF7F2`). Oscuro intacto:
       `#F4A261` = **7,71:1** sobre la tarjeta `#16213E`. Al ser una variable,
       el cambio es coherente en `#objetivo-error` y en `#mensaje-error` (formularios).
    2. **Contraste del total `X/Y`**: `#minutos-semana` dejó `--color-primario`
       (4,17:1 claro / 3,81:1 oscuro) y usa la nueva variable `--color-destacado`
       (`#C1121F` claro, `#F4A261` oscuro) → **6,22:1** claro y **7,71:1** oscuro.
    3. **Rama sin test** `haCambiadoSemana`: +2 tests (lunes guardado `null`,
       `undefined`, string y número → `true`, primera ejecución).
    4. **Fuente única de verdad de RF-8**: función pura `esMetaCumplida(acumulado,
       objetivo)` en `logica-objetivo.js` (salvaguarda `objetivo == null` → `false`),
       usada por `formatearDetalleProgreso` **y** por `app.js`
       (`classList.toggle("cumplida", …)`); +4 tests, incluido el de coherencia
       "el detalle contiene 'Meta cumplida' sí y solo sí `esMetaCumplida` es true".
    5. **Límites de `calcularMinutosSemana`**: +2 tests (sesión exactamente del
       domingo de la semana en curso → sí suma; semana que cruza año: 2 ene 2027 con
       sesión del 30 dic 2026 suma y la del 4 ene 2027 no).
    6. **Trim y ceros a la izquierda**: +2 tests (`interpretarObjetivoGuardado(' 300 ')`
       → 300; `validarObjetivo('007')` → guardar 7 y `interpretarObjetivoGuardado('007')`
       → 7: se testea el comportamiento real del código, sin cambiarlo).
    - Verificación de cierre: `node --test` = **80/80 verde** (10 tests nuevos).
      DevTools: ratios medidos en vivo con `getComputedStyle` en claro y oscuro (puntos
      1 y 2); `.cumplida` aparece y desaparece **siempre junto al texto** "Meta cumplida"
      al alcanzar y bajar de la meta (obj. 100→30→500); consola sin mensajes;
      375 px `scrollWidth = 375`; localStorage restaurado (solo
      `diarioEstudio.tema = "oscuro"`, sin sesiones ni objetivo).
