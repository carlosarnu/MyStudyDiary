// Tests para logica-busqueda.js
// Ejecutar con: node --test test-busqueda.js
// Sin reloj: todas las sesiones de prueba llevan fechas fijas en string
// ("AAAA-MM-DD") y la lógica no usa Date, así que no hay zona horaria
// que desplace ningún día.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Cargar logica-busqueda.js (IIFE que asigna a globalThis)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const codigo = readFileSync(join(__dirname, 'logica-busqueda.js'), 'utf8');
eval(codigo);

// Importar las funciones desde globalThis
const { normalizarTexto, filtrarSesiones } = globalThis;

// ========== normalizarTexto (RF-4) ==========

test('normalizarTexto: quita espacios sobrantes, pasa a minúsculas y quita tildes', () => {
    assert.equal(normalizarTexto('  Matemáticas '), 'matematicas');
    assert.equal(normalizarTexto(' HISTORIA '), 'historia');
    assert.equal(normalizarTexto('Inglés'), 'ingles');
});

test('normalizarTexto: los guiones de las fechas NO se tocan', () => {
    assert.equal(normalizarTexto('2026-10-05'), '2026-10-05');
    assert.equal(normalizarTexto('  2026-10 '), '2026-10');
});

test('normalizarTexto: lo que no sea string devuelve "" sin excepción', () => {
    assert.equal(normalizarTexto(undefined), '');
    assert.equal(normalizarTexto(null), '');
    assert.equal(normalizarTexto(42), '');
    assert.equal(normalizarTexto(true), '');
});

test('normalizarTexto: la ñ y la diéresis se normalizan (ñ→n, ü→u)', () => {
    assert.equal(normalizarTexto('español'), 'espanol');
    assert.equal(normalizarTexto('ÑU'), 'nu');
    assert.equal(normalizarTexto('pingüino'), 'pinguino');
});

test('normalizarTexto: el texto vacío y los espacios solos siguen siendo ""', () => {
    assert.equal(normalizarTexto(''), '');
    assert.equal(normalizarTexto('   '), '');
});

// ========== filtrarSesiones: por tema (RF-3, RF-4) ==========

test('filtrarSesiones: "maticas" encuentra "Matemáticas" (substring)', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Matemáticas' }];
    assert.equal(filtrarSesiones(sesiones, 'maticas').length, 1);
});

test('filtrarSesiones: "HISTORIA" encuentra "Historia" (mayúsculas ignoradas)', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, 'HISTORIA').length, 1);
});

test('filtrarSesiones: "mateamaticas" NO coincide (más larga que el tema)', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Matemáticas' }];
    assert.equal(filtrarSesiones(sesiones, 'mateamaticas').length, 0);
});

test('filtrarSesiones: " Historia " con espacios sí coincide', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, ' Historia ').length, 1);
});

test('filtrarSesiones: "ingles" encuentra "Inglés" (tildes ignoradas)', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Inglés' }];
    assert.equal(filtrarSesiones(sesiones, 'ingles').length, 1);
});

test('filtrarSesiones: tema vacío o ausente no lanza excepción y sí filtra por fecha', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: '' },
        { id: 2, fecha: '2026-10-06' },                    // tema ausente
        { id: 3, fecha: '2026-10-07', tema: undefined },
    ];
    assert.equal(filtrarSesiones(sesiones, 'mate').length, 0);   // no coinciden por tema
    assert.equal(filtrarSesiones(sesiones, '2026-10').length, 3); // sí por fecha
    assert.equal(filtrarSesiones(sesiones, '').length, 3);        // sin excepción
});

// ========== filtrarSesiones: fecha por substring del AAAA-MM-DD (RF-3) ==========

test('filtrarSesiones: la fecha completa "2026-10-05" encuentra la sesión', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, '2026-10-05').length, 1);
});

test('filtrarSesiones: "2026" y "2026-10" encuentran la sesión (subcadenas)', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, '2026').length, 1);
    assert.equal(filtrarSesiones(sesiones, '2026-10').length, 1);
});

test('filtrarSesiones: "10-05" y "05" encuentran la sesión (subcadenas)', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, '10-05').length, 1);
    assert.equal(filtrarSesiones(sesiones, '05').length, 1);
});

test('filtrarSesiones: "05/10/2026" y "5 de octubre" NO coinciden (otros formatos)', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, '05/10/2026').length, 0);
    assert.equal(filtrarSesiones(sesiones, '5 de octubre').length, 0);
});

test('filtrarSesiones: "viernes" y el texto formateado de la fila NO son buscables', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, 'viernes').length, 0);
    assert.equal(filtrarSesiones(sesiones, 'viernes, 5 de octubre').length, 0);
});

// ========== filtrarSesiones: mes en español por PREFIJO (RF-3) ==========

test('filtrarSesiones: "octubre" y "oct" sí encuentran una sesión de octubre', () => {
    const sesiones = [{ id: 1, fecha: '2026-10-05', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, 'octubre').length, 1);
    assert.equal(filtrarSesiones(sesiones, 'oct').length, 1);
});

test('filtrarSesiones: "tob" y "ubre" NO coinciden con octubre (mes por prefijo)', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Historia' },
        { id: 2, fecha: '2026-11-05', tema: 'Matemáticas' },
    ];
    assert.equal(filtrarSesiones(sesiones, 'tob').length, 0);
    assert.equal(filtrarSesiones(sesiones, 'ubre').length, 0);
});

test('filtrarSesiones: "septiembre" sí y "setiembre" no (grafía de la app)', () => {
    const sesiones = [
        { id: 1, fecha: '2026-09-05', tema: 'Historia' },
        { id: 2, fecha: '2026-10-05', tema: 'Mate' },
    ];
    assert.equal(filtrarSesiones(sesiones, 'septiembre').length, 1);
    assert.equal(filtrarSesiones(sesiones, 'setiembre').length, 0);
});

test('filtrarSesiones: "enero" encuentra la sesión del 2026-01-01 (sin UTC)', () => {
    const sesiones = [{ id: 1, fecha: '2026-01-01', tema: 'Historia' }];
    assert.equal(filtrarSesiones(sesiones, 'enero').length, 1);
});

test('filtrarSesiones: "o" de 1 carácter encuentra solo octubre', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Música' },  // octubre
        { id: 2, fecha: '2026-03-15', tema: 'Arte' },    // marzo
        { id: 3, fecha: '2026-04-10', tema: 'Lengua' },  // abril
    ];
    const resultado = filtrarSesiones(sesiones, 'o');
    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].fecha, '2026-10-05');
});

test('filtrarSesiones: "a" de 1 carácter encuentra abril y agosto, no marzo', () => {
    const sesiones = [
        { id: 1, fecha: '2026-04-10', tema: 'Derecho' },  // abril
        { id: 2, fecha: '2026-08-10', tema: 'Cine' },     // agosto
        { id: 3, fecha: '2026-03-15', tema: 'Inglés' },   // marzo (no empieza por "a")
    ];
    const resultado = filtrarSesiones(sesiones, 'a');
    assert.equal(resultado.length, 2);
    assert.deepEqual(resultado.map((s) => s.fecha), ['2026-04-10', '2026-08-10']);
});

test('filtrarSesiones: "e" de 1 carácter encuentra enero', () => {
    const sesiones = [
        { id: 1, fecha: '2026-01-01', tema: 'Historia' },  // enero
        { id: 2, fecha: '2026-02-10', tema: 'Biología' },  // febrero (no empieza por "e")
        { id: 3, fecha: '2026-03-15', tema: 'Música' },    // marzo
    ];
    const resultado = filtrarSesiones(sesiones, 'e');
    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].fecha, '2026-01-01');
});

test('filtrarSesiones: "i" no empieza ningún mes: solo podría coincidir por tema', () => {
    const sesiones = [
        { id: 1, fecha: '2026-01-01', tema: 'Lengua' },
        { id: 2, fecha: '2026-04-10', tema: 'Arte' },
        { id: 3, fecha: '2026-10-05', tema: 'Mate' },
        { id: 4, fecha: '2026-12-01', tema: 'Física' },  // "fisica" sí contiene "i"
    ];
    const resultado = filtrarSesiones(sesiones, 'i');
    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].id, 4);
});

// ========== filtrarSesiones: fecha inválida no participa, sin excepción (RF-3, RF-10) ==========

test('filtrarSesiones: fecha "abc" no lanza excepción, no coincide por fecha, sí por tema', () => {
    const sesiones = [{ id: 1, fecha: 'abc', tema: 'Inglés' }];
    assert.equal(filtrarSesiones(sesiones, 'ingles').length, 1);
    assert.equal(filtrarSesiones(sesiones, 'abc').length, 0);   // la fecha no es buscable
    assert.equal(filtrarSesiones(sesiones, '2026').length, 0);
});

test('filtrarSesiones: fecha vacía, undefined o ausente no lanza excepción', () => {
    const sesiones = [
        { id: 1, fecha: '', tema: 'Mate' },
        { id: 2, fecha: undefined, tema: 'Mate' },
        { id: 3, tema: 'Mate' },  // sin campo fecha
    ];
    assert.equal(filtrarSesiones(sesiones, 'enero').length, 0);
    assert.equal(filtrarSesiones(sesiones, '2026-10').length, 0);
    assert.equal(filtrarSesiones(sesiones, 'mate').length, 3);  // sí por tema
});

test('filtrarSesiones: fecha con mes fuera de rango "2026-13-05" no participa', () => {
    const sesiones = [{ id: 1, fecha: '2026-13-05', tema: 'Mate' }];
    assert.equal(filtrarSesiones(sesiones, '2026').length, 0);
    assert.equal(filtrarSesiones(sesiones, 'octubre').length, 0);
    assert.equal(filtrarSesiones(sesiones, 'mate').length, 1);
});

// ========== filtrarSesiones: campos que NO se buscan (RF-3) ==========

test('filtrarSesiones: minutos, hora e id no se buscan', () => {
    const sesiones = [{ id: 1234, fecha: '2026-10-05', hora: '15:40', minutos: 90, tema: 'Mate' }];
    assert.equal(filtrarSesiones(sesiones, '90').length, 0);
    assert.equal(filtrarSesiones(sesiones, '15:40').length, 0);
    assert.equal(filtrarSesiones(sesiones, '1234').length, 0);
});

// ========== filtrarSesiones: comportamiento general (RF-5, RF-10) ==========

test('filtrarSesiones: texto vacío devuelve todas y es un array nuevo', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Historia' },
        { id: 2, fecha: '2026-01-01', tema: 'Mate' },
        { id: 3, fecha: '2026-03-15', tema: 'Inglés' },
    ];
    const resultado = filtrarSesiones(sesiones, '');
    assert.equal(resultado.length, sesiones.length);
    assert.notEqual(resultado, sesiones);  // es una copia, no la misma referencia
});

test('filtrarSesiones: solo espacios o texto sin definir = ver todo', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Historia' },
        { id: 2, fecha: '2026-01-01', tema: 'Mate' },
    ];
    assert.equal(filtrarSesiones(sesiones, '   ').length, 2);
    assert.equal(filtrarSesiones(sesiones, undefined).length, 2);
});

test('filtrarSesiones: sin coincidencias devuelve un array vacío', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Historia' },
        { id: 2, fecha: '2026-01-01', tema: 'Mate' },
    ];
    const resultado = filtrarSesiones(sesiones, 'zzzz');
    assert.ok(Array.isArray(resultado));
    assert.equal(resultado.length, 0);
});

test('filtrarSesiones: excluye las que no coinciden e incluye las múltiples coincidencias', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Matemáticas' },
        { id: 2, fecha: '2026-10-06', tema: 'Historia' },
        { id: 3, fecha: '2026-10-07', tema: 'Física' },
    ];
    assert.equal(filtrarSesiones(sesiones, 'oct').length, 3);  // las 3, por el mes
    const soloMate = filtrarSesiones(sesiones, 'mate');
    assert.equal(soloMate.length, 1);
    assert.equal(soloMate[0].id, 1);
});

test('filtrarSesiones: conserva el orden de entrada', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Historia' },
        { id: 2, fecha: '2026-01-01', tema: 'Mate' },
        { id: 3, fecha: '2026-03-15', tema: 'Inglés' },
    ];
    // "e" coincide por tema con Mate (2) e Inglés (3), no con Historia (1)
    const resultado = filtrarSesiones(sesiones, 'e');
    assert.deepEqual(resultado.map((s) => s.id), [2, 3]);
    // Con texto vacío el orden también se conserva
    assert.deepEqual(filtrarSesiones(sesiones, '').map((s) => s.id), [1, 2, 3]);
});

test('filtrarSesiones: no muta el array de entrada ni las sesiones', () => {
    const sesiones = [
        { id: 1, fecha: '2026-10-05', tema: 'Historia', minutos: 30, hora: '10:00' },
        { id: 2, fecha: '2026-10-06', tema: 'Mate', minutos: 45 },
    ];
    const antes = JSON.parse(JSON.stringify(sesiones));
    filtrarSesiones(sesiones, 'historia');
    filtrarSesiones(sesiones, '');
    assert.deepEqual(sesiones, antes);
});

test('filtrarSesiones: una entrada que no es array devuelve [] sin excepción', () => {
    assert.deepEqual(filtrarSesiones('no-array', 'a'), []);
    assert.deepEqual(filtrarSesiones(null, ''), []);
    assert.deepEqual(filtrarSesiones(undefined, undefined), []);
});
