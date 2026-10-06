import { pool } from "../config/database.js";

/**
 * Define los campos permitidos para ordenar las materias.
 *
 * @constant
 * @type {Object<string, string>}
 */
const sortableFields = {
    id: "m.id_materia",
    nombre: "m.nombre",
    codigo: "m.codigo",
    creditos: "m.creditos",
    color: "m.color",
    activa: "m.activa",
    createdAt: "m.created_at",
    updatedAt: "m.updated_at"
};

/**
 * Normaliza los parámetros utilizados para ordenar las materias.
 *
 * @function normalizeSort
 * @param {string} sort - Campo por el cual se desea ordenar.
 * @param {string} order - Dirección del ordenamiento: "asc" o "desc".
 *
 * @returns {string} Expresión SQL con la columna y dirección de ordenamiento.
 */
function normalizeSort(sort, order) {
    const column = sortableFields[sort] || sortableFields.nombre;
    const direction = String(order).toLocaleLowerCase() === "desc"
        ? "DESC"
        : "ASC";

    return `${column} ${direction}`;
}
/**
 * Convierte una fila de la base de datos en un objeto de materia.
 *
 * @function mapMateria
 * @param {Object} row - Fila obtenida de la base de datos.
 * @param {string|number} row.id - Identificador de la materia.
 * @param {string} row.nombre - Nombre de la materia.
 * @param {string} row.codigo - Código de la materia.
 * @param {number} row.creditos - Número de créditos de la materia.
 * @param {string} row.color - Color asociado a la materia.
 * @param {boolean|number} row.activa - Estado de la materia.
 * @param {string|Date} row.created_at - Fecha de creación de la materia.
 * @param {string|Date} row.updated_at - Fecha de última actualización de la materia.
 *
 * @returns {Object} Objeto de materia con los datos normalizados.
 */
function mapMateria(row) {
    return {
        id: row.id,
        nombre: row.nombre,
        codigo: row.codigo,
        creditos: row.creditos,
        color: row.color,
        activa: row.activa,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
/**
 * Obtiene todas las materias pertenecientes a un usuario.
 *
 * Permite aplicar filtros por estado, búsqueda, ordenamiento y paginación.
 *
 * @async
 * @function findAllByUserId
 * @param {string|number} userId - Identificador del usuario propietario de las materias.
 * @param {Object} [filters={}] - Filtros opcionales para la consulta.
 * @param {boolean} [filters.activa] - Filtra las materias por su estado de activación.
 * @param {string} [filters.search] - Texto utilizado para buscar por nombre o código.
 * @param {string} [filters.sort] - Campo por el cual se ordenarán los resultados.
 * @param {string} [filters.order] - Dirección del ordenamiento: "asc" o "desc".
 * @param {number} [filters.limit] - Cantidad máxima de registros por página.
 * @param {number} [filters.page] - Número de página que se desea consultar.
 *
 * @returns {Promise<Object>} Resultado de la consulta con las materias y el total.
 * @returns {Array<Object>} returns.materias - Lista de materias encontradas.
 * @returns {number} returns.total - Cantidad total de materias que cumplen los filtros.
 *
 * @throws {Error} Error de base de datos si alguna de las consultas falla.
 */
export async function findAllByUserId(userId, filters = {}) {
    const conditions = ["m.id_usuario = ?"];
    const params = [userId];

    if (typeof filters.activa === "boolean") {
        conditions.push("m.activa = ?");
        params.push(filters.activa ? 1 : 0);
    }

    if (filters.search) {
        conditions.push("(m.nombre LIKE ? OR m.codigo LIKE ?)");
        params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total
         FROM materia m
         WHERE ${conditions.join(" AND ")}`,
        params
    );

    const orderBy = normalizeSort(filters.sort, filters.order);
    const limit = filters.limit;
    const offset = (filters.page - 1) * limit;

    const [rows] = await pool.execute(
        `SELECT
           m.id_materia AS id,
           m.id_usuario AS usuarioId,
           m.nombre,
           m.codigo,
           m.color,
           m.creditos,
           m.activa,
           m.created_at AS createdAt,
           m.updated_at AS updatedAt
         FROM materia m
         WHERE ${conditions.join(" AND ")}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return {
        materias: rows.map(mapMateria),
        total: countRows[0].total
    };
}
/**
 * Busca una materia por su identificador y verifica que pertenezca
 * al usuario especificado.
 *
 * @async
 * @function findByIdAndUserId
 * @param {string|number} id - Identificador único de la materia.
 * @param {string|number} userId - Identificador único del usuario propietario de la materia.
 *
 * @returns {Promise<Object|null>} Materia encontrada o null si no existe
 * o no pertenece al usuario indicado.
 *
 * @throws {Error} Error de base de datos si la consulta falla.
 */
export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
       m.id_materia AS id,
       m.id_usuario AS usuarioId,
       m.nombre,
       m.codigo,
       m.color,
       m.creditos,
       m.activa,
       m.created_at AS createdAt,
       m.updated_at AS updatedAt
     FROM materia m
     WHERE m.id_materia = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows[0] ? mapMateria(rows[0]) : null;
}




/**
 * Crea una nueva materia asociada a un usuario.
 *
 * Después de insertar la materia, consulta nuevamente el registro
 * creado para devolver la información completa de la materia.
 *
 * @async
 * @function createMateria
 * @param {string|number} userId - Identificador único del usuario propietario de la materia.
 * @param {Object} materia - Datos de la materia que se desea crear.
 * @param {string} materia.nombre - Nombre de la materia.
 * @param {string} materia.codigo - Código identificador de la materia.
 * @param {string} materia.color - Color asociado a la materia.
 * @param {number} materia.creditos - Número de créditos de la materia.
 * @param {boolean} materia.activa - Indica si la materia se encuentra activa.
 *
 * @returns {Promise<Object|null>} Materia creada con todos sus datos.
 *
 * @throws {Error} Error de base de datos si la inserción de la materia falla.
 * @throws {Error} Error de base de datos si no es posible consultar la materia creada.
 */
export async function createMateria(userId, materia) {
  const [result] = await pool.execute(
    `INSERT INTO materia (id_usuario, nombre, codigo, color, creditos, activa)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      materia.nombre,
      materia.codigo,
      materia.color,
      materia.creditos,
      materia.activa ? 1 : 0
    ]
  );

  return findByIdAndUserId(result.insertId, userId);
}


/**
 * Verifica si ya existe una materia con el código especificado
 * para un usuario determinado.
 *
 * Permite excluir una materia mediante su identificador, lo cual
 * es útil durante la actualización de una materia existente.
 *
 * @async
 * @function existsByCode
 * @param {string|number} userId - Identificador único del usuario propietario de la materia.
 * @param {string} codigo - Código de la materia que se desea verificar.
 * @param {string|number} [excludeId] - Identificador de una materia que debe excluirse de la búsqueda.
 *
 * @returns {Promise<boolean>} true si existe una materia con el código indicado;
 * false si no existe.
 *
 * @throws {Error} Error de base de datos si la consulta falla.
 */
export async function existsByCode(userId, codigo, excludeId) {
  const params = [userId, codigo];
  let sql = "SELECT 1 FROM materia WHERE id_usuario = ? AND codigo = ?";

  if (excludeId) {
    sql += " AND id_materia <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}

/**
 * Verifica si ya existe una materia con el nombre especificado
 * para un usuario determinado.
 *
 * Permite excluir una materia mediante su identificador, lo cual
 * es útil durante la actualización de una materia existente.
 *
 * @async
 * @function existsByName
 * @param {string|number} userId - Identificador único del usuario propietario de la materia.
 * @param {string} nombre - Nombre de la materia que se desea verificar.
 * @param {string|number} [excludeId] - Identificador de una materia que debe excluirse de la búsqueda.
 *
 * @returns {Promise<boolean>} true si existe una materia con el nombre indicado;
 * false si no existe.
 *
 * @throws {Error} Error de base de datos si la consulta falla.
 */
export async function existsByName(userId, nombre, excludeId) {
  const params = [userId, nombre];
  let sql = "SELECT 1 FROM materia WHERE id_usuario = ? AND nombre = ?";

  if (excludeId) {
    sql += " AND id_materia <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}


/**
 * Obtiene las tareas asociadas a una materia perteneciente a un usuario.
 *
 * @async
 * @function findTareasByMateriaId
 * @param {number} materiaId - Identificador de la materia.
 * @param {number} userId - Identificador del usuario propietario de la materia.
 *
 * @returns {Promise<Array>} Lista de tareas asociadas a la materia.
 */
export async function findTareasByMateriaId(materiaId, userId) {
    const [rows] = await pool.execute(
        `SELECT
            t.id_tarea AS id,
            t.id_materia AS materiaId,
            t.titulo,
            t.descripcion,
            t.fecha_entrega AS fechaEntrega,
            t.hora_entrega AS horaEntrega,
            t.prioridad,
            t.estado,
            t.carga_estimada_minutos AS cargaEstimadaMinutos,
            t.porcentaje_avance AS porcentajeAvance,
            t.created_at AS createdAt,
            t.updated_at AS updatedAt
         FROM tarea t
         INNER JOIN materia m ON m.id_materia = t.id_materia
         WHERE t.id_materia = ?
           AND m.id_usuario = ?
         ORDER BY t.fecha_entrega ASC`,
        [materiaId, userId]
    );

    return rows;
}
export async function findEventosByMateriaAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
       e.id_evento AS id,
       e.id_materia AS materiaId,
       e.titulo,
       e.descripcion,
       e.fecha,
       e.hora_inicio AS horaInicio,
       e.hora_fin AS horaFin,
       e.tipo,
       e.created_at AS createdAt,
       e.updated_at AS updatedAt
     FROM evento e
     INNER JOIN materia m ON m.id_materia = e.id_materia
     WHERE m.id_materia = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows;
}