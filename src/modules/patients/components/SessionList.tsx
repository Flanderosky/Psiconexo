// UBICACIÓN: src/modules/patients/components/SessionList.tsx
import { useState, useEffect } from 'react';
import { Calendar, Plus, ChevronRight, Activity } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Session {
  id: string;
  date: string;
  mood: string; // Puede que no se use aún, pero lo mantenemos por compatibilidad
  summary: string;
  status?: string;
}

interface SessionListProps {
  patientId: string;
  onSelectSession: (sessionId: string) => void;
}

export const SessionList = ({ patientId, onSelectSession }: SessionListProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar historial de sesiones anteriores
  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', patientId)
        // Opcional: Si quieres ver todas (agendadas y completadas) quita el filtro,
        // o filtra para ver solo las pasadas. Aquí traemos todas.
        .order('date', { ascending: false }); 
      
      if (data) setSessions(data);
      setLoading(false);
    };
    fetchSessions();
  }, [patientId]);

  // 2. Nueva Sesión (Lógica Lazy / Perezosa)
  // CAMBIO IMPORTANTE: Ya no hacemos insert aquí. 
  // Solo pasamos el string 'new' para que SessionDetail se encargue después.
  const handleNewSession = () => {
    onSelectSession('new');
  };

  if (loading) return <div className="p-4 text-zinc-500">Cargando historial...</div>;

  return (
    <div className="animate-in fade-in space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Calendar className="text-emerald-400" size={20} /> Historial de Sesiones
        </h3>
        <button 
          onClick={handleNewSession}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-emerald-900/20"
        >
          <Plus size={16} /> Nueva Sesión
        </button>
      </div>

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500 bg-zinc-900/50">
            <Activity className="mx-auto mb-3 opacity-20" size={32} />
            <p>No hay sesiones registradas.</p>
            <p className="text-sm opacity-60">Inicia la primera sesión para comenzar el historial.</p>
          </div>
        ) : (
          sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className="group bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-emerald-500/30 cursor-pointer transition-all flex items-center justify-between hover:bg-zinc-800"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    session.status === 'scheduled' 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : 'bg-zinc-800 text-zinc-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400'
                }`}>
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-zinc-200 flex items-center gap-2">
                    {new Date(session.date).toLocaleDateString()}
                    {session.status === 'scheduled' && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider">Agendada</span>
                    )}
                  </h4>
                  <p className="text-sm text-zinc-500 truncate max-w-md">
                    {session.summary || 'Sin resumen...'}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-zinc-600 group-hover:text-emerald-500 transition-colors" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};