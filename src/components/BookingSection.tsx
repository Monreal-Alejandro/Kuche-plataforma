export default function BookingSection() {
  return (
    <section id="agendar-cita" className="bg-background px-4 pb-20">
      <div className="mx-auto grid min-h-[520px] max-w-6xl grid-cols-1 gap-10 rounded-2xl bg-surface p-8 shadow-xl md:grid-cols-2 md:p-12">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              Agenda tu cita
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-primary md:text-3xl">
              Elige el día perfecto
            </h3>
          </div>
          <div className="grid grid-cols-7 gap-3 text-center text-sm text-secondary">
            {Array.from({ length: 30 }).map((_, index) => {
              const day = index + 1;
              const isSelected = day === 16;
              return (
                <div
                  key={`day-${day}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isSelected ? "bg-accent text-white" : "bg-transparent"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <div className="grid gap-4">
            <label className="text-sm font-medium text-secondary">
              Nombre
              <input
                type="text"
                className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-primary focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </label>
            <label className="text-sm font-medium text-secondary">
              Teléfono
              <input
                type="tel"
                className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-primary focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </label>
          </div>

          <div className="space-y-3 text-sm font-medium text-secondary">
            Ubicación
            <div className="flex rounded-full border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                className="flex-1 rounded-full bg-white px-4 py-2 text-primary shadow-sm"
              >
                Durango
              </button>
              <button
                type="button"
                className="flex-1 rounded-full px-4 py-2 text-secondary"
              >
                Foráneo
              </button>
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-md"
          >
            Agendar Cita
          </button>
        </div>
      </div>
    </section>
  );
}
