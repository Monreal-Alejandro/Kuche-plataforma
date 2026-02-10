import Image from "next/image";

export default function Hero() {
  return (
    <section className="px-4 pt-10">
      <div className="relative mx-auto min-h-[560px] max-w-6xl overflow-hidden rounded-2xl shadow-xl">
        <Image
          src="/images/cocina1.jpg"
          alt="Cocina contemporánea con luz natural"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute left-6 top-8 max-w-md rounded-2xl bg-white/85 p-6 shadow-lg backdrop-blur md:left-10 md:top-10 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Soft Contemporary
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-primary md:text-5xl">
            Diseño que se siente como hogar
          </h1>
          <p className="mt-4 text-sm text-secondary md:text-base">
            Cocinas pensadas para tu ritmo, con materiales cálidos y detalles
            que invitan a quedarte.
          </p>
          <button
            type="button"
            className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-md"
          >
            Agendar
          </button>
        </div>
      </div>
    </section>
  );
}
