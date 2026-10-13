// ============================================================
// Lógica pura del mapa de calor por meses (sin DOM, sin efectos secundarios)
// Funciona en navegador (file://) y en Node (para tests)
// ============================================================

(function (global) {
    'use strict';

    // ---------- Utilidades de fecha ----------

    function fechaATexto(fecha) {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }

    // ---------- Funciones de navegación de meses ----------

    /**
     * Devuelve { anio, mes } del mes siguiente.
     * @param {number} anio
     * @param {number} mes - 0-11
     * @returns {{ anio: number, mes: number }}
     */
    function obtenerMesSiguiente(anio, mes) {
        if (mes === 11) {
            return { anio: anio + 1, mes: 0 };
        }
        return { anio, mes: mes + 1 };
    }

    /**
     * Devuelve { anio, mes } del mes anterior.
     * @param {number} anio
     * @param {number} mes - 0-11
     * @returns {{ anio: number, mes: number }}
     */
    function obtenerMesAnterior(anio, mes) {
        if (mes === 0) {
            return { anio: anio - 1, mes: 11 };
        }
        return { anio, mes: mes - 1 };
    }

    /**
     * Devuelve array de meses para el mapa de calor.
     * Cada mes: { anio, mes, semanas: [ [ {fecha, esFuturo, esMesActual}, ... ], ... ] }
     * @param {Date} hoy - Fecha actual (medianoche local)
     * @param {number} numMeses - Cuántos meses mostrar (1-12)
     * @param {Object|null} mesInicial - { anio, mes } desde donde empezar (null = mes actual)
     * @returns {Array}
     */
    function obtenerRangoMeses(hoy, numMeses = 3, mesInicial = null) {
        // Determinar mes inicial
        let anioActual, mesActual;
        if (mesInicial) {
            anioActual = mesInicial.anio;
            mesActual = mesInicial.mes;
        } else {
            anioActual = hoy.getFullYear();
            mesActual = hoy.getMonth();
        }

        const meses = [];

        for (let i = 0; i < numMeses; i++) {
            // Calcular año y mes para este índice
            const totalMeses = mesActual + i;
            const anio = anioActual + Math.floor(totalMeses / 12);
            const mes = totalMeses % 12;

            // Primer día del mes
            const primerDia = new Date(anio, mes, 1);
            const diaSemana = primerDia.getDay(); // 0 = domingo
            const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana; // ajustar a lunes
            const lunesPrimero = new Date(anio, mes, 1 + diferencia);

            const semanas = [];
            for (let semanaIdx = 0; ; semanaIdx++) {
                const semana = [];
                let semanaTieneDiasDelMes = false;

                for (let diaIdx = 0; diaIdx < 7; diaIdx++) {
                    const fecha = new Date(lunesPrimero);
                    fecha.setDate(fecha.getDate() + semanaIdx * 7 + diaIdx);

                    const esFuturo = fecha > hoy;
                    const esMesActual = (fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth());

                    if (fecha.getMonth() === mes) {
                        semanaTieneDiasDelMes = true;
                    }

                    semana.push({ fecha, esFuturo, esMesActual: fecha.getMonth() === mes });
                }

                // Solo agregar la semana si tiene al menos un día del mes actual
                if (!semanaTieneDiasDelMes) {
                    break;
                }
                semanas.push(semana);
            }

            meses.push({ anio, mes, semanas });
        }

        return meses;
    }

    // ---------- Agrupar sesiones por día ----------

    /**
     * Agrupa sesiones por día, sumando minutos y conservando el tema de la primera.
     * Ignora sesiones con minutos <= 0 o tema vacío.
     * @param {Array} sesiones - Array de { fecha, minutos, tema }
     * @returns {Map<string, { minutosTotales: number, temaPrimera: string }>}
     */
    function agruparSesionesPorDia(sesiones) {
        const mapa = new Map();
        for (const sesion of sesiones) {
            // Filtro: ignorar sesiones inválidas
            if (sesion.minutos <= 0 || !sesion.tema || sesion.tema.trim() === '') {
                continue;
            }
            const fechaTexto = sesion.fecha;
            if (!mapa.has(fechaTexto)) {
                mapa.set(fechaTexto, {
                    minutosTotales: 0,
                    temaPrimera: sesion.tema
                });
            }
            mapa.get(fechaTexto).minutosTotales += sesion.minutos;
        }
        return mapa;
    }

    // ---------- Clasificar día ----------

    /**
     * Clasifica un día según su estado.
     * Prioridad: futuro > estudiado > sin-estudio
     * @param {Date} fecha - Fecha del día
     * @param {boolean} esFuturo - Si el día es futuro
     * @param {Map} sesionesPorDia - Mapa de sesiones agrupadas
     * @returns {'futuro'|'estudiado'|'sin-estudio'|'vacio'}
     */
    function clasificarDia(fecha, esFuturo, sesionesPorDia, esMesActual = true) {
        if (!esMesActual) {
            return 'vacio';
        }
        if (esFuturo) {
            return 'futuro';
        }
        const fechaTexto = fechaATexto(fecha);
        if (sesionesPorDia.has(fechaTexto)) {
            return 'estudiado';
        }
        return 'sin-estudio';
    }

    // ---------- Tooltip ----------

    /**
     * Devuelve el texto del tooltip según la clasificación del día.
     * @param {Date} fecha - Fecha del día
     * @param {boolean} esFuturo - Si el día es futuro
     * @param {Map} sesionesPorDia - Mapa de sesiones agrupadas
     * @param {boolean} esMesActual - Si el día pertenece al mes actual
     * @returns {string}
     */
    function obtenerTooltip(fecha, esFuturo, sesionesPorDia, esMesActual = true) {
        if (!esMesActual) {
            return '';
        }
        const clasificacion = clasificarDia(fecha, esFuturo, sesionesPorDia, esMesActual);
        if (clasificacion === 'futuro') {
            return 'Aún no llega este día';
        }
        if (clasificacion === 'sin-estudio') {
            return 'No estudiaste este día';
        }
        if (clasificacion === 'vacio') {
            return '';
        }
        const fechaTexto = fechaATexto(fecha);
        const datos = sesionesPorDia.get(fechaTexto);
        return `${datos.minutosTotales} min · ${datos.temaPrimera}`;
    }

    // ---------- Colores ----------

    /**
     * Devuelve el color de fondo según la clasificación y el tema.
     * @param {string} clasificacion - 'futuro'|'estudiado'|'sin-estudio'|'vacio'
     * @param {string} tema - 'claro'|'oscuro'
     * @returns {string} Color hexadecimal
     */
    function obtenerColor(clasificacion, tema) {
        const colores = {
            claro: {
                'estudiado': '#E63946',
                'sin-estudio': '#E5E0D8',
                'futuro': '#F0EDE8',
                'vacio': 'transparent'
            },
            oscuro: {
                'estudiado': '#E63946',
                'sin-estudio': '#2A2A4A',
                'futuro': '#1E1E3A',
                'vacio': 'transparent'
            }
        };
        return colores[tema][clasificacion] || 'transparent';
    }

    // Exportar al globalThis (funciona en navegador y Node)
    global.obtenerRangoMeses = obtenerRangoMeses;
    global.obtenerMesSiguiente = obtenerMesSiguiente;
    global.obtenerMesAnterior = obtenerMesAnterior;
    global.agruparSesionesPorDia = agruparSesionesPorDia;
    global.clasificarDia = clasificarDia;
    global.obtenerTooltip = obtenerTooltip;
    global.obtenerColor = obtenerColor;
    global.fechaATexto = fechaATexto;

})(globalThis);