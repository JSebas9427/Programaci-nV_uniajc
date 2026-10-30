
import * as tareasRepository from "../repositories/tareas.repository.js";
import { HttpError } from "../utils/http-error.js";

export async function listTareas(userId, filters) {
  const { tareas, total } = await tareasRepository.findAllByUserId(userId, filters);

  return {
    data: tareas,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

export async function getTareaById(id, userId) {
  const tarea = await tareasRepository.findByIdAndUserId(id, userId);

  if (!tarea) {
    throw new HttpError(404, "TAREA_NOT_FOUND", "La tarea no fue encontrada.");
  }

  return tarea;
}

async function ensureMateriaAccess(materiaId, userId) {
  const exists = await tareasRepository.materiaBelongsToUser(materiaId, userId);

  if (!exists) {
    throw new HttpError(
      404,
      "MATERIA_NOT_FOUND",
      "La materia no existe o no pertenece al usuario."
    );
  }
}

export async function createTarea(userId, tarea) {
  await ensureMateriaAccess(tarea.materiaId, userId);

  const creada = await tareasRepository.createTarea(userId, tarea);

  if (!creada) {
    throw new HttpError(404, "MATERIA_NOT_FOUND", "No se pudo asociar la tarea a la materia.");
  }

  return creada;
}

export async function replaceTarea(id, userId, tarea) {
  await getTareaById(id, userId);
  await ensureMateriaAccess(tarea.materiaId, userId);

  return tareasRepository.replaceTarea(id, userId, tarea);
}

export async function updateTarea(id, userId, cambios) {
  await getTareaById(id, userId);

  if (cambios.materiaId !== undefined) {
    await ensureMateriaAccess(cambios.materiaId, userId);
  }

  return tareasRepository.patchTarea(id, userId, cambios);
}

export async function removeTarea(id, userId) {
  await getTareaById(id, userId);
  await tareasRepository.deleteTarea(id, userId);
}
