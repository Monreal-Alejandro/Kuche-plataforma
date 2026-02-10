"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

const hardwareCatalog = [
  { id: "correderas", label: "Correderas cierre suave", unitPrice: 500 },
  { id: "bisagras", label: "Bisagras 110° reforzadas", unitPrice: 140 },
  { id: "jaladeras", label: "Jaladeras minimalistas", unitPrice: 90 },
  { id: "bote", label: "Bote de basura extraíble", unitPrice: 1200 },
  { id: "iluminacion", label: "Iluminación LED interior", unitPrice: 780 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);

export default function CotizadorPage() {
  const [client, setClient] = useState("");
  const [projectType, setProjectType] = useState(projectTypes[0]);
  const [location, setLocation] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [largo, setLargo] = useState("4.2");
  const [alto, setAlto] = useState("2.4");
  const [fondo, setFondo] = useState("0.6");
  const [metrosLineales, setMetrosLineales] = useState("6");
  const [materialBase, setMaterialBase] = useState(baseMaterials[0].id);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("materiales");

  const [materialColor, setMaterialColor] = useState(materialColors[0]);
  const [materialThickness, setMaterialThickness] = useState("16");

  const [hardware, setHardware] = useState<Record<string, { enabled: boolean; qty: number }>>(
    () =>
      hardwareCatalog.reduce(
        (acc, item) => {
          acc[item.id] = { enabled: item.id === "correderas", qty: 6 };
          return acc;
        },
        {} as Record<string, { enabled: boolean; qty: number }>,
      ),
  );

  const [labor, setLabor] = useState("12000");
  const [flete, setFlete] = useState("2500");
  const [instalacion, setInstalacion] = useState("4800");
  const [desinstalacion, setDesinstalacion] = useState("0");

  const metrosValue = Number.parseFloat(metrosLineales) || 0;
  const baseMaterial = baseMaterials.find((item) => item.id === materialBase) ?? baseMaterials[0];
  const thicknessFactor = materialThickness === "19" ? 1.08 : 1;

  const materialSubtotal = metrosValue * baseMaterial.pricePerMeter * thicknessFactor;

  const hardwareSubtotal = useMemo(() => {
    return hardwareCatalog.reduce((acc, item) => {
      const selection = hardware[item.id];
      if (!selection?.enabled) {
        return acc;
      }
      return acc + item.unitPrice * Math.max(selection.qty, 0);
    }, 0);
  }, [hardware]);

  const laborSubtotal = (Number.parseFloat(labor) || 0) +
    (Number.parseFloat(flete) || 0) +
    (Number.parseFloat(instalacion) || 0) +
    (Number.parseFloat(desinstalacion) || 0);

  const finalPrice = materialSubtotal + hardwareSubtotal + laborSubtotal;

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
              <button className="rounded-2xl border border-primary/10 px-4 text-xs font-semibold text-secondary">
                Nuevo
              </button>
            </div>
            <datalist id="clientes-sugeridos">
              <option value="Mariana Fuentes" />
              <option value="Arquitectura F4 Studio" />
              <option value="Eduardo Pardo" />
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

      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-secondary">Sección B · Estimación visual</p>
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

      <AnimatePresence initial={false}>
        {selectedScenario ? (
          <motion.section
            key="section-c"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md"
          >
            <div>
              <h2 className="text-2xl font-semibold">Sección C · Refinamiento y especificaciones</h2>
              <p className="mt-2 text-sm text-secondary">
                Ajusta materiales, herrajes y extras. El precio final se actualiza en tiempo real.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { id: "materiales", label: "Materiales" },
                { id: "herrajes", label: "Herrajes y accesorios" },
                { id: "mano", label: "Mano de obra / Extras" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-accent text-white"
                      : "border border-primary/10 bg-white text-secondary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-primary/10 bg-white p-6">
              {activeTab === "materiales" ? (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-secondary">Material base</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        {baseMaterials.map((material) => (
                          <button
                            key={material.id}
                            onClick={() => setMaterialBase(material.id)}
                            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                              materialBase === material.id
                                ? "border-accent bg-accent text-white"
                                : "border-primary/10 bg-white text-primary"
                            }`}
                          >
                            {material.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-secondary">Color y textura</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {materialColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setMaterialColor(color)}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                              materialColor === color
                                ? "border-accent bg-accent text-white"
                                : "border-primary/10 bg-white text-primary"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 rounded-2xl bg-primary/5 p-5">
                    <p className="text-xs font-semibold text-secondary">Grosor de tablero</p>
                    <div className="grid gap-3">
                      {[
                        { id: "16", label: "16 mm · Estándar" },
                        { id: "19", label: "19 mm · Refuerzo" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setMaterialThickness(option.id)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            materialThickness === option.id
                              ? "border-accent bg-accent text-white"
                              : "border-primary/10 bg-white text-primary"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm">
                      <p className="text-xs font-semibold text-secondary">Impacto en materiales</p>
                      <p className="mt-2 text-sm text-primary">
                        {formatCurrency(materialSubtotal)} para {metrosValue} m lineales.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "herrajes" ? (
                <div className="space-y-4">
                  {hardwareCatalog.map((item) => {
                    const selection = hardware[item.id];
                    return (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-white px-4 py-4"
                      >
                        <label className="flex items-center gap-3 text-sm font-semibold">
                          <input
                            type="checkbox"
                            checked={selection?.enabled ?? false}
                            onChange={(event) =>
                              setHardware((prev) => ({
                                ...prev,
                                [item.id]: {
                                  enabled: event.target.checked,
                                  qty: prev[item.id]?.qty ?? 1,
                                },
                              }))
                            }
                            className="h-4 w-4 accent-accent"
                          />
                          {item.label}
                          <span className="text-xs text-secondary">
                            {formatCurrency(item.unitPrice)} c/u
                          </span>
                        </label>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-secondary">Cantidad</span>
                          <input
                            type="number"
                            min="0"
                            value={selection?.qty ?? 0}
                            onChange={(event) =>
                              setHardware((prev) => ({
                                ...prev,
                                [item.id]: {
                                  enabled: prev[item.id]?.enabled ?? false,
                                  qty: Number.parseInt(event.target.value, 10) || 0,
                                },
                              }))
                            }
                            className="w-20 rounded-2xl border border-primary/10 bg-white px-3 py-2 text-sm outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between rounded-2xl bg-primary/5 px-4 py-3 text-sm font-semibold">
                    <span>Total herrajes</span>
                    <span className="text-accent">{formatCurrency(hardwareSubtotal)}</span>
                  </div>
                </div>
              ) : null}

              {activeTab === "mano" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { id: "labor", label: "Mano de obra", value: labor, setValue: setLabor },
                    { id: "flete", label: "Flete", value: flete, setValue: setFlete },
                    { id: "instalacion", label: "Instalación foránea", value: instalacion, setValue: setInstalacion },
                    {
                      id: "desinstalacion",
                      label: "Desinstalación cocina vieja",
                      value: desinstalacion,
                      setValue: setDesinstalacion,
                    },
                  ].map((field) => (
                    <label key={field.id} className="text-xs font-semibold text-secondary">
                      {field.label}
                      <input
                        value={field.value}
                        onChange={(event) => field.setValue(event.target.value)}
                        type="number"
                        min="0"
                        className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
                      />
                    </label>
                  ))}
                  <div className="rounded-2xl bg-primary/5 p-4 text-sm">
                    <p className="text-xs font-semibold text-secondary">Total mano de obra + extras</p>
                    <p className="mt-2 text-lg font-semibold text-accent">{formatCurrency(laborSubtotal)}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <section className="space-y-6 rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-semibold">Sección D · Cierre y documentación</h2>
          <p className="mt-2 text-sm text-secondary">
            Resumen ejecutivo y generación de documentos para cliente y taller.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-primary/10 bg-white">
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
            {[
              { label: "Fabricación y Mano de Obra", value: laborSubtotal },
              { label: "Materiales", value: materialSubtotal },
              { label: "Herrajes", value: hardwareSubtotal },
            ].map((row) => (
              <div key={row.label} className="rounded-2xl bg-primary/5 p-4">
                <p className="text-xs font-semibold text-secondary">{row.label}</p>
                <p className="mt-2 text-lg font-semibold text-primary">{formatCurrency(row.value)}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 px-6 py-4 text-sm">
            <span className="font-semibold text-secondary">Precio final</span>
            <span className="text-xl font-semibold text-accent">{formatCurrency(finalPrice)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-2xl border border-primary/10 bg-white px-5 py-3 text-xs font-semibold text-secondary">
            Guardar borrador
          </button>
          <button className="rounded-2xl bg-primary px-5 py-3 text-xs font-semibold text-white">
            Generar PDF Cliente
          </button>
          <button className="rounded-2xl bg-accent px-5 py-3 text-xs font-semibold text-white">
            Generar Hoja de Taller
          </button>
        </div>
      </section>

      <div className="fixed bottom-6 right-6 z-40 w-[260px] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.25em] text-secondary">Precio final</p>
        <p className="mt-2 text-2xl font-semibold text-accent">{formatCurrency(finalPrice)}</p>
        <p className="mt-2 text-[11px] text-secondary">
          {metrosValue} m lineales · {baseMaterial.label} · {materialColor}
        </p>
      </div>
    </div>
  );
}
