"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

import {
  activeCitaTaskStorageKey,
  kanbanStorageKey,
  initialKanbanTasks,
  type KanbanTask,
} from "@/lib/kanban";

const projectTypes = ["Cocina", "Clóset", "TV Unit"];
const baseMaterials = [
  { id: "melamina", label: "Melamina", pricePerMeter: 6500 },
  { id: "mdf", label: "MDF", pricePerMeter: 7800 },
  { id: "tech", label: "Tech", pricePerMeter: 9800 },
];

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

const materialColors = [
  "Blanco Nieve",
  "Nogal Calido",
  "Gris Grafito",
  "Fresno Arena",
];

const initialCatalogoKuche = [
  {
    category: "CUBIERTA",
    items: [
      { id: "cub_melamina", label: "Cubierta melamina (pies)", unitPrice: 170 },
      { id: "cub_granito", label: "Granito (placas)", unitPrice: 12000 },
      { id: "mo_granito", label: "Mano obra granito (mts2)", unitPrice: 1400 },
    ],
  },
  {
    category: "ESTRUCTURA",
    items: [
      { id: "est_mel_blanca", label: "Melamina Blanca", unitPrice: 700 },
      { id: "est_mel_color", label: "Melamina Negro o gris", unitPrice: 1000 },
      { id: "est_cubrecantos", label: "Cubrecantos", unitPrice: 9 },
      { id: "est_cortes", label: "Cortes y enchapes", unitPrice: 1500 },
    ],
  },
  {
    category: "VISTAS",
    items: [
      { id: "vis_melamina", label: "Melamina Vistas", unitPrice: 1100 },
      { id: "vis_brillo", label: "Alto brillo/mate", unitPrice: 3300 },
      { id: "vis_cortes", label: "Cortes y enchape", unitPrice: 1500 },
      { id: "vis_cubrecantos", label: "Cubrecantos", unitPrice: 20 },
    ],
  },
  {
    category: "HERRAJES",
    items: [
      { id: "herr_cajon_sen", label: "Cajón sencillo", unitPrice: 120 },
      { id: "herr_cajon_len", label: "Cajón Cierre lento", unitPrice: 450 },
      { id: "herr_cajon_blum", label: "Cajón BLUM tandem", unitPrice: 700 },
      { id: "herr_puerta_len", label: "Puerta Cierre lento/Push", unitPrice: 50 },
      { id: "herr_bisagra", label: "Puertas Bisagras sencilla", unitPrice: 30 },
      { id: "herr_piston_sen", label: "Pistón sencillo", unitPrice: 40 },
      { id: "herr_piston_blum", label: "Pistón blum", unitPrice: 350 },
      { id: "herr_zoclo", label: "Zoclo", unitPrice: 180 },
      { id: "herr_patas", label: "Patas y clips", unitPrice: 17 },
      { id: "herr_push", label: "Push", unitPrice: 150 },
      { id: "herr_spots", label: "Spots", unitPrice: 250 },
      { id: "herr_puerta_esq", label: "Puertas Esquinera", unitPrice: 200 },
    ],
  },
  {
    category: "EXTRAÍBLES Y ELECTRODOMÉSTICOS",
    items: [
      { id: "ext_alacena", label: "Alacena doble", unitPrice: 3000 },
      { id: "ext_avento_hf", label: "Avento HF", unitPrice: 3500 },
      { id: "ext_especiero", label: "Especiero", unitPrice: 1800 },
      { id: "ext_servo", label: "Servo drive", unitPrice: 18000 },
      { id: "ele_parrilla", label: "Parrilla", unitPrice: 3500 },
      { id: "ele_campana", label: "Campana", unitPrice: 4500 },
    ],
  },
  {
    category: "GASTOS FIJOS Y VARIOS",
    items: [
      { id: "var_insumos", label: "Varios (thiner, estopa, silicon, tornillos)", unitPrice: 2000 },
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
  const [metrosLineales, setMetrosLineales] = useState("6");
  const [materialBase, setMaterialBase] = useState(baseMaterials[0].id);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialCatalogoKuche[0]?.category ?? "");
  const [materialSearch, setMaterialSearch] = useState("");

  const [materialColor] = useState(materialColors[0]);
  const [materialThickness] = useState("16");
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

  const metrosValue = Number.parseFloat(metrosLineales) || 0;
  const baseMaterial = baseMaterials.find((item) => item.id === materialBase) ?? baseMaterials[0];
  const thicknessFactor = materialThickness === "19" ? 1.08 : 1;

  const materialSubtotal = metrosValue * baseMaterial.pricePerMeter * thicknessFactor;

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
    const storedCatalog = window.localStorage.getItem("kuche.catalogoKuche.v1");
    if (!storedCatalog) {
      return;
    }
    try {
      const parsed = JSON.parse(storedCatalog);
      if (Array.isArray(parsed)) {
        const normalized = parsed.filter(
          (category) =>
            category &&
            typeof category.category === "string" &&
            Array.isArray(category.items),
        );
        if (normalized.length > 0) {
          setCatalogoKuche(normalized);
        }
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setActiveCitaTaskId(window.localStorage.getItem(activeCitaTaskStorageKey));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("kuche.catalogoKuche.v1", JSON.stringify(catalogoKuche));
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
    const next = baseTasks.map((task) =>
      task.id === taskId ? { ...task, status: "completada" } : task,
    );
    window.localStorage.setItem(kanbanStorageKey, JSON.stringify(next));
    window.localStorage.removeItem(activeCitaTaskStorageKey);
    setActiveCitaTaskId(null);
    router.push("/dashboard/empleado");
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

  const handleGenerateClientPdf = () => {
    const logoUrl = new URL("/images/kuche-logo.png", window.location.origin).toString();
    const bodyHtml = `
      <div class="header">
        <img src="${logoUrl}" alt="Kuche" class="logo" />
        <div>
          <h1>Cotización Cliente</h1>
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
    `;
    buildPrintWindow("Cotización Cliente", bodyHtml);
  };

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
          {activeCategory?.category === "GASTOS FIJOS Y VARIOS" ? (
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
      </motion.section>

      {isClientModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur">
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
          <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur">
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
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Sección C · Estimación visual</p>
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
                  Base: {formatCurrency(materialSubtotal)} · {baseMaterial.label}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-semibold">Sección D · Cierre y documentación</h2>
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
            onClick={handleGenerateClientPdf}
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
          {metrosValue} m lineales · {baseMaterial.label} · {materialColor}
        </p>
      </div>
    </div>
  );
}
