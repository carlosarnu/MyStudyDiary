# MEMORY.md

## Estado actual

- Repositorio GitHub: https://github.com/carlosarnu/MyStudyDiary (público, rama `main`). Identidad git: Carlos Arnanz. `.idea/` está en `.gitignore`. Para subir cambios: commit + push a `origin`.

- App funcional y verificada: racha (actual/mejor), registro/edición/borrado, mapa de
  calor, modo oscuro, reloj, total semanal, días del mes, objetivo y buscador del historial.
- **Spec 004 — Buscador del historial**: **completa (T1–T8, 2026-10-10)**. `node --test` =
  **115 tests, 0 fallos** (4 archivos); consola sin mensajes y sin desborde a 375 px en
  claro y oscuro. Specs cerradas: 001, 002, 003 y 004.
- Buscador (004) implementado en `logica-busqueda.js` (IIFE autocontenida:
  `normalizarTexto` + `filtrarSesiones`, mes por prefijo del string, sin `Date`) con
  `test-busqueda.js` (35 tests); el detalle de HTML, CSS y eventos vive en la sección
  "Buscador del historial" de `AGENTS.md`.

## Decisiones tomadas

- **Buscador (004) · 5 cerradas con el usuario**: (1) se busca **tema y fecha**; (2) se
  ignoran mayúsculas, tildes y espacios sobrantes; (3) el texto **no se persiste**; (4)
  **sin contador** "X de Y" (la región `aria-live` solo anuncia el 0 resultados); (5)
  archivos nuevos `logica-busqueda.js` + `test-busqueda.js`.
- **Buscador (004) · reglas**: el mes se busca **por prefijo** del nombre en español
  (`oct` sí, `tob`/`ubre` no); una **`fecha` inválida no participa** por fecha (sin
  excepción, solo puede coincidir por tema). CSS: el foco vive en `#buscador:focus` (el id
  gana a `.campo input:focus { outline: none }`) y `#aviso-busqueda` tiene regla por id
  con `--color-texto-suave` (aviso neutro, nunca rojo de error). **Observación conocida,
  aprobada (decisión 2) y no bloqueante**: `esFechaValida` valida solo la forma y mes 1-12
  y día 1-31 → `2026-02-31` se acepta para el nombre del mes; no usa `Date` a propósito.
- **Objetivo (003)**: `diarioEstudio.objetivo` = entero en minutos como string plano
  (`"300"`); ausente o no entero 1–10080 → "sin objetivo"; vacío = eliminar;
  `reflejarObjetivoEnCampo()` **nunca en `renderizar()`**. Tarjeta
  `<section class="objetivo">` con `#form-objetivo`, **fuera de `#form-sesion`**. Semana
  lunes–domingo: las fechas futuras de la semana en curso SÍ cuentan.
- **Rachas**: la mejor excluye la racha viva; fechas futuras consecutivas entre sí cuentan.
- **Modo oscuro**: `[data-tema]` + variables CSS, persiste, respeta `prefers-color-scheme`.
  **Hora**: 24h, reloj cada segundo; sesiones antiguas sin hora. **Datos**: solo
  `diarioEstudio.sesiones` y `diarioEstudio.tema`; id = `Date.now()`.

## Pruebas y documentación

- Chrome DevTools (2026-10-05 y 2026-10-10): consola sin errores; datos de prueba borrados
  al final (solo `diarioEstudio.tema`). Constitución en `docs/constitution.md`.
- Verificación final de la 004 (T8): RF-1…RF-11 recorridas en DevTools con 5 sesiones de
  prueba y objetivo 300; localStorage restaurado. Spec con sus criterios marcados.

## Errores a evitar

- No usar `toISOString()` ni `new Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- En `mostrarSesiones` el `sort` de las filas debe recorrer **`sesionesVisibles`**, no el
  nombre viejo `sesiones` (`ReferenceError` al pintar; corregido en T5 de la spec 004).
- Orden de los `<script>`: `logica-mapa.js` → `logica-objetivo.js` → `logica-busqueda.js`
  → `app.js`; los `logica-*.js` siempre **antes** que `app.js`.
- `renderizar()` no debe reescribir `#buscador` ni el campo del objetivo: se lee el valor,
  nunca se pisa lo que el usuario está escribiendo.
- No duplicar bloques `addEventListener` en `iniciar()`: cada función flecha es nueva y el
  evento se dispara dos veces.
- `repeat(7, 1fr)` no basta con `aspect-ratio: 1`: usar `repeat(7, minmax(0, 1fr))`.
- `esMetaCumplida` es la única fuente de verdad de la meta cumplida. La ventana de Chrome
  no baja de ~500 px: para probar a 375 px usar `emulate(...)` del MCP. Las sesiones
  antiguas no tienen `hora`: `sesion.hora ? sesion.hora : ""`.
