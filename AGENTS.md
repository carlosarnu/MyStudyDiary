# AGENTS.md — Diario de Estudio

Web estática para registrar sesiones de estudio y motivarse viendo la racha de días
seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a
programar.

## Stack y estructura

- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- La lógica pura (probable con `node --test`) vive aparte, sin DOM ni localStorage:
  `logica-mapa.js`, `logica-objetivo.js`, `logica-busqueda.js`. El orden de los `<script>`
  importa: se cargan **antes** que `app.js`, que usa sus funciones globales
  (`logica-mapa.js` → `logica-objetivo.js` → `logica-busqueda.js` → `app.js`).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
  (`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.

## Convenciones

- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.

## Datos

- localStorage, clave `diarioEstudio.sesiones`: array de `{ id, fecha, hora, tema, minutos }`.
- `fecha` se guarda como string `"YYYY-MM-DD"` en hora local.
- `hora` se guarda como string `"HH:MM"` (24h, hora local). Las sesiones antiguas pueden no tener este campo.
- `id` es `Date.now()` — suficiente para esta versión.
- Preferencia de tema: clave `diarioEstudio.tema` con valor `"claro"` u `"oscuro"`.
- Objetivo semanal: clave `diarioEstudio.objetivo` con los minutos como número entero
  guardado como **string plano** (`"300"`, no JSON). Si la clave no existe o el valor no
  es un entero entre 1 y 10080, se trata como "sin objetivo": se ignora y la app sigue
  funcionando con normalidad.

## Fechas y racha (fácil equivocarse)

- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni
  `new Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- **Racha actual** = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy
  no hay sesión pero ayer sí, la racha sigue viva y se cuenta desde ayer.
- **Mejor racha** = secuencia cerrada más larga de días consecutivos con al menos una
  sesión. Excluye la racha viva (la que termina hoy o ayer). Las fechas futuras cuentan
  si son consecutivas entre sí.
- Varias sesiones el mismo día cuentan como un solo día.

## Forma de trabajar

- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria

- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
  tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
  porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
  dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Comandos
- Tests: `node --test` (ejecuta `test-mapa.js`, `test-edit.js`, `test-objetivo.js` y
  `test-busqueda.js`). Deben estar en verde antes de dar por hecha cualquier tarea.

## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.

## Límites

- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.

## Modo oscuro

- Se implementa con `[data-tema="oscuro"]` en `<html>` que sobrescribe las variables CSS.
- Botón toggle en el header (icono ☀️/🌙). Persiste en localStorage.
- Primera visita: respeta `prefers-color-scheme` del sistema.

## Hora

- Reloj en vivo en el header, formato 24h `HH:MM:SS`, actualizado cada segundo con `setInterval`.
- Cada sesión muestra su hora de registro (`HH:MM`) en el historial.
- Las sesiones registradas antes de esta versión no tienen hora (campo vacío).

## Total semanal

- Suma los minutos de las sesiones cuya fecha cae en la semana en curso (de lunes a
  domingo). **El tope es el domingo, no hoy: las sesiones con fecha futura dentro de la
  semana en curso SÍ cuentan.** Solo quedan fuera las sesiones de otras semanas.
- Semana = lunes a domingo (estándar en España).
- Cálculo en hora local.
- Se muestra siempre (aunque sea 0) en el formulario de sesión, encima del botón.
- Formato con objetivo: `"Esta semana: X/Y min"` (X = acumulado, Y = objetivo).
- Formato sin objetivo: `"Esta semana: X min"`.

## Objetivo semanal

- Sirve para fijar cuántos minutos se quieren estudiar cada semana y ver el progreso
  respecto a esa meta. No está ligado a una semana concreta: se mantiene hasta que el
  usuario lo cambie o lo elimine.
- Clave `diarioEstudio.objetivo` (ver "Datos"). Se relee en cada pintado; el campo se
  rellena solo al iniciar y tras guardar/eliminar (`reflejarObjetivoEnCampo`), nunca en
  `renderizar()`, para no pisar lo que se esté escribiendo.
- Validación: debe ser un número entero entre 1 y 10080. Si no lo es, se muestra el
  texto exacto `Introduce un número entero entre 1 y 10080 minutos.` y el objetivo
  anterior no se modifica.
- Dejar el campo vacío y guardar **no es un error**: elimina el objetivo y la app vuelve
  al estado "sin objetivo" (se muestra `#objetivo-vacio` invitando a fijarlo).
- Progreso: `#minutos-semana` lleva el formato `X/Y` y, debajo, `#progreso-detalle`
  indica lo que falta o lo que se ha superado. Al alcanzar o superar la meta se añade la
  clase `.cumplida` (color `--color-exito`) y el texto "Meta cumplida 🎉"; si se baja por
  debajo, desaparece.
- Vive en su propia tarjeta `<section class="objetivo">` con `#form-objetivo`, **fuera de
  `#form-sesion`**: no comparte estado con el formulario de sesión y no afecta a su botón
  "Guardar sesión"/"Guardar cambios" ni al modo edición de la spec 002.
- El cambio de semana se detecta en el tick del reloj (1 s) y repinta con `renderizar()`.

## Días del mes

- Cuenta los días únicos con al menos una sesión en el mes actual.
- Cálculo en hora local.
- Las fechas futuras dentro del mes sí cuentan.
- Se muestra siempre (aunque sea 0) en el formulario, encima del botón.
- Formato: `"X días este mes"`.

## Buscador del historial

- Filtra la lista visible del historial mientras el usuario escribe, sin botón de buscar
  ni recargas. Vive en `<form id="form-busqueda" role="search">` (con `#buscador` y el
  botón `#btn-limpiar`) **dentro de `<section class="sesiones">`, entre el `<h2>` y la
  lista** `#lista-sesiones`; está **fuera de `#form-sesion`** y de la tarjeta de objetivo,
  con la que no comparte estado.
- Busca solo el **tema** (por subcadena) y la **fecha**: como string `AAAA-MM-DD` o
  subcadena de él (`2026`, `2026-10`, `10-05`, `05`), y el **nombre del mes en español
  por prefijo** (`octubre` y `oct` sí; `tob` y `ubre` no). No se buscan minutos, hora ni
  `id`, ni la fecha formateada de la fila (`viernes, 5 de octubre`) ni el día de la
  semana. Una `fecha` inválida (vacía, `"abc"`, ausente) no participa en la búsqueda por
  fecha y no lanza excepciones: solo puede coincidir por su tema.
- Normalización a ambos lados (`normalizarTexto`): quita espacios de los extremos, pasa a
  minúsculas y elimina tildes y demás diacríticos (ñ → n). Los guiones **no** se tocan:
  `2026-10` exige los dos.
- El texto **no se persiste** (no hay clave en localStorage): el campo arranca vacío en
  cada apertura y recarga. No hay historial de búsquedas ni autocompletado.
- Al escribir se repinta **solo la lista y su mensaje** con `renderizarHistorial()`:
  mapa, rachas, totales y objetivo no se recalculan (siguen contando **todas** las
  sesiones). `renderizar()` llama a `pintarHistorial(sesiones)`, que **lee** `#buscador`
  y nunca lo reescribe: tras crear o editar una sesión la vista se repinta filtrada y el
  campo conserva lo escrito.
- Sin contador de resultados ("X de Y" descartado por el usuario). Con resultados la
  región `#aviso-busqueda` (`role="status"`, `aria-live="polite"`) queda vacía; con 0
  coincidencias y sesiones guardadas muestra el texto exacto
  `No se encontraron sesiones que coincidan con la búsqueda.`; si el historial está
  vacío (aunque haya texto) gana `Aún no hay sesiones registradas.`
- Pulsar Intro no recarga: el `submit` de `#form-busqueda` se cancela con
  `preventDefault()`. "Limpiar búsqueda" vacía el campo, repinta y devuelve el foco.
- La lógica pura está en `logica-busqueda.js`: `normalizarTexto(texto)` y
  `filtrarSesiones(sesiones, texto)` (devuelve las coincidencias en el orden de entrada;
  el orden del historial lo aplica la interfaz). Tests en `test-busqueda.js`.

## Verificación

- Tests automáticos: `node --test` cubre la lógica pura en **4 archivos**: `test-mapa.js`
  (mapa de calor), `test-edit.js` (edición de sesiones), `test-objetivo.js` (objetivo
  semanal) y `test-busqueda.js` (buscador del historial). Deben pasar en verde.
- Verificación visual: después de cada cambio, verifica con el MCP de Chrome
  DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la
  vista móvil.
- Para empezar de cero: DevTools → Application → Local Storage → borrar las claves
  `diarioEstudio.sesiones`, `diarioEstudio.tema` y `diarioEstudio.objetivo`.
