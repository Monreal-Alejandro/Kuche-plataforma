"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Footer from "@/components/home/Footer";

const categories = ["Granitos", "Maderas", "Melaminas", "Colores"] as const;
type Category = (typeof categories)[number];

const materialGallery: Record<
  Category,
  { name: string; image: string }[]
> = {
  Granitos: [
    { name: "Neblina Gris", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Arena Suave", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Grafito Claro", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Marfil Pulido", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Basalto Satinado", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Pizarra Natural", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Gris Niebla", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Azul Hielo", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Ceniza Volcanica", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Sombra Grafito", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Perla Clara", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Arena Bruma", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Terra Suave", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Lava Mate", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Gris Silver", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Blanco Polar", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Bruma Azul", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Sal Nieve", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Humo Claro", image: "/images/acabados/granito-placeholder.svg" },
    { name: "Canto Piedra", image: "/images/acabados/granito-placeholder.svg" },
  ],
  Maderas: [
    { name: "Roble Nordico", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Nogal Tostado", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Olmo Natural", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Cedro Claro", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Fresno Humo", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Teca Arena", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Abedul Suave", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Maple Claro", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Haya Miel", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Cerezo Satin", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Nogal Tierra", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Alamo Natural", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Pino Bruma", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Roble Gris", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Encino Claro", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Eucalipto Mate", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Cedro Dorado", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Nogal Urbano", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Olivo Suave", image: "/images/acabados/madera-placeholder.svg" },
    { name: "Roble Tostado", image: "/images/acabados/madera-placeholder.svg" },
  ],
  Melaminas: [
    { name: "Lino Perla", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Piedra Mate", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Ceniza Sutil", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Trigo Satinado", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Nieve Texturizada", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Gris Urbano", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Beige Arena", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Blanco Algodon", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Marfil Nube", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Piedra Humo", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Lino Natural", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Tierra Suave", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Cemento Claro", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Ceniza Mate", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Gris Perla", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Arena Gris", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Duna Clara", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Hielo Suave", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Piedra Polar", image: "/images/acabados/melamina-placeholder.svg" },
    { name: "Grafito Mate", image: "/images/acabados/melamina-placeholder.svg" },
  ],
  Colores: [
    { name: "Guinda Profundo", image: "/images/acabados/color-placeholder.svg" },
    { name: "Verde Salvia", image: "/images/acabados/color-placeholder.svg" },
    { name: "Azul Plomo", image: "/images/acabados/color-placeholder.svg" },
    { name: "Arena Clara", image: "/images/acabados/color-placeholder.svg" },
    { name: "Gris Perla", image: "/images/acabados/color-placeholder.svg" },
    { name: "Azul Humo", image: "/images/acabados/color-placeholder.svg" },
    { name: "Ocre Suave", image: "/images/acabados/color-placeholder.svg" },
    { name: "Terracota", image: "/images/acabados/color-placeholder.svg" },
    { name: "Grafito", image: "/images/acabados/color-placeholder.svg" },
    { name: "Negro Mate", image: "/images/acabados/color-placeholder.svg" },
    { name: "Blanco Roto", image: "/images/acabados/color-placeholder.svg" },
    { name: "Marfil Suave", image: "/images/acabados/color-placeholder.svg" },
    { name: "Azul Noche", image: "/images/acabados/color-placeholder.svg" },
    { name: "Verde Oliva", image: "/images/acabados/color-placeholder.svg" },
    { name: "Rojo Vino", image: "/images/acabados/color-placeholder.svg" },
    { name: "Beige Calido", image: "/images/acabados/color-placeholder.svg" },
    { name: "Gris Humo", image: "/images/acabados/color-placeholder.svg" },
    { name: "Azul Acero", image: "/images/acabados/color-placeholder.svg" },
    { name: "Verde Niebla", image: "/images/acabados/color-placeholder.svg" },
    { name: "Lavanda Suave", image: "/images/acabados/color-placeholder.svg" },
  ],
};

const partnerLogos = [
  { name: "Hettich", src: "/images/aliados/hettich.svg" },
  { name: "Eclipse Stainless", src: "/images/aliados/eclipse-stainless.svg" },
  { name: "Miele", src: "/images/aliados/miele.svg" },
  { name: "Schock", src: "/images/aliados/schock.svg" },
];

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

export default function AcabadosPage() {
  const [activeCategory, setActiveCategory] =
    useState<Category>("Granitos");

  const activeMaterials = useMemo(
    () => materialGallery[activeCategory],
    [activeCategory],
  );

  return (
    <main className="bg-background">
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Aliados Tecnológicos
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-primary md:text-4xl">
              Aliados Tecnológicos
            </h1>
            <p className="mt-2 text-sm text-secondary md:text-base">
              Ingeniería alemana y austriaca en cada componente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {partnerLogos.map((logo) => (
              <div
                key={logo.name}
                className="flex h-24 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition duration-300 hover:shadow-md"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    className="object-contain"
                    sizes="(min-width: 768px) 160px, 45vw"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Acabados
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-primary md:text-4xl">
              Tu Paleta de Materiales
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((category) => {
              const isActive = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    isActive
                      ? "bg-accent text-white shadow-md shadow-accent/30"
                      : "bg-surface text-secondary hover:text-primary"
                  }`}
                  aria-pressed={isActive}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4"
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {activeMaterials.map((material, index) => (
                <motion.div
                  key={`${activeCategory}-${material.name}`}
                  variants={fadeInUp}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.04,
                    ease: "easeOut",
                  }}
                  className="group rounded-2xl bg-surface p-3 shadow-lg"
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="relative aspect-square w-full">
                      <Image
                        src={material.image}
                        alt={material.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute left-3 top-3 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold text-primary shadow-md backdrop-blur">
                      {material.name}
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium text-secondary">
                    {material.name}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </main>
  );
}
