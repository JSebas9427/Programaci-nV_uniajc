
import { HttpError } from "../utils/http-error.js";

function parseBoolean(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === "true" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "0") {
    return false;
  }

  throw new HttpError(
    422,
    "VALIDATION_ERROR",
    `El campo '${fieldName}' debe ser true o false.`
  );
}

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      `El campo '${fieldName}' debe ser un entero mayor o igual a 1.`
    );
  }

  return parsed;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      `El campo '${fieldName}' es obligatorio.`
    );
  }

  return value.trim();
}

function validateMensaje(value) {
  const mensaje = normalizeString(value, "mensaje");

  if (mensaje.length > 255) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El campo 'mensaje' no puede superar los 255 caracteres."
    );
  }

  return mensaje;
}

function validateFechaHora(value) {
  const fechaHora = normalizeString(value, "fechaHora");

  // Acepta YYYY-MM-DD HH:mm:ss o YYYY-MM-DDTHH:mm:ss.
  const match = fechaHora.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})$/
  );

  if (!match) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El campo 'fechaHora' debe tener el formato YYYY-MM-DD HH:mm:ss."
    );
  }

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    )
  );

  const isValid =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day) &&
    date.getUTCHours() === Number(hour) &&
    date.getUTCMinutes() === Number(minute) &&
    date.getUTCSeconds() === Number(second);

  if (!isValid) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El campo 'fechaHora' contiene una fecha u hora inexistente."
    );
  }

  return fechaHora.replace("T", " ");
}

function validateCanal(value) {
  if (value !== "in_app" && value !== "email") {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El campo 'canal' solo puede ser 'in_app' o 'email'."
    );
  }

  return value;
}

export function validateRecordatorioId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new HttpError(
      400,
      "INVALID_ID",
      "El identificador de recordatorio no es válido."
    );
  }

  return parsedId;
}

export function validateRecordatorioListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El parámetro 'page' debe ser un entero mayor o igual a 1."
    );
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "El parámetro 'limit' debe ser un entero entre 1 y 100."
    );
  }

  const canal =
    query.canal === undefined
      ? undefined
      : validateCanal(query.canal);

  return {
    canal,
    leido: parseBoolean(query.leido, "leido"),
    search: typeof query.search === "string" ? query.search.trim() : "",
    sort: query.sort,
    order: query.order,
    page,
    limit
  };
}

export function validateCreateRecordatorio(body) {
  const tareaId = parsePositiveInteger(body.tareaId, "tareaId");
  const mensaje = validateMensaje(body.mensaje);
  const fechaHora = validateFechaHora(body.fechaHora);
  const canal =
    body.canal === undefined ? "in_app" : validateCanal(body.canal);
  const leido =
    body.leido === undefined ? false : parseBoolean(body.leido, "leido");

  return {
    tareaId,
    mensaje,
    fechaHora,
    canal,
    leido
  };
}

export function validatePatchRecordatorio(body) {
  const payload = {};

  if (body.tareaId !== undefined) {
    payload.tareaId = parsePositiveInteger(body.tareaId, "tareaId");
  }

  if (body.mensaje !== undefined) {
    payload.mensaje = validateMensaje(body.mensaje);
  }

  if (body.fechaHora !== undefined) {
    payload.fechaHora = validateFechaHora(body.fechaHora);
  }

  if (body.canal !== undefined) {
    payload.canal = validateCanal(body.canal);
  }

  if (body.leido !== undefined) {
    payload.leido = parseBoolean(body.leido, "leido");
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(
      422,
      "VALIDATION_ERROR",
      "No se enviaron campos válidos para actualizar."
    );
  }

  return payload;
}
