"use client";

import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden rounded-3xl mx-4 md:mx-6">
      <div className="absolute inset-0 bg-[url('/images/cocina1.jpg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-10 flex min-h-[90vh] items-center justify-center px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl rounded-3xl bg-white/90 p-8 shadow-lg shadow-black/10 backdrop-blur-md md:p-12"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
            KUCHE · Diseño de Cocinas Inteligentes
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-primary md:text-5xl">
            Diseño Inteligente
          </h1>
          <p className="mt-4 text-base leading-relaxed text-secondary md:text-lg">
            Arquitectura, tecnología CNC y precisión artesanal para cocinas
            contemporáneas que se sienten humanas, cálidas y hechas a medida.
          </p>
          <button className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:scale-[1.01]">
            Cotizar Ahora
          </button>
        </motion.div>
      </div>

      <a
        href="https://wa.me/5210000000000"
        aria-label="WhatsApp KUCHE"
        className="fixed bottom-6 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/10 transition hover:scale-105"
      >
        <FaWhatsapp className="h-6 w-6" />
      </a>
    </section>
  );
}
