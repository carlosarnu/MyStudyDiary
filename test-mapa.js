// Tests para logica-mapa.js
// Ejecutar con: node --test test-mapa.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Cargar logica-mapa.js (IIFE que asigna a globalThis)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const codigo = readFileSync(join(__dirname, 'logica-mapa.js'), 'utf8');
eval(codigo);

// Importar las funciones desde globalThis
const {
    obtenerRangoMeses,
    obtenerMesSiguiente,
    obtenerMesAnterior,
    agruparSesionesPorDia,
    clasificarDia,
    obtenerTooltip,
    obtenerColor
} = globalThis;

// ========== obtenerRangoMeses ==========

test('obtenerRangoMeses: devuelve 3 meses por defecto', () => {
    const hoy = new Date(2026, 9, 7); // 7 oct 2026
    const rango = obtenerRangoMeses(hoy, 3);
    assert.equal(rango.length, 3);
});

test('obtenerRangoMeses: cada mes tiene semanas completas', () => {
    const hoy = new Date(2026, 9, 7);
    const rango = obtenerRangoMeses(hoy, 3);
    for (const mes of rango) {
        assert.ok(mes.semanas.length >= 4); // al menos 4 semanas
        for (const semana of mes.semanas) {
            assert.equal(semana.length, 7); // 7 días por semana
        }
    }
});

test('obtenerRangoMeses: marca días futuros correctamente', () => {
    const hoy = new Date(2026, 9, 7); // 7 oct 2026
    const rango = obtenerRangoMeses(hoy, 3);
    // Verificar que hay días futuros en el mes actual
    const mesActual = rango[0];
    const hayFuturos = mesActual.semanas.some(semana => 
        semana.some(d => d.esFuturo && d.esMesActual)
    );
    assert.equal(hayFuturos, true);
});

test('obtenerRangoMeses: cruce de año (diciembre -> enero)', () => {
    const hoy = new Date(2026, 11, 15); // 15 dic 2026
    const rango = obtenerRangoMeses(hoy, 3); // dic 2026, ene 2027, feb 2027
    assert.equal(rango.length, 3);
    assert.equal(rango[0].anio, 2026);
    assert.equal(rango[0].mes, 11); // diciembre
    assert.equal(rango[1].anio, 2027);
    assert.equal(rango[1].mes, 0); // enero
    assert.equal(rango[2].anio, 2027);
    assert.equal(rango[2].mes, 1); // febrero
});

test('obtenerRangoMeses: mesInicial personalizado', () => {
    const hoy = new Date(2026, 9, 7);
    const rango = obtenerRangoMeses(hoy, 2, { anio: 2026, mes: 0 }); // enero 2026
    assert.equal(rango.length, 2);
    assert.equal(rango[0].anio, 2026);
    assert.equal(rango[0].mes, 0); // enero
    assert.equal(rango[1].anio, 2026);
    assert.equal(rango[1].mes, 1); // febrero
});

// ========== obtenerMesSiguiente / obtenerMesAnterior ==========

test('obtenerMesSiguiente: caso normal', () => {
    const resultado = obtenerMesSiguiente(2026, 5); // junio
    assert.equal(resultado.anio, 2026);
    assert.equal(resultado.mes, 6); // julio
});

test('obtenerMesSiguiente: diciembre a enero', () => {
    const resultado = obtenerMesSiguiente(2026, 11); // diciembre
    assert.equal(resultado.anio, 2027);
    assert.equal(resultado.mes, 0); // enero
});

test('obtenerMesAnterior: caso normal', () => {
    const resultado = obtenerMesAnterior(2026, 5); // junio
    assert.equal(resultado.anio, 2026);
    assert.equal(resultado.mes, 4); // mayo
});

test('obtenerMesAnterior: enero a diciembre', () => {
    const resultado = obtenerMesAnterior(2026, 0); // enero
    assert.equal(resultado.anio, 2025);
    assert.equal(resultado.mes, 11); // diciembre
});

// ========== agruparSesionesPorDia ==========

test('agruparSesionesPorDia: agrupa y suma minutos', () => {
    const sesiones = [
        { fecha: '2026-10-05', minutos: 30, tema: 'Matemáticas' },
        { fecha: '2026-10-05', minutos: 45, tema: 'Física' }
    ];
    const resultado = agruparSesionesPorDia(sesiones);
    assert.equal(resultado.get('2026-10-05').minutosTotales, 75);
});

test('agruparSesionesPorDia: ignora sesiones con minutos <= 0', () => {
    const sesiones = [
        { fecha: '2026-10-05', minutos: 0, tema: 'Matemáticas' },
        { fecha: '2026-10-05', minutos: -10, tema: 'Física' }
    ];
    const resultado = agruparSesionesPorDia(sesiones);
    assert.equal(resultado.size, 0);
});

test('agruparSesionesPorDia: ignora sesiones con tema vacío', () => {
    const sesiones = [
        { fecha: '2026-10-05', minutos: 30, tema: '' },
        { fecha: '2026-10-05', minutos: 30, tema: '   ' }
    ];
    const resultado = agruparSesionesPorDia(sesiones);
    assert.equal(resultado.size, 0);
});

test('agruparSesionesPorDia: conserva tema de primera sesión', () => {
    const sesiones = [
        { fecha: '2026-10-05', minutos: 30, tema: 'Matemáticas' },
        { fecha: '2026-10-05', minutos: 45, tema: 'Física' }
    ];
    const resultado = agruparSesionesPorDia(sesiones);
    assert.equal(resultado.get('2026-10-05').temaPrimera, 'Matemáticas');
});

// ========== clasificarDia ==========

test('clasificarDia: futuro tiene prioridad sobre estudiado', () => {
    const fecha = new Date(2026, 9, 10);
    const sesionesPorDia = new Map([
        ['2026-10-10', { minutosTotales: 60, temaPrimera: 'Matemáticas' }]
    ]);
    const resultado = clasificarDia(fecha, true, sesionesPorDia);
    assert.equal(resultado, 'futuro');
});

test('clasificarDia: estudiado cuando hay sesión', () => {
    const fecha = new Date(2026, 9, 5);
    const sesionesPorDia = new Map([
        ['2026-10-05', { minutosTotales: 60, temaPrimera: 'Matemáticas' }]
    ]);
    const resultado = clasificarDia(fecha, false, sesionesPorDia, true);
    assert.equal(resultado, 'estudiado');
});

test('clasificarDia: sin-estudio cuando no hay sesión', () => {
    const fecha = new Date(2026, 9, 5);
    const sesionesPorDia = new Map();
    const resultado = clasificarDia(fecha, false, sesionesPorDia, true);
    assert.equal(resultado, 'sin-estudio');
});

test('clasificarDia: vacio cuando no es mes actual', () => {
    const fecha = new Date(2026, 8, 15); // septiembre
    const sesionesPorDia = new Map();
    const resultado = clasificarDia(fecha, false, sesionesPorDia, false);
    assert.equal(resultado, 'vacio');
});

test('clasificarDia: vacio tiene prioridad aunque sea futuro', () => {
    const fecha = new Date(2026, 9, 10);
    const sesionesPorDia = new Map();
    const resultado = clasificarDia(fecha, true, sesionesPorDia, false);
    assert.equal(resultado, 'vacio');
});

// ========== obtenerTooltip ==========

test('obtenerTooltip: texto para día futuro', () => {
    const fecha = new Date(2026, 9, 10);
    const sesionesPorDia = new Map();
    const resultado = obtenerTooltip(fecha, true, sesionesPorDia, true);
    assert.equal(resultado, 'Aún no llega este día');
});

test('obtenerTooltip: texto para día sin estudio', () => {
    const fecha = new Date(2026, 9, 5);
    const sesionesPorDia = new Map();
    const resultado = obtenerTooltip(fecha, false, sesionesPorDia, true);
    assert.equal(resultado, 'No estudiaste este día');
});

test('obtenerTooltip: formato X min · Tema para día estudiado', () => {
    const fecha = new Date(2026, 9, 5);
    const sesionesPorDia = new Map([
        ['2026-10-05', { minutosTotales: 60, temaPrimera: 'Matemáticas' }]
    ]);
    const resultado = obtenerTooltip(fecha, false, sesionesPorDia, true);
    assert.equal(resultado, '60 min · Matemáticas');
});

test('obtenerTooltip: vacío para día de mes anterior/siguiente en grid', () => {
    const fecha = new Date(2026, 8, 28); // día de septiembre que aparece en grid de octubre
    const sesionesPorDia = new Map();
    const resultado = obtenerTooltip(fecha, false, sesionesPorDia, false);
    assert.equal(resultado, '');
});

// ========== obtenerColor ==========

test('obtenerColor: color para estudiado en tema claro', () => {
    const color = obtenerColor('estudiado', 'claro');
    assert.equal(color, '#E63946');
});

test('obtenerColor: color para sin-estudio en tema claro', () => {
    const color = obtenerColor('sin-estudio', 'claro');
    assert.equal(color, '#E5E0D8');
});

test('obtenerColor: color para futuro en tema claro', () => {
    const color = obtenerColor('futuro', 'claro');
    assert.equal(color, '#F0EDE8');
});

test('obtenerColor: color para vacio en tema claro', () => {
    const color = obtenerColor('vacio', 'claro');
    assert.equal(color, 'transparent');
});

test('obtenerColor: color para estudiado en tema oscuro', () => {
    const color = obtenerColor('estudiado', 'oscuro');
    assert.equal(color, '#E63946');
});

test('obtenerColor: color para sin-estudio en tema oscuro', () => {
    const color = obtenerColor('sin-estudio', 'oscuro');
    assert.equal(color, '#2A2A4A');
});

test('obtenerColor: color para futuro en tema oscuro', () => {
    const color = obtenerColor('futuro', 'oscuro');
    assert.equal(color, '#1E1E3A');
});

test('obtenerColor: color para vacio en tema oscuro', () => {
    const color = obtenerColor('vacio', 'oscuro');
    assert.equal(color, 'transparent');
});