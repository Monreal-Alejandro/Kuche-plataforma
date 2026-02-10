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
    { name: "Neblina Gris", image: "/images/cocina1.jpg" },
    { name: "Arena Suave", image: "/images/cocina2.jpg" },
    { name: "Grafito Claro", image: "/images/cocina3.jpg" },
    { name: "Marfil Pulido", image: "/images/cocina8.jpg" },
    { name: "Basalto Satinado", image: "/images/cocina5.jpg" },
  ],
  Maderas: [
    { name: "Roble Nórdico", image: "/images/cocina6.jpg" },
    { name: "Nogal Tostado", image: "/images/cocina7.jpg" },
    { name: "Olmo Natural", image: "/images/cocina8.jpg" },
    { name: "Cedro Claro", image: "/images/cocina9.jpg" },
    { name: "Fresno Humo", image: "/images/cocina10.jpg" },
  ],
  Melaminas: [
    { name: "Lino Perla", image: "/images/cocina11.jpg" },
    { name: "Piedra Mate", image: "/images/cocina12.jpg" },
    { name: "Ceniza Sutil", image: "/images/render1.jpg" },
    { name: "Trigo Satinado", image: "/images/render2.jpg" },
    { name: "Nieve Texturizada", image: "/images/render3.jpg" },
  ],
  Colores: [
    { name: "Guinda Profundo", image: "/images/render4.jpg" },
    { name: "Verde Salvia", image: "/images/render5.jpg" },
    { name: "Azul Plomo", image: "/images/render6.jpg" },
    { name: "Arena Clara", image: "/images/cocina37.jpg" },
    { name: "Gris Perla", image: "/images/cocina2.jpg" },
  ],
};

const partnerLogos = ["Hettich", "Blum", "Arauco", "Miele"];

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

          <div className="flex flex-wrap items-center justify-center gap-4">
            {partnerLogos.map((logo) => (
              <div
                key={logo}
                className="group flex h-16 min-w-[140px] items-center justify-center rounded-3xl bg-surface px-6 shadow-lg grayscale opacity-50 transition duration-300 hover:scale-110 hover:opacity-100 hover:grayscale-0"
              >
                <span className="text-sm font-semibold tracking-wide text-secondary transition group-hover:text-primary">
                  {logo}
                </span>
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
