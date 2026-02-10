"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Hammer, Pencil, Users } from "lucide-react";

const galleryItems = [
  { id: "g1", image: "/images/render1.jpg", title: "Cocina Andrómeda" },
  { id: "g2", image: "/images/render2.jpg", title: "Cocina Nébula" },
  { id: "g3", image: "/images/render3.jpg", title: "Cocina Aurora" },
];

const teamMembers = [
  { id: "e1", name: "Valeria", role: "Diseño" },
  { id: "e2", name: "Carlos", role: "Producción" },
  { id: "e3", name: "Majo", role: "Ventas" },
  { id: "e4", name: "Luis", role: "Instalación" },
];

const busyDays = new Set([2, 6, 8, 12, 15, 18, 22, 26, 29]);

export default function AdminDashboard() {
  const [granite, setGranite] = useState("2300");
  const [wood, setWood] = useState("1800");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const calendarDays = useMemo(() => Array.from({ length: 30 }, (_, index) => index + 1), []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-secondary">Dashboard Admin</p>
        <h1 className="mt-2 text-3xl font-semibold">Control total de KUCHE</h1>
        <p className="mt-2 text-sm text-secondary">
          Ajusta precios, valida diseños y coordina al equipo con visión clara.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 auto-rows-[180px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="row-span-2 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Control de dinero</p>
              <h2 className="mt-2 text-xl font-semibold">Precios rápidos</h2>
            </div>
            <Hammer className="h-5 w-5 text-accent" />
          </div>

          <div className="mt-6 space-y-4">
            <label className="block text-xs font-semibold text-secondary">
              Granito (m2)
              <input
                value={granite}
                onChange={(event) => setGranite(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
            <label className="block text-xs font-semibold text-secondary">
              Madera (m2)
              <input
                value={wood}
                onChange={(event) => setWood(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none"
              />
            </label>
            <button className="w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110">
              Actualizar
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="col-span-1 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Control de calidad</p>
              <h2 className="mt-2 text-xl font-semibold">Diseños pendientes</h2>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="relative h-24 overflow-hidden rounded-2xl border border-white/60"
              >
                <Image src={item.image} alt={item.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute bottom-2 left-2 text-xs text-white">{item.title}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="rounded-2xl bg-emerald-500 py-2 text-xs font-semibold text-white shadow">
              Aprobar
            </button>
            <button className="rounded-2xl bg-accent py-2 text-xs font-semibold text-white shadow">
              Corregir
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="row-span-2 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Recursos humanos</p>
              <h2 className="mt-2 text-xl font-semibold">Equipo activo</h2>
            </div>
            <Users className="h-5 w-5 text-accent" />
          </div>

          <div className="mt-5 space-y-3">
            {teamMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-primary/10 bg-white px-4 py-3 text-left text-sm transition hover:border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                    {member.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-xs text-secondary">{member.role}</p>
                  </div>
                </div>
                <span className="text-xs text-secondary">Asignar</span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="col-span-1 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">Agenda</p>
              <h2 className="mt-2 text-xl font-semibold">Citas del mes</h2>
            </div>
            <Pencil className="h-5 w-5 text-accent" />
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs">
            {calendarDays.map((day) => (
              <div
                key={day}
                className={`rounded-xl px-2 py-2 ${
                  busyDays.has(day) ? "bg-accent text-white" : "bg-primary/5 text-secondary"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedMember ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl backdrop-blur-md"
            >
              <h3 className="text-lg font-semibold">Asignar pendiente</h3>
              <p className="mt-2 text-sm text-secondary">
                Selecciona un pendiente para el integrante del equipo.
              </p>
              <div className="mt-4 space-y-3">
                {[
                  "Revisar mediciones de cliente Torreón",
                  "Definir acabados para cocina Stellar",
                  "Confirmar entrega de herrajes",
                ].map((task) => (
                  <button
                    key={task}
                    className="w-full rounded-2xl border border-primary/10 bg-white px-4 py-3 text-left text-sm hover:border-primary/20"
                  >
                    {task}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="mt-6 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
