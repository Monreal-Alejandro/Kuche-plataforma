"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const inspirations = [
  { title: "Luz Serena", tag: "Minimal cálido" },
  { title: "Madera Nube", tag: "Natural" },
  { title: "Granito Aura", tag: "Elegante" },
  { title: "Blanco Mate", tag: "Contemporáneo" },
  { title: "Noche Suave", tag: "Sofisticado" },
  { title: "Textura Terra", tag: "Orgánico" },
  { title: "Lino Urbano", tag: "Moderno" },
];

export default function Timeline() {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState(0);

  useEffect(() => {
    const updateDragWidth = () => {
      if (!constraintsRef.current) return;
      const { scrollWidth, clientWidth } = constraintsRef.current;
      setDragWidth(Math.max(0, scrollWidth - clientWidth));
    };

    updateDragWidth();
    window.addEventListener("resize", updateDragWidth);
    return () => window.removeEventListener("resize", updateDragWidth);
  }, []);

  return (
    <section id="catalogo" className="bg-background px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Best Sellers
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-primary md:text-4xl">
            Inspiración que se ve y se siente bien
          </h2>
          <p className="mt-2 text-sm text-secondary md:text-base">
            Desliza para descubrir cocinas con carácter suave y elegante.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden" ref={constraintsRef}>
        <motion.div
          className="flex cursor-grab gap-6 px-4 pb-6 md:px-10"
          drag="x"
          dragConstraints={{ left: -dragWidth, right: 0 }}
          dragElastic={0.08}
          whileTap={{ cursor: "grabbing" }}
        >
          {inspirations.map((item) => (
            <div
              key={item.title}
              className="group min-w-[240px] overflow-hidden rounded-2xl bg-surface shadow-lg transition-transform duration-300 hover:scale-105"
            >
              <div className="relative h-44 w-full">
                <Image
                  src="/images/cocina.jpg"
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-1 p-4">
                <p className="text-sm font-semibold text-primary">{item.title}</p>
                <p className="text-xs text-secondary">{item.tag}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
