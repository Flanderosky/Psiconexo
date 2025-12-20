// UBICACIÓN: src/modules/patients/components/SessionList.tsx
import { useState, useEffect } from 'react';
import { Calendar, Plus, ChevronRight, Activity } from 'lucide-react';
// CORRECCIÓN AQUÍ: 3 niveles (../../..)
import { supabase } from '../../../lib/supabase';

interface Session {
  id: string;
  date: string;
  mood: string;
  summary: string;
}

interface SessionListProps {
  patientId: string;
  onSelectSession: (sessionId: string) => void;
}

export const SessionList = ({ patientId, onSelectSession }: SessionListProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false });
      
      if (data) setSessions(data);
      setLoading(false);
    };
    fetchSessions();
  }, [patientId]);

  const handleNewSession = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .insert([{ 
        patient_id: patientId,
        mood: 'stable',
        summary: 'Nueva sesión iniciada' 
      }])
      .select()
      .single();

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    if (data) {
      onSelectSession(data.id);
    }
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
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Nueva Sesión
        </button>
      </div>

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
            No hay sesiones registradas. Inicia la primera.
          </div>
        ) : (
          sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className="group bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-emerald-500/30 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="font-medium text-zinc-200">
                    {new Date(session.date).toLocaleDateString()}
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