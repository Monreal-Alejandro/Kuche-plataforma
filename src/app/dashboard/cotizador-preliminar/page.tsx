"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2 } from "lucide-react";
import { activeCitaTaskStorageKey, kanbanStorageKey, citaReturnUrlStorageKey, getPreliminarList, seguimientoProjectStoragePrefix, type KanbanTask, type PreliminarData } from "@/lib/kanban";
import { buildPreliminarPdf, downloadPreliminarPdf } from "@/lib/pdf-preliminar";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

type MaterialOption = {
  id: string;
  name: string;
  tier: "Estandar" | "Premium" | "Lujo";
  multiplier: number;
  image: string;
};

type MaterialCategory = "cubiertas" | "frentes" | "herrajes";
type MaterialTierFilter = "Todos" | MaterialOption["tier"];

const materialImageMap: Record<MaterialCategory, { match: RegExp; src: string }[]> = {
  cubiertas: [
    { match: /calacatta|m?rmol|marble/i, src: "/images/materiales/calaccata_marble.jpg" },
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
    { match: /laca met?lica|metalica/i, src: "/images/materiales/metalic_textures.jpg" },
    { match: /laca/i, src: "/images/materiales/white_marble_texture.jpg" },
  ],
  herrajes: [
    { match: /inox|stainless/i, src: "/images/materiales/stainless_steel_hinge.jpg" },
    { match: /cierre|drawer|slide|push/i, src: "/images/materiales/drawer_slide.jpg" },
    { match: /soft|hinge|amortiguado|hidr?ulico|smart|lux/i, src: "/images/materiales/cabinet_hinge.jpg" },
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
  materialSearch,
  tierFilter,
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
  materialSearch: string;
  tierFilter: MaterialTierFilter;
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
      tier: "Estandar",
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
      tier: "Estandar",
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
      tier: "Estandar",
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
      name: "Cuarzo ?nix",
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
      tier: "Estandar",
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
      tier: "Estandar",
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
      tier: "Estandar",
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
      tier: "Estandar",
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
      tier: "Estandar",
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
      tier: "Estandar",
      multiplier: 1,
      image:
        "https://image.pollinations.ai/prompt/white%20melamine%20board%20texture?width=500&height=500&nologo=true",
    },
    {
      id: "melamina-ceniza",
      name: "Melamina Ceniza",
      tier: "Estandar",
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
      name: "Laca Met?lica",
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
      tier: "Estandar",
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
      tier: "Estandar",
      multiplier: 1.02,
      image:
        "https://image.pollinations.ai/prompt/mint%20green%20melamine%20texture?width=500&height=500&nologo=true",
    },
  ] satisfies MaterialOption[],
  herrajes: [
    {
      id: "soft-close",
      name: "Soft Close",
      tier: "Estandar",
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
      tier: "Estandar",
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
      tier: "Estandar",
      multiplier: 1.04,
      image:
        "https://image.pollinations.ai/prompt/matte%20graphite%20black%20cabinet%20hinge?width=500&height=500&nologo=true",
    },
    {
      id: "cierre-suave",
      name: "Cierre Suave",
      tier: "Estandar",
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
      tier: "Estandar",
      multiplier: 1.05,
      image:
        "https://image.pollinations.ai/prompt/cabinet%20hinge%20with%20damper%20mechanism?width=500&height=500&nologo=true",
    },
    {
      id: "hidraulico",
      name: "Hidr?ulico",
      tier: "Premium",
      multiplier: 1.2,
      image:
        "https://image.pollinations.ai/prompt/hydraulic%20cabinet%20hinge%20piston?width=500&height=500&nologo=true",
    },
    {
      id: "lux-autom",
      name: "Lux Autom?tico",
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
      tier: "Estandar",
      multiplier: 1.06,
      image:
        "https://image.pollinations.ai/prompt/standard%20cabinet%20drawer%20slide%20metal?width=500&height=500&nologo=true",
    },
  ] satisfies MaterialOption[],
};

export default function CotizadorPreliminarPage() {
  const router = useRouter();
  const [activeCitaTaskId, setActiveCitaTaskId] = useState<string | null>(null);
  const [activeCitaTask, setActiveCitaTask] = useState<KanbanTask | null>(null);
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
  const [tierFilter, setTierFilter] = useState<"Todos" | "Estandar" | "Premium" | "Lujo">(
    "Todos",
  );
  const [pages, setPages] = useState({ cubiertas: 1, frentes: 1, herrajes: 1 });
  const [finishError, setFinishError] = useState<string | null>(null);

  type EditableFieldId =
    | "clientName"
    | "location"
    | "installDate"
    | "largo"
    | "alto"
    | "fondo";

  const clientNameInputRef = useRef<HTMLInputElement | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const installDateInputRef = useRef<HTMLInputElement | null>(null);
  const largoInputRef = useRef<HTMLInputElement | null>(null);
  const altoInputRef = useRef<HTMLInputElement | null>(null);
  const fondoInputRef = useRef<HTMLInputElement | null>(null);

  const lastEditedFieldRef = useRef<EditableFieldId | null>(null);
  const caretPositionsRef = useRef<Record<EditableFieldId, number | null>>({
    clientName: null,
    location: null,
    installDate: null,
    largo: null,
    alto: null,
    fondo: null,
  });

  useLayoutEffect(() => {
    const lastEdited = lastEditedFieldRef.current;
    if (!lastEdited) return;

    const caretPos = caretPositionsRef.current[lastEdited];
    let inputEl: HTMLInputElement | null = null;

    if (lastEdited === "clientName") inputEl = clientNameInputRef.current;
    if (lastEdited === "location") inputEl = locationInputRef.current;
    if (lastEdited === "installDate") inputEl = installDateInputRef.current;
    if (lastEdited === "largo") inputEl = largoInputRef.current;
    if (lastEdited === "alto") inputEl = altoInputRef.current;
    if (lastEdited === "fondo") inputEl = fondoInputRef.current;

    if (!inputEl) return;

    // Para la mayoría de campos (medidas y datos) reforzamos el foco,
    // restauramos el foco para que la edición sea consistente.
    inputEl.focus();

    if (caretPos !== null) {
      try {
        inputEl.setSelectionRange(caretPos, caretPos);
      } catch {
        // Ignorar navegadores/contextos donde no se pueda ajustar la selección
      }
    }
  }, [clientName, location, installDate, largo, alto, fondo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const taskId = window.localStorage.getItem(activeCitaTaskStorageKey);
    if (taskId) {
      setActiveCitaTaskId(taskId);
      const stored = window.localStorage.getItem(kanbanStorageKey);
      if (stored) {
        try {
          const tasks = JSON.parse(stored) as KanbanTask[];
          const task = tasks.find((t) => t.id === taskId);
          if (task) {
            setActiveCitaTask(task);
            if (task.project) setClientName(task.project);
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const validatePreliminarSections = (): string | null => {
    const hasDatos = clientName.trim() !== "" || location.trim() !== "" || installDate !== "";
    const hasMedidas =
      (Number.parseFloat(largo) || 0) > 0 ||
      (Number.parseFloat(alto) || 0) > 0 ||
      (Number.parseFloat(fondo) || 0) > 0;
    if (!hasDatos)
      return "Completa al menos un campo de Datos del proyecto (cliente, ubicación o fecha).";
    if (!hasMedidas) return "Completa al menos una medida (largo, alto o fondo mayor a 0).";
    return null;
  };

  const buildPreliminarDataFromForm = (): PreliminarData => {
    const cubierta = materialCatalog.cubiertas.find((item) => item.id === selectedCubierta);
    const frente = materialCatalog.frentes.find((item) => item.id === selectedFrente);
    const herraje = materialCatalog.herrajes.find((item) => item.id === selectedHerraje);
    return {
      client: clientName || "Sin nombre",
      projectType,
      location: location || "Por definir",
      date: installDate || "Por definir",
      rangeLabel: scenarioRangeLabel,
      cubierta: cubierta?.name ?? "Sin definir",
      frente: frente?.name ?? "Sin definir",
      herraje: herraje?.name ?? "Sin definir",
    };
  };

  const savePreliminarAndGetNextTasks = (): { codigoProyecto: string | undefined; updatedTasks: KanbanTask[] } | null => {
    if (!activeCitaTaskId || !activeCitaTask) return null;
    const err = validatePreliminarSections();
    if (err) {
      setFinishError(err);
      return null;
    }
    const newPreliminar = buildPreliminarDataFromForm();
    const stored = window.localStorage.getItem(kanbanStorageKey);

    let tasks: KanbanTask[];
    try {
      tasks = stored ? (JSON.parse(stored) as KanbanTask[]) : [];
    } catch {
      // Si el JSON está corrupto, al menos conservamos la tarea activa en un arreglo nuevo.
      tasks = [];
    }

    // Aseguramos que la tarea activa exista en la lista a actualizar.
    const hasActiveTask = tasks.some((t) => t.id === activeCitaTaskId);
    const baseTasks = hasActiveTask ? tasks : [...tasks, activeCitaTask];

    let codigoProyecto: string | undefined;
    const updatedTasks = baseTasks.map((task) => {
      if (task.id !== activeCitaTaskId) return task;
      const existingList = getPreliminarList(task);
      const preliminarCotizaciones = [...existingList, newPreliminar];
      codigoProyecto = task.codigoProyecto ?? `K-${Date.now()}`;
      return {
        ...task,
        codigoProyecto,
        preliminarCotizaciones,
        preliminarData: newPreliminar,
        citaFinished: true,
        stage: task.stage,
        status: task.status,
      };
    });

    try {
      window.localStorage.setItem(kanbanStorageKey, JSON.stringify(updatedTasks));
    } catch {
      // Si por alguna razón no podemos escribir en localStorage (cuota, modo incógnito, etc.),
      // evitamos bloquear el flujo de la cita. Los datos de esta sesión podrían no persistir,
      // pero el usuario puede continuar trabajando.
    }

    if (codigoProyecto) {
      const projectKey = `${seguimientoProjectStoragePrefix}${codigoProyecto}`;
      const seguimientoProject = {
        codigo: codigoProyecto,
        cliente: activeCitaTask.project ?? clientName ?? "Cliente",
        isProspect: true,
        preliminarCotizaciones: getPreliminarList(
          updatedTasks.find((t) => t.id === activeCitaTaskId) ?? activeCitaTask,
        ),
      };
      try {
        window.localStorage.setItem(projectKey, JSON.stringify(seguimientoProject));
      } catch {
        // Mismo criterio: no bloqueamos el flujo si esta escritura falla.
      }
    }

    return { codigoProyecto, updatedTasks };
  };

  const handleFinishCita = () => {
    setFinishError(null);
    if (!activeCitaTaskId) return;
    const result = savePreliminarAndGetNextTasks();
    if (!result) return;
    const newPreliminar = buildPreliminarDataFromForm();
    const updatedTasksWithStage = result.updatedTasks.map((task) =>
      task.id === activeCitaTaskId
        ? { ...task, stage: "disenos" as const, status: "pendiente" as const }
        : task,
    );
    window.localStorage.setItem(kanbanStorageKey, JSON.stringify(updatedTasksWithStage));
    window.localStorage.removeItem(activeCitaTaskStorageKey);
    downloadPreliminarPdf(
      newPreliminar,
      `levantamiento-detallado-${(newPreliminar.projectType || "proyecto").replace(/\s+/g, "-")}-${(clientName || "cliente").replace(/\s+/g, "-")}.pdf`,
    );
    const returnUrl = window.localStorage.getItem(citaReturnUrlStorageKey);
    window.localStorage.removeItem(citaReturnUrlStorageKey);
    router.push(returnUrl || "/dashboard/empleado");
  };

  const handleFinishAndContinue = () => {
    setFinishError(null);
    if (!activeCitaTaskId) return;
    const result = savePreliminarAndGetNextTasks();
    if (!result) return;
    const newPreliminar = buildPreliminarDataFromForm();
    downloadPreliminarPdf(
      newPreliminar,
      `levantamiento-detallado-${(newPreliminar.projectType || "proyecto").replace(/\s+/g, "-")}-${(clientName || "cliente").replace(/\s+/g, "-")}.pdf`,
    );
    setProjectType("Cocina");
    setLocation("");
    setInstallDate("");
    setLargo("4.2");
    setAlto("2.4");
    setFondo("0.6");
    setSelectedCubierta(materialCatalog.cubiertas[0].id);
    setSelectedFrente(materialCatalog.frentes[0].id);
    setSelectedHerraje(materialCatalog.herrajes[0].id);
    setSelectedScenario("esencial");
  };

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
      label: [cubierta?.name, frente?.name, herraje?.name].filter(Boolean).join(" / "),
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
    const data = buildPreliminarDataFromForm();
    downloadPreliminarPdf(data, "levantamiento-detallado.pdf");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-primary">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Levantamiento</p>
          <h1 className="mt-2 text-3xl font-semibold">Levantamiento Detallado</h1>
          <p className="mt-3 text-sm text-secondary">
            Estimación rápida para prospectos. No sustituye una cotización formal.
          </p>
        </header>

        {activeCitaTask ? (
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Cita activa: {activeCitaTask.project}
                  </p>
                  <p className="text-xs text-emerald-600">
                    Completa la cotización y termina la cita cuando estés listo.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleFinishCita}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Terminar
                </button>
                <button
                  type="button"
                  onClick={handleFinishAndContinue}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 bg-white px-6 py-3 text-sm font-semibold text-emerald-600 shadow-lg transition hover:bg-emerald-50"
                >
                  Terminar y continuar
                </button>
              </div>
              {finishError ? (
                <p className="mt-3 text-sm text-rose-600">{finishError}</p>
              ) : null}
            </div>
          </div>
        ) : null}

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
                    ref={clientNameInputRef}
                    value={clientName}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      lastEditedFieldRef.current = "clientName";
                      caretPositionsRef.current.clientName = event.target.selectionStart ?? null;
                      setClientName(nextValue);
                    }}
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
                    <option value="Closet">Closet</option>
                    <option value="TV Unit">TV Unit</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Ubicación
                  <input
                    ref={locationInputRef}
                    value={location}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      lastEditedFieldRef.current = "location";
                      caretPositionsRef.current.location = event.target.selectionStart ?? null;
                      setLocation(nextValue);
                    }}
                    placeholder="CDMX, GDL, MTY..."
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Fecha tentativa
                  <input
                    ref={installDateInputRef}
                    value={installDate}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      lastEditedFieldRef.current = "installDate";
                      caretPositionsRef.current.installDate = event.target.selectionStart ?? null;
                      setInstallDate(nextValue);
                    }}
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
                    ref={largoInputRef}
                    value={largo}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      lastEditedFieldRef.current = "largo";
                      caretPositionsRef.current.largo = event.target.selectionStart ?? null;
                      setLargo(nextValue);
                    }}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Alto
                  <input
                    ref={altoInputRef}
                    value={alto}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      lastEditedFieldRef.current = "alto";
                      caretPositionsRef.current.alto = event.target.selectionStart ?? null;
                      setAlto(nextValue);
                    }}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Fondo
                  <input
                    ref={fondoInputRef}
                    value={fondo}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      lastEditedFieldRef.current = "fondo";
                      caretPositionsRef.current.fondo = event.target.selectionStart ?? null;
                      setFondo(nextValue);
                    }}
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
                {(["Todos", "Estandar", "Premium", "Lujo"] as const).map((tier) => (
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
              materialSearch={materialSearch}
              tierFilter={tierFilter}
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
              materialSearch={materialSearch}
              tierFilter={tierFilter}
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
              materialSearch={materialSearch}
              tierFilter={tierFilter}
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
          {selectedSummary.meters} m lineales / {selectedSummary.label || "Selección en curso"}
        </p>
      </div>
    </main>
  );
}
