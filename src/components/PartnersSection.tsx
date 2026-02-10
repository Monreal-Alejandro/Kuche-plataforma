const partners = ["Blum", "Egger", "Häfele", "Smeg", "Finsa"];
const materials = [
  "Granito",
  "Madera",
  "Mármol",
  "Nogal",
  "Lino",
  "Piedra",
];

export default function PartnersSection() {
  return (
    <section id="acabados" className="bg-background px-4 py-20">
      <div className="mx-auto max-w-6xl space-y-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Respaldados por los mejores
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-primary md:text-4xl">
            Partners que elevan cada detalle
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {partners.map((partner) => (
            <div
              key={partner}
              className="flex h-20 items-center justify-center rounded-2xl bg-surface text-sm font-semibold text-secondary shadow-md grayscale opacity-50 transition hover:opacity-100"
            >
              {partner}
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Materiales
          </p>
          <h3 className="mt-3 text-xl font-semibold text-primary md:text-3xl">
            Acabados con sensación artesanal
          </h3>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {materials.map((material) => (
              <div
                key={material}
                className="flex flex-col items-center gap-3"
              >
                <div className="h-20 w-20 rounded-xl bg-gray-200 shadow-inner" />
                <span className="text-xs font-medium text-secondary">
                  {material}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
