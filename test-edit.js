// Tests para funcionalidad de edición de sesiones (lógica pura)
// Ejecutar con: node --test test-edit.js

import { test } from 'node:test';
import assert from 'node:assert/strict';

// ========== Funciones puras de validación y edición (copiadas de app.js) ==========

function validarSesion(datos) {
    if (!datos.fecha) {
        return { valido: false, error: "La fecha es obligatoria." };
    }
    if (!datos.tema || datos.tema.trim() === "") {
        return { valido: false, error: "El tema es obligatoria." };
    }
    if (!Number.isFinite(datos.minutos) || datos.minutos <= 0) {
        return { valido: false, error: "Los minutos deben ser un número mayor que 0." };
    }
    return { valido: true };
}

function obtenerSesionPorId(sesiones, id) {
    return sesiones.find(s => s.id === id);
}

function actualizarSesion(sesiones, id, datosNuevos) {
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    return sesiones.map(s => {
        if (s.id === id) {
            return {
                ...s,
                fecha: datosNuevos.fecha,
                tema: datosNuevos.tema.trim(),
                minutos: datosNuevos.minutos,
                hora: hora
            };
        }
        return s;
    });
}

// ========== validarSesion ==========

test('validarSesion: acepta datos válidos', () => {
    const resultado = validarSesion({ fecha: '2026-10-05', tema: 'Matemáticas', minutos: 30 });
    assert.equal(resultado.valido, true);
});

test('validarSesion: rechaza fecha vacía', () => {
    const resultado = validarSesion({ fecha: '', tema: 'Matemáticas', minutos: 30 });
    assert.equal(resultado.valido, false);
    assert.ok(resultado.error.includes('fecha'));
});

test('validarSesion: rechaza tema vacío', () => {
    const resultado = validarSesion({ fecha: '2026-10-05', tema: '', minutos: 30 });
    assert.equal(resultado.valido, false);
    assert.ok(resultado.error.includes('tema'));
});

test('validarSesion: rechaza tema solo espacios', () => {
    const resultado = validarSesion({ fecha: '2026-10-05', tema: '   ', minutos: 30 });
    assert.equal(resultado.valido, false);
});

test('validarSesion: rechaza minutos <= 0', () => {
    const resultado = validarSesion({ fecha: '2026-10-05', tema: 'Test', minutos: 0 });
    assert.equal(resultado.valido, false);
    assert.ok(resultado.error.includes('minutos'));
});

test('validarSesion: rechaza minutos negativos', () => {
    const resultado = validarSesion({ fecha: '2026-10-05', tema: 'Test', minutos: -10 });
    assert.equal(resultado.valido, false);
});

// ========== obtenerSesionPorId ==========

test('obtenerSesionPorId: encuentra sesión por ID', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Matemáticas', minutos: 30 },
        { id: 2, fecha: '2026-10-04', tema: 'Física', minutos: 45 }
    ];
    const resultado = obtenerSesionPorId(sesiones, 2);
    assert.equal(resultado.tema, 'Física');
    assert.equal(resultado.minutos, 45);
});

test('obtenerSesionPorId: devuelve undefined si no existe', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Matemáticas', minutos: 30 }];
    const resultado = obtenerSesionPorId(sesiones, 999);
    assert.equal(resultado, undefined);
});

// ========== actualizarSesion ==========

test('actualizarSesion: actualiza campos y hora', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Matemáticas', minutos: 30, hora: '10:00' }
    ];
    const nuevas = actualizarSesion(sesiones, 1, { 
        fecha: '2026-10-06', 
        tema: 'Física', 
        minutos: 45 
    });
    assert.equal(nuevas[0].fecha, '2026-10-06');
    assert.equal(nuevas[0].tema, 'Física');
    assert.equal(nuevas[0].minutos, 45);
    assert.notEqual(nuevas[0].hora, '10:00'); // hora actualizada
    assert.equal(nuevas[0].id, 1); // ID mantenido
});

test('actualizarSesion: no modifica otras sesiones', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Matemáticas', minutos: 30, hora: '10:00' },
        { id: 2, fecha: '2026-10-04', tema: 'Física', minutos: 45, hora: '11:00' }
    ];
    const nuevas = actualizarSesion(sesiones, 1, { 
        fecha: '2026-10-06', 
        tema: 'Química', 
        minutos: 60 
    });
    assert.equal(nuevas[0].tema, 'Química');
    assert.equal(nuevas[1].tema, 'Física'); // sin cambios
    assert.equal(nuevas[1].minutos, 45); // sin cambios
});

test('actualizarSesion: trim en tema', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Matemáticas', minutos: 30, hora: '10:00' }];
    const nuevas = actualizarSesion(sesiones, 1, { 
        fecha: '2026-10-05', 
        tema: '  Física  ', 
        minutos: 45 
    });
    assert.equal(nuevas[0].tema, 'Física');
});