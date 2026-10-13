# Spec 004 — Buscador del historial de sesiones

Estado: aprobada

## Contexto y objetivo

El historial (`#sesiones`) lista todas las sesiones registradas, de más reciente a más
antigua. A medida que pasa el tiempo la lista crece y localizar una sesión concreta
obliga a desplazarse leyendo una a una: el usuario no puede ir directamente al dato que
le interesa.

El usuario quiere **buscar una sesión en el historial sin tener que mirarlas todas**,
escribiendo un texto y viendo solo las sesiones que coinciden.

El buscador es una mejora de consulta sobre la lista existente: no cambia lo que se
guarda ni cómo se calculan las estadísticas.

## Usuarios

- **Usuario principal**: alguien que registra su estudio a diario y, con el tiempo,
  muchas sesiones; quiere recuperar rápido una sesión concreta (un tema, una fecha) sin
  recorrer todo el historial.

## Historias de usuario

1. Como usuario, quiero escribir un texto en el historial para ver solo las sesiones que coinciden.
2. Como usuario, quiero que el filtrado sea inmediato mientras escribo, sin botones ni recargas.
3. Como usuario, quiero vaciar el buscador y volver a ver todas las sesiones.
4. Como usuario, quiero un aviso claro cuando ninguna sesión coincida, para saber que no es un fallo.
5. Como usuario, quiero que al buscar no se alteren mis rachas, mis totales ni mi mapa, que siguen hablando de todo mi estudio.
6. Como usuario, quiero seguir pudiendo editar una sesión que he encontrado con el buscador.
7. Como usuario, quiero encontrar una sesión escribiendo su fecha de varias formas cómodas («2026-10», «octubre»).

## Definiciones

- **Buscador**: control de texto, situado dentro de la sección del historial, que reduce
  la lista visible a las sesiones que coinciden con lo escrito.
- **Texto de búsqueda**: contenido introducido por el usuario en el buscador. Vacío =
  sin filtro. Solo vive en pantalla: no se guarda en `localStorage`.
- **Lista visible**: subconjunto de sesiones que se muestra en el historial con el filtro
  activo. Es una vista de la lista completa; la lista completa no cambia.
- **Estadísticas**: racha actual, mejor racha, total semanal, días del mes, mapa de calor
  y objetivo semanal. Se calculan **siempre** con todas las sesiones.
- **Texto normalizado**: texto con los espacios de los extremos quitados, en minúsculas y
  sin tildes ni demás signos diacríticos (definición exacta en RF-4).
- **Coincidencia**: el texto de búsqueda, una vez normalizado, aparece **contenido** en el
  tema normalizado de la sesión o en la fecha guardada `AAAA-MM-DD`; para el nombre del mes
  se exige además que sea **prefijo** de ese nombre normalizado (regla única en RF-3;
  comparación de mayúsculas y tildes en RF-4).

## Requisitos funcionales

### RF-1: Acceso al buscador en el historial
**CUANDO** el usuario visualice la sección del historial, **EL SISTEMA DEBE** ofrecerle
un campo de búsqueda dentro de la propia sección del historial
(`<section class="sesiones">`), entre el `<h2>Historial</h2>` y la lista
(`<ul id="lista-sesiones">`), de forma que esté a la vista antes de recorrer la lista.

- Ubicación exacta: **dentro de `<section class="sesiones">`, justo después del `<h2>`
  y antes de la lista**; no se crea ninguna tarjeta ni sección nueva.
- El buscador vive en la zona del historial: **fuera del formulario de sesión
  (`#form-sesion`)** y **fuera de la tarjeta de objetivo**, sin compartir estado con
  ninguno de los dos.
- No modifica ni el botón "Guardar sesión" ni el botón "Guardar cambios"/"Cancelar" ni
  el modo edición de la spec 002, ni el comportamiento de la tarjeta de la spec 003.
- **El campo empieza vacío en cada apertura**: el texto de búsqueda no se guarda ni se
  conserva al recargar la página; cada apertura muestra el historial completo. No hay
  historial de búsquedas anteriores.

### RF-2: Filtrado inmediato
**MIENTRAS** el usuario escriba o borre texto en el buscador, **EL SISTEMA DEBE**
actualizar la lista visible sin recargar la página y sin necesidad de pulsar un botón de
buscar, manteniendo el mismo criterio de ordenación que el historial completo (de más
reciente a más antigua).

- **Repintado con filtro activo**: la función que repinta la vista (`renderizar()`) debe
  pintar la lista visible **aplicando el texto actual del campo**, y **no debe reescribir
  el campo** (el texto que está escribiendo el usuario se conserva tal cual). Así, tras
  crear o editar una sesión con el buscador escrito, la lista se repinta ya filtrada.
- Al escribir se repinta **solo la lista del historial y su mensaje**: el mapa de calor,
  las rachas, los totales y el objetivo no se vuelven a calcular ni a repintar por cada
  tecla.
- Pulsar Intro en el campo **no envía nada ni recarga la página**: si el campo va dentro
  de un `<form>`, el envío se cancela (`preventDefault()`).

### RF-3: Contenido que se busca (tema y fecha)
**CUANDO** haya texto en el buscador, **EL SISTEMA DEBE** incluir en la lista visible las
sesiones cuyo **tema** o cuya **fecha** coincidan con ese texto.

- **Temas buscables**: el campo `tema` de la sesión.
- **Fechas buscables**: el campo `fecha` de la sesión participa en **dos formas**:
  1. **Tal cual está guardada**, `AAAA-MM-DD` (p. ej. `2026-10-05`), permitiendo
     coincidencias **parciales por substring**: `2026`, `2026-10`, `10-05`, `05`
     encuentran esa sesión.
  2. **El nombre del mes en español** de esa fecha, en minúsculas. **Regla única de mes:
     el texto debe ser prefijo del nombre del mes normalizado** (no cualquier contenido):
     `octubre` y `oct` **sí** encuentran una sesión del 5 de octubre, pero `tob` (prefijo
     erróneo) y `ubre` (contenido que no empieza el nombre) **no** la encuentran.
- **Fecha no válida**: si el campo `fecha` de una sesión no es una fecha `AAAA-MM-DD`
  válida (vacía, `"abc"` o ausente), esa sesión **no participa en la búsqueda por fecha**
  (ni por substring ni por mes) y **no debe provocar ningún error** al filtrar; solo
  podrá coincidir por su tema.
- **No se busca lo que se ve en la fila**: ni la fecha ya formateada que muestra la lista
  (`viernes, 5 de octubre`, `formatearFecha()`), ni el nombre del día de la semana
  (`viernes`). Solo son buscables el campo `fecha` guardado (`AAAA-MM-DD`), sus
  subcadenas y el nombre del mes (forma 2).
- **No se interpretan otros formatos de fecha**: escribir `05/10/2026`, `5-10-2026` o
  `5 de octubre` **no** coincide con ninguna sesión; se busca el texto literal.
- **No participan** los campos `minutos`, `hora` ni `id`.
- La sesión solo aparece si el texto escrito **completo** (tras quitar espacios sobrantes)
  está contenido en el tema o en la fecha (o es prefijo del mes, forma 2): no hace falta
  que coincida una palabra entera ni que esté al principio del campo de tema.
- La regla común de comparación (mayúsculas y tildes) está en RF-4.
- El nombre del mes se deduce de la fecha guardada **sin interpretarla en UTC**, para no
  desplazar el día (regla de fechas del proyecto).

### RF-4: Coincidencia cómoda de escribir
**CUANDO** el usuario compare texto con los datos de las sesiones, **EL SISTEMA DEBE**
normalizar ambos lados —el texto de búsqueda y los campos de la sesión— de la misma
manera antes de comparar:

1. quitar los espacios del principio y del final;
2. pasar todo a minúsculas;
3. quitar las tildes y demás signos diacríticos (`á, é, í, ó, ú, ü, ñ` → `a, e, i, o, u, u, n`
   — para `ñ` se normaliza a `n`, igual que hace el resto de buscadores sencillos).

- Así `ingles` encuentra `Inglés`, `HISTORIA` encuentra `Historia`, `maticas` encuentra
  `Matemáticas` (está contenido en el tema normalizado `matematicas`) y ` Historia `
  encuentra `Historia`. **Ejemplos negativos**: `mateamaticas` **no** encuentra
  `Matemáticas` (la consulta, más larga que el campo, no puede estar contenida en él) y
  `tob` no encuentra `octubre` (regla de mes por prefijo, RF-3).
- Los guiones de las fechas **no** se quitan: `2026-10` exige los dos guiones.
- La normalización se aplica también al nombre del mes en español (RF-3).

### RF-5: Texto vacío = ver todo
**SI** el campo de búsqueda está vacío (o contiene solo espacios), **EL SISTEMA DEBE**
mostrar la lista completa del historial, igual que si el buscador no existiera.

### RF-6: Ninguna coincidencia
**SI** el usuario tiene texto en el buscador, **hay al menos una sesión guardada** y
ninguna de ellas coincide, **EL SISTEMA DEBE** mostrar el mensaje propio de la aplicación,
**en español**, con este texto exacto:

> `No se encontraron sesiones que coincidan con la búsqueda.`

- El mensaje es **distinto** del aviso de historial vacío (`Aún no hay sesiones registradas.`)
  y en este caso **no** debe mostrarse dicho aviso de historial vacío, porque sí hay
  sesiones guardadas: el usuario ve un filtro activo, no una lista vacía de origen.
- **Si no hay ninguna sesión guardada** (historial vacío), el aviso que se muestra es el
  de historial vacío (`Aún no hay sesiones registradas.`), **aunque haya texto en el
  buscador**: no hay datos que filtrar, así que no procede el mensaje de "sin resultados".
- Con al menos una coincidencia no se muestra ninguno de los dos mensajes.

### RF-7: Limpiar la búsqueda
**EL SISTEMA DEBE** permitir vaciar el buscador de una sola acción (además de borrando el
texto a mano), recuperando la lista completa.

### RF-8: El buscador solo filtra la lista visible
**MIENTRAS** haya un filtro activo, **EL SISTEMA DEBE** calcular la racha actual, la mejor
racha, el total semanal, los días del mes, el mapa de calor y el progreso del objetivo
con **todas** las sesiones guardadas: **ninguna estadística cambia** por buscar.

- Salvaguarda: la aplicación no muestra hoy ningún contador de "X sesiones" como resumen
  del historial completo; si en el futuro se añadiera, tampoco debería verse afectado
  por el filtro.

### RF-9: Convivencia con el modo edición (spec 002)
**CUANDO** haya una sesión en edición y el usuario escriba en el buscador, **EL SISTEMA
DEBE** conservar el modo edición del formulario (sigue en "Guardar cambios" con su botón
"Cancelar"), aunque la sesión editada salga de la lista visible.

- Si la sesión editada no coincide con el filtro, no se muestra en la lista, pero el
  formulario sigue editándola; al guardar o cancelar, la vista se repinta con el filtro
  activo.
- Los botones de editar solo aparecen en las sesiones visibles; acceder a una sesión que
  no está visible requiere antes vaciar o ajustar el filtro.
- Nunca se debe perder ni duplicar la sesión que se estaba editando por culpa del filtro.

### RF-10: La lógica de la búsqueda es pura, autocontenida y testeable
**SEGÚN** el principio 3 de la constitución, determinar qué sesiones coinciden con el
texto de búsqueda **DEBE** ser una operación de datos sin DOM ni almacenamiento, que
reciba las sesiones y el texto y devuelva las que coinciden; la interfaz solo pinta el
resultado.

- La lógica vive en el archivo nuevo **`logica-busqueda.js`** (patrón IIFE →
  `globalThis`, igual que `logica-mapa.js`) con sus tests en el archivo nuevo
  **`test-busqueda.js`** (patrón `readFileSync` + `eval`, igual que `test-mapa.js`).
  **Ambos archivos están creados y autorizados por el usuario.**
- Funciones expuestas: **`normalizarTexto(texto)`** (RF-4) y
  **`filtrarSesiones(sesiones, texto)`** (RF-3): devuelve las sesiones que coinciden,
  **en el mismo orden** en que entraron.
- **Archivo autocontenido**: `logica-busqueda.js` define su propia `normalizarTexto`
  dentro de su IIFE y no llama a `logica-mapa.js` ni a `logica-objetivo.js`, porque cada
  test evalúa un archivo de lógica por separado. No hay duplicidad porque **ningún otro
  archivo de lógica pura define hoy normalización de texto**; si en el futuro otra parte
  lo necesita, se refactorizará entonces.
- Los tests se ejecutan con `node --test` junto a los existentes (80 en verde) y cubren,
  como mínimo:
  - normalización (mayúsculas, tildes, espacios sobrantes);
  - filtrado por tema;
  - filtrado por fecha en todas las formas de RF-3: `AAAA-MM-DD` completo, subcadenas
    (`2026`, `2026-10`, `10-05`, `05`) y **nombre del mes** (`octubre`), incluyendo un
    caso de **prefijo negativo** (`tob` no encuentra una sesión de octubre);
  - **consultas de 1 carácter** (`o` encuentra las sesiones de octubre; `a` encuentra
    abril y agosto, `e` enero; la regla de prefijo del mes se aplica igual);
  - **sesión con `fecha` inválida** (`"abc"` o `undefined`): no lanza excepción y esa
    sesión simplemente no coincide por fecha (puede coincidir por tema); lo mismo con
    `tema` vacío o ausente;
  - texto vacío, sin coincidencias y orden de salida.

### RF-11: Accesibilidad y uso en móvil
**CUANDO** el usuario interactúe con el buscador, **EL SISTEMA DEBE**:

- asociarle una etiqueta visible o accesible con el texto en español (p. ej. "Buscar en
  el historial");
- permitir llegar a él y usarlo con el teclado y mostrar el foco de forma visible;
- hacer percibible de forma accesible que el filtro está activo y si hay resultados o
  no: la **región `aria-live` solo anuncia el mensaje de RF-6 cuando hay 0 resultados**;
  cuando **sí** hay resultados la región queda vacía (no se anuncia nada). **No se muestran
  cifras ni textos tipo "3 sesiones encontradas"**, ni contador "X de Y", que el usuario
  ha descartado;
- mantenerlo usable en pantalla de móvil (375 px), sin desplazamiento horizontal ni
  solaparse con la lista.

## Requisitos no funcionales

- Textos de interfaz y mensajes en español (RF-6 y la etiqueta de RF-11).
- Funciona abriendo `index.html` con doble clic (`file://`): sin recargas, sin módulos,
  sin peticiones de red.
- Sin dependencias nuevas: HTML, CSS y JS puros.
- La lógica de filtrado no se mezcla con el DOM ni con `localStorage` (RF-10).
- Únicos archivos nuevos autorizados: `logica-busqueda.js` y `test-busqueda.js`; no se
  crean más archivos.
- La lista visible debe leerse bien en modo claro y modo oscuro, con el mismo patrón
  visual del resto de tarjetas y campos.
- El filtro es una vista: **no escribe en `localStorage`** (ni siquiera el texto
  buscado) y no altera las sesiones guardadas ni su formato
  (`{ id, fecha, hora, tema, minutos }`).
- La lista completa debe seguir siendo legible y operar con normalidad en móvil (375 px)
  con el buscador presente.

## Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Campo de búsqueda vacío o solo espacios | Se muestra la lista completa (RF-5) |
| Texto que no coincide con ninguna sesión (pero sí hay sesiones guardadas) | Mensaje propio con el texto exacto `No se encontraron sesiones que coincidan con la búsqueda.`; no se muestra el aviso de historial vacío (RF-6) |
| Historial sin sesiones y texto en el buscador | Gana el aviso de historial vacío: se muestra `Aún no hay sesiones registradas.`, no el de "sin resultados", porque no hay sesiones guardadas que filtrar (RF-6); sin errores en consola |
| Sesión con tema vacío o ausente o con `fecha` inválida (`"abc"`, `undefined`) | No provoca excepciones al filtrar: sin tema solo puede coincidir por fecha; con fecha inválida no coincide por fecha; `hora` no se busca |
| Mayúsculas/minúsculas (`Historia` / `historia`, `HISTORIA` / `Historia`) | Coinciden (RF-4) |
| Tildes (`ingles` / `Inglés`, `maticas` / `Matemáticas`) | Coinciden: `maticas` está contenido en `matematicas` (RF-4) |
| Texto más largo que el campo (`mateamaticas` / `Matemáticas`) | **No** coincide: la consulta completa no está contenida en el tema (RF-4) |
| Espacios al inicio o final del texto (`  Historia `) | Se ignoran: coincide igual (RF-4) |
| Fecha buscada como `2026-10` o `10-05` | Coincide con la sesión `2026-10-05` (substring, RF-3) |
| Fecha buscada como `octubre` o `oct` | Coincide con toda sesión de octubre: `oct` es prefijo válido del nombre del mes (RF-3) |
| Fecha buscada como `tob` o `ubre` | **No** coincide con ninguna sesión de octubre: el mes solo se busca por **prefijo** del nombre, no por cualquier contenido (RF-3) |
| Fecha buscada en otro formato (`05/10/2026`, `5 de octubre`) | No coincide con ninguna sesión: solo se admite `AAAA-MM-DD` y nombre del mes (RF-3) |
| Fecha formateada que se ve en la fila (`viernes, 5 de octubre`) o el día de la semana (`viernes`) | No son buscables: solo el campo `fecha` guardado, sus subcadenas y el nombre del mes (RF-3) |
| Consulta corta como `10` o `05` | Coincide con cualquier fecha que contenga esa tira (año, mes o día): comportamiento de substring, sin ambigüedad que resolver |
| Consulta de 1 carácter (`o`, `a`, `e`, `i`) | Por el nombre del mes, coincide solo con los meses que **empiezan** por esa letra: `o` → octubre, `a` → abril y agosto, `e` → enero; `i` no empieza ningún mes, así que esa consulta solo podría coincidir por el tema de una sesión (RF-3) |
| Sesión del `2026-01-01` buscada como `enero` | Coincide: el mes se deduce sin interpretar la fecha en UTC (RF-3) |
| Filtro activo al crear una sesión nueva | Tras guardar, `renderizar()` repinta la lista visible aplicando el texto del campo, sin reescribirlo: la sesión nueva solo aparece si coincide (RF-2) |
| Filtro activo mientras se edita una sesión (spec 002) | El modo edición se conserva aunque la sesión salga de la lista visible (RF-9) |
| Guardar o cancelar una edición con filtro activo | La vista se repinta respetando el filtro; no se pierde ni duplica la sesión |
| Editar una sesión para que deje de coincidir con el filtro | Al guardar, la sesión desaparece de la lista visible y el modo edición sale limpio ("Guardar sesión" de nuevo); las estadísticas siguen contándola |
| Filtro activo con estadísticas visibles | Racha, mejor racha, total semanal, días del mes, mapa y objetivo **no cambian** (RF-8) |
| Cambio de semana con el buscador escrito | El total semanal se recalcula con todas las sesiones; el texto de búsqueda se mantiene |
| Recargar la página con texto escrito | El campo aparece vacío y se ve el historial completo: el texto no persiste (RF-1) |
| Pulsar Intro en el buscador | No hace nada especial: no hay envío de formulario ni recarga de página (si el campo va en un `<form>`, se cancela el envío con `preventDefault()`) (RF-2) |
| Uso en móvil a 375 px | El campo, los resultados y los mensajes caben sin scroll horizontal |
| Se espera un contador "3 de 40" o un texto "3 sesiones encontradas" | No existen: con resultados la región `aria-live` queda vacía; solo se filtra la lista y con 0 resultados se anuncia el mensaje de RF-6 (RF-11) |

## Fuera de alcance

- No se guardan búsquedas anteriores ni hay historial de consultas; el texto no se
  conserva al recargar (RF-1).
- No hay contador de resultados ("X de Y"): solo se filtra la lista (RF-11).
- No hay autocompletado, sugerencias ni búsqueda por voz.
- No se resaltan ni marcan las coincidencias dentro del texto de las sesiones.
- No se busca por minutos, hora ni id (RF-3).
- No se interpreta la fecha en formatos distintos de `AAAA-MM-DD` y nombre del mes.
- No se exporta ni se comparte el historial filtrado.
- No se filtran ni se buscan las estadísticas, el mapa de calor ni el objetivo: siempre
  usan todos los datos (RF-8).
- No se añade ordenación ni paginación nuevas al historial.
- No cambia el formato de los datos guardados en `localStorage`.

## Criterios de finalización

- [x] (RF-1) El buscador está dentro de `<section class="sesiones">`, entre el `<h2>` y
      la lista, fuera de `#form-sesion` y de la tarjeta de objetivo; "Guardar sesión",
      "Guardar cambios"/"Cancelar" y la tarjeta de objetivo funcionan igual que antes; al
      recargar con texto escrito el campo aparece vacío.
- [x] (RF-2) Al escribir y borrar, la lista visible cambia al instante y conserva el orden
      del historial, sin recargar y sin repintar mapa ni estadísticas. Con texto en el
      campo, `renderizar()` repinta la lista aplicando ese filtro sin reescribir el campo:
      al crear una sesión nueva o al guardar/cancelar una edición, la vista vuelve filtrada
      y el campo conserva lo escrito. Pulsar Intro no recarga la página.
- [x] (RF-3) El tema se busca por substring; la fecha coincide como `2026-10-05`
      (parcial `2026-10`, `10-05`, `05`) y el mes **por prefijo** (`octubre` y `oct` sí,
      `tob` y `ubre` no); `05/10/2026` no encuentra nada; la fecha formateada de la fila
      (`viernes, 5 de octubre`) y el día de la semana no son buscables; `minutos`/`hora`
      no se buscan; una `fecha` inválida no lanza excepción.
- [x] (RF-4) `ingles` encuentra `Inglés`, `maticas` encuentra `Matemáticas`,
      `HISTORIA` encuentra `Historia`, ` Historia ` encuentra `Historia` y
      `mateamaticas` **no** encuentra `Matemáticas`.
- [x] (RF-5) Con el campo vacío se ve la lista completa, idéntica a la actual.
- [x] (RF-6) Con texto, al menos una sesión guardada y 0 coincidencias aparece
      `No se encontraron sesiones que coincidan con la búsqueda.` y no aparece
      `Aún no hay sesiones registradas.`; con el historial ya vacío (y texto en el campo)
      aparece exactamente `Aún no hay sesiones registradas.` y no el de "sin resultados".
- [x] (RF-7) Un botón/acción vacía el buscador y restaura la lista completa.
- [x] (RF-8) Con filtro activo, racha, mejor racha, total semanal, días del mes, mapa y
      objetivo muestran exactamente los mismos valores que sin filtro.
- [x] (RF-9) Con una sesión en edición, escribir en el buscador no sale del modo edición
      ni pierde la sesión; guardar/cancelar repinta con el filtro activo.
- [x] (RF-10) `logica-busqueda.js` expone `normalizarTexto` y `filtrarSesiones` sin DOM
      ni `localStorage`; `node --test` ejecuta `test-busqueda.js` y todos los tests
      (los 80 existentes más los nuevos) pasan en verde, cubriendo lo mínimo exigido:
      `fecha` inválida/ausente y `tema` vacío sin excepción, consulta de 1 carácter,
      mes por nombre con prefijo negativo (`tob`) y los casos de RF-3/RF-4.
- [x] (RF-11) El campo tiene etiqueta en español, foco visible, se usa con teclado, el
      estado del filtro se anuncia sin depender solo del color; con resultados la región
      `aria-live` queda vacía y **no** aparece ningún contador "X de Y" ni cifras tipo
      "3 sesiones encontradas"; con 0 resultados se anuncia el mensaje de RF-6.
- [x] Documentación: `AGENTS.md` refleja el buscador y la lista de **4** archivos de test
      (`test-mapa`, `test-edit`, `test-objetivo`, `test-busqueda`); `MEMORY.md` se
      actualiza con las decisiones nuevas (principio 2 de la constitución).
- [x] Verificación con Chrome DevTools: sin errores en consola, en modo claro y oscuro y
      en vista móvil (375 px) sin scroll horizontal.

## Decisiones cerradas con el usuario

Las 5 preguntas iniciales de esta spec quedan respondidas y cerradas:

1. **Campos buscables**: **tema y fecha** (no minutos, no hora). La fecha se busca como
   `AAAA-MM-DD` —también en parte, p. ej. `2026-10` o `05`— y el mes **por prefijo** del
   nombre en español (`octubre` y `oct` sí; `tob`, no). (RF-3)
2. **Coincidencia**: **ignora mayúsculas y tildes** —`MATE` encuentra `Mate`,
   `maticas` encuentra `Matemáticas`, y `mateamaticas` no la encuentra porque es más
   largo que el campo— más espacios sobrantes. (RF-4)
3. **Persistencia del texto**: **no se conserva**; cada apertura muestra todo el
   historial con el campo vacío. (RF-1)
4. **Contador de resultados**: **no**; solo se filtra la lista, sin indicador "X de Y".
   (RF-11)
5. **Lógica pura**: archivos **nuevos ya autorizados** `logica-busqueda.js`
   (IIFE → `globalThis`, patrón de `logica-mapa.js`) y `test-busqueda.js` (patrón de
   `test-mapa.js`), con `normalizarTexto(texto)` y `filtrarSesiones(sesiones, texto)`.
   Autocontenido: define su propia normalización sin depender de otros archivos de
   lógica. (RF-10)
