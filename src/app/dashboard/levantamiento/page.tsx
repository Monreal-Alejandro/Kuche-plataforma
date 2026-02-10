"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Ruler, Sparkles } from "lucide-react";

const stepTitles = [
  "Cliente",
  "Geometría",
  "Necesidades",
  "Escenarios",
  "Cierre",
];

const architects = ["Sofía Ramos", "Javier Méndez", "Luisana Ortiz", "Marcos Vega"];

const basePrice = 5000;

const materialFactors: Record<string, number> = {
  "Granito Básico": 1,
  Cuarzo: 1.2,
  "Piedra Sinterizada": 1.5,
};

const scenarios = [
  {
    id: "esencial",
    title: "Estilo esencial",
    subtitle: "Melaminas",
    multiplier: 0.9,
    items: ["Melamina premium", "Herrajes estándar", "Cubierta básica"],
    style: "border border-primary/10 bg-white",
  },
  {
    id: "tendencia",
    title: "Estilo tendencia",
    subtitle: "Alto brillo / Textura",
    multiplier: 1.1,
    items: ["Texturas importadas", "Herrajes soft-close", "Cubierta mejorada"],
    style: "border border-accent/40 bg-white",
  },
  {
    id: "premium",
    title: "Estilo premium",
    subtitle: "Laca / Madera / Tech",
    multiplier: 1.35,
    items: ["Laca o madera natural", "Iluminación integrada", "Hardware premium"],
    style: "bg-gradient-to-br from-white via-white to-accent/10 border border-accent/20",
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

export default function LevantamientoPage() {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
  });
  const [metros, setMetros] = useState("6");
  const [isla, setIsla] = useState(false);
  const [alacenas, setAlacenas] = useState(false);
  const [material, setMaterial] = useState("Granito Básico");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState(architects[0]);

  const metrosNumber = Number.parseFloat(metros) || 0;
  const materialFactor = materialFactors[material] ?? 1;

  const prices = useMemo(() => {
    const base = metrosNumber * basePrice * materialFactor;
    return scenarios.map((scenario) => {
      const scenarioPrice = base * scenario.multiplier;
      const min = Math.max(0, Math.round(scenarioPrice * 0.93));
      const max = Math.round(scenarioPrice * 1.08);
      return { ...scenario, min, max };
    });
  }, [metrosNumber, materialFactor]);

  const goNext = () => setStep((prev) => Math.min(prev + 1, stepTitles.length));
  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setStep(5);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Levantamiento</p>
          <h1 className="mt-2 text-3xl font-semibold">Nuevo levantamiento</h1>
          <p className="mt-2 text-sm text-secondary">
            Estimación rápida basada en metros lineales y materiales.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-secondary">
          <span>{stepTitles[step - 1]}</span>
          <div className="h-2 w-56 overflow-hidden rounded-full bg-primary/10">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(step / stepTitles.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-semibold">Paso 1 · El cliente</h2>
                <p className="mt-2 text-sm text-secondary">
                  Captura la información básica para abrir el levantamiento.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {([
                  { id: "nombre", label: "Nombre del cliente" },
                  { id: "direccion", label: "Dirección" },
                  { id: "telefono", label: "Teléfono" },
                ] as const).map((field) => (
                  <label key={field.id} className="text-xs font-semibold text-secondary">
                    {field.label}
                    <input
                      value={client[field.id]}
                      onChange={(event) =>
                        setClient((prev) => ({ ...prev, [field.id]: event.target.value }))
                      }
                      className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                    />
                  </label>
                ))}
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div>
                <h2 className="text-2xl font-semibold">Paso 2 · La geometría</h2>
                <p className="mt-2 text-sm text-secondary">
                  ¿Cuántos metros lineales aproximados tiene el proyecto?
                </p>
                <div className="mt-8 flex items-center justify-center rounded-3xl border border-primary/10 bg-white p-10">
                  <input
                    value={metros}
                    onChange={(event) => setMetros(event.target.value)}
                    type="number"
                    min="0"
                    className="w-full max-w-sm bg-transparent text-center text-5xl font-semibold text-primary outline-none"
                  />
                  <span className="ml-4 text-xl text-secondary">m</span>
                </div>
              </div>
              <div className="rounded-3xl border border-primary/10 bg-white p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Ruler className="h-4 w-4" />
                  ¿Qué es un metro lineal?
                </div>
                <div className="mt-4 rounded-2xl bg-primary/5 p-4">
                  <svg
                    viewBox="0 0 200 100"
                    className="h-28 w-full text-primary/70"
                    aria-hidden="true"
                  >
                    <line x1="10" y1="70" x2="190" y2="70" stroke="currentColor" strokeWidth="4" />
                    <line x1="10" y1="60" x2="10" y2="80" stroke="currentColor" strokeWidth="4" />
                    <line x1="190" y1="60" x2="190" y2="80" stroke="currentColor" strokeWidth="4" />
                    <text x="100" y="45" textAnchor="middle" fontSize="16" fill="currentColor">
                      Largo de la pared
                    </text>
                  </svg>
                  <p className="mt-2 text-xs text-secondary">
                    Medimos el largo total de los muros donde irán los muebles.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {step === 3 ? (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-semibold">Paso 3 · Necesidades</h2>
                <p className="mt-2 text-sm text-secondary">
                  Activa filtros rápidos para ajustar el rango estimado.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { id: "isla", label: "¿Requiere isla?", value: isla, setValue: setIsla },
                  {
                    id: "alacenas",
                    label: "¿Alacenas altas hasta el techo?",
                    value: alacenas,
                    setValue: setAlacenas,
                  },
                ].map((toggle) => (
                  <button
                    key={toggle.id}
                    onClick={() => toggle.setValue(!toggle.value)}
                    className={`flex items-center justify-between rounded-3xl border px-6 py-6 text-left text-sm font-semibold transition ${
                      toggle.value
                        ? "border-accent bg-accent text-white"
                        : "border-primary/10 bg-white text-primary hover:border-primary/30"
                    }`}
                  >
                    {toggle.label}
                    <span className="text-xs">{toggle.value ? "Sí" : "No"}</span>
                  </button>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                  Tipo de cubierta estimada
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {Object.keys(materialFactors).map((option) => (
                    <button
                      key={option}
                      onClick={() => setMaterial(option)}
                      className={`rounded-3xl border px-4 py-4 text-sm font-semibold transition ${
                        material === option
                          ? "border-accent bg-accent text-white"
                          : "border-primary/10 bg-white text-primary hover:border-primary/30"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}

          {step === 4 ? (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-semibold">Paso 4 · Escenarios</h2>
                <p className="mt-2 text-sm text-secondary">
                  Selecciona una estimación para guardar el levantamiento.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {prices.map((scenario, index) => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className={`rounded-3xl p-6 shadow-lg ${scenario.style}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                          {scenario.title}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold">{scenario.subtitle}</h3>
                      </div>
                      <Sparkles className="h-5 w-5 text-accent" />
                    </div>
                    <div className="mt-6 rounded-2xl bg-primary/5 px-4 py-3 text-center text-lg font-semibold">
                      {formatCurrency(scenario.min)} - {formatCurrency(scenario.max)}
                    </div>
                    <ul className="mt-4 space-y-2 text-xs text-secondary">
                      {scenario.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleScenarioSelect(scenario.id)}
                      className="mt-6 w-full rounded-2xl bg-primary py-3 text-xs font-semibold text-white"
                    >
                      Seleccionar este presupuesto
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {step === 5 ? (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-semibold">Paso 5 · Cierre</h2>
                <p className="mt-2 text-sm text-secondary">
                  Estimación guardada y asignación de seguimiento.
                </p>
              </div>
              <div className="rounded-3xl border border-primary/10 bg-white p-6">
                <p className="text-sm font-semibold">Asignar seguimiento a empleado</p>
                <select
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  {architects.map((architect) => (
                    <option key={architect} value={architect}>
                      {architect}
                    </option>
                  ))}
                </select>
                <button className="mt-6 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow">
                  Finalizar levantamiento
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={step === 1}
            className="rounded-full border border-primary/10 px-4 py-2 text-xs font-semibold text-secondary disabled:opacity-40"
          >
            Atrás
          </button>
          <button
            onClick={goNext}
            disabled={step === stepTitles.length}
            className="rounded-full bg-primary px-6 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedScenario ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">Estimación guardada</h3>
                  <p className="text-sm text-secondary">
                    Se registró el escenario seleccionado.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <label className="text-xs font-semibold text-secondary">
                  Asignar seguimiento a empleado
                  <select
                    value={assignedTo}
                    onChange={(event) => setAssignedTo(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  >
                    {architects.map((architect) => (
                      <option key={architect} value={architect}>
                        {architect}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                onClick={() => setSelectedScenario(null)}
                className="mt-6 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow"
              >
                Finalizar levantamiento
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
