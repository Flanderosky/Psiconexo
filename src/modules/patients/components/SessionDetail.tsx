// UBICACIÓN: src/modules/patients/components/SessionDetail.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Send, StopCircle, Play, 
  Brain, Star, Shield, BookOpen, 
  History, Loader2, Quote, Sparkles, 
  Tag, XCircle, CheckCircle2 // Iconos para las notificaciones
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// --- CONSTANTES ---
const PREDEFINED_FOCUSES = [
  "Ansiedad", "Depresión", "Duelo", "Autoestima", 
  "Relaciones", "Trauma", "Familia", "Trabajo", 
  "Identidad", "Sueños", "Sexualidad", "Finanzas"
];

type NoteType = 'general' | 'dream' | 'insight' | 'resistance' | 'homework';

interface Note {
  id: string;
  content: string;
  type: NoteType;
  created_at: string;
  session_timestamp?: string;
}

interface SessionDetailProps {
  sessionId: string;
  patientId: string;
  onBack: () => void;
}

export const SessionDetail = ({ sessionId, patientId, onBack }: SessionDetailProps) => {
  // --- ESTADOS ---
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId === 'new' ? null : sessionId);
  const [loading, setLoading] = useState(sessionId !== 'new');
  
  // Estados de flujo
  const [sessionStatus, setSessionStatus] = useState<'scheduled' | 'in_progress' | 'wrapping_up' | 'completed'>('scheduled');
  
  // Datos
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedType, setSelectedType] = useState<NoteType>('general');
  const [lastSessionSummary, setLastSessionSummary] = useState<string>('');
  const [activeFocuses, setActiveFocuses] = useState<string[]>([]);

  // Cronómetro
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number | null>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);

  // --- NUEVO: SISTEMA DE NOTIFICACIONES (TOAST) ---
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); // Desaparece en 4 segundos
  };

  // --- CARGA INICIAL ---
  useEffect(() => {
    const init = async () => {
      await fetchLastSessionContext();
      
      if (currentSessionId) {
        const { data: sessionData, error } = await supabase
          .from('sessions')
          .select('status, duration, summary')
          .eq('id', currentSessionId)
          .single();

        if (error) {
          console.error("Error fetching session:", error);
          // No bloqueamos, pero avisamos en consola
        }

        if (sessionData) {
          if (sessionData.status === 'completed') {
            setSessionStatus('completed');
            setSeconds((sessionData.duration || 0) * 60);
          } else if (sessionData.status === 'in_progress') {
            setSessionStatus('in_progress');
            startTimer();
          } else {
            setSessionStatus('scheduled');
          }
        }
        await fetchNotes(currentSessionId);
      }
      setLoading(false);
    };
    
    init();
    return () => stopTimer();
  }, [currentSessionId]);

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes]);

  // --- HELPERS DB ---
  const fetchLastSessionContext = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('summary')
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .neq('id', currentSessionId || '')
      .order('date', { ascending: false })
      .limit(1)
      .single();
    if (data) setLastSessionSummary(data.summary || '');
  };

  const fetchNotes = async (id: string) => {
    const { data } = await supabase.from('session_notes').select('*').eq('session_id', id).order('created_at', { ascending: true });
    if (data) setNotes(data as any);
  };

  // --- TIMER ---
  const startTimer = () => {
    if (sessionStatus === 'completed') return;
    setIsActive(true);
    timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const stopTimer = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- ACCIONES ---
  const handleStartSession = async () => {
    let activeId = currentSessionId;

    try {
      if (!activeId) {
        // Crear nueva sesión
        const { data, error } = await supabase.from('sessions').insert([{ 
            patient_id: patientId,
            date: new Date().toISOString(),
            status: 'in_progress', 
            summary: 'Iniciando...' 
          }]).select().single();
        
        if (error) throw error;
        activeId = data.id;
        setCurrentSessionId(activeId);
      } else {
        // Actualizar existente
        const { error } = await supabase.from('sessions').update({ status: 'in_progress' }).eq('id', activeId);
        if (error) throw error;
      }
      
      setSessionStatus('in_progress');
      startTimer();
      showToast('Sesión iniciada correctamente', 'success');

    } catch (err: any) {
      console.error(err);
      // REEMPLAZO DE ALERT POR TOAST
      showToast(`Error al iniciar: ${err.message || 'Error de conexión'}`, 'error');
    }
  };

  const handleRequestStop = () => {
    stopTimer();
    setSessionStatus('wrapping_up');
  };

  const handleConfirmEnd = async (finalSummary: string) => {
    if (!currentSessionId) return;

    try {
      setLoading(true);
      const fullSummary = activeFocuses.length > 0 
        ? `[Focos: ${activeFocuses.join(', ')}] \n${finalSummary}`
        : finalSummary;

      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: 'completed',           
          duration: Math.ceil(seconds / 60), 
          summary: fullSummary           
        })
        .eq('id', currentSessionId);     

      if (error) throw error;

      onBack();
    } catch (err: any) {
      setLoading(false);
      // REEMPLAZO DE ALERT POR TOAST
      showToast('No se pudo guardar la sesión. Intenta de nuevo.', 'error');
    }
  };

  const handleSendNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !currentSessionId) return;
    
    const newNote = {
      session_id: currentSessionId,
      content: inputText,
      type: selectedType,
      session_timestamp: formatTime(seconds)
    };
    
    const tempId = Math.random().toString();
    setNotes([...notes, { ...newNote, id: tempId, created_at: new Date().toISOString() } as any]);
    setInputText('');
    
    const { error } = await supabase.from('session_notes').insert([newNote]);
    if (error) {
       showToast('Error al guardar nota', 'error');
    }
  };

  const toggleFocus = (focus: string) => {
    activeFocuses.includes(focus) 
      ? setActiveFocuses(activeFocuses.filter(f => f !== focus))
      : setActiveFocuses([...activeFocuses, focus]);
  };

  const getTypeColor = (type: NoteType) => {
    switch (type) {
      case 'dream': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'insight': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'resistance': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'homework': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      default: return 'text-zinc-300 border-zinc-800 bg-zinc-900';
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500"/></div>;

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden relative">
      
      {/* --- RENDERIZADO CONDICIONAL DE VISTAS --- */}

      {/* VISTA 1: SALA DE ESPERA */}
      {sessionStatus === 'scheduled' && (
        <div className="flex flex-col h-full w-full bg-black relative animate-in fade-in">
          <div className="absolute top-6 left-6 z-10">
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white border border-zinc-800">
              <ArrowLeft size={18} /> <span className="text-sm">Volver</span>
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-6">
            <div className="mb-10 text-center">
              <div className="text-[120px] leading-none font-extralight tracking-tighter text-zinc-200 tabular-nums">
                {formatTime(seconds)}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
              <div className="space-y-3">
                 <h3 className="text-xs uppercase tracking-widest font-bold text-emerald-500 flex items-center gap-2"><History size={16}/> Contexto Previo</h3>
                 <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl min-h-[120px]">
                    <p className="text-zinc-300 text-sm italic">"{lastSessionSummary || 'Sin registro previo.'}"</p>
                 </div>
              </div>
              <div className="space-y-3">
                 <h3 className="text-xs uppercase tracking-widest font-bold text-blue-500 flex items-center gap-2"><Sparkles size={16}/> Focos para Hoy</h3>
                 <div className="flex flex-wrap gap-2 content-start">
                    {PREDEFINED_FOCUSES.map(focus => (
                      <button key={focus} onClick={() => toggleFocus(focus)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeFocuses.includes(focus) ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>{focus}</button>
                    ))}
                 </div>
              </div>
            </div>
            <button onClick={handleStartSession} className="group flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg hover:scale-105 transition-all">
              <Play fill="currentColor" size={24} /> <span className="text-lg font-medium">Comenzar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* VISTA 2: SESIÓN ACTIVA / CIERRE */}
      {(sessionStatus === 'in_progress' || sessionStatus === 'wrapping_up' || sessionStatus === 'completed') && (
        <>
          <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-800">
                 <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className="font-mono text-xl font-medium tracking-widest text-white">{formatTime(seconds)}</span>
              </div>
              <div className="hidden md:flex gap-2">
                {activeFocuses.map(f => <span key={f} className="text-[10px] px-2 py-1 bg-zinc-900 text-zinc-400 rounded border border-zinc-800">{f}</span>)}
              </div>
            </div>
            {sessionStatus !== 'wrapping_up' && sessionStatus !== 'completed' && (
              <button onClick={handleRequestStop} className="flex items-center gap-2 px-5 py-2 bg-zinc-900 border border-red-900/30 hover:bg-red-950/50 text-red-400 rounded-lg font-medium transition-colors">
                <StopCircle size={18} /> Pausar / Terminar
              </button>
            )}
            {sessionStatus === 'completed' && (
                <button onClick={onBack} className="flex items-center gap-2 px-5 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg font-medium transition-colors">
                 <ArrowLeft size={18} /> Volver
              </button>
            )}
          </header>

          <div className="flex-1 flex overflow-hidden relative">
            <main className="flex-1 flex flex-col relative bg-black">
               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {notes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-800 space-y-4 select-none">
                       <Quote size={48} strokeWidth={1} />
                       <p className="font-light text-lg">Sesión en curso</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="group flex gap-4 animate-in slide-in-from-bottom-2">
                         <div className="w-12 text-right pt-3">
                            <span className="text-[10px] font-mono text-zinc-600 block">{note.session_timestamp}</span>
                         </div>
                         <div className={`flex-1 p-3.5 rounded-2xl border ${getTypeColor(note.type)}`}>
                            <p className="text-sm whitespace-pre-wrap text-zinc-200">{note.content}</p>
                         </div>
                      </div>
                    ))
                  )}
                  <div ref={notesEndRef} />
               </div>
               {sessionStatus === 'in_progress' && (
                 <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                    <form onSubmit={handleSendNote} className="max-w-4xl mx-auto flex flex-col gap-3">
                       <div className="relative">
                          <input autoFocus type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Nota rápida..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-5 pr-12 py-4 text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-all"/>
                          <button type="submit" disabled={!inputText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-lg"><Send size={18} /></button>
                       </div>
                    </form>
                 </div>
               )}
            </main>
          </div>
        </>
      )}

      {/* OVERLAY DE CIERRE */}
      {sessionStatus === 'wrapping_up' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-6 animate-in fade-in">
           <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-8 relative">
              <h2 className="text-2xl font-bold text-white mb-2">Resumen de Sesión</h2>
              <p className="text-zinc-500 mb-6">El tiempo se ha detenido en <span className="text-white font-mono">{formatTime(seconds)}</span>.</p>
              <div className="space-y-6">
                 <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-2 block">Temas tratados</label>
                    <div className="flex flex-wrap gap-2">
                       {activeFocuses.length > 0 ? activeFocuses.map(f => <span key={f} className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm">{f}</span>) : <span className="text-zinc-600 text-sm italic">Sin temas específicos.</span>}
                    </div>
                 </div>
                 <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-2 block">Nota final / Conclusiones</label>
                    <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-emerald-500/50 outline-none resize-none h-32" placeholder="Resumen breve..." id="finalSummaryInput"></textarea>
                 </div>
                 <div className="flex gap-4 pt-2">
                    <button onClick={() => { startTimer(); setSessionStatus('in_progress'); }} className="flex-1 py-4 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 font-medium transition-colors">Continuar Sesión</button>
                    <button 
                       onClick={() => {
                          const val = (document.getElementById('finalSummaryInput') as HTMLTextAreaElement).value;
                          handleConfirmEnd(val || 'Sesión finalizada.');
                       }}
                       className="flex-1 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition-colors"
                    >
                       Guardar y Finalizar
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- SISTEMA DE TOAST (NOTIFICACIONES) --- */}
      {toast && (
        <div className={`absolute top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-top-4 border ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200' : 'bg-red-950/90 border-red-800 text-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

    </div>
  );
};