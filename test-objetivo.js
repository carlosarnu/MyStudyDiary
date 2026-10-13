// Tests para logica-objetivo.js
// Ejecutar con: node --test test-objetivo.js
// Todas las fechas son fijas: ningún test depende del reloj del sistema.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Cargar logica-objetivo.js (IIFE que asigna a globalThis)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const codigo = readFileSync(join(__dirname, 'logica-objetivo.js'), 'utf8');
eval(codigo);

// Importar las funciones desde globalThis
const {
    obtenerRangoSemana,
    calcularMinutosSemana,
    validarObjetivo,
    interpretarObjetivoGuardado,
    formatearTotalSemana,
    formatearDetalleProgreso,
    esMetaCumplida,
    haCambiadoSemana
} = globalThis;

// Texto exacto de rechazo (RF-10)
const MENSAJE_RECHAZO = 'Introduce un número entero entre 1 y 10080 minutos.';

// Comprueba que un Date coincide con un día concreto (mes: 0 = enero)
function mismoDia(fecha, anio, mes, dia) {
    return fecha.getFullYear() === anio
        && fecha.getMonth() === mes
        && fecha.getDate() === dia;
}

// ========== obtenerRangoSemana ==========

test('obtenerRangoSemana: hoy miércoles devuelve lunes y domingo de esa semana', () => {
    const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
    const rango = obtenerRangoSemana(hoy);
    assert.equal(mismoDia(rango.lunes, 2026, 9, 5), true);   // lun 5 oct
    assert.equal(mismoDia(rango.domingo, 2026, 9, 11), true); // dom 11 oct
});

test('obtenerRangoSemana: hoy es lunes, la semana empieza hoy', () => {
    const hoy = new Date(2026, 9, 5); // lunes 5 oct 2026
    const rango = obtenerRangoSemana(hoy);
    assert.equal(mismoDia(rango.lunes, 2026, 9, 5), true);
    assert.equal(mismoDia(rango.domingo, 2026, 9, 11), true);
});

test('obtenerRangoSemana: hoy domingo, la semana empezó el lunes anterior', () => {
    const hoy = new Date(2026, 9, 11); // domingo 11 oct 2026
    const rango = obtenerRangoSemana(hoy);
    assert.equal(mismoDia(rango.lunes, 2026, 9, 5), true);   // lunes anterior
    assert.equal(mismoDia(rango.domingo, 2026, 9, 11), true); // es el propio domingo
});

test('obtenerRangoSemana: cruce de año (sáb 2 ene 2027 → semana anterior)', () => {
    const hoy = new Date(2027, 0, 2); // sábado 2 enero 2027
    const rango = obtenerRangoSemana(hoy);
    assert.equal(mismoDia(rango.lunes, 2026, 11, 28), true); // lun 28 dic 2026
    assert.equal(mismoDia(rango.domingo, 2027, 0, 3), true);  // dom 3 ene 2027
});

test('obtenerRangoSemana: cruce de año visto desde el 1 de enero', () => {
    const hoy = new Date(2026, 0, 1); // jueves 1 enero 2026
    const rango = obtenerRangoSemana(hoy);
    assert.equal(mismoDia(rango.lunes, 2025, 11, 29), true); // lun 29 dic 2025
    assert.equal(mismoDia(rango.domingo, 2026, 0, 4), true);  // dom 4 ene 2026
});

// ========== calcularMinutosSemana ==========

// RF-4 (decisión del usuario 1B): la sesión futura de la MISMA semana sí cuenta
test('calcularMinutosSemana: incluye sesiones futuras dentro de la semana', () => {
    const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026; semana = lun 5 – dom 11 oct
    const sesiones = [
        { fecha: '2026-10-05', minutos: 30 },    // lunes (pasado) → cuenta
        { fecha: '2026-10-09', minutos: 45 },    // viernes (futuro) → SÍ cuenta
        { fecha: '2026-10-04', minutos: 999 },   // domingo anterior → NO cuenta
        { fecha: '2026-10-12', minutos: 999 },   // lunes siguiente → NO cuenta
    ];
    assert.equal(calcularMinutosSemana(sesiones, hoy), 75);
});

test('calcularMinutosSemana: las sesiones de la semana anterior no cuentan', () => {
    const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
    const sesiones = [
        { fecha: '2026-10-04', minutos: 60 },  // domingo de la semana anterior
        { fecha: '2026-09-30', minutos: 45 },  // miércoles de la semana anterior
        { fecha: '2026-10-06', minutos: 10 },  // martes de esta semana
    ];
    assert.equal(calcularMinutosSemana(sesiones, hoy), 10);
});

test('calcularMinutosSemana: el lunes siguiente no cuenta', () => {
    const hoy = new Date(2026, 9, 11); // domingo 11 oct 2026 (último día de la semana)
    const sesiones = [
        { fecha: '2026-10-12', minutos: 999 },  // lunes de la semana siguiente
        { fecha: '2026-10-10', minutos: 20 },   // sábado de esta semana → cuenta
    ];
    assert.equal(calcularMinutosSemana(sesiones, hoy), 20);
});

test('calcularMinutosSemana: varias sesiones el mismo día suman', () => {
    const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
    const sesiones = [
        { fecha: '2026-10-06', minutos: 30, tema: 'Matemáticas' },
        { fecha: '2026-10-06', minutos: 45, tema: 'Física' },
        { fecha: '2026-10-06', minutos: 15, tema: 'Historia' },
    ];
    assert.equal(calcularMinutosSemana(sesiones, hoy), 90);
});

test('calcularMinutosSemana: las sesiones antiguas sin hora cuentan', () => {
    const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
    const sesiones = [
        { id: 1, fecha: '2026-10-05', minutos: 40, tema: 'Antigua' }, // sin campo hora
        { id: 2, fecha: '2026-10-07', minutos: 20, tema: 'Nueva', hora: '08:30' },
    ];
    assert.equal(calcularMinutosSemana(sesiones, hoy), 60);
});

test('calcularMinutosSemana: sin sesiones devuelve 0', () => {
    const hoy = new Date(2026, 9, 7);
    assert.equal(calcularMinutosSemana([], hoy), 0);
});

// ========== validarObjetivo ==========

test('validarObjetivo: "300" se guarda como 300', () => {
    const r = validarObjetivo('300');
    assert.equal(r.accion, 'guardar');
    assert.equal(r.minutos, 300);
});

test('validarObjetivo: " 120 " con espacios se guarda recortado', () => {
    const r = validarObjetivo(' 120 ');
    assert.equal(r.accion, 'guardar');
    assert.equal(r.minutos, 120);
});

test('validarObjetivo: los límites 1 y 10080 se guardan', () => {
    const minimo = validarObjetivo('1');
    assert.equal(minimo.accion, 'guardar');
    assert.equal(minimo.minutos, 1);

    const maximo = validarObjetivo('10080');
    assert.equal(maximo.accion, 'guardar');
    assert.equal(maximo.minutos, 10080);
});

test('validarObjetivo: los valores inválidos se rechazan con el texto exacto', () => {
    const invalidos = ['0', '-5', '10081', '45.5', 'abc'];
    for (const texto of invalidos) {
        const r = validarObjetivo(texto);
        assert.equal(r.accion, 'rechazar', `entrada: ${texto}`);
        assert.equal(r.error, MENSAJE_RECHAZO, `entrada: ${texto}`);
    }
});

test('validarObjetivo: campo vacío o solo espacios = eliminar (no es error)', () => {
    const vacio = validarObjetivo('');
    assert.equal(vacio.accion, 'eliminar');
    assert.equal(vacio.error, undefined);

    const espacios = validarObjetivo('   ');
    assert.equal(espacios.accion, 'eliminar');
    assert.equal(espacios.error, undefined);
});

// ========== interpretarObjetivoGuardado ==========

test('interpretarObjetivoGuardado: valores ausentes o corruptos → null', () => {
    const crudos = [null, undefined, '', 'abc', '0', '45.5', '10081'];
    for (const crudo of crudos) {
        assert.equal(interpretarObjetivoGuardado(crudo), null, `valor: ${String(crudo)}`);
    }
});

test('interpretarObjetivoGuardado: "300" → 300', () => {
    assert.equal(interpretarObjetivoGuardado('300'), 300);
    assert.equal(interpretarObjetivoGuardado('1'), 1);
    assert.equal(interpretarObjetivoGuardado('10080'), 10080);
});

// ========== formatearTotalSemana ==========

test('formatearTotalSemana: sin objetivo → "Esta semana: 45 min"', () => {
    assert.equal(formatearTotalSemana(45, null), 'Esta semana: 45 min');
});

test('formatearTotalSemana: con objetivo → "Esta semana: 45/300 min"', () => {
    assert.equal(formatearTotalSemana(45, 300), 'Esta semana: 45/300 min');
});

test('formatearTotalSemana: acumulado 0 con objetivo → "Esta semana: 0/300 min"', () => {
    assert.equal(formatearTotalSemana(0, 300), 'Esta semana: 0/300 min');
});

// ========== formatearDetalleProgreso ==========

test('formatearDetalleProgreso: por debajo de la meta → falta', () => {
    assert.equal(formatearDetalleProgreso(45, 300), 'Te faltan 255 min para la meta.');
});

test('formatearDetalleProgreso: exactamente la meta → cumplida', () => {
    assert.equal(formatearDetalleProgreso(300, 300), 'Meta cumplida 🎉');
});

test('formatearDetalleProgreso: superada → cumplida con exceso', () => {
    assert.equal(
        formatearDetalleProgreso(350, 300),
        'Meta cumplida 🎉 Has superado la meta en 50 min.'
    );
});

test('formatearDetalleProgreso: sin objetivo → null', () => {
    assert.equal(formatearDetalleProgreso(45, null), null);
    assert.equal(formatearDetalleProgreso(0, null), null);
});

// ========== haCambiadoSemana ==========

test('haCambiadoSemana: mismo lunes → false', () => {
    const lunesGuardado = new Date(2026, 9, 5); // lun 5 oct 2026
    const hoy = new Date(2026, 9, 7);           // miércoles 7 oct 2026
    assert.equal(haCambiadoSemana(lunesGuardado, hoy), false);
});

test('haCambiadoSemana: mismo lunes distinto día (domingo) → false', () => {
    const lunesGuardado = new Date(2026, 9, 5);
    const hoy = new Date(2026, 9, 11); // domingo 11 oct 2026, misma semana
    assert.equal(haCambiadoSemana(lunesGuardado, hoy), false);
});

test('haCambiadoSemana: semana siguiente → true', () => {
    const lunesGuardado = new Date(2026, 9, 5); // lun 5 oct 2026
    const hoy = new Date(2026, 9, 12);          // lun 12 oct 2026 (semana nueva)
    assert.equal(haCambiadoSemana(lunesGuardado, hoy), true);
});

test('haCambiadoSemana: cambio de año → true', () => {
    const lunesGuardado = new Date(2026, 11, 28); // lun 28 dic 2026
    const hoy = new Date(2027, 0, 4);             // lun 4 ene 2027
    assert.equal(haCambiadoSemana(lunesGuardado, hoy), true);
});

// Rama "primera ejecución": no hay lunes guardado todavía → hay que pintar
test('haCambiadoSemana: sin lunes guardado (null o undefined) → true', () => {
    const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026
    assert.equal(haCambiadoSemana(null, hoy), true);
    assert.equal(haCambiadoSemana(undefined, hoy), true);
});

test('haCambiadoSemana: lunes guardado que no es un Date (string) → true', () => {
    const hoy = new Date(2026, 9, 7);
    assert.equal(haCambiadoSemana('2026-10-05', hoy), true);
    assert.equal(haCambiadoSemana(20261005, hoy), true);
});

// ========== esMetaCumplida (fuente única de verdad de RF-8) ==========

test('esMetaCumplida: alcanzar o superar la meta → true', () => {
    assert.equal(esMetaCumplida(300, 300), true);  // exactamente la meta
    assert.equal(esMetaCumplida(350, 300), true);  // superada
    assert.equal(esMetaCumplida(1, 1), true);      // mínimo posible
});

test('esMetaCumplida: por debajo de la meta → false', () => {
    assert.equal(esMetaCumplida(45, 300), false);
    assert.equal(esMetaCumplida(0, 100), false);
    assert.equal(esMetaCumplida(299, 300), false);
});

test('esMetaCumplida: sin objetivo (null) → nunca es cumplida', () => {
    assert.equal(esMetaCumplida(45, null), false);
    assert.equal(esMetaCumplida(0, null), false);
    assert.equal(esMetaCumplida(100000, null), false);
});

// Coherencia: el texto del detalle y la decisión deben ir siempre juntos
test('coherencia: "Meta cumplida" en el detalle sí y solo sí esMetaCumplida', () => {
    const acumulados = [0, 45, 299, 300, 301, 10080];
    const objetivos = [1, 100, 300, 10080];
    for (const objetivo of objetivos) {
        for (const acumulado of acumulados) {
            const detalle = formatearDetalleProgreso(acumulado, objetivo);
            assert.equal(
                detalle.includes('Meta cumplida'),
                esMetaCumplida(acumulado, objetivo),
                `acumulado=${acumulado}, objetivo=${objetivo}`
            );
        }
    }
});

// ========== Límites de la semana (calcularMinutosSemana) ==========

// El tope superior es el domingo, no "hoy": el domingo SÍ suma
test('calcularMinutosSemana: la sesión del domingo de la semana en curso sí suma', () => {
    const hoy = new Date(2026, 9, 7); // miércoles 7 oct 2026; semana = lun 5 – dom 11 oct
    const sesiones = [
        { fecha: '2026-10-11', minutos: 60 },   // domingo futuro de ESA semana → SÍ cuenta
        { fecha: '2026-10-12', minutos: 999 },  // lunes siguiente → NO cuenta
    ];
    assert.equal(calcularMinutosSemana(sesiones, hoy), 60);
});

// Semana que cruza el cambio de año: lun 28 dic 2026 – dom 3 ene 2027
test('calcularMinutosSemana: semana que cruza año suma dentro y excluye fuera', () => {
    const hoy = new Date(2027, 0, 2); // sábado 2 enero 2027
    const sesiones = [
        { fecha: '2026-12-30', minutos: 50 },  // miércoles de esa semana → SÍ cuenta
        { fecha: '2027-01-04', minutos: 999 }, // lunes siguiente → NO cuenta
    ];
    assert.equal(calcularMinutosSemana(sesiones, hoy), 50);
});

// ========== Trim y ceros a la izquierda ==========

test('interpretarObjetivoGuardado: recorta espacios (" 300 " → 300)', () => {
    assert.equal(interpretarObjetivoGuardado(' 300 '), 300);
    assert.equal(interpretarObjetivoGuardado('  10080  '), 10080);
});

test('validarObjetivo: acepta ceros a la izquierda ("007" → 7)', () => {
    const r = validarObjetivo('007');
    assert.equal(r.accion, 'guardar');
    assert.equal(r.minutos, 7);
    // Y el valor guardado se interpreta igual
    assert.equal(interpretarObjetivoGuardado('007'), 7);
});
