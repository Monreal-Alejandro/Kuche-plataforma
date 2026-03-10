import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import * as XLSX from "xlsx";

type CatalogItem = {
  id: string;
  label: string;
  unitPrice: number;
};

type CatalogCategory = {
  category: string;
  items: CatalogItem[];
};

const toCatalogId = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "PLANTILLA PRESUPUESTO FORMAL.xlsx");
    const fileBuffer = await fs.readFile(filePath);

    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const [firstSheetName] = workbook.SheetNames;
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) {
      return NextResponse.json(
        { catalog: [], error: "La plantilla no contiene hojas válidas." },
        { status: 200 },
      );
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
    });

    const headerKeys = {
      categoria: ["Categoria", "CATEGORIA", "Categoría", "CATEGORÍA", "category", "CATEGORY"],
      codigo: ["Codigo", "CÓDIGO", "CODIGO", "code", "CODE"],
      descripcion: ["Descripcion", "Descripción", "DESCRIPCION", "DESCRIPCIÓN", "description"],
      precioUnitario: [
        "PrecioUnitario",
        "PRECIOUNITARIO",
        "Precio_Unitario",
        "PRECIO_UNITARIO",
        "unitPrice",
      ],
    };

    const getCell = (row: Record<string, unknown>, keys: string[]) => {
      for (const key of keys) {
        if (key in row && row[key] != null && row[key] !== "") {
          return row[key];
        }
      }
      return null;
    };

    const categoriesMap = new Map<string, CatalogCategory>();

    rows.forEach((row) => {
      const rawDescripcion = getCell(row, headerKeys.descripcion);
      const rawCategoria = getCell(row, headerKeys.categoria);
      const rawPrecio = getCell(row, headerKeys.precioUnitario);
      const rawCodigo = getCell(row, headerKeys.codigo);

      const descripcion = rawDescripcion ? String(rawDescripcion).trim() : "";
      if (!descripcion) {
        return;
      }

      const categoriaName = rawCategoria
        ? String(rawCategoria).toUpperCase().trim()
        : "SIN CATEGORIA";

      const precioValueRaw = rawPrecio != null ? Number(rawPrecio) : NaN;
      const unitPrice = Number.isFinite(precioValueRaw) && precioValueRaw >= 0 ? precioValueRaw : 0;

      const idBase =
        (rawCodigo && String(rawCodigo).trim()) || toCatalogId(descripcion) || "item_excel";
      const id = idBase.slice(0, 40);

      let category = categoriesMap.get(categoriaName);
      if (!category) {
        category = { category: categoriaName, items: [] };
        categoriesMap.set(categoriaName, category);
      }

      const existing = category.items.find((item) => item.id === id || item.label === descripcion);
      if (existing) {
        existing.unitPrice = unitPrice || existing.unitPrice;
        return;
      }

      category.items.push({
        id,
        label: descripcion,
        unitPrice,
      });
    });

    const catalog: CatalogCategory[] = Array.from(categoriesMap.values());

    return NextResponse.json({ catalog }, { status: 200 });
  } catch (error) {
    console.error("Error al leer la plantilla de catálogo:", error);
    return NextResponse.json(
      { catalog: [], error: "No se pudo leer la plantilla de catálogo." },
      { status: 500 },
    );
  }
}

