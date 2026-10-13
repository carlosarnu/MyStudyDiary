# Spec 002 — Edición de sesiones

Estado: implementada

## Contexto y objetivo

El Diario de Estudio permite registrar sesiones y verlas en el historial, pero no hay forma de corregir errores o actualizar una sesión ya registrada. El usuario necesita poder editar cualquier campo de una sesión existente (fecha, tema, minutos) para mantener su historial preciso.

## Usuarios

- **Usuario principal**: alguien que registra sus sesiones de estudio y ocasionalmente comete errores al introducir datos (fecha equivocada, tema mal escrito, minutos incorrectos). Quiere corregirlos sin tener que borrar y volver a crear la sesión.

## Historias de usuario

1. Como usuario, quiero ver un botón "Editar" en cada sesión del historial para poder modificarla.
2. Como usuario, quiero poder cambiar la fecha, el tema y los minutos de una sesión existente.
3. Como usuario, quiero que al editar se me muestre el formulario con los datos actuales de la sesión.
4. Como usuario, quiero poder guardar los cambios o cancelar la edición.

## Definiciones

- **Sesión**: Registro individual de estudio con id único, fecha, hora, tema y minutos.
- **Modo edición**: Estado del formulario donde se muestran los datos de una sesión existente para modificarla.
- **ID de sesión**: Identificador único (`Date.now()` al crear) que no cambia al editar.

## Requisitos funcionales

### RF-1: Botón editar en historial
**CUANDO** el usuario visualiza el historial de sesiones, **EL SISTEMA DEBE** mostrar un botón "Editar" en cada sesión listada.

### RF-2: Entrada en modo edición
**CUANDO** el usuario hace click en el botón "Editar" de una sesión, **EL SISTEMA DEBE** poner el formulario en modo edición cargando los datos de esa sesión (fecha, tema, minutos) y cambiar el botón de envío a "Guardar cambios", añadiendo un botón "Cancelar".

### RF-3: Edición de campos
**MIENTRAS** el formulario está en modo edición, **EL SISTEMA DEBE** permitir modificar los tres campos: fecha, tema y minutos, con las mismas validaciones que al crear una sesión nueva.

### RF-4: Guardar cambios
**CUANDO** el usuario hace click en "Guardar cambios" en modo edición, **EL SISTEMA DEBE** actualizar la sesión existente manteniendo su ID original, actualizar la hora de registro a la hora actual, y volver al modo normal del formulario.

### RF-5: Cancelar edición
**CUANDO** el usuario hace click en "Cancelar" en modo edición, **EL SISTEMA DEBE** volver el formulario a su estado normal (vacío, botón "Guardar sesión", sin botón cancelar) sin modificar la sesión.

### RF-6: Actualización de vistas tras edición
**CUANDO** se guarda una sesión editada, **EL SISTEMA DEBE** actualizar inmediatamente el historial, el mapa de calor, las estadísticas (racha, minutos semana, días mes) y el reloj si corresponde.

### RF-7: Edición de sesión con fecha futura
**SI** el usuario cambia la fecha a una futura, **EL SISTEMA DEBE** permitirlo y tratarla según las reglas existentes (aparecerá como "día futuro" en el mapa hasta que llegue la fecha).

## Requisitos no funcionales

- La edición debe ser inmediata (sin recarga de página).
- El formulario en modo edición debe ser visualmente distinguible (ej. borde o fondo diferente).
- Los botones "Guardar cambios" y "Cancelar" deben ser claramente diferentes del botón normal "Guardar sesión".
- Mantener accesibilidad: labels, foco adecuado al entrar en modo edición.

## Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Usuario edita y no cambia nada | Se actualiza solo la hora de registro; se guarda igual |
| Usuario intenta editar con datos inválidos | Validaciones iguales a creación: muestra error, no guarda |
| Usuario cancela edición | Formulario vuelve a estado limpio sin modificar la sesión |
| Edición de sesión antigua (fuera de rango visible) | Funciona igual; al navegar al mes correspondiente se ve el cambio |
| Múltiples ediciones rápidas | Cada una se guarda independientemente |

## Fuera de alcance

- No se incluye historial de cambios (versiones anteriores de la sesión).
- No se incluye deshacer (undo) tras guardar.
- No se permite editar múltiples sesiones a la vez.
- No se permite borrar sesiones (solo editar).

## Criterios de finalización

- [ ] Botón "Editar" visible en cada sesión del historial.
- [ ] Click en "Editar" carga datos en formulario y muestra botones "Guardar cambios" / "Cancelar".
- [ ] Se pueden modificar fecha, tema y minutos.
- [ ] "Guardar cambios" actualiza la sesión manteniendo su ID.
- [ ] "Cancelar" limpia formulario sin modificar la sesión.
- [ ] Historial, mapa y estadísticas se actualizan tras guardar.
- [ ] Funciona en modo claro y oscuro.
- [ ] Se verifica con Chrome DevTools en vista móvil (375 px).

## Dudas abiertas

- (Resueltas: acceso por botón en historial, todos los campos editables, botones Guardar/Cancelar)