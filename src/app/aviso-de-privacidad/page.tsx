import Footer from "@/components/Footer";

export default function AvisoDePrivacidadPage() {
  return (
    <main className="min-h-screen bg-background text-primary">
      <section className="px-4 pb-16 pt-16 md:pt-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Aviso de Privacidad
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-primary md:text-5xl">
            Protegemos tu información
          </h1>
          <p className="mt-6 text-sm leading-relaxed text-secondary md:text-base">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
            consequat, erat a ultrices tincidunt, sapien nulla feugiat urna, et
            luctus lectus purus sit amet magna. Praesent id dui nec lorem
            condimentum facilisis. Nullam a nisl sit amet risus vulputate
            laoreet. Aliquam erat volutpat. Duis sagittis, lacus et viverra
            elementum, est neque convallis est, sit amet suscipit lacus justo
            nec justo.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-secondary md:text-base">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
            pretium, risus vel luctus pellentesque, tellus sapien volutpat
            magna, at dignissim lorem sapien sed erat. Curabitur non velit sed
            augue dignissim tempus. Donec pretium, urna ac posuere elementum,
            nulla nisi malesuada est, non tincidunt urna sem sed nisi.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-secondary md:text-base">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
            tristique, mauris id tristique consequat, lectus justo facilisis
            orci, vel suscipit massa ipsum sed augue. Integer vulputate, lectus
            in tristique aliquet, nisi lacus dictum justo, et dictum massa urna
            a nibh.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
