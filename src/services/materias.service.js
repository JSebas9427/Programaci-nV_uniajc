import * as materiasRepository from "../repositories/materias.respositorio.js";
import { HttpError } from "../utils/http-error.js";

export async function listMaterias(userId, filters) {
  const { materias, total } = await materiasRepository.findAllByUserId(userId, filters);

  return {
    data: materias,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

/** 
* Valida que el código y el nombre de una materia sean únicos para un usuario específico.
* 
* @async
* @function ensureUniqueFields
* @param {string|number} userId - Identificador único del usuario dueño de la materia.
* @param {Object} materia - Objeto que contiene los datos de la materia a validar.
* @param {string} [materia.codigo] - Código identificador de la materia (opcional).
* @param {string} [materia.nombre] - Nombre de la materia (opcional).
* @param {string|number} [excludeId] - ID de una materia existente a excluir de la validación (útil en actualizaciones).
* 
* @returns {Promise} No retorna ningún valor si las validaciones son exitosas.
* 
* @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
* @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
*/
export async function getMateriaById(id, userId) {
 const materia = await materiasRepository.findByIdAndUserId(id, userId);
 if (!materia) {
   throw new HttpError(404, "MATERIA_NOT_FOUND", "La materia no fue encontrada");
 }
 return materia;
}
/**
 * Valida que los datos de la materia sean únicos para el usuario
 * y posteriormente crea la materia en el repositorio.
 *
 * @async
 * @function createMateria
 * @param {string|number} userId - Identificador único del usuario propietario de la materia.
 * @param {Object} materia - Datos de la materia que se desea crear.
 * @param {string} materia.codigo - Código identificador de la materia.
 * @param {string} materia.nombre - Nombre de la materia.
 * @param {string} materia.color - Color asociado a la materia.
 * @param {number} materia.creditos - Número de créditos de la materia.
 * @param {boolean} materia.activa - Indica si la materia se encuentra activa.
 *
 * @returns {Promise<Object|null>} Materia creada con todos sus datos.
 *
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si ya existe una materia
 * con el mismo código para el usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si ya existe una materia
 * con el mismo nombre para el usuario.
 * @throws {Error} Error generado por el repositorio si ocurre un problema
 * al crear la materia en la base de datos.
 */
export async function createMateria(userId, materia) {
  await ensureUniqueFields(userId, materia);
  return materiasRepository.createMateria(userId, materia);
}


/**
 * Valida que el código y el nombre de una materia sean únicos
 * para un usuario específico.
 *
 * @async
 * @function ensureUniqueFields
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} materia - Objeto que contiene los datos de la materia a validar.
 * @param {string} [materia.codigo] - Código identificador de la materia.
 * @param {string} [materia.nombre] - Nombre de la materia.
 * @param {string|number} [excludeId] - ID de una materia existente a excluir de la validación,
 * útil durante actualizaciones.
 *
 * @returns {Promise<void>} No retorna ningún valor si las validaciones son exitosas.
 *
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado
 * para el usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado
 * para el usuario.
 */
async function ensureUniqueFields(userId, materia, excludeId) {
  if (materia.codigo) {
    const duplicatedCode = await materiasRepository.existsByCode(userId, materia.codigo, excludeId);

    if (duplicatedCode) {
      throw new HttpError(409, "DUPLICATE_CODE", "Ya existe una materia con ese código.");
    }
  }

  if (materia.nombre) {
    const duplicatedName = await materiasRepository.existsByName(userId, materia.nombre, excludeId);

    if (duplicatedName) {
      throw new HttpError(409, "DUPLICATE_NAME", "Ya existe una materia con ese nombre.");
    }
  }
}
/**
 * Obtiene las tareas de una materia perteneciente al usuario.
 *
 * @async
 * @function getTareasByMateria
 * @param {number} userId - Identificador del usuario autenticado.
 * @param {number} materiaId - Identificador de la materia.
 *
 * @returns {Promise<Array>} Lista de tareas de la materia.
 */
export async function getTareasByMateria(userId, materiaId) {
    return materiasRepository.findTareasByMateriaId(
        materiaId,
        userId
    );
}
/**
 * Obtiene los eventos de una materia perteneciente a un usuario.
 *
 * @async
 * @function getEventosByMateria
 * @param {number} userId - Identificador del usuario propietario de la materia.
 * @param {number} materiaId - Identificador de la materia.
 *
 * @returns {Promise<Array>} Lista de eventos asociados a la materia.
 */
export async function getEventosByMateria(userId, materiaId) {
    return materiasRepository.findEventosByMateriaAndUserId(
        materiaId,
        userId
    );
}