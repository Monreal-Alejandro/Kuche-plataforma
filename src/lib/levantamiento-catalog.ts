/** Catálogos y tipos para el Levantamiento Detallado (paredes, electrodomésticos, iluminación). */

export type MedidasCampos = {
  ancho: string;
  alto: string;
  fondo: string;
};

export type ItemCatalogo = {
  id: string;
  label: string;
  /** Agrupación visual (p. ej. electrodomésticos según catálogo Excel). */
  categoria?: string;
  hint?: string;
  image: string;
};

export const WALL_ITEMS: ItemCatalogo[] = [
  {
    id: "pared-recta",
    label: "Pared recta (corrida)",
    hint: "Muro principal sin cortes",
    image: "/images/materiales/white_seamless_texture.jpg",
  },
  {
    id: "pared-ventana",
    label: "Pared con ventana",
    hint: "Hueco ventana / vano",
    image: "/images/materiales/white_marble_texture.jpg",
  },
  {
    id: "pared-puerta",
    label: "Pared con puerta",
    hint: "Acceso a otro espacio",
    image: "/images/materiales/walnut_wood_texture.jpg",
  },
  {
    id: "esquina-90",
    label: "Esquina 90°",
    hint: "Encuentro de dos muros",
    image: "/images/materiales/stone_texture.jpg",
  },
  {
    id: "pared-nicho",
    label: "Pared con nicho",
    hint: "Hueco empotrado",
    image: "/images/materiales/smooth_stone.jpg",
  },
  {
    id: "pared-media-altura",
    label: "Pared media altura / barra",
    hint: "Desnivel o antepecho",
    image: "/images/materiales/plywood_texture.jpg",
  },
  {
    id: "pared-divisoria",
    label: "Pared divisoria",
    hint: "Tabique interior",
    image: "/images/materiales/dark_wood_background.jpg",
  },
  {
    id: "falso-muro",
    label: "Falso muro / tabique liviano",
    hint: "Espesor reducido",
    image: "/images/materiales/white_seamless_texture.jpg",
  },
  {
    id: "pared-salientes",
    label: "Pared con salientes (ducto / bajante)",
    hint: "Retrasos o desnivel",
    image: "/images/materiales/terazzo_texture.jpg",
  },
  {
    id: "pared-l",
    label: "Pared en L / retorno",
    hint: "Cambio de eje",
    image: "/images/materiales/quartz_texture.jpg",
  },
];

/**
 * Ruta recomendada para la imagen o diagrama de cada tipo de muro.
 * Coloca en `public/images/levantamiento/paredes/` un archivo con el mismo `id` que en el catálogo, por ejemplo:
 * `pared-recta.jpg`, `pared-ventana.jpg` (formato JPG o cambia la extensión en el código si usas PNG/WebP).
 * Si el archivo no existe, la UI usa la imagen de respaldo definida en cada ítem (`image`).
 */
export function wallTypeImageSrc(id: string, ext: "jpg" | "png" | "webp" = "jpg"): string {
  return `/images/levantamiento/paredes/${id}.${ext}`;
}

/** Lista de ids de pared (útil para la página de referencia y comprobar qué archivos faltan). */
export const WALL_ITEM_IDS = WALL_ITEMS.map((w) => w.id);

/** Páginas 1–3: índices en WALL_ITEMS; página 4 = “Otro”. */
export const WALL_PAGE_INDICES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8, 9],
];

/** Tipos de electrodomésticos (catálogo Excel: microondas, estufas, refrigeradores, parrillas). */
export const APPLIANCE_ITEMS: ItemCatalogo[] = [
  {
    id: "micro-sobremesa",
    categoria: "Microondas",
    label: "De libre instalación (sobremesa)",
    hint: "Se colocan sobre la encimera; fáciles de instalar y transportar.",
    image: "/images/render1.jpg",
  },
  {
    id: "micro-empotrable",
    categoria: "Microondas",
    label: "Empotrables o de integración",
    hint: "Dentro de muebles de cocina; estética limpia y más espacio en encimera.",
    image: "/images/cocina2.jpg",
  },
  {
    id: "micro-campana",
    categoria: "Microondas",
    label: "Con campana extractora",
    hint: "Sobre la estufa; también extraen humo y olores.",
    image: "/images/render3.jpg",
  },
  {
    id: "estufa-gas",
    categoria: "Estufas",
    label: "Estufas de gas (LP o natural)",
    hint: "Tradicionales; buena potencia y horno integrado. Parrillas hierro fundido, encendido electrónico.",
    image: "/images/cocina5.jpg",
  },
  {
    id: "estufa-electrica",
    categoria: "Estufas",
    label: "Estufas eléctricas",
    hint: "Resistencia, vitrocerámica o inducción; sin instalación de gas.",
    image: "/images/cocina6.jpg",
  },
  {
    id: "estufa-piso-material",
    categoria: "Estufas",
    label: "Estufas de piso (diseño y material)",
    hint: "Inox durables; porcelanizadas blanco/negro, resistentes a corrosión.",
    image: "/images/render4.jpg",
  },
  {
    id: "estufa-compacta",
    categoria: "Estufas",
    label: "Estufas compactas o de puesto",
    hint: "Más pequeñas; de uno a cuatro quemadores.",
    image: "/images/render5.jpg",
  },
  {
    id: "refri-top-mount",
    categoria: "Refrigeradores",
    label: "Top mount (congelador superior)",
    hint: "Clásicos; congelador arriba. Suele ser económico y eficiente en espacio.",
    image: "/images/cocina1.jpg",
  },
  {
    id: "refri-bottom-mount",
    categoria: "Refrigeradores",
    label: "Bottom mount (congelador inferior)",
    hint: "Refrigerador a altura de ojos; congelador abajo.",
    image: "/images/cocina2.jpg",
  },
  {
    id: "refri-side-side",
    categoria: "Refrigeradores",
    label: "Side by side (dúplex)",
    hint: "Refrigerador y congelador uno al lado del otro en vertical.",
    image: "/images/render3.jpg",
  },
  {
    id: "refri-french-door",
    categoria: "Refrigeradores",
    label: "French door (puerta francesa)",
    hint: "Dos puertas arriba para refrigerador y cajón abajo para congelador.",
    image: "/images/cocina5.jpg",
  },
  {
    id: "refri-frigobar",
    categoria: "Refrigeradores",
    label: "Frigobar / compactos",
    hint: "Pequeños; oficinas o espacios reducidos.",
    image: "/images/cocina6.jpg",
  },
  {
    id: "parrilla-gas",
    categoria: "Parrillas",
    label: "Parrillas de gas",
    hint: "Muy comunes en México; control fino de flama. Pueden ser empotrables.",
    image: "/images/render4.jpg",
  },
  {
    id: "parrilla-induccion",
    categoria: "Parrillas",
    label: "Parrillas de inducción",
    hint: "Calientan el sartén por campo magnético; rápidas y eficientes. Batería ferromagnética.",
    image: "/images/render5.jpg",
  },
  {
    id: "parrilla-electrica-vitro",
    categoria: "Parrillas",
    label: "Parrillas eléctricas / vitrocerámica",
    hint: "Superficie lisa; resistencias. Ideales sin gas.",
    image: "/images/cocina1.jpg",
  },
  {
    id: "parrilla-mixta",
    categoria: "Parrillas",
    label: "Parrillas mixtas",
    hint: "Combinan gas e inducción u otras zonas.",
    image: "/images/cocina2.jpg",
  },
  {
    id: "parrilla-domino",
    categoria: "Parrillas",
    label: "Parrillas dominó",
    hint: "Módulos pequeños combinables para personalizar la cocción.",
    image: "/images/render3.jpg",
  },
];

/** Pasos 0..length−1 = un electrodoméstico por vista (orden por categoría); último paso = «Otro». */
export const APPLIANCE_STEPS_TOTAL = APPLIANCE_ITEMS.length + 1;

/** Índice del paso «Otro» (después del último ítem del catálogo). */
export const APPLIANCE_OTRO_STEP_INDEX = APPLIANCE_ITEMS.length;

/** Posición dentro de la categoría del ítem en `APPLIANCE_ITEMS[index]` (1-based). */
export function getApplianceCategoryProgress(globalIndex: number): {
  categoria: string;
  indexInCategory: number;
  totalInCategory: number;
} {
  const item = APPLIANCE_ITEMS[globalIndex];
  const cat = item.categoria ?? "Electrodoméstico";
  const totalInCategory = APPLIANCE_ITEMS.filter((x) => x.categoria === cat).length;
  let indexInCategory = 0;
  for (let i = 0; i <= globalIndex; i++) {
    if (APPLIANCE_ITEMS[i].categoria === cat) indexInCategory++;
  }
  return { categoria: cat, indexInCategory, totalInCategory };
}

/** Orden fijo de categorías en el catálogo (misma secuencia que en `APPLIANCE_ITEMS`). */
export const APPLIANCE_CATEGORIAS: readonly string[] = [
  "Microondas",
  "Estufas",
  "Refrigeradores",
  "Parrillas",
];

/** Primer índice en `APPLIANCE_ITEMS` para una categoría (para saltar desde la UI). */
export function applianceFirstIndexForCategory(categoria: string): number {
  const i = APPLIANCE_ITEMS.findIndex((x) => x.categoria === categoria);
  return i === -1 ? 0 : i;
}

export const LIGHTING_ITEMS: ItemCatalogo[] = [
  {
    id: "led-bajo",
    label: "LED bajo alacena",
    image: "/images/render1.jpg",
  },
  {
    id: "spots",
    label: "Spots empotrados techo",
    image: "/images/render3.jpg",
  },
  {
    id: "colgante",
    label: "Colgante isla / mesón",
    image: "/images/render4.jpg",
  },
  {
    id: "perfil-led",
    label: "Perfil LED lineal",
    image: "/images/cocina2.jpg",
  },
  {
    id: "indirecta",
    label: "Luz indirecta / cornisa",
    image: "/images/cocina5.jpg",
  },
  {
    id: "sensor",
    label: "Sensor / LED gabinete interior",
    image: "/images/cocina6.jpg",
  },
  {
    id: "sink",
    label: "Luz focal tarja",
    image: "/images/render5.jpg",
  },
  {
    id: "foco-ajustable",
    label: "Foco ajustable riel",
    image: "/images/cocina1.jpg",
  },
  {
    id: "tira-vitrina",
    label: "Tira LED vitrina",
    image: "/images/render3.jpg",
  },
];

export const LIGHTING_PAGE_INDICES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
];

export type OtroMedidas = MedidasCampos & { descripcion: string };

/** Payload opcional guardado con la cotización preliminar / PDF. */
export type LevantamientoDetalle = {
  sectionComments: Partial<Record<"a" | "b" | "c" | "d" | "e", string>>;
  wallMeasures: Record<string, MedidasCampos>;
  wallOtro: OtroMedidas;
  applianceMeasures: Record<string, MedidasCampos>;
  applianceOtro: OtroMedidas;
  lightingMeasures: Record<string, MedidasCampos>;
  lightingOtro: OtroMedidas;
};

export function emptyOtro(): OtroMedidas {
  return { ...emptyMedidas(), descripcion: "" };
}

export function emptyMedidas(): MedidasCampos {
  return { ancho: "", alto: "", fondo: "" };
}

export function initMeasuresMap(ids: string[]): Record<string, MedidasCampos> {
  const map: Record<string, MedidasCampos> = {};
  ids.forEach((id) => {
    map[id] = emptyMedidas();
  });
  return map;
}

export function defaultLevantamientoDetalle(): LevantamientoDetalle {
  return {
    sectionComments: {},
    wallMeasures: initMeasuresMap(WALL_ITEMS.map((w) => w.id)),
    wallOtro: emptyOtro(),
    applianceMeasures: initMeasuresMap(APPLIANCE_ITEMS.map((a) => a.id)),
    applianceOtro: emptyOtro(),
    lightingMeasures: initMeasuresMap(LIGHTING_ITEMS.map((l) => l.id)),
    lightingOtro: emptyOtro(),
  };
}
