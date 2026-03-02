"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

type MaterialOption = {
  id: string;
  name: string;
  tier: "Estándar" | "Premium" | "Lujo";
  multiplier: number;
  image: string;
};

type MaterialCategory = "cubiertas" | "frentes" | "herrajes";

const materialImageMap: Record<MaterialCategory, { match: RegExp; src: string }[]> = {
  cubiertas: [
    { match: /calacatta|mármol|marble/i, src: "/images/materiales/calaccata_marble.jpg" },
    { match: /granito negro/i, src: "/images/materiales/black_granite.jpg" },
    { match: /cuarzo/i, src: "/images/materiales/quartz_texture.jpg" },
    { match: /sinterizada/i, src: "/images/materiales/smooth_stone.jpg" },
    { match: /porcelanato|terrazzo|terrazo/i, src: "/images/materiales/terazzo_texture.jpg" },
    { match: /laminado|blanco|nieve/i, src: "/images/materiales/white_seamless_texture.jpg" },
    { match: /granito/i, src: "/images/materiales/stone_texture.jpg" },
  ],
  frentes: [
    { match: /nogal|parota|cedro|encino|madera|chapa/i, src: "/images/materiales/walnut_wood_texture.jpg" },
    { match: /melamina blanca|blanca/i, src: "/images/materiales/white_seamless_texture.jpg" },
    { match: /melamina|mdf/i, src: "/images/materiales/plywood_texture.jpg" },
    { match: /laca metálica|metalica/i, src: "/images/materiales/metalic_textures.jpg" },
    { match: /laca/i, src: "/images/materiales/white_marble_texture.jpg" },
  ],
  herrajes: [
    { match: /inox|stainless/i, src: "/images/materiales/stainless_steel_hinge.jpg" },
    { match: /cierre|drawer|slide|push/i, src: "/images/materiales/drawer_slide.jpg" },
    { match: /soft|hinge|amortiguado|hidráulico|smart|lux/i, src: "/images/materiales/cabinet_hinge.jpg" },
  ],
};

const defaultCategoryImage: Record<MaterialCategory, string> = {
  cubiertas: "/images/materiales/stone_texture.jpg",
  frentes: "/images/materiales/dark_wood_background.jpg",
  herrajes: "/images/materiales/cabinet_hinge.jpg",
};

const resolveMaterialImage = (name: string, category: MaterialCategory, fallback?: string) => {
  const match = materialImageMap[category].find((entry) => entry.match.test(name));
  return match?.src ?? fallback ?? defaultCategoryImage[category];
};

const materialCatalog = {
  cubiertas: [
    {
      id: "cuarzo-calacatta",
      name: "Cuarzo Calacatta",
      tier: "Lujo",
      multiplier: 1.35,
      image:
        "https://image.pollinations.ai/prompt/white%20calacatta%20quartz%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "granito-negro",
      name: "Granito Negro",
      tier: "Premium",
      multiplier: 1.2,
      image:
        "https://image.pollinations.ai/prompt/black%20granite%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "laminado-blanco",
      name: "Laminado Blanco",
      tier: "Estándar",
      multiplier: 1,
      image:
        "https://image.pollinations.ai/prompt/white%20laminate%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "cuarzo-marfil",
      name: "Cuarzo Marfil",
      tier: "Premium",
      multiplier: 1.18,
      image:
        "https://image.pollinations.ai/prompt/ivory%20quartz%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "granito-ivory",
      name: "Granito Ivory",
      tier: "Estándar",
      multiplier: 1.05,
      image:
        "https://image.pollinations.ai/prompt/ivory%20granite%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "sinterizada-nieve",
      name: "Piedra Sinterizada Nieve",
      tier: "Lujo",
      multiplier: 1.4,
      image:
        "https://image.pollinations.ai/prompt/pure%20white%20sintered%20stone%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "cuarzo-marbella",
      name: "Cuarzo Marbella",
      tier: "Premium",
      multiplier: 1.22,
      image:
        "https://image.pollinations.ai/prompt/beige%20marbella%20quartz%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "cuarzo-gris-humo",
      name: "Cuarzo Gris Humo",
      tier: "Estándar",
      multiplier: 1.1,
      image:
        "https://image.pollinations.ai/prompt/smoky%20grey%20quartz%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "granito-verde",
      name: "Granito Verde Selva",
      tier: "Premium",
      multiplier: 1.26,
      image:
        "https://image.pollinations.ai/prompt/jungle%20green%20granite%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "granito-azul",
      name: "Granito Azul Profundo",
      tier: "Lujo",
      multiplier: 1.42,
      image:
        "https://image.pollinations.ai/prompt/deep%20blue%20granite%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "cuarzo-onix",
      name: "Cuarzo Ónix",
      tier: "Lujo",
      multiplier: 1.48,
      image:
        "https://image.pollinations.ai/prompt/onyx%20quartz%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "sinterizada-grafito",
      name: "Sinterizada Grafito",
      tier: "Premium",
      multiplier: 1.3,
      image:
        "https://image.pollinations.ai/prompt/graphite%20sintered%20stone%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "porcelanato-marfil",
      name: "Porcelanato Marfil",
      tier: "Estándar",
      multiplier: 1.08,
      image:
        "https://image.pollinations.ai/prompt/ivory%20porcelain%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "granito-cobre",
      name: "Granito Cobre",
      tier: "Premium",
      multiplier: 1.24,
      image:
        "https://image.pollinations.ai/prompt/copper%20granite%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "cuarzo-nieve",
      name: "Cuarzo Nieve",
      tier: "Estándar",
      multiplier: 1.04,
      image:
        "https://image.pollinations.ai/prompt/snow%20white%20quartz%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "sinterizada-arena",
      name: "Sinterizada Arena",
      tier: "Premium",
      multiplier: 1.28,
      image:
        "https://image.pollinations.ai/prompt/sand%20sintered%20stone%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "granito-perla",
      name: "Granito Perla",
      tier: "Estándar",
      multiplier: 1.06,
      image:
        "https://image.pollinations.ai/prompt/pearl%20granite%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "cuarzo-negro-zen",
      name: "Cuarzo Negro Zen",
      tier: "Lujo",
      multiplier: 1.5,
      image:
        "https://image.pollinations.ai/prompt/zen%20black%20quartz%20texture?width=500&height=500&nologo=true",
    },
  ] satisfies MaterialOption[],
  frentes: [
    {
      id: "melamina-premium",
      name: "Melamina Premium",
      tier: "Estándar",
      multiplier: 1,
      image:
        "https://image.pollinations.ai/prompt/premium%20wood%20melamine%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "mdf-laca",
      name: "MDF Laca Mate",
      tier: "Premium",
      multiplier: 1.15,
      image:
        "https://image.pollinations.ai/prompt/matte%20lacquer%20mdf%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "chapa-natural",
      name: "Chapa Natural",
      tier: "Lujo",
      multiplier: 1.3,
      image:
        "https://image.pollinations.ai/prompt/natural%20wood%20veneer%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "melamina-texturizada",
      name: "Melamina Texturizada",
      tier: "Estándar",
      multiplier: 1.05,
      image:
        "https://image.pollinations.ai/prompt/textured%20grey%20melamine%20surface?width=500&height=500&nologo=true",
    },
    {
      id: "laca-brillo",
      name: "Laca Alto Brillo",
      tier: "Premium",
      multiplier: 1.22,
      image:
        "https://image.pollinations.ai/prompt/high%20gloss%20lacquer%20cabinet%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "madera-nogal",
      name: "Madera Nogal",
      tier: "Lujo",
      multiplier: 1.38,
      image:
        "https://image.pollinations.ai/prompt/walnut%20wood%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "melamina-blanca",
      name: "Melamina Blanca",
      tier: "Estándar",
      multiplier: 1,
      image:
        "https://image.pollinations.ai/prompt/white%20melamine%20board%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "melamina-ceniza",
      name: "Melamina Ceniza",
      tier: "Estándar",
      multiplier: 1.03,
      image:
        "https://image.pollinations.ai/prompt/ash%20wood%20melamine%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "melamina-grafito",
      name: "Melamina Grafito",
      tier: "Premium",
      multiplier: 1.12,
      image:
        "https://image.pollinations.ai/prompt/graphite%20grey%20melamine%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "melamina-olmo",
      name: "Melamina Olmo",
      tier: "Premium",
      multiplier: 1.14,
      image:
        "https://image.pollinations.ai/prompt/elm%20wood%20melamine%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "laca-satinada",
      name: "Laca Satinada",
      tier: "Premium",
      multiplier: 1.2,
      image:
        "https://image.pollinations.ai/prompt/satin%20lacquer%20cabinet%20surface?width=500&height=500&nologo=true",
    },
    {
      id: "laca-metalica",
      name: "Laca Metálica",
      tier: "Lujo",
      multiplier: 1.4,
      image:
        "https://image.pollinations.ai/prompt/metallic%20lacquer%20surface%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "chapa-encino",
      name: "Chapa Encino",
      tier: "Premium",
      multiplier: 1.26,
      image:
        "https://image.pollinations.ai/prompt/oak%20wood%20veneer%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "chapa-cedro",
      name: "Chapa Cedro",
      tier: "Lujo",
      multiplier: 1.36,
      image:
        "https://image.pollinations.ai/prompt/cedar%20wood%20veneer%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "madera-parota",
      name: "Madera Parota",
      tier: "Lujo",
      multiplier: 1.42,
      image:
        "https://image.pollinations.ai/prompt/parota%20wood%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "mdf-textura",
      name: "MDF Texturizado",
      tier: "Estándar",
      multiplier: 1.06,
      image:
        "https://image.pollinations.ai/prompt/beige%20textured%20mdf%20surface?width=500&height=500&nologo=true",
    },
    {
      id: "mdf-grafito",
      name: "MDF Grafito",
      tier: "Premium",
      multiplier: 1.18,
      image:
        "https://image.pollinations.ai/prompt/dark%20graphite%20mdf%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "melamina-menta",
      name: "Melamina Menta",
      tier: "Estándar",
      multiplier: 1.02,
      image:
        "https://image.pollinations.ai/prompt/mint%20green%20melamine%20texture?width=500&height=500&nologo=true",
    },
  ] satisfies MaterialOption[],
  herrajes: [
    {
      id: "soft-close",
      name: "Soft Close",
      tier: "Estándar",
      multiplier: 1,
      image:
        "https://image.pollinations.ai/prompt/soft%20close%20cabinet%20hinge%20hardware?width=500&height=500&nologo=true",
    },
    {
      id: "blum-aventoz",
      name: "Blum Aventos",
      tier: "Premium",
      multiplier: 1.12,
      image:
        "https://image.pollinations.ai/prompt/blum%20aventos%20lift%20system%20hardware?width=500&height=500&nologo=true",
    },
    {
      id: "premium-tech",
      name: "Premium Tech",
      tier: "Lujo",
      multiplier: 1.25,
      image:
        "https://image.pollinations.ai/prompt/modern%20premium%20cabinet%20drawer%20slide%20hardware?width=500&height=500&nologo=true",
    },
    {
      id: "push-to-open",
      name: "Push to Open",
      tier: "Premium",
      multiplier: 1.1,
      image:
        "https://image.pollinations.ai/prompt/push%20to%20open%20cabinet%20mechanism?width=500&height=500&nologo=true",
    },
    {
      id: "herrajes-inox",
      name: "Herrajes Inox",
      tier: "Lujo",
      multiplier: 1.3,
      image:
        "https://image.pollinations.ai/prompt/stainless%20steel%20cabinet%20hardware%20hinge?width=500&height=500&nologo=true",
    },
    {
      id: "soft-basic",
      name: "Soft Basic",
      tier: "Estándar",
      multiplier: 1.02,
      image:
        "https://image.pollinations.ai/prompt/basic%20metal%20cabinet%20hinge?width=500&height=500&nologo=true",
    },
    {
      id: "soft-plus",
      name: "Soft Plus",
      tier: "Premium",
      multiplier: 1.08,
      image:
        "https://image.pollinations.ai/prompt/high%20quality%20metal%20cabinet%20hinge?width=500&height=500&nologo=true",
    },
    {
      id: "soft-pro",
      name: "Soft Pro",
      tier: "Lujo",
      multiplier: 1.22,
      image:
        "https://image.pollinations.ai/prompt/professional%20cabinet%20hinge%20mechanism?width=500&height=500&nologo=true",
    },
    {
      id: "inox-premium",
      name: "Inox Premium",
      tier: "Premium",
      multiplier: 1.18,
      image:
        "https://image.pollinations.ai/prompt/brushed%20stainless%20steel%20cabinet%20hinge?width=500&height=500&nologo=true",
    },
    {
      id: "grafito-matte",
      name: "Grafito Matte",
      tier: "Estándar",
      multiplier: 1.04,
      image:
        "https://image.pollinations.ai/prompt/matte%20graphite%20black%20cabinet%20hinge?width=500&height=500&nologo=true",
    },
    {
      id: "cierre-suave",
      name: "Cierre Suave",
      tier: "Estándar",
      multiplier: 1.03,
      image:
        "https://image.pollinations.ai/prompt/soft%20close%20drawer%20slide%20metal?width=500&height=500&nologo=true",
    },
    {
      id: "push-premium",
      name: "Push Premium",
      tier: "Premium",
      multiplier: 1.16,
      image:
        "https://image.pollinations.ai/prompt/premium%20push%20to%20open%20drawer%20hardware?width=500&height=500&nologo=true",
    },
    {
      id: "push-lujo",
      name: "Push Lujo",
      tier: "Lujo",
      multiplier: 1.28,
      image:
        "https://image.pollinations.ai/prompt/luxury%20push%20open%20cabinet%20hardware?width=500&height=500&nologo=true",
    },
    {
      id: "amortiguado",
      name: "Amortiguado",
      tier: "Estándar",
      multiplier: 1.05,
      image:
        "https://image.pollinations.ai/prompt/cabinet%20hinge%20with%20damper%20mechanism?width=500&height=500&nologo=true",
    },
    {
      id: "hidraulico",
      name: "Hidráulico",
      tier: "Premium",
      multiplier: 1.2,
      image:
        "https://image.pollinations.ai/prompt/hydraulic%20cabinet%20hinge%20piston?width=500&height=500&nologo=true",
    },
    {
      id: "lux-autom",
      name: "Lux Automático",
      tier: "Lujo",
      multiplier: 1.32,
      image:
        "https://image.pollinations.ai/prompt/motorized%20automatic%20cabinet%20drawer%20hardware?width=500&height=500&nologo=true",
    },
    {
      id: "smart-close",
      name: "Smart Close",
      tier: "Premium",
      multiplier: 1.14,
      image:
        "https://image.pollinations.ai/prompt/smart%20close%20cabinet%20hardware%20system?width=500&height=500&nologo=true",
    },
    {
      id: "soft-basic-plus",
      name: "Soft Basic Plus",
      tier: "Estándar",
      multiplier: 1.06,
      image:
        "https://image.pollinations.ai/prompt/standard%20cabinet%20drawer%20slide%20metal?width=500&height=500&nologo=true",
    },
  ] satisfies MaterialOption[],
};

const escapePdfText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const sanitizePdfText = (value: string) =>
  escapePdfText(value.normalize("NFD").replace(/\p{Diacritic}/gu, ""));

const buildElegantPdf = (data: {
  client: string;
  projectType: string;
  location: string;
  date: string;
  rangeLabel: string;
  cubierta: string;
  frente: string;
  herraje: string;
}) => {
  const drawRect = (x: number, y: number, w: number, h: number, color: string) =>
    `q\n${color} rg\n${x} ${y} ${w} ${h} re\nf\nQ`;

  const drawText = (x: number, y: number, size: number, color: string, text: string) =>
    `BT\n/F1 ${size} Tf\n${color} rg\n${x} ${y} Td\n(${sanitizePdfText(text)}) Tj\nET`;

  const content = [
    drawRect(0, 732, 612, 60, "0.55 0.11 0.11"),
    drawText(48, 755, 18, "1 1 1", "Cotizacion Preliminar"),
    drawText(48, 738, 10, "1 1 1", "Kuche | Estimacion no vinculante"),
    drawText(48, 700, 11, "0.15 0.15 0.15", "Resumen ejecutivo"),
    drawRect(40, 610, 532, 90, "0.96 0.96 0.96"),
    drawText(60, 670, 10, "0.45 0.45 0.45", "Rango estimado"),
    drawText(60, 642, 20, "0.55 0.11 0.11", data.rangeLabel),
    drawText(60, 618, 9, "0.35 0.35 0.35", "Sujeto a visita tecnica y definicion final."),
    drawText(48, 575, 11, "0.15 0.15 0.15", "Datos del proyecto"),
    drawText(48, 555, 10, "0.35 0.35 0.35", `Cliente: ${data.client || "Sin nombre"}`),
    drawText(48, 538, 10, "0.35 0.35 0.35", `Tipo: ${data.projectType}`),
    drawText(48, 521, 10, "0.35 0.35 0.35", `Ubicacion: ${data.location || "Por definir"}`),
    drawText(48, 504, 10, "0.35 0.35 0.35", `Fecha tentativa: ${data.date || "Por definir"}`),
    drawText(330, 575, 11, "0.15 0.15 0.15", "Materiales seleccionados"),
    drawText(330, 555, 10, "0.35 0.35 0.35", `Cubierta: ${data.cubierta}`),
    drawText(330, 538, 10, "0.35 0.35 0.35", `Frente: ${data.frente}`),
    drawText(330, 521, 10, "0.35 0.35 0.35", `Herraje: ${data.herraje}`),
    drawRect(40, 470, 532, 1, "0.85 0.85 0.85"),
    drawText(
      48,
      445,
      9,
      "0.4 0.4 0.4",
      "Este documento es preliminar. Los costos finales pueden variar segun medidas,",
    ),
    drawText(
      48,
      432,
      9,
      "0.4 0.4 0.4",
      "materiales y complejidad del proyecto. Valido como guia inicial.",
    ),
  ].join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj",
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
  ];

  let offset = 0;
  const offsets = objects.map((obj) => {
    const current = offset;
    offset += obj.length + 2;
    return current;
  });

  const xrefEntries = offsets
    .map((entry) => entry.toString().padStart(10, "0") + " 00000 n ")
    .join("\n");

  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xrefEntries}`;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${
    offset + xref.length + 2
  }\n%%EOF`;
  return `%PDF-1.4\n${objects.join("\n\n")}\n${xref}\n${trailer}`;
};

export default function CotizadorPreliminarPage() {
  const [clientName, setClientName] = useState("");
  const [projectType, setProjectType] = useState("Cocina");
  const [location, setLocation] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [largo, setLargo] = useState("4.2");
  const [alto, setAlto] = useState("2.4");
  const [fondo, setFondo] = useState("0.6");
  const [selectedCubierta, setSelectedCubierta] = useState(materialCatalog.cubiertas[0].id);
  const [selectedFrente, setSelectedFrente] = useState(materialCatalog.frentes[0].id);
  const [selectedHerraje, setSelectedHerraje] = useState(materialCatalog.herrajes[0].id);
  const [selectedScenario, setSelectedScenario] = useState("esencial");
  const [materialSearch, setMaterialSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"Todos" | "Estándar" | "Premium" | "Lujo">(
    "Todos",
  );
  const [pages, setPages] = useState({ cubiertas: 1, frentes: 1, herrajes: 1 });

  const metrics = useMemo(() => {
    const largoValue = Number.parseFloat(largo) || 0;
    const altoValue = Number.parseFloat(alto) || 0;
    const fondoValue = Number.parseFloat(fondo) || 0;
    const base = Math.max(0, largoValue * 6500 + altoValue * 1800 + fondoValue * 1200);

    const cubierta = materialCatalog.cubiertas.find((item) => item.id === selectedCubierta);
    const frente = materialCatalog.frentes.find((item) => item.id === selectedFrente);
    const herraje = materialCatalog.herrajes.find((item) => item.id === selectedHerraje);

    const cubiertaMultiplier = cubierta?.multiplier ?? 1;
    const frenteMultiplier = frente?.multiplier ?? 1;
    const herrajeMultiplier = herraje?.multiplier ?? 1;
    const multiplier = cubiertaMultiplier * frenteMultiplier * herrajeMultiplier;
    const subtotal = base * multiplier;
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    const min = subtotal * 0.92;
    const max = subtotal * 1.08;

    return {
      base,
      cubiertaMultiplier,
      frenteMultiplier,
      herrajeMultiplier,
      subtotal,
      iva,
      total,
      rangeLabel: `${formatCurrency(min)} - ${formatCurrency(max)}`,
    };
  }, [alto, fondo, largo, selectedCubierta, selectedFrente, selectedHerraje]);

  const selectedSummary = useMemo(() => {
    const cubierta = materialCatalog.cubiertas.find((item) => item.id === selectedCubierta);
    const frente = materialCatalog.frentes.find((item) => item.id === selectedFrente);
    const herraje = materialCatalog.herrajes.find((item) => item.id === selectedHerraje);
    const largoValue = Number.parseFloat(largo) || 0;
    return {
      meters: largoValue,
      label: [cubierta?.name, frente?.name, herraje?.name].filter(Boolean).join(" · "),
    };
  }, [largo, selectedCubierta, selectedFrente, selectedHerraje]);

  const scenarioOptions = useMemo(
    () => [
      {
        id: "esencial",
        title: "Gama esencial",
        subtitle: "Funcional y accesible",
        multiplier: 0.92,
        image: "/images/cocina1.jpg",
      },
      {
        id: "tendencia",
        title: "Gama tendencia",
        subtitle: "Balance moderno",
        multiplier: 1.05,
        image: "/images/cocina6.jpg",
      },
      {
        id: "premium",
        title: "Gama premium",
        subtitle: "Detalles superiores",
        multiplier: 1.18,
        image: "/images/render3.jpg",
      },
    ],
    [],
  );

  const selectedScenarioMultiplier = useMemo(() => {
    return scenarioOptions.find((scenario) => scenario.id === selectedScenario)?.multiplier ?? 1;
  }, [scenarioOptions, selectedScenario]);

  const scenarioRangeLabel = useMemo(() => {
    const scenarioSubtotal = metrics.subtotal * selectedScenarioMultiplier;
    const min = scenarioSubtotal * 0.92;
    const max = scenarioSubtotal * 1.08;
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }, [metrics.subtotal, selectedScenarioMultiplier]);

  useEffect(() => {
    setPages({ cubiertas: 1, frentes: 1, herrajes: 1 });
  }, [materialSearch, tierFilter]);

  const handleGeneratePdf = () => {
    const cubierta = materialCatalog.cubiertas.find((item) => item.id === selectedCubierta);
    const frente = materialCatalog.frentes.find((item) => item.id === selectedFrente);
    const herraje = materialCatalog.herrajes.find((item) => item.id === selectedHerraje);
    const pdf = buildElegantPdf({
      client: clientName || "Sin nombre",
      projectType,
      location: location || "Por definir",
      date: installDate || "Por definir",
      rangeLabel: scenarioRangeLabel,
      cubierta: cubierta?.name ?? "Sin definir",
      frente: frente?.name ?? "Sin definir",
      herraje: herraje?.name ?? "Sin definir",
    });
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cotizacion-preliminar.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  const SectionCard = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-md">
      {children}
    </div>
  );

  const MaterialGrid = ({
    title,
    options,
    selectedId,
    onSelect,
    page,
    onPageChange,
    category,
    basePrice,
    contextMultiplier,
  }: {
    title: string;
    options: MaterialOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    page: number;
    onPageChange: (page: number) => void;
    category: MaterialCategory;
    basePrice: number;
    contextMultiplier: number;
  }) => {
    const pageSize = 6;
    const normalizedSearch = materialSearch.trim().toLowerCase();
    const filtered = options.filter((option) => {
      const matchesSearch = !normalizedSearch || option.name.toLowerCase().includes(normalizedSearch);
      const matchesTier = tierFilter === "Todos" || option.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
          {title}
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {paginated.map((option) => {
            const isActive = option.id === selectedId;
            const imageSrc = resolveMaterialImage(option.name, category, option.image);
            const optionPrice = Math.max(0, basePrice * option.multiplier * contextMultiplier);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                className={`relative flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white text-left transition hover:-translate-y-1 hover:shadow-lg ${
                  isActive ? "ring-4 ring-[#8B1C1C]" : ""
                }`}
              >
                <div className="h-24 w-full overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={option.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.src = "/images/hero-placeholder.svg";
                    }}
                  />
                </div>
                {isActive ? (
                  <span className="absolute right-3 top-3 rounded-full bg-[#8B1C1C] p-1 text-white shadow">
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}
                <div className="relative space-y-2 px-4 py-3 pb-10">
                  <p className="text-sm font-semibold text-primary">{option.name}</p>
                  <span className="w-fit rounded-full bg-primary/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                    {option.tier}
                  </span>
                  <p className="absolute bottom-3 right-4 text-xs font-semibold text-[#8B1C1C]">
                    Estimado con tus medidas {formatCurrency(optionPrice)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-xs text-secondary">
            No encontramos materiales con ese criterio.
          </div>
        ) : null}
        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-secondary">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={`${title}-${pageNumber}`}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`h-8 w-8 rounded-full transition ${
                  safePage === pageNumber
                    ? "bg-[#8B1C1C] text-white"
                    : "border border-primary/10 bg-white hover:border-primary/30"
                }`}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-primary">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Cotización</p>
          <h1 className="mt-2 text-3xl font-semibold">Cotizador Preliminar</h1>
          <p className="mt-3 text-sm text-secondary">
            Estimación rápida para prospectos. No sustituye una cotización formal.
          </p>
        </header>

        <SectionCard>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Datos del proyecto
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Cliente
                  <input
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="Nombre del cliente"
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Tipo de proyecto
                  <select
                    value={projectType}
                    onChange={(event) => setProjectType(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  >
                    <option value="Cocina">Cocina</option>
                    <option value="Clóset">Clóset</option>
                    <option value="TV Unit">TV Unit</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Ubicación
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="CDMX, GDL, MTY..."
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Fecha tentativa
                  <input
                    value={installDate}
                    onChange={(event) => setInstallDate(event.target.value)}
                    type="date"
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Medidas generales
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Largo
                  <input
                    value={largo}
                    onChange={(event) => setLargo(event.target.value)}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Alto
                  <input
                    value={alto}
                    onChange={(event) => setAlto(event.target.value)}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Fondo
                  <input
                    value={fondo}
                    onChange={(event) => setFondo(event.target.value)}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  />
                </label>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Showroom digital
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Personaliza el look</h2>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white/90 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <input
                  value={materialSearch}
                  onChange={(event) => setMaterialSearch(event.target.value)}
                  placeholder="Buscar material..."
                  className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-2.5 text-sm outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                {(["Todos", "Estándar", "Premium", "Lujo"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setTierFilter(tier)}
                    className={`rounded-full px-4 py-2 transition ${
                      tierFilter === tier
                        ? "bg-[#8B1C1C] text-white"
                        : "border border-primary/10 bg-white text-secondary hover:border-primary/30"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
            <MaterialGrid
              title="Cubiertas"
              options={materialCatalog.cubiertas}
              selectedId={selectedCubierta}
              onSelect={setSelectedCubierta}
              page={pages.cubiertas}
              onPageChange={(page) => setPages((prev) => ({ ...prev, cubiertas: page }))}
              category="cubiertas"
              basePrice={metrics.base}
              contextMultiplier={metrics.frenteMultiplier * metrics.herrajeMultiplier}
            />
            <MaterialGrid
              title="Frentes / Material base"
              options={materialCatalog.frentes}
              selectedId={selectedFrente}
              onSelect={setSelectedFrente}
              page={pages.frentes}
              onPageChange={(page) => setPages((prev) => ({ ...prev, frentes: page }))}
              category="frentes"
              basePrice={metrics.base}
              contextMultiplier={metrics.cubiertaMultiplier * metrics.herrajeMultiplier}
            />
            <MaterialGrid
              title="Herrajes"
              options={materialCatalog.herrajes}
              selectedId={selectedHerraje}
              onSelect={setSelectedHerraje}
              page={pages.herrajes}
              onPageChange={(page) => setPages((prev) => ({ ...prev, herrajes: page }))}
              category="herrajes"
              basePrice={metrics.base}
              contextMultiplier={metrics.cubiertaMultiplier * metrics.frenteMultiplier}
            />
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Estimación visual
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Selecciona el nivel de acabados</h2>
              <p className="mt-2 text-sm text-secondary">
                Presentación rápida para ayudar al cliente a imaginar el resultado.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {scenarioOptions.map((scenario) => {
                const min = metrics.subtotal * scenario.multiplier * 0.94;
                const max = metrics.subtotal * scenario.multiplier * 1.06;
                const isActive = selectedScenario === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setSelectedScenario(scenario.id)}
                    className={`group overflow-hidden rounded-3xl border text-left shadow-lg transition hover:-translate-y-1 ${
                      isActive
                        ? "border-[#8B1C1C] bg-white ring-4 ring-[#8B1C1C]"
                        : "border-primary/10 bg-white/80 hover:border-primary/30"
                    }`}
                  >
                    <div className="h-44 w-full overflow-hidden">
                      <img
                        src={scenario.image}
                        alt={scenario.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="space-y-3 p-6">
                      <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                        {scenario.title}
                      </p>
                      <h3 className="text-lg font-semibold">{scenario.subtitle}</h3>
                      <div className="rounded-2xl bg-primary/5 px-4 py-3 text-center text-lg font-semibold text-[#8B1C1C]">
                        {formatCurrency(min)} - {formatCurrency(max)}
                      </div>
                      <p className="text-xs text-secondary">
                        Basado en medidas generales y selección del showroom.
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Cierre y estimación
              </p>
              <p className="text-sm text-secondary">
                Presenta el rango estimado y genera un PDF preliminar para el cliente.
              </p>
              <button
                onClick={handleGeneratePdf}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[#8B1C1C] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                Generar Estimación en PDF
              </button>
              <p className="mt-3 text-xs text-secondary">
                El PDF incluye datos generales y el rango estimado, sin desglose técnico.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Estimación preliminar
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs text-secondary">Subtotal</p>
                  <p className="text-4xl font-bold text-[#8B1C1C]">
                    {formatCurrency(metrics.subtotal * selectedScenarioMultiplier)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary">IVA (16%)</p>
                  <p className="text-4xl font-bold text-[#8B1C1C]">
                    {formatCurrency(metrics.iva * selectedScenarioMultiplier)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Total neto</p>
                  <p className="text-4xl font-bold text-[#8B1C1C]">
                    {formatCurrency(metrics.total * selectedScenarioMultiplier)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-secondary">
                  Rango estimado: <span className="font-semibold">{scenarioRangeLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
      <div className="fixed bottom-6 right-6 z-40 w-[260px] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.25em] text-secondary">Rango estimado</p>
        <p className="mt-2 text-xl font-semibold text-[#8B1C1C]">
          {scenarioRangeLabel}
        </p>
        <p className="mt-2 text-[11px] text-secondary">
          {selectedSummary.meters} m lineales · {selectedSummary.label || "Selección en curso"}
        </p>
      </div>
    </main>
  );
}
