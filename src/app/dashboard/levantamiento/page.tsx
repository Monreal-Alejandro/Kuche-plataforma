"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import {
  catalogosApi,
  levantamientosApi,
  usuariosApi,
  type LevantamientoCreate,
  type Usuario,
} from "@/lib/axios";

const stepTitles = ["Cliente", "Geometria", "Necesidades", "Escenarios", "Cierre"];
const basePrice = 5000;

const materialFactors: Record<LevantamientoCreate["tipoCubierta"], number> = {
  "Granito Básico": 1,
  Cuarzo: 1.2,
  "Piedra Sinterizada": 1.5,
};

const normalizeTipoCubierta = (
  value: string,
): LevantamientoCreate["tipoCubierta"] | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "granito basico" || normalized === "granito básico") return "Granito Básico";
  if (normalized === "cuarzo") return "Cuarzo";
  if (normalized === "piedra sinterizada") return "Piedra Sinterizada";
  return null;
};

const scenarios: Array<{
  id: LevantamientoCreate["escenarioSeleccionado"];
  title: string;
  subtitle: string;
  multiplier: number;
  items: string[];
  style: string;
}> = [
  {
    id: "esencial",
    title: "Estilo esencial",
    subtitle: "Melaminas",
    multiplier: 0.9,
    items: ["Melamina premium", "Herrajes estandar", "Cubierta basica"],
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
    items: ["Laca o madera natural", "Iluminacion integrada", "Hardware premium"],
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
  const [client, setClient] = useState({ nombre: "", direccion: "", telefono: "" });
  const [metros, setMetros] = useState("6");
  const [isla, setIsla] = useState(false);
  const [alacenas, setAlacenas] = useState(false);
  const [material, setMaterial] = useState<LevantamientoCreate["tipoCubierta"]>("Granito Básico");
  const [selectedScenario, setSelectedScenario] =
    useState<LevantamientoCreate["escenarioSeleccionado"] | null>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [empleados, setEmpleados] = useState<Usuario[]>([]);
  const [tiposCubierta, setTiposCubierta] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [empleadosRes, tiposRes] = await Promise.all([
          usuariosApi.listarEmpleados(),
          catalogosApi.obtenerTiposCubierta(),
        ]);

        if (empleadosRes.success && Array.isArray(empleadosRes.data)) {
          setEmpleados(empleadosRes.data);
          if (empleadosRes.data[0]?._id) setAssignedTo(empleadosRes.data[0]._id);
        }

        if (tiposRes.success && Array.isArray(tiposRes.data) && tiposRes.data.length > 0) {
          setTiposCubierta(tiposRes.data);
          const normalizedFirst = normalizeTipoCubierta(tiposRes.data[0]);
          if (normalizedFirst) setMaterial(normalizedFirst);
        }
      } catch {
        // no-op
      }
    })();
  }, []);

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

  const handleFinalizar = async () => {
    if (!selectedScenario) {
      setErrorMessage("Selecciona un escenario para continuar.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await levantamientosApi.crearLevantamiento({
        cliente: client,
        metrosLineales: metrosNumber,
        requiereIsla: isla,
        alacenasAltas: alacenas,
        tipoCubierta: material,
        escenarioSeleccionado: selectedScenario,
        empleadoAsignado: assignedTo || undefined,
      });

      if (!response.success) {
        setErrorMessage(response.message || "No se pudo guardar el levantamiento.");
        return;
      }

      setSuccessMessage("Levantamiento guardado correctamente.");
      setStep(1);
      setClient({ nombre: "", direccion: "", telefono: "" });
      setMetros("6");
      setIsla(false);
      setAlacenas(false);
      setSelectedScenario(null);
    } catch {
      setErrorMessage("Error al guardar el levantamiento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Levantamiento</p>
          <h1 className="mt-2 text-3xl font-semibold">Nuevo levantamiento</h1>
          <p className="mt-2 text-sm text-secondary">Estimacion rapida basada en metros y material.</p>
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
        {step === 1 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Paso 1 · Cliente</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {(["nombre", "direccion", "telefono"] as const).map((field) => (
                <label key={field} className="text-xs font-semibold text-secondary">
                  {field}
                  <input
                    value={client[field]}
                    onChange={(event) => setClient((prev) => ({ ...prev, [field]: event.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Paso 2 · Geometria</h2>
            <label className="block text-xs font-semibold text-secondary">
              Metros lineales
              <input
                value={metros}
                onChange={(event) => setMetros(event.target.value)}
                type="number"
                min="0"
                className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Paso 3 · Necesidades</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { id: "isla", label: "Requiere isla", value: isla, setValue: setIsla },
                { id: "alacenas", label: "Alacenas hasta techo", value: alacenas, setValue: setAlacenas },
              ].map((toggle) => (
                <button
                  key={toggle.id}
                  type="button"
                  onClick={() => toggle.setValue(!toggle.value)}
                  className={`flex items-center justify-between rounded-3xl border px-6 py-4 text-left text-sm font-semibold transition ${
                    toggle.value
                      ? "border-accent bg-accent text-white"
                      : "border-primary/10 bg-white text-primary hover:border-primary/30"
                  }`}
                >
                  {toggle.label}
                  <span className="text-xs">{toggle.value ? "Si" : "No"}</span>
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Tipo de cubierta</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {tiposCubierta.map((option) => {
                  const normalizedOption = normalizeTipoCubierta(option);
                  if (!normalizedOption) return null;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMaterial(normalizedOption)}
                      className={`rounded-3xl border px-4 py-4 text-sm font-semibold transition ${
                        material === normalizedOption
                          ? "border-accent bg-accent text-white"
                          : "border-primary/10 bg-white text-primary hover:border-primary/30"
                      }`}
                    >
                      {normalizedOption}
                    </button>
                  );
                })}
                {tiposCubierta.length === 0 ? (
                  <p className="text-sm text-secondary">Cargando tipos de cubierta desde catalogo...</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Paso 4 · Escenarios</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              {prices.map((scenario) => (
                <div key={scenario.id} className={`rounded-3xl p-6 shadow-lg ${scenario.style}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-secondary">{scenario.title}</p>
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
                    type="button"
                    onClick={() => {
                      setSelectedScenario(scenario.id);
                      setStep(5);
                    }}
                    className="mt-6 w-full rounded-2xl bg-primary py-3 text-xs font-semibold text-white"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Paso 5 · Cierre</h2>
            <div className="rounded-3xl border border-primary/10 bg-white p-6">
              <label className="block text-sm font-semibold text-primary">
                Asignar seguimiento
                <select
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                >
                  {empleados.map((empleado) => (
                    <option key={empleado._id} value={empleado._id}>
                      {empleado.nombre}
                    </option>
                  ))}
                </select>
              </label>

              {successMessage ? (
                <div className="mt-4 rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              ) : null}
              {errorMessage ? (
                <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleFinalizar}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Finalizar levantamiento"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="rounded-full border border-primary/10 px-4 py-2 text-xs font-semibold text-secondary disabled:opacity-40"
          >
            Atras
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={step === stepTitles.length}
            className="rounded-full bg-primary px-6 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
