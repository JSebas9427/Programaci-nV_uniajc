
import { crearRecordatorio } from "../api/recordatorios.js";
import { listarTareas } from "../api/tareas.js";

const formulario = document.querySelector("#form-crear-recordatorio");
const selectorTareas = document.querySelector("#tarea-recordatorio");
const mensajeEstado = document.querySelector("#estado-crear-recordatorio");
const botonGuardar = document.querySelector("#guardar-recordatorio");

function mostrarEstado(mensaje, tipo) {
  mensajeEstado.textContent = mensaje;
  mensajeEstado.dataset.type = tipo;
}

async function cargarTareas() {
  selectorTareas.replaceChildren();

  const opcionInicial = document.createElement("option");
  opcionInicial.value = "";
  opcionInicial.textContent = "Selecciona una tarea";
  selectorTareas.append(opcionInicial);

  try {
    const resultado = await listarTareas({
      page: 1,
      limit: 100,
      sort: "fechaEntrega",
      order: "asc"
    });

    const tareas = resultado.data ?? [];

    for (const tarea of tareas) {
      const opcion = document.createElement("option");
      opcion.value = String(tarea.id);
      opcion.textContent = `${tarea.titulo} — ${tarea.materiaNombre}`;
      selectorTareas.append(opcion);
    }

    if (tareas.length === 0) {
      mostrarEstado(
        "No hay tareas disponibles. Crea una tarea antes de registrar un recordatorio.",
        "error"
      );
      selectorTareas.disabled = true;
      botonGuardar.disabled = true;
    } else {
      selectorTareas.disabled = false;
      botonGuardar.disabled = false;
    }
  } catch (error) {
    console.error("Error al cargar tareas:", error);

    mostrarEstado(
      `No se pudieron cargar las tareas: ${error.message}`,
      "error"
    );

    selectorTareas.disabled = true;
    botonGuardar.disabled = true;
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!formulario.reportValidity()) return;

  const datos = new FormData(formulario);
  const fechaHora = datos.get("fechaHora");

  const recordatorio = {
    tareaId: Number(datos.get("tareaId")),
    mensaje: datos.get("mensaje").trim(),
    fechaHora: fechaHora.replace("T", " ") + ":00",
    canal: datos.get("canal"),
    leido: false
  };

  if (!recordatorio.mensaje) {
    mostrarEstado("El mensaje no puede estar vacío.", "error");
    return;
  }

  botonGuardar.disabled = true;
  mostrarEstado("Creando recordatorio...", "loading");

  try {
    await crearRecordatorio(recordatorio);

    mostrarEstado("Recordatorio creado correctamente.", "success");
    formulario.reset();

    // Actualiza el listado si está abierto en esta misma página.
    document.querySelector("#recargar-recordatorios")?.click();
  } catch (error) {
    console.error("Error al crear recordatorio:", error);

    mostrarEstado(
      `No se pudo crear el recordatorio: ${error.message}`,
      "error"
    );
  } finally {
    botonGuardar.disabled = false;
  }
});

cargarTareas();
