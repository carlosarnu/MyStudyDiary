// ============================================================
// Diario de Estudio - Lógica principal
// ============================================================

const CLAVE_SESIONES = "diarioEstudio.sesiones";
const CLAVE_TEMA = "diarioEstudio.tema";
const CLAVE_OBJETIVO = "diarioEstudio.objetivo";

// Lunes de la semana que se está pintando ahora mismo (RF-6).
// Se fija en renderizar() y se compara en cada tick del reloj para saber
// cuándo ha llegado una semana nueva.
let semanaMostrada;

// ---------- Utilidades de fecha (siempre hora local) ----------

// Devuelve la fecha de hoy como texto "YYYY-MM-DD" en hora local
function hoyComoTexto() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const dia = String(ahora.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

// Convierte un texto "YYYY-MM-DD" a un Date local (medianoche local)
function textoAFecha(texto) {
    const [anio, mes, dia] = texto.split("-").map(Number);
    return new Date(anio, mes - 1, dia);
}

// Compara dos fechas ignorando la hora (mismo día = true)
function esMismoDia(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

// ---------- Cargar y guardar datos ----------

function cargarSesiones() {
    const datos = localStorage.getItem(CLAVE_SESIONES);
    if (!datos) return [];
    try {
        return JSON.parse(datos);
    } catch {
        return [];
    }
}

function guardarSesiones(sesiones) {
    localStorage.setItem(CLAVE_SESIONES, JSON.stringify(sesiones));
}

// ---------- Objetivo semanal (persistencia) ----------

// Devuelve el objetivo guardado en minutos, o null si no existe o no es válido
// (valor corrupto → estado "sin objetivo", sin errores: RF-2 y RF-9)
function cargarObjetivo() {
    return interpretarObjetivoGuardado(localStorage.getItem(CLAVE_OBJETIVO));
}

// Guarda el objetivo como entero plano ("250"), sin JSON
function guardarObjetivo(minutos) {
    localStorage.setItem(CLAVE_OBJETIVO, String(minutos));
}

function eliminarObjetivo() {
    localStorage.removeItem(CLAVE_OBJETIVO);
}

// Escribe el objetivo actual en el campo de la tarjeta.
// Se llama solo al cargar y tras guardar/eliminar: NUNCA desde renderizar(),
// porque renderizar() se dispara al crear o editar sesiones y pisaría
// lo que el usuario esté escribiendo.
function reflejarObjetivoEnCampo() {
    const campo = document.getElementById("objetivo-minutos");
    const objetivo = cargarObjetivo();
    campo.value = objetivo == null ? "" : String(objetivo);
}

// ---------- Calcular la racha ----------

function calcularRacha(sesiones) {
    if (sesiones.length === 0) return 0;

    // Conjunto de días que tienen al menos una sesión (como texto YYYY-MM-DD)
    const diasConSesion = new Set(sesiones.map((s) => s.fecha));

    // Empezamos desde hoy. Si hoy no hay sesión, empezamos desde ayer
    // (la racha sigue viva hasta que termine el día).
    const hoy = new Date();
    let diaActual = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    if (!diasConSesion.has(fechaATexto(diaActual))) {
        diaActual.setDate(diaActual.getDate() - 1);
    }

    // Contamos días consecutivos hacia atrás
    let racha = 0;
    while (diasConSesion.has(fechaATexto(diaActual))) {
        racha++;
        diaActual.setDate(diaActual.getDate() - 1);
    }

    return racha;
}

// Helper: Date -> "YYYY-MM-DD" local
function fechaATexto(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

// ---------- Calcular la mejor racha ----------

function calcularMejorRacha(sesiones) {
    if (sesiones.length === 0) return 0;

    // Conjunto de días únicos con sesión
    const diasUnicos = [...new Set(sesiones.map((s) => s.fecha))].sort();

    // Identificar el día que cierra la racha viva (hoy o ayer)
    const hoy = new Date();
    const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
    const textoHoy = fechaATexto(hoy);
    const textoAyer = fechaATexto(ayer);

    // Encontrar todas las secuencias de días consecutivos
    let mejorRacha = 0;
    let rachaActual = 1;

    for (let i = 1; i < diasUnicos.length; i++) {
        const fechaAnterior = textoAFecha(diasUnicos[i - 1]);
        const fechaActual = textoAFecha(diasUnicos[i]);

        // Verificar si son días consecutivos (diferencia exacta de 1 día)
        const diffMs = fechaActual.getTime() - fechaAnterior.getTime();
        const diffDias = diffMs / (1000 * 60 * 60 * 24);

        if (diffDias === 1) {
            rachaActual++;
        } else {
            // La secuencia se rompió. Verificar si NO es la racha viva
            // (la racha viva termina hoy o ayer)
            const textoAnterior = diasUnicos[i - 1];
            if (textoAnterior !== textoHoy && textoAnterior !== textoAyer) {
                mejorRacha = Math.max(mejorRacha, rachaActual);
            }
            rachaActual = 1;
        }
    }

    // Verificar la última secuencia
    const ultimoDia = diasUnicos[diasUnicos.length - 1];
    if (ultimoDia !== textoHoy && ultimoDia !== textoAyer) {
        mejorRacha = Math.max(mejorRacha, rachaActual);
    }

    return mejorRacha;
}

// ---------- Calcular minutos de la semana ----------
// El cálculo vive en logica-objetivo.js: calcularMinutosSemana(sesiones, hoy)
// suma de lunes a domingo (las fechas futuras dentro de la semana SÍ cuentan).

// ---------- Calcular días estudiados este mes ----------

function calcularDiasMes(sesiones) {
    if (sesiones.length === 0) return 0;

    // Mes y año actual en hora local
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    // Contar días únicos con sesión en el mes actual
    const diasUnicos = new Set();
    for (const sesion of sesiones) {
        const fecha = textoAFecha(sesion.fecha);
        if (fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual) {
            diasUnicos.add(sesion.fecha);
        }
    }

    return diasUnicos.size;
}

// ---------- Mostrar datos en pantalla ----------

function mostrarRacha(racha) {
    document.getElementById("racha-dias").textContent = racha;
}

function mostrarMejorRacha(mejorRacha) {
    document.getElementById("mejor-racha-dias").textContent = mejorRacha;
}

// Pinta el total semanal y el detalle de progreso junto a la meta (RF-3, RF-8, RF-9)
function mostrarMinutosSemana(acumulado, objetivo) {
    document.getElementById("minutos-semana").textContent =
        formatearTotalSemana(acumulado, objetivo);

    const detalle = document.getElementById("progreso-detalle");
    if (objetivo == null) {
        // Sin objetivo: el detalle queda oculto y sin indicador de meta cumplida
        detalle.hidden = true;
        detalle.classList.remove("cumplida");
    } else {
        detalle.textContent = formatearDetalleProgreso(acumulado, objetivo);
        // RF-8: el indicador aparece al alcanzar/superar la meta y desaparece
        // si el progreso vuelve a quedar por debajo. La decisión es única:
        // esMetaCumplida (logica-objetivo.js) es la misma que da el texto de arriba
        detalle.classList.toggle("cumplida", esMetaCumplida(acumulado, objetivo));
        detalle.hidden = false;
    }
}

// Muestra u oculta la invitación a fijar objetivo (RF-9)
function mostrarInvitacionObjetivo(objetivo) {
    document.getElementById("objetivo-vacio").hidden = objetivo != null;
}

function mostrarDiasMes(dias) {
    document.getElementById("dias-mes").textContent = `${dias} días este mes`;
}

function formatearFecha(textoFecha) {
    const fecha = textoAFecha(textoFecha);
    return fecha.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

// ---------- Validación y edición de sesiones ----------

function validarSesion(datos) {
    if (!datos.fecha) {
        return { valido: false, error: "La fecha es obligatoria." };
    }
    if (!datos.tema || datos.tema.trim() === "") {
        return { valido: false, error: "El tema es obligatorio." };
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

// Pinta la lista del historial con las sesiones visibles (ya filtradas por
// pintarHistorial) y gestiona los dos mensajes excluyentes (RF-6):
// - sin ninguna visible y sin ninguna guardada → aviso de historial vacío;
// - sin ninguna visible pero con guardadas (filtro sin coincidencias) →
//   #aviso-busqueda con el texto exacto de "sin resultados";
// - con visibles → ambos mensajes apagados y la región viva vacía (RF-11).
// Nunca escribe en el campo de búsqueda (RF-2).
function mostrarSesiones(sesionesVisibles, totalGuardadas) {
    const lista = document.getElementById("lista-sesiones");
    const avisoVacio = document.getElementById("sin-sesiones");
    const avisoBusqueda = document.getElementById("aviso-busqueda");

    lista.innerHTML = "";

    if (sesionesVisibles.length === 0) {
        if (totalGuardadas === 0) {
            // Gana el aviso de historial vacío aunque haya texto (RF-6)
            avisoVacio.style.display = "block";
            avisoBusqueda.textContent = "";
        } else {
            // Hay sesiones guardadas pero ninguna coincide: no se muestra el
            // aviso de vacío, porque el usuario ve un filtro activo (RF-6)
            avisoVacio.style.display = "none";
            avisoBusqueda.textContent =
                "No se encontraron sesiones que coincidan con la búsqueda.";
        }
        return;
    }

    avisoVacio.style.display = "none";
    avisoBusqueda.textContent = ""; // con resultados la región queda vacía (RF-11)

    // Ordenar de más reciente a más antigua
    const ordenadas = [...sesionesVisibles].sort((a, b) => {
        if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
        return b.id - a.id; // misma fecha: la última registrada primero
    });

    for (const sesion of ordenadas) {
        const item = document.createElement("li");

        const info = document.createElement("div");
        info.className = "sesion-info";

        const tema = document.createElement("div");
        tema.className = "sesion-tema";
        tema.textContent = sesion.tema;

        const detalle = document.createElement("div");
        detalle.className = "sesion-detalle";
        detalle.textContent = formatearFecha(sesion.fecha);

        const hora = document.createElement("div");
        hora.className = "sesion-hora";
        hora.textContent = sesion.hora ? sesion.hora : "";

        const minutos = document.createElement("span");
        minutos.className = "sesion-minutos";
        minutos.textContent = `${sesion.minutos} min`;

        // Botón editar
        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "btn-editar";
        btnEditar.dataset.id = sesion.id;
        btnEditar.setAttribute("aria-label", "Editar sesión");
        btnEditar.textContent = "✎";

        info.appendChild(tema);
        info.appendChild(detalle);
        info.appendChild(hora);
        item.appendChild(info);
        item.appendChild(minutos);
        item.appendChild(btnEditar);
        lista.appendChild(item);
    }
}

// Aplica el texto del buscador a las sesiones y pinta solo la lista visible
// (RF-2, RF-5). El campo se LEE (campoBusqueda.value) y NUNCA se escribe: el
// texto que esté escribiendo el usuario se conserva tal cual en cada pintado.
function pintarHistorial(sesiones) {
    const campoBusqueda = document.getElementById("buscador");
    mostrarSesiones(
        filtrarSesiones(sesiones, campoBusqueda.value),
        sesiones.length
    );
}

// Repinta únicamente la lista del historial y su mensaje a partir de los datos
// guardados. Es el repintado mínimo del evento "input" (RF-2): no recalcula ni
// repinta mapa, rachas, totales ni objetivo (RF-8, todos con sesiones completas).
function renderizarHistorial() {
    pintarHistorial(cargarSesiones());
}

// Intro en el campo: el form de búsqueda existe solo por su semántica
// (role="search"); su envío se cancela para que la página no se recargue ni
// se mande nada (RF-2, caso límite). Con el filtro ya aplicado por el
// "input", basta con repintar la lista.
function manejarSubmitBusqueda(evento) {
    evento.preventDefault();
    renderizarHistorial();
}

// Botón "Limpiar búsqueda" (RF-7): vaciar el campo de una sola acción +
// repintar (campo vacío = historial completo, RF-5) + devolver el foco al
// campo para seguir escribiendo de inmediato (RF-11). Solo toca el campo y la
// lista: no se acerca a #form-sesion ni a su modo edición (RF-9).
function limpiarBusqueda() {
    const campoBusqueda = document.getElementById("buscador");
    campoBusqueda.value = "";
    renderizarHistorial();
    campoBusqueda.focus();
}

// ---------- Modo oscuro ----------

function cargarTema() {
    const temaGuardado = localStorage.getItem(CLAVE_TEMA);
    if (temaGuardado === "oscuro" || temaGuardado === "claro") {
        return temaGuardado;
    }
    // Primera visita: respetar la preferencia del sistema
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "oscuro";
    }
    return "claro";
}

function aplicarTema(tema) {
    if (tema === "oscuro") {
        document.documentElement.setAttribute("data-tema", "oscuro");
        document.getElementById("boton-tema").textContent = "☀️";
    } else {
        document.documentElement.setAttribute("data-tema", "claro");
        document.getElementById("boton-tema").textContent = "🌙";
    }
}

function alternarTema() {
    const temaActual = document.documentElement.getAttribute("data-tema") === "oscuro" ? "oscuro" : "claro";
    const nuevoTema = temaActual === "oscuro" ? "claro" : "oscuro";
    aplicarTema(nuevoTema);
    localStorage.setItem(CLAVE_TEMA, nuevoTema);
}

// ---------- Reloj en vivo ----------

function actualizarReloj() {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, "0");
    const minutos = String(ahora.getMinutes()).padStart(2, "0");
    const segundos = String(ahora.getSeconds()).padStart(2, "0");
    document.getElementById("reloj").textContent = `${horas}:${minutos}:${segundos}`;
}

// ---------- Mapa de calor por meses ----------

const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function renderizarMapa(sesiones, tema) {
    const contenedor = document.getElementById("mapa-calor");
    const tooltip = document.getElementById("tooltip");
    contenedor.innerHTML = "";

    const hoy = new Date();
    const numMeses = parseInt(document.getElementById("num-meses").value, 10) || 3;
    const mesInicialStr = document.getElementById("mes-actual").dataset.mesInicial;
    const mesInicial = mesInicialStr ? JSON.parse(mesInicialStr) : null;

    const rango = obtenerRangoMeses(hoy, numMeses, mesInicial);
    const sesionesPorDia = agruparSesionesPorDia(sesiones);

    // Actualizar controles de navegación
    actualizarControlesNavegacion(rango, mesInicial);

    for (const mesObj of rango) {
        const mesContenedor = document.createElement("div");
        mesContenedor.className = "mapa-mes";

        // Cabecera del mes
        const cabecera = document.createElement("div");
        cabecera.className = "mapa-mes-cabecera";
        cabecera.textContent = `${NOMBRES_MESES[mesObj.mes]} ${mesObj.anio}`;
        mesContenedor.appendChild(cabecera);

        // Etiquetas de días
        const etiquetas = document.createElement("div");
        etiquetas.className = "mapa-mes-fechas";
        for (const d of ['L', 'M', 'X', 'J', 'V', 'S', 'D']) {
            const span = document.createElement("span");
            span.textContent = d;
            etiquetas.appendChild(span);
        }
        mesContenedor.appendChild(etiquetas);

        // Grid del mes
        const grid = document.createElement("div");
        grid.className = "mapa-mes-grid";

        for (const semana of mesObj.semanas) {
            for (const dia of semana) {
                const clasificacion = clasificarDia(dia.fecha, dia.esFuturo, sesionesPorDia, dia.esMesActual);
                const color = obtenerColor(clasificacion, tema);
                const textoTooltip = obtenerTooltip(dia.fecha, dia.esFuturo, sesionesPorDia, dia.esMesActual);

                const celda = document.createElement("div");
                celda.className = `celda ${clasificacion}`;
                celda.textContent = dia.fecha.getDate();
                celda.style.backgroundColor = color;
                celda.dataset.fecha = fechaATexto(dia.fecha);

                // Eventos de tooltip
                celda.addEventListener("mouseenter", (e) => {
                    if (clasificacion !== 'vacio') {
                        tooltip.textContent = textoTooltip;
                        tooltip.hidden = false;
                        const rect = celda.getBoundingClientRect();
                        tooltip.style.left = `${rect.left + window.scrollX}px`;
                        tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 4}px`;
                    }
                });
                celda.addEventListener("mouseleave", () => {
                    tooltip.hidden = true;
                });
                celda.addEventListener("touchstart", (e) => {
                    if (clasificacion !== 'vacio') {
                        e.preventDefault();
                        tooltip.textContent = textoTooltip;
                        tooltip.hidden = false;
                        const rect = celda.getBoundingClientRect();
                        tooltip.style.left = `${rect.left + window.scrollX}px`;
                        tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 4}px`;
                    }
                });

                grid.appendChild(celda);
            }
        }

        mesContenedor.appendChild(grid);
        contenedor.appendChild(mesContenedor);
    }
}

function actualizarControlesNavegacion(rango, mesInicial) {
    const btnPrev = document.getElementById("btn-mes-prev");
    const btnNext = document.getElementById("btn-mes-next");
    const mesActualEl = document.getElementById("mes-actual");

    if (rango.length === 0) return;

    const primerMes = rango[0];
    const ultimoMes = rango[rango.length - 1];

    mesActualEl.textContent = `${NOMBRES_MESES[primerMes.mes]} ${primerMes.anio}`;
    if (rango.length > 1) {
        mesActualEl.textContent += ` – ${NOMBRES_MESES[ultimoMes.mes]} ${ultimoMes.anio}`;
    }

    // Guardar mesInicial para navegación
    mesActualEl.dataset.mesInicial = JSON.stringify({ anio: primerMes.anio, mes: primerMes.mes });
}

// ---------- Inicialización ----------

function iniciar() {
    const form = document.getElementById("form-sesion");
    const inputFecha = document.getElementById("fecha");
    const inputTema = document.getElementById("tema");
    const inputMinutos = document.getElementById("minutos");
    const mensajeError = document.getElementById("mensaje-error");
    const botonTema = document.getElementById("boton-tema");
    const btnPrev = document.getElementById("btn-mes-prev");
    const btnNext = document.getElementById("btn-mes-next");
    const selectMeses = document.getElementById("num-meses");
    const btnGuardar = document.getElementById("btn-guardar");
    const btnCancelar = document.getElementById("btn-cancelar");

    // Por defecto, la fecha de hoy
    inputFecha.value = hoyComoTexto();

    // Aplicar tema guardado o del sistema
    aplicarTema(cargarTema());

    // Mostrar el objetivo guardado en la tarjeta (solo al cargar)
    reflejarObjetivoEnCampo();

    // Reloj en vivo (cada segundo) + control de cambio de semana (RF-6)
    actualizarReloj();
    setInterval(() => {
        actualizarReloj();
        comprobarCambioSemana();
    }, 1000);

    // Tarjeta de objetivo: submit de su propio formulario (RF-1, RF-7)
    document.getElementById("form-objetivo").addEventListener("submit", manejarSubmitObjetivo);

    // Botón de tema
    botonTema.addEventListener("click", alternarTema);

    // Navegación del mapa
    btnPrev.addEventListener("click", () => navegarMes(-1));
    btnNext.addEventListener("click", () => navegarMes(1));
    selectMeses.addEventListener("change", () => renderizar());

    // Buscador del historial (spec 004, T5): filtrado inmediato al escribir o
    // borrar (RF-2). Solo se repinta la lista visible y su mensaje
    // (renderizarHistorial); mapa y estadísticas no se recalculan (RF-8).
    document.getElementById("buscador").addEventListener("input", renderizarHistorial);

    // Buscador (spec 004, T6): Intro no envía ni recarga (RF-2) y el botón
    // "Limpiar búsqueda" vacía, repinta y devuelve el foco al campo (RF-7).
    // Ninguno de los dos toca el modo edición de la spec 002 (RF-9); el campo
    // se ve siempre (sin ocultar el botón, decisión de T3).
    document.getElementById("form-busqueda").addEventListener("submit", manejarSubmitBusqueda);
    document.getElementById("btn-limpiar").addEventListener("click", limpiarBusqueda);

    function navegarMes(direccion) {
        const mesActualEl = document.getElementById("mes-actual");
        const mesInicialStr = mesActualEl.dataset.mesInicial;
        if (!mesInicialStr) return;

        const mesInicial = JSON.parse(mesInicialStr);
        const numMeses = parseInt(document.getElementById("num-meses").value, 10) || 3;
        
        let nuevoMes = mesInicial.mes + direccion;
        let nuevoAnio = mesInicial.anio;
        
        if (nuevoMes < 0) {
            nuevoMes = 11;
            nuevoAnio--;
        } else if (nuevoMes > 11) {
            nuevoMes = 0;
            nuevoAnio++;
        }

        // Actualizar el mesInicial en el DOM y renderizar
        mesActualEl.dataset.mesInicial = JSON.stringify({ anio: nuevoAnio, mes: nuevoMes });
        
        renderizar();
    }

    function salirModoEdicion() {
        delete form.dataset.editandoId;
        btnGuardar.textContent = "Guardar sesión";
        btnGuardar.classList.remove("guardando");
        btnCancelar.hidden = true;
        form.classList.remove("editando");
        limpiarFormulario();
    }

    function limpiarFormulario() {
        inputTema.value = "";
        inputMinutos.value = "";
        inputFecha.value = hoyComoTexto();
        mensajeError.textContent = "";
    }

    function ponerFormularioEnModoEdicion(sesion) {
        inputFecha.value = sesion.fecha;
        inputTema.value = sesion.tema;
        inputMinutos.value = sesion.minutos;
        form.dataset.editandoId = sesion.id;
        btnGuardar.textContent = "Guardar cambios";
        btnGuardar.classList.add("guardando");
        btnCancelar.hidden = false;
        form.classList.add("editando");
        inputFecha.focus();
    }

    function manejarClickEditar(id) {
        const sesiones = cargarSesiones();
        const sesion = obtenerSesionPorId(sesiones, id);
        if (sesion) {
            ponerFormularioEnModoEdicion(sesion);
        }
    }

    function manejarCancelar() {
        salirModoEdicion();
    }

    // ---------- Tarjeta de objetivo (RF-1, RF-7, RF-10) ----------
    // Este submit es de #form-objetivo: un formulario propio, ajeno a
    // #form-sesion, así que no toca el botón "Guardar sesión"/"Guardar cambios"
    // ni el modo edición de la spec 002 (decisión 2C).

    const campoObjetivo = document.getElementById("objetivo-minutos");

    // En Chrome las letras no llegan al value de un input type="number": se
    // descartan y el campo queda como estaba. Si estaba vacío, el submit
    // parecería "vacío = eliminar" y borraría el objetivo sin avisar (RF-10),
    // así que se recuerda que se intentó escribir algo que no es un número.
    let entradaNoNumerica = false;

    campoObjetivo.addEventListener("keydown", (evento) => {
        // Atajos (Ctrl+C…) y teclas de edición o navegación no cuentan
        if (evento.ctrlKey || evento.metaKey || evento.key.length > 1) {
            // Al borrar, el usuario vuelve a tomar el control del valor
            if (evento.key === "Backspace" || evento.key === "Delete") {
                entradaNoNumerica = false;
            }
            return;
        }
        if (!/[0-9]/.test(evento.key)) {
            entradaNoNumerica = true;
        }
    });

    // Pegar texto que no sea un número entero también es entrada no válida
    campoObjetivo.addEventListener("paste", (evento) => {
        const pegado = evento.clipboardData ? evento.clipboardData.getData("text") : "";
        if (!/^\d+$/.test(pegado.trim())) {
            entradaNoNumerica = true;
        }
    });

    // Si el valor acaba en un número entero, la entrada vuelve a ser válida
    // y manda lo que diga validarObjetivo
    campoObjetivo.addEventListener("input", () => {
        if (/^\d+$/.test(campoObjetivo.value)) {
            entradaNoNumerica = false;
        }
    });

    function manejarSubmitObjetivo(evento) {
        evento.preventDefault();

        const errorObjetivo = document.getElementById("objetivo-error");

        // Se pasa un texto no numérico a validarObjetivo para reutilizar su
        // mensaje de rechazo exacto (RF-10) sin duplicar el texto en app.js
        const hayEntradaNoNumerica = entradaNoNumerica || campoObjetivo.validity.badInput;
        const resultado = validarObjetivo(hayEntradaNoNumerica ? "abc" : campoObjetivo.value);

        if (resultado.accion === "rechazar") {
            // Texto exacto de RF-10; el objetivo anterior queda intacto
            errorObjetivo.textContent = resultado.error;
            return;
        }

        // Sin error: se limpia el aviso previo (vacío = eliminar, no es error)
        errorObjetivo.textContent = "";

        if (resultado.accion === "eliminar") {
            eliminarObjetivo();
        } else {
            guardarObjetivo(resultado.minutos);
        }

        reflejarObjetivoEnCampo(); // el campo refleja lo guardado (o queda vacío)
        renderizar();              // la vista se actualiza sin recargar (RF-7)
    }

    // ---------- Detección de cambio de semana (RF-6) ----------
    // Se añade al tick del reloj que ya existe (1 s): comparar un par de fechas
    // cada segundo es negligible y evita crear otro temporizador.
    function comprobarCambioSemana() {
        if (haCambiadoSemana(semanaMostrada, new Date())) {
            renderizar(); // semana nueva, mismo objetivo
        }
    }

    function renderizar() {
        const sesiones = cargarSesiones();
        const objetivo = cargarObjetivo(); // se relee en cada pintado (una sola fuente de verdad)
        const hoy = new Date();
        const tema = document.documentElement.getAttribute("data-tema") || "claro";
        mostrarRacha(calcularRacha(sesiones));
        mostrarMejorRacha(calcularMejorRacha(sesiones));
        mostrarMinutosSemana(calcularMinutosSemana(sesiones, hoy), objetivo);
        mostrarInvitacionObjetivo(objetivo);
        // RF-6: se recuerda qué semana se está pintando (medianoche local)
        semanaMostrada = obtenerRangoSemana(hoy).lunes;
        mostrarDiasMes(calcularDiasMes(sesiones));
        // La lista visible se pinta aplicando el texto del buscador (RF-2);
        // el resto de estadísticas de arriba siguen con sesiones completas (RF-8)
        pintarHistorial(sesiones);
        renderizarMapa(sesiones, tema);
    }

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();
        mensajeError.textContent = "";

        const fecha = inputFecha.value;
        const tema = inputTema.value.trim();
        const minutos = Number(inputMinutos.value);

        // Validaciones
        const validacion = validarSesion({ fecha, tema, minutos });
        if (!validacion.valido) {
            mensajeError.textContent = validacion.error;
            return;
        }

        const ahora = new Date();

        const sesiones = cargarSesiones();

        // Modo edición
        if (form.dataset.editandoId) {
            const id = Number(form.dataset.editandoId);
            const sesionesActualizadas = actualizarSesion(sesiones, id, { fecha, tema, minutos });
            guardarSesiones(sesionesActualizadas);
            salirModoEdicion();
            renderizar();
            return;
        }

        // Modo creación
        const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
        sesiones.push({
            id: Date.now(),
            fecha: fecha,
            hora: hora,
            tema: tema,
            minutos: minutos,
        });
        guardarSesiones(sesiones);

        // Limpiar campos (fecha vuelve a hoy)
        limpiarFormulario();

        renderizar();
    });

    // Botón cancelar
    btnCancelar.addEventListener("click", salirModoEdicion);

    // Delegación de eventos para botones editar en historial
    document.getElementById("lista-sesiones").addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-editar");
        if (btn) {
            const id = Number(btn.dataset.id);
            manejarClickEditar(id);
        }
    });

    renderizar();
}

iniciar();
