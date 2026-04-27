"use client";

import MotionSection from "./MotionSection";
import ProjectCard from "./ProjectCard";

const projects = [
  {
    title: "Proyecto Residencial Navarro",
    description: "Cocina luminosa con madera natural y diseño funcional.",
    images: [
      "/images/home/proyecto-destacado-1/01-hero-tarjeta-proyecto.jpg",
      "/images/home/proyecto-destacado-1/02-vista-proyecto-navarro.jpg",
      "/images/home/proyecto-destacado-1/plano-plantilla.svg",
      "/images/home/proyecto-destacado-1/04-detalle-cocina.jpg",
    ],
  },
  {
    title: "Proyecto Loft Reforma",
    description: "Isla central protagonista y herrajes premium integrados.",
    images: [
      "/images/home/proyecto-destacado-2/01-vista-proyecto-loft.jpg",
      "/images/home/proyecto-destacado-2/plano-plantilla.svg",
      "/images/home/proyecto-destacado-2/03-interior-proyecto-loft.jpg",
      "/images/home/proyecto-destacado-2/04-detalle-cocina.jpg",
    ],
  },
  {
    title: "Proyecto Casa Bruma",
    description: "Paleta neutra con toques de color y textura elegante.",
    images: [
      "/images/home/proyecto-destacado-3/01-vista-proyecto-bruma.jpg",
      "/images/home/proyecto-destacado-3/plano-plantilla.svg",
      "/images/home/proyecto-destacado-3/03-detalle-cocina.jpg",
      "/images/home/proyecto-destacado-3/04-isla-proyecto-bruma.jpg",
    ],
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
            <ProjectCard
              key={project.title}
              title={project.title}
              description={project.description}
              images={project.images}
            />
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
