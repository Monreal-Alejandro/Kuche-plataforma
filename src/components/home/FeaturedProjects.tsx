"use client";

import Image from "next/image";
import MotionSection from "./MotionSection";

const projects = [
  {
    title: "Cocina Japandi",
    image: "/images/cocina1.jpg",
  },
  {
    title: "Bar en Casa",
    image: "/images/cocina2.jpg",
  },
  {
    title: "Toques de Color",
    image: "/images/cocina3.jpg",
  },
];

export default function FeaturedProjects() {
  return (
    <MotionSection className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold text-accent md:text-4xl">
          Proyectos Destacados
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.title}
              className="group rounded-3xl bg-white shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-2"
            >
              <div className="relative h-56 overflow-hidden rounded-3xl">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.02]"
                  sizes="(min-width: 768px) 320px, 90vw"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-primary">
                  {project.title}
                </h3>
                <a
                  href="/catalogo"
                  className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/10"
                >
                  Ver Catálogo Completo
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
