"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Playfair_Display, Manrope } from "next/font/google";
import { DraftingCompass, Layers3, Sparkles } from "lucide-react";
import { getReturnRouteForLoggedUser } from "@/lib/role-routes";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["500", "700"],
});

const loadingSteps = [
  "Validando metadatos de cliente y tarea",
  "Sincronizando archivo con el flujo operativo",
  "Actualizando tablero y trazabilidad",
];

export default function FinalizandoLevantamientoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextRoute = useMemo(() => {
    const fallback = getReturnRouteForLoggedUser();
    const requested = searchParams.get("next")?.trim();
    if (!requested || !requested.startsWith("/")) {
      return fallback;
    }
    return requested;
  }, [searchParams]);

  useEffect(() => {
    const redirectTimeout = window.setTimeout(() => {
      router.replace(nextRoute);
    }, 1800);

    return () => {
      window.clearTimeout(redirectTimeout);
    };
  }, [nextRoute, router]);

  return (
    <main className={`${sans.className} relative overflow-hidden rounded-[2rem] border border-[#d2c7b8] bg-[radial-gradient(circle_at_20%_10%,#fff7ea_0%,#f5ecdf_35%,#efe4d7_70%,#e9ddcf_100%)] px-6 py-12 shadow-[0_25px_70px_rgba(81,54,28,0.18)] sm:px-10`}>
      <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#ad6b37]/20 blur-2xl" />
      <div className="pointer-events-none absolute -right-12 bottom-8 h-48 w-48 rounded-full bg-[#2d6b5f]/20 blur-2xl" />

      <div className="relative mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-3 text-[#6b4f33]">
          <Sparkles className="h-5 w-5" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em]">Transición de proceso</p>
        </div>

        <header className="space-y-3">
          <h1 className={`${display.className} text-3xl leading-tight text-[#3f2b19] sm:text-5xl`}>
            Finalizando levantamiento detallado
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#61472f] sm:text-base">
            Estamos cerrando la cita, consolidando medidas y asegurando la relación correcta de archivos con cliente y
            tarea antes de enviarte al panel.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-[#d8c8b6] bg-white/70 p-4 backdrop-blur-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#7a4f2b]/10 text-[#7a4f2b]">
              <DraftingCompass className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-[#4b3220]">Levantamiento</p>
            <p className="mt-1 text-xs text-[#6e5138]">Estructura, medidas y materiales en cierre técnico.</p>
          </article>
          <article className="rounded-2xl border border-[#d8c8b6] bg-white/70 p-4 backdrop-blur-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d6b5f]/10 text-[#2d6b5f]">
              <Layers3 className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-[#4b3220]">Sincronización</p>
            <p className="mt-1 text-xs text-[#6e5138]">Cliente, tarea y archivo quedan alineados en backend.</p>
          </article>
          <article className="rounded-2xl border border-[#d8c8b6] bg-white/70 p-4 backdrop-blur-sm">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#8b1c1c]/10 text-[#8b1c1c]">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-[#4b3220]">Entrega</p>
            <p className="mt-1 text-xs text-[#6e5138]">Te redirigimos al panel correspondiente a tu rol.</p>
          </article>
        </section>

        <section className="rounded-3xl border border-[#cdb79f] bg-[#fffaf4]/70 p-5">
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#dbc9b4]">
            <div className="h-full w-full origin-left animate-[loadingSweep_1.6s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[#7a4f2b] via-[#2d6b5f] to-[#8b1c1c]" />
          </div>
          <ul className="space-y-2 text-sm text-[#5b4028]">
            {loadingSteps.map((step) => (
              <li key={step} className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#7a4f2b]" />
                {step}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <style jsx>{`
        @keyframes loadingSweep {
          0% {
            transform: scaleX(0.08);
            opacity: 0.55;
          }
          50% {
            transform: scaleX(0.78);
            opacity: 1;
          }
          100% {
            transform: scaleX(0.08);
            opacity: 0.55;
          }
        }
      `}</style>
    </main>
  );
}
