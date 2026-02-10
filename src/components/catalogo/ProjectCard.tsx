"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

type Hotspot = {
  id: string;
  label: string;
  top: string;
  left: string;
};

type ProjectImage = {
  src: string;
  alt: string;
  hotspots: Hotspot[];
};

export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  images: ProjectImage[];
};

type ProjectCardProps = {
  project: Project;
};

const pulseTransition = {
  duration: 1.8,
  ease: [0.16, 1, 0.3, 1] as const,
  repeat: Infinity,
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const currentImage = project.images[selectedImageIndex];

  return (
    <article className="grid gap-8 rounded-3xl bg-surface p-6 shadow-xl lg:grid-cols-[3fr_2fr]">
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
          <Image
            src={currentImage.src}
            alt={currentImage.alt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 60vw, 100vw"
          />

          {currentImage.hotspots.map((spot) => {
            const isActive = activeHotspot === spot.id;
            return (
              <div
                key={spot.id}
                className="absolute"
                style={{ top: spot.top, left: spot.left }}
              >
                <button
                  type="button"
                  aria-label={spot.label}
                  onMouseEnter={() => setActiveHotspot(spot.id)}
                  onMouseLeave={() => setActiveHotspot(null)}
                  onClick={() =>
                    setActiveHotspot(isActive ? null : spot.id)
                  }
                  className="relative flex h-4 w-4 items-center justify-center"
                >
                  <motion.span
                    className="absolute h-4 w-4 rounded-full bg-white/70"
                    animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                    transition={pulseTransition}
                  />
                  <span className="relative h-3 w-3 rounded-full bg-white shadow-md" />
                </button>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute left-1/2 top-full z-10 mt-3 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white/85 px-3 py-2 text-xs text-primary shadow-lg backdrop-blur-md"
                    >
                      {spot.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-3">
          {project.images.map((image, index) => {
            const isSelected = index === selectedImageIndex;
            return (
              <button
                key={`${project.id}-${image.src}`}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`relative h-16 w-20 overflow-hidden rounded-2xl border transition ${
                  isSelected
                    ? "border-accent"
                    : "border-transparent hover:border-accent/40"
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {project.category}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-primary">
            {project.title}
          </h3>
          <p className="mt-3 text-sm text-secondary">{project.description}</p>
        </div>

        <button
          type="button"
          className="inline-flex w-fit items-center justify-center rounded-full bg-accent px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5"
        >
          Cotizar un diseño así
        </button>
      </div>
    </article>
  );
}
