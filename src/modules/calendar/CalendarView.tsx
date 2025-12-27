// UBICACIÓN: src/modules/calendar/CalendarView.tsx
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, User, Activity, Loader2, Plus, X, FileText, ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Nueva Prop para navegación
interface CalendarViewProps {
  onNavigateToPatient?: (patientId: string) => void;
}

interface PatientSimple {
  id: string;
  full_name: string;
}

// Recibimos la prop onNavigateToPatient
export const CalendarView = ({ onNavigateToPatient }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [daySessions, setDaySessions] = useState<any[]>([]);

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientsList, setPatientsList] = useState<PatientSimple[]>([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '', date: '', time: '10:00', duration: '60', type: 'Consulta General'
  });

  // Carga inicial y listeners
  useEffect(() => { fetchSessionsForMonth(); }, [currentDate]);
  
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase.from('patients').select('id, full_name').order('full_name');
      if (data) setPatientsList(data);
    };
    fetchPatients();
  }, []);

  // Filtro de sesiones por día
  useEffect(() => {
    const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);
    
    const filtered = sessions.filter(s => {
        const d = new Date(s.created_at);
        return d >= startOfDay && d <= endOfDay;
    });
    // Ordenar por hora
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setDaySessions(filtered);
    
    // Sincronizar formulario
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, date: `${year}-${month}-${day}` }));
  }, [selectedDate, sessions]);

  const fetchSessionsForMonth = async () => {
    setLoading(true);
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
    const { data } = await supabase
      .from('sessions')
      .select('*, patients(full_name)')
      .gte('created_at', start)
      .lte('created_at', end);
    if (data) setSessions(data);
    setLoading(false);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dateTimeString = `${formData.date}T${formData.time}:00`;
      const { error } = await supabase.from('sessions').insert({
          patient_id: formData.patientId,
          created_at: new Date(dateTimeString).toISOString(),
          tags: [`${formData.duration} min`, formData.type], 
          summary: 'Sesión programada'
        });
      if (error) throw error;
      await fetchSessionsForMonth();
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, patientId: '' })); 
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Helpers Calendario
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const daysArray = [...Array(firstDayOfMonth).fill(null), ...Array(daysInMonth).keys()];
  const hasSession = (day: number) => sessions.some(s => new Date(s.created_at).getDate() === day);

  return (
    <div className="flex flex-col h-full bg-black p-6 md:p-10 animate-in fade-in relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
           <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">Agenda Clínica</h2>
           <h1 className="text-3xl text-white font-light tracking-wide flex items-center gap-3">
              <CalendarIcon className="text-emerald-500" size={28} strokeWidth={1}/>
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
           </h1>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
             <Plus size={20} strokeWidth={2.5}/> <span className="uppercase tracking-wider text-xs">Agendar</span>
           </button>
           <div className="flex gap-2 ml-4 border-l border-zinc-800 pl-4">
              <button onClick={prevMonth} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 border border-zinc-800"><ChevronLeft size={20}/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 hover:bg-zinc-900 rounded-lg text-zinc-400 text-xs font-bold border border-zinc-800">HOY</button>
              <button onClick={nextMonth} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 border border-zinc-800"><ChevronRight size={20}/></button>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
         {/* CALENDARIO (Izquierda) */}
         <div className="lg:col-span-2 flex flex-col h-full">
            <div className="grid grid-cols-7 mb-4 border-b border-zinc-900 pb-2">
               {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => <div key={d} className="text-center text-[10px] text-zinc-600 font-bold tracking-widest">{d}</div>)}
            </div>
            <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-1 md:gap-2">
                {daysArray.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="bg-transparent"/>;
                    const dayNum = day + 1;
                    const isToday = dayNum === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
                    const isSelected = dayNum === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth();
                    const active = hasSession(dayNum);
                    return (
                        <button key={dayNum} onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum))}
                            className={`relative p-3 rounded-xl border transition-all flex flex-col justify-between group ${isSelected ? 'bg-zinc-900 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-zinc-950/50 border-zinc-900 hover:bg-zinc-900'}`}>
                            <span className={`text-sm font-mono ${isSelected ? 'text-white' : (isToday ? 'text-emerald-500 font-bold' : 'text-zinc-500')}`}>{dayNum}</span>
                            {active && <div className="mt-auto flex justify-end"><div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-zinc-700 group-hover:bg-zinc-500'}`}></div></div>}
                        </button>
                    );
                })}
            </div>
         </div>

         {/* DETALLE DEL DÍA (Derecha) - TARJETAS MEJORADAS */}
         <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 flex flex-col h-full overflow-hidden">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock size={14}/> Actividad del {selectedDate.toLocaleDateString()}
             </h3>

             <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                 {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-600"/></div> : 
                  daySessions.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                        <Activity size={40} className="mx-auto mb-4 text-zinc-500" strokeWidth={1}/>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Sin sesiones</p>
                    </div>
                 ) : (
                    daySessions.map(session => (
                        <div 
                           key={session.id} 
                           onClick={() => onNavigateToPatient && onNavigateToPatient(session.patient_id)}
                           className="group bg-black border border-zinc-800 p-4 rounded-xl hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all cursor-pointer relative overflow-hidden"
                        >
                             {/* Barra de estado lateral */}
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors"></div>

                             <div className="flex justify-between items-start mb-3 pl-2">
                                 <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-800 group-hover:text-emerald-400 transition-colors">
                                         <User size={16}/>
                                     </div>
                                     <div>
                                         <h4 className="text-sm text-white font-medium group-hover:text-emerald-400 transition-colors">
                                           {session.patients?.full_name || 'Paciente'}
                                         </h4>
                                         <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-mono mt-0.5">
                                            <Clock size={10} />
                                            <span>{new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hrs</span>
                                         </div>
                                     </div>
                                 </div>
                                 
                                 {/* Icono de flecha que aparece en hover */}
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                   <ArrowRight size={16} className="text-emerald-500" />
                                 </div>
                             </div>
                             
                             {/* Tags informativos */}
                             <div className="flex flex-wrap gap-2 mb-3 pl-2">
                                 {session.tags && session.tags.length > 0 ? (
                                     session.tags.slice(0, 3).map((tag: string, i: number) => (
                                         <span key={i} className="text-[9px] px-2 py-1 bg-zinc-900 text-zinc-400 rounded border border-zinc-800 group-hover:border-emerald-500/20 transition-colors">
                                             {tag} 
                                         </span>
                                     ))
                                 ) : (
                                     <span className="text-[9px] text-zinc-600 italic">Sin etiquetas</span>
                                 )}
                             </div>

                             {/* Snippet de lo trabajado (Notas) */}
                             {session.notes && (
                               <div className="pl-2 pt-3 border-t border-zinc-900 mt-2">
                                 <div className="flex items-start gap-2">
                                    <FileText size={10} className="text-zinc-600 mt-0.5" />
                                    <p className="text-[10px] text-zinc-500 line-clamp-2 italic leading-relaxed">
                                      "{session.notes}"
                                    </p>
                                 </div>
                               </div>
                             )}
                        </div>
                    ))
                 )}
             </div>
         </div>
      </div>

      {/* MODAL (Mismo código que antes, resumido por brevedad) */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-600 hover:text-white"><X size={20} /></button>
             <h2 className="text-xl text-white font-light mb-6 flex items-center gap-2"><CalendarIcon className="text-emerald-500" size={24}/> Agendar Sesión</h2>
             <form onSubmit={handleSaveSession} className="space-y-4">
               {/* Selectores Simplificados */}
               <div className="space-y-1"><label className="text-[10px] text-zinc-500 font-bold uppercase">Paciente</label><select required value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm"><option value="">Seleccionar...</option>{patientsList.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-[10px] text-zinc-500 font-bold uppercase">Fecha</label><input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm"/></div>
                 <div className="space-y-1"><label className="text-[10px] text-zinc-500 font-bold uppercase">Hora</label><input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white text-sm"/></div>
               </div>
               <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-zinc-800 text-zinc-400 text-xs font-bold">CANCELAR</button>
                 <button type="submit" disabled={saving} className="flex-[2] py-3 rounded-xl bg-emerald-500 text-black text-xs font-bold">{saving ? '...' : 'CONFIRMAR'}</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};