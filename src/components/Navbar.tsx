import Link from "next/link";
import { Menu } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-4 z-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between rounded-full border border-gray-200 bg-white/80 px-6 shadow-lg backdrop-blur">
          <Link href="/" className="text-sm font-semibold tracking-wide text-primary">
            KUCHE
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="#experiencia" className="text-sm font-medium text-secondary">
              Experiencia
            </Link>
            <Link href="/catalogo" className="text-sm font-medium text-secondary">
              Catálogo
            </Link>
            <Link href="/seguimiento" className="text-sm font-medium text-secondary">
              Seguimiento
            </Link>
            <Link href="/acabados" className="text-sm font-medium text-secondary">
              Acabados
            </Link>
            <Link
              href="/agendar"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow"
            >
              Agendar
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-primary/20 px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:border-primary/40 hover:bg-white"
            >
              Acceso Partners
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center md:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5 text-primary" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
