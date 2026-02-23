"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { catalogosApi, cotizacionesApi } from "@/lib/axios";
import type { Material, Herraje } from "@/lib/axios/catalogosApi";

const projectTypes = ["Cocina", "Closet", "vestidor", "Mueble para el baño"];

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
  // Estados para mensajes y carga
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Estados de catálogos desde backend
  const [baseMaterials, setBaseMaterials] = useState<Material[]>([]);
  const [herrajesCatalog, setHerrajesCatalog] = useState<Herraje[]>([]);
  
  const [clients, setClients] = useState([
    { name: "Mariana Fuentes", phone: "", email: "" },
    { name: "Arquitectura F4 Studio", phone: "", email: "" },
    { name: "Eduardo Pardo", phone: "", email: "" },
  ]);
  const [client, setClient] = useState("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [projectType, setProjectType] = useState(projectTypes[0]);
  const [location, setLocation] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [largo, setLargo] = useState("4.2");
  const [alto, setAlto] = useState("2.4");
  const [fondo, setFondo] = useState("0.6");
  const [metrosLineales, setMetrosLineales] = useState("6");
  const [materialBase, setMaterialBase] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("materiales");
  const [materialSearch, setMaterialSearch] = useState("");

  const [materialColor] = useState(materialColors[0]);
  const [materialThickness, setMaterialThickness] = useState("16");
  const [utilidadPct, setUtilidadPct] = useState(30);
  const [fletePct, setFletePct] = useState(2);

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

  // Cargar catálogos desde backend
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [materialesRes, herrajesRes] = await Promise.all([
          catalogosApi.obtenerMateriales(),
          catalogosApi.obtenerHerrajes(),
        ]);

        if (materialesRes.success && materialesRes.data) {
          setBaseMaterials(materialesRes.data);
          if (materialesRes.data.length > 0) {
            setMaterialBase(materialesRes.data[0]._id);
          }
        }

        if (herrajesRes.success && herrajesRes.data) {
          setHerrajesCatalog(herrajesRes.data);
          // Inicializar hardware state con herrajes del backend
          const hardwareInitial: Record<string, { enabled: boolean; qty: number }> = {};
          herrajesRes.data.forEach((herraje) => {
            hardwareInitial[herraje._id] = { enabled: false, qty: 1 };
          });
          setHardware(hardwareInitial);
        }
      } catch (error) {
        console.error("Error cargando catálogos:", error);
        setErrorMessage("Error al cargar catálogos");
      }
    };

    cargarCatalogos();
  }, []);

  const metrosValue = Number.parseFloat(metrosLineales) || 0;
  const baseMaterial = baseMaterials.find((item) => item._id === materialBase) ?? baseMaterials[0];
  const thicknessFactor = materialThickness === "19" ? 1.08 : 1;

  const materialSubtotal = baseMaterial ? metrosValue * baseMaterial.precioMetroLineal * thicknessFactor : 0;

  const hardwareSubtotal = useMemo(() => {
    return herrajesCatalog.reduce((acc, item) => {
      const selection = hardware[item._id];
      if (!selection?.enabled) {
        return acc;
      }
      return acc + item.precioUnitario * Math.max(selection.qty, 0);
    }, 0);
  }, [hardware, herrajesCatalog]);

  const laborSubtotal = (Number.parseFloat(labor) || 0) +
    (Number.parseFloat(flete) || 0) +
    (Number.parseFloat(instalacion) || 0) +
    (Number.parseFloat(desinstalacion) || 0);

  // Cálculos de precio total
  const precioTotalSinIva = materialSubtotal + hardwareSubtotal + laborSubtotal;
  const montoIva = precioTotalSinIva * 0.16;
  const totalNeto = precioTotalSinIva + montoIva;

  const scenarioPrices = scenarioCards.map((scenario) => {
    const base = materialSubtotal * scenario.multiplier;
    return {
      ...scenario,
      min: Math.round(base * 0.95),
      max: Math.round(base * 1.08),
    };
  });

  const handleGuardarBorrador = async () => {
    if (!client || !materialBase) {
      setErrorMessage("Por favor completa los datos del cliente y selecciona un material");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const herrajesSeleccionados = herrajesCatalog
        .filter(item => hardware[item._id]?.enabled)
        .map(item => ({
          herrajeId: item._id,
          nombre: item.nombre,
          precioUnitario: item.precioUnitario,
          enabled: true,
          cantidad: hardware[item._id].qty,
        }));

      const cotizacionData = {
        cliente: client,
        tipoProyecto: projectType as any,
        ubicacion: location,
        fechaInstalacion: installDate || new Date().toISOString().split('T')[0],
        medidas: {
          largo: Number.parseFloat(largo) || 0,
          alto: Number.parseFloat(alto) || 0,
          fondo: Number.parseFloat(fondo) || 0,
          metrosLineales: metrosValue,
        },
        escenarioSeleccionado: selectedScenario as any,
        materialBase: 'melamina' as any, // Valor por defecto, puedes ajustar según el material seleccionado
        colorTextura: materialColor as any,
        grosorTablero: materialThickness as any,
        herrajes: herrajesSeleccionados,
        manoDeObra: Number.parseFloat(labor) || 0,
        flete: Number.parseFloat(flete) || 0,
        instalacion: Number.parseFloat(instalacion) || 0,
        desinstalacion: Number.parseFloat(desinstalacion) || 0,
      };

      const response = await cotizacionesApi.guardarBorrador(cotizacionData);

      if (response.success) {
        setSuccessMessage("¡Cotización guardada como borrador!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(response.message || "Error al guardar borrador");
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Error al guardar cotización");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarPDFCliente = async () => {
    setErrorMessage("Función de generar PDF en desarrollo");
    // TODO: Implementar cuando el backend tenga el endpoint
  };

  const handleGenerarHojaTaller = async () => {
    setErrorMessage("Función de hoja de taller en desarrollo");
    // TODO: Implementar cuando el backend tenga el endpoint
  };

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
              <button
                type="button"
                onClick={() => {
                  setNewClientName("");
                  setNewClientPhone("");
                  setNewClientEmail("");
                  setIsClientModalOpen(true);
                }}
                className="rounded-2xl border border-primary/10 px-4 text-xs font-semibold text-secondary"
              >
                Nuevo
              </button>
            </div>
            <datalist id="clientes-sugeridos">
              {clients.map((entry) => (
                <option key={entry.name} value={entry.name} />
              ))}
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
                  Base: {formatCurrency(materialSubtotal)} · {baseMaterial?.nombre || "Sin material"}
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
                { id: "herrajes", label: "Herrajes" },
                { id: "mano", label: "Mano de obra" },
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
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {baseMaterials.map((material) => (
                          <button
                            key={material._id}
                            onClick={() => setMaterialBase(material._id)}
                            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                              materialBase === material._id
                                ? "border-accent bg-accent text-white"
                                : "border-primary/10 bg-white text-primary"
                            }`}
                          >
                            <div>{material.nombre}</div>
                            <div className="text-xs opacity-80">
                              {formatCurrency(material.precioMetroLineal)}/m
                            </div>
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
                  {herrajesCatalog.map((item) => {
                    const selection = hardware[item._id];
                    return (
                      <div
                        key={item._id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-white px-4 py-4"
                      >
                        <label className="flex items-center gap-3 text-sm font-semibold">
                          <input
                            type="checkbox"
                            checked={selection?.enabled ?? false}
                            onChange={(event) =>
                              setHardware((prev) => ({
                                ...prev,
                                [item._id]: {
                                  enabled: event.target.checked,
                                  qty: prev[item._id]?.qty ?? 1,
                                },
                              }))
                            }
                            className="h-4 w-4 accent-accent"
                          />
                          {item.nombre}
                          <span className="text-xs text-secondary">
                            {formatCurrency(item.precioUnitario)} c/u
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
                                [item._id]: {
                                  enabled: prev[item._id]?.enabled ?? false,
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

        <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-8 shadow-lg">
          <div className="flex items-center justify-between text-gray-600">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-semibold">{formatCurrency(precioTotalSinIva)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-gray-500">
            <span className="text-sm font-semibold">IVA (16%)</span>
            <span className="text-sm font-semibold">{formatCurrency(montoIva)}</span>
          </div>
          <hr className="my-4 border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">Total Neto</span>
            <span className="text-3xl font-bold text-[#8B1C1C]">
              {formatCurrency(totalNeto)}
            </span>
          </div>
        </div>

        {successMessage && (
          <div className="rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-600">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errorMessage}
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleGuardarBorrador}
            disabled={loading}
            className="rounded-2xl border border-primary/10 bg-white px-5 py-3 text-xs font-semibold text-secondary hover:bg-primary/5 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar borrador"}
          </button>
          <button 
            onClick={handleGenerarPDFCliente}
            className="rounded-2xl bg-primary px-5 py-3 text-xs font-semibold text-white hover:bg-primary/90"
          >
            Generar PDF Cliente
          </button>
          <button 
            onClick={handleGenerarHojaTaller}
            className="rounded-2xl bg-accent px-5 py-3 text-xs font-semibold text-white hover:bg-accent/90"
          >
            Generar Hoja de Taller
          </button>
        </div>
      </section>

      <div className="fixed bottom-6 right-6 z-40 w-[260px] rounded-3xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.25em] text-secondary">Total Neto</p>
        <p className="mt-2 text-2xl font-semibold text-accent">{formatCurrency(totalNeto)}</p>
        <p className="mt-2 text-[11px] text-secondary">
          {metrosValue} m lineales · {baseMaterial?.nombre || "Material"} · {materialColor}
        </p>
      </div>
    </div>
  );
}
