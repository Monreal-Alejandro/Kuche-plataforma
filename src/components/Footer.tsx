import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="text-lg font-semibold tracking-[0.35em]">KUCHE</div>
            <p className="text-sm text-gray-400">
              Fusión de arquitectura y robótica
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white">
              Navegación
            </h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/" className="transition hover:text-accent">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className="transition hover:text-accent">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link
                  href="/experiencia"
                  className="transition hover:text-accent"
                >
                  Experiencia
                </Link>
              </li>
              <li>
                <Link href="/acabados" className="transition hover:text-accent">
                  Acabados
                </Link>
              </li>
              <li>
                <Link
                  href="/seguimiento"
                  className="transition hover:text-accent"
                >
                  Seguimiento
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white">
              Showroom
            </h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Calle Industrial 45, CDMX</p>
              <p>+52 55 1234 5678</p>
              <p>hola@kuche.mx</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white">
              Síguenos
            </h3>
            <div className="flex items-center gap-3">
              <Link
                href="https://www.instagram.com"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-gray-400 transition hover:text-accent"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.facebook.com"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-gray-400 transition hover:text-accent"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
            </div>
            <Link
              href="/aviso-de-privacidad"
              className="text-sm text-gray-400 transition hover:text-accent"
            >
              Aviso de Privacidad
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-6 text-sm text-gray-400">
          <span>
            © 2024 KUCHE Cocinas Inteligentes. Todos los derechos reservados.
          </span>
          <Link
            href="/login"
            className="rounded-full border border-white/20 px-3 py-1.5 text-[11px] font-semibold text-white/85 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
          >
            Acceso Administrativo
          </Link>
        </div>
      </div>
    </footer>
  );
}
