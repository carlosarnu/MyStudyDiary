# Tareas: Mapa de calor de estudio (rediseño por meses)

## Fase 1: Lógica pura (meses)

- [x] **T1.1**: Modificar `logica-mapa.js` - función `obtenerRangoMeses(hoy, numMeses, mesInicial)`
  - **RF**: RF-1, RF-2, RF-3, RF-11
  - **Hecho cuando**: devuelve array de meses con semanas completas, cada día tiene `fecha`, `esFuturo`, `esMesActual`. Cruza años correctamente.

- [x] **T1.2**: Añadir funciones `obtenerMesSiguiente(anio, mes)` y `obtenerMesAnterior(anio, mes)`
  - **RF**: RF-3
  - **Hecho cuando**: `obtenerMesSiguiente(2026, 11)` → `{anio: 2027, mes: 0}`; `obtenerMesAnterior(2026, 0)` → `{anio: 2025, mes: 11}`.

- [x] **T1.3**: Mantener `agruparSesionesPorDia`, `clasificarDia`, `obtenerTooltip`, `obtenerColor` sin cambios
  - **RF**: RF-4, RF-5, RF-6, RF-7, RF-8, RF-9
  - **Hecho cuando**: tests existentes pasan.

## Fase 2: Tests

- [x] **T2.1**: Tests para `obtenerRangoMeses` (3 meses, estructura, semanas, futuros)
  - **RF**: RF-1, RF-2, RF-3, RF-11
  - **Hecho cuando**: 4 tests pasan (meses generados, semanas completas, días futuros, cruce de año).

- [x] **T2.2**: Tests para `obtenerMesSiguiente` / `obtenerMesAnterior`
  - **RF**: RF-3
  - **Hecho cuando**: 4 tests pasan (dic→ene, ene→dic, casos normales).

- [x] **T2.3**: Verificar tests existentes (`agruparSesionesPorDia`, `clasificarDia`, `obtenerTooltip`, `obtenerColor`)
  - **RF**: RF-4–RF-9
  - **Hecho cuando**: todos los tests previos siguen pasando.

## Fase 3: Interfaz

- [x] **T3.1**: Modificar `index.html` - nuevo contenedor con navegación y selector
  - **RF**: RF-1, RF-2, RF-3, RF-7, RF-8, RF-9
  - **Hecho cuando**: existe `<section class="mapa-calor">` con botones prev/next, span mes actual, select num-meses, `<div id="mapa-calor">`, `<div id="tooltip">`.

- [x] **T3.2**: Modificar `styles.css` - estilos para meses, navegación, selector, responsive
  - **RF**: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6
  - **Hecho cuando**: meses apilados verticalmente, grid 7 columnas por mes, botones navegación funcionan, selector visible, responsive 375px.

- [x] **T3.3**: Modificar `styles.css` - tooltip (mantener estilos existentes)
  - **RF**: RF-7, RF-8, RF-9
  - **Hecho cuando**: tooltip funciona igual que antes.

- [x] **T3.4**: Modificar `app.js` - estado `mesInicial` y `numMeses`, `renderizarMapa` por meses
  - **RF**: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-10, RF-11
  - **Hecho cuando**: al abrir la app, muestra 3 meses (por defecto) empezando en mes actual, colores correctos.

- [x] **T3.5**: Modificar `app.js` - eventos navegación (prev/next) y selector de meses
  - **RF**: RF-2, RF-3
  - **Hecho cuando**: click prev/next cambia mes mostrado, select cambia cantidad de meses, mapa se actualiza.

- [x] **T3.6**: Modificar `app.js` - eventos tooltip (mouseenter, mouseleave, touchstart)
  - **RF**: RF-7, RF-8, RF-9
  - **Hecho cuando**: hover/touch en celda muestra tooltip correcto según clasificación.

## Fase 4: Verificación

- [x] **T4.1**: Verificar con Chrome DevTools en vista móvil (375 px)
  - **RF**: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9
  - **Hecho cuando**: meses legibles, navegación touch funciona, selector usable.

- [x] **T4.2**: Verificar modo claro y modo oscuro
  - **RF**: RF-4, RF-5, RF-6
  - **Hecho cuando**: colores distinguibles en ambos modos.

- [x] **T4.3**: Verificar actualización dinámica al registrar sesión
  - **RF**: RF-10
  - **Hecho cuando**: al registrar sesión, el mapa se actualiza sin recargar.

- [x] **T4.4**: Verificar rendimiento (< 100 ms renderizado)
  - **RF**: RF-1
  - **Hecho cuando**: mapa renderiza en < 100 ms medido con DevTools.

- [x] **T4.5**: Verificar navegación (prev/next, cruce de año, selector meses)
  - **RF**: RF-2, RF-3
  - **Hecho cuando**: botones navegan mes a mes, dic→ene y ene→dic funcionan, selector 1-12 cambia vista.

- [x] **T4.6**: Verificar casos límite (sesiones inválidas, fuera de rango, días vacíos en grid)
  - **RF**: RF-4, RF-5, RF-6, RF-11
  - **Hecho cuando**: sesiones inválidas ignoradas, días de mes anterior/siguiente en grid se ven vacíos, sesiones fuera de rango aparecen al navegar.