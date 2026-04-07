import type { UploadTipo } from "@/lib/axios/uploadsApi";

export type FormalUploadTipo = "levantamiento_detallado" | "cotizacion_formal" | "hoja_taller";

type FormalMetadata = {
  tipo: UploadTipo;
  relacionadoA: "tarea" | "cliente";
  relacionadoId: string;
  clienteId: string;
  tareasId?: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const casted = String(value).trim();
    return casted.length > 0 ? casted : undefined;
  }
  return undefined;
};

const resolveClientId = (rawClient: unknown, visited = new WeakSet<object>()): string | undefined => {
  const asString = asNonEmptyString(rawClient);
  if (asString) return asString;

  const raw = asRecord(rawClient);
  if (!raw) return undefined;
  if (visited.has(raw)) return undefined;
  visited.add(raw);

  const clienteNested = asRecord(raw.cliente);
  const rawNested = asRecord(raw.raw);
  const citaNested = asRecord(raw.cita);
  const dataNested = asRecord(raw.data);
  const nestedCandidates = [rawNested, citaNested, dataNested].filter(
    (candidate): candidate is Record<string, unknown> => Boolean(candidate),
  );

  for (const candidate of nestedCandidates) {
    const fromNested = resolveClientId(candidate, visited);
    if (fromNested) {
      return fromNested;
    }
  }

  return (
    asNonEmptyString(raw.clientId) ??
    asNonEmptyString(raw.clienteId) ??
    asNonEmptyString(raw.clienteRef) ??
    asNonEmptyString(raw.codigoCliente) ??
    asNonEmptyString(raw.codigo) ??
    asNonEmptyString(raw._id) ??
    asNonEmptyString(raw.id) ??
    asNonEmptyString(clienteNested?.clientId) ??
    asNonEmptyString(clienteNested?.clienteId) ??
    asNonEmptyString(clienteNested?.clienteRef) ??
    asNonEmptyString(clienteNested?.codigoCliente) ??
    asNonEmptyString(clienteNested?.codigo) ??
    asNonEmptyString(clienteNested?._id) ??
    asNonEmptyString(clienteNested?.id)
  );
};

export const getRequiredClientIdForFormalUpload = (
  rawClientId: unknown,
  flowLabel: string,
): string => {
  const clientId = resolveClientId(rawClientId);
  if (!clientId) {
    throw new Error(
      `No se encontro clienteId para ${flowLabel}. Este flujo requiere relacion explicita con cliente antes del upload.`,
    );
  }
  return clientId;
};

export const buildFormalUploadMetadata = (
  tipo: FormalUploadTipo,
  clientId: string,
  relatedTaskId?: string,
): FormalMetadata => {
  const taskId = relatedTaskId?.trim();
  if (taskId) {
    return {
      tipo,
      relacionadoA: "tarea",
      relacionadoId: taskId,
      clienteId: clientId,
      tareasId: taskId,
    };
  }

  return {
    tipo,
    relacionadoA: "cliente",
    relacionadoId: clientId,
    clienteId: clientId,
    tareasId: undefined,
  };
};

