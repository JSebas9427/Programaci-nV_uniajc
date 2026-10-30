
import * as recordatoriosRepository from "../repositories/recordatorios.repository.js";
import { HttpError } from "../utils/http-error.js";

async function ensureTareaExists(tareaId) {
  const exists = await recordatoriosRepository.existsTarea(tareaId);

  if (!exists) {
    throw new HttpError(
      404,
      "TAREA_NOT_FOUND",
      "La tarea asociada al recordatorio no fue encontrada."
    );
  }
}

async function ensureRecordatorioExists(id) {
  const recordatorio = await recordatoriosRepository.findById(id);

  if (!recordatorio) {
    throw new HttpError(
      404,
      "RECORDATORIO_NOT_FOUND",
      "El recordatorio no fue encontrado."
    );
  }

  return recordatorio;
}

export async function listRecordatorios(filters) {
  const { recordatorios, total } =
    await recordatoriosRepository.findAll(filters);

  return {
    data: recordatorios,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

export async function getRecordatorioById(id) {
  return ensureRecordatorioExists(id);
}

export async function createRecordatorio(recordatorio) {
  await ensureTareaExists(recordatorio.tareaId);

  return recordatoriosRepository.createRecordatorio(recordatorio);
}

export async function replaceRecordatorio(id, recordatorio) {
  await ensureRecordatorioExists(id);
  await ensureTareaExists(recordatorio.tareaId);

  return recordatoriosRepository.updateRecordatorio(id, recordatorio);
}

export async function updateRecordatorio(id, partialRecordatorio) {
  await ensureRecordatorioExists(id);

  if (partialRecordatorio.tareaId !== undefined) {
    await ensureTareaExists(partialRecordatorio.tareaId);
  }

  return recordatoriosRepository.patchRecordatorio(
    id,
    partialRecordatorio
  );
}

export async function removeRecordatorio(id) {
  await ensureRecordatorioExists(id);

  await recordatoriosRepository.deleteRecordatorio(id);
}
