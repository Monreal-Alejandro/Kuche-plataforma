import { Monitor, Sparkles, Toolbox, Truck } from "lucide-react";

const steps = [
  {
    title: "Cita",
    description: "Escuchamos tu estilo de vida y necesidades.",
    icon: Sparkles,
  },
  {
    title: "Diseño",
    description: "Propuesta personalizada con materiales cálidos.",
    icon: Monitor,
  },
  {
    title: "VR",
    description: "Recorre tu cocina en realidad virtual.",
    icon: Monitor,
    highlight: true,
  },
  {
    title: "CNC",
    description: "Precisión milimétrica para cada pieza.",
    icon: Toolbox,
    highlight: true,
  },
  {
    title: "Instalación",
    description: "Montaje limpio, rápido y con detalle.",
    icon: Truck,
  },
];

export default function ExperienceSection() {
  return (
    <section id="experiencia" className="bg-background px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Tu camino a la cocina ideal
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-primary md:text-4xl">
            Experiencia hecha a tu ritmo
          </h2>
          <p className="mt-2 text-sm text-secondary md:text-base">
            Un proceso claro, humano y con tecnología suave que acompaña cada
            paso.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-0 hidden h-full border-l border-dashed border-gray-200 md:block" />
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 1;
              return (
                <div
                  key={step.title}
                  className={`flex flex-col gap-4 md:flex-row ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <div className="hidden w-8 md:flex md:justify-center">
                    <div className="mt-4 h-3 w-3 rounded-full bg-gray-300" />
                  </div>
                  <div className="flex-1">
                    <div
                      className={`rounded-2xl bg-surface p-6 shadow-lg ${
                        step.highlight ? "border border-accent/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            step.highlight ? "bg-accent/10" : "bg-gray-100"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              step.highlight ? "text-accent" : "text-secondary"
                            }`}
                          />
                        </span>
                        <h3 className="text-lg font-semibold text-primary">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm text-secondary">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="hidden w-8 md:block" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
