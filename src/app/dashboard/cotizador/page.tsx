 "use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  activeCitaTaskStorageKey,
  activeCotizacionFormalTaskStorageKey,
  citaReturnUrlStorageKey,
  getCotizacionesFormalesList,
  kanbanStorageKey,
  initialKanbanTasks,
  seguimientoProjectStoragePrefix,
  type KanbanTask,
  type CotizacionFormalData,
} from "@/lib/kanban";
import { createFormalPdfKey, saveFormalPdf } from "@/lib/formal-pdf-storage";
import { downloadPreliminarPdf } from "@/lib/pdf-preliminar";

const projectTypes = ["Cocina", "Clóset", "TV Unit"];
/** Precio por metro lineal para material base (según ítem de ESTRUCTURA seleccionado). */
const MATERIAL_BASE_PRICE_PER_METER: Record<string, number> = {
  est_mdf_natural: 6500,
  est_mel_blanca: 7800,
  est_mel_negro: 9800,
  est_mel_gris: 9800,
  est_madera: 7000,
  est_cintilla_ng: 6500,
  est_cintilla_bf: 6500,
};
const DEFAULT_PRICE_PER_METER = 6500;
/** Factor por espesor (id de ítem ESPESOR -> factor). */
const THICKNESS_FACTORS: Record<string, number> = {
  "15": 0.97,
  "16": 1,
  "18": 1.05,
  "19": 1.08,
};

const scenarioCards = [
  {
    id: "esencial",
    title: "GAMA ESENCIAL",
    subtitle: "Cocina minimalista limpia",
    multiplier: 0.92,
    image: "/images/cocina1.jpg",
    tags: ["Melamina", "Granito", "Herrajes Std"],
  },
  {
    id: "tendencia",
    title: "GAMA TENDENCIA",
    subtitle: "Texturas y brillo",
    multiplier: 1.05,
    image: "/images/cocina6.jpg",
    tags: ["Melamina", "Granito", "Herrajes Std"],
  },
  {
    id: "premium",
    title: "GAMA PREMIUM",
    subtitle: "Lujo con luces y madera",
    multiplier: 1.18,
    image: "/images/render3.jpg",
    tags: ["Melamina", "Granito", "Herrajes Std"],
  },
];

const initialCatalogoKuche = [
  {
    category: "CUBIERTA",
    items: [
      { id: "cub_formica", label: "Cubierta Formica (pies)", unitPrice: 173 },
      { id: "cub_granito", label: "Granito (placas)", unitPrice: 12000 },
      { id: "cub_cuarzo", label: "Cuarzo (placas)", unitPrice: 16000 },
      { id: "mo_fabricacion", label: "Mano de obra fabricación (mts2)", unitPrice: 1400 },
    ],
  },
  {
    category: "ESTRUCTURA",
    items: [
      { id: "est_mdf_natural", label: "MDF Natural 15mm (hojas)", unitPrice: 335 },
      { id: "est_mel_blanca", label: "MDF Melamina Blanco (hojas)", unitPrice: 600 },
      { id: "est_mel_negro", label: "MDF Melamina Negro (hojas)", unitPrice: 1000 },
      { id: "est_mel_gris", label: "MDF Melamina Gris OX (hojas)", unitPrice: 1000 },
      { id: "est_madera", label: "Madera (pza)", unitPrice: 250 },
      { id: "est_cintilla_ng", label: "Cintilla Negro o Gris 19x1 (mts)", unitPrice: 12 },
      { id: "est_cintilla_bf", label: "Cintilla Blanco Frosty 19x1 (mts)", unitPrice: 9 },
    ],
  },
  {
    category: "VISTAS",
    items: [
      { id: "vis_mdf_brillo", label: "MDF Alto Brillo (hojas)", unitPrice: 3200 },
      { id: "vis_mel_color1", label: "MDF Melamina de Color 1 (hojas)", unitPrice: 1000 },
      { id: "vis_mel_color2", label: "MDF Melamina de Color 2 (hojas)", unitPrice: 1000 },
      { id: "vis_cubrecanto_brillo", label: "Cubrecanto Alto Brillo (mts)", unitPrice: 17 },
      { id: "vis_cubrecanto_c1", label: "Cubrecanto Color 1 (mts)", unitPrice: 12 },
      { id: "vis_cubrecanto_c2", label: "Cubrecanto Color 2 (mts)", unitPrice: 12 },
    ],
  },
  {
    category: "ESPESOR",
    items: [
      { id: "15", label: "15 mm", unitPrice: 0 },
      { id: "16", label: "16 mm", unitPrice: 0 },
      { id: "18", label: "18 mm", unitPrice: 0 },
      { id: "19", label: "19 mm", unitPrice: 0 },
    ],
  },
  {
    category: "CAJONES Y PUERTAS",
    items: [
      { id: "cajon_sen", label: "Cajón sencillo", unitPrice: 120 },
      { id: "cajon_cierre_lento", label: "Cajón Cierre lento", unitPrice: 450 },
      { id: "cajon_push", label: "Cajón Sistema Push", unitPrice: 350 },
      { id: "cajon_blum_tandem", label: "Cajón BLUM tandem", unitPrice: 700 },
      { id: "cajon_blum_movento", label: "Cajón Blum Movento", unitPrice: 1300 },
      { id: "bisagra_blumotion", label: "Bisagra tip on - blumotion", unitPrice: 120 },
      { id: "puerta_cierre_push", label: "Puerta Cierre lento/Push", unitPrice: 550 },
      { id: "puerta_bisagra", label: "Puertas Bisagras sencilla", unitPrice: 30 },
    ],
  },
  {
    category: "ACCESORIOS DE MÓDULO",
    items: [
      { id: "acc_patas", label: "Patas y clips", unitPrice: 17 },
      { id: "acc_push_tipon", label: "Push - TIPON", unitPrice: 150 },
      { id: "acc_jaladeras", label: "Jaladeras", unitPrice: 500 },
      { id: "acc_zoclo", label: "Zoclo (mts)", unitPrice: 180 },
      { id: "acc_puerta_esq", label: "Puertas Esquinera", unitPrice: 200 },
    ],
  },
  {
    category: "EXTRAÍBLES Y PUERTAS ABATIBLES",
    items: [
      { id: "ext_alacena", label: "Alacena doble", unitPrice: 3000 },
      { id: "ext_especiero", label: "Especiero", unitPrice: 1800 },
      { id: "ext_magic_corner", label: "Magic Corner", unitPrice: 6200 },
      { id: "ext_esquinero", label: "Esquinero Cacerolero", unitPrice: 3600 },
      { id: "ext_avento_hf", label: "Avento HF (Premium)", unitPrice: 3500 },
      { id: "ext_avento_hk", label: "Avento HK-XS", unitPrice: 400 },
      { id: "ext_piston_gen", label: "Pistón Genérico", unitPrice: 100 },
      { id: "ext_luz_led", label: "Luz LED", unitPrice: 1500 },
      { id: "ext_servo", label: "Servo drive", unitPrice: 18000 },
    ],
  },
  {
    category: "INSUMOS DE PRODUCCIÓN",
    items: [
      { id: "insum_pegamento", label: "Pegamento", unitPrice: 250 },
      { id: "insum_silicon", label: "Silicones", unitPrice: 1500 },
    ],
  },
  {
    category: "EXTRAS",
    items: [
      { id: "extra_lambrin", label: "Lambrín Interior 2.9 x .16", unitPrice: 472 },
      { id: "extra_silicon_tornillos", label: "Silicon, tornillos, tapas, resistol", unitPrice: 2000 },
    ],
  },
  {
    category: "GASTOS FIJOS",
    items: [
      { id: "fijo_mo_semana", label: "Mano obra 1 equipo (semana)", unitPrice: 6000 },
      { id: "fijo_admin_semana", label: "Gastos admin (semana)", unitPrice: 7000 },
    ],
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

function getDefaultMaterialBaseItemId(): string {
  const cat = initialCatalogoKuche.find((c) => c.category === "ESTRUCTURA");
  return cat?.items?.[0]?.id ?? "";
}
function getDefaultColorItemId(): string {
  const cat = initialCatalogoKuche.find((c) => c.category === "VISTAS");
  return cat?.items?.[0]?.id ?? "";
}
function getDefaultThicknessItemId(): string {
  const cat = initialCatalogoKuche.find((c) => c.category === "ESPESOR");
  return cat?.items?.[0]?.id ?? "16";
}

function FormalCotizacionBanner({
  taskId,
  onTerminar,
  onTerminarYContinuar,
  error,
}: {
  taskId: string;
  onTerminar: () => void;
  onTerminarYContinuar: () => void;
  error: string;
}) {
  const [projectName, setProjectName] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(kanbanStorageKey);
    if (!raw) {
      setProjectName("Proyecto");
      return;
    }
    try {
      const tasks = JSON.parse(raw) as KanbanTask[];
      const task = Array.isArray(tasks) ? tasks.find((t) => t.id === taskId) : undefined;
      setProjectName(task?.project ?? "Proyecto");
    } catch {
      setProjectName("Proyecto");
    }
  }, [taskId]);
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-md backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Cotización formal</p>
          <p className="mt-2 text-sm text-emerald-800">
            Cotización formal para <strong>{projectName}</strong>. Completa las secciones. Termina para pasar a seguimiento o termina y continúa para agregar otra (cocina, clóset, baño, etc.).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onTerminar}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-semibold text-white shadow hover:bg-emerald-700"
          >
            Terminar
          </button>
          <button
            type="button"
            onClick={onTerminarYContinuar}
            className="rounded-2xl border-2 border-emerald-600 bg-white px-5 py-3 text-xs font-semibold text-emerald-600 shadow hover:bg-emerald-50"
          >
            Terminar y continuar
          </button>
        </div>
      </div>
      {error ? (
        <p className="rounded-xl bg-rose-100 px-4 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}

export default function CotizadorPage() {
  const router = useRouter();
  const [clients, setClients] = useState([
    { name: "Mariana Fuentes", phone: "", email: "" },
    { name: "Arquitectura F4 Studio", phone: "", email: "" },
    { name: "Eduardo Pardo", phone: "", email: "" },
  ]);
  const [catalogoKuche, setCatalogoKuche] = useState(initialCatalogoKuche);
  const [client, setClient] = useState("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [projectType, setProjectType] = useState(projectTypes[0]);
  const [location, setLocation] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [largo, setLargo] = useState("4.2");
  const [alto, setAlto] = useState("2.4");
  const [fondo, setFondo] = useState("0.6");
  const [materialBaseItemId, setMaterialBaseItemId] = useState(getDefaultMaterialBaseItemId);
  const [colorItemId, setColorItemId] = useState(getDefaultColorItemId);
  const [thicknessItemId, setThicknessItemId] = useState(getDefaultThicknessItemId);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialCatalogoKuche[0]?.category ?? "");
  const [materialSearch, setMaterialSearch] = useState("");

  const [utilidadPct, setUtilidadPct] = useState(30);
  const [fletePct, setFletePct] = useState(2);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const openMenuRef = useRef<HTMLDivElement | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState(initialCatalogoKuche[0]?.category ?? "");
  const [activeCitaTaskId, setActiveCitaTaskId] = useState<string | null>(null);
  const [activeCotizacionFormalTaskId, setActiveCotizacionFormalTaskId] = useState<string | null>(null);
  const [finishFormalError, setFinishFormalError] = useState("");
  const [referenceImages, setReferenceImages] = useState<
    Array<{ id: string; name: string; dataUrl: string }>
  >([]);
  const [excelImportSummary, setExcelImportSummary] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
    fileName: string;
  } | null>(null);
  const [isExcelViewActive, setIsExcelViewActive] = useState(false);
  const [excelPreviewLines, setExcelPreviewLines] = useState<
    Array<{
      id: string;
      categoria: string;
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      total: number;
    }>
  >([]);
  const clientModalRef = useRef<HTMLDivElement | null>(null);
  const addItemModalRef = useRef<HTMLDivElement | null>(null);

  useEscapeClose(isClientModalOpen, () => setIsClientModalOpen(false));
  useEscapeClose(isAddModalOpen, () => setIsAddModalOpen(false));
  useFocusTrap(isClientModalOpen, clientModalRef);
  useFocusTrap(isAddModalOpen, addItemModalRef);

  const metrosValue = Number.parseFloat(largo) || 0;
  const estructuraItems = catalogoKuche.find((c) => c.category === "ESTRUCTURA")?.items ?? [];
  const vistasItems = catalogoKuche.find((c) => c.category === "VISTAS")?.items ?? [];
  const espesorItems = catalogoKuche.find((c) => c.category === "ESPESOR")?.items ?? [];

  const { effectiveMaterialBaseId, effectiveColorId, effectiveThicknessId } = useMemo(() => {
    const q = (id: string) => Math.max(quantities[id] ?? 0, 0);
    const fromCategory = (
      items: { id: string }[],
      fallbackId: string,
    ): string => {
      if (!items.length) return fallbackId;
      const withQty = items
        .map((item) => ({ id: item.id, qty: q(item.id) }))
        .filter((x) => x.qty > 0);
      if (withQty.length === 0) return fallbackId;
      const best = withQty.reduce((a, b) => (b.qty > a.qty ? b : a));
      return best.id;
    };
    return {
      effectiveMaterialBaseId: fromCategory(estructuraItems, materialBaseItemId),
      effectiveColorId: fromCategory(vistasItems, colorItemId),
      effectiveThicknessId: fromCategory(espesorItems, thicknessItemId),
    };
  }, [
    quantities,
    estructuraItems,
    vistasItems,
    espesorItems,
    materialBaseItemId,
    colorItemId,
    thicknessItemId,
  ]);

  const materialBaseItem =
    estructuraItems.find((i) => i.id === effectiveMaterialBaseId) ?? estructuraItems[0];
  const colorItem = vistasItems.find((i) => i.id === effectiveColorId) ?? vistasItems[0];
  const thicknessItem =
    espesorItems.find((i) => i.id === effectiveThicknessId) ?? espesorItems[0];
  const baseMaterialLabel = materialBaseItem?.label ?? "Material base";
  const colorLabel = colorItem?.label ?? "Color";
  const thicknessMm = thicknessItem?.id ?? "16";
  const pricePerMeter = effectiveMaterialBaseId
    ? (MATERIAL_BASE_PRICE_PER_METER[effectiveMaterialBaseId] ?? DEFAULT_PRICE_PER_METER)
    : DEFAULT_PRICE_PER_METER;
  const thicknessFactor = THICKNESS_FACTORS[effectiveThicknessId] ?? 1;

  const materialSubtotal = metrosValue * pricePerMeter * thicknessFactor;

  const baseCost = useMemo(() => {
    return catalogoKuche.reduce((acc, category) => {
      const categoryTotal = category.items.reduce((itemsAcc, item) => {
        const qty = Math.max(quantities[item.id] ?? 0, 0);
        return itemsAcc + item.unitPrice * qty;
      }, 0);
      return acc + categoryTotal;
    }, 0);
  }, [catalogoKuche, quantities]);

  const totales = useMemo(() => {
    const costoBaseDirecto = baseCost;
    const montoUtilidad = costoBaseDirecto * (utilidadPct / 100);
    const montoFlete = costoBaseDirecto * (fletePct / 100);
    const subtotalComercial = costoBaseDirecto + montoUtilidad + montoFlete;
    const montoIva = subtotalComercial * 0.16;
    const totalNeto = subtotalComercial + montoIva;

    return {
      costoBaseDirecto,
      montoUtilidad,
      montoFlete,
      subtotalComercial,
      montoIva,
      totalNeto,
    };
  }, [baseCost, utilidadPct, fletePct]);

  const precioTotalSinIva = totales.subtotalComercial;
  const montoIva = totales.montoIva;
  const totalNeto = totales.totalNeto;

  const handleQuantityChange = (id: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(value, 0),
    }));
  };

  const activeCategory =
    catalogoKuche.find((category) => category.category === activeTab) ?? catalogoKuche[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCatalog = window.localStorage.getItem("kuche.catalogoKuche.v1");
    if (storedCatalog) {
      try {
        const parsed = JSON.parse(storedCatalog);
        if (Array.isArray(parsed)) {
          const normalized = parsed.filter(
            (category: { category?: string; items?: unknown[] }) =>
              category &&
              typeof category.category === "string" &&
              Array.isArray(category.items),
          );
          if (normalized.length > 0) {
            setCatalogoKuche(normalized);
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setActiveCitaTaskId(window.localStorage.getItem(activeCitaTaskStorageKey));
    setActiveCotizacionFormalTaskId(window.localStorage.getItem(activeCotizacionFormalTaskStorageKey));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("kuche.catalogoKuche.v1", JSON.stringify(catalogoKuche));
  }, [catalogoKuche]);

  useEffect(() => {
    const estructura = catalogoKuche.find((c) => c.category === "ESTRUCTURA");
    const vistas = catalogoKuche.find((c) => c.category === "VISTAS");
    const espesor = catalogoKuche.find((c) => c.category === "ESPESOR");
    const estructuraIds = new Set(estructura?.items?.map((i) => i.id) ?? []);
    const vistasIds = new Set(vistas?.items?.map((i) => i.id) ?? []);
    const espesorIds = new Set(espesor?.items?.map((i) => i.id) ?? []);
    if (estructura?.items?.length && !estructuraIds.has(materialBaseItemId)) {
      setMaterialBaseItemId(estructura.items[0].id);
    }
    if (vistas?.items?.length && !vistasIds.has(colorItemId)) {
      setColorItemId(vistas.items[0].id);
    }
    if (espesor?.items?.length && !espesorIds.has(thicknessItemId)) {
      setThicknessItemId(espesor.items[0].id);
    }
  }, [catalogoKuche]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (openMenuRef.current && event.target instanceof Node) {
        if (openMenuRef.current.contains(event.target)) {
          return;
        }
      }
      setOpenMenuId(null);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const toCatalogId = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 32);

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const clampPct = (value: number) => Math.min(100, Math.max(0, value));

  const normalizedSearch = normalizeText(materialSearch.trim());

  const visibleItems = useMemo(() => {
    if (!normalizedSearch) {
      return (activeCategory?.items ?? []).map((item) => ({
        item,
        category: activeCategory?.category ?? "",
      }));
    }
    return catalogoKuche.flatMap((category) =>
      category.items
        .filter((item) => normalizeText(item.label).includes(normalizedSearch))
        .map((item) => ({ item, category: category.category })),
    );
  }, [activeCategory, catalogoKuche, normalizedSearch]);

  const resetCatalogToDefault = () => {
    setCatalogoKuche(initialCatalogoKuche);
    setQuantities({});
    setExcelImportSummary(null);
    setExcelPreviewLines([]);
    setIsExcelViewActive(false);
    setMaterialSearch("");
    setActiveTab(initialCatalogoKuche[0]?.category ?? "");
    setMaterialBaseItemId(getDefaultMaterialBaseItemId());
    setColorItemId(getDefaultColorItemId());
    setThicknessItemId(getDefaultThicknessItemId());
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "kuche.catalogoKuche.v1",
        JSON.stringify(initialCatalogoKuche),
      );
    }
  };

  const handleExcelImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const [firstSheetName] = workbook.SheetNames;
      const sheet = workbook.Sheets[firstSheetName];
      if (!sheet) {
        setExcelPreviewLines([]);
        setExcelImportSummary({
          imported: 0,
          skipped: 0,
          errors: ["El archivo no contiene hojas válidas."],
          fileName: file.name,
        });
        return;
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
      });

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];
      const previewLines: Array<{
        id: string;
        categoria: string;
        descripcion: string;
        cantidad: number;
        precioUnitario: number;
        total: number;
      }> = [];

      const headerKeys = {
        categoria: ["Categoria", "CATEGORIA", "category", "CATEGORY"],
        codigo: ["Codigo", "CÓDIGO", "CODIGO", "code", "CODE"],
        descripcion: ["Descripcion", "Descripción", "DESCRIPCION", "DESCRIPCIÓN", "description"],
        cantidad: ["Cantidad", "CANTIDAD", "qty", "QTY"],
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

      rows.forEach((row: Record<string, unknown>, index: number) => {
        const rowNumber = index + 2;
        const rawDescripcion = getCell(row, headerKeys.descripcion);
        const rawCantidad = getCell(row, headerKeys.cantidad);
        const rawCategoria = getCell(row, headerKeys.categoria);
        const rawPrecio = getCell(row, headerKeys.precioUnitario);
        const rawCodigo = getCell(row, headerKeys.codigo);

        const descripcion = rawDescripcion ? String(rawDescripcion).trim() : "";
        if (!descripcion) {
          skipped += 1;
          errors.push(`Fila ${rowNumber}: sin descripción, se omitió.`);
          return;
        }

        const cantidadValue = Number(rawCantidad);
        if (!Number.isFinite(cantidadValue) || cantidadValue <= 0) {
          skipped += 1;
          errors.push(`Fila ${rowNumber}: cantidad inválida, se omitió.`);
          return;
        }

        const precioValueRaw = rawPrecio != null ? Number(rawPrecio) : NaN;
        const precioUnitario = Number.isFinite(precioValueRaw) && precioValueRaw >= 0 ? precioValueRaw : 0;
        if (!Number.isFinite(precioValueRaw)) {
          errors.push(
            `Fila ${rowNumber}: precio unitario vacío o inválido, se tomó 0 como valor temporal.`,
          );
        }

        const categoriaName = rawCategoria
          ? String(rawCategoria).toUpperCase().trim()
          : "SIN CATEGORIA";
        const id = `excel-${index}-${toCatalogId(descripcion)}`;
        const total = precioUnitario * cantidadValue;

        previewLines.push({
          id,
          categoria: categoriaName,
          descripcion,
          cantidad: cantidadValue,
          precioUnitario,
          total,
        });

        imported += 1;
      });

      setExcelPreviewLines(previewLines);
      setExcelImportSummary({
        imported,
        skipped,
        errors,
        fileName: file.name,
      });
      setIsExcelViewActive(true);
    } catch (error) {
      console.error(error);
      setExcelPreviewLines([]);
      setExcelImportSummary({
        imported: 0,
        skipped: 0,
        errors: ["No se pudo leer el archivo. Verifica que sea un Excel válido."],
        fileName: file.name,
      });
    }
  };

  const handleAddMaterial = () => {
    const trimmedName = newItemName.trim();
    const parsedPrice = Number.parseFloat(newItemPrice);
    if (!trimmedName || Number.isNaN(parsedPrice)) {
      return;
    }

    const nextIdBase = toCatalogId(trimmedName) || "nuevo";
    const nextId = `${nextIdBase}_${Date.now().toString(36)}`;

    setCatalogoKuche((prev) =>
      prev.map((category) =>
        category.category === newItemCategory
          ? {
              ...category,
              items: [
                ...category.items,
                { id: nextId, label: trimmedName, unitPrice: parsedPrice },
              ],
            }
          : category,
      ),
    );

    setNewItemName("");
    setNewItemPrice("");
    setEditingItemId(null);
    setIsAddModalOpen(false);
  };

  const handleAddClient = () => {
    const trimmedName = newClientName.trim();
    if (!trimmedName) {
      return;
    }
    setClients((prev) =>
      prev.some((entry) => entry.name === trimmedName)
        ? prev
        : [
            ...prev,
            {
              name: trimmedName,
              phone: newClientPhone.trim(),
              email: newClientEmail.trim(),
            },
          ],
    );
    setClient(trimmedName);
    setNewClientName("");
    setNewClientPhone("");
    setNewClientEmail("");
    setIsClientModalOpen(false);
  };

  const handleEditMaterial = (itemId: string) => {
    const categoryMatch = catalogoKuche.find((category) =>
      category.items.some((item) => item.id === itemId),
    );
    const itemMatch = categoryMatch?.items.find((item) => item.id === itemId);
    if (!categoryMatch || !itemMatch) {
      return;
    }
    setEditingItemId(itemId);
    setNewItemName(itemMatch.label);
    setNewItemPrice(String(itemMatch.unitPrice));
    setNewItemCategory(categoryMatch.category);
    setIsAddModalOpen(true);
  };

  const handleSaveMaterial = () => {
    const trimmedName = newItemName.trim();
    const parsedPrice = Number.parseFloat(newItemPrice);
    if (!trimmedName || Number.isNaN(parsedPrice)) {
      return;
    }

    if (!editingItemId) {
      handleAddMaterial();
      return;
    }

    setCatalogoKuche((prev) =>
      prev.map((category) => {
        const withoutItem = category.items.filter((item) => item.id !== editingItemId);
        if (category.category !== newItemCategory) {
          return { ...category, items: withoutItem };
        }
        return {
          ...category,
          items: [
            ...withoutItem,
            { id: editingItemId, label: trimmedName, unitPrice: parsedPrice },
          ],
        };
      }),
    );

    setNewItemName("");
    setNewItemPrice("");
    setEditingItemId(null);
    setIsAddModalOpen(false);
  };

  const handleReferenceImagesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }
    const loaded = await Promise.all(
      files.map(
        (file) =>
          new Promise<{ id: string; name: string; dataUrl: string } | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result !== "string") {
                resolve(null);
                return;
              }
              resolve({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name: file.name,
                dataUrl: reader.result,
              });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          }),
      ),
    );
    setReferenceImages((prev) => [
      ...prev,
      ...(loaded.filter(Boolean) as Array<{ id: string; name: string; dataUrl: string }>),
    ].slice(0, 6));
    event.target.value = "";
  };

  const handleRemoveReferenceImage = (imageId: string) => {
    setReferenceImages((prev) => prev.filter((image) => image.id !== imageId));
  };

  const handleDeleteMaterial = (itemId: string) => {
    setCatalogoKuche((prev) =>
      prev.map((category) => ({
        ...category,
        items: category.items.filter((item) => item.id !== itemId),
      })),
    );
    setQuantities((prev) => {
      if (!(itemId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const handleFinishCita = () => {
    if (typeof window === "undefined") {
      return;
    }
    const taskId = window.localStorage.getItem(activeCitaTaskStorageKey);
    if (!taskId) {
      router.push("/dashboard/empleado");
      return;
    }
    const stored = window.localStorage.getItem(kanbanStorageKey);
    let baseTasks = initialKanbanTasks as KanbanTask[];
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as KanbanTask[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseTasks = parsed;
        }
      } catch {
        // ignore malformed storage
      }
    }
    const next = baseTasks.map((task) => {
      if (task.id !== taskId) return task;
      // Al terminar cita la tarea pasa a Diseños (misma lógica que cotizador preliminar)
      return {
        ...task,
        stage: "disenos" as const,
        status: "pendiente" as const,
        citaStarted: true,
        citaFinished: true,
      };
    });
    window.localStorage.setItem(kanbanStorageKey, JSON.stringify(next));
    window.localStorage.removeItem(activeCitaTaskStorageKey);
    setActiveCitaTaskId(null);
    router.push("/dashboard/empleado");
  };

  const validateFormalSections = (): boolean => {
    const hasProject = client.trim() !== "" || projectType !== "" || location.trim() !== "" || installDate !== "";
    const largoN = Number.parseFloat(largo) || 0;
    const altoN = Number.parseFloat(alto) || 0;
    const fondoN = Number.parseFloat(fondo) || 0;
    const hasMeasures = largoN > 0 || altoN > 0 || fondoN > 0;
    const hasCatalog = Object.values(quantities).some((q) => q > 0);
    return !!(hasProject && hasMeasures && hasCatalog);
  };

  const buildCotizacionFormalDataFromForm = (): CotizacionFormalData => ({
    client: client.trim() || "—",
    projectType: projectType || "—",
    location: location.trim() || "—",
    date: installDate || "—",
    rangeLabel: "Cotización formal",
    cubierta: baseMaterialLabel || "—",
    frente: colorLabel || "—",
    herraje: "—",
  });

  const saveFormalAndGetNextTasks = (data: CotizacionFormalData): { codigoProyecto: string; updatedTasks: KanbanTask[] } | null => {
    if (typeof window === "undefined") return null;
    const taskId = window.localStorage.getItem(activeCotizacionFormalTaskStorageKey);
    if (!taskId) return null;
    if (!validateFormalSections()) {
      setFinishFormalError("Completa al menos un dato en cada sección: datos del proyecto, medidas y al menos un ítem en el catálogo.");
      return null;
    }
    let baseTasks: KanbanTask[] = initialKanbanTasks as KanbanTask[];
    const stored = window.localStorage.getItem(kanbanStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as KanbanTask[];
        if (Array.isArray(parsed) && parsed.length > 0) baseTasks = parsed;
      } catch {
        // ignore
      }
    }
    const taskToUpdate = baseTasks.find((t) => t.id === taskId);
    const codigoProyecto = taskToUpdate?.codigoProyecto ?? `K-${Date.now()}`;
    const existingList = taskToUpdate ? getCotizacionesFormalesList(taskToUpdate) : [];
    const cotizacionesFormales = [...existingList, data];
    const next = baseTasks.map((task) => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        codigoProyecto: task.codigoProyecto ?? codigoProyecto,
        cotizacionesFormales,
        cotizacionFormalData: data,
        citaFinished: true,
        stage: task.stage,
        status: task.status,
        followUpEnteredAt: task.followUpEnteredAt,
        followUpStatus: task.followUpStatus,
      };
    });
    window.localStorage.setItem(kanbanStorageKey, JSON.stringify(next));
    const projectKey = `${seguimientoProjectStoragePrefix}${codigoProyecto}`;
    try {
      const existing = window.localStorage.getItem(projectKey);
      const base =
        existing != null
          ? (JSON.parse(existing) as Record<string, unknown>)
          : { codigo: codigoProyecto, cliente: taskToUpdate?.project ?? "Cliente", isProspect: false };
      const seguimientoProject = {
        ...base,
        codigo: codigoProyecto,
        cliente: ((base.cliente as string) || taskToUpdate?.project) ?? "Cliente",
        isProspect: false,
        cotizacionesFormales,
      };
      window.localStorage.setItem(projectKey, JSON.stringify(seguimientoProject));
    } catch {
      // optional
    }
    return { codigoProyecto, updatedTasks: next };
  };

  const handleTerminarCotizacion = async () => {
    setFinishFormalError("");
    const taskId = window.localStorage.getItem(activeCotizacionFormalTaskStorageKey);
    if (!taskId) {
      router.push("/dashboard/empleado");
      return;
    }
    if (!validateFormalSections()) {
      setFinishFormalError("Completa al menos un dato en cada sección: datos del proyecto, medidas y al menos un ítem en el catálogo.");
      return;
    }
    let dataUrl: string;
    try {
      dataUrl = await buildFormalPdfDataUrl();
    } catch {
      setFinishFormalError("No se pudo generar el PDF. Intenta de nuevo.");
      return;
    }
    const data = buildCotizacionFormalDataFromForm();
    const existingCount = (() => {
      try {
        const stored = window.localStorage.getItem(kanbanStorageKey);
        const tasks = stored ? (JSON.parse(stored) as KanbanTask[]) : [];
        const task = tasks.find((t) => t.id === taskId);
        return task ? getCotizacionesFormalesList(task).length : 0;
      } catch {
        return 0;
      }
    })();
    const formalPdfKey = createFormalPdfKey(taskId, existingCount);
    try {
      await saveFormalPdf(formalPdfKey, dataUrl);
    } catch {
      setFinishFormalError("No se pudo guardar el PDF. Intenta de nuevo.");
      return;
    }
    data.formalPdfKey = formalPdfKey;
    const result = saveFormalAndGetNextTasks(data);
    if (!result) return;
    const updatedTasksWithStage = result.updatedTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            stage: "contrato" as const,
            status: "pendiente" as const,
            followUpEnteredAt: Date.now(),
            followUpStatus: "pendiente" as const,
          }
        : task,
    );
    window.localStorage.setItem(kanbanStorageKey, JSON.stringify(updatedTasksWithStage));
    window.localStorage.removeItem(activeCotizacionFormalTaskStorageKey);
    setActiveCotizacionFormalTaskId(null);
    try {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `cotizacion-formal-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${(data.client || "cliente").replace(/\s+/g, "-")}.pdf`;
      link.click();
    } catch {
      // optional
    }
    const returnUrl = window.localStorage.getItem(citaReturnUrlStorageKey) || "/dashboard/empleado";
    window.localStorage.removeItem(citaReturnUrlStorageKey);
    router.push(returnUrl);
  };

  const handleTerminarYContinuar = async () => {
    setFinishFormalError("");
    if (!validateFormalSections()) {
      setFinishFormalError("Completa al menos un dato en cada sección: datos del proyecto, medidas y al menos un ítem en el catálogo.");
      return;
    }
    const taskId = window.localStorage.getItem(activeCotizacionFormalTaskStorageKey);
    if (!taskId) return;
    let dataUrl: string;
    try {
      dataUrl = await buildFormalPdfDataUrl();
    } catch {
      setFinishFormalError("No se pudo generar el PDF. Intenta de nuevo.");
      return;
    }
    const data = buildCotizacionFormalDataFromForm();
    const existingCount = (() => {
      try {
        const stored = window.localStorage.getItem(kanbanStorageKey);
        const tasks = stored ? (JSON.parse(stored) as KanbanTask[]) : [];
        const task = tasks.find((t) => t.id === taskId);
        return task ? getCotizacionesFormalesList(task).length : 0;
      } catch {
        return 0;
      }
    })();
    const formalPdfKey = createFormalPdfKey(taskId, existingCount);
    try {
      await saveFormalPdf(formalPdfKey, dataUrl);
    } catch {
      setFinishFormalError("No se pudo guardar el PDF. Intenta de nuevo.");
      return;
    }
    data.formalPdfKey = formalPdfKey;
    const result = saveFormalAndGetNextTasks(data);
    if (!result) return;
    try {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `cotizacion-formal-${(data.projectType || "proyecto").replace(/\s+/g, "-")}-${(data.client || "cliente").replace(/\s+/g, "-")}.pdf`;
      link.click();
    } catch {
      // optional
    }
    setProjectType(projectTypes[0]);
    setLocation("");
    setInstallDate("");
    setLargo("4.2");
    setAlto("2.4");
    setFondo("0.6");
    setQuantities({});
    setMaterialBaseItemId(getDefaultMaterialBaseItemId);
    setColorItemId(getDefaultColorItemId);
    setThicknessItemId(getDefaultThicknessItemId);
  };

  const buildPrintWindow = (title: string, bodyHtml: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      return;
    }
    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif; margin: 32px; color: #111827; }
      h1, h2, h3, p { margin: 0; }
      .muted { color: #6b7280; }
      .header { display: flex; align-items: flex-start; justify-content: flex-start; gap: 24px; }
      .logo { height: 100px; width: 300px; object-fit: contain; object-position: left center; display: block; }
      .meta { margin-top: 8px; }
      .section { margin-top: 24px; }
      .card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; }
      .row { display: flex; justify-content: space-between; gap: 16px; }
      .row + .row { margin-top: 12px; }
      .divider { border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0; }
      .total { font-size: 28px; font-weight: 700; color: #8b1c1c; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 8px 6px; font-size: 12px; }
      th { color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
      td { border-bottom: 1px solid #f3f4f6; }
      .right { text-align: right; }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  };

  const getImageDataUrl = async (imageUrl: string) => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  };

  const normalizeImageForPdf = async (dataUrl: string) => {
    return await new Promise<string | null>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      image.onerror = () => resolve(null);
      image.src = dataUrl;
    });
  };

  const handleGenerateClientPdf = async (returnDataUrl?: boolean): Promise<string | void> => {
    if (typeof window === "undefined") {
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 42;
    const contentWidth = pageWidth - marginX * 2;
    const brandColor: [number, number, number] = [97, 28, 28];
    const accentColor: [number, number, number] = [17, 24, 39];
    const darkColor: [number, number, number] = [31, 41, 55];
    const mutedColor: [number, number, number] = [100, 116, 139];
    const softFill: [number, number, number] = [248, 250, 252];
    const lightBorder: [number, number, number] = [226, 232, 240];
    const dateLabel = new Date().toLocaleDateString("es-MX");

    const normalizedType = projectType.toLowerCase();
    const formalProjectType = normalizedType.includes("cocina")
      ? "COCINA"
      : normalizedType.includes("cl") || normalizedType.includes("vest")
        ? "VESTIDOR O CLÓSET"
        : normalizedType.includes("bañ") || normalizedType.includes("ban")
          ? "BAÑOS"
          : normalizedType.includes("tv")
            ? "TV UNIT"
            : projectType.toUpperCase();

    const selectedLines = catalogoKuche.flatMap((category) =>
      category.items
        .map((item) => {
          const qty = Math.max(quantities[item.id] ?? 0, 0);
          if (!qty) {
            return null;
          }
          return {
            category: category.category,
            label: item.label,
            qty,
            total: item.unitPrice * qty,
          };
        })
        .filter(
          (line): line is { category: string; label: string; qty: number; total: number } =>
            line !== null,
        ),
    );

    const drawersQty = selectedLines
      .filter((line) => /caj[oó]n/i.test(line.label))
      .reduce((acc, line) => acc + line.qty, 0);
    const zocloQty = selectedLines
      .filter((line) => /zoclo/i.test(line.label))
      .reduce((acc, line) => acc + line.qty, 0);
    const spotsQty = selectedLines
      .filter((line) => /spot/i.test(line.label))
      .reduce((acc, line) => acc + line.qty, 0);
    const extrasSummary = selectedLines
      .slice(0, 4)
      .map((line) => `${line.label} (${line.qty})`)
      .join(", ");
    const hasElectroCategorySelections = selectedLines.some((line) =>
      /extra[ií]bles|electrodom/i.test(line.category),
    );

    const largoValue = Number.parseFloat(largo) || 0;
    const altoValue = Number.parseFloat(alto) || 0;
    const fondoValue = Number.parseFloat(fondo) || 0;
    const metrosLinealesForDescription = largoValue;
    const basePrice = Math.round(precioTotalSinIva);
    const projectPrice = Math.round(totalNeto);
    const anticipo = Math.round(projectPrice * 0.5);
    const primerDia = Math.round(projectPrice * 0.25);
    const finiquito = projectPrice - anticipo - primerDia;
    const ivaEstimado = Math.round(montoIva);

    const projectDescription =
      `Proyecto de ${formalProjectType} fabricado en ${baseMaterialLabel} (${thicknessMm}mm), ` +
      `tono ${colorLabel.toLowerCase()}, con medidas generales de ` +
      `${largoValue.toFixed(1)}m de largo, ${altoValue.toFixed(1)}m de alto y ${fondoValue.toFixed(1)}m de fondo, ` +
      `considerando ${metrosLinealesForDescription.toFixed(1)} m lineales. ` +
      "Incluye fabricación e instalación de módulos y componentes seleccionados.";

    const specs = [
      `Este proyecto cuenta con ${drawersQty} cajones seleccionados.`,
      "Todas las puertas en este proyecto consideran cierre suave.",
      `Este proyecto cuenta con ${zocloQty} elementos de zoclo.`,
      spotsQty
        ? `Este proyecto considera ${spotsQty} spots de iluminación.`
        : "Este proyecto no considera spots de iluminación.",
      extrasSummary
        ? `Accesorios y conceptos principales: ${extrasSummary}.`
        : "Accesorios y conceptos principales por definir en visita técnica.",
    ];

    const legalNotes = [
      "Se requiere el 50% como anticipo, un 25% al iniciar la instalación y el 25% restante al finalizar la instalación.",
      hasElectroCategorySelections
        ? "La presente propuesta sí incluye conceptos de la categoría Extraíbles y electrodomésticos según la selección del cliente."
        : "La cotización no incluye ningún electrodoméstico salvo que se indique por separado.",
      "Las medidas de los muebles pueden variar dependiendo de las medidas finales del espacio.",
      "Tiempo de entrega estimado: 8 a 9 semanas.",
      `Precio base sin IVA: ${formatCurrency(basePrice)}. IVA estimado: ${formatCurrency(ivaEstimado)}.`,
      "Vigencia de la cotización: 15 días naturales.",
    ];

    const getTableFinalY = () =>
      (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 0;
    const ensureSpace = (currentY: number, requiredHeight: number) => {
      if (currentY + requiredHeight <= pageHeight - 52) {
        return currentY;
      }
      doc.addPage();
      return 56;
    };
    const drawSectionTitle = (title: string, y: number) => {
      doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
      doc.line(marginX, y + 4, marginX + contentWidth, y + 4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
      doc.text(title, marginX, y);
    };

    const logoDataUrl = await getImageDataUrl(new URL("/images/kuche-logo.png", window.location.origin).toString());

    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.roundedRect(marginX, 28, contentWidth, 78, 10, 10, "F");
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(marginX + contentWidth - 180, 28, 180, 78, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    if (logoDataUrl) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(marginX + 12, 38, 112, 58, 6, 6, "F");
      doc.addImage(logoDataUrl, "PNG", marginX + 18, 44, 100, 44, undefined, "FAST");
    }
    doc.text("KUCHE", marginX + 132, 54);
    doc.setFontSize(13);
    doc.text("COTIZACIÓN FORMAL", marginX + 132, 75);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Mobiliario residencial a medida", marginX + 132, 91);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const rightInfoLabelX = marginX + contentWidth - 164;
    const rightInfoValueX = marginX + contentWidth - 16;
    doc.text("FECHA", rightInfoLabelX, 53);
    doc.text("TIPO DE PROYECTO", rightInfoLabelX, 79);
    doc.setFont("helvetica", "normal");
    doc.text(dateLabel, rightInfoValueX, 53, { align: "right" });
    const wrappedProjectType = doc.splitTextToSize(formalProjectType, 84);
    wrappedProjectType.forEach((line: string, index: number) => {
      doc.text(line, rightInfoValueX, 79 + index * 9, { align: "right" });
    });

    autoTable(doc, {
      startY: 122,
      body: [
        ["CLIENTE", client || "Pendiente de definir"],
        ["DIRECCIÓN", location || "Pendiente de definir"],
        ["FECHA", dateLabel],
        ["TIPO DE PROYECTO", formalProjectType],
        ["FECHA DE INSTALACIÓN", installDate || "Por definir"],
      ],
      theme: "grid",
      styles: {
        fontSize: 9,
        textColor: darkColor,
        lineColor: lightBorder,
        lineWidth: 0.5,
        cellPadding: 6,
      },
      columnStyles: {
        0: { cellWidth: 150, fontStyle: "bold", fillColor: softFill },
        1: { cellWidth: contentWidth - 150 },
      },
      margin: { left: marginX, right: marginX },
    });

    const baseInfoY = getTableFinalY() + 18;
    drawSectionTitle("APARTADO Y DESCRIPCIÓN", baseInfoY);

    autoTable(doc, {
      startY: baseInfoY + 8,
      head: [["APARTADO", "DESCRIPCIÓN", "PRECIO"]],
      body: [["C-1", projectDescription, formatCurrency(projectPrice)]],
      theme: "grid",
      styles: {
        fontSize: 9,
        textColor: darkColor,
        lineColor: lightBorder,
        lineWidth: 0.5,
        cellPadding: 6,
      },
      headStyles: { fillColor: softFill, textColor: darkColor, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 76, halign: "center", fontStyle: "bold" },
        1: { cellWidth: contentWidth - 214 },
        2: { cellWidth: 138, halign: "right", fontStyle: "bold" },
      },
      margin: { left: marginX, right: marginX },
    });

    let cursorY = getTableFinalY() + 18;
    cursorY = ensureSpace(cursorY, 150);
    drawSectionTitle("DETALLES DE PROYECTO", cursorY);
    cursorY += 16;

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("ESPECIFICACIONES DE PROYECTO", marginX + 4, cursorY);
    cursorY += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    specs.forEach((line) => {
      const wrapped = doc.splitTextToSize(`• ${line}`, contentWidth - 8);
      doc.text(wrapped, marginX + 4, cursorY);
      cursorY += wrapped.length * 10.5 + 3;
    });

    cursorY += 4;
    const pdfReferenceImages = await Promise.all(
      referenceImages.slice(0, 4).map(async (image) => ({
        ...image,
        pdfDataUrl: await normalizeImageForPdf(image.dataUrl),
      })),
    );
    const imageRows = Math.max(1, Math.ceil(pdfReferenceImages.length / 2));
    const imageAreaHeight = pdfReferenceImages.length ? imageRows * 94 + 12 : 56;
    cursorY = ensureSpace(cursorY, imageAreaHeight + 24);
    drawSectionTitle("IMÁGENES DE REFERENCIA", cursorY);
    cursorY += 10;
    doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
    doc.roundedRect(marginX, cursorY, contentWidth, imageAreaHeight, 8, 8, "S");
    if (!pdfReferenceImages.length) {
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text(
        "Espacio reservado para renders o imágenes aprobadas en visita comercial.",
        marginX + 10,
        cursorY + 33,
      );
    } else {
      const gridPadding = 8;
      const cellGap = 10;
      const cellWidth = (contentWidth - gridPadding * 2 - cellGap) / 2;
      const cellHeight = 84;
      pdfReferenceImages.forEach((image, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const cellX = marginX + gridPadding + col * (cellWidth + cellGap);
        const cellY = cursorY + gridPadding + row * 94;
        doc.roundedRect(cellX, cellY, cellWidth, cellHeight, 6, 6, "S");
        try {
          if (!image.pdfDataUrl) {
            throw new Error("invalid-image");
          }
          doc.addImage(
            image.pdfDataUrl,
            "JPEG",
            cellX + 2,
            cellY + 2,
            cellWidth - 4,
            cellHeight - 4,
            undefined,
            "FAST",
          );
        } catch {
          doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text("No se pudo renderizar imagen", cellX + 8, cellY + 18);
        }
      });
    }

    cursorY += imageAreaHeight + 20;
    cursorY = ensureSpace(cursorY, 180);
    drawSectionTitle("CONDICIONES Y FORMA DE PAGO", cursorY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    let notesCursor = cursorY + 18;
    legalNotes.forEach((note) => {
      const wrapped = doc.splitTextToSize(`• ${note}`, contentWidth - 6);
      doc.text(wrapped, marginX + 3, notesCursor);
      notesCursor += wrapped.length * 9.5 + 2;
    });

    autoTable(doc, {
      startY: notesCursor + 6,
      head: [["CONCEPTO", "%", "MONTO"]],
      body: [
        ["PAGO INICIAL DE CONTRATO", "50%", formatCurrency(anticipo)],
        ["PRIMER DÍA DE INSTALACIÓN", "25%", formatCurrency(primerDia)],
        ["FINIQUITO", "25%", formatCurrency(finiquito)],
        ["TOTAL", "100%", formatCurrency(projectPrice)],
      ],
      theme: "grid",
      styles: {
        fontSize: 9,
        textColor: darkColor,
        lineColor: lightBorder,
        lineWidth: 0.5,
        cellPadding: 6,
      },
      headStyles: { fillColor: softFill, textColor: darkColor, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: contentWidth - 198, fontStyle: "bold" },
        1: { cellWidth: 60, halign: "center" },
        2: { cellWidth: 138, halign: "right", fontStyle: "bold" },
      },
      margin: { left: marginX, right: marginX },
    });

    const footerY = pageHeight - 36;
    doc.setDrawColor(lightBorder[0], lightBorder[1], lightBorder[2]);
    doc.line(marginX, footerY - 18, marginX + contentWidth, footerY - 18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.setFontSize(8);
    doc.text("Copal No. 303 Fracc. Vista Hermosa · Tel. 618 101 7363", marginX, footerY - 2);
    doc.text("cocinasinteligentesdgo@gmail.com", marginX, footerY + 10);

    const filename = `cotizacion-formal-${(client || "cliente").replace(/\s+/g, "-").toLowerCase()}.pdf`;
    if (returnDataUrl) {
      const blob = doc.output("blob");
      return new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    }
    doc.save(filename);
  };

  /** Genera el PDF formal actual y lo devuelve como data URL (para guardar en la tarjeta). */
  const buildFormalPdfDataUrl = (): Promise<string> =>
    handleGenerateClientPdf(true) as Promise<string>;

  const handleGenerateWorkshopPdf = () => {
    const logoUrl = new URL("/images/kuche-logo.png", window.location.origin).toString();
    const detailRows = catalogoKuche
      .map((category) => {
        const itemRows = category.items
          .map((item) => {
            const qty = quantities[item.id] ?? 0;
            if (!qty) {
              return "";
            }
            const lineTotal = item.unitPrice * qty;
            return `
              <tr>
                <td>${item.label}</td>
                <td>${category.category}</td>
                <td class="right">${qty}</td>
                <td class="right">${formatCurrency(item.unitPrice)}</td>
                <td class="right">${formatCurrency(lineTotal)}</td>
              </tr>
            `;
          })
          .join("");
        if (!itemRows) {
          return "";
        }
        return itemRows;
      })
      .join("");

    const bodyHtml = `
      <div class="header">
        <img src="${logoUrl}" alt="Kuche" class="logo" />
        <div>
          <h1>Hoja de Taller</h1>
          <p class="muted">${new Date().toLocaleDateString("es-MX")}</p>
        </div>
      </div>
      <div class="meta">
        <p class="muted">${client || "Cliente sin nombre"} · ${projectType}</p>
        <p class="muted">${location || "Ubicación sin definir"} · ${installDate || "Fecha sin definir"}</p>
      </div>
      <div class="section card">
        <div class="row">
          <span class="muted">Total</span>
          <strong>${formatCurrency(precioTotalSinIva)}</strong>
        </div>
        <div class="row">
          <span class="muted">IVA (16%)</span>
          <strong>${formatCurrency(montoIva)}</strong>
        </div>
        <hr class="divider" />
        <div class="row">
          <span class="muted">Total Neto</span>
          <span class="total">${formatCurrency(totalNeto)}</span>
        </div>
      </div>
      <div class="section">
        <h2>Detalle técnico</h2>
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Categoría</th>
              <th class="right">Cantidad</th>
              <th class="right">Precio unitario</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${detailRows || `<tr><td colspan="5" class="muted">Sin materiales seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
    buildPrintWindow("Hoja de Taller", bodyHtml);
  };

  const scenarioPrices = scenarioCards.map((scenario) => {
    const base = materialSubtotal * scenario.multiplier;
    return {
      ...scenario,
      min: Math.round(base * 0.95),
      max: Math.round(base * 1.08),
    };
  });

  return (
    <div className="space-y-8 pb-24">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.3em] text-secondary">COTIZADOR PRO</p>
        <h1 className="mt-2 text-3xl font-semibold">Perfil del proyecto</h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">
          Fusiona una experiencia visual con un desglose técnico riguroso para el taller.
        </p>
      </div>
      {activeCitaTaskId ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-primary/10 bg-white/80 p-5 shadow-md backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">Cita en curso</p>
            <p className="mt-2 text-sm text-secondary">
              Al terminar la cita se marcará como completada en el tablero.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFinishCita}
            className="rounded-2xl bg-accent px-5 py-3 text-xs font-semibold text-white"
          >
            Terminar cita
          </button>
        </div>
      ) : null}
      {activeCotizacionFormalTaskId ? (
        <FormalCotizacionBanner
          taskId={activeCotizacionFormalTaskId}
          onTerminar={handleTerminarCotizacion}
          onTerminarYContinuar={handleTerminarYContinuar}
          error={finishFormalError}
        />
      ) : null}

      <section className="space-y-6 rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-semibold">Sección A · Datos del proyecto</h2>
          <p className="mt-2 text-sm text-secondary">Información base para abrir el expediente.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="text-xs font-semibold text-secondary">
            Cliente
            <div className="mt-2 flex gap-2">
              <input
                value={client}
                onChange={(event) => setClient(event.target.value)}
                list="clientes-sugeridos"
                placeholder="Buscar o escribir nuevo"
                className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setNewClientName("");
                  setNewClientPhone("");
                  setNewClientEmail("");
                  setIsClientModalOpen(true);
                }}
                className="rounded-2xl border border-primary/10 px-4 text-xs font-semibold text-secondary"
              >
                Nuevo
              </button>
            </div>
            <datalist id="clientes-sugeridos">
              {clients.map((entry) => (
                <option key={entry.name} value={entry.name} />
              ))}
            </datalist>
          </label>
          <label className="text-xs font-semibold text-secondary">
            Tipo de proyecto
            <select
              value={projectType}
              onChange={(event) => setProjectType(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
            >
              {projectTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-secondary">
            Ubicación
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Ciudad / Estado"
              className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
            />
          </label>
          <label className="text-xs font-semibold text-secondary">
            Fecha de instalación
            <input
              value={installDate}
              onChange={(event) => setInstallDate(event.target.value)}
              type="date"
              className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <div className="rounded-3xl border border-primary/10 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">El lienzo</p>
              <h3 className="mt-2 text-lg font-semibold">Medidas generales</h3>
              <p className="mt-1 text-xs text-secondary">Largo x alto x fondo en metros.</p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: "Largo", value: largo, setValue: setLargo },
                { label: "Alto", value: alto, setValue: setAlto },
                { label: "Fondo", value: fondo, setValue: setFondo },
              ].map((field) => (
                <label key={field.label} className="text-[11px] font-semibold text-secondary">
                  {field.label}
                  <input
                    value={field.value}
                    onChange={(event) => field.setValue(event.target.value)}
                    type="number"
                    min="0"
                    step="0.1"
                    className="mt-1 w-24 rounded-2xl border border-primary/10 bg-white px-3 py-2 text-sm outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <motion.section
        key="section-b"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md"
      >
        <div>
          <h2 className="text-2xl font-semibold">Sección B · Refinamiento y especificaciones</h2>
          <p className="mt-2 text-sm text-secondary">
            Ajusta materiales, herrajes y extras. El precio final se actualiza en tiempo real.
          </p>
        </div>

        <div className="rounded-3xl border border-dashed border-primary/20 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Importar</p>
              <h3 className="mt-2 text-lg font-semibold">Subir Excel desde app de diseños</h3>
              <p className="mt-1 text-[11px] text-secondary">
                Sube un archivo Excel con columnas como{" "}
                <span className="font-semibold">Categoria, Descripcion, Cantidad, PrecioUnitario</span>.
              </p>
            </div>
            <label className="ml-auto inline-flex cursor-pointer items-center rounded-2xl bg-accent px-4 py-2 text-xs font-semibold text-white">
              Subir Excel de materiales
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={resetCatalogToDefault}
              className="rounded-2xl border border-primary/10 bg-white px-4 py-2 text-xs font-semibold text-secondary hover:border-primary/30"
            >
              Restablecer catálogo base
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-secondary">
              Vista actual:{" "}
              <span className="font-semibold">
                {isExcelViewActive ? "Excel importado" : "Catálogo manual"}
              </span>
            </span>
            {excelImportSummary ? (
              <button
                type="button"
                className="rounded-full border border-primary/10 px-3 py-1 text-[11px] font-semibold text-secondary hover:border-primary/30"
                onClick={() => setIsExcelViewActive((prev) => !prev)}
              >
                Cambiar a vista {isExcelViewActive ? "catálogo" : "Excel"}
              </button>
            ) : null}
          </div>
          {excelImportSummary ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-[11px] text-secondary">
              <p className="font-semibold text-primary">
                {excelImportSummary.fileName}: {excelImportSummary.imported} filas importadas,
                {` `}
                {excelImportSummary.skipped} filas omitidas.
              </p>
              {excelImportSummary.errors.length ? (
                <ul className="list-disc space-y-1 pl-4">
                  {excelImportSummary.errors.slice(0, 5).map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                  {excelImportSummary.errors.length > 5 ? (
                    <li>… {excelImportSummary.errors.length - 5} detalles adicionales.</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        {isExcelViewActive && excelImportSummary && (
          <div className="rounded-3xl border border-primary/10 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">Vista Excel</p>
                <h3 className="mt-2 text-lg font-semibold">Resumen de materiales importados</h3>
                <p className="mt-1 text-[11px] text-secondary">
                  Tabla generada a partir del archivo Excel. El catálogo base no se modifica.
                </p>
              </div>
            </div>
            <div className="mt-4 max-h-[360px] overflow-auto rounded-2xl border border-primary/10">
              <table className="min-w-full text-left text-[11px] text-secondary">
                <thead className="bg-primary/5 text-[10px] uppercase tracking-[0.18em] text-secondary">
                  <tr>
                    <th className="px-3 py-2">Categoría</th>
                    <th className="px-3 py-2">Material</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Precio unitario</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {excelPreviewLines.map((line) => (
                    <tr key={line.id} className="border-t border-primary/5">
                      <td className="px-3 py-2 align-top text-[11px] font-semibold">
                        {line.categoria}
                      </td>
                      <td className="px-3 py-2 align-top text-[11px]">{line.descripcion}</td>
                      <td className="px-3 py-2 align-top text-right text-[11px]">
                        {line.cantidad}
                      </td>
                      <td className="px-3 py-2 align-top text-right text-[11px]">
                        {formatCurrency(line.precioUnitario)}
                      </td>
                      <td className="px-3 py-2 align-top text-right text-[11px]">
                        {formatCurrency(line.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isExcelViewActive && (
          <>
        <div className="flex flex-wrap gap-3">
          {catalogoKuche.map((category) => (
            <button
              key={category.category}
              onClick={() => {
                setActiveTab(category.category);
                setNewItemCategory(category.category);
              }}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === category.category
                  ? "bg-accent text-white"
                  : "border border-primary/10 bg-white text-secondary"
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex w-full max-w-xs items-center gap-2 rounded-2xl border border-primary/10 bg-white px-3 py-1.5 text-xs font-semibold text-secondary">
            <span>Buscar</span>
            <input
              value={materialSearch}
              onChange={(event) => setMaterialSearch(event.target.value)}
              placeholder="Ej. melamina, cajón, bisagra"
              className="w-full bg-transparent text-[13px] font-normal text-gray-700 outline-none"
            />
          </label>
          {materialSearch ? (
            <button
              type="button"
              onClick={() => setMaterialSearch("")}
              className="rounded-full border border-primary/10 px-3 py-2 text-xs font-semibold text-secondary"
            >
              Limpiar
            </button>
          ) : null}
          {normalizedSearch ? (
            <span className="text-xs text-secondary">
              {visibleItems.length} resultado{visibleItems.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        <div className="rounded-3xl border border-primary/10 bg-white p-6">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map(({ item, category }) => {
              const qty = quantities[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex h-full flex-col gap-2 rounded-2xl border border-primary/10 bg-white px-2.5 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="leading-tight">
                      <p className="text-[12px] font-semibold">{item.label}</p>
                      {normalizedSearch ? (
                        <p className="text-[10px] text-secondary">{category}</p>
                      ) : null}
                      <p className="text-[10px] text-secondary">{formatCurrency(item.unitPrice)}/pz</p>
                    </div>
                    <div className="relative" ref={openMenuId === item.id ? openMenuRef : null}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((prev) => (prev === item.id ? null : item.id));
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/10 text-sm font-semibold text-secondary transition hover:border-primary/30"
                      >
                        +
                      </button>
                      {openMenuId === item.id ? (
                        <div
                          className="absolute right-0 top-full z-10 mt-2 w-32 rounded-2xl border border-primary/10 bg-white p-2 shadow-lg"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleEditMaterial(item.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full rounded-xl px-3 py-2 text-left text-[11px] font-semibold text-secondary transition hover:bg-primary/5"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleDeleteMaterial(item.id);
                              setOpenMenuId(null);
                            }}
                            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, qty - 1)}
                      className="h-7 w-7 rounded-full border border-primary/10 text-sm font-semibold text-secondary transition hover:border-primary/30"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={qty}
                      onChange={(event) =>
                        handleQuantityChange(
                          item.id,
                          Number.parseInt(event.target.value, 10) || 0,
                        )
                      }
                      className="w-12 rounded-2xl border border-primary/10 bg-white px-2 py-1 text-center text-[11px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, qty + 1)}
                      className="h-7 w-7 rounded-full border border-primary/10 text-sm font-semibold text-secondary transition hover:border-primary/30"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
            {normalizedSearch && visibleItems.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-4 py-8 text-center text-xs font-semibold text-secondary">
                No hay materiales que coincidan con la búsqueda.
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setNewItemCategory(activeCategory?.category ?? catalogoKuche[0]?.category ?? "");
                setNewItemName("");
                setNewItemPrice("");
                setEditingItemId(null);
                setIsAddModalOpen(true);
              }}
              className="flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 px-4 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary transition hover:border-primary/40 hover:bg-primary/10"
            >
              + Agregar material
            </button>
          </div>
          {activeCategory?.category === "GASTOS FIJOS" ? (
            <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
              <div className="group flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">
                  Coeficiente de Operación (CO)
                </label>
                <div className="flex items-center space-x-2">
                  <span className="mr-2 text-xs text-gray-400">
                    {formatCurrency(totales.montoUtilidad)}
                  </span>
                  <div className="flex items-center bg-transparent">
                    <button
                      type="button"
                      onClick={() => setUtilidadPct((prev) => clampPct(prev - 5))}
                      className="p-2 text-gray-200 transition-colors hover:text-gray-400 focus:outline-none"
                      aria-label="Disminuir"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex w-12 items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={utilidadPct}
                        onFocus={(event) => event.currentTarget.select()}
                        onChange={(event) =>
                          setUtilidadPct(
                            clampPct(Number.parseInt(event.target.value, 10) || 0),
                          )
                        }
                        className="w-full appearance-none bg-transparent text-center text-sm font-medium text-gray-700 focus:outline-none"
                      />
                      <span className="text-sm font-medium text-gray-700">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUtilidadPct((prev) => clampPct(prev + 5))}
                      className="p-2 text-gray-200 transition-colors hover:text-gray-400 focus:outline-none"
                      aria-label="Aumentar"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="group flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">
                  Flete / Logística y Maniobras
                </label>
                <div className="flex items-center space-x-2">
                  <span className="mr-2 text-xs text-gray-400">
                    {formatCurrency(totales.montoFlete)}
                  </span>
                  <div className="flex items-center bg-transparent">
                    <button
                      type="button"
                      onClick={() => setFletePct((prev) => clampPct(prev - 5))}
                      className="p-2 text-gray-200 transition-colors hover:text-gray-400 focus:outline-none"
                      aria-label="Disminuir"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex w-12 items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={fletePct}
                        onFocus={(event) => event.currentTarget.select()}
                        onChange={(event) =>
                          setFletePct(
                            clampPct(Number.parseInt(event.target.value, 10) || 0),
                          )
                        }
                        className="w-full appearance-none bg-transparent text-center text-sm font-medium text-gray-700 focus:outline-none"
                      />
                      <span className="text-sm font-medium text-gray-700">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFletePct((prev) => clampPct(prev + 5))}
                      className="p-2 text-gray-200 transition-colors hover:text-gray-400 focus:outline-none"
                      aria-label="Aumentar"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">IVA (16%)</label>
                <span className="text-xs text-gray-400">{formatCurrency(totales.montoIva)}</span>
              </div>
            </div>
          ) : null}
        </div>
          </>
        )}
      </motion.section>

      <section className="space-y-6 rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-semibold">Sección C · Imágenes de referencia</h2>
          <p className="mt-2 text-sm text-secondary">
            Sube renders o fotos relacionadas al proyecto para incluirlas en la cotización formal.
          </p>
        </div>
        <div className="rounded-3xl border border-dashed border-primary/20 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-2xl bg-accent px-4 py-2 text-xs font-semibold text-white">
              Subir imágenes
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleReferenceImagesUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-secondary">
              Puedes cargar hasta 6 imágenes. El PDF mostrará las primeras 4.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {referenceImages.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm"
              >
                <img src={image.dataUrl} alt={image.name} className="h-40 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="truncate text-xs text-secondary">{image.name}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveReferenceImage(image.id)}
                    className="rounded-xl border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
            {!referenceImages.length ? (
              <div className="col-span-full rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-4 py-8 text-center text-xs font-semibold text-secondary">
                Aún no has subido imágenes de referencia.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {isClientModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div
            ref={clientModalRef}
            tabIndex={-1}
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Agregar cliente</h3>
              <button
                type="button"
                onClick={() => {
                  setIsClientModalOpen(false);
                  setNewClientName("");
                  setNewClientPhone("");
                  setNewClientEmail("");
                }}
                className="rounded-full border border-primary/10 px-3 py-1 text-xs font-semibold text-secondary"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <label className="text-xs font-semibold text-secondary">
                Nombre del cliente
                <input
                  value={newClientName}
                  onChange={(event) => setNewClientName(event.target.value)}
                  placeholder="Ej. Paulina Gómez"
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-secondary">
                Teléfono
                <input
                  value={newClientPhone}
                  onChange={(event) => setNewClientPhone(event.target.value)}
                  placeholder="Ej. 555 123 4567"
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-secondary">
                Correo electrónico
                <input
                  value={newClientEmail}
                  onChange={(event) => setNewClientEmail(event.target.value)}
                  type="email"
                  placeholder="Ej. correo@dominio.com"
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsClientModalOpen(false);
                  setNewClientName("");
                  setNewClientPhone("");
                  setNewClientEmail("");
                }}
                className="rounded-2xl border border-primary/10 bg-white px-5 py-2 text-xs font-semibold text-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddClient}
                className="rounded-2xl bg-accent px-5 py-2 text-xs font-semibold text-white"
              >
                Guardar cliente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div
            ref={addItemModalRef}
            tabIndex={-1}
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingItemId ? "Editar material" : "Agregar material"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItemId(null);
                }}
                className="rounded-full border border-primary/10 px-3 py-1 text-xs font-semibold text-secondary"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <label className="text-xs font-semibold text-secondary">
                Categoría
                <select
                  value={newItemCategory}
                  onChange={(event) => setNewItemCategory(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  {catalogoKuche.map((category) => (
                    <option key={category.category} value={category.category}>
                      {category.category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-secondary">
                Nombre del material
                <input
                  value={newItemName}
                  onChange={(event) => setNewItemName(event.target.value)}
                  placeholder="Ej. Tablero especial"
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-secondary">
                Precio unitario
                <input
                  value={newItemPrice}
                  onChange={(event) => setNewItemPrice(event.target.value)}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItemId(null);
                }}
                className="rounded-2xl border border-primary/10 bg-white px-5 py-2 text-xs font-semibold text-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveMaterial}
                className="rounded-2xl bg-accent px-5 py-2 text-xs font-semibold text-white"
              >
                {editingItemId ? "Guardar cambios" : "Guardar material"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Sección D · Estimación visual</p>
          <h2 className="mt-2 text-2xl font-semibold">Selecciona el Nivel de Acabados</h2>
          <p className="mt-2 text-sm text-secondary">
            Galería de niveles basada en metros lineales y material base.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {scenarioPrices.map((scenario, index) => (
            <motion.button
              key={scenario.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`group overflow-hidden rounded-3xl border text-left shadow-xl transition ${
                selectedScenario === scenario.id
                  ? "border-accent bg-white"
                  : "border-primary/10 bg-white/80 hover:border-primary/30"
              }`}
            >
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src={scenario.image}
                  alt={scenario.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  {scenario.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-secondary shadow"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-3 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-secondary">{scenario.title}</p>
                <h3 className="text-lg font-semibold">{scenario.subtitle}</h3>
                <div className="rounded-2xl bg-primary/5 px-4 py-3 text-center text-lg font-semibold text-accent">
                  {formatCurrency(scenario.min)} - {formatCurrency(scenario.max)}
                </div>
                <p className="text-xs text-secondary">
                  Base: {formatCurrency(materialSubtotal)} · {baseMaterialLabel}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-semibold">Sección E · Cierre y documentación</h2>
          <p className="mt-2 text-sm text-secondary">
            Resumen ejecutivo y generación de documentos para cliente y taller.
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-8 shadow-lg">
          <div className="flex items-center justify-between text-gray-600">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-semibold">{formatCurrency(precioTotalSinIva)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-gray-500">
            <span className="text-sm font-semibold">IVA (16%)</span>
            <span className="text-sm font-semibold">{formatCurrency(montoIva)}</span>
          </div>
          <hr className="my-4 border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">Total Neto</span>
            <span className="text-3xl font-bold text-[#8B1C1C]">
              {formatCurrency(totalNeto)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-2xl border border-primary/10 bg-white px-5 py-3 text-xs font-semibold text-secondary">
            Guardar Borrador
          </button>
          <button
            type="button"
            onClick={() => handleGenerateClientPdf()}
            className="rounded-2xl bg-[#8B1C1C] px-5 py-3 text-xs font-semibold text-white"
          >
            Generar PDF Cliente
          </button>
          <button
            type="button"
            onClick={handleGenerateWorkshopPdf}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white"
          >
            Generar Hoja de Taller
          </button>
        </div>
      </section>

      <div className="fixed bottom-6 right-6 z-40 w-[260px] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.25em] text-secondary">Total Neto</p>
        <p className="mt-2 text-2xl font-semibold text-accent">{formatCurrency(totalNeto)}</p>
        <p className="mt-2 text-[11px] text-secondary">
          {metrosValue} m lineales · {baseMaterialLabel} · {colorLabel} · {thicknessMm} mm
        </p>
      </div>
    </div>
  );
}
