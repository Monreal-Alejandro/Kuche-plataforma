"use client";

import {
  ClipboardList,
  DollarSign,
  FilePlus2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

type QuoteStatus = "Aprobada" | "Pendiente" | "En revisión";

type QuoteItem = {
  id: string;
  client: string;
  initials: string;
  date: string;
  status: QuoteStatus;
  total: string;
};

const kpiCards = [
  {
    title: "Ventas Mes",
    value: "$1.2M",
    icon: DollarSign,
    iconWrap: "bg-[#8B1C1C]/10 text-[#8B1C1C]",
  },
  {
    title: "Pendientes",
    value: "12",
    icon: ClipboardList,
    iconWrap: "bg-amber-100 text-amber-700",
  },
  {
    title: "Levantamientos",
    value: "3",
    icon: MapPin,
    iconWrap: "bg-sky-100 text-sky-700",
  },
  {
    title: "Leads",
    value: "8",
    icon: Users,
    iconWrap: "bg-violet-100 text-violet-700",
  },
] as const;

const latestQuotes: QuoteItem[] = [
  {
    id: "CTZ-4187",
    client: "Mariana Herrera",
    initials: "MH",
    date: "24 Abr 2026",
    status: "Aprobada",
    total: "$248,900",
  },
  {
    id: "CTZ-4186",
    client: "Carlos Ramírez",
    initials: "CR",
    date: "23 Abr 2026",
    status: "Pendiente",
    total: "$179,300",
  },
  {
    id: "CTZ-4184",
    client: "Valeria Núñez",
    initials: "VN",
    date: "22 Abr 2026",
    status: "En revisión",
    total: "$312,450",
  },
  {
    id: "CTZ-4181",
    client: "Alejandro Fuentes",
    initials: "AF",
    date: "21 Abr 2026",
    status: "Pendiente",
    total: "$96,700",
  },
];

function statusClass(status: QuoteStatus): string {
  if (status === "Aprobada") return "bg-green-100 text-green-700";
  if (status === "Pendiente") return "bg-yellow-100 text-yellow-700";
  return "bg-sky-100 text-sky-700";
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-stone-50 p-8">
      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                    {card.title}
                  </p>
                  <p className="mt-4 text-3xl font-bold text-stone-900">{card.value}</p>
                </div>
                <span className={`rounded-full p-3 ${card.iconWrap}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Análisis
              </p>
              <h2 className="mt-1 text-lg font-semibold text-stone-900">
                Tendencia de Cotizaciones (Semanal)
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#8B1C1C]/10 px-3 py-1 text-xs font-semibold text-[#8B1C1C]">
              <Sparkles className="h-3.5 w-3.5" />
              +12.4%
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <svg viewBox="0 0 720 240" className="h-56 w-full">
              <defs>
                <linearGradient id="kucheArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8B1C1C" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#8B1C1C" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="kucheLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#8B1C1C" />
                  <stop offset="100%" stopColor="#B35252" />
                </linearGradient>
              </defs>

              <path
                d="M 20 190 C 80 160, 120 155, 170 130 C 230 100, 280 115, 340 90 C 410 60, 470 72, 540 56 C 600 44, 650 48, 700 34 L 700 220 L 20 220 Z"
                fill="url(#kucheArea)"
              />
              <path
                d="M 20 190 C 80 160, 120 155, 170 130 C 230 100, 280 115, 340 90 C 410 60, 470 72, 540 56 C 600 44, 650 48, 700 34"
                fill="none"
                stroke="url(#kucheLine)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </article>

        <article className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Productividad
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-900">Acciones Rápidas</h2>

          <div className="mt-6 space-y-3">
            {[
              "Nueva cotización",
              "Registrar levantamiento",
              "Agregar cliente potencial",
              "Abrir agenda semanal",
            ].map((action) => (
              <button
                key={action}
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-[#8B1C1C]/20 bg-white px-4 py-3 text-left text-sm font-semibold text-[#8B1C1C] transition hover:bg-[#8B1C1C]/5"
              >
                {action}
                <FilePlus2 className="h-4 w-4" />
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Actividad Reciente
            </p>
            <h2 className="mt-1 text-lg font-semibold text-stone-900">Cotizaciones Recientes</h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#8B1C1C]/20 px-4 py-2 text-xs font-semibold text-[#8B1C1C] transition hover:bg-[#8B1C1C]/5"
          >
            Ver Todo
          </button>
        </div>

        <div className="space-y-4">
          {latestQuotes.map((quote) => (
            <div
              key={quote.id}
              className="flex flex-wrap items-center gap-4 rounded-full border border-stone-100 bg-white p-4 px-6 shadow-sm transition hover:bg-stone-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B1C1C]/10 text-sm font-bold text-[#8B1C1C]">
                {quote.initials}
              </div>

              <div className="min-w-[9rem] flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Cliente
                </p>
                <p className="text-sm font-semibold text-stone-900">{quote.client}</p>
              </div>

              <div className="min-w-[6rem]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">ID</p>
                <p className="text-sm font-semibold text-stone-900">{quote.id}</p>
              </div>

              <div className="min-w-[7rem]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Fecha
                </p>
                <p className="text-sm font-medium text-stone-700">{quote.date}</p>
              </div>

              <div className="min-w-[7rem]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Estado
                </p>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(quote.status)}`}
                >
                  {quote.status}
                </span>
              </div>

              <div className="ml-auto min-w-[7rem] text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  Total
                </p>
                <p className="text-base font-bold text-stone-900">{quote.total}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
