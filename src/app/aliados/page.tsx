"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Footer from "@/components/Footer";
import { useEscapeClose } from "@/hooks/useEscapeClose";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const partnerLogos = [
  {
    name: "Arauco",
    src: "/images/aliados/Arauco.png",
    description:
      "Madera y tableros de alto estándar para mobiliario y arquitectura, con cadenas de abastecimiento sostenible y un amplio catálogo de soluciones para cocinas y espacios residenciales.",
  },
  {
    name: "Bloom",
    src: "/images/aliados/bloom.png",
    description:
      "Soluciones de componentes y sistemas que elevan el confort, la estética y el rendimiento de los detalles en cocina y equipamiento a medida.",
  },
  {
    name: "Arcadia",
    src: "/images/aliados/Arcadia.png",
    description:
      "Proveedor alineado con proyectos que buscan un equilibrio entre funcionalidad, calidad de acabado y acompañamiento en especificación técnica.",
  },
  {
    name: "Navetta",
    src: "/images/aliados/navetta.png",
    description:
      "Aliado con enfoque en desempeño y afinidad con procesos de fabricación y montaje, apoyando la continuidad de estándar en cocinas Kuche.",
  },
  {
    name: "Madelam",
    src: "/images/aliados/Mademel.png",
    description:
      "Canales y referencias de material que fortalecen la oferta de frentes, texturas o sistemas vinculados a la madera y sus aplicaciones en cocina.",
  },
  {
    name: "Rehau",
    src: "/images/aliados/rehau.png",
    description:
      "Rehau aporta componentes técnicos y perfiles con ingeniería europea, reconocida en impermeabilidad, estanqueidad y larga vida en uso.",
  },
  {
    name: "Cubrica",
    src: "/images/aliados/cubrica.png",
    description:
      "Integración con soluciones de almacenaje, cajonaje o canceles -segun su linea asociada- que suman versatilidad a los proyectos de cocina a medida.",
  },
  {
    name: "Hettich",
    src: "/images/aliados/hettich.svg",
    description:
      "Hettich: herrajes, correderas, bisagras y sistemas de cajonaje de origen aleman, con tecnologia fiable, amplia gama y respaldo global en el mueble.",
  },
];

export default function AliadosPage() {
  const [activePartner, setActivePartner] = useState<(typeof partnerLogos)[number] | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEscapeClose(Boolean(activePartner), () => setActivePartner(null));
  useFocusTrap(Boolean(activePartner), modalRef);

  return (
    <main className="bg-background">
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Aliados</p>
            <h1 className="mt-3 text-2xl font-semibold text-primary md:text-4xl">Aliados</h1>
            <p className="mt-2 text-sm text-secondary md:text-base">
              Socios y proveedores con los que sostenemos calidad, especificacion y cierre de proyecto.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {partnerLogos.map((logo) => (
              <button
                key={logo.name}
                type="button"
                onClick={() => setActivePartner(logo)}
                className="flex h-24 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    unoptimized
                    className="object-contain"
                    sizes="(min-width: 768px) 160px, 45vw"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {activePartner && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePartner(null)}
          >
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              className="relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl"
              initial={{ y: 30, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActivePartner(null)}
                className="absolute right-6 top-6 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary transition hover:border-primary/40 hover:text-primary"
              >
                Cerrar
              </button>
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-16 w-40 items-center justify-start">
                  <Image
                    src={activePartner.src}
                    alt={activePartner.name}
                    width={160}
                    height={64}
                    unoptimized
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
                    Aliado
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-primary md:text-3xl">
                    {activePartner.name}
                  </h3>
                </div>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-secondary md:text-base">
                {activePartner.description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
