"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import CatalogFilters from "@/components/catalogo/CatalogFilters";
import ProjectCard, { type Project } from "@/components/catalogo/ProjectCard";
import Footer from "@/components/home/Footer";

const categories = ["Todos", "Minimalista", "Con Isla", "Clásico"];

const projects: Project[] = [
  {
    id: "terra-minimal",
    title: "Terra Clara",
    description:
      "Líneas limpias, luz suave y materiales cálidos para una cocina minimalista que se siente viva.",
    category: "Minimalista",
    images: [
      {
        src: "/images/cocina10.jpg",
        alt: "Cocina Terra Clara en tonos cálidos",
        hotspots: [
          {
            id: "encimera-granito",
            label: "Encimera de Granito San Gabriel",
            top: "30%",
            left: "40%",
          },
          {
            id: "lamparas-ambientales",
            label: "Luminarias colgantes en latón",
            top: "20%",
            left: "62%",
          },
          {
            id: "alacenas-blancas",
            label: "Alacenas blancas satinadas",
            top: "46%",
            left: "72%",
          },
        ],
      },
      {
        src: "/images/render1.jpg",
        alt: "Render de isla minimalista",
        hotspots: [
          {
            id: "isla-compacta",
            label: "Isla compacta con borde redondeado",
            top: "58%",
            left: "48%",
          },
          {
            id: "pisos-madera",
            label: "Pisos de madera natural",
            top: "78%",
            left: "28%",
          },
        ],
      },
      {
        src: "/images/render2.jpg",
        alt: "Render de detalles minimalistas",
        hotspots: [
          {
            id: "paleta-neutra",
            label: "Paleta neutra con textura mate",
            top: "46%",
            left: "52%",
          },
        ],
      },
    ],
  },
  {
    id: "isla-lumina",
    title: "Lúmina Central",
    description:
      "Una isla protagonista que invita a reunirse, con acabados pulidos y acentos guinda sutiles.",
    category: "Con Isla",
    images: [
      {
        src: "/images/cocina7.jpg",
        alt: "Cocina con isla central protagonista",
        hotspots: [
          {
            id: "isla-cuarsita",
            label: "Isla de cuarsita blanca",
            top: "58%",
            left: "46%",
          },
          {
            id: "barra-vinos",
            label: "Barra inferior para vinos",
            top: "66%",
            left: "70%",
          },
          {
            id: "alacena-nogal",
            label: "Alacenas de nogal",
            top: "42%",
            left: "22%",
          },
        ],
      },
      {
        src: "/images/render3.jpg",
        alt: "Render de vista lateral de la isla",
        hotspots: [
          {
            id: "campana-oculta",
            label: "Campana oculta integrada",
            top: "24%",
            left: "60%",
          },
          {
            id: "iluminacion-led",
            label: "Iluminación LED perimetral",
            top: "54%",
            left: "74%",
          },
        ],
      },
      {
        src: "/images/cocina11.jpg",
        alt: "Ángulo alterno de la isla central",
        hotspots: [
          {
            id: "textura-marfil",
            label: "Textura marfil de alto tráfico",
            top: "50%",
            left: "40%",
          },
        ],
      },
    ],
  },
  {
    id: "clasico-atelier",
    title: "Atelier Clásico",
    description:
      "Detalles atemporales, molduras finas y una distribución pensada para cocinar en calma.",
    category: "Clásico",
    images: [
      {
        src: "/images/cocina12.jpg",
        alt: "Cocina clásica con molduras suaves",
        hotspots: [
          {
            id: "molduras-suaves",
            label: "Molduras suaves en puertas",
            top: "36%",
            left: "64%",
          },
          {
            id: "griferia-dorada",
            label: "Grifería dorada cepillada",
            top: "58%",
            left: "42%",
          },
          {
            id: "encimera-marmol",
            label: "Encimera de mármol Carrara",
            top: "62%",
            left: "28%",
          },
        ],
      },
      {
        src: "/images/render4.jpg",
        alt: "Render de detalle clásico",
        hotspots: [
          {
            id: "banquetas-tela",
            label: "Banquetas en tela bouclé",
            top: "74%",
            left: "54%",
          },
          {
            id: "vitrina-cristal",
            label: "Vitrinas con vidrio esmerilado",
            top: "40%",
            left: "26%",
          },
        ],
      },
      {
        src: "/images/render5.jpg",
        alt: "Render de materiales clásicos",
        hotspots: [
          {
            id: "paleta-tostada",
            label: "Paleta tostada con acentos guinda",
            top: "46%",
            left: "52%",
          },
        ],
      },
    ],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
};

export default function CatalogoPage() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "Todos") return projects;
    return projects.filter((project) => project.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-background text-primary">
      <section className="px-4 pb-16 pt-16 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              Catálogo
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-primary md:text-5xl">
              Nuestros Proyectos
            </h1>
            <p className="mt-3 text-sm text-secondary md:text-base">
              Diseños que equilibran funcionalidad, calma visual y detalles de
              autor.
            </p>
          </div>

          <div className="mt-8">
            <CatalogFilters
              categories={categories}
              activeCategory={activeCategory}
              onChange={setActiveCategory}
            />
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                {...fadeUp}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </main>
  );
}
