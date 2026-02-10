"use client";

import { useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useScroll,
  useTransform,
} from "framer-motion";

type ExperienceStep = {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  glow: string;
};

const experienceSteps: ExperienceStep[] = [
  {
    id: "agenda",
    title: "Agenda tu Cita",
    description: "El primer paso a la cocina ideal. Visita técnica a domicilio.",
    image: "/images/cocina1.jpg",
    tags: ["Agenda", "Visita técnica", "Brief"],
    glow: "rgba(139, 28, 28, 0.2)",
  },
  {
    id: "diseno",
    title: "Diseño y Cotización",
    description: "Co-creación personalizada. Tú decides materiales y acabados. Precio exacto al momento.",
    image: "/images/render1.jpg",
    tags: ["Plano", "Materiales", "Costo exacto"],
    glow: "rgba(60, 64, 70, 0.18)",
  },
  {
    id: "vr",
    title: "Realidad Virtual (VR)",
    description: "No imagines, vívelo. Camina dentro de tu cocina antes de fabricarla.",
    image: "/images/render2.jpg",
    tags: ["VR", "Recorrido 1:1", "Inmersivo"],
    glow: "rgba(73, 123, 255, 0.25)",
  },
  {
    id: "cnc",
    title: "Cortes Precisos (CNC)",
    description: "Ingeniería robótica. Cortes milimétricos perfectos sin margen de error humano.",
    image: "/images/cocina10.jpg",
    tags: ["CNC", "Precisión", "Robótica"],
    glow: "rgba(139, 28, 28, 0.35)",
  },
  {
    id: "instalacion",
    title: "Instalación y Entrega",
    description: "Montaje limpio, rápido y garantía de satisfacción total.",
    image: "/images/cocina12.jpg",
    tags: ["Entrega", "Garantía", "Detalle"],
    glow: "rgba(96, 95, 93, 0.2)",
  },
];

function CardStack({
  steps,
  activeIndex,
}: {
  steps: ExperienceStep[];
  activeIndex: number;
}) {
  const stackRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const smoothX = useSpring(rotateX, { stiffness: 120, damping: 18 });
  const smoothY = useSpring(rotateY, { stiffness: 120, damping: 18 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = stackRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const rotateMax = 6;
    const nextRotateX = ((y - centerY) / centerY) * -rotateMax;
    const nextRotateY = ((x - centerX) / centerX) * rotateMax;
    rotateX.set(nextRotateX);
    rotateY.set(nextRotateY);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div className="relative w-full" style={{ perspective: "1400px" }}>
      <motion.div
        ref={stackRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: smoothX,
          rotateY: smoothY,
          transformStyle: "preserve-3d",
          transformPerspective: 1400,
        }}
        className="relative h-[520px] w-full max-w-xl rounded-3xl bg-white/40"
      >
        {steps.map((step, index) => {
          const distance = index - activeIndex;
          const depth = Math.min(Math.abs(distance), 3);
          const isActive = distance === 0;
          const z = isActive ? 120 : -depth * 60;
          const y = distance * 26;
          const scale = isActive ? 1 : 0.94 - depth * 0.02;
          const opacity = isActive ? 1 : 0.45;
          const rotateZ = distance * 2;
          return (
            <motion.div
              key={step.id}
              animate={{
                opacity,
                scale,
                y,
                z,
                rotateZ,
              }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d", zIndex: 10 - depth }}
            >
              <div
                className="relative h-full w-full overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-2xl backdrop-blur-xl"
                style={{ boxShadow: `0 40px 120px ${step.glow}` }}
              >
                <div className="absolute -inset-6 rounded-[32px] bg-white/25 blur-3xl" />
                <img
                  src={step.image}
                  alt={step.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                  {step.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-secondary shadow"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-6 text-white">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                    Experiencia Kuche
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-white/80">{step.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function Experience3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const [activeIndex, setActiveIndex] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const stepIndex = Math.min(
      experienceSteps.length - 1,
      Math.floor(latest * experienceSteps.length),
    );
    setActiveIndex(stepIndex);
  });

  const activeStep = useMemo(() => experienceSteps[activeIndex], [activeIndex]);

  return (
    <section id="experiencia" className="relative bg-background px-4 py-24">
      <div ref={sectionRef} className="relative h-[300vh]">
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[0.45fr_0.55fr]">
              <div className="relative flex min-h-[420px] items-center">
                <div className="absolute left-0 top-0 hidden h-full w-[2px] bg-primary/10 md:block">
                  <motion.div
                    className="w-full bg-accent"
                    style={{ height: progressHeight }}
                  />
                </div>
                <div className="space-y-6 pl-0 md:pl-10">
                  <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                    Experiencia 3D
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -24 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="space-y-4"
                    >
                      <h2 className="text-3xl font-semibold text-primary md:text-4xl">
                        {activeStep.title}
                      </h2>
                      <p className="text-base text-secondary md:text-lg">
                        {activeStep.description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <CardStack steps={experienceSteps} activeIndex={activeIndex} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
