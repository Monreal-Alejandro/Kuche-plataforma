import Image from "next/image";

const catalogItems = [
  { title: "Luz Serena", location: "Durango" },
  { title: "Mármol Calmo", location: "Torreón" },
  { title: "Textura Norte", location: "Gómez" },
  { title: "Hogar Claro", location: "Durango" },
  { title: "Noche Suave", location: "Chihuahua" },
  { title: "Madera Viva", location: "Saltillo" },
];

export default function CatalogSection() {
  return (
    <section id="catalogo" className="bg-background px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Catálogo
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-primary md:text-4xl">
            Proyectos que inspiran
          </h2>
          <p className="mt-2 text-sm text-secondary md:text-base">
            Una galería con cocinas reales, cálidas y llenas de detalle.
          </p>
        </div>

        <div className="columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
          {catalogItems.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-2xl bg-surface shadow-lg"
            >
              <div className="relative h-64 w-full">
                <Image
                  src="/images/cocina1.jpg"
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="p-5">
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-white/80">{item.location}</p>
                  <button
                    type="button"
                    className="mt-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-primary">
                  {item.title}
                </p>
                <p className="text-xs text-secondary">{item.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
