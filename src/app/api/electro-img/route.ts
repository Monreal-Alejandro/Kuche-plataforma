import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

function electroDir(): string {
  const fromCwd = path.join(process.cwd(), "public", "images", "electrodomesticos");
  if (existsSync(fromCwd)) return path.resolve(fromCwd);
  const routeDir = path.dirname(fileURLToPath(import.meta.url));
  const fromSourceTree = path.resolve(routeDir, "..", "..", "..", "..", "public", "images", "electrodomesticos");
  if (existsSync(fromSourceTree)) return path.resolve(fromSourceTree);
  return path.resolve(fromCwd);
}

/**
 * GET /api/electro-img?n=microondas-libre-instalacion.JPEG
 *
 * Muchas “.jpg” del proyecto en realidad son TIFF u otro formato renombrado: el navegador
 * muestra icono roto aunque el servidor devuelva 200. Aquí se **reconvierte** a JPEG
 * válido con sharp (sin que tú tengas que tocar F12 ni renombrar a mano).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("n");
  if (!raw) {
    return new NextResponse(null, { status: 400 });
  }
  let name: string;
  try {
    name = decodeURIComponent(raw.trim());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!name || /[/\\]/.test(name) || name.includes("..")) {
    return new NextResponse(null, { status: 400 });
  }
  if (!/^[\w.\-]+$/i.test(name)) {
    return new NextResponse(null, { status: 400 });
  }

  const resolvedDir = electroDir();
  const resolvedFile = path.resolve(resolvedDir, name);
  const rel = path.relative(resolvedDir, resolvedFile);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const buf = await readFile(resolvedFile);
    if (!buf.length) {
      return new NextResponse(null, { status: 404 });
    }

    const out = await sharp(buf, { failOn: "none" })
      .rotate()
      // PNG con alfa mal exportado (p. ej. desde Excel): evita “huecos” y bordes rotos al pasar a JPEG.
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    return new NextResponse(out, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
