const ALPHANUM = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomSegment(length: number): string {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return [...bytes].map((b) => ALPHANUM[b % ALPHANUM.length]).join("");
}

/**
 * Código público para que el cliente acceda a /seguimiento.
 * Formato corto: K- + 5 caracteres (sin 0/O/1/I para menos confusión al dictarlo).
 * 5 caracteres ≈ 33M combinaciones; 4 sería ~1M y más propenso a colisiones con el tiempo.
 */
export function generatePublicProjectCode(): string {
  return `K-${randomSegment(5)}`;
}
