/**
 * Almacena los PDFs formales en IndexedDB para no exceder la cuota de localStorage.
 * La tarjeta solo guarda la clave (formalPdfKey); el PDF se lee desde aquí al ver/descargar.
 */

const DB_NAME = "kuche-formal-pdfs";
const STORE_NAME = "pdfs";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB no disponible"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/** Guarda el PDF formal (data URL) bajo la clave dada. */
export function saveFormalPdf(key: string, dataUrl: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(dataUrl, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

/** Recupera el PDF formal por clave. Devuelve null si no existe o hay error. */
export function getFormalPdf(key: string): Promise<string | null> {
  return openDb()
    .then(
      (db) =>
        new Promise<string | null>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result ?? null);
          request.onerror = () => reject(request.error);
          tx.oncomplete = () => db.close();
        }),
    )
    .catch(() => null);
}

/** Genera una clave única para un PDF formal de una tarea (para usar al guardar). */
export function createFormalPdfKey(taskId: string, index: number): string {
  return `formal-${taskId}-${index}-${Date.now()}`;
}
