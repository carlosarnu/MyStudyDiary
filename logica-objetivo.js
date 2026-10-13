// ============================================================
// Lógica pura del objetivo semanal (sin DOM, sin localStorage)
// Funciona en navegador (file://) y en Node (para tests)
// ============================================================

(function (global) {
    'use strict';

    // Límites del objetivo: de 1 minuto a una semana completa (10080 min)
    const MINIMO_OBJETIVO = 1;
    const MAXIMO_OBJETIVO = 10080;
    const MENSAJE_RECHAZO = 'Introduce un número entero entre 1 y 10080 minutos.';

    // ---------- Utilidades de fecha ----------

    // Convierte un texto "YYYY-MM-DD" a un Date local (medianoche local).
    // Helper local para que el archivo sea autocontenido (nunca new Date("AAAA-MM-DD"):
    // eso se interpretaría en UTC y desplazaría el día).
    function textoAFecha(texto) {
        const [anio, mes, dia] = texto.split('-').map(Number);
        return new Date(anio, mes - 1, dia);
    }

    // ---------- Semana en curso ----------

    /**
     * Devuelve { lunes, domingo } (Date locales a medianoche) de la semana de "hoy".
     * Semana de lunes a domingo; si hoy es domingo, la semana empezó el lunes anterior.
     * @param {Date} hoy - Fecha de referencia (con hora da igual: se usa solo el día)
     * @returns {{ lunes: Date, domingo: Date }}
     */
    function obtenerRangoSemana(hoy) {
        const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, ...
        const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana; // ajuste a lunes
        const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diferencia);
        const domingo = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6);
        return { lunes, domingo };
    }

    /**
     * Suma los minutos de las sesiones de la semana en curso (de lunes a domingo).
     * Decisión 1B: el tope superior es el domingo, no "hoy": las sesiones con fecha
     * futura dentro de la semana en curso SÍ cuentan.
     * @param {Array} sesiones - Array de { fecha, minutos, ... }
     * @param {Date} hoy - Fecha de referencia
     * @returns {number}
     */
    function calcularMinutosSemana(sesiones, hoy) {
        const { lunes, domingo } = obtenerRangoSemana(hoy);
        let total = 0;
        for (const sesion of sesiones) {
            const fecha = textoAFecha(sesion.fecha);
            if (fecha >= lunes && fecha <= domingo) {
                total += sesion.minutos;
            }
        }
        return total;
    }

    // ---------- Validación e interpretación del objetivo ----------

    /**
     * Valida lo que el usuario escribe en la tarjeta de objetivo.
     * @param {string} texto - Valor introducido en el campo
     * @returns {{ accion: 'guardar', minutos: number }
     *          | { accion: 'eliminar' }
     *          | { accion: 'rechazar', error: string }}
     */
    function validarObjetivo(texto) {
        const limpio = String(texto).trim();

        // Campo vacío o solo espacios: no es error, elimina el objetivo
        if (limpio === '') {
            return { accion: 'eliminar' };
        }

        // Solo dígitos y dentro del rango: se guarda
        if (/^\d+$/.test(limpio)) {
            const minutos = Number(limpio);
            if (minutos >= MINIMO_OBJETIVO && minutos <= MAXIMO_OBJETIVO) {
                return { accion: 'guardar', minutos };
            }
        }

        return { accion: 'rechazar', error: MENSAJE_RECHAZO };
    }

    /**
     * Convierte el valor guardado en localStorage a un objetivo válido o null.
     * Cualquier valor no válido (vacío, texto, decimales, fuera de rango, corrupto)
     * se interpreta como "sin objetivo": nunca lanza errores.
     * @param {string|number|null|undefined} valorCrudo - Valor leído de localStorage
     * @returns {number|null}
     */
    function interpretarObjetivoGuardado(valorCrudo) {
        if (valorCrudo === null || valorCrudo === undefined) return null;

        const limpio = String(valorCrudo).trim();
        if (!/^\d+$/.test(limpio)) return null;

        const minutos = Number(limpio);
        if (minutos < MINIMO_OBJETIVO || minutos > MAXIMO_OBJETIVO) return null;

        return minutos;
    }

    // ---------- Textos de la interfaz ----------

    /**
     * Texto del total semanal, con y sin objetivo.
     * @param {number} acumulado - Minutos acumulados en la semana
     * @param {number|null} objetivo - Minutos de la meta (null = sin objetivo)
     * @returns {string}
     */
    function formatearTotalSemana(acumulado, objetivo) {
        if (objetivo == null) {
            return `Esta semana: ${acumulado} min`;
        }
        return `Esta semana: ${acumulado}/${objetivo} min`;
    }

    /**
     * Decide si el acumulado alcanza o supera el objetivo (RF-8).
     * Es la ÚNICA fuente de verdad del indicador "meta cumplida": la usan tanto
     * formatearDetalleProgreso (el texto) como app.js (la clase .cumplida), para
     * que texto y estilo no puedan divergir.
     * @param {number} acumulado - Minutos acumulados en la semana
     * @param {number|null} objetivo - Minutos de la meta (null = sin objetivo)
     * @returns {boolean}
     */
    function esMetaCumplida(acumulado, objetivo) {
        if (objetivo == null) return false; // sin objetivo nunca hay meta que cumplir
        return acumulado >= objetivo;
    }

    /**
     * Detalle de progreso junto al total semanal.
     * @param {number} acumulado - Minutos acumulados en la semana
     * @param {number|null} objetivo - Minutos de la meta (null = sin objetivo)
     * @returns {string|null} - null si no hay objetivo
     */
    function formatearDetalleProgreso(acumulado, objetivo) {
        if (objetivo == null) return null;

        if (!esMetaCumplida(acumulado, objetivo)) {
            return `Te faltan ${objetivo - acumulado} min para la meta.`;
        }
        if (acumulado === objetivo) {
            return 'Meta cumplida 🎉';
        }
        return `Meta cumplida 🎉 Has superado la meta en ${acumulado - objetivo} min.`;
    }

    // ---------- Cambio de semana ----------

    /**
     * Comprueba si "hoy" pertenece a una semana distinta de la guardada.
     * @param {Date|null} lunesGuardado - Lunes de la semana que se está mostrando
     * @param {Date} hoy - Fecha actual
     * @returns {boolean} true si hay que repintar (semana nueva o nada guardado)
     */
    function haCambiadoSemana(lunesGuardado, hoy) {
        if (!(lunesGuardado instanceof Date)) return true; // primera ejecución
        const { lunes } = obtenerRangoSemana(hoy);
        return (
            lunes.getFullYear() !== lunesGuardado.getFullYear() ||
            lunes.getMonth() !== lunesGuardado.getMonth() ||
            lunes.getDate() !== lunesGuardado.getDate()
        );
    }

    // Exportar al globalThis (funciona en navegador y Node)
    global.obtenerRangoSemana = obtenerRangoSemana;
    global.calcularMinutosSemana = calcularMinutosSemana;
    global.validarObjetivo = validarObjetivo;
    global.interpretarObjetivoGuardado = interpretarObjetivoGuardado;
    global.formatearTotalSemana = formatearTotalSemana;
    global.formatearDetalleProgreso = formatearDetalleProgreso;
    global.esMetaCumplida = esMetaCumplida;
    global.haCambiadoSemana = haCambiadoSemana;

})(globalThis);
