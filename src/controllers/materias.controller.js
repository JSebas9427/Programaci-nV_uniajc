import * as materiasService from "../services/materias.service.js";
import { sendNoContent, sendSuccess} from "../utils/api-response.js";

import {
    validateCreateMateria,
    validateMateriaId,
    validateMateriaListQuery,
    validatePatchMateria
} from "../validators/materias.validator.js";

/**

Obtiene una lista de materias pertenecientes al usuario autenticado,
aplicando los filtros enviados en la solicitud.


@async
@function listMaterias
@param {Object} request - Objeto de solicitud HTTP de Express.
@param {Object} request.query - Parámetros de consulta utilizados para filtrar las materias.
@param {Object} request.user - Usuario autenticado asociado a la solicitud.
@param {string|number} request.user.id - Identificador único del usuario autenticado.
@param {Object} response - Objeto de respuesta HTTP de Express.
@param {Function} next - Función de Express utilizada para delegar el manejo de errores.


@returns {Promise<Object>} Respuesta HTTP con la lista de materias y sus metadatos.


@throws {HttpError} Error de validación si los parámetros de consulta no son válidos.

@throws {HttpError} Error generado por el servicio al consultar las materias.
*/
export async function listMaterias(request, response, next) {

try {
const filters = validateMateriaListQuery(request.query);
const result = await materiasService.listMaterias(request.user.id, filters);
return sendSuccess(response, result.data, 200, result.meta);

} catch (error) {
return next(error);
}
}

/**

Obtiene una materia específica mediante su identificador,
verificando que pertenezca al usuario autenticado.


@async
@function getMaterias
@param {Object} request - Objeto de solicitud HTTP de Express.
@param {Object} request.params - Parámetros incluidos en la URL de la solicitud.
@param {string|number} request.params.id - Identificador de la materia que se desea consultar.
@param {Object} request.user - Usuario autenticado asociado a la solicitud.
@param {string|number} request.user.id - Identificador único del usuario autenticado.
@param {Object} response - Objeto de respuesta HTTP de Express.
@param {Function} next - Función de Express utilizada para delegar el manejo de errores.


@returns {Promise<Object>} Respuesta HTTP con la información de la materia solicitada.


@throws {HttpError} Error de validación si el identificador de la materia no es válido.
@throws {HttpError} Error generado por el servicio si la materia no existe
o no pertenece al usuario autenticado.
*/
export async function getMaterias(request, response, next) {
try {
const id = validateMateriaId(request.params.id);
const result = await materiasService.getMateriaById(id, request.user.id);
return sendSuccess(response, result);
} catch (error) {
return next(error);
}

}

/**

Crea una nueva materia asociada al usuario autenticado.


@async
@function createMateria
@param {Object} request - Objeto de solicitud HTTP de Express.
@param {Object} request.body - Datos enviados para crear la materia.
@param {Object} request.user - Usuario autenticado asociado a la solicitud.
@param {string|number} request.user.id - Identificador único del usuario autenticado.
@param {Object} response - Objeto de respuesta HTTP de Express.
@param {Function} next - Función de Express utilizada para delegar el manejo de errores.


@returns {Promise<Object>} Respuesta HTTP con la materia creada y código de estado 201.


@throws {HttpError} Error de validación si los datos enviados en el cuerpo de la solicitud no son válidos.
@throws {HttpError} Error generado por el servicio si no es posible crear la materia.
*/
export async function createMateria(request, response, next) {
try {
const payload = validateCreateMateria(request.body);
const materia = await materiasService.createMateria(request.user.id, payload);
return sendSuccess(response, materia, 201);
} catch (error) {
return next(error);
}
}

/**
 * Obtiene las tareas asociadas a una materia.
 *
 * @async
 * @function getTareasByMateria
 * @param {import("express").Request} request - Objeto de solicitud HTTP.
 * @param {import("express").Response} response - Objeto de respuesta HTTP.
 * @param {import("express").NextFunction} next - Función para manejar errores.
 *
 * @returns {Promise<void>} Envía las tareas de la materia.
 */
export async function getTareasByMateria(request, response, next) {
    try {
        const materiaId = validateMateriaId(request.params.id);

        const tareas = await materiasService.getTareasByMateria(
            request.user.id,
            materiaId
        );

        return sendSuccess(response, tareas);
    } catch (error) {
        return next(error);
    }
}
/**
 * Obtiene los eventos asociados a una materia.
 *
 * @async
 * @function getEventosByMateria
 * @param {import("express").Request} request - Objeto de solicitud HTTP.
 * @param {import("express").Response} response - Objeto de respuesta HTTP.
 * @param {import("express").NextFunction} next - Función para manejar errores.
 *
 * @returns {Promise<void>} Envía los eventos de la materia.
 */
export async function getEventosByMateria(request, response, next) {
    try {
        const materiaId = validateMateriaId(request.params.id);

        const eventos = await materiasService.getEventosByMateria(
            request.user.id,
            materiaId
        );

        return sendSuccess(response, eventos);
    } catch (error) {
        return next(error);
    }
}