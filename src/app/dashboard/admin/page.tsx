"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { 
  CheckCircle2, 
  Hammer, 
  Pencil, 
  Users, 
  Calendar,
  DollarSign,
  Package,
  LogOut,
  Palette,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  obtenerTodasLasCitas, 
  type Cita,
  actualizarEstadoCita
} from "@/lib/axios/citasApi";
import { 
  listarUsuarios, 
  type Usuario 
} from "@/lib/axios/usuariosApi";
import { 
  obtenerMateriales, 
  type Material 
} from "@/lib/axios/catalogosApi";
import {
  type Cotizacion
} from "@/lib/axios/cotizacionesApi";
import KanbanBoard from "@/components/admin/KanbanBoard";
import CitaModal from "@/components/admin/CitaModal";

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("citas");
  const [loading, setLoading] = useState(true);
  
  // Estados para datos del backend
  const [citas, setCitas] = useState<Cita[]>([]);
  const [empleados, setEmpleados] = useState<Usuario[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);

  // Estados para precios editables
  const [precioGranito, setPrecioGranito] = useState("");
  const [precioMadera, setPrecioMadera] = useState("");

  // Estado para el modal de detalles de cita
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para tooltip del calendario
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      console.log('🔄 Iniciando carga de datos...');
      
      const [citasRes, empleadosRes, materialesRes] = await Promise.all([
        obtenerTodasLasCitas(),
        listarUsuarios(),
        obtenerMateriales(),
      ]);

      console.log('📊 Respuesta de citas:', citasRes);
      console.log('👥 Respuesta de empleados:', empleadosRes);
      console.log('📦 Respuesta de materiales:', materialesRes);

      if (citasRes.success && citasRes.data) {
        console.log('✅ Citas cargadas:', citasRes.data.length);
        setCitas(citasRes.data);
      } else {
        console.error('❌ Error en respuesta de citas:', citasRes);
      }

      if (empleadosRes.success && empleadosRes.data) {
        console.log('✅ Empleados cargados:', empleadosRes.data.length);
        setEmpleados(empleadosRes.data);
      } else {
        console.error('❌ Error en respuesta de empleados:', empleadosRes);
      }

      if (materialesRes.success && materialesRes.data) {
        console.log('✅ Materiales cargados:', materialesRes.data.length);
        setMateriales(materialesRes.data);
        // Establecer precios iniciales desde materiales
        const granito = materialesRes.data.find(m => m.nombre.toLowerCase().includes('granito'));
        const madera = materialesRes.data.find(m => m.nombre.toLowerCase().includes('madera'));
        if (granito) setPrecioGranito(granito.precioMetroLineal.toString());
        if (madera) setPrecioMadera(madera.precioMetroLineal.toString());
      } else {
        console.error('❌ Error en respuesta de materiales:', materialesRes);
      }
    } catch (error) {
      console.error('💥 Error al cargar datos:', error);
    } finally {
      setLoading(false);
      console.log('✅ Carga de datos finalizada');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleCitaClick = (cita: Cita) => {
    setSelectedCita(cita);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCita(null);
  };

  const handleMoverCita = async (citaId: string, nuevoEstado: 'programada' | 'en_proceso' | 'completada') => {
    try {
      // Optimistic update
      setCitas(prevCitas => 
        prevCitas.map(cita => 
          cita._id === citaId ? { ...cita, estado: nuevoEstado } : cita
        )
      );

      // Actualizar en el backend
      const fechaTermino = nuevoEstado === 'completada' ? new Date() : undefined;
      await actualizarEstadoCita(citaId, { estado: nuevoEstado, fechaTermino });
      console.log('✅ Cita movida exitosamente');
    } catch (error) {
      console.error('❌ Error al mover cita:', error);
      // Revertir cambio en caso de error
      cargarDatos();
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const getInitials = (nombre: string) => {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const actualizarPrecios = async () => {
    // TODO: Implementar llamada al backend para actualizar precios
    // await actualizarMaterial(materialId, { precioMetroLineal: nuevoPrecio });
    alert('Funcionalidad de actualización de precios pendiente de integración con el backend');
    console.log('Nuevos precios:', { granito: precioGranito, madera: precioMadera });
  };

  // Generar días del calendario del mes actual
  const generarCalendario = () => {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const dias = [];
    
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      dias.push(d);
    }
    return dias;
  };

  // Obtener días con citas
  const getDiasOcupados = () => {
    const diasSet = new Set<number>();
    citas.forEach(cita => {
      const fecha = new Date(cita.fechaAgendada);
      const hoy = new Date();
      if (fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()) {
        diasSet.add(fecha.getDate());
      }
    });
    return diasSet;
  };

  // Obtener citas de un día específico
  const getCitasDelDia = (dia: number) => {
    const hoy = new Date();
    return citas.filter(cita => {
      const fecha = new Date(cita.fechaAgendada);
      return (
        fecha.getDate() === dia &&
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    });
  };

  // Manejar click en día del calendario
  const handleDayClick = (dia: number) => {
    const citasDelDia = getCitasDelDia(dia);
    if (citasDelDia.length > 0) {
      // Si hay una sola cita, abrirla directamente
      handleCitaClick(citasDelDia[0]);
    }
  };

  const calendarDays = generarCalendario();
  const busyDays = getDiasOcupados();

  const navItems = [
    { id: "citas", label: "Citas", icon: Calendar },
    { id: "materiales", label: "Materiales", icon: Package },
    { id: "pagos", label: "Pagos", icon: DollarSign },
    { id: "equipo", label: "Equipo", icon: Users },
    { id: "diseños", label: "Diseños", icon: Palette },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-4 text-sm text-secondary">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-primary">Panel de Administración</h1>
              <p className="mt-1 text-sm text-secondary">KUCHE - Gestión integral</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-primary transition hover:border-accent hover:text-accent"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>

          {/* Navegación de tabs */}
          <nav className="mt-6 flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === item.id
                      ? "bg-accent text-white shadow-sm"
                      : "text-secondary hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === "citas" && (
          <div className="space-y-6">
            {/* Tablero Kanban */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-primary">Tablero de Citas</h2>
                  <p className="mt-0.5 text-xs text-secondary">
                    Arrastra las citas para cambiar su estado
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-secondary">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-medium">{citas.length}</span>
                </div>
              </div>

              <KanbanBoard
                programadas={citas.filter(c => c.estado === 'programada')}
                enProceso={citas.filter(c => c.estado === 'en_proceso')}
                completadas={citas.filter(c => c.estado === 'completada')}
                onCitaClick={handleCitaClick}
                onMoverCita={handleMoverCita}
              />
            </div>

            {/* Grid: Calendario + Trabajadores Disponibles */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Calendario mini */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-primary">Calendario</h2>
                    <p className="mt-0.5 text-xs text-secondary capitalize">
                      {new Date().toLocaleDateString('es-MX', { month: 'long' })}
                    </p>
                  </div>
                  <Calendar className="h-4 w-4 text-secondary" />
                </div>

                <div>
                  {/* Días de la semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((dia) => (
                      <div key={dia} className="text-[10px] font-medium text-secondary py-1">
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Días del mes */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {calendarDays.map((day) => {
                      const citasDelDia = getCitasDelDia(day);
                      const tieneCitas = busyDays.has(day);
                      const hoy = new Date().getDate();
                      const esHoy = day === hoy;
                      
                      return (
                        <div
                          key={day}
                          onClick={() => tieneCitas && handleDayClick(day)}
                          className={`relative aspect-square flex items-center justify-center text-xs rounded transition ${
                            tieneCitas
                              ? "bg-accent text-white cursor-pointer hover:bg-accent/90" 
                              : esHoy
                              ? "bg-gray-200 text-primary font-medium"
                              : "text-secondary hover:bg-gray-50"
                          }`}
                        >
                          {day}
                          {tieneCitas && citasDelDia.length > 1 && (
                            <div className="absolute bottom-0 right-0 h-1 w-1 rounded-full bg-white/50" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Trabajadores disponibles */}
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-primary">Personal Disponible</h2>
                    <p className="mt-0.5 text-xs text-secondary">
                      Sin asignaciones pendientes
                    </p>
                  </div>
                  <Users className="h-4 w-4 text-secondary" />
                </div>

                <div className="space-y-2">
                  {empleados.filter(empleado => {
                    const citasAsignadas = citas.filter(
                      cita => typeof cita.ingenieroAsignado === 'string' 
                        ? cita.ingenieroAsignado === empleado._id
                        : cita.ingenieroAsignado?._id === empleado._id
                    ).length;
                    return citasAsignadas === 0;
                  }).map((empleado) => (
                    <div
                      key={empleado._id}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 transition"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-secondary">
                        {getInitials(empleado.nombre)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{empleado.nombre}</p>
                        <p className="text-xs text-secondary capitalize">{empleado.rol}</p>
                      </div>
                      <div className="flex-shrink-0 h-2 w-2 rounded-full bg-green-400" />
                    </div>
                  ))}
                  {empleados.filter(empleado => {
                    const citasAsignadas = citas.filter(
                      cita => typeof cita.ingenieroAsignado === 'string' 
                        ? cita.ingenieroAsignado === empleado._id
                        : cita.ingenieroAsignado?._id === empleado._id
                    ).length;
                    return citasAsignadas === 0;
                  }).length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center">
                      <p className="text-xs text-secondary">Todo el personal tiene asignaciones</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === "materiales" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Precios de Materiales</h2>
                  <p className="mt-1 text-sm text-secondary">
                    Control de precios por metro lineal
                  </p>
                </div>
                <Hammer className="h-5 w-5 text-accent" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary">
                    Granito (m²)
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-secondary">$</span>
                    <input
                      type="number"
                      value={precioGranito}
                      onChange={(event) => setPrecioGranito(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-accent"
                    />
                    <span className="text-sm text-secondary">MXN</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary">
                    Madera (m²)
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-secondary">$</span>
                    <input
                      type="number"
                      value={precioMadera}
                      onChange={(event) => setPrecioMadera(event.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-accent"
                    />
                    <span className="text-sm text-secondary">MXN</span>
                  </div>
                </div>

                <button 
                  onClick={actualizarPrecios}
                  className="mt-4 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
                >
                  Actualizar Precios
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Catálogo de Materiales</h2>
                  <p className="mt-1 text-sm text-secondary">
                    Stock disponible y precios
                  </p>
                </div>
                <Package className="h-5 w-5 text-accent" />
              </div>

              <div className="space-y-2">
                {materiales.length > 0 ? materiales.slice(0, 5).map((material) => (
                  <div
                    key={material._id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {!material.activo && (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary">{material.nombre}</p>
                        <p className="text-xs text-secondary">Metro lineal</p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        material.activo ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      ${material.precioMetroLineal}
                    </span>
                  </div>
                )) : (
                  <p className="py-8 text-center text-sm text-secondary">No hay materiales disponibles</p>
                )}
              </div>
            </div>

            {/* Resumen de uso de materiales */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Análisis de Demanda</h2>
                  <p className="mt-1 text-sm text-secondary">
                    Estadísticas de materiales más solicitados
                  </p>
                </div>
                <Package className="h-5 w-5 text-accent" />
              </div>

              <div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4">
                    <p className="text-xs font-medium text-secondary">Total de citas</p>
                    <p className="mt-2 text-2xl font-semibold text-yellow-700">
                      {citas.length}
                    </p>
                    <p className="mt-1 text-xs text-secondary">En todos los estados</p>
                  </div>

                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <p className="text-xs font-medium text-secondary">Programadas</p>
                    <p className="mt-2 text-2xl font-semibold text-blue-700">
                      {citas.filter(c => c.estado === 'programada').length}
                    </p>
                    <p className="mt-1 text-xs text-secondary">
                      {citas.length > 0 
                        ? Math.round((citas.filter(c => c.estado === 'programada').length / citas.length) * 100)
                        : 0}% del total
                    </p>
                  </div>

                  <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
                    <p className="text-xs font-medium text-secondary">Completadas</p>
                    <p className="mt-2 text-2xl font-semibold text-purple-700">
                      {citas.filter(c => c.estado === 'completada').length}
                    </p>
                    <p className="mt-1 text-xs text-secondary">
                      {citas.length > 0 
                        ? Math.round((citas.filter(c => c.estado === 'completada').length / citas.length) * 100)
                        : 0}% del total
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-4 text-sm font-medium text-primary">Estadísticas de citas por mes</p>
                  <div className="space-y-3">
                    {Object.entries(
                      citas.reduce((acc, cita) => {
                        const mes = new Date(cita.fechaAgendada).toLocaleDateString('es-MX', { month: 'long' });
                        acc[mes] = (acc[mes] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([mes, cantidad]) => {
                        const porcentaje = citas.length > 0 
                          ? (cantidad / citas.length) * 100 
                          : 0;
                        return (
                          <div key={mes} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-primary capitalize">{mes}</span>
                                <span className="text-secondary">{cantidad} cita{cantidad !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-accent transition-all"
                                  style={{ width: `${porcentaje}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "equipo" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Equipo de Trabajo</h2>
                  <p className="mt-1 text-sm text-secondary">
                    Personal activo y asignaciones
                  </p>
                </div>
                <Users className="h-5 w-5 text-accent" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {empleados.length > 0 ? empleados.map((empleado) => {
                  const citasAsignadas = citas.filter(
                    cita => typeof cita.ingenieroAsignado === 'string' 
                      ? cita.ingenieroAsignado === empleado._id
                      : cita.ingenieroAsignado?._id === empleado._id
                  ).length;
                  
                  return (
                  <div
                    key={empleado._id}
                    className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-accent hover:shadow-sm"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-lg font-semibold text-accent">
                        {getInitials(empleado.nombre)}
                      </div>
                      <h3 className="mt-3 font-semibold text-primary">{empleado.nombre}</h3>
                      <p className="mt-1 text-xs text-secondary capitalize">{empleado.rol}</p>
                      <p className="mt-1 text-xs text-secondary">{empleado.correo}</p>
                      
                      {citasAsignadas > 0 && (
                        <div className="mt-3 rounded-full bg-blue-50 px-3 py-1">
                          <p className="text-xs font-medium text-blue-700">
                            {citasAsignadas} asignada{citasAsignadas !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={() => setSelectedMember(empleado._id)}
                        className="mt-4 w-full rounded-full bg-gray-50 py-2 text-xs font-medium text-primary transition hover:bg-gray-100"
                      >
                        Asignar Tarea
                      </button>
                    </div>
                  </div>
                  );
                }) : (
                  <p className="col-span-4 py-8 text-center text-sm text-secondary">No hay empleados disponibles</p>
                )}
              </div>
            </div>

            {/* Métricas del equipo */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Carga de Trabajo</h2>
                  <p className="mt-1 text-sm text-secondary">
                    Rendimiento del equipo
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div>
                {empleados.length > 0 ? (
                  <div className="space-y-3">
                    {empleados.map((empleado) => {
                      const citasAsig = citas.filter(
                        cita => typeof cita.ingenieroAsignado === 'string' 
                          ? cita.ingenieroAsignado === empleado._id
                          : cita.ingenieroAsignado?._id === empleado._id
                      );
                      const programadas = citasAsig.filter(c => c.estado === 'programada').length;
                      const enProceso = citasAsig.filter(c => c.estado === 'en_proceso').length;
                      const completadas = citasAsig.filter(c => c.estado === 'completada').length;
                      const total = citasAsig.length;

                      return (
                        <div
                          key={empleado._id}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                                {getInitials(empleado.nombre)}
                              </div>
                              <div>
                                <p className="font-medium text-primary">{empleado.nombre}</p>
                                <p className="text-xs text-secondary capitalize">{empleado.rol}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-primary">{total}</p>
                              <p className="text-xs text-secondary">citas</p>
                            </div>
                          </div>
                          
                          {total > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="rounded-lg bg-yellow-50 border border-yellow-200 py-2">
                                <p className="font-semibold text-yellow-700">{programadas}</p>
                                <p className="text-secondary">Programadas</p>
                              </div>
                              <div className="rounded-lg bg-blue-50 border border-blue-200 py-2">
                                <p className="font-semibold text-blue-700">{enProceso}</p>
                                <p className="text-secondary">En proceso</p>
                              </div>
                              <div className="rounded-lg bg-green-50 border border-green-200 py-2">
                                <p className="font-semibold text-green-700">{completadas}</p>
                                <p className="text-secondary">Completadas</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-secondary">
                    No hay empleados registrados
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "diseños" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-primary">Diseños Pendientes</h2>
                <p className="mt-1 text-sm text-secondary">
                  Control de calidad y aprobaciones
                </p>
              </div>
              <Palette className="h-5 w-5 text-accent" />
            </div>

            <div className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Palette className="h-8 w-8 text-secondary" />
              </div>
              <p className="mt-4 text-sm text-secondary">
                Sección de diseños pendiente de integración con el backend.
              </p>
              <p className="mt-1 text-xs text-secondary">
                Aquí se mostrarán los renders y diseños para aprobación.
              </p>
            </div>
          </div>
        )}

        {activeTab === "pagos" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-primary">Control de Pagos</h2>
                <p className="mt-1 text-sm text-secondary">
                  Cotizaciones y transacciones
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-accent" />
            </div>

            <div className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <DollarSign className="h-8 w-8 text-secondary" />
              </div>
              <p className="mt-4 text-sm text-secondary">
                Sección de pagos pendiente de integración con el backend.
              </p>
              <p className="mt-1 text-xs text-secondary">
                Aquí se mostrará el historial de pagos y cotizaciones.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de asignación */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-primary">Asignar Tarea</h3>
              <p className="mt-2 text-sm text-secondary">
                Selecciona una tarea para asignar al miembro del equipo.
              </p>
              <div className="mt-6 space-y-2">
                {[
                  "Revisar mediciones de cliente Torreón",
                  "Definir acabados para cocina Stellar",
                  "Confirmar entrega de herrajes",
                  "Supervisar instalación en Polanco",
                ].map((task) => (
                  <button
                    key={task}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm transition hover:border-accent hover:bg-accent/5"
                  >
                    {task}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="mt-6 w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de detalles de cita */}
      <CitaModal
        cita={selectedCita}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
