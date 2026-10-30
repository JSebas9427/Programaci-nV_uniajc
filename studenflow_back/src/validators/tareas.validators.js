
import { HttpError } from "../utils/http-error.js";

const PRIORIDADES = ["baja", "media", "alta"];

const ESTADOS = [
  "pendiente",
  "en_progreso",
  "entregada",
  "calificada",
  "cancelada"
];

function textoObligatorio(value, campo, maximo) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      `El campo '${campo}' es obligatorio.`
    );
  }

  const resultado = value.trim();

  if (resultado.length > maximo) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      `El campo '${campo}' no puede superar ${maximo} caracteres.`
    );
  }

  return resultado;
}

function entero(value, campo, minimo = 0, maximo = Number.MAX_SAFE_INTEGER) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const resultado = Number(value);

  if (
    !Number.isSafeInteger(resultado) ||
    resultado < minimo ||
    resultado > maximo
  ) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      `El campo '${campo}' debe ser un entero entre ${minimo} y ${maximo}.`
    );
  }

  return resultado;
}

function validarFecha(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El campo 'fechaEntrega' debe tener formato YYYY-MM-DD."
    );
  }

  const [anio, mes, dia] = value.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El campo 'fechaEntrega' no representa una fecha válida."
    );
  }

  return value;
}

function validarHora(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (
    typeof value !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)
  ) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El campo 'horaEntrega' debe tener formato HH:mm o HH:mm:ss."
    );
  }

  return value.length === 5 ? `${value}:00` : value;
}

function validarEnum(value, campo, opciones) {
  if (!opciones.includes(value)) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      `El campo '${campo}' debe ser uno de estos valores: ${opciones.join(", ")}.`
    );
  }

  return value;
}

function validarTarea(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El cuerpo de la solicitud debe ser un objeto."
    );
  }

  const tarea = {
    materiaId: entero(body.materiaId, "materiaId", 1),
    titulo: textoObligatorio(body.titulo, "titulo", 150),
    descripcion:
      body.descripcion === undefined || body.descripcion === null
        ? null
        : typeof body.descripcion === "string"
          ? body.descripcion.trim() || null
          : (() => {
              throw new HttpError(
                422,
                "VALIDATION_ERROR",
                "El campo 'descripcion' debe ser texto."
              );
            })(),
    fechaEntrega: validarFecha(body.fechaEntrega),
    horaEntrega: validarHora(body.horaEntrega),
    prioridad:
      body.prioridad === undefined
        ? "media"
        : validarEnum(body.prioridad, "prioridad", PRIORIDADES),
    estado:
      body.estado === undefined
        ? "pendiente"
        : validarEnum(body.estado, "estado", ESTADOS),
    cargaEstimadaMinutos:
      body.cargaEstimadaMinutos === undefined ||
      body.cargaEstimadaMinutos === null ||
      body.cargaEstimadaMinutos === ""
        ? null
        : entero(body.cargaEstimadaMinutos, "cargaEstimadaMinutos", 1),
    porcentajeAvance:
      body.porcentajeAvance === undefined
        ? 0
        : entero(body.porcentajeAvance, "porcentajeAvance", 0, 100)
  };

  if (tarea.materiaId === null) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El campo 'materiaId' es obligatorio."
    );
  }

  return tarea;
}

export function validateTareaId(id) {
  const parsed = Number(id);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new HttpError(
      400,
      "INVALID_ID",
      "El identificador de tarea no es válido."
    );
  }

  return parsed;
}

export function validateCreateTarea(body) {
  return validarTarea(body);
}

export function validatePatchTarea(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El cuerpo de la solicitud debe ser un objeto."
    );
  }

  const campos = [
    "materiaId",
    "titulo",
    "descripcion",
    "fechaEntrega",
    "horaEntrega",
    "prioridad",
    "estado",
    "cargaEstimadaMinutos",
    "porcentajeAvance"
  ];

  const payload = {};

  for (const campo of campos) {
    if (body[campo] !== undefined) {
      payload[campo] = body[campo];
    }
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "No se enviaron campos válidos para actualizar."
    );
  }

  const normalizado = {};

  if (payload.materiaId !== undefined) {
    normalizado.materiaId = entero(payload.materiaId, "materiaId", 1);

    if (normalizado.materiaId === null) {
      throw new HttpError(422, "VALIDATION_ERROR", "materiaId es obligatorio.");
    }
  }

  if (payload.titulo !== undefined) {
    normalizado.titulo = textoObligatorio(payload.titulo, "titulo", 150);
  }

  if (payload.descripcion !== undefined) {
    if (payload.descripcion !== null && typeof payload.descripcion !== "string") {
      throw new HttpError(422, "VALIDATION_ERROR", "El campo 'descripcion' debe ser texto.");
    }

    normalizado.descripcion =
      typeof payload.descripcion === "string"
        ? payload.descripcion.trim() || null
        : null;
  }

  if (payload.fechaEntrega !== undefined) {
    normalizado.fechaEntrega = validarFecha(payload.fechaEntrega);
  }

  if (payload.horaEntrega !== undefined) {
    normalizado.horaEntrega = validarHora(payload.horaEntrega);
  }

  if (payload.prioridad !== undefined) {
    normalizado.prioridad = validarEnum(payload.prioridad, "prioridad", PRIORIDADES);
  }

  if (payload.estado !== undefined) {
    normalizado.estado = validarEnum(payload.estado, "estado", ESTADOS);
  }

  if (payload.cargaEstimadaMinutos !== undefined) {
    normalizado.cargaEstimadaMinutos =
      payload.cargaEstimadaMinutos === null || payload.cargaEstimadaMinutos === ""
        ? null
        : entero(payload.cargaEstimadaMinutos, "cargaEstimadaMinutos", 1);
  }

  if (payload.porcentajeAvance !== undefined) {
    normalizado.porcentajeAvance =
      entero(payload.porcentajeAvance, "porcentajeAvance", 0, 100);

    if (normalizado.porcentajeAvance === null) {
      throw new HttpError(422, "VALIDATION_ERROR", "El porcentaje de avance es obligatorio.");
    }
  }

  return normalizado;
}

export function validateTareaListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "page debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "limit debe ser un entero entre 1 y 100.");
  }

  const filtros = {
    search: typeof query.search === "string" ? query.search.trim() : "",
    sort: query.sort,
    order: query.order,
    page,
    limit
  };

  if (query.materiaId !== undefined) {
    filtros.materiaId = entero(query.materiaId, "materiaId", 1);

    if (filtros.materiaId === null) {
      throw new HttpError(422, "VALIDATION_ERROR", "materiaId debe ser un entero positivo.");
    }
  }

  if (query.prioridad !== undefined) {
    filtros.prioridad = validarEnum(query.prioridad, "prioridad", PRIORIDADES);
  }

  if (query.estado !== undefined) {
    filtros.estado = validarEnum(query.estado, "estado", ESTADOS);
  }

  return filtros;
}
