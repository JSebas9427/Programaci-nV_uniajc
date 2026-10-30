
import { request } from "./http.js";

function tareaPath(id) {
  const parsed = Number(id);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new TypeError(
      "El ID debe ser un entero mayor que cero."
    );
  }

  return `/tareas/${parsed}`;
}

export function listarTareas(filtros = {}) {
  return request("/tareas", {
    query: filtros
  });
}

export function obtenerTarea(id) {
  return request(tareaPath(id));
}

export function crearTarea(tarea) {
  return request("/tareas", {
    method: "POST",
    body: tarea
  });
}

export function reemplazarTarea(id, tarea) {
  return request(tareaPath(id), {
    method: "PUT",
    body: tarea
  });
}

export function actualizarTarea(id, cambios) {
  return request(tareaPath(id), {
    method: "PATCH",
    body: cambios
  });
}

export function eliminarTarea(id) {
  return request(tareaPath(id), {
    method: "DELETE"
  });
}
