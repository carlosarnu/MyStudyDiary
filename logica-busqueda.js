// ============================================================
// Lógica pura del buscador del historial (spec 004)
// Sin DOM, sin localStorage, sin reloj: el mes se deduce del
// string "AAAA-MM-DD" con regex/slice, nunca con Date (así no
// hay zona horaria que desplace el día).
// Funciona en navegador (file://) y en Node (para tests)
// ============================================================

(function (global) {
    'use strict';

    // Nombres de los meses en español, en minúsculas y con la
    // misma grafía que usa la app ("septiembre", no "setiembre").
    // Array propio: el archivo debe ser autocontenido (RF-10).
    const NOMBRES_MESES = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    // ---------- Normalización de texto ----------

    /**
     * Normaliza un texto para compararlo sin mayúsculas ni tildes (RF-4):
     * quita espacios de los extremos, pasa a minúsculas y elimina los
     * diacríticos (á, é, í, ó, ú, ü, ñ → a, e, i, o, u, u, n).
     * Los guiones NO se tocan: las fechas "2026-10" exigen los dos.
     * @param {*} texto - Cualquier cosa; lo que no sea string devuelve ""
     * @returns {string}
     */
    function normalizarTexto(texto) {
        if (typeof texto !== 'string') return '';
        return texto
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036F]/g, '');
    }

    // ---------- Helpers de fecha (internos, no se exportan) ----------

    /**
     * ¿Es un string con forma de fecha "AAAA-MM-DD", mes 1-12 y día 1-31?
     * No usa Date: solo expresión regular sobre el texto.
     * Cualquier otra cosa (vacío, "abc", undefined, "2026-13-05") → false,
     * sin lanzar excepción: esa sesión no participa en la búsqueda por fecha.
     * @param {*} fecha - Campo fecha de la sesión
     * @returns {boolean}
     */
    function esFechaValida(fecha) {
        if (typeof fecha !== 'string') return false;
        const partes = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (partes === null) return false;
        const mes = Number(partes[2]);
        const dia = Number(partes[3]);
        return mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31;
    }

    /**
     * Nombre del mes en español de una fecha "AAAA-MM-DD" válida,
     * deducido del propio string (sin Date, sin UTC).
     * @param {string} fecha - Fecha ya comprobada con esFechaValida
     * @returns {string}
     */
    function nombreMesDeFecha(fecha) {
        const mes = Number(fecha.slice(5, 7));
        return NOMBRES_MESES[mes - 1];
    }

    // ---------- Filtrado ----------

    /**
     * Devuelve las sesiones que coinciden con el texto de búsqueda (RF-3).
     * - Texto vacío (o solo espacios): todas, en copia y en el mismo orden.
     * - Coincide si el tema normalizado contiene la búsqueda, o si la fecha
     *   es válida y (la fecha contiene la búsqueda o el nombre del mes
     *   EMPIEZA por la búsqueda: "oct" sí, "tob" no).
     * No muta el array de entrada ni ordena: el orden del historial lo
     * aplica la interfaz.
     * @param {Array} sesiones - Array de { fecha, tema, ... }
     * @param {*} texto - Texto escrito en el buscador
     * @returns {Array} Array nuevo con las coincidencias
     */
    function filtrarSesiones(sesiones, texto) {
        if (!Array.isArray(sesiones)) return [];

        const busqueda = normalizarTexto(texto);
        // Sin filtro: se ve todo el historial (RF-5)
        if (busqueda === '') return sesiones.filter(() => true);

        return sesiones.filter((sesion) =>
            normalizarTexto(sesion.tema).includes(busqueda) ||
            (
                esFechaValida(sesion.fecha) &&
                (
                    normalizarTexto(sesion.fecha).includes(busqueda) ||
                    nombreMesDeFecha(sesion.fecha).startsWith(busqueda)
                )
            )
        );
    }

    // Exportar al globalThis (funciona en navegador y Node)
    global.normalizarTexto = normalizarTexto;
    global.filtrarSesiones = filtrarSesiones;

})(globalThis);
