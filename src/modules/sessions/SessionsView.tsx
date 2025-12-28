// UBICACIÓN: src/modules/sessions/SessionsView.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Activity, Search, Calendar, 
  ArrowRight, Loader2} from 'lucide-react';

interface SessionsViewProps {
  onNavigateToPatient: (patientId: string) => void;
}

export const SessionsView = ({ onNavigateToPatient }: SessionsViewProps) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'today'>('today'); // Por defecto 'hoy'

  useEffect(() => {
    fetchSessions();
  }, [filter]);

  const fetchSessions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        let query = supabase
        .from('sessions')
        .select(`
            *,
            patients (
                id,
                first_name,
                last_name
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

        // Filtro de fecha para "HOY"
        if (filter === 'today') {
            const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            query = query.gte('created_at', `${todayStr}T00:00:00`).lte('created_at', `${todayStr}T23:59:59`);
        }

        const { data, error } = await query;

        if (!error && data) {
            setSessions(data);
        }
    }
    setLoading(false);
  };

  const filteredSessions = sessions.filter(s => {
    const patientName = s.patients ? `${s.patients.first_name} ${s.patients.last_name}` : 'Paciente eliminado';
    const term = searchTerm.toLowerCase();
    return patientName.toLowerCase().includes(term) || (s.notes || '').toLowerCase().includes(term);
  });

  return (
    <div className="flex-1 h-full overflow-y-auto bg-black p-6 md:p-10 relative animate-in fade-in duration-500">
       {/* FONDO DECORATIVO */}
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-900/5 rounded-full blur-[120px] pointer-events-none"></div>

       <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-zinc-900 pb-6">
             <div>
                <h1 className="text-3xl font-light tracking-tight text-white flex items-center gap-3">
                   <Activity className="text-emerald-500" size={32} /> 
                   {filter === 'today' ? 'Sesiones de Hoy' : 'Historial Global'}
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                    {filter === 'today' 
                        ? 'Resumen de tu actividad clínica del día.' 
                        : 'Registro completo de todas las intervenciones realizadas.'}
                </p>
             </div>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Selector de Filtro */}
                <div className="bg-zinc-900 p-1 rounded-lg flex items-center border border-zinc-800">
                    <button 
                        onClick={() => setFilter('today')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'today' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Hoy
                    </button>
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'all' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Historial
                    </button>
                </div>
             </div>
          </div>

          {/* BUSCADOR (Solo si hay historial) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
                type="text" 
                placeholder="Buscar por paciente o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* LISTA */}
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-emerald-500">
                <Loader2 size={32} className="animate-spin mb-2"/>
                <p className="text-xs font-mono">Cargando registros...</p>
             </div>
          ) : filteredSessions.length === 0 ? (
             <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-zinc-600" />
                </div>
                <h3 className="text-zinc-400 font-medium">Sin actividad registrada</h3>
                <p className="text-zinc-600 text-sm mt-1">
                    {filter === 'today' 
                        ? 'No has tenido sesiones el día de hoy.' 
                        : 'Aún no tienes un historial de sesiones.'}
                </p>
             </div>
          ) : (
             <div className="space-y-3">
                {filteredSessions.map((session) => (
                   <div key={session.id} className="group bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900/80 p-5 rounded-2xl transition-all duration-300 flex flex-col md:flex-row gap-5 md:items-center">
                      
                      {/* Hora y Fecha */}
                      <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0 min-w-[100px] border-b md:border-b-0 md:border-r border-zinc-800/50 pb-3 md:pb-0 md:pr-5">
                         <span className="text-2xl font-light text-white tracking-tight">
                            {new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                         <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                            {new Date(session.created_at).toLocaleDateString([], {weekday: 'short', day: 'numeric'})}
                         </span>
                      </div>

                      {/* Info Principal */}
                      <div className="flex-1">
                         <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-500">
                                {session.patients ? session.patients.first_name[0] : '?'}
                             </div>
                             <h3 className="text-lg font-medium text-white">
                                {session.patients ? `${session.patients.first_name} ${session.patients.last_name}` : 'Paciente Desconocido'}
                             </h3>
                             {session.duration > 0 && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                                    {Math.round(session.duration / 60)} min
                                </span>
                             )}
                         </div>
                         <p className="text-sm text-zinc-400 font-light line-clamp-1 italic">
                            {session.notes || <span className="opacity-50">Sin notas registradas...</span>}
                         </p>
                      </div>

                      {/* Botón Acción */}
                      <button 
                        onClick={() => session.patients && onNavigateToPatient(session.patients.id)}
                        className="self-end md:self-center flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider hover:text-white hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all shrink-0 group/btn"
                      >
                         Ver Expediente <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform"/>
                      </button>

                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};