import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, User, Activity, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [daySessions, setDaySessions] = useState<any[]>([]);

  // Cargar sesiones del mes actual
  useEffect(() => {
    fetchSessionsForMonth();
  }, [currentDate]);

  // Filtrar sesiones cuando cambia la selección de día
  useEffect(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filtered = sessions.filter(s => {
        const sessionDate = new Date(s.created_at);
        return sessionDate >= startOfDay && sessionDate <= endOfDay;
    });
    setDaySessions(filtered);
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

  // Lógica del Calendario
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Domingo
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Generar array de días con espacios vacíos al inicio
  const daysArray = [
      ...Array(firstDayOfMonth).fill(null), 
      ...Array(daysInMonth).keys()
  ];

  // Helper para saber si un día tiene sesiones
  const hasSession = (day: number) => {
    return sessions.some(s => {
        const d = new Date(s.created_at);
        return d.getDate() === day;
    });
  };

  return (
    <div className="flex flex-col h-full bg-black p-6 md:p-10 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-1">Agenda Clínica</h2>
           <h1 className="text-3xl text-white font-light tracking-wide flex items-center gap-3">
              <CalendarIcon className="text-emerald-500" size={28} strokeWidth={1}/>
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
           </h1>
        </div>

        <div className="flex gap-2">
           <button onClick={prevMonth} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 border border-zinc-800 transition-colors"><ChevronLeft size={20}/></button>
           <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 hover:bg-zinc-900 rounded-lg text-zinc-400 text-xs font-bold border border-zinc-800 transition-colors">HOY</button>
           <button onClick={nextMonth} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 border border-zinc-800 transition-colors"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
         
         {/* COLUMNA IZQUIERDA: CALENDARIO GRID (2/3) */}
         <div className="lg:col-span-2 flex flex-col h-full">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 mb-4 border-b border-zinc-900 pb-2">
               {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
                   <div key={d} className="text-center text-[10px] text-zinc-600 font-bold tracking-widest">{d}</div>
               ))}
            </div>

            {/* Grid de Días */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-1 md:gap-2">
                {daysArray.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="bg-transparent"/>;
                    
                    const dayNum = day + 1;
                    const isToday = dayNum === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
                    const isSelected = dayNum === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth();
                    const active = hasSession(dayNum);

                    return (
                        <button 
                            key={dayNum}
                            onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum))}
                            className={`relative p-3 rounded-xl border transition-all flex flex-col justify-between group ${
                                isSelected 
                                ? 'bg-zinc-900 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                : 'bg-zinc-950/50 border-zinc-900 hover:bg-zinc-900 hover:border-zinc-800'
                            }`}
                        >
                            <span className={`text-sm font-mono ${isSelected ? 'text-white' : (isToday ? 'text-emerald-500 font-bold' : 'text-zinc-500')}`}>
                                {dayNum}
                            </span>
                            
                            {/* Indicador de Sesión */}
                            {active && (
                                <div className="mt-auto flex justify-end">
                                   <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-zinc-700 group-hover:bg-zinc-500'}`}></div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
         </div>

         {/* COLUMNA DERECHA: DETALLE DEL DÍA (1/3) */}
         <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-6 flex flex-col h-full overflow-hidden">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock size={14}/> Actividad del {selectedDate.toLocaleDateString()}
             </h3>

             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                 {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-600"/></div>
                 ) : daySessions.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                        <Activity size={40} className="mx-auto mb-4 text-zinc-500" strokeWidth={1}/>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Sin sesiones registradas</p>
                    </div>
                 ) : (
                    daySessions.map(session => (
                        <div key={session.id} className="group bg-black border border-zinc-800 p-4 rounded-xl hover:border-emerald-500/30 transition-all">
                             <div className="flex items-center gap-3 mb-3">
                                 <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-800">
                                     <User size={14}/>
                                 </div>
                                 <div>
                                     <h4 className="text-sm text-white font-medium">{session.patients?.full_name || 'Paciente Desconocido'}</h4>
                                     <p className="text-[10px] text-zinc-500 uppercase font-mono">
                                        {new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                     </p>
                                 </div>
                             </div>
                             
                             {/* Tags / Resumen */}
                             <div className="flex flex-wrap gap-2">
                                 {session.tags && session.tags.length > 0 ? (
                                     session.tags.slice(0, 3).map((tag: string, i: number) => (
                                         <span key={i} className="text-[9px] px-2 py-1 bg-zinc-900 text-zinc-400 rounded border border-zinc-800">
                                             {tag.split('(')[0]} {/* Limpiamos el contador si queremos */}
                                         </span>
                                     ))
                                 ) : (
                                     <span className="text-[9px] text-zinc-600 italic">Sesión de seguimiento</span>
                                 )}
                             </div>
                        </div>
                    ))
                 )}
             </div>
         </div>

      </div>
    </div>
  );
};