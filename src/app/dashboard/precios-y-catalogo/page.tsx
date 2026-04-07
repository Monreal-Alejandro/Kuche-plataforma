"use client";

import { DashboardBackButton } from "@/components/dashboard/DashboardBackButton";

export default function PreciosYCatalogoPage() {
  return (
    <main className="min-h-screen bg-background text-primary">
      <section className="pb-16 pt-6 md:pt-8">
        <DashboardBackButton />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Dashboard</p>
          <h1 className="mt-3 text-2xl font-semibold text-primary md:text-3xl">Precios y catálogo</h1>
          <p className="mt-2 max-w-xl text-sm text-secondary">
            Herramientas internas: cotizaciones, materiales de taller y configuración del levantamiento
            detallado (PDF). La configuración del levantamiento está disponible desde el Levantamiento
            Detallado o el panel de administración.
          </p>
        </div>
      </section>
    </main>
  );
}
