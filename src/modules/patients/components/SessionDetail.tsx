// UBICACIÓN: src/modules/patients/components/SessionDetail.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Play, History, Loader2, Sparkles, 
  CheckCircle2, XCircle, Calendar, Tag, FileText,
  Pencil, Save, X} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// IMPORTACIONES NUEVAS
import { useSessionNotes, NoteType, Note } from '../hooks/useSessionNotes';
import { LiveSessionView } from './LiveSessionView';

const PREDEFINED_FOCUSES = ["Ansiedad", "Depresión", "Duelo", "Autoestima", "Relaciones", "Trauma", "Familia", "Trabajo", "Identidad", "Sueños", "Sexualidad", "Finanzas"];

interface SessionDetailProps {
  sessionId: string;
  patientId: string;
  onBack: () => void;
}

export const SessionDetail = ({ sessionId, patientId, onBack }: SessionDetailProps) => {
  // --- ESTADOS PRINCIPALES ---
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId === 'new' ? null : sessionId);
  const [loading, setLoading] = useState(sessionId !== 'new');
  const [sessionStatus, setSessionStatus] = useState<'scheduled' | 'in_progress' | 'wrapping_up' | 'completed'>('scheduled');
  
  // --- HOOK DE NOTAS (Conecta con la lógica de base de datos) ---
  const { notes, addNote, updateNote, refreshNotes } = useSessionNotes(currentSessionId);

  // Estados de Datos
  const [lastSessionSummary, setLastSessionSummary] = useState<string>('');
  const [currentSummary, setCurrentSummary] = useState<string>('');
  const [activeFocuses, setActiveFocuses] = useState<string[]>([]);
  const [finalDuration, setFinalDuration] = useState(0);
  const [sessionDate, setSessionDate] = useState<string>('');

  // Edición de Notas
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState('');

  // Timer
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  
  // Toast
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  // --- INIT ---
  useEffect(() => {
    const init = async () => {
      // 1. Cargar contexto anterior
      await fetchLastSessionContext();

      // 2. Si ya existe la sesión, cargar sus datos
      if (currentSessionId && currentSessionId !== 'new') {
        const { data } = await supabase.from('sessions').select('*').eq('id', currentSessionId).single();
        
        if (data) {
          setSessionDate(data.date);
          if (data.tags) setActiveFocuses(data.tags);
          
          if (data.status === 'completed') {
            setSessionStatus('completed');
            setFinalDuration(data.duration || 0);
            setCurrentSummary(data.summary || '');
          } else if (data.status === 'in_progress') {
            setSessionStatus('in_progress');
            startTimer();
          } else {
            setSessionStatus('scheduled');
          }
        }
        // Cargar notas con el hook
        refreshNotes();
      }
      setLoading(false);
    };
    init();
    return () => stopTimer();
  }, [currentSessionId]);

  // --- LOGIC ---
  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLastSessionContext = async () => {
    // CORRECCIÓN CRÍTICA: Evitar el error "neq."
    let query = supabase
      .from('sessions')
      .select('summary')
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .limit(1);

    // Solo excluimos el ID actual si es un UUID válido (no es null ni 'new')
    if (currentSessionId && currentSessionId.length > 10) {
      query = query.neq('id', currentSessionId);
    }

    const { data } = await query.single();
    if (data) setLastSessionSummary(data.summary || '');
  };

  const startTimer = () => { timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000); };
  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- ACTIONS ---
  const handleStartSession = async () => {
    let activeId = currentSessionId;
    
    // Si no hay ID, creamos la sesión
    if (!activeId || activeId === 'new') {
      const { data, error } = await supabase.from('sessions').insert([{ 
          patient_id: patientId, 
          date: new Date().toISOString(), 
          status: 'in_progress', 
          summary: 'Iniciando...', 
          tags: activeFocuses 
      }]).select().single();
      
      if (error) {
          showToast('Error al crear sesión', 'error');
          return;
      }
      activeId = data.id;
      setCurrentSessionId(activeId);
    } else {
      // Si ya existía, actualizamos
      await supabase.from('sessions').update({ status: 'in_progress', tags: activeFocuses }).eq('id', activeId);
    }
    
    setSessionStatus('in_progress');
    startTimer();
  };

  const handleConfirmEnd = async (summaryText: string) => {
    if (!currentSessionId) return;
    const duration = Math.ceil(seconds / 60);
    
    const { error } = await supabase.from('sessions').update({ 
        status: 'completed', 
        duration, 
        summary: summaryText, 
        tags: activeFocuses 
    }).eq('id', currentSessionId);

    if (error) {
        showToast('Error al finalizar', 'error');
        return;
    }

    setFinalDuration(duration);
    setCurrentSummary(summaryText);
    setSessionStatus('completed');
  };

  // --- MANEJO DE NOTAS ---
  const handleWrapperAddNote = async (content: string, type: NoteType) => {
      const timestamp = formatTime(seconds);
      // addNote ahora devuelve true/false
      return await addNote(content, type, timestamp);
  };

  const handleSaveEdit = async () => {
    if (editingNote) {
      const success = await updateNote(editingNote.id, editContent);
      if (success) {
        setEditingNote(null);
        showToast('Nota actualizada', 'success');
      } else {
        showToast('Error al actualizar', 'error');
      }
    }
  };

  // --- HELPERS VISUALES ---
  const getTypeColor = (type: NoteType) => {
    switch (type) {
        case 'dream': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
        case 'insight': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
        case 'resistance': return 'text-red-400 border-red-500/30 bg-red-500/10';
        case 'homework': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        default: return 'text-zinc-300 border-zinc-800 bg-zinc-900';
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-black"><Loader2 className="animate-spin text-emerald-500"/></div>;

  // --- VISTA 1: SALA DE ESPERA ---
  if (sessionStatus === 'scheduled') {
    return (
      <div className="flex flex-col h-full w-full bg-black relative animate-in fade-in">
        <div className="absolute top-6 left-6 z-10">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white border border-zinc-800"><ArrowLeft size={18} /> Volver</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-6">
          <div className="mb-10 text-center"><div className="text-[120px] font-thin text-zinc-200 tabular-nums">{formatTime(seconds)}</div><p className="text-zinc-500 text-lg">Sala de Espera</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
             <div className="space-y-3"><h3 className="text-xs uppercase tracking-widest font-bold text-emerald-500 flex items-center gap-2"><History size={16}/> Contexto Previo</h3><div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl min-h-[120px]"><p className="text-zinc-300 text-sm italic">"{lastSessionSummary || 'Sin registro previo.'}"</p></div></div>
             <div className="space-y-3"><h3 className="text-xs uppercase tracking-widest font-bold text-blue-500 flex items-center gap-2"><Sparkles size={16}/> Focos para Hoy</h3><div className="flex flex-wrap gap-2 content-start">{PREDEFINED_FOCUSES.map(focus => (<button key={focus} onClick={() => setActiveFocuses(prev => prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus])} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeFocuses.includes(focus) ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>{focus}</button>))}</div></div>
          </div>
          <button onClick={handleStartSession} className="group flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg hover:scale-105 transition-all"><Play fill="currentColor" size={24} /> <span className="text-lg font-medium">Comenzar Sesión</span></button>
        </div>
        {toast && <div className={`absolute top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200' : 'bg-red-950/90 border-red-800 text-red-200'}`}>{toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}<span className="text-sm font-medium">{toast.message}</span></div>}
      </div>
    );
  }

  // --- VISTA 2: LIVE SESSION (Modo Foco) ---
  if (sessionStatus === 'in_progress') {
    return (
      <LiveSessionView 
        timerDisplay={formatTime(seconds)}
        onStop={() => { stopTimer(); setSessionStatus('wrapping_up'); }}
        onAddNote={handleWrapperAddNote}
      />
    );
  }

  // --- VISTA 3: CIERRE ---
  if (sessionStatus === 'wrapping_up') {
      return (
        <div className="h-full w-full bg-black flex items-center justify-center relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 blur-sm pointer-events-none"><div className="text-[140px] font-thin text-white">{formatTime(seconds)}</div></div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-8 relative z-10 animate-in zoom-in-95">
              <h2 className="text-2xl font-bold text-white mb-2">Resumen de Sesión</h2>
              <div className="space-y-6">
                 <div><label className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-2 block">Temas tratados</label><div className="flex flex-wrap gap-2">{activeFocuses.map(f => <span key={f} className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm">{f}</span>)}</div></div>
                 <div><label className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-2 block">Nota final</label><textarea className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-emerald-500/50 outline-none resize-none h-32" placeholder="Resumen breve..." id="finalSummaryInput"></textarea></div>
                 <div className="flex gap-4 pt-2">
                    <button onClick={() => { startTimer(); setSessionStatus('in_progress'); }} className="flex-1 py-4 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 font-medium transition-colors">Continuar</button>
                    <button onClick={() => { const val = (document.getElementById('finalSummaryInput') as HTMLTextAreaElement).value; handleConfirmEnd(val || 'Sesión finalizada.'); }} className="flex-1 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition-colors">Guardar</button>
                 </div>
              </div>
           </div>
        </div>
      );
  }

  // --- VISTA 4: COMPLETADO (LECTURA + EDICIÓN) ---
  return (
        <div className="flex flex-col h-full w-full bg-black relative animate-in fade-in overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 z-10 shrink-0">
                <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={20} /> Volver</button>
                <div className="flex items-center gap-2 text-zinc-500 text-sm"><Calendar size={16} /><span>{sessionDate ? new Date(sessionDate).toLocaleDateString() : 'Fecha desconocida'}</span></div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6 md:p-10 w-full space-y-10">
                    <div className="flex flex-col items-center justify-center pt-4 pb-8 border-b border-zinc-800/50">
                        <span className="text-zinc-500 text-xs uppercase tracking-widest mb-2 font-semibold">Duración Total</span>
                        <div className="text-7xl md:text-8xl font-thin tracking-tighter text-white tabular-nums flex items-baseline gap-2">{finalDuration} <span className="text-xl md:text-2xl text-zinc-600 font-normal">min</span></div>
                        <div className="flex gap-2 mt-6">{activeFocuses.map(f => (<span key={f} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300 flex items-center gap-1.5"><Tag size={12} /> {f}</span>))}</div>
                    </div>
                    
                    {/* RESUMEN EXPANDIDO */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
                        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-6 flex items-center gap-2"><FileText size={18} /> Expediente Clínico</h3>
                        <div className="prose prose-invert max-w-none"><p className="whitespace-pre-wrap text-base text-zinc-300">{currentSummary || 'Sin resumen registrado.'}</p></div>
                    </div>
                    
                    {/* BITÁCORA */}
                    <div className="pt-8">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-8 flex items-center gap-2 border-b border-zinc-800 pb-2"><History size={16}/> Bitácora de Eventos</h3>
                        {notes.length === 0 ? <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-600 italic">No se registraron eventos rápidos.</div> : (
                            <div className="relative border-l border-zinc-800 ml-4 space-y-8 pb-4">
                                {notes.map((note) => (
                                    <div key={note.id} className="relative pl-8 group">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 group-hover:bg-emerald-500 transition-colors border border-black"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                                                <span className="text-xs font-mono text-zinc-500">{note.session_timestamp || '00:00'}</span>
                                                {note.type !== 'general' && <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${note.type === 'dream' ? 'bg-purple-900/30 text-purple-400' : note.type === 'insight' ? 'bg-amber-900/30 text-amber-400' : note.type === 'resistance' ? 'bg-red-900/30 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>{note.type}</span>}
                                            </div>
                                            <button onClick={() => { setEditingNote(note); setEditContent(note.content); }} className="p-1.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded transition-colors opacity-0 group-hover:opacity-100" title="Editar nota"><Pencil size={14} /></button>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${getTypeColor(note.type)}`}><p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-200">{note.content}</p></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL EDITAR NOTA */}
            {editingNote && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                  <button onClick={() => setEditingNote(null)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Pencil className="text-emerald-500" size={20}/>Editar Evento</h2>
                  <div className="space-y-4">
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 h-32 resize-none"></textarea>
                    <div className="flex gap-3"><button onClick={() => setEditingNote(null)} className="flex-1 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 font-medium transition-colors">Cancelar</button><button onClick={handleSaveEdit} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center justify-center gap-2"><Save size={18}/> Guardar</button></div>
                  </div>
                </div>
              </div>
            )}
            {toast && <div className={`absolute top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200' : 'bg-red-950/90 border-red-800 text-red-200'}`}>{toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}<span className="text-sm font-medium">{toast.message}</span></div>}
        </div>
     );
};