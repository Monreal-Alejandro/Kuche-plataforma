"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";

import {
  CATEGORIAS_CATALOGO,
  SECCIONES_MATERIALES,
  UNIDADES_MEDIDA,
  actualizarHerraje,
  actualizarMaterial,
  crearHerraje,
  crearMaterial,
  eliminarHerraje,
  eliminarMaterial,
  obtenerHerrajes,
  obtenerMateriales,
  type CategoriaCatalogo,
  type Herraje,
  type Material,
  type SeccionMaterial,
  type UnidadMedida,
} from "@/lib/axios/catalogosApi";
import { useFocusTrap } from "@/hooks/useFocusTrap";

type CatalogItem = {
  _id: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: UnidadMedida;
  categoria: CategoriaCatalogo;
  seccion?: SeccionMaterial;
  proveedor?: string;
  idCotizador?: string;
  disponible: boolean;
  precioUnitario?: number;
  precioPorMetro?: number;
  kind: "material" | "herraje";
};

const toNumberOrUndefined = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const extractList = <T,>(input: unknown, keys: string[]): T[] => {
  if (Array.isArray(input)) return input as T[];
  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    for (const key of keys) {
      const value = record[key];
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
};

const safeId = (item: Record<string, unknown>) => {
  const id = item._id ?? item.id ?? item.idCotizador;
  return typeof id === "string" && id.trim().length > 0 ? id : `tmp-${Math.random().toString(36).slice(2, 10)}`;
};

const safeNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
};

const formatApiErrorMessage = (
  response: { message?: string; errors?: Array<{ field?: string; message?: string }> },
  fallback: string,
) => {
  const baseMessage = response.message || fallback;
  if (!Array.isArray(response.errors) || response.errors.length === 0) return baseMessage;
  return `${baseMessage}. ${response.errors
    .map((item) => (item.field ? `${item.field}: ${item.message || "Error"}` : item.message || "Error"))
    .join(" | ")}`;
};

const mapMaterial = (item: Material): CatalogItem => {
  const raw = item as unknown as Record<string, unknown>;
  return {
    _id: safeId(raw),
    nombre: (typeof raw.nombre === "string" ? raw.nombre : "") || "Sin nombre",
    descripcion: typeof raw.descripcion === "string" ? raw.descripcion : undefined,
    unidadMedida: (raw.unidadMedida as UnidadMedida) ?? "m",
    categoria: (raw.categoria as CategoriaCatalogo) ?? "Madera",
    seccion: raw.seccion as SeccionMaterial | undefined,
    proveedor: typeof raw.proveedor === "string" ? raw.proveedor : undefined,
    idCotizador: typeof raw.idCotizador === "string" ? raw.idCotizador : undefined,
    disponible: typeof raw.disponible === "boolean" ? raw.disponible : true,
    precioUnitario: safeNumber(raw.precioUnitario, raw.precio, raw.precioMetroLineal),
    precioPorMetro: safeNumber(raw.precioPorMetro),
    kind: "material",
  };
};

const mapHerraje = (item: Herraje): CatalogItem => {
  const raw = item as unknown as Record<string, unknown>;
  return {
    _id: safeId(raw),
    nombre: (typeof raw.nombre === "string" ? raw.nombre : "") || "Sin nombre",
    descripcion: typeof raw.descripcion === "string" ? raw.descripcion : undefined,
    unidadMedida: (raw.unidadMedida as UnidadMedida) ?? "unidad",
    categoria: (raw.categoria as CategoriaCatalogo) ?? "Herrajes",
    seccion: raw.seccion as SeccionMaterial | undefined,
    proveedor: typeof raw.proveedor === "string" ? raw.proveedor : undefined,
    idCotizador: typeof raw.idCotizador === "string" ? raw.idCotizador : undefined,
    disponible: typeof raw.disponible === "boolean" ? raw.disponible : true,
    precioUnitario: safeNumber(raw.precioUnitario, raw.precio, raw.precioMetroLineal),
    precioPorMetro: safeNumber(raw.precioPorMetro),
    kind: "herraje",
  };
};

const buildItemKey = (item: Pick<CatalogItem, "kind" | "_id">) => `${item.kind}:${item._id}`;

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export default function PreciosPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKind, setNewKind] = useState<"material" | "herraje">("material");
  const [newNombre, setNewNombre] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newUnidad, setNewUnidad] = useState<UnidadMedida>("m");
  const [newCategoria, setNewCategoria] = useState<CategoriaCatalogo>("Madera");
  const [newSeccion, setNewSeccion] = useState<SeccionMaterial | "">("");
  const [newProveedor, setNewProveedor] = useState("");
  const [newIdCotizador, setNewIdCotizador] = useState("");
  const [newPrecioUnitario, setNewPrecioUnitario] = useState("");
  const [newPrecioPorMetro, setNewPrecioPorMetro] = useState("");
  const [newDisponible, setNewDisponible] = useState(true);
  const [addError, setAddError] = useState("");

  const modalRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(isAddModalOpen, modalRef);

  useEffect(() => {
    if (newKind === "herraje") {
      setNewCategoria("Herrajes");
      setNewUnidad("unidad");
      setNewSeccion("");
    }
  }, [newKind]);

  useEffect(() => {
    if (!isAddModalOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAddModalOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isAddModalOpen]);

  const loadCatalogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [materialesResponse, herrajesResponse] = await Promise.all([obtenerMateriales(), obtenerHerrajes()]);
      const nextItems: CatalogItem[] = [];
      if (materialesResponse.success && materialesResponse.data) {
        const materialesList = extractList<Material>(materialesResponse.data, ["materiales", "items", "data", "results"]);
        nextItems.push(...materialesList.map(mapMaterial));
      }
      if (herrajesResponse.success && herrajesResponse.data) {
        const herrajesList = extractList<Herraje>(herrajesResponse.data, ["herrajes", "items", "data", "results"]);
        nextItems.push(...herrajesList.map(mapHerraje));
      }
      if (!materialesResponse.success && !herrajesResponse.success) {
        setError(materialesResponse.message || herrajesResponse.message || "No se pudo cargar el catálogo");
      }

      const dedupedItemsMap = new Map<string, CatalogItem>();
      for (const item of nextItems) {
        const itemKey = buildItemKey(item);
        if (!dedupedItemsMap.has(itemKey)) dedupedItemsMap.set(itemKey, item);
      }

      setItems(Array.from(dedupedItemsMap.values()));
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo cargar el catálogo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalogs();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set<string>(["Todas"]);
    for (const item of items) unique.add(item.categoria);
    return Array.from(unique);
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = selectedCategory === "Todas" || item.categoria === selectedCategory;
      const matchesQuery =
        !normalizedQuery ||
        item.nombre.toLowerCase().includes(normalizedQuery) ||
        (item.idCotizador || "").toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [items, searchQuery, selectedCategory]);

  const validatePrice = (precioUnitario?: number, precioPorMetro?: number) => {
    if (typeof precioUnitario !== "number" && typeof precioPorMetro !== "number") {
      return "Debes capturar precio unitario o precio por metro.";
    }
    if (
      (typeof precioUnitario === "number" && precioUnitario < 0) ||
      (typeof precioPorMetro === "number" && precioPorMetro < 0)
    ) {
      return "Los precios deben ser mayores o iguales a 0.";
    }
    return null;
  };

  const handleSaveItem = async (item: CatalogItem) => {
    const priceError = validatePrice(item.precioUnitario, item.precioPorMetro);
    if (priceError) {
      setError(priceError);
      return;
    }

    setSavingId(buildItemKey(item));
    try {
      const commonPayload = {
        nombre: item.nombre.trim(),
        descripcion: item.descripcion?.trim() || undefined,
        proveedor: item.proveedor?.trim() || undefined,
        idCotizador: item.idCotizador?.trim() || undefined,
        disponible: item.disponible,
        precioUnitario: item.precioUnitario,
        precioPorMetro: item.precioPorMetro,
      };

      const response =
        item.kind === "material"
          ? await actualizarMaterial(item._id, {
              ...commonPayload,
              unidadMedida: item.unidadMedida,
              categoria: item.categoria,
              seccion: item.seccion,
            })
          : await actualizarHerraje(item._id, {
              ...commonPayload,
              unidadMedida: "unidad",
              categoria: "Herrajes",
            });

      if (!response.success) {
        throw new Error(formatApiErrorMessage(response as any, "No se pudo guardar el elemento"));
      }
      await loadCatalogs();
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo guardar el elemento");
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteItem = async (item: CatalogItem) => {
    setSavingId(buildItemKey(item));
    try {
      const response = item.kind === "material" ? await eliminarMaterial(item._id) : await eliminarHerraje(item._id);
      if (!response.success) {
        throw new Error(formatApiErrorMessage(response as any, "No se pudo eliminar el elemento"));
      }
      await loadCatalogs();
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No se pudo eliminar el elemento");
    } finally {
      setSavingId(null);
    }
  };

  const resetCreateForm = () => {
    setNewKind("material");
    setNewNombre("");
    setNewDescripcion("");
    setNewUnidad("m");
    setNewCategoria("Madera");
    setNewSeccion("");
    setNewProveedor("");
    setNewIdCotizador("");
    setNewPrecioUnitario("");
    setNewPrecioPorMetro("");
    setNewDisponible(true);
    setAddError("");
  };

  const handleCreateItem = async () => {
    const nombre = newNombre.trim();
    const precioUnitario = toNumberOrUndefined(newPrecioUnitario);
    const precioPorMetro = toNumberOrUndefined(newPrecioPorMetro);

    if (!nombre) {
      setAddError("El nombre es requerido.");
      return;
    }

    const priceError = validatePrice(precioUnitario, precioPorMetro);
    if (priceError) {
      setAddError(priceError);
      return;
    }

    setSavingId("create");
    try {
      const commonPayload = {
        nombre,
        descripcion: newDescripcion.trim() || undefined,
        proveedor: newProveedor.trim() || undefined,
        idCotizador: newIdCotizador.trim() || undefined,
        precioUnitario,
        precioPorMetro,
        disponible: newDisponible,
      };

      const response =
        newKind === "material"
          ? await crearMaterial({
              ...commonPayload,
              unidadMedida: newUnidad,
              categoria: newCategoria,
              seccion: newSeccion || undefined,
            })
          : await crearHerraje({
              ...commonPayload,
              unidadMedida: "unidad",
              categoria: "Herrajes",
            });

      if (!response.success) {
        throw new Error(formatApiErrorMessage(response as any, "No se pudo crear el elemento"));
      }

      setIsAddModalOpen(false);
      resetCreateForm();
      await loadCatalogs();
    } catch (currentError) {
      setAddError(currentError instanceof Error ? currentError.message : "No se pudo crear el elemento");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo y Precios</h1>
         
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadCatalogs()}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" />
            Recargar
          </button>
          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
            Nuevo material
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative flex w-full max-w-md items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar material..."
            className="w-full bg-transparent text-sm text-gray-700 outline-none"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm outline-none"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white p-1 shadow-sm">
        <div className="grid grid-cols-[2fr_1fr_0.7fr_0.9fr_0.8fr_0.9fr] gap-2 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          <span>Material</span>
          <span>Categoría</span>
          <span>Unidad</span>
          <span className="text-right">Precio unitario</span>
          <span className="text-center">Disponible</span>
          <span className="text-right">Acciones</span>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">Cargando catálogo...</div>
          ) : filteredItems.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-500">No hay materiales que coincidan con los filtros.</div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={buildItemKey(item)}
                className="grid grid-cols-[2fr_1fr_0.7fr_0.9fr_0.8fr_0.9fr] items-center gap-2 px-6 py-4"
              >
                <div>
                  <input
                    value={item.nombre}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row) =>
                          buildItemKey(row) === buildItemKey(item) ? { ...row, nombre: event.target.value } : row,
                        ),
                      )
                    }
                    className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none"
                  />
                  <p className="text-xs text-gray-400">{item.idCotizador || item._id}</p>
                </div>
                <span className="w-fit rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{item.categoria}</span>
                <span className="text-sm text-gray-600">{item.unidadMedida}</span>
                <div className="text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.precioUnitario ?? ""}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row) =>
                          buildItemKey(row) === buildItemKey(item)
                            ? { ...row, precioUnitario: toNumberOrUndefined(event.target.value) }
                            : row,
                        ),
                      )
                    }
                    className="w-24 justify-self-end border-b border-transparent bg-transparent text-right text-sm font-semibold text-gray-900 transition-colors hover:border-gray-300 focus:border-[#8B1C1C] focus:outline-none"
                  />
                  <p className="text-xs text-gray-400">{currencyFormatter.format(item.precioUnitario ?? 0)}</p>
                </div>
                <div className="text-center">
                  <input
                    type="checkbox"
                    checked={item.disponible}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row) =>
                          buildItemKey(row) === buildItemKey(item) ? { ...row, disponible: event.target.checked } : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveItem(item)}
                    disabled={savingId === buildItemKey(item)}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#8B1C1C] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteItem(item)}
                    disabled={savingId === buildItemKey(item)}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div
            ref={modalRef}
            tabIndex={-1}
            className="w-full max-w-3xl rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Agregar nuevo material</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500"
              >
                Cerrar
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-gray-500">
                Tipo
                <select
                  value={newKind}
                  onChange={(event) => setNewKind(event.target.value as "material" | "herraje")}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                >
                  <option value="material">Material</option>
                  <option value="herraje">Herraje</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Nombre
                <input
                  value={newNombre}
                  onChange={(event) => setNewNombre(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>

              <label className="text-xs font-semibold text-gray-500">
                idCotizador
                <input
                  value={newIdCotizador}
                  onChange={(event) => setNewIdCotizador(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Proveedor
                <input
                  value={newProveedor}
                  onChange={(event) => setNewProveedor(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>

              <label className="text-xs font-semibold text-gray-500">
                Unidad
                <select
                  value={newUnidad}
                  disabled={newKind === "herraje"}
                  onChange={(event) => setNewUnidad(event.target.value as UnidadMedida)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100"
                >
                  {UNIDADES_MEDIDA.map((unidad) => (
                    <option key={unidad} value={unidad}>
                      {unidad}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Categoría
                <select
                  value={newCategoria}
                  disabled={newKind === "herraje"}
                  onChange={(event) => setNewCategoria(event.target.value as CategoriaCatalogo)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100"
                >
                  {CATEGORIAS_CATALOGO.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-gray-500">
                Sección
                <select
                  value={newSeccion}
                  disabled={newKind === "herraje"}
                  onChange={(event) => setNewSeccion(event.target.value as SeccionMaterial | "")}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none disabled:bg-gray-100"
                >
                  <option value="">Sin sección</option>
                  {SECCIONES_MATERIALES.map((seccion) => (
                    <option key={seccion} value={seccion}>
                      {seccion}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Disponible
                <div className="mt-3">
                  <input type="checkbox" checked={newDisponible} onChange={(event) => setNewDisponible(event.target.checked)} />
                </div>
              </label>

              <label className="text-xs font-semibold text-gray-500">
                Precio unitario
                <input
                  value={newPrecioUnitario}
                  onChange={(event) => setNewPrecioUnitario(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-gray-500">
                Precio por metro
                <input
                  value={newPrecioPorMetro}
                  onChange={(event) => setNewPrecioPorMetro(event.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>

              <label className="text-xs font-semibold text-gray-500 sm:col-span-2">
                Descripción
                <textarea
                  value={newDescripcion}
                  onChange={(event) => setNewDescripcion(event.target.value)}
                  className="mt-2 min-h-[90px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                />
              </label>
            </div>
            {addError ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
                {addError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleCreateItem()}
                disabled={savingId === "create"}
                className="rounded-2xl bg-[#8B1C1C] px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                Guardar material
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
