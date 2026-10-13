# Tareas: Edición de sesiones

## Fase 1: HTML y CSS base

- [x] **T1.1**: Modificar `index.html` - añadir botón "Cancelar" oculto en formulario
  - **RF**: RF-2, RF-5
  - **Hecho cuando**: existe `<button type="button" id="btn-cancelar" class="btn-cancelar" hidden>Cancelar</button>` tras el botón de submit.

- [x] **T1.2**: Modificar `index.html` - añadir botón editar en template de historial (se hace en JS, solo estructura)
  - **RF**: RF-1
  - **Hecho cuando**: el renderizado del historial incluye `<button class="btn-editar" data-id="...">✎</button>` en cada `<li>`.

- [x] **T1.3**: Modificar `styles.css` - estilos para botón editar, modo edición, botón cancelar
  - **RF**: RF-1, RF-2, RF-4, RF-5
  - **Hecho cuando**: `.btn-editar` visible en hover, `.formulario.editando` con borde destacado, `.btn-cancelar` visible y estilizado.

## Fase 2: Lógica de edición en app.js

- [x] **T2.1**: Añadir función `validarSesion(datos)` - reutiliza validaciones existentes
  - **RF**: RF-3
  - **Hecho cuando**: devuelve `{valido: true}` o `{valido: false, error: string}` para casos: fecha vacía, tema vacío, minutos ≤ 0.

- [x] **T2.2**: Añadir función `obtenerSesionPorId(sesiones, id)`
  - **RF**: RF-2, RF-4
  - **Hecho cuando**: devuelve la sesión con el ID dado o `undefined`.

- [x] **T2.3**: Añadir función `actualizarSesion(sesiones, id, datosNuevos)`
  - **RF**: RF-4, RF-6
  - **Hecho cuando**: devuelve nuevo array con la sesión actualizada (mismo ID, nueva hora actual, campos nuevos).

- [x] **T2.4**: Modificar `renderizar()` / `mostrarSesiones()` para incluir botón editar en cada `<li>`
  - **RF**: RF-1
  - **Hecho cuando**: cada sesión en el historial muestra botón `✎` con `data-id="..."` y `aria-label="Editar sesión"`.

- [x] **T2.5**: Implementar `manejarClickEditar(id)` - carga datos en formulario, entra en modo edición
  - **RF**: RF-2
  - **Hecho cuando**: click en botón editar → formulario muestra datos de la sesión, botón submit cambia a "Guardar cambios", aparece botón Cancelar, formulario tiene clase `.editando`.

- [x] **T2.6**: Implementar `salirModoEdicion()` - limpia formulario, restaura botones, quita clase `.editando`
  - **RF**: RF-5
  - **Hecho cuando**: formulario vuelve a estado inicial (vacío, "Guardar sesión", sin botón cancelar, sin `.editando`).

- [x] **T2.7**: Modificar `manejarSubmit()` para detectar modo edición y llamar `actualizarSesion()`
  - **RF**: RF-3, RF-4, RF-6
  - **Hecho cuando**: si `form.dataset.editandoId` existe → valida, actualiza sesión, guarda, sale de edición, renderiza.

- [x] **T2.8**: Implementar `manejarCancelar()` - llama `salirModoEdicion()`
  - **RF**: RF-5
  - **Hecho cuando**: click en Cancelar → formulario limpio, modo normal.

- [x] **T2.9**: Añadir event listeners para botones editar (delegación en lista), cancelar, submit
  - **RF**: RF-1, RF-2, RF-5
  - **Hecho cuando**: click en editar → modo edición; click en cancelar → limpio; submit en edición → guarda cambios.

## Fase 3: Tests

- [x] **T3.1**: Crear `test-edit.js` con tests para `validarSesion`, `obtenerSesionPorId`, `actualizarSesion`
  - **RF**: RF-2, RF-3, RF-4
  - **Hecho cuando**: `node --test test-edit.js` pasa 11 tests (validaciones, búsqueda, actualización).

## Fase 4: Verificación

- [x] **T4.1**: Verificar con Chrome DevTools - flujo completo: editar → cambiar datos → guardar → verificar historial y mapa
  - **RF**: RF-1–RF-6
  - **Hecho cuando**: edición funciona end-to-end, historial y mapa se actualizan.

- [x] **T4.2**: Verificar cancelar edición - no modifica la sesión original
  - **RF**: RF-5
  - **Hecho cuando**: click editar → cambiar datos → cancelar → sesión original intacta.

- [x] **T4.3**: Verificar validaciones en modo edición (fecha vacía, tema vacío, minutos ≤ 0)
  - **RF**: RF-3
  - **Hecho cuando**: muestra error y no guarda.

- [x] **T4.4**: Verificar modo claro/oscuro y vista móvil (375px)
  - **RF**: RF-1–RF-7
  - **Hecho cuando**: botones y formulario se ven bien en ambos modos y en móvil.

- [x] **T4.5**: Verificar edición de sesión con fecha futura
  - **RF**: RF-7
  - **Hecho cuando**: cambiar fecha a futura → se guarda y en mapa aparece como "día futuro".