import axiosInstance from "./axiosConfig";

const DEFAULT_UPLOAD_ENDPOINT = "/api/uploads";

const readUploadEndpoint = () => {
  const value = process.env.NEXT_PUBLIC_FILE_UPLOAD_ENDPOINT;
  if (!value || value.trim().length === 0) return DEFAULT_UPLOAD_ENDPOINT;
  return value.trim();
};

const extractUrlFromUploadResponse = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  const directUrl = record.url;
  if (typeof directUrl === "string" && directUrl.trim().length > 0) {
    return directUrl.trim();
  }

  const data = record.data;
  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;
    const nestedUrl = dataRecord.url;
    if (typeof nestedUrl === "string" && nestedUrl.trim().length > 0) {
      return nestedUrl.trim();
    }

    const archivoUrl = dataRecord.archivoUrl;
    if (typeof archivoUrl === "string" && archivoUrl.trim().length > 0) {
      return archivoUrl.trim();
    }

    const fileUrl = dataRecord.fileUrl;
    if (typeof fileUrl === "string" && fileUrl.trim().length > 0) {
      return fileUrl.trim();
    }
  }

  const archivoUrl = record.archivoUrl;
  if (typeof archivoUrl === "string" && archivoUrl.trim().length > 0) {
    return archivoUrl.trim();
  }

  const fileUrl = record.fileUrl;
  if (typeof fileUrl === "string" && fileUrl.trim().length > 0) {
    return fileUrl.trim();
  }

  return null;
};

export const subirArchivoYObtenerUrl = async (file: File): Promise<string> => {
  const endpoint = readUploadEndpoint();
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axiosInstance.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const url = extractUrlFromUploadResponse(response.data);
    if (!url) {
      console.error("[subirArchivoYObtenerUrl] respuesta sin URL:", response.data);
      throw new Error(
        "El backend de upload no devolvio una URL valida. Configura NEXT_PUBLIC_FILE_UPLOAD_ENDPOINT o ajusta el response para incluir url.",
      );
    }

    return url;
  } catch (error) {
    const maybeAxios = error as { response?: { status?: number } };
    if (maybeAxios.response?.status === 404) {
      throw new Error(
        `Endpoint de upload no encontrado (${endpoint}). Configura NEXT_PUBLIC_FILE_UPLOAD_ENDPOINT con la ruta real del backend y reinicia el frontend.`,
      );
    }
    throw error;
  }
};
