# Spec: Mapa de calor de estudio

## Contexto y objetivo

El Diario de Estudio ya muestra la racha actual, la mejor racha, minutos esta semana y días este mes. Sin embargo, el usuario no puede ver de un vistazo su patrón de estudio a lo largo de las semanas.

El mapa de calor tipo GitHub permite visualizar de forma rápida qué días se estudió y cuáles no, creando un registro visual del hábito. El objetivo es motivar al usuario mostrando su constancia.

## Usuarios

- **Usuario principal**: alguien que empieza a programar y registra sus sesiones de estudio. Quiere ver su progreso sin esfuerzo, de un vistazo.

## Historias de usuario

1. Como usuario, quiero ver un mapa de calor organizado por meses para saber qué días estudié.
2. Como usuario, quiero navegar entre meses (anterior/siguiente) para ver mi historial completo.
3. Como usuario, quiero configurar cuántos meses se muestran a la vez.
4. Como usuario, quiero pasar el cursor sobre un día para ver cuántos minutos estudié y qué tema.
5. Como usuario, quiero distinguir visualmente los días futuros para no confundirlos con días sin estudio.

## Definiciones

- **Mes visible**: Cada mes se muestra como una cuadrícula de semanas (filas) × días de la semana (columnas L-D).
- **Rango de navegación**: El usuario puede moverse mes a mes hacia adelante y atrás sin límite.
- **Meses configurables**: Número de meses visibles simultáneamente (por defecto 3, configurable 1-12).

## Requisitos funcionales

### RF-1: Visualización del mapa de calor por meses
**CUANDO** el usuario abre la aplicación, **EL SISTEMA DEBE** mostrar un mapa de calor organizado por meses, comenzando por el mes actual. Cada mes se muestra como una cuadrícula de semanas (filas) y días de la semana (columnas L, M, X, J, V, S, D). Cada celda muestra el número del día del mes.

### RF-2: Número de meses configurables
**EL SISTEMA DEBE** permitir al usuario configurar cuántos meses se muestran simultáneamente (valor por defecto: 3, rango: 1-12). El cambio debe aplicarse inmediatamente sin recargar la página.

### RF-3: Navegación entre meses
**EL SISTEMA DEBE** proporcionar controles para navegar al mes anterior y al mes siguiente. Al navegar, el rango de meses visibles se desplaza manteniendo la cantidad configurada.

### RF-4: Color de días estudiados
**SI** un día tiene al menos una sesión registrada con minutos > 0 y tema no vacío, y **NO** es un día futuro, **ENTONCES EL SISTEMA DEBE** mostrarlo con el color de "estudiado".

### RF-5: Color de días sin estudio
**SI** un día no tiene ninguna sesión registrada válida y **NO** es un día futuro, **ENTONCES EL SISTEMA DEBE** mostrarlo con el color de "sin estudio".

### RF-6: Color de días futuros
**SI** un día está dentro de los meses mostrados pero su fecha es posterior a hoy, **ENTONCES EL SISTEMA DEBE** mostrarlo con un color diferenciado (distinto de "estudiado" y "sin estudio"). Este requisito tiene prioridad sobre RF-4.

### RF-7: Tooltip con detalle
**CUANDO** el usuario pasa el cursor (o toca) un día estudiado, **EL SISTEMA DEBE** mostrar un tooltip con el formato `"X min · Tema"`, donde X es la suma de minutos de todas las sesiones de ese día y Tema es el de la primera sesión por hora registrada ese día.

### RF-8: Tooltip en días sin estudio
**CUANDO** el usuario pasa el cursor (o toca) un día sin estudio, **EL SISTEMA DEBE** mostrar un tooltip con el texto `"No estudiaste este día"`.

### RF-9: Tooltip en días futuros
**CUANDO** el usuario pasa el cursor (o toca) un día futuro, **EL SISTEMA DEBE** mostrar un tooltip con el texto `"Aún no llega este día"`. Este requisito tiene prioridad sobre RF-7.

### RF-10: Actualización dinámica
**CUANDO** el usuario registra una nueva sesión, **EL SISTEMA DEBE** actualizar el mapa de calor para reflejar el cambio inmediatamente.

### RF-11: Sesiones fuera del rango visible
**SI** una sesión tiene una fecha fuera de los meses actualmente visibles, **ENTONCES EL SISTEMA DEBE** ignorarla en el mapa (pero no en la racha ni en otras estadísticas). Al navegar a ese mes, la sesión debe aparecer.

## Requisitos no funcionales

- El mapa debe ser legible en pantallas de móvil (375 px de ancho).
- Los colores deben ser distinguibles en modo claro y modo oscuro.
- El mapa no debe ralentizar la carga inicial de la aplicación (umbral: < 100 ms para renderizar el mapa).
- Los textos de los tooltips deben estar en español.
- La navegación entre meses debe ser instantánea (< 50 ms).

## Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Día con múltiples sesiones | Suma todos los minutos del día; muestra el tema de la primera sesión por hora |
| Sesión con fecha futura | Se muestra como "día futuro" hasta que llegue esa fecha |
| Usuario sin sesiones | Todo el mapa aparece en color "sin estudio" (excepto días futuros) |
| Cambio de hora (verano/invierno) | El mapa sigue mostrando los días correctos sin desplazamientos |
| Sesión con minutos ≤ 0 | Se ignora (no cuenta como "estudiado") |
| Sesión con tema vacío | Se ignora (no cuenta como "estudiado") |
| Fecha futura que pasa | El mapa se actualiza al recargar la página |
| Cambio de fecha del sistema | El mapa se recalcula al recargar |
| Años bisiestos | Se manejan automáticamente con `setDate()` |
| Cambio de día durante uso | El mapa se actualiza al recargar |
| Sesiones fuera del rango visible | Se ignoran en el mapa, aparecen al navegar a su mes |
| Navegación a año anterior/siguiente | Funciona correctamente cruzando el límite de año |
| Cambio de número de meses | Se recalcula el rango visible inmediatamente |

## Fuera de alcance

- No se incluye navegación a semanas anteriores ni futuras (solo meses).
- No se muestra un resumen de totales por mes.
- No se permite hacer clic en un día para ver el detalle completo de todas las sesiones.
- No se incluye leyenda de colores (los colores se explican por sí mismos con los tooltips).
- No se persiste la preferencia de visualización del mapa (número de meses).

## Criterios de finalización

- [ ] El mapa muestra los meses correctamente (cuadrícula por mes).
- [ ] Los días estudiados, sin estudio y futuros tienen colores diferenciados.
- [ ] El tooltip muestra minutos y tema en días estudiados.
- [ ] El mapa se actualiza al registrar una nueva sesión.
- [ ] Funciona en modo claro y oscuro.
- [ ] Se verifica con Chrome DevTools en vista móvil (375 px).
- [ ] Los tooltips están en español.
- [ ] El mapa renderiza en < 100 ms.
- [ ] La navegación entre meses funciona (anterior/siguiente).
- [ ] El selector de número de meses funciona (1-12).

## Dudas abiertas

- (Resueltas: tema principal = primera sesión por hora; etiquetas de días incluidas; prioridad futuro > estudiado; textos de tooltips definidos; formato de celda con número de día; meses configurables 1-12; navegación anterior/siguiente)