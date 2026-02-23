"use client";

import { useState } from "react";
import { Cita } from "@/lib/axios/citasApi";
import CitaCard from "./CitaCard";

interface KanbanBoardProps {
  programadas: Cita[];
  enProceso: Cita[];
  completadas: Cita[];
  onCitaClick: (cita: Cita) => void;
  onMoverCita: (citaId: string, nuevoEstado: 'programada' | 'en_proceso' | 'completada') => void;
}

export default function KanbanBoard({
  programadas,
  enProceso,
  completadas,
  onCitaClick,
  onMoverCita
}: KanbanBoardProps) {
  const [draggedCita, setDraggedCita] = useState<string | null>(null);

  const handleDragStart = (citaId: string) => {
    setDraggedCita(citaId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, nuevoEstado: 'programada' | 'en_proceso' | 'completada') => {
    e.preventDefault();
    if (draggedCita) {
      onMoverCita(draggedCita, nuevoEstado);
      setDraggedCita(null);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Programadas */}
      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'programada')}
        className="rounded-lg border border-gray-200 bg-white p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">Programadas</h3>
          <span className="text-xs font-medium text-secondary">
            {programadas.length}
          </span>
        </div>
        <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
          {programadas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center">
              <p className="text-xs text-secondary">Sin citas</p>
            </div>
          ) : (
            programadas.map((cita) => (
              <CitaCard
                key={cita._id}
                cita={cita}
                onClick={() => onCitaClick(cita)}
                onDragStart={() => handleDragStart(cita._id)}
              />
            ))
          )}
        </div>
      </div>

      {/* En Proceso */}
      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'en_proceso')}
        className="rounded-lg border border-gray-200 bg-white p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">En Proceso</h3>
          <span className="text-xs font-medium text-secondary">
            {enProceso.length}
          </span>
        </div>
        <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
          {enProceso.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center">
              <p className="text-xs text-secondary">Sin citas</p>
            </div>
          ) : (
            enProceso.map((cita) => (
              <CitaCard
                key={cita._id}
                cita={cita}
                onClick={() => onCitaClick(cita)}
                onDragStart={() => handleDragStart(cita._id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Completadas */}
      <div 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'completada')}
        className="rounded-lg border border-gray-200 bg-white p-4"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">Completadas</h3>
          <span className="text-xs font-medium text-secondary">
            {completadas.length}
          </span>
        </div>
        <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
          {completadas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center">
              <p className="text-xs text-secondary">Sin citas</p>
            </div>
          ) : (
            completadas.map((cita) => (
              <CitaCard
                key={cita._id}
                cita={cita}
                onClick={() => onCitaClick(cita)}
                onDragStart={() => handleDragStart(cita._id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
