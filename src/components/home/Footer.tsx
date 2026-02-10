"use client";

export default function Footer() {
  return (
    <footer className="bg-black py-12 text-white mx-4 md:mx-6 rounded-3xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-2xl font-semibold">KUCHE</p>
          <p className="mt-2 text-sm text-white/70">
            Diseño inteligente para espacios que inspiran.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <a className="transition hover:text-white/70" href="/catalogo">
            Catálogo
          </a>
          <a className="transition hover:text-white/70" href="#">
            Experiencia
          </a>
          <button className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-black/20">
            Agendar Cita
          </button>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl px-6 text-xs text-white/50">
        Aviso de Privacidad · © 2026 KUCHE
      </div>
    </footer>
  );
}
