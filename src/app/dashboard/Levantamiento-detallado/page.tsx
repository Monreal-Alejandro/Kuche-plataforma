"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  activeCitaTaskStorageKey,
  kanbanStorageKey,
  citaReturnUrlStorageKey,
  getPreliminarList,
  saveKanbanTasksToLocalStorage,
  seguimientoProjectStoragePrefix,
  type KanbanTask,
  type PreliminarData,
} from "@/lib/kanban";
import {
  APPLIANCE_CATEGORIAS,
  APPLIANCE_ITEMS,
  APPLIANCE_OTRO_STEP_INDEX,
  defaultLevantamientoDetalle,
  emptyWallMeasuresForId,
  getApplianceCategoryProgress,
  getWallMeasureFieldDefs,
  levantamientoDetalleScopeMultiplier,
  LIGHTING_ITEMS,
  LIGHTING_PAGE_INDICES,
  wallMeasureLetter,
  type MedidasCampos,
  WALL_ITEMS,
  WALL_PAGE_INDICES,
  type ItemCatalogo,
  type LevantamientoDetalle,
} from "@/lib/levantamiento-catalog";
import {
  buildPreliminarPdfDataUrl,
  downloadPreliminarPdf,
} from "@/lib/pdf-preliminar";
import { createPreliminarSeguimientoPdfKey, saveFormalPdf } from "@/lib/formal-pdf-storage";
import { formatDeliveryWeeksLabel } from "@/lib/delivery-weeks";
import ApplianceTypeImage from "@/components/levantamiento/ApplianceTypeImage";
import LightingTypeImage from "@/components/levantamiento/LightingTypeImage";
import WallTypeImage from "@/components/levantamiento/WallTypeImage";
import WallMeasureBadgesOverlay from "@/components/levantamiento/WallMeasureBadgesOverlay";
import Link from "next/link";
import { generatePublicProjectCode } from "@/lib/project-code";
import {
  defaultPagosForInversion,
  formatSeguimientoDateLong,
  normalizeEtapaForStorage,
} from "@/lib/seguimiento-project";

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
  if (match) return match.src;
  /** Ignorar URLs externas (p. ej. pollinations): suelen fallar y el <img> cae en el placeholder. */
  if (fallback?.startsWith("/")) return fallback;
  return defaultCategoryImage[category];
};

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-md">
    {children}
  </div>
);

/** Carrusel: póster grande 2:3; título en overlay sobre la imagen. Encabezados de fila = estilo Küche (como el resto del formulario). */
const streamRowShell = "rounded-2xl bg-zinc-950 px-2 py-4 shadow-inner ring-1 ring-white/10 sm:px-4 sm:py-5";
const streamRowHeading = "text-xs font-semibold uppercase tracking-[0.28em] text-zinc-100";
const streamRowHint = "mt-1 text-sm font-medium tracking-wide text-zinc-500";
const streamRankClass =
  "w-[0.42em] min-w-[1.25rem] shrink-0 select-none self-end pb-1 text-center text-lg font-semibold tabular-nums leading-none text-zinc-500 sm:min-w-[1.4rem] sm:text-xl";
const streamVerTodosClass =
  "shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 underline-offset-2 transition hover:text-zinc-100 hover:underline";
const streamPosterClass = (selected: boolean) =>
  `relative z-10 aspect-[2/3] w-[min(10.5rem,52vw)] shrink-0 overflow-hidden rounded-lg bg-zinc-900 shadow-xl transition sm:w-[min(12.5rem,38vw)] lg:w-[min(13.5rem,32vw)] ${
    selected ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950" : "ring-1 ring-white/10 hover:ring-white/55"
  }`;
const streamPosterTitleOverlay =
  "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent px-2 pb-2.5 pt-14";
const streamPosterLabelClass =
  "line-clamp-2 text-xs font-medium leading-snug text-white/95 sm:text-sm";
/** Miniaturas de carrusel: `cover` sin `object-center` aquí — el centro choca con `object-[…]` en iluminación. */
const streamCatalogThumbBase = "absolute inset-0 z-0 h-full w-full object-cover";
const streamCatalogThumbImageClass = `${streamCatalogThumbBase} object-center`;
/** Encuadre por ítem: `LightingTypeImage` aplica `object-position` inline (catálogo). */
const streamLightingThumbClass = `${streamCatalogThumbBase} object-center`;
const streamScrollClass =
  "flex gap-3 overflow-x-auto pb-2 pt-1 pl-0.5 [-ms-overflow-style:none] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 sm:gap-4";

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
  const pageSize = 4;
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
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {paginated.map((option) => {
          const isActive = option.id === selectedId;
          const imageSrc = resolveMaterialImage(option.name, category, option.image);
          const optionPrice = Math.max(0, basePrice * option.multiplier * contextMultiplier);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`group w-full rounded-2xl border border-primary/10 bg-white p-3 text-left shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${
                isActive ? "ring-2 ring-[#8B1C1C] ring-offset-2 ring-offset-white" : ""
              }`}
            >
              <div className="relative overflow-hidden rounded-2xl">
                <div className="relative aspect-square w-full overflow-hidden bg-primary/[0.04]">
                  <img
                    src={imageSrc}
                    alt={option.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.src = "/images/hero-placeholder.svg";
                    }}
                  />
                </div>
                <div className="pointer-events-none absolute left-3 top-3 z-[1] max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-primary shadow-md backdrop-blur">
                  {option.name}
                </div>
                {isActive ? (
                  <span className="absolute right-3 top-3 z-[1] rounded-full bg-[#8B1C1C] p-1 text-white shadow-md">
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-xs font-medium text-secondary">{option.name}</p>
              <span className="mt-2 inline-flex w-fit rounded-full bg-primary/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                {option.tier}
              </span>
              <p className="mt-2 text-xs font-semibold text-[#8B1C1C]">
                Estimado con tus medidas {formatCurrency(optionPrice)}
              </p>
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
  const [deliveryWeeksMin, setDeliveryWeeksMin] = useState("");
  const [deliveryWeeksMax, setDeliveryWeeksMax] = useState("");
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
  const [levantamiento, setLevantamiento] = useState<LevantamientoDetalle>(() => defaultLevantamientoDetalle());
  const [wallPage, setWallPage] = useState(1);
  const [wallSearch, setWallSearch] = useState("");
  /** Un paso por electrodoméstico (orden por categoría); el último índice es «Otro». */
  const [applianceStep, setApplianceStep] = useState(0);
  const [applianceSearch, setApplianceSearch] = useState("");
  /** true = carruseles; false = detalle en la misma página (sin modal). */
  const [applianceBrowseMode, setApplianceBrowseMode] = useState(true);
  const [lightingSearch, setLightingSearch] = useState("");
  const [lightingShowOtro, setLightingShowOtro] = useState(false);
  const [lightingBrowseMode, setLightingBrowseMode] = useState(true);
  /** id del luminario en vista detalle (cuando lightingBrowseMode es false). */
  const [lightingFocusedId, setLightingFocusedId] = useState<string | null>(null);
  const applianceRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  /** Al pasar de carrusel → detalle el documento se acorta y el scroll absoluto deja la vista en la sección siguiente; se reencuadra la sección C. */
  const applianceSectionRef = useRef<HTMLDivElement | null>(null);
  const lightingSectionRef = useRef<HTMLDivElement | null>(null);

  const setSectionComment = (key: "a" | "b" | "c" | "d" | "e", value: string) => {
    setLevantamiento((prev) => ({
      ...prev,
      sectionComments: { ...prev.sectionComments, [key]: value },
    }));
  };

  const patchMedidasMap = (
    mapKey: "applianceMeasures" | "lightingMeasures",
    id: string,
    field: keyof MedidasCampos,
    value: string,
  ) => {
    setLevantamiento((prev) => {
      const current = prev[mapKey][id] ?? { ancho: "", alto: "", fondo: "" };
      return {
        ...prev,
        [mapKey]: { ...prev[mapKey], [id]: { ...current, [field]: value } },
      };
    });
  };

  const patchWallMeasure = (wallId: string, fieldKey: string, value: string) => {
    setLevantamiento((prev) => {
      const current = prev.wallMeasures[wallId] ?? emptyWallMeasuresForId(wallId);
      return {
        ...prev,
        wallMeasures: { ...prev.wallMeasures, [wallId]: { ...current, [fieldKey]: value } },
      };
    });
  };

  const patchOtro = (
    otroKey: "wallOtro" | "applianceOtro" | "lightingOtro",
    field: keyof LevantamientoDetalle["wallOtro"],
    value: string,
  ) => {
    setLevantamiento((prev) => ({
      ...prev,
      [otroKey]: { ...prev[otroKey], [field]: value },
    }));
  };

  type EditableFieldId =
    | "clientName"
    | "location"
    | "deliveryWeeksMin"
    | "deliveryWeeksMax"
    | "largo"
    | "alto"
    | "fondo";

  const clientNameInputRef = useRef<HTMLInputElement | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const deliveryWeeksMinInputRef = useRef<HTMLInputElement | null>(null);
  const deliveryWeeksMaxInputRef = useRef<HTMLInputElement | null>(null);
  const largoInputRef = useRef<HTMLInputElement | null>(null);
  const altoInputRef = useRef<HTMLInputElement | null>(null);
  const fondoInputRef = useRef<HTMLInputElement | null>(null);

  const lastEditedFieldRef = useRef<EditableFieldId | null>(null);
  const caretPositionsRef = useRef<Record<EditableFieldId, number | null>>({
    clientName: null,
    location: null,
    deliveryWeeksMin: null,
    deliveryWeeksMax: null,
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
    if (lastEdited === "deliveryWeeksMin") inputEl = deliveryWeeksMinInputRef.current;
    if (lastEdited === "deliveryWeeksMax") inputEl = deliveryWeeksMaxInputRef.current;
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
  }, [clientName, location, deliveryWeeksMin, deliveryWeeksMax, largo, alto, fondo]);

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
    const hasDatos =
      clientName.trim() !== "" ||
      location.trim() !== "" ||
      deliveryWeeksMin.trim() !== "" ||
      deliveryWeeksMax.trim() !== "";
    const hasMedidas =
      (Number.parseFloat(largo) || 0) > 0 ||
      (Number.parseFloat(alto) || 0) > 0 ||
      (Number.parseFloat(fondo) || 0) > 0;
    if (!hasDatos)
      return "Completa al menos un campo de Datos del proyecto (cliente, ubicación o semanas de entrega).";
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
      date: formatDeliveryWeeksLabel(deliveryWeeksMin, deliveryWeeksMax) || "Por definir",
      rangeLabel: scenarioRangeLabel,
      cubierta: cubierta?.name ?? "Sin definir",
      frente: frente?.name ?? "Sin definir",
      herraje: herraje?.name ?? "Sin definir",
      levantamiento,
    };
  };

  const savePreliminarAndGetNextTasks = (options?: {
    seguimientoPdf?: { key: string; fileLabel: string };
  }): { codigoProyecto: string | undefined; updatedTasks: KanbanTask[] } | null => {
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
      codigoProyecto = task.codigoProyecto ?? generatePublicProjectCode();
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
      saveKanbanTasksToLocalStorage(updatedTasks);
    } catch {
      // Si por alguna razón no podemos escribir en localStorage (cuota, modo incógnito, etc.),
      // evitamos bloquear el flujo de la cita. Los datos de esta sesión podrían no persistir,
      // pero el usuario puede continuar trabajando.
    }

    if (codigoProyecto) {
      const projectKey = `${seguimientoProjectStoragePrefix}${codigoProyecto}`;
      let existingParsed: Record<string, unknown> = {};
      try {
        const existing = window.localStorage.getItem(projectKey);
        if (existing) existingParsed = JSON.parse(existing) as Record<string, unknown>;
      } catch {
        // ignore
      }
      const preliminarCotizaciones = getPreliminarList(
        updatedTasks.find((t) => t.id === activeCitaTaskId) ?? activeCitaTask,
      );
      const estimatedInversion = Math.round(
        metrics.subtotal * selectedScenarioMultiplier * levantamientoScopeMultiplier * 1.16,
      );
      const seguimientoProject: Record<string, unknown> = {
        ...existingParsed,
        codigo: codigoProyecto,
        cliente: activeCitaTask.project ?? clientName ?? "Cliente",
        isProspect: true,
        preliminarCotizaciones,
        inversion: estimatedInversion,
        fechaInicio: formatSeguimientoDateLong(),
        fechaEntrega: newPreliminar.date || "Por definir",
        etapaActual: normalizeEtapaForStorage(existingParsed.etapaActual),
        estadoProyecto: "Prospecto",
        pagos: defaultPagosForInversion(estimatedInversion),
        garantiaInicio: "",
        cotizacionPreliminarImage: "",
        cotizacionFormalImage: "",
      };
      if (options?.seguimientoPdf) {
        const prevArchivos = Array.isArray(existingParsed.archivos)
          ? [...(existingParsed.archivos as object[])]
          : [];
        seguimientoProject.archivos = [
          ...prevArchivos,
          {
            id: `seg-preliminar-${options.seguimientoPdf.key}`,
            name: options.seguimientoPdf.fileLabel,
            type: "pdf",
            indexedPdfKey: options.seguimientoPdf.key,
          },
        ];
      }
      try {
        window.localStorage.setItem(projectKey, JSON.stringify(seguimientoProject));
      } catch {
        // Mismo criterio: no bloqueamos el flujo si esta escritura falla.
      }
    }

    return { codigoProyecto, updatedTasks };
  };

  const handleFinishCita = async () => {
    setFinishError(null);
    if (!activeCitaTaskId || !activeCitaTask) return;
    const err = validatePreliminarSections();
    if (err) {
      setFinishError(err);
      return;
    }
    const newPreliminar = buildPreliminarDataFromForm();
    const existingCount = getPreliminarList(activeCitaTask).length;
    const preliminarPdfKey = createPreliminarSeguimientoPdfKey(activeCitaTaskId, existingCount);
    let dataUrl: string;
    try {
      dataUrl = await buildPreliminarPdfDataUrl(newPreliminar);
    } catch {
      setFinishError("No se pudo generar el PDF para seguimiento. Intenta de nuevo.");
      return;
    }
    try {
      await saveFormalPdf(preliminarPdfKey, dataUrl);
    } catch {
      setFinishError("No se pudo guardar el PDF. Intenta de nuevo.");
      return;
    }
    const fileLabel = `Levantamiento detallado — ${newPreliminar.projectType}.pdf`;
    const result = savePreliminarAndGetNextTasks({
      seguimientoPdf: { key: preliminarPdfKey, fileLabel },
    });
    if (!result) return;
    const updatedTasksWithStage = result.updatedTasks.map((task) =>
      task.id === activeCitaTaskId
        ? { ...task, stage: "disenos" as const, status: "pendiente" as const }
        : task,
    );
    saveKanbanTasksToLocalStorage(updatedTasksWithStage);
    window.localStorage.removeItem(activeCitaTaskStorageKey);
    const returnUrl = window.localStorage.getItem(citaReturnUrlStorageKey);
    window.localStorage.removeItem(citaReturnUrlStorageKey);
    router.push(returnUrl || "/dashboard/empleado");
  };

  const handleFinishAndContinue = async () => {
    setFinishError(null);
    if (!activeCitaTaskId || !activeCitaTask) return;
    const err = validatePreliminarSections();
    if (err) {
      setFinishError(err);
      return;
    }
    const newPreliminar = buildPreliminarDataFromForm();
    const existingCount = getPreliminarList(activeCitaTask).length;
    const preliminarPdfKey = createPreliminarSeguimientoPdfKey(activeCitaTaskId, existingCount);
    let dataUrl: string;
    try {
      dataUrl = await buildPreliminarPdfDataUrl(newPreliminar);
    } catch {
      setFinishError("No se pudo generar el PDF para seguimiento. Intenta de nuevo.");
      return;
    }
    try {
      await saveFormalPdf(preliminarPdfKey, dataUrl);
    } catch {
      setFinishError("No se pudo guardar el PDF. Intenta de nuevo.");
      return;
    }
    const fileLabel = `Levantamiento detallado — ${newPreliminar.projectType}.pdf`;
    const result = savePreliminarAndGetNextTasks({
      seguimientoPdf: { key: preliminarPdfKey, fileLabel },
    });
    if (!result) return;
    setProjectType("Cocina");
    setLocation("");
    setDeliveryWeeksMin("");
    setDeliveryWeeksMax("");
    setLargo("4.2");
    setAlto("2.4");
    setFondo("0.6");
    setSelectedCubierta(materialCatalog.cubiertas[0].id);
    setSelectedFrente(materialCatalog.frentes[0].id);
    setSelectedHerraje(materialCatalog.herrajes[0].id);
    setSelectedScenario("esencial");
    setLevantamiento(defaultLevantamientoDetalle());
    setWallPage(1);
    setWallSearch("");
    setApplianceStep(0);
    setApplianceSearch("");
    setApplianceBrowseMode(true);
    setLightingShowOtro(false);
    setLightingBrowseMode(true);
    setLightingFocusedId(null);
    setLightingSearch("");
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

  const levantamientoScopeMultiplier = useMemo(
    () => levantamientoDetalleScopeMultiplier(levantamiento),
    [levantamiento],
  );

  const scenarioRangeLabel = useMemo(() => {
    const scenarioSubtotal = metrics.subtotal * selectedScenarioMultiplier * levantamientoScopeMultiplier;
    const min = scenarioSubtotal * 0.92;
    const max = scenarioSubtotal * 1.08;
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  }, [metrics.subtotal, selectedScenarioMultiplier, levantamientoScopeMultiplier]);

  useEffect(() => {
    setPages({ cubiertas: 1, frentes: 1, herrajes: 1 });
  }, [materialSearch, tierFilter]);

  const handleGeneratePdf = () => {
    const data = buildPreliminarDataFromForm();
    downloadPreliminarPdf(data, "levantamiento-detallado.pdf");
  };

  const applianceStepMeta = useMemo(() => {
    const isOtro = applianceStep >= APPLIANCE_OTRO_STEP_INDEX;
    if (isOtro) return { isOtro: true as const, progress: null };
    return { isOtro: false as const, progress: getApplianceCategoryProgress(applianceStep) };
  }, [applianceStep]);

  const currentApplianceItem =
    applianceStep < APPLIANCE_OTRO_STEP_INDEX ? APPLIANCE_ITEMS[applianceStep] : null;

  const wallSearchNorm = wallSearch.trim().toLowerCase();
  const filteredWallItems = useMemo(() => {
    if (!wallSearchNorm) return null;
    return WALL_ITEMS.filter((item) => {
      const hay = `${item.label} ${item.hint ?? ""}`.toLowerCase();
      return hay.includes(wallSearchNorm);
    });
  }, [wallSearchNorm]);

  const applianceSearchNorm = applianceSearch.trim().toLowerCase();
  const filteredApplianceMatches = useMemo(() => {
    if (!applianceSearchNorm) return null;
    return APPLIANCE_ITEMS.map((item, idx) => ({ item, idx })).filter(({ item }) => {
      const hay = `${item.label} ${item.hint ?? ""} ${item.categoria ?? ""}`.toLowerCase();
      return hay.includes(applianceSearchNorm);
    });
  }, [applianceSearchNorm]);

  const lightingSearchNorm = lightingSearch.trim().toLowerCase();
  const filteredLightingItems = useMemo(() => {
    if (!lightingSearchNorm) return null;
    return LIGHTING_ITEMS.filter((item) => {
      const hay = `${item.label} ${item.id} ${item.hint ?? ""}`.toLowerCase();
      return hay.includes(lightingSearchNorm);
    });
  }, [lightingSearchNorm]);

  const applianceCarouselRows = useMemo(() => {
    const norm = applianceSearchNorm;
    const matchesSearch = (item: ItemCatalogo) => {
      if (!norm) return true;
      const hay = `${item.label} ${item.hint ?? ""} ${item.categoria ?? ""}`.toLowerCase();
      return hay.includes(norm);
    };
    if (norm) {
      const entries = APPLIANCE_ITEMS.map((item, idx) => ({ item, idx })).filter(({ item }) =>
        matchesSearch(item),
      );
      return entries.length ? [{ key: "busqueda", title: "Resultados de búsqueda", entries }] : [];
    }
    return APPLIANCE_CATEGORIAS.map((cat) => {
      const entries = APPLIANCE_ITEMS.map((item, idx) => ({ item, idx })).filter(
        ({ item }) => item.categoria === cat,
      );
      return { key: cat, title: cat, entries };
    }).filter((row) => row.entries.length > 0);
  }, [applianceSearchNorm]);

  const applianceIndicesInCurrentCategory = useMemo(() => {
    if (applianceStep >= APPLIANCE_OTRO_STEP_INDEX) return [] as number[];
    const cat = APPLIANCE_ITEMS[applianceStep]?.categoria;
    if (!cat) return [];
    return APPLIANCE_ITEMS.map((item, i) => (item.categoria === cat ? i : -1)).filter((i) => i >= 0);
  }, [applianceStep]);

  useEffect(() => {
    setLightingFocusedId(null);
    setLightingBrowseMode(true);
  }, [lightingSearch, lightingShowOtro]);

  const lightingDetailItem = useMemo(() => {
    if (!lightingFocusedId) return null;
    return LIGHTING_ITEMS.find((i) => i.id === lightingFocusedId) ?? null;
  }, [lightingFocusedId]);

  const lightingModalNavIds = useMemo(() => {
    if (!lightingFocusedId) return [] as string[];
    if (lightingSearchNorm && filteredLightingItems && filteredLightingItems.length > 0) {
      return filteredLightingItems.map((i) => i.id);
    }
    for (const indices of LIGHTING_PAGE_INDICES) {
      const ids = indices.map((idx) => LIGHTING_ITEMS[idx].id);
      if (ids.includes(lightingFocusedId)) return ids;
    }
    return [];
  }, [lightingFocusedId, lightingSearchNorm, filteredLightingItems]);

  const lightingRowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (lightingFocusedId && !LIGHTING_ITEMS.some((i) => i.id === lightingFocusedId)) {
      setLightingFocusedId(null);
    }
  }, [lightingFocusedId]);

  useLayoutEffect(() => {
    if (!applianceBrowseMode) {
      applianceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [applianceBrowseMode]);

  useLayoutEffect(() => {
    if (!lightingBrowseMode && lightingFocusedId) {
      lightingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [lightingBrowseMode, lightingFocusedId]);

  return (
    <main
      className={`min-h-screen bg-background px-4 py-10 text-primary ${activeCitaTask ? "pb-36 sm:pb-32" : "pb-10"}`}
    >
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
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Cita activa: {activeCitaTask.project}
                </p>
                <p className="text-xs text-emerald-600">
                  Completa el formulario; al pie tienes <strong>Terminar</strong> y{" "}
                  <strong>Terminar y continuar</strong>. La estimación se guarda en la tarjeta; descarga el PDF
                  desde Clientes en proceso o las listas del panel admin cuando la necesites (o con{" "}
                  <strong>Generar estimación en PDF</strong> arriba).
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <SectionCard>
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
              Sección A · Datos del proyecto
            </p>
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
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Tiempo de entrega (Semanas aproximadas)
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <label className="min-w-[100px] flex-1 text-[11px] font-semibold text-secondary">
                      Mín. semanas
                      <input
                        ref={deliveryWeeksMinInputRef}
                        value={deliveryWeeksMin}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          lastEditedFieldRef.current = "deliveryWeeksMin";
                          caretPositionsRef.current.deliveryWeeksMin = event.target.selectionStart ?? null;
                          setDeliveryWeeksMin(nextValue);
                        }}
                        type="number"
                        min={1}
                        step={1}
                        placeholder="ej. 8"
                        className="mt-1 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="min-w-[100px] flex-1 text-[11px] font-semibold text-secondary">
                      Máx. semanas
                      <input
                        ref={deliveryWeeksMaxInputRef}
                        value={deliveryWeeksMax}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          lastEditedFieldRef.current = "deliveryWeeksMax";
                          caretPositionsRef.current.deliveryWeeksMax = event.target.selectionStart ?? null;
                          setDeliveryWeeksMax(nextValue);
                        }}
                        type="number"
                        min={1}
                        step={1}
                        placeholder="ej. 9"
                        className="mt-1 w-full rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none"
                      />
                    </label>
                  </div>
                </div>
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
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Comentarios de esta sección
              <textarea
                value={levantamiento.sectionComments.a ?? ""}
                onChange={(e) => setSectionComment("a", e.target.value)}
                rows={3}
                placeholder="Notas del levantamiento (accesos, muros load-bearing, etc.)"
                className="mt-2 w-full resize-y rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none placeholder:text-secondary/50"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Sección B · Medidas de paredes
              </p>
              <p className="mt-2 text-sm text-secondary">
                Referencia visual por tipo de muro. Cada tipo muestra las medidas en metros que aplican a ese caso
                (no solo tres campos genéricos). La página «Otro» cubre situaciones que no encajan en el catálogo.
              </p>
              <Link
                href="/dashboard/referencia-tipos-pared"
                className="mt-2 inline-block text-sm font-semibold text-[#8B1C1C] underline-offset-2 hover:underline"
              >
                Ver catálogo de referencia (imágenes por tipo de muro)
              </Link>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Buscar tipo de muro
              <span className="relative mt-2 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/70" />
                <input
                  value={wallSearch}
                  onChange={(e) => setWallSearch(e.target.value)}
                  placeholder="Ej. ventana, esquina, nicho…"
                  className="w-full rounded-2xl border border-primary/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-secondary/45"
                />
              </span>
            </label>
            {filteredWallItems !== null ? (
              <div className="space-y-4">
                {filteredWallItems.length === 0 ? (
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-secondary">
                    No hay tipos que coincidan. Prueba otra palabra o borra la búsqueda para ver las páginas.
                  </div>
                ) : (
                  <div className="space-y-10">
                    <p className="text-xs font-semibold text-secondary">
                      {filteredWallItems.length} resultado{filteredWallItems.length === 1 ? "" : "s"}
                    </p>
                    {filteredWallItems.map((item) => {
                      const m = levantamiento.wallMeasures[item.id] ?? emptyWallMeasuresForId(item.id);
                      const wallFields = getWallMeasureFieldDefs(item.id);
                      return (
                        <div
                          key={item.id}
                          className="grid gap-4 border-b border-primary/5 pb-10 last:border-0 last:pb-0 lg:grid-cols-[minmax(0,240px)_1fr]"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-primary/10 bg-primary/5">
                            <WallTypeImage item={item} />
                            <WallMeasureBadgesOverlay wallId={item.id} />
                            <span className="absolute bottom-2 left-2 z-[4] rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                              {item.label}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-primary">{item.label}</p>
                            {item.hint ? <p className="text-xs text-secondary">{item.hint}</p> : null}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {wallFields.map((field, fi) => (
                                <label
                                  key={field.key}
                                  className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary"
                                >
                                  {wallMeasureLetter(fi)} · {field.label} (m)
                                  <input
                                    value={m[field.key] ?? ""}
                                    onChange={(e) => patchWallMeasure(item.id, field.key, e.target.value)}
                                    inputMode="decimal"
                                    className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-sm outline-none"
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWallSearch("")}
                    className="rounded-full border border-primary/15 bg-white px-4 py-2 text-xs font-semibold text-secondary transition hover:border-primary/35"
                  >
                    Limpiar búsqueda y ver por páginas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWallSearch("");
                      setWallPage(4);
                    }}
                    className="rounded-full border border-dashed border-primary/25 bg-white px-4 py-2 text-xs font-semibold text-secondary transition hover:border-primary/35"
                  >
                    Ir a «Otro» (muro no listado)
                  </button>
                </div>
              </div>
            ) : (
              <>
            <div className="flex flex-wrap items-center gap-2">
              {([1, 2, 3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setWallPage(n)}
                  className={`min-h-8 min-w-8 rounded-full px-3 text-xs font-semibold transition ${
                    wallPage === n
                      ? "bg-[#8B1C1C] text-white"
                      : "border border-primary/10 bg-white text-secondary hover:border-primary/30"
                  }`}
                >
                  {n === 4 ? "Otro" : `Página ${n}`}
                </button>
              ))}
            </div>
            {wallPage < 4 ? (
              <div className="space-y-10">
                {WALL_PAGE_INDICES[wallPage - 1].map((idx) => {
                  const item = WALL_ITEMS[idx];
                  const m = levantamiento.wallMeasures[item.id] ?? emptyWallMeasuresForId(item.id);
                  const wallFields = getWallMeasureFieldDefs(item.id);
                  return (
                    <div
                      key={item.id}
                      className="grid gap-4 border-b border-primary/5 pb-10 last:border-0 last:pb-0 lg:grid-cols-[minmax(0,240px)_1fr]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-primary/10 bg-primary/5">
                        <WallTypeImage item={item} />
                        <WallMeasureBadgesOverlay wallId={item.id} />
                        <span className="absolute bottom-2 left-2 z-[4] rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                          {item.label}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-primary">{item.label}</p>
                        {item.hint ? <p className="text-xs text-secondary">{item.hint}</p> : null}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {wallFields.map((field, fi) => (
                            <label
                              key={field.key}
                              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary"
                            >
                              {wallMeasureLetter(fi)} · {field.label} (m)
                              <input
                                value={m[field.key] ?? ""}
                                onChange={(e) => patchWallMeasure(item.id, field.key, e.target.value)}
                                inputMode="decimal"
                                className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-sm outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 rounded-2xl border border-dashed border-primary/20 bg-primary/[0.03] p-5">
                <p className="text-sm font-semibold text-primary">Otro tipo de muro o situación especial</p>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Descripción
                  <textarea
                    value={levantamiento.wallOtro.descripcion}
                    onChange={(e) => patchOtro("wallOtro", "descripcion", e.target.value)}
                    rows={3}
                    className="mt-2 w-full resize-y rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(["ancho", "alto", "fondo"] as const).map((field, fi) => (
                    <label
                      key={field}
                      className="text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary"
                    >
                      {wallMeasureLetter(fi)} · {field} (m)
                      <input
                        value={levantamiento.wallOtro[field]}
                        onChange={(e) => patchOtro("wallOtro", field, e.target.value)}
                        inputMode="decimal"
                        className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-sm outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Comentarios de esta sección
              <textarea
                value={levantamiento.sectionComments.b ?? ""}
                onChange={(e) => setSectionComment("b", e.target.value)}
                rows={3}
                placeholder="Detalles adicionales sobre muros…"
                className="mt-2 w-full resize-y rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none placeholder:text-secondary/50"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard>
          <div ref={applianceSectionRef} className="scroll-mt-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Sección C · Electrodomésticos
              </p>
              <p className="mt-2 text-sm text-secondary">
                Pósters grandes (2:3); el nombre va en la parte baja de la foto. Clic abre el detalle en la página.
                Medidas en metros.
              </p>
            </div>
            {!applianceBrowseMode ? (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setApplianceBrowseMode(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-2 text-sm font-semibold text-[#8B1C1C] transition hover:border-primary/30"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  Volver al catálogo
                </button>
                {currentApplianceItem ? (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
                    <div className="relative mx-auto aspect-[2/3] w-full max-w-[min(20rem,92vw)] overflow-hidden rounded-2xl border border-primary/10 bg-white lg:mx-0">
                      <ApplianceTypeImage
                        item={currentApplianceItem}
                        alt=""
                        className="absolute inset-0 z-0 box-border h-full w-full object-contain object-center p-2"
                      />
                      <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        {currentApplianceItem.categoria ?? "Electrodoméstico"}
                      </span>
                      <span className="pointer-events-none absolute bottom-2 left-2 right-2 z-10 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold leading-snug text-white">
                        {currentApplianceItem.label}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8B1C1C]">
                          {currentApplianceItem.categoria}
                        </p>
                        <p className="text-base font-semibold text-primary">{currentApplianceItem.label}</p>
                        {currentApplianceItem.hint ? (
                          <p className="mt-2 text-sm text-secondary">{currentApplianceItem.hint}</p>
                        ) : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {(["ancho", "alto", "fondo"] as const).map((field) => {
                          const m =
                            levantamiento.applianceMeasures[currentApplianceItem.id] ?? {
                              ancho: "",
                              alto: "",
                              fondo: "",
                            };
                          return (
                            <label
                              key={field}
                              className="text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary"
                            >
                              {field} (m)
                              <input
                                value={m[field]}
                                onChange={(e) =>
                                  patchMedidasMap("applianceMeasures", currentApplianceItem.id, field, e.target.value)
                                }
                                inputMode="decimal"
                                className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-sm outline-none"
                              />
                            </label>
                          );
                        })}
                      </div>
                      {applianceIndicesInCurrentCategory.length > 1 ? (
                        <div className="flex flex-wrap gap-2 border-t border-primary/10 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              const pos = applianceIndicesInCurrentCategory.indexOf(applianceStep);
                              if (pos > 0) setApplianceStep(applianceIndicesInCurrentCategory[pos - 1]!);
                            }}
                            disabled={applianceIndicesInCurrentCategory.indexOf(applianceStep) <= 0}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/15 px-3 py-2 text-xs font-semibold text-primary disabled:opacity-40"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior en categoría
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const pos = applianceIndicesInCurrentCategory.indexOf(applianceStep);
                              const list = applianceIndicesInCurrentCategory;
                              if (pos < list.length - 1) setApplianceStep(list[pos + 1]!);
                            }}
                            disabled={
                              applianceIndicesInCurrentCategory.indexOf(applianceStep) >=
                              applianceIndicesInCurrentCategory.length - 1
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-primary/15 px-3 py-2 text-xs font-semibold text-primary disabled:opacity-40"
                          >
                            Siguiente en categoría
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-dashed border-primary/20 bg-primary/[0.03] p-5">
                    <p className="text-sm font-semibold text-primary">Otro electrodoméstico</p>
                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                      Descripción
                      <textarea
                        value={levantamiento.applianceOtro.descripcion}
                        onChange={(e) => patchOtro("applianceOtro", "descripcion", e.target.value)}
                        rows={3}
                        className="mt-2 w-full resize-y rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["ancho", "alto", "fondo"] as const).map((field) => (
                        <label
                          key={field}
                          className="text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary"
                        >
                          {field} (m)
                          <input
                            value={levantamiento.applianceOtro[field]}
                            onChange={(e) => patchOtro("applianceOtro", field, e.target.value)}
                            inputMode="decimal"
                            className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-sm outline-none"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Buscar electrodoméstico
                  <span className="relative mt-2 block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/70" />
                    <input
                      value={applianceSearch}
                      onChange={(e) => setApplianceSearch(e.target.value)}
                      placeholder="Nombre, categoría o palabra del tipo…"
                      className="w-full rounded-2xl border border-primary/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-secondary/45"
                    />
                  </span>
                </label>
                {filteredApplianceMatches !== null && filteredApplianceMatches.length > 0 ? (
                  <div className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                      Resultados ({filteredApplianceMatches.length}) · clic para ir al detalle
                    </p>
                    <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                      {filteredApplianceMatches.map(({ item, idx }) => {
                        const isCurrent = applianceStep === idx && !applianceStepMeta.isOtro;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setApplianceStep(idx);
                              setApplianceBrowseMode(false);
                            }}
                            className={`max-w-full truncate rounded-full px-3 py-1.5 text-left text-xs font-semibold transition ${
                              isCurrent
                                ? "bg-[#8B1C1C] text-white"
                                : "border border-primary/15 bg-white text-primary hover:border-primary/35"
                            }`}
                            title={`${item.categoria ?? ""} — ${item.label}`}
                          >
                            <span className="text-secondary/80">{item.categoria ?? ""}: </span>
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setApplianceSearch("")}
                      className="mt-3 text-xs font-semibold text-[#8B1C1C] underline-offset-2 hover:underline"
                    >
                      Limpiar búsqueda
                    </button>
                  </div>
                ) : filteredApplianceMatches !== null && filteredApplianceMatches.length === 0 ? (
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-secondary">
                    Sin coincidencias. Prueba otro término o borra el texto del buscador.
                  </div>
                ) : null}
                {!applianceSearchNorm && applianceCarouselRows.length > 0 ? (
                  <div className="space-y-8">
                    {applianceCarouselRows.map((row) => (
                      <div key={row.key} className={streamRowShell}>
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                          <div>
                            <p className={streamRowHeading}>{row.title}</p>
                            <p className={streamRowHint}>Electrodomésticos</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const el = applianceRowRefs.current[row.key];
                              if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
                            }}
                            className={streamVerTodosClass}
                          >
                            Ver todos
                          </button>
                        </div>
                        <div
                          ref={(el) => {
                            applianceRowRefs.current[row.key] = el;
                          }}
                          className={streamScrollClass}
                        >
                          {row.entries.map(({ item, idx }, rank) => (
                            <div key={item.id} className="flex shrink-0 items-end gap-1">
                              <span className={streamRankClass} aria-hidden>
                                {rank + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setApplianceStep(idx);
                                  setApplianceBrowseMode(false);
                                }}
                                className="text-left"
                              >
                                <div className={streamPosterClass(applianceStep === idx)}>
                                  <ApplianceTypeImage
                                    item={item}
                                    alt=""
                                    className={streamCatalogThumbImageClass}
                                  />
                                  <div className={streamPosterTitleOverlay}>
                                    <p className={streamPosterLabelClass}>{item.label}</p>
                                  </div>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className={streamRowShell}>
                      <div className="mb-4">
                        <p className={streamRowHeading}>Otro</p>
                        <p className={streamRowHint}>No listado en catálogo</p>
                      </div>
                      <div className={streamScrollClass}>
                        <div className="flex shrink-0 items-end gap-1">
                          <span className={`${streamRankClass} pb-2 font-semibold text-zinc-500`} aria-hidden title="Otro">
                            +
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setApplianceStep(APPLIANCE_OTRO_STEP_INDEX);
                              setApplianceBrowseMode(false);
                            }}
                            className="text-left"
                          >
                            <div
                              className={`${streamPosterClass(false)} flex flex-col items-center justify-end border-2 border-dashed border-white/25 bg-zinc-900/80 pb-3 pt-10`}
                            >
                              <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                                Otro
                              </span>
                              <span className="mt-1 px-2 text-center text-xs text-zinc-500">No en catálogo</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : applianceSearchNorm && applianceCarouselRows.length > 0 ? (
                  <div className={streamRowShell}>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className={streamRowHeading}>Resultados de búsqueda</p>
                        <p className={streamRowHint}>Electrodomésticos</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const el = applianceRowRefs.current.busqueda;
                          if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
                        }}
                        className={streamVerTodosClass}
                      >
                        Ver todos
                      </button>
                    </div>
                    <div
                      ref={(el) => {
                        applianceRowRefs.current.busqueda = el;
                      }}
                      className={streamScrollClass}
                    >
                      {applianceCarouselRows[0]?.entries.map(({ item, idx }, rank) => (
                        <div key={item.id} className="flex shrink-0 items-end gap-1">
                          <span className={streamRankClass} aria-hidden>
                            {rank + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setApplianceStep(idx);
                              setApplianceBrowseMode(false);
                            }}
                            className="text-left"
                          >
                            <div className={streamPosterClass(applianceStep === idx)}>
                              <ApplianceTypeImage
                                item={item}
                                alt=""
                                className={streamCatalogThumbImageClass}
                              />
                              <div className={streamPosterTitleOverlay}>
                                <p className={streamPosterLabelClass}>{item.label}</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Comentarios de esta sección
              <textarea
                value={levantamiento.sectionComments.c ?? ""}
                onChange={(e) => setSectionComment("c", e.target.value)}
                rows={3}
                placeholder="Marcas, modelos, voltajes…"
                className="mt-2 w-full resize-y rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none placeholder:text-secondary/50"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Sección D · Showroom digital
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Cubiertas / frentes / herrajes</h2>
              <p className="mt-2 text-sm text-secondary">Personaliza el look con el catálogo digital.</p>
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
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Comentarios de esta sección
              <textarea
                value={levantamiento.sectionComments.d ?? ""}
                onChange={(e) => setSectionComment("d", e.target.value)}
                rows={3}
                placeholder="Preferencias de acabado, referencias, etc."
                className="mt-2 w-full resize-y rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none placeholder:text-secondary/50"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard>
          <div ref={lightingSectionRef} className="scroll-mt-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                Sección E · Iluminación
              </p>
              <p className="mt-2 text-sm text-secondary">
                Pósters grandes; título sobre la imagen. Clic abre el detalle aquí. La lista definitiva la confirma la
                empresa.
              </p>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Buscar tipo de iluminación
              <span className="relative mt-2 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/70" />
                <input
                  value={lightingSearch}
                  onChange={(e) => setLightingSearch(e.target.value)}
                  placeholder="Ej. LED, spot, colgante, indirecta…"
                  className="w-full rounded-2xl border border-primary/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-secondary/45"
                />
              </span>
            </label>
            {lightingShowOtro ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setLightingShowOtro(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-2 text-sm font-semibold text-[#8B1C1C] transition hover:border-primary/30"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  Volver al catálogo
                </button>
                <div className="space-y-4 rounded-2xl border border-dashed border-primary/20 bg-primary/[0.03] p-5">
                  <p className="text-sm font-semibold text-primary">Otro luminario o esquema</p>
                  <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                    Descripción
                    <textarea
                      value={levantamiento.lightingOtro.descripcion}
                      onChange={(e) => patchOtro("lightingOtro", "descripcion", e.target.value)}
                      rows={3}
                      className="mt-2 w-full resize-y rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(["ancho", "alto", "fondo"] as const).map((field) => (
                      <label
                        key={field}
                        className="text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary"
                      >
                        {field} (m)
                        <input
                          value={levantamiento.lightingOtro[field]}
                          onChange={(e) => patchOtro("lightingOtro", field, e.target.value)}
                          inputMode="decimal"
                          className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-sm outline-none"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : !lightingBrowseMode && lightingDetailItem ? (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => {
                    setLightingBrowseMode(true);
                    setLightingFocusedId(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-2 text-sm font-semibold text-[#8B1C1C] transition hover:border-primary/30"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  Volver al catálogo
                </button>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr]">
                  <div className="relative mx-auto aspect-[2/3] w-full max-w-[min(20rem,92vw)] overflow-hidden rounded-2xl border border-primary/10 bg-white lg:mx-0">
                    <LightingTypeImage
                      item={lightingDetailItem}
                      alt=""
                      className="absolute inset-0 z-0 box-border h-full w-full object-contain object-center p-2"
                    />
                    <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold text-white">
                      {lightingDetailItem.label}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-base font-semibold text-primary">{lightingDetailItem.label}</p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(["ancho", "alto", "fondo"] as const).map((field) => {
                        const m =
                          levantamiento.lightingMeasures[lightingDetailItem.id] ?? {
                            ancho: "",
                            alto: "",
                            fondo: "",
                          };
                        return (
                          <label
                            key={field}
                            className="text-[10px] font-semibold uppercase tracking-[0.15em] text-secondary"
                          >
                            {field} (m)
                            <input
                              value={m[field]}
                              onChange={(e) =>
                                patchMedidasMap("lightingMeasures", lightingDetailItem.id, field, e.target.value)
                              }
                              inputMode="decimal"
                              className="mt-1.5 w-full rounded-2xl border border-primary/10 bg-white px-3 py-2.5 text-sm outline-none"
                            />
                          </label>
                        );
                      })}
                    </div>
                    {lightingModalNavIds.length > 1 ? (
                      <div className="flex flex-wrap gap-2 border-t border-primary/10 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            const pos = lightingModalNavIds.indexOf(lightingFocusedId!);
                            if (pos > 0) setLightingFocusedId(lightingModalNavIds[pos - 1]!);
                          }}
                          disabled={!lightingFocusedId || lightingModalNavIds.indexOf(lightingFocusedId) <= 0}
                          className="inline-flex items-center gap-1 rounded-full border border-primary/15 px-3 py-2 text-xs font-semibold text-primary disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const pos = lightingFocusedId ? lightingModalNavIds.indexOf(lightingFocusedId) : -1;
                            if (pos < lightingModalNavIds.length - 1) {
                              setLightingFocusedId(lightingModalNavIds[pos + 1]!);
                            }
                          }}
                          disabled={
                            !lightingFocusedId ||
                            lightingModalNavIds.indexOf(lightingFocusedId) >= lightingModalNavIds.length - 1
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-primary/15 px-3 py-2 text-xs font-semibold text-primary disabled:opacity-40"
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : filteredLightingItems !== null ? (
              <div className="space-y-4">
                {filteredLightingItems.length === 0 ? (
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-secondary">
                    No hay tipos que coincidan. Prueba otra palabra o borra la búsqueda para ver el catálogo por filas.
                  </div>
                ) : (
                  <div className={streamRowShell}>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className={streamRowHeading}>Resultados de búsqueda</p>
                        <p className={streamRowHint}>
                          Iluminación · {filteredLightingItems.length} tipo
                          {filteredLightingItems.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const el = lightingRowRefs.current.busqueda;
                          if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
                        }}
                        className={streamVerTodosClass}
                      >
                        Ver todos
                      </button>
                    </div>
                    <div
                      ref={(el) => {
                        lightingRowRefs.current.busqueda = el;
                      }}
                      className={streamScrollClass}
                    >
                      {filteredLightingItems.map((item, rank) => (
                        <div key={item.id} className="flex shrink-0 items-end gap-1">
                          <span className={streamRankClass} aria-hidden>
                            {rank + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setLightingFocusedId(item.id);
                              setLightingBrowseMode(false);
                            }}
                            className="text-left"
                          >
                            <div className={streamPosterClass(lightingFocusedId === item.id)}>
                              <LightingTypeImage
                                item={item}
                                alt=""
                                className={streamLightingThumbClass}
                              />
                              <div className={streamPosterTitleOverlay}>
<p className={streamPosterLabelClass}>{item.label}</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLightingSearch("")}
                    className="rounded-full border border-primary/15 bg-white px-4 py-2 text-xs font-semibold text-secondary transition hover:border-primary/35"
                  >
                    Limpiar búsqueda y ver carruseles
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLightingSearch("");
                      setLightingShowOtro(true);
                    }}
                    className="rounded-full border border-dashed border-primary/25 bg-white px-4 py-2 text-xs font-semibold text-secondary transition hover:border-primary/35"
                  >
                    Ir a «Otro» (luminario no listado)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {LIGHTING_PAGE_INDICES.map((indices, rowIdx) => {
                  const rowKey = `luz-${rowIdx}`;
                  return (
                    <div key={rowKey} className={streamRowShell}>
                      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <p className={streamRowHeading}>
                            Iluminación · grupo {rowIdx + 1} de {LIGHTING_PAGE_INDICES.length}
                          </p>
                          <p className={streamRowHint}>Catálogo de referencia</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const el = lightingRowRefs.current[rowKey];
                            if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
                          }}
                          className={streamVerTodosClass}
                        >
                          Ver todos
                        </button>
                      </div>
                      <div
                        ref={(el) => {
                          lightingRowRefs.current[rowKey] = el;
                        }}
                        className={streamScrollClass}
                      >
                        {indices.map((idx, rank) => {
                          const item = LIGHTING_ITEMS[idx];
                          return (
                            <div key={item.id} className="flex shrink-0 items-end gap-1">
                              <span className={streamRankClass} aria-hidden>
                                {rank + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setLightingFocusedId(item.id);
                                  setLightingBrowseMode(false);
                                }}
                                className="text-left"
                              >
                                <div className={streamPosterClass(lightingFocusedId === item.id)}>
                                  <LightingTypeImage
                                    item={item}
                                    alt=""
                                    className={streamLightingThumbClass}
                                  />
                                  <div className={streamPosterTitleOverlay}>
                                    <p className={streamPosterLabelClass}>{item.label}</p>
                                  </div>
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div className={streamRowShell}>
                  <div className="mb-4">
                    <p className={streamRowHeading}>Otro</p>
                    <p className={streamRowHint}>No listado en catálogo</p>
                  </div>
                  <div className={streamScrollClass}>
                    <div className="flex shrink-0 items-end gap-1">
                      <span className={`${streamRankClass} pb-2 font-semibold text-zinc-500`} aria-hidden>
                        +
                      </span>
                      <button type="button" onClick={() => setLightingShowOtro(true)} className="text-left">
                        <div
                          className={`${streamPosterClass(false)} flex flex-col items-center justify-end border-2 border-dashed border-white/25 bg-zinc-900/80 pb-3 pt-10`}
                        >
                          <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                            Otro
                          </span>
                          <span className="mt-1 px-2 text-center text-xs text-zinc-500">No en catálogo</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Comentarios de esta sección
              <textarea
                value={levantamiento.sectionComments.e ?? ""}
                onChange={(e) => setSectionComment("e", e.target.value)}
                rows={3}
                placeholder="Circuitos, dimmers, temperatura de color…"
                className="mt-2 w-full resize-y rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm outline-none placeholder:text-secondary/50"
              />
            </label>
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
                const min =
                  metrics.subtotal * scenario.multiplier * levantamientoScopeMultiplier * 0.94;
                const max =
                  metrics.subtotal * scenario.multiplier * levantamientoScopeMultiplier * 1.06;
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
                El PDF incluye portada (datos, materiales, rango) y anexo con comentarios y medidas del
                levantamiento cuando hay información capturada.
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
                    {formatCurrency(
                      metrics.subtotal * selectedScenarioMultiplier * levantamientoScopeMultiplier,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary">IVA (16%)</p>
                  <p className="text-4xl font-bold text-[#8B1C1C]">
                    {formatCurrency(
                      metrics.iva * selectedScenarioMultiplier * levantamientoScopeMultiplier,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Total neto</p>
                  <p className="text-4xl font-bold text-[#8B1C1C]">
                    {formatCurrency(
                      metrics.total * selectedScenarioMultiplier * levantamientoScopeMultiplier,
                    )}
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
      {activeCitaTask ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-emerald-200/90 bg-white/95 px-4 py-3 shadow-[0_-6px_24px_rgba(0,0,0,0.07)] backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-xs text-secondary">
              Cierra la cita y guarda la estimación en la tarjeta del cliente. Con{" "}
              <span className="font-semibold text-emerald-800">Terminar y continuar</span> el formulario se
              reinicia para otro espacio. El PDF no se descarga solo: úsalo desde la vista de clientes o con{" "}
              <span className="font-semibold text-emerald-800">Generar estimación en PDF</span>.
            </p>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={handleFinishCita}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Terminar
              </button>
              <button
                type="button"
                onClick={handleFinishAndContinue}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                Terminar y continuar
              </button>
            </div>
          </div>
          {finishError ? (
            <p className="mx-auto mt-2 max-w-6xl text-sm text-rose-600">{finishError}</p>
          ) : null}
        </div>
      ) : null}
      <div
        className={`fixed right-6 z-40 w-[260px] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur-md ${
          activeCitaTask ? "bottom-28" : "bottom-6"
        }`}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-secondary">Rango estimado</p>
        <p className="mt-2 text-xl font-semibold text-[#8B1C1C]">
          {scenarioRangeLabel}
        </p>
        {levantamientoScopeMultiplier > 1.001 ? (
          <p className="mt-1.5 text-[10px] leading-snug text-secondary">
            Incluye ~{Math.round((levantamientoScopeMultiplier - 1) * 100)}% por volumen de información del levantamiento
            (heurística; no son partidas).
          </p>
        ) : null}
        <p className="mt-2 text-[11px] text-secondary">
          {selectedSummary.meters} m lineales / {selectedSummary.label || "Selección en curso"}
        </p>
      </div>
    </main>
  );
}
