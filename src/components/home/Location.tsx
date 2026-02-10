"use client";

import MotionSection from "./MotionSection";

export default function Location() {
  return (
    <MotionSection className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-3xl font-semibold text-primary md:text-4xl">
          Ubicación
        </h2>
        <div className="mt-10 overflow-hidden rounded-3xl border-4 border-white shadow-xl shadow-black/10">
          <iframe
            title="Mapa de KUCHE"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3763.132675190443!2d-99.1652804!3d19.4260861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDI1JzM0LjAiTiA5OcKwMDknNTUuMCJX!5e0!3m2!1ses-419!2smx!4v1700000000000"
            className="h-[420px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </MotionSection>
  );
}
