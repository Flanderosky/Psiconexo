// UBICACIÓN: src/modules/patients/components/SessionDetail.tsx
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, Save, 
  MoreHorizontal, FileText, Zap, ShieldAlert, 
  Activity, Repeat, AlertTriangle, CheckSquare, Moon,
  ChevronDown, ChevronUp} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface SessionDetailProps {
  sessionId: string;
  patientId: string;
  onBack: () => void;
}

export const SessionDetail = ({ sessionId, onBack }: SessionDetailProps) => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  // Estados de datos
  const [notes, setNotes] = useState('');
  const [timeline, setTimeline] = useState<any[]>([]);

  // Estado para controlar qué evento se está editando (índice del array)
  const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(null);

  useEffect(() => {
    if (sessionId && sessionId !== 'new') {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (data) {
      setSession(data);
      setNotes(data.notes || '');
      // Aseguramos que timeline sea un array
      setTimeline(Array.isArray(data.timeline) ? data.timeline : []); 
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    await supabase
      .from('sessions')
      .update({ 
          notes, 
          timeline // Guardamos la línea de tiempo con las descripciones editadas
      }) 
      .eq('id', sessionId);
    setLoading(false);
  };

  // Función para actualizar la descripción de un evento específico
  const updateEventDescription = (index: number, newDescription: string) => {
    const updatedTimeline = [...timeline];
    updatedTimeline[index] = {
        ...updatedTimeline[index],
        description: newDescription
    };
    setTimeline(updatedTimeline);
  };

  // Helper para iconos
  const getIconForEvent = (label: string) => {
    switch(label) {
        case 'Catarsis': return <Zap size={14} className="text-amber-500" />;
        case 'Resistencia': return <ShieldAlert size={14} className="text-red-500" />;
        case 'Crisis': return <Activity size={14} className="text-orange-500" />;
        case 'Silencio': return <MoreHorizontal size={14} className="text-cyan-500" />;
        case 'Lapsus': return <AlertTriangle size={14} className="text-rose-500" />;
        case 'Repetición': return <Repeat size={14} className="text-violet-500" />;
        case 'Sueño': return <Moon size={14} className="text-indigo-500" />;
        case 'Tarea': return <CheckSquare size={14} className="text-emerald-500" />;
        default: return <div className="w-2 h-2 bg-zinc-500 rounded-full" />;
    }
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading && !session) return <div className="p-10 text-center text-zinc-500">Cargando detalles...</div>;

  return (
    <div className="flex flex-col h-full bg-black animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
             <div className="flex items-center gap-3 mb-1">
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                    {session ? new Date(session.created_at).toLocaleDateString() : 'Hoy'}
                </span>
                {session?.duration && (
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                        {Math.floor(session.duration / 60)} min
                    </span>
                )}
             </div>
             <h1 className="text-white text-lg font-light tracking-wide">Detalle de Sesión</h1>
          </div>
        </div>
        
        <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all font-medium text-sm shadow-lg shadow-emerald-900/20"
        >
            <Save size={16} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
         
         {/* COLUMNA IZQUIERDA: NOTAS GENERALES */}
         <div className="lg:col-span-2 p-6 md:p-10 overflow-y-auto border-r border-zinc-900 relative">
            <div className="max-w-3xl mx-auto space-y-2">
                <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-xs font-bold mb-4">
                    <FileText size={16} className="text-emerald-500"/> Notas Clínicas & Observaciones
                </div>
                <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-[60vh] bg-transparent border-none text-zinc-300 font-serif text-lg leading-relaxed focus:outline-none focus:ring-0 resize-none placeholder-zinc-800"
                    placeholder="Escribe aquí los detalles profundos de la sesión..."
                />
            </div>
         </div>

         {/* COLUMNA DERECHA: LÍNEA DE TIEMPO INTERACTIVA */}
         <div className="lg:col-span-1 bg-zinc-950/50 p-6 overflow-y-auto border-l border-zinc-900">
            <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-xs font-bold mb-8 sticky top-0 bg-zinc-950/95 py-2 z-10 backdrop-blur">
                <Activity size={16} className="text-emerald-500"/> Cronología de Eventos
            </div>

            {timeline.length === 0 ? (
                <div className="text-center py-10 opacity-30">
                    <Activity size={40} className="mx-auto mb-3 text-zinc-500" strokeWidth={1} />
                    <p className="text-xs uppercase tracking-widest text-zinc-500">Sin eventos registrados</p>
                </div>
            ) : (
                <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:top-2 before:bottom-2 before:left-[23px] before:w-px before:bg-zinc-800">
                    {timeline.map((event, i) => {
                        const isExpanded = expandedEventIndex === i;
                        
                        return (
                            <div key={i} className="relative flex items-start gap-4 group">
                                {/* Timestamp */}
                                <span className="text-[10px] font-mono text-zinc-600 w-10 text-right shrink-0 pt-3 group-hover:text-zinc-400 transition-colors">
                                    {formatTime(event.timestamp)}
                                </span>
                                
                                {/* Punto en la línea */}
                                <div className={`relative z-10 w-2 h-2 rounded-full mt-3.5 border transition-all ${isExpanded ? 'bg-emerald-500 border-emerald-500 scale-125' : 'bg-zinc-900 border-zinc-700 group-hover:border-emerald-500'}`}></div>
                                
                                {/* Tarjeta del Evento (Expandible) */}
                                <div 
                                    onClick={() => setExpandedEventIndex(isExpanded ? null : i)}
                                    className={`flex-1 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                        isExpanded 
                                        ? 'bg-zinc-900 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
                                        : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
                                    }`}
                                >
                                    {/* Header de la Tarjeta */}
                                    <div className="px-3 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-black rounded-md border border-zinc-800">
                                                {getIconForEvent(event.label)}
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wide ${isExpanded ? 'text-emerald-100' : 'text-zinc-400'}`}>
                                                {event.label}
                                            </span>
                                        </div>
                                        {isExpanded ? <ChevronUp size={14} className="text-zinc-500"/> : <ChevronDown size={14} className="text-zinc-600"/>}
                                    </div>

                                    {/* Área de Edición (Solo si expandido) */}
                                    {isExpanded && (
                                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                                            <textarea
                                                value={event.description || ''}
                                                onChange={(e) => updateEventDescription(i, e.target.value)}
                                                className="w-full bg-black/40 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 placeholder-zinc-700 resize-none font-light"
                                                rows={3}
                                                placeholder={`Detalles sobre este momento de ${event.label}...`}
                                                autoFocus
                                            />
                                        </div>
                                    )}

                                    {/* Vista Previa (Si NO está expandido pero tiene texto) */}
                                    {!isExpanded && event.description && (
                                        <div className="px-3 pb-3 pt-0">
                                            <p className="text-[10px] text-zinc-500 line-clamp-1 italic pl-2 border-l-2 border-zinc-800">
                                                {event.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
         </div>

      </div>
    </div>
  );
};