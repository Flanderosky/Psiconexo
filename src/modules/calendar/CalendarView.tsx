// UBICACIÓN: src/modules/calendar/CalendarView.tsx
import { useState, useEffect } from 'react';
import { 
  format, addDays, startOfWeek, addMonths, subMonths, 
  startOfMonth, endOfMonth, endOfWeek, isSameMonth, 
  isSameDay, parseISO, isToday 
} from 'date-fns';
import { es } from 'date-fns/locale'; // Para español
import { ChevronLeft, ChevronRight, Clock, Plus, User, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Appointment {
  id: string;
  date: string; // ISO String
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  patient: {
    name: string;
  };
}

// Interfaces auxiliares para el formulario
interface PatientOption {
  id: string;
  name: string;
}

export const CalendarView = () => {
  // --- ESTADOS ---
  const [currentDate, setCurrentDate] = useState(new Date()); // El día que estamos viendo en el calendario
  const [selectedDate, setSelectedDate] = useState(new Date()); // El día seleccionado para ver citas
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  
  // Estado para el Modal de Nueva Cita
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    time: '10:00',
    duration: 50
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [selectedDate, isModalOpen]); // Recargar si cambiamos de día o creamos cita

  const fetchAppointments = async () => {
    // Buscamos citas del día seleccionado (desde las 00:00 hasta las 23:59)
    const start = new Date(selectedDate);
    start.setHours(0,0,0,0);
    const end = new Date(selectedDate);
    end.setHours(23,59,59,999);

    const { data } = await supabase
      .from('sessions')
      .select(`
        id, date, duration, status,
        patient:patients(name)
      `)
      .gte('date', start.toISOString())
      .lte('date', end.toISOString())
      .neq('status', 'cancelled') // Opcional: No mostrar canceladas para limpieza visual
      .order('date');

    if (data) setAppointments(data as any);
  };

  const fetchPatients = async () => {
    const { data } = await supabase.from('patients').select('id, name').eq('status', 'active');
    if (data) setPatients(data);
  };

  // --- ACCIONES ---
  const handleCreateAppointment = async () => {
    if (!newAppointment.patientId) return alert('Selecciona un paciente');

    // Construir fecha completa: Día seleccionado + Hora elegida
    const [hours, minutes] = newAppointment.time.split(':');
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0);

    const { error } = await supabase.from('sessions').insert([{
      patient_id: newAppointment.patientId,
      date: appointmentDate.toISOString(),
      duration: newAppointment.duration,
      status: 'scheduled',
      summary: 'Sesión programada'
    }]);

    if (error) alert('Error al agendar');
    else {
      setIsModalOpen(false);
      fetchAppointments();
    }
  };

  const updateStatus = async (id: string, status: 'completed' | 'cancelled') => {
    await supabase.from('sessions').update({ status }).eq('id', id);
    fetchAppointments();
  };

  // --- RENDERIZADO DEL CALENDARIO (MES) ---
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-xl font-bold text-white capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronLeft/></button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-zinc-800 rounded text-zinc-400"><ChevronRight/></button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "eee";
    const days = [];
    let startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Semana empieza lunes

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-xs text-zinc-500 font-medium uppercase py-2">
          {format(addDays(startDate, i), dateFormat, { locale: es })}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
            className={`
              relative h-10 w-10 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-all text-sm
              ${!isCurrentMonth ? "text-zinc-700" : isSelected ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/50" : "text-zinc-300 hover:bg-zinc-800"}
              ${isTodayDate && !isSelected ? "border border-emerald-500 text-emerald-500" : ""}
            `}
          >
            {formattedDate}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div key={day.toString()} className="grid grid-cols-7 gap-y-2 mb-2">{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="flex h-full w-full bg-black text-zinc-100">
      
      {/* --- SIDEBAR IZQUIERDO: CALENDARIO --- */}
      <div className="w-80 border-r border-zinc-800 p-6 flex flex-col bg-zinc-950">
        {renderHeader()}
        {renderDays()}
        {renderCells()}

        <div className="mt-auto p-4 bg-zinc-900 rounded-xl border border-zinc-800">
          <h4 className="text-sm font-medium text-zinc-400 mb-2">Resumen</h4>
          <div className="flex justify-between items-center text-sm mb-1">
             <span className="text-zinc-500">Citas hoy</span>
             <span className="text-white font-bold">{appointments.length}</span>
          </div>
        </div>
      </div>

      {/* --- PANEL DERECHO: AGENDA DEL DÍA --- */}
      <div className="flex-1 flex flex-col bg-black relative">
        {/* Header del Día */}
        <header className="h-20 border-b border-zinc-800 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize flex items-center gap-3">
              {isToday(selectedDate) && <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-1 rounded-full uppercase tracking-wider font-bold border border-emerald-500/20">Hoy</span>}
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Agenda diaria</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95"
          >
            <Plus size={20} /> Agendar Cita
          </button>
        </header>

        {/* Lista de Citas (Timeline) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {appointments.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-60">
                <Clock size={48} className="mb-4 text-zinc-700" />
                <p className="text-lg">No hay citas programadas para este día</p>
                <p className="text-sm">Disfruta tu tiempo libre o agenda un paciente.</p>
             </div>
          ) : (
            appointments.map(apt => (
              <div key={apt.id} className="group flex gap-6 animate-in slide-in-from-bottom-2">
                {/* Columna Hora */}
                <div className="w-16 pt-2 text-right">
                   <span className="text-lg font-bold text-white block">
                     {format(parseISO(apt.date), 'HH:mm')}
                   </span>
                   <span className="text-xs text-zinc-500 block">
                     {apt.duration} min
                   </span>
                </div>

                {/* Tarjeta Cita */}
                <div className={`flex-1 p-5 rounded-2xl border transition-all ${
                  apt.status === 'completed' 
                    ? 'bg-zinc-900/50 border-zinc-800 opacity-60' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-100">{apt.patient.name}</h3>
                        <p className="text-emerald-500 text-sm flex items-center gap-1">
                          {apt.status === 'scheduled' ? 'Confirmada' : 'Completada'}
                        </p>
                      </div>
                    </div>

                    {/* Acciones Rápidas */}
                    {apt.status === 'scheduled' && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => updateStatus(apt.id, 'cancelled')}
                          title="Cancelar cita"
                          className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                        <button 
                          onClick={() => updateStatus(apt.id, 'completed')}
                          title="Marcar como realizada"
                          className="p-2 hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-400 rounded-lg transition-colors"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* --- MODAL FLOTANTE (Simple) --- */}
        {isModalOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Nueva Cita</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1 uppercase">Paciente</label>
                  <select 
                    value={newAppointment.patientId}
                    onChange={e => setNewAppointment({...newAppointment, patientId: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none appearance-none"
                  >
                    <option value="">Seleccionar paciente...</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase">Hora</label>
                    <input 
                      type="time" 
                      value={newAppointment.time}
                      onChange={e => setNewAppointment({...newAppointment, time: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase">Duración (min)</label>
                    <input 
                      type="number" 
                      value={newAppointment.duration}
                      onChange={e => setNewAppointment({...newAppointment, duration: parseInt(e.target.value)})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateAppointment}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-colors"
                >
                  Agendar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};