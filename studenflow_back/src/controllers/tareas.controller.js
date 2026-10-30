
import * as tareasService from "../services/tareas.service.js";
import { sendNoContent, sendSuccess } from "../utils/api-response.js";
import {
  validateCreateTarea,
  validatePatchTarea,
  validateTareaId,
  validateTareaListQuery
} from "../validators/tareas.validators.js";

export async function listTareas(request, response, next) {
  try {
    const filters = validateTareaListQuery(request.query);
    const result = await tareasService.listTareas(request.user.id, filters);
    return sendSuccess(response, result.data, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

export async function getTarea(request, response, next) {
  try {
    const id = validateTareaId(request.params.id);
    const tarea = await tareasService.getTareaById(id, request.user.id);
    return sendSuccess(response, tarea);
  } catch (error) {
    return next(error);
  }
}

export async function createTarea(request, response, next) {
  try {
    const payload = validateCreateTarea(request.body);
    const tarea = await tareasService.createTarea(request.user.id, payload);
    return sendSuccess(response, tarea, 201);
  } catch (error) {
    return next(error);
  }
}

export async function replaceTarea(request, response, next) {
  try {
    const id = validateTareaId(request.params.id);
    const payload = validateCreateTarea(request.body);
    const tarea = await tareasService.replaceTarea(id, request.user.id, payload);
    return sendSuccess(response, tarea);
  } catch (error) {
    return next(error);
  }
}

export async function updateTarea(request, response, next) {
  try {
    const id = validateTareaId(request.params.id);
    const payload = validatePatchTarea(request.body);
    const tarea = await tareasService.updateTarea(id, request.user.id, payload);
    return sendSuccess(response, tarea);
  } catch (error) {
    return next(error);
  }
}

export async function deleteTarea(request, response, next) {
  try {
    const id = validateTareaId(request.params.id);
    await tareasService.removeTarea(id, request.user.id);
    return sendNoContent(response);
  } catch (error) {
    return next(error);
  }
}
