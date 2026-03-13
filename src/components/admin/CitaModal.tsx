"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  X, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Clock,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Save
} from "lucide-react";
import { Cita } from "@/lib/axios/citasApi";
import { Usuario } from "@/lib/axios/usuariosApi";

interface CitaModalProps {
  cita: Cita | null;
  isOpen: boolean;
  onClose: () => void;
  empleados?: Usuario[];
  onAsignarIngeniero?: (citaId: string, ingenieroId: string | null) => Promise<void>;
  onActualizarEstado?: (citaId: string, nuevoEstado: 'programada' | 'en_proceso' | 'completada' | 'cancelada') => Promise<void>;
}

export default function CitaModal({ 
  cita, 
  isOpen, 
  onClose, 
  empleados = [],
  onAsignarIngeniero,
  onActualizarEstado
}: CitaModalProps) {
  const [selectedIngeniero, setSelectedIngeniero] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingEstado, setIsUpdatingEstado] = useState(false);

  useEffect(() => {
    if (cita && cita.ingenieroAsignado) {
      const ingenieroId = typeof cita.ingenieroAsignado === 'string' 
        ? cita.ingenieroAsignado 
        : cita.ingenieroAsignado._id;
      setSelectedIngeniero(ingenieroId);
    } else {
      setSelectedIngeniero("");
    }
  }, [cita]);

  if (!cita) return null;

  const handleAsignarIngeniero = async () => {
    if (!onAsignarIngeniero) return;
    setIsAssigning(true);
    try {
      const ingenieroId = selectedIngeniero || null;
      await onAsignarIngeniero(cita._id, ingenieroId);
    } catch (error) {
      console.error("Error al asignar ingeniero:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: 'programada' | 'en_proceso' | 'completada' | 'cancelada') => {
    if (!onActualizarEstado) return;
    setIsUpdatingEstado(true);
    try {
      await onActualizarEstado(cita._id, nuevoEstado);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    } finally {
      setIsUpdatingEstado(false);
    }
  };

  const formatearFechaCompleta = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'programada': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'en_proceso': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completada': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelada': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'programada': return 'Programada';
      case 'en_proceso': return 'En Proceso';
      case 'completada': return 'Completada';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  };

  const getNombreIngeniero = () => {
    if (!cita.ingenieroAsignado) return null;
    if (typeof cita.ingenieroAsignado === 'string') return null;
    return cita.ingenieroAsignado.nombre;
  };

  const getCorreoIngeniero = () => {
    if (!cita.ingenieroAsignado) return null;
    if (typeof cita.ingenieroAsignado === 'string') return null;
    return cita.ingenieroAsignado.correo;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white p-6 rounded-t-2xl">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-primary">
                  Detalles de la Cita
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  ID: {cita._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-secondary transition hover:bg-gray-100 hover:text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Estado */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${getEstadoColor(cita.estado)}`}>
                  {cita.estado === 'completada' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {getEstadoTexto(cita.estado)}
                </span>
              </div>

              {/* Información del Cliente */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-primary flex items-center gap-2">
                  <User className="h-4 w-4 text-accent" />
                  Información del Cliente
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-secondary">Nombre completo</p>
                    <p className="mt-1 text-sm font-medium text-primary">{cita.nombreCliente}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-secondary">Teléfono</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="h-3 w-3 text-secondary" />
                        <p className="text-sm font-medium text-primary">{cita.telefonoCliente}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-secondary">Correo electrónico</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Mail className="h-3 w-3 text-secondary" />
                        <p className="text-sm font-medium text-primary truncate">{cita.correoCliente}</p>
                      </div>
                    </div>
                  </div>
                  {cita.ubicacion && (
                    <div>
                      <p className="text-xs text-secondary">Ubicación</p>
                      <div className="mt-1 flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-secondary mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-primary">{cita.ubicacion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fechas */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  Fechas
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-secondary">Fecha agendada</p>
                    <p className="mt-1 text-sm font-medium text-primary capitalize">
                      {formatearFechaCompleta(cita.fechaAgendada)}
                    </p>
                  </div>
                  {cita.fechaInicio && (
                    <div>
                      <p className="text-xs text-secondary">Fecha de inicio</p>
                      <p className="mt-1 text-sm font-medium text-primary capitalize">
                        {formatearFechaCompleta(cita.fechaInicio)}
                      </p>
                    </div>
                  )}
                  {cita.fechaTermino && (
                    <div>
                      <p className="text-xs text-secondary">Fecha de término</p>
                      <p className="mt-1 text-sm font-medium text-primary capitalize">
                        {formatearFechaCompleta(cita.fechaTermino)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-secondary">Creada el</p>
                    <p className="mt-1 text-sm font-medium text-primary capitalize">
                      {formatearFechaCompleta(cita.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ingeniero Asignado / Asignar */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-primary flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-accent" />
                  Ingeniero Asignado
                </h3>
                
                {onAsignarIngeniero ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-secondary mb-2">
                        Seleccionar ingeniero
                      </label>
                      <select
                        value={selectedIngeniero}
                        onChange={(e) => setSelectedIngeniero(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        disabled={isAssigning}
                      >
                        <option value="">Sin asignar</option>
                        {empleados.map((empleado) => (
                          <option key={empleado._id} value={empleado._id}>
                            {empleado.nombre} - {empleado.rol}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {getNombreIngeniero() && (
                      <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                        <p className="text-xs text-secondary mb-1">Actualmente asignado a:</p>
                        <p className="text-sm font-medium text-primary">{getNombreIngeniero()}</p>
                        {getCorreoIngeniero() && (
                          <p className="text-xs text-secondary mt-1">{getCorreoIngeniero()}</p>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={handleAsignarIngeniero}
                      disabled={isAssigning || (!selectedIngeniero && !getNombreIngeniero())}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAssigning ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Asignando...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          <span>{getNombreIngeniero() ? 'Actualizar asignación' : 'Asignar ingeniero'}</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  getNombreIngeniero() ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-secondary">Nombre</p>
                        <p className="mt-1 text-sm font-medium text-primary">{getNombreIngeniero()}</p>
                      </div>
                      {getCorreoIngeniero() && (
                        <div>
                          <p className="text-xs text-secondary">Correo</p>
                          <p className="mt-1 text-sm font-medium text-primary">{getCorreoIngeniero()}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-secondary italic">No asignado</p>
                  )
                )}
              </div>

              {/* Especificaciones */}
              {(cita.especificacionesInicio?.medidas || 
                cita.especificacionesInicio?.estilo || 
                cita.especificacionesInicio?.especificaciones ||
                cita.especificacionesInicio?.materialesPreferidos?.length) && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    Especificaciones
                  </h3>
                  <div className="space-y-3">
                    {cita.especificacionesInicio.medidas && (
                      <div>
                        <p className="text-xs text-secondary">Medidas</p>
                        <p className="mt-1 text-sm font-medium text-primary">
                          {cita.especificacionesInicio.medidas}
                        </p>
                      </div>
                    )}
                    {cita.especificacionesInicio.estilo && (
                      <div>
                        <p className="text-xs text-secondary">Estilo</p>
                        <p className="mt-1 text-sm font-medium text-primary">
                          {cita.especificacionesInicio.estilo}
                        </p>
                      </div>
                    )}
                    {cita.especificacionesInicio.especificaciones && (
                      <div>
                        <p className="text-xs text-secondary">Detalles</p>
                        <p className="mt-1 text-sm font-medium text-primary">
                          {cita.especificacionesInicio.especificaciones}
                        </p>
                      </div>
                    )}
                    {cita.especificacionesInicio.materialesPreferidos && 
                     cita.especificacionesInicio.materialesPreferidos.length > 0 && (
                      <div>
                        <p className="text-xs text-secondary">Materiales preferidos</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {cita.especificacionesInicio.materialesPreferidos.map((material, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                            >
                              {material}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Información Adicional */}
              {cita.informacionAdicional && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    Información Adicional
                  </h3>
                  <p className="text-sm text-primary whitespace-pre-wrap">
                    {cita.informacionAdicional}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl space-y-3">
              {/* Botones de cambio de estado */}
              {onActualizarEstado && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleCambiarEstado('programada')}
                    disabled={isUpdatingEstado || cita.estado === 'programada'}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Programada
                  </button>
                  <button
                    onClick={() => handleCambiarEstado('en_proceso')}
                    disabled={isUpdatingEstado || cita.estado === 'en_proceso'}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    En Proceso
                  </button>
                  <button
                    onClick={() => handleCambiarEstado('completada')}
                    disabled={isUpdatingEstado || cita.estado === 'completada'}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Completada
                  </button>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="w-full rounded-full bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
