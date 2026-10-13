# Spec 003 — Objetivo semanal de estudio

Estado: aprobada

## Contexto y objetivo

El Diario de Estudio ya muestra cuántos minutos se llevan acumulados en la semana actual
(con el texto `"Esta semana: X min"`), pero ese dato no tiene referencia: el usuario no
sabe si es poco o mucho porque no se ha fijado una meta. Sin una meta, la cifra no motiva
ni ayuda a decidir cuánto estudiar.

El usuario quiere fijar cuántos minutos quiere estudiar cada semana y ver cuánto lleva
conseguidos, para motivarse y esforzarse por cumplirlo.

**Cambio sobre lo existente (decisión del usuario, formato "3B")**: el texto existente se
reescribe para integrar la meta, pasando de `"Esta semana: X min"` a
`"Esta semana: X/Y min"` (X = minutos acumulados, Y = objetivo). Como `AGENTS.md` documenta
el formato actual, esa documentación debe actualizarse en la implementación para no quedar
en contradicción con el código.

## Usuarios

- **Usuario principal**: alguien que registra su estudio a diario y quiere una meta
  semanal concreta que le dé dirección y una recompensa visual al conseguirla.

## Historias de usuario

1. Como usuario, quiero fijar los minutos que quiero estudiar cada semana para tener una meta clara.
2. Como usuario, quiero ver cuántos minutos llevo de esa meta para saber cómo voy.
3. Como usuario, quiero ver de un vistazo si he cumplido la meta para sentirme motivado.
4. Como usuario, quiero poder cambiar la meta cuando cambien mis circunstancias.
5. Como usuario, quiero que la meta se mantenga guardada para no tener que fijarla cada vez que abro la aplicación.

## Definiciones

- **Objetivo semanal**: número de minutos que el usuario quiere estudiar cada semana. Es
  un único valor persistente que **no está ligado a una semana concreta**: se mantiene de
  una semana a otra hasta que el usuario lo cambie o lo elimine. Cada semana compara el
  progreso de esa semana con el mismo objetivo.
- **Progreso**: suma de minutos de las sesiones de la semana en curso respecto al objetivo.
- **Semana en curso**: de lunes a domingo (estándar en España), calculada en la hora local del usuario.
- **Meta cumplida**: estado en el que el progreso alcanza o supera el objetivo.
- **Tarjeta de objetivo**: sección de la interfaz, independiente del formulario de sesión,
  donde se fija, cambia y elimina el objetivo (decisión del usuario, opción "2C").

## Requisitos funcionales

### RF-1: Fijar el objetivo
**CUANDO** el usuario indique los minutos que quiere estudiar en la semana usando el
control de la tarjeta de objetivo, **EL SISTEMA DEBE** aceptarlo como objetivo semanal,
guardarlo y mostrarlo integrado en el total semanal con el formato
`"Esta semana: X/Y min"`.

El control reside **fuera del formulario de sesión**, en su propia tarjeta/sección: el
único botón del formulario de sesión (que en modo edición de la spec 002 conmuta entre
"Guardar sesión" y "Guardar cambios") **no se ve afectado**, no comparte estado con el
objetivo y no debe alterar su comportamiento.

### RF-2: Persistencia del objetivo
**CUANDO** el usuario fije o cambie el objetivo, **EL SISTEMA DEBE** conservarlo entre
aperturas de la aplicación, sin que tenga que volver a indicarlo.

- **Clave de almacenamiento**: `diarioEstudio.objetivo`, en el almacenamiento local del
  dispositivo, junto a las claves ya existentes (`diarioEstudio.sesiones` y
  `diarioEstudio.tema`).
- **Valor guardado**: un número entero que representa los minutos del objetivo (un valor
  simple, no un objeto ni JSON).
- **Si la clave no existe** (primera visita o objetivo eliminado): se comporta como "sin
  objetivo" (RF-9).
- **Si el valor guardado no es válido** (texto no numérico, número con decimales, fuera
  del rango permitido o corrupto): se ignora y se comporta como "sin objetivo" (RF-9). En
  ningún caso debe impedir el arranque de la aplicación ni el funcionamiento del resto de
  datos, ni provocar errores en consola.

### RF-3: Visualización del progreso
**CUANDO** el usuario visualice la zona de minutos de la semana, **EL SISTEMA DEBE** mostrar
simultáneamente el objetivo fijado, los minutos acumulados y cuánto falta (o cuánto se ha
superado) para cumplirlo, con el formato `"Esta semana: X/Y min"` seguido del detalle de lo
que falta o se ha superado. **Mientras no exista objetivo**, la zona se muestra en su formato
sin objetivo: `"Esta semana: X min"`.

### RF-4: Cálculo del progreso
**MIENTRAS** se muestre el progreso, **EL SISTEMA DEBE** sumar las sesiones cuya fecha caiga
entre el lunes y el domingo de la semana en curso, en hora local. **Criterio explícito
(decisión del usuario, opción "1B"): las sesiones con fecha futura dentro de la semana en
curso SÍ cuentan** para el progreso (por ejemplo, el martes cuenta una sesión del viernes
de esa misma semana). Solo quedan fuera las sesiones de semanas distintas a la en curso.

### RF-5: Actualización inmediata del progreso
**CUANDO** el usuario registre o edite una sesión, **EL SISTEMA DEBE** actualizar el progreso
y el estado de la meta inmediatamente, sin recargar la página.

### RF-6: Cambio de semana
**CUANDO** el sistema detecte que la fecha local ha pasado a una semana distinta de la que
se está mostrando, **EL SISTEMA DEBE** recalcular el progreso contando solo las sesiones de
la semana nueva y mantener el mismo objetivo fijado.

**Regla única y coherente con la tabla de casos límite**: el progreso mostrado corresponde
siempre a la semana en curso según la fecha local del momento en que se pinta la vista; el
recálculo se produce **en cada actualización de la vista y al detectar un cambio de semana,
también con la pestaña abierta y sin recargar**. Nunca debe seguir mostrándose la semana
anterior una vez detectado el cambio.

### RF-7: Cambiar el objetivo
**EL SISTEMA DEBE** permitir modificar el objetivo en cualquier momento mediante el control
de la tarjeta de objetivo (sección independiente del formulario de sesión, sin interferir
con el modo edición de la spec 002), reflejándose el cambio inmediatamente en el progreso
mostrado.

### RF-8: Meta cumplida
**SI** el progreso acumulado alcanza o supera el objetivo, **EL SISTEMA DEBE** mostrar un
indicador visual diferenciado de "meta cumplida" para motivar al usuario. Este indicador
debe desaparecer si el progreso vuelve a quedar por debajo del objetivo.

### RF-9: Sin objetivo fijado
**SI** el usuario aún no ha fijado ningún objetivo (primera visita, objetivo eliminado o
valor guardado inválido), **EL SISTEMA DEBE** invitarle a fijarlo desde la tarjeta de
objetivo, sin bloquear el resto de la aplicación ni ocultar el total semanal, que se
muestra en su formato sin objetivo (`"Esta semana: X min"`).

### RF-10: Validación del objetivo
**SI** el valor introducido como objetivo no es un número entero entre 1 y 10080 (los
minutos que tiene una semana completa), **EL SISTEMA DEBE** rechazarlo mostrando un
**texto propio de la aplicación en español** —no la validación nativa del navegador, que se
mostraría en el idioma del navegador—, visible junto al control de la tarjeta de objetivo,
sin modificar el objetivo anterior.

- **Texto exacto de rechazo**: `Introduce un número entero entre 1 y 10080 minutos.`
- **Dejar el campo vacío no es un error**: equivale a eliminar el objetivo y la aplicación
  vuelve al estado "sin objetivo" (RF-9).

## Requisitos no funcionales

- Textos de interfaz y mensajes en español; en particular, el mensaje de rechazo del
  objetivo es un texto propio de la aplicación con el contenido fijado en RF-10.
- La validación final del objetivo (aceptar o rechazar el valor) es lógica independiente de
  la interfaz, según el principio 3 de la constitución: la interfaz solo muestra el
  resultado y el mensaje; la decisión no vive en el código de presentación.
- El campo de la tarjeta de objetivo debe tener etiqueta asociada, poder alcanzarse con el
  teclado y mostrar el foco; el indicador de "meta cumplida" debe distinguirse también por
  texto, no solo por color.
- Todo el cálculo en la hora local del usuario; sin desplazamientos de día por zonas horarias.
- El progreso y la meta deben leerse de un vistazo en pantallas de móvil (375 px), incluido
  el valor del objetivo (de ahí el límite superior de 10080 fijado en RF-10).
- El indicador de meta cumplida debe distinguirse en modo claro y modo oscuro.
- La información sensible del objetivo solo reside en el dispositivo del usuario.

## Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Usuario sin objetivo fijado | Se invita a fijarlo desde la tarjeta; el total semanal sigue visible en formato `"Esta semana: X min"` y funciona con normalidad |
| Objetivo con valor 0 o negativo, no numérico o con decimales | Se rechaza con el texto propio `Introduce un número entero entre 1 y 10080 minutos.`; se conserva el objetivo anterior |
| Objetivo vacío (el usuario deja el campo en blanco y confirma) | No es error: se elimina el objetivo y la aplicación vuelve al estado "sin objetivo" (RF-9) |
| Objetivo mayor que 10080 (más minutos que una semana completa) | Se rechaza con el mismo texto de rechazo; se conserva el objetivo anterior |
| Valor inválido o corrupto en `diarioEstudio.objetivo` (texto no numérico, fuera de rango) | Se ignora: la aplicación muestra el estado "sin objetivo" (RF-9), arranca sin errores ni mensajes |
| Progreso exactamente igual al objetivo | La meta aparece como cumplida |
| Progreso superior al objetivo | La meta aparece como cumplida y se muestra cuánto se ha superado |
| Cambio de objetivo a la vez menor que el progreso actual | La meta pasa a cumplida con el nuevo objetivo |
| Edición de sesión que reduce minutos y deja el progreso por debajo del objetivo | El indicador de meta cumplida desaparece |
| Varios días sin estudiar dentro de la semana | El progreso muestra los minutos reales acumulados, aunque no cambie |
| Sesión con fecha de la semana anterior | No cuenta para el progreso de la semana en curso |
| Sesión con fecha futura dentro de la semana en curso | **Sí cuenta** para el progreso (decisión "1B", ver RF-4) |
| Varias sesiones el mismo día | Todas suman al progreso |
| Cambio de día (lunes) durante el uso de la aplicación con la pestaña abierta | En cuanto se detecta el cambio y se actualiza la vista, el progreso pasa a la semana nueva; nunca queda mostrada la semana anterior (regla única del RF-6) |
| Cambio de hora del sistema (verano/invierno) | El progreso y la semana se mantienen correctos |
| Sesiones antiguas sin hora registrada | Siguen contando para el progreso |
| Objetivo fijado con sesión abierta en otra pestaña/dispositivo | Cada apertura muestra el objetivo guardado en ese dispositivo |
| Fijar o cambiar el objetivo con el formulario de sesión en modo edición (spec 002) | La tarjeta de objetivo actúa de forma independiente: el botón "Guardar cambios" no se ve afectado |

## Fuera de alcance

- No se guarda histórico de objetivos ni de progresos de semanas anteriores.
- No hay objetivos por día, por mes ni por tema/materia.
- No se envían notificaciones ni recordatorios.
- No hay comparación con semanas anteriores ni gráficas de evolución.
- No se comparten objetivos ni progresos con otros usuarios ni con servidores.
- No se incluye objetivos automáticos sugeridos por la aplicación.

## Criterios de finalización

- [ ] (RF-1) El usuario fija el objetivo desde la tarjeta independiente y el total semanal
      se reescribe como `"Esta semana: X/Y min"`; el botón del formulario de sesión
      (incluido el modo edición de la spec 002) sigue funcionando igual que antes.
- [ ] (RF-2) El objetivo se conserva al cerrar y volver a abrir la aplicación usando la
      clave `diarioEstudio.objetivo`; con la clave ausente o con un valor inválido la
      aplicación muestra el estado "sin objetivo" sin errores en consola.
- [ ] (RF-3) Se muestran a la vez objetivo, acumulado y lo que falta (o se ha superado).
- [ ] (RF-4) El progreso suma la semana en curso en hora local e **incluye las sesiones con
      fecha futura dentro de esa semana**.
- [ ] (RF-5) El progreso se actualiza al registrar o editar una sesión.
- [ ] (RF-6) Con la pestaña abierta, al llegar a lunes el progreso pasa a la semana nueva
      (en cada actualización de la vista y al detectar el cambio) y el objetivo se mantiene.
- [ ] (RF-7) El objetivo se puede cambiar en cualquier momento desde la tarjeta, sin tocar
      el formulario de sesión.
- [ ] (RF-8) Al alcanzar o superar el objetivo aparece el indicador de meta cumplida, y
      desaparece si se baja por debajo.
- [ ] (RF-9) Con el objetivo vacío o eliminado se muestra la invitación a fijarlo junto al
      total semanal en formato `"Esta semana: X min"`, sin errores.
- [ ] (RF-10) Un valor fuera de rango o no entero se rechaza con el texto propio
      `Introduce un número entero entre 1 y 10080 minutos.` sin alterar el objetivo
      anterior; dejar el campo vacío elimina el objetivo.
- [ ] `AGENTS.md` refleja el nuevo formato `"Esta semana: X/Y min"` y la clave
      `diarioEstudio.objetivo`.
- [ ] El campo de objetivo tiene etiqueta y foco visibles, y el indicador de meta cumplida
      se distingue también por texto.
- [ ] Funciona en modo claro y oscuro y se verifica con Chrome DevTools en vista móvil (375 px).

## Dudas abiertas

- (Pendientes de decisión en fase de diseño, no afectan al QUÉ: redacción exacta del texto
  de invitación de RF-9 y formato visual concreto del indicador de "meta cumplida".)
