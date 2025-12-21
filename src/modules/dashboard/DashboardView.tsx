// UBICACIÓN: src/modules/dashboard/DashboardView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Calendar, Clock, Activity, 
  ChevronRight, Brain, UserPlus, 
  Eraser, X, Mail, User
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  sessionsThisMonth: number;
}

interface TodaySession {
  id: string;
  date: string;
  patient: { name: string; avatar?: string };
  status: string;
}

export const DashboardView = () => {
  // --- ESTADOS DE DATOS ---
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    sessionsThisMonth: 0,
  });
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);

  // --- ESTADOS DE INTERACCIÓN ---
  const [noteText, setNoteText] = useState('');
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Estado para Modal "Nuevo Paciente"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPatientData, setNewPatientData] = useState({ name: '', email: '', phone: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- CARGA DE DATOS ---
  const fetchDashboardData = async () => {
    setLoading(true);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    const [patientsData, sessionsMonthData, todayData] = await Promise.all([
      supabase.from('patients').select('status'),
      supabase.from('sessions').select('id').gte('date', startOfMonth),
      supabase
        .from('sessions')
        .select(`id, date, status, patient:patients(name)`)
        .gte('date', startOfDay)
        .lte('date', endOfDay)
        .order('date', { ascending: true })
    ]);

    const activeCount = patientsData.data?.filter(p => p.status === 'active').length || 0;
    const totalCount = patientsData.data?.length || 0;
    
    setStats({
      totalPatients: totalCount,
      activePatients: activeCount,
      sessionsThisMonth: sessionsMonthData.data?.length || 0
    });

    if (todayData.data) {
      setTodaySessions(todayData.data as any);
    }

    setLoading(false);
  };

  // --- ACCIONES RÁPIDAS ---

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.name.trim()) return;
    setIsCreating(true);

    const { error } = await supabase.from('patients').insert([{ 
      name: newPatientData.name, 
      email: newPatientData.email,
      phone: newPatientData.phone,
      status: 'active' 
    }]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setIsCreateModalOpen(false);
      setNewPatientData({ name: '', email: '', phone: '' });
      fetchDashboardData(); // Recargar contadores automáticamente
    }
    setIsCreating(false);
  };

  const handleClearNote = () => {
    setNoteText('');
    noteInputRef.current?.focus();
  };

  // Saludo dinámico
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  if (loading && !stats.totalPatients) return <div className="p-8 text-zinc-500 animate-pulse">Cargando métricas...</div>;

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-8 bg-black">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{greeting}, Doctor.</h1>
          <p className="text-zinc-500">Resumen de actividad en tiempo real.</p>
        </div>
        <div className="text-right">
          <p className="text-zinc-400 font-medium capitalize">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* SECTION 1: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4 text-emerald-500">
            <Users size={24} />
            <span className="text-sm font-medium uppercase tracking-wider">Pacientes Activos</span>
          </div>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-bold text-white">{stats.activePatients}</span>
             <span className="text-sm text-zinc-500">de {stats.totalPatients} totales</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4 text-blue-500">
            <Calendar size={24} />
            <span className="text-sm font-medium uppercase tracking-wider">Sesiones Mes</span>
          </div>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-bold text-white">{stats.sessionsThisMonth}</span>
             <span className="text-sm text-zinc-500">consultas</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <Brain size={24} />
            <span className="text-sm font-medium uppercase tracking-wider">Sistema</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-zinc-300 font-medium">Sincronizado</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Base de datos al día.</p>
        </div>
      </div>

      {/* SECTION 2: GRID INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
        
        {/* COLUMNA IZQUIERDA: Agenda (2/3) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="text-zinc-400" size={20} />
              Agenda de Hoy
            </h3>
            {todaySessions.length > 0 && (
              <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full">
                {todaySessions.length} Citas
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {todaySessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3">
                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                   <Calendar size={24} className="opacity-50"/>
                </div>
                <p>No tienes sesiones programadas para hoy.</p>
              </div>
            ) : (
              todaySessions.map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors group">
                  <div className="w-16 text-center">
                    <span className="block text-lg font-bold text-white">
                      {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-zinc-800"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-zinc-200">{session.patient.name}</h4>
                    <span className={`text-xs capitalize ${
                      session.status === 'completed' ? 'text-emerald-500' : 
                      session.status === 'in_progress' ? 'text-blue-400 animate-pulse' : 'text-zinc-500'
                    }`}>
                      {session.status === 'scheduled' ? 'Confirmada' : session.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
                        <ChevronRight size={18} />
                     </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: ACCIONES RÁPIDAS (LIMPIO) */}
        <div className="space-y-6">
           
           {/* BOTONES DE ACCIÓN: Solo los 2 útiles */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h4 className="text-zinc-400 font-medium text-sm mb-4 uppercase tracking-wider">Acciones Rápidas</h4>
              <div className="grid grid-cols-2 gap-3">
                 {/* Botón 1: Nuevo Paciente (Verde) */}
                 <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                 >
                    <UserPlus size={24} />
                    <span className="text-xs">Registrar Paciente</span>
                 </button>

                 {/* Botón 2: Nueva Nota (Gris/Ámbar) */}
                 <button 
                    onClick={handleClearNote}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors active:scale-95"
                 >
                    <Eraser size={24} />
                    <span className="text-xs">Nueva Nota</span>
                 </button>
              </div>
           </div>

           {/* AREA DE NOTAS RÁPIDAS (STICKY NOTE) */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col h-48">
               <h4 className="text-zinc-400 font-medium text-sm mb-2 uppercase tracking-wider flex items-center justify-between">
                 Block de Notas
                 <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">Local</span>
               </h4>
               <textarea 
                 ref={noteInputRef}
                 value={noteText}
                 onChange={(e) => setNoteText(e.target.value)}
                 className="flex-1 w-full bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50 resize-none placeholder-zinc-700"
                 placeholder="Escribe algo rápido aquí..."
               ></textarea>
           </div>

        </div>
      </div>

      {/* --- MODAL CREAR PACIENTE --- */}
      {isCreateModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <UserPlus className="text-emerald-500" size={24}/>
                Registro Rápido
            </h2>
            <form onSubmit={handleCreatePatient} className="space-y-4">
                <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Nombre Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-zinc-600" size={18} />
                        <input type="text" required value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Nombre del paciente" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Correo / Teléfono (Opcional)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-zinc-600" size={18} />
                        <input type="email" value={newPatientData.email} onChange={e => setNewPatientData({...newPatientData, email: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors" placeholder="contacto@ejemplo.com" />
                    </div>
                </div>
                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors font-medium">Cancelar</button>
                    <button type="submit" disabled={isCreating} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-colors disabled:opacity-50">
                        {isCreating ? 'Guardando...' : 'Registrar'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};