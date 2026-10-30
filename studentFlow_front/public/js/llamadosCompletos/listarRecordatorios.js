

import {
  listarRecordatorios,
  marcarRecordatorioLeido,
  eliminarRecordatorio,
  actualizarRecordatorio
} from "../api/recordatorios.js";

import { listarTareas } from "../api/tareas.js";


const formulario = document.querySelector("#filtros-recordatorios");
const cuerpoTabla = document.querySelector("#recordatorios-body");
const mensajeEstado = document.querySelector("#estado");
const resumenPaginacion = document.querySelector("#paginacion");
const botonRecargar = document.querySelector("#recargar-recordatorios");
const botonAnterior = document.querySelector("#pagina-anterior");
const botonSiguiente = document.querySelector("#pagina-siguiente");


const panelEditar = document.querySelector("#panel-editar-recordatorio");
const formularioEditar = document.querySelector("#form-editar-recordatorio");
const selectorTareasEditar = document.querySelector("#editar-tarea-recordatorio");
const estadoEditar = document.querySelector("#estado-editar-recordatorio");
const botonGuardarEdicion = document.querySelector("#guardar-cambios-recordatorio");
const botonCancelarEdicion = document.querySelector("#cancelar-edicion-recordatorio");


let paginaActual = 1;
const limite = 20;
let totalPaginas = 0;

function mostrarEstado(mensaje, tipo) {
  mensajeEstado.textContent = mensaje;
  mensajeEstado.dataset.type = tipo;
}

function crearCelda(valor) {
  const celda = document.createElement("td");
  celda.textContent = valor ?? "—";
  return celda;
}

function formatoFecha(fecha) {
  if (!fecha) return "—";

  const fechaParseada = new Date(fecha);

  if (Number.isNaN(fechaParseada.getTime())) {
    return fecha;
  }

  return fechaParseada.toLocaleString("es-CO");
}


function agregarAccion(fila, recordatorio) {
  const celda = document.createElement("td");

  // 1. Acción para marcar como leído.
  if (!recordatorio.leido) {
    const botonLeer = document.createElement("button");

    botonLeer.type = "button";
    botonLeer.textContent = "Marcar leído";

    botonLeer.addEventListener("click", async () => {
      botonLeer.disabled = true;

      try {
        await marcarRecordatorioLeido(recordatorio.id);
        await cargarRecordatorios();
      } catch (error) {
        console.error("Error al marcar como leído:", error);

        mostrarEstado(
          `No se pudo marcar como leído: ${error.message}`,
          "error"
        );

        botonLeer.disabled = false;
      }
    });

    celda.append(botonLeer);
  }

  // 2. Acción para editar.
  const botonEditar = document.createElement("button");

  botonEditar.type = "button";
  botonEditar.textContent = "Editar";

  botonEditar.addEventListener("click", () => {
    abrirFormularioEdicion(recordatorio);
  });

  celda.append(botonEditar);

  // 3. Acción para eliminar.
  const botonEliminar = document.createElement("button");

  botonEliminar.type = "button";
  botonEliminar.textContent = "Eliminar";

  botonEliminar.addEventListener("click", async () => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el recordatorio #${recordatorio.id}?`
    );

    if (!confirmar) return;

    botonEliminar.disabled = true;

    try {
      await eliminarRecordatorio(recordatorio.id);

      mostrarEstado(
        "Recordatorio eliminado correctamente.",
        "success"
      );

      await cargarRecordatorios();
    } catch (error) {
      console.error("Error al eliminar recordatorio:", error);

      mostrarEstado(
        `No se pudo eliminar el recordatorio: ${error.message}`,
        "error"
      );

      botonEliminar.disabled = false;
    }
  });

  celda.append(botonEliminar);

  // Agregar la celda a la fila una sola vez.
  fila.append(celda);
}



function renderizarRecordatorios(recordatorios) {
  cuerpoTabla.replaceChildren();

  for (const recordatorio of recordatorios) {
    const fila = document.createElement("tr");

    fila.append(
      crearCelda(recordatorio.id),
      crearCelda(recordatorio.mensaje),
      crearCelda(recordatorio.tareaTitulo),
      crearCelda(recordatorio.materiaNombre),
      crearCelda(formatoFecha(recordatorio.fechaHora)),
      crearCelda(
        recordatorio.canal === "in_app"
          ? "En la aplicación"
          : recordatorio.canal
      ),
      crearCelda(recordatorio.leido ? "Leído" : "Pendiente")
    );

    agregarAccion(fila, recordatorio);
    cuerpoTabla.append(fila);
  }
}

async function cargarRecordatorios() {
  botonRecargar.disabled = true;
  botonAnterior.disabled = true;
  botonSiguiente.disabled = true;

  mostrarEstado("Consultando recordatorios…", "loading");
  cuerpoTabla.replaceChildren();
  resumenPaginacion.textContent = "";

  const datosFormulario = new FormData(formulario);

  const filtros = {
    page: paginaActual,
    limit: limite,
    sort: "fechaHora",
    order: "desc",
    search: datosFormulario.get("search")?.trim() ?? ""
  };

  const canal = datosFormulario.get("canal");
  const leido = datosFormulario.get("leido");

  if (canal) filtros.canal = canal;
  if (leido !== "") filtros.leido = leido;

  try {
    const resultado = await listarRecordatorios(filtros);
    const recordatorios = resultado.data ?? [];
    const meta = resultado.meta ?? {};

    totalPaginas = Number(meta.pages ?? 0);

    renderizarRecordatorios(recordatorios);

    if (recordatorios.length === 0) {
      mostrarEstado("No se encontraron recordatorios.", "success");
    } else {
      mostrarEstado("Recordatorios consultados correctamente.", "success");
    }

    resumenPaginacion.textContent =
      `Página ${meta.page ?? paginaActual} de ${totalPaginas}. ` +
      `Total: ${meta.total ?? recordatorios.length} recordatorios.`;

    botonAnterior.disabled = paginaActual <= 1;
    botonSiguiente.disabled =
      totalPaginas === 0 || paginaActual >= totalPaginas;
  } catch (error) {
    console.error("Error al consultar recordatorios:", error);

    mostrarEstado(
      `No se pudieron consultar los recordatorios: ${error.message}`,
      "error"
    );
  } finally {
    botonRecargar.disabled = false;
  }
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  paginaActual = 1;
  cargarRecordatorios();
});

botonRecargar.addEventListener("click", cargarRecordatorios);

botonAnterior.addEventListener("click", () => {
  if (paginaActual > 1) {
    paginaActual--;
    cargarRecordatorios();
  }
});

botonSiguiente.addEventListener("click", () => {
  if (paginaActual < totalPaginas) {
    paginaActual++;
    cargarRecordatorios();
  }
});

function mostrarEstadoEdicion(mensaje, tipo) {
  estadoEditar.textContent = mensaje;
  estadoEditar.dataset.type = tipo;
}

async function cargarTareasParaEdicion(tareaSeleccionada) {
  selectorTareasEditar.replaceChildren();

  const opcionInicial = document.createElement("option");
  opcionInicial.value = "";
  opcionInicial.textContent = "Selecciona una tarea";
  selectorTareasEditar.append(opcionInicial);

  const resultado = await listarTareas({
    page: 1,
    limit: 100
  });

  const tareas = resultado.data ?? [];

  for (const tarea of tareas) {
    const opcion = document.createElement("option");
    opcion.value = String(tarea.id);
    opcion.textContent = `${tarea.titulo} — ${tarea.materiaNombre}`;
    selectorTareasEditar.append(opcion);
  }

  selectorTareasEditar.value = String(tareaSeleccionada ?? "");

  if (!selectorTareasEditar.value) {
    throw new Error(
      "No se encontró la tarea asociada. Comprueba que siga disponible."
    );
  }
}

function convertirFechaParaFormulario(fechaHora) {
  if (!fechaHora) return "";

  // Permite convertir una fecha SQL o ISO al formato de datetime-local.
  const fecha = String(fechaHora).replace(" ", "T").slice(0, 16);

  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fecha)
    ? fecha
    : "";
}

async function abrirFormularioEdicion(recordatorio) {
  panelEditar.hidden = false;
  formularioEditar.reset();
  botonGuardarEdicion.disabled = true;
  mostrarEstadoEdicion("Cargando datos del recordatorio…", "loading");

  try {
    await cargarTareasParaEdicion(recordatorio.tareaId);

    formularioEditar.elements.id.value = recordatorio.id;
    formularioEditar.elements.tareaId.value = String(recordatorio.tareaId ?? "");
    formularioEditar.elements.mensaje.value = recordatorio.mensaje ?? "";
    formularioEditar.elements.fechaHora.value =
      convertirFechaParaFormulario(recordatorio.fechaHora);
    formularioEditar.elements.canal.value = recordatorio.canal ?? "in_app";

    if (!formularioEditar.elements.fechaHora.value) {
      throw new Error(
        "La fecha del recordatorio no tiene un formato válido para editarse."
      );
    }

    botonGuardarEdicion.disabled = false;
    mostrarEstadoEdicion("Modifica los campos que necesites.", "success");
    panelEditar.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error("Error al preparar la edición:", error);
    mostrarEstadoEdicion(error.message, "error");
  }
}

function cerrarFormularioEdicion() {
  panelEditar.hidden = true;
  formularioEditar.reset();
  mostrarEstadoEdicion("", "");
}

botonCancelarEdicion.addEventListener("click", cerrarFormularioEdicion);

formularioEditar.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!formularioEditar.reportValidity()) return;

  const datos = new FormData(formularioEditar);

  const id = Number(datos.get("id"));
  const tareaId = Number(datos.get("tareaId"));
  const mensaje = String(datos.get("mensaje") ?? "").trim();
  const fechaHora = String(datos.get("fechaHora") ?? "");
  const canal = String(datos.get("canal") ?? "");

  if (!Number.isSafeInteger(id) || id < 1) {
    mostrarEstadoEdicion("El ID del recordatorio no es válido.", "error");
    return;
  }

  if (!Number.isSafeInteger(tareaId) || tareaId < 1) {
    mostrarEstadoEdicion("Selecciona una tarea válida.", "error");
    return;
  }

  if (!mensaje || mensaje.length > 255) {
    mostrarEstadoEdicion(
      "El mensaje debe contener entre 1 y 255 caracteres.",
      "error"
    );
    return;
  }

  if (!["in_app", "email"].includes(canal)) {
    mostrarEstadoEdicion("Selecciona un canal válido.", "error");
    return;
  }

  botonGuardarEdicion.disabled = true;
  mostrarEstadoEdicion("Guardando cambios…", "loading");

  try {
    await actualizarRecordatorio(id, {
      tareaId,
      mensaje,
      fechaHora: `${fechaHora.replace("T", " ")}:00`,
      canal
    });

    mostrarEstadoEdicion(
      "Recordatorio actualizado correctamente.",
      "success"
    );

    cerrarFormularioEdicion();
    await cargarRecordatorios();
  } catch (error) {
    console.error("Error al actualizar el recordatorio:", error);
    mostrarEstadoEdicion(
      `No se pudieron guardar los cambios: ${error.message}`,
      "error"
    );
  } finally {
    botonGuardarEdicion.disabled = false;
  }
});

cargarRecordatorios();
