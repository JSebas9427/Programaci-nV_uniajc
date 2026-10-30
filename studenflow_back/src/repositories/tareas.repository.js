
import { pool } from "../config/database.js";

const sortableFields = {
  id: "t.id_tarea",
  titulo: "t.titulo",
  fechaEntrega: "t.fecha_entrega",
  prioridad: "t.prioridad",
  estado: "t.estado",
  porcentajeAvance: "t.porcentaje_avance",
  createdAt: "t.created_at"
};

function normalizeSort(sort, order) {
  const column = sortableFields[sort] || sortableFields.fechaEntrega;
  const direction = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";
  return `${column} ${direction}`;
}

function mapTarea(row) {
  return {
    id: row.id,
    materiaId: row.materiaId,
    materiaNombre: row.materiaNombre,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fechaEntrega: row.fechaEntrega,
    horaEntrega: row.horaEntrega,
    prioridad: row.prioridad,
    estado: row.estado,
    cargaEstimadaMinutos: row.cargaEstimadaMinutos,
    porcentajeAvance: row.porcentajeAvance,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

const selectTarea = `
  SELECT
    t.id_tarea AS id,
    t.id_materia AS materiaId,
    m.nombre AS materiaNombre,
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
`;

export async function findAllByUserId(userId, filters = {}) {
  const conditions = ["m.id_usuario = ?"];
  const params = [userId];

  if (filters.materiaId !== undefined) {
    conditions.push("t.id_materia = ?");
    params.push(filters.materiaId);
  }

  if (filters.prioridad !== undefined) {
    conditions.push("t.prioridad = ?");
    params.push(filters.prioridad);
  }

  if (filters.estado !== undefined) {
    conditions.push("t.estado = ?");
    params.push(filters.estado);
  }

  if (filters.search) {
    conditions.push("(t.titulo LIKE ? OR t.descripcion LIKE ? OR m.nombre LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }

  const where = conditions.join(" AND ");

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM tarea t
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE ${where}`,
    params
  );

  const offset = (filters.page - 1) * filters.limit;

  const [rows] = await pool.execute(
    `${selectTarea}
     WHERE ${where}
     ORDER BY ${normalizeSort(filters.sort, filters.order)}
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]
  );

  return {
    tareas: rows.map(mapTarea),
    total: Number(countRows[0].total)
  };
}

export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `${selectTarea}
     WHERE t.id_tarea = ? AND m.id_usuario = ?
     LIMIT 1`,
    [id, userId]
  );

  return rows[0] ? mapTarea(rows[0]) : null;
}

export async function materiaBelongsToUser(materiaId, userId) {
  const [rows] = await pool.execute(
    "SELECT 1 FROM materia WHERE id_materia = ? AND id_usuario = ? LIMIT 1",
    [materiaId, userId]
  );

  return rows.length > 0;
}

export async function createTarea(userId, tarea) {
  const [result] = await pool.execute(
    `INSERT INTO tarea (
      id_materia, titulo, descripcion, fecha_entrega, hora_entrega,
      prioridad, estado, carga_estimada_minutos, porcentaje_avance
    )
    SELECT m.id_materia, ?, ?, ?, ?, ?, ?, ?, ?
    FROM materia m
    WHERE m.id_materia = ? AND m.id_usuario = ?`,
    [
      tarea.titulo,
      tarea.descripcion,
      tarea.fechaEntrega,
      tarea.horaEntrega,
      tarea.prioridad,
      tarea.estado,
      tarea.cargaEstimadaMinutos,
      tarea.porcentajeAvance,
      tarea.materiaId,
      userId
    ]
  );

  if (result.affectedRows === 0) return null;

  return findByIdAndUserId(result.insertId, userId);
}

export async function replaceTarea(id, userId, tarea) {
  await pool.execute(
    `UPDATE tarea t
     INNER JOIN materia m ON m.id_materia = t.id_materia
     SET t.id_materia = ?, t.titulo = ?, t.descripcion = ?,
         t.fecha_entrega = ?, t.hora_entrega = ?, t.prioridad = ?,
         t.estado = ?, t.carga_estimada_minutos = ?, t.porcentaje_avance = ?
     WHERE t.id_tarea = ? AND m.id_usuario = ?`,
    [
      tarea.materiaId,
      tarea.titulo,
      tarea.descripcion,
      tarea.fechaEntrega,
      tarea.horaEntrega,
      tarea.prioridad,
      tarea.estado,
      tarea.cargaEstimadaMinutos,
      tarea.porcentajeAvance,
      id,
      userId
    ]
  );

  return findByIdAndUserId(id, userId);
}

export async function patchTarea(id, userId, cambios) {
  const fields = [];
  const params = [];

  const mapping = {
    materiaId: ["t.id_materia", cambios.materiaId],
    titulo: ["t.titulo", cambios.titulo],
    descripcion: ["t.descripcion", cambios.descripcion],
    fechaEntrega: ["t.fecha_entrega", cambios.fechaEntrega],
    horaEntrega: ["t.hora_entrega", cambios.horaEntrega],
    prioridad: ["t.prioridad", cambios.prioridad],
    estado: ["t.estado", cambios.estado],
    cargaEstimadaMinutos: ["t.carga_estimada_minutos", cambios.cargaEstimadaMinutos],
    porcentajeAvance: ["t.porcentaje_avance", cambios.porcentajeAvance]
  };

  for (const [value, [column, fieldValue]] of Object.entries(mapping)) {
    if (fieldValue !== undefined) {
      fields.push(`${column} = ?`);
      params.push(fieldValue);
    }
  }

  if (fields.length > 0) {
    params.push(id, userId);

    await pool.execute(
      `UPDATE tarea t
       INNER JOIN materia m ON m.id_materia = t.id_materia
       SET ${fields.join(", ")}
       WHERE t.id_tarea = ? AND m.id_usuario = ?`,
      params
    );
  }

  return findByIdAndUserId(id, userId);
}

export async function deleteTarea(id, userId) {
  const [result] = await pool.execute(
    `DELETE t FROM tarea t
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE t.id_tarea = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return result.affectedRows > 0;
}
