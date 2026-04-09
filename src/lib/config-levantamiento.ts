export const LEVANTAMIENTO_CONFIG_STORAGE_KEY = "kuche.config.levantamiento.v2";

export type MaterialCategoria = "cubierta" | "frente" | "herraje";
export type MaterialGama = "Estandar" | "Tendencia" | "Premium";

export interface MaterialConfig {
  id: string;
  nombre: string;
  categoria: MaterialCategoria;
  gama: MaterialGama;
  precioPorMetro: number;
}

export interface LevantamientoConfig {
  scenarioPrices: { esencial: number; tendencia: number; premium: number };
  materiales: MaterialConfig[];
  ivaPercent: number;
  marginPercent: number;
}

function defaultMateriales(): MaterialConfig[] {
  return [
    { id: "cub-est-1", nombre: "Laminado Blanco Nieve", categoria: "cubierta", gama: "Estandar", precioPorMetro: 1800 },
    { id: "cub-est-2", nombre: "Granito San Gabriel", categoria: "cubierta", gama: "Estandar", precioPorMetro: 2200 },
    { id: "cub-tend-1", nombre: "Cuarzo Clasico", categoria: "cubierta", gama: "Tendencia", precioPorMetro: 3400 },
    { id: "cub-tend-2", nombre: "Porcelanico Terrazzo", categoria: "cubierta", gama: "Tendencia", precioPorMetro: 3600 },
    { id: "cub-prem-1", nombre: "Marmol Calacatta", categoria: "cubierta", gama: "Premium", precioPorMetro: 5200 },
    { id: "cub-prem-2", nombre: "Piedra sinterizada XL", categoria: "cubierta", gama: "Premium", precioPorMetro: 5800 },
    { id: "fre-est-1", nombre: "Melamina blanca", categoria: "frente", gama: "Estandar", precioPorMetro: 950 },
    { id: "fre-est-2", nombre: "MDF hidrofugo", categoria: "frente", gama: "Estandar", precioPorMetro: 1100 },
    { id: "fre-tend-1", nombre: "Laca semimate", categoria: "frente", gama: "Tendencia", precioPorMetro: 2100 },
    { id: "fre-tend-2", nombre: "Chapa nogal", categoria: "frente", gama: "Tendencia", precioPorMetro: 1950 },
    { id: "fre-prem-1", nombre: "Laca alto brillo", categoria: "frente", gama: "Premium", precioPorMetro: 3600 },
    { id: "fre-prem-2", nombre: "Madera maciza", categoria: "frente", gama: "Premium", precioPorMetro: 3400 },
    { id: "her-est-1", nombre: "Bisagra estandar", categoria: "herraje", gama: "Estandar", precioPorMetro: 750 },
    { id: "her-est-2", nombre: "Corredera basica", categoria: "herraje", gama: "Estandar", precioPorMetro: 850 },
    { id: "her-tend-1", nombre: "Soft-close", categoria: "herraje", gama: "Tendencia", precioPorMetro: 1550 },
    { id: "her-tend-2", nombre: "Push to open", categoria: "herraje", gama: "Tendencia", precioPorMetro: 1450 },
    { id: "her-prem-1", nombre: "Servo drive", categoria: "herraje", gama: "Premium", precioPorMetro: 2600 },
    { id: "her-prem-2", nombre: "Guias ocultas premium", categoria: "herraje", gama: "Premium", precioPorMetro: 2400 },
  ];
}

export function createDefaultLevantamientoConfig(): LevantamientoConfig {
  return {
    scenarioPrices: { esencial: 5000, tendencia: 10000, premium: 15000 },
    materiales: defaultMateriales(),
    ivaPercent: 0.16,
    marginPercent: 0.08,
  };
}

export function getLevantamientoConfig(): LevantamientoConfig {
  return createDefaultLevantamientoConfig();
}

export function getAveragePriceByTier(
  materiales: MaterialConfig[],
  categoria: MaterialCategoria,
  gama: MaterialGama,
): number {
  const list = materiales.filter((m) => m.categoria === categoria && m.gama === gama);
  if (list.length === 0) return 0;
  const sum = list.reduce((acc, m) => acc + (Number.isFinite(m.precioPorMetro) ? m.precioPorMetro : 0), 0);
  return sum / list.length;
}