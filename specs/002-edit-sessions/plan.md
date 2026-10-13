# Plan: Edición de sesiones

## Archivos a crear o modificar

| Archivo | Acción | Responsabilidad | RF cubiertos |
|---|---|---|---|
| `index.html` | Modificar | Añadir botón "Cancelar" oculto en el formulario | RF-2, RF-5 |
| `styles.css` | Modificar | Estilos para modo edición (formulario, botones, botón editar en historial) | RF-2, RF-4, RF-5 |
| `app.js` | Modificar | Lógica de modo edición: cargar datos, guardar cambios, cancelar, botón editar en historial | RF-1–RF-7 |
| `logica-mapa.js` | Sin cambios | — | — |
| `test-edit.js` | Crear | Tests para lógica de edición (funciones puras si aplica) | RF-1–RF-7 |

---

## Funciones puras de lógica (en `app.js` o nuevo módulo)

### 1. `obtenerSesionPorId(sesiones, id)`
- **Qué hace**: busca y devuelve la sesión con el ID dado.
- **RF**: RF-2, RF-4

### 2. `actualizarSesion(sesiones, id, datosNuevos)`
- **Qué hace**: devuelve nuevo array con la sesión actualizada (misma ID, nueva hora).
- **RF**: RF-4, RF-6

### 3. `validarSesion(datos)`
- **Qué hace**: valida fecha, tema, minutos. Devuelve `{ valido: true }` o `{ valido: false, error: string }`.
- **RF**: RF-3

---

## Algoritmo en pseudocódigo

```
function manejarClickEditar(id):
    sesion = obtenerSesionPorId(sesiones, id)
    ponerFormularioEnModoEdicion(sesion)

function ponerFormularioEnModoEdicion(sesion):
    inputFecha.value = sesion.fecha
    inputTema.value = sesion.tema
    inputMinutos.value = sesion.minutos
    form.dataset.editandoId = sesion.id
    btnSubmit.textContent = "Guardar cambios"
    btnCancel.hidden = false
    inputFecha.focus()

function manejarSubmitEdicion(datos):
    errores = validarSesion(datos)
    si !errores.valido:
        mostrarError(errores.error)
        retornar
    
    sesiones = actualizarSesion(sesiones, form.dataset.editandoId, datos)
    guardarSesiones(sesiones)
    salirModoEdicion()
    renderizar()

function salirModoEdicion():
    delete form.dataset.editandoId
    btnSubmit.textContent = "Guardar sesión"
    btnCancel.hidden = true
    limpiarFormulario()

function manejarCancelar():
    salirModoEdicion()
```

---

## Estructura HTML (modificaciones en `index.html`)

```html
<!-- En el formulario, añadir botón cancelar oculto -->
<button type="submit" id="btn-guardar">Guardar sesión</button>
<button type="button" id="btn-cancelar" class="btn-cancelar" hidden>Cancelar</button>
```

```html
<!-- En cada sesión del historial, añadir botón editar -->
<li>
    <div class="sesion-info">...</div>
    <span class="sesion-minutos">45 min</span>
    <button type="button" class="btn-editar" data-id="12345" aria-label="Editar sesión">✎</button>
</li>
```

---

## Estilos CSS (modificaciones en `styles.css`)

```css
/* Botón editar en historial */
.btn-editar {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
    color: var(--color-texto-suave);
    transition: color 0.15s;
}
.btn-editar:hover {
    color: var(--color-primario);
}

/* Formulario en modo edición */
.formulario.editando {
    border-color: var(--color-primario);
    box-shadow: 0 0 0 2px rgba(230, 57, 70, 0.2);
}

.btn-cancelar {
    background: var(--color-texto-suave);
    color: white;
    border: none;
    border-radius: var(--radio);
    padding: 0.7rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.5rem;
}
.btn-cancelar:hover {
    opacity: 0.8;
}

#btn-guardar.guardando {
    background-color: var(--color-primario-hover);
}
```

---

## Decisiones técnicas justificadas

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| Botón editar en cada sesión | Click en sesión o en celda del mapa | Más explícito, accesible, no interfiere con tooltip del mapa |
| Todos los campos editables | Solo tema/minutos | El usuario pidió flexibilidad total; la fecha puede ser corregida |
| Botones Guardar/Cancelar | Click fuera/Escape | Más accesible y explícito; evita pérdidas accidentales |
| Mantener ID al editar | Generar nuevo ID | Preserva identidad de la sesión; el historial no se rompe |
| Actualizar hora al editar | Mantener hora original | Refleja cuándo se hizo la última modificación |

---

## Estrategia de tests con `node --test`

### Archivo: `test-edit.js`

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Tests para funciones puras de edición
test('obtenerSesionPorId: encuentra sesión por ID', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Matemáticas', minutos: 30 }];
    const resultado = obtenerSesionPorId(sesiones, 1);
    assert.equal(resultado.tema, 'Matemáticas');
});

test('actualizarSesion: actualiza campos y hora', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Matemáticas', minutos: 30, hora: '10:00' }];
    const nuevas = actualizarSesion(sesiones, 1, { fecha: '2026-10-06', tema: 'Física', minutos: 45 });
    assert.equal(nuevas[0].fecha, '2026-10-06');
    assert.equal(nuevas[0].tema, 'Física');
    assert.equal(nuevas[0].minutos, 45);
    assert.notEqual(nuevas[0].hora, '10:00'); // hora actualizada
});

test('validarSesion: rechaca minutos <= 0', () => {
    const resultado = validarSesion({ fecha: '2026-10-05', tema: 'Test', minutos: 0 });
    assert.equal(resultado.valido, false);
});
```

---

## Cobertura de RF por componente

| RF | `app.js` | `index.html` | `styles.css` | `test-edit.js` |
|---|---|---|---|---|
| RF-1 | ✅ renderizado historial | ✅ botón en li | ✅ estilos btn-editar | — |
| RF-2 | ✅ modo edición | ✅ btn-cancelar | ✅ .formulario.editando | ✅ |
| RF-3 | ✅ validación | ✅ campos | — | ✅ |
| RF-4 | ✅ actualizarSesion | — | ✅ btn guardando | ✅ |
| RF-5 | ✅ salirModoEdicion | ✅ btn-cancelar | — | ✅ |
| RF-6 | ✅ renderizar() | — | — | — |
| RF-7 | ✅ validación fecha | — | — | ✅ |

---

## Orden de implementación

1. **Modificar `index.html`**: añadir botón "Cancelar" oculto en formulario.
2. **Modificar `styles.css`**: estilos para botón editar, modo edición, botón cancelar.
3. **Modificar `app.js`**: 
   - Añadir `validarSesion()`, `obtenerSesionPorId()`, `actualizarSesion()`
   - Modificar `renderizar()` para incluir botón editar en historial
   - Añadir `manejarClickEditar()`, `ponerFormularioEnModoEdicion()`, `salirModoEdicion()`, `manejarSubmitEdicion()`, `manejarCancelar()`
   - Event listeners para botones editar, cancelar, submit en modo edición
4. **Crear `test-edit.js`** y ejecutar `node --test`.
5. **Verificar con Chrome DevTools**: vista móvil, modo claro/oscuro, flujo completo editar/guardar/cancelar.