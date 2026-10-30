import { pool } from "../config/database.js";

const sortableFields = {
  id: "r.id_recordatorio",
  tareaId: "r.id_tarea",
  mensaje: "r.mensaje",
  fechaHora: "r.fecha_hora",
  canal: "r.canal",
  leido: "r.leido",
  createdAt: "r.created_at"
};

function normalizeSort(sort, order) {
  const column = sortableFields[sort] || sortableFields.fechaHora;
  const direction =
    String(order).toLowerCase() === "desc" ? "DESC" : "ASC";

  return `${column} ${direction}`;
}

function mapRecordatorio(row) {
  return {
    id: row.id,
    tareaId: row.tareaId,
    tareaTitulo: row.tareaTitulo,
    tareaDescripcion: row.tareaDescripcion,
    materiaNombre: row.materiaNombre,
    mensaje: row.mensaje,
    fechaHora: row.fechaHora,
    canal: row.canal,
    leido: Boolean(row.leido),
    createdAt: row.createdAt
  };
}

export async function findAll(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.canal) {
    conditions.push("r.canal = ?");
    params.push(filters.canal);
  }

  if (typeof filters.leido === "boolean") {
    conditions.push("r.leido = ?");
    params.push(filters.leido ? 1 : 0);
  }

  if (filters.search) {
    conditions.push("r.mensaje LIKE ?");
    params.push(`%${filters.search}%`);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM recordatorio r
     INNER JOIN tarea t ON t.id_tarea = r.id_tarea
     ${where}`,
    params
  );

  const limit = filters.limit ?? 20;
  const page = filters.page ?? 1;
  const offset = (page - 1) * limit;
  const orderBy = normalizeSort(filters.sort, filters.order);

  const [rows] = await pool.execute(
    `SELECT
    r.id_recordatorio AS id,
    r.id_tarea AS tareaId,
    t.titulo AS tareaTitulo,
    t.descripcion AS tareaDescripcion,
    m.nombre AS materiaNombre,
    r.mensaje,
    r.fecha_hora AS fechaHora,
    r.canal,
    r.leido,
    r.created_at AS createdAt
FROM recordatorio AS r
INNER JOIN tarea AS t
    ON t.id_tarea = r.id_tarea
INNER JOIN materia AS m
    ON m.id_materia = t.id_materia
ORDER BY r.fecha_hora ASC
LIMIT ? OFFSET ?;`,
    [...params, limit, offset]
  );

  return {
    recordatorios: rows.map(mapRecordatorio),
    total: Number(countRows[0].total)
  };
}


export async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
       r.id_recordatorio AS id,
       r.id_tarea AS tareaId,
       t.titulo AS tareaTitulo,
       t.descripcion AS tareaDescripcion,
       m.nombre AS materiaNombre,
       r.mensaje,
       r.fecha_hora AS fechaHora,
       r.canal,
       r.leido,
       r.created_at AS createdAt
     FROM recordatorio AS r
     INNER JOIN tarea AS t
       ON t.id_tarea = r.id_tarea
     INNER JOIN materia AS m
       ON m.id_materia = t.id_materia
     WHERE r.id_recordatorio = ?`,
    [id]
  );

  return rows[0] ? mapRecordatorio(rows[0]) : null;
}

export async function existsTarea(idTarea) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM tarea
     WHERE id_tarea = ?
     LIMIT 1`,
    [idTarea]
  );

  return rows.length > 0;
}
export async function createRecordatorio(recordatorio) {
  const [result] = await pool.execute(
    `INSERT INTO recordatorio
       (id_tarea, mensaje, fecha_hora, canal, leido)
     VALUES (?, ?, ?, ?, ?)`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0
    ]
  );

  return findById(result.insertId);
}

export async function updateRecordatorio(id, recordatorio) {
  await pool.execute(
    `UPDATE recordatorio
     SET id_tarea = ?,
         mensaje = ?,
         fecha_hora = ?,
         canal = ?,
         leido = ?
     WHERE id_recordatorio = ?`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0,
      id
    ]
  );

  return findById(id);
}
export async function patchRecordatorio(id, partialRecordatorio) {
  const fields = [];
  const params = [];

  if (partialRecordatorio.tareaId !== undefined) {
    fields.push("id_tarea = ?");
    params.push(partialRecordatorio.tareaId);
  }

  if (partialRecordatorio.mensaje !== undefined) {
    fields.push("mensaje = ?");
    params.push(partialRecordatorio.mensaje);
  }

  if (partialRecordatorio.fechaHora !== undefined) {
    fields.push("fecha_hora = ?");
    params.push(partialRecordatorio.fechaHora);
  }

  if (partialRecordatorio.canal !== undefined) {
    fields.push("canal = ?");
    params.push(partialRecordatorio.canal);
  }

  if (partialRecordatorio.leido !== undefined) {
    fields.push("leido = ?");
    params.push(partialRecordatorio.leido ? 1 : 0);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  params.push(id);

  await pool.execute(
    `UPDATE recordatorio
     SET ${fields.join(", ")}
     WHERE id_recordatorio = ?`,
    params
  );

  return findById(id);
}

export async function deleteRecordatorio(id) {
  const [result] = await pool.execute(
    `DELETE FROM recordatorio
     WHERE id_recordatorio = ?`,
    [id]
  );

  return result.affectedRows > 0;
}