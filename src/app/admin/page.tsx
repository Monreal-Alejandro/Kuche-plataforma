export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-500">Resumen ejecutivo del estado operativo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Diseños Pendientes", value: "3" },
          { title: "Trabajos Activos", value: "12" },
          { title: "Citas esta semana", value: "5" },
          { title: "Actualización de Catálogo", value: "Todo al día" },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              {card.title}
            </p>
            <p className="mt-4 text-3xl font-semibold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
