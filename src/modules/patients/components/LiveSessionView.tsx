// UBICACIÓN: src/modules/patients/components/LiveSessionView.tsx
import { useState, useEffect } from 'react';
import { 
  Zap, Moon, ShieldAlert, CheckSquare, 
  StopCircle, Brain, Pause, Play,
  MoreHorizontal, AlertTriangle, Activity, Repeat,
  ArrowLeft, FileClock, Tag
} from 'lucide-react';

interface LiveSessionViewProps {
  patientName: string;
  lastSessionContext: string;
  // Firma actualizada para aceptar timeline[]
  onFinish: (notes: string, duration: number, tags: string[], timeline: any[]) => void;
  onCancel: () => void;
  initialNotes?: string;
}

interface TimelineEvent {
  label: string;
  timestamp: number;
}

export const LiveSessionView = ({ patientName, lastSessionContext, onFinish, onCancel, initialNotes = '' }: LiveSessionViewProps) => {
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(true); 
  const [hasStarted, setHasStarted] = useState(false);
  
  // Notas
  const [notes, setNotes] = useState(initialNotes);
  const [sessionTitle, setSessionTitle] = useState(''); 
  const [selectedFocusTags, setSelectedFocusTags] = useState<string[]>([]);

  // Datos de la sesión
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [counters, setCounters] = useState({
    catarsis: 0, resistencia: 0, sueno: 0, tarea: 0,
    silencio: 0, lapsus: 0, crisis: 0, repeticion: 0
  });

  const [activeFlash, setActiveFlash] = useState<string | null>(null);

  // Lista de Etiquetas para Métricas
  const FOCUS_OPTIONS = [
    'Ansiedad', 'Depresión', 'Duelo', 'Pareja', 
    'Trauma', 'Autoestima', 'Estrés', 'Adicciones',
    'Familiar', 'Identidad', 'Laboral', 'Crisis',
    'Seguimiento', 'Evaluación', 'Cierre'
  ];

  useEffect(() => {
    let interval: any;
    if (!isPaused) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return { h, m, s };
  };
  const time = formatTime(seconds);

  const toggleFocusTag = (tag: string) => {
    if (selectedFocusTags.includes(tag)) setSelectedFocusTags(selectedFocusTags.filter(t => t !== tag));
    else setSelectedFocusTags([...selectedFocusTags, tag]);
  };

  const handleStart = () => {
    // Agregamos Header a las notas
    let header = '';
    if (sessionTitle.trim()) header += `TEMA: ${sessionTitle.toUpperCase()}\n`;
    if (selectedFocusTags.length > 0) header += `ENFOQUE: ${selectedFocusTags.join(', ')}\n`;
    
    if (header) {
        setNotes(header + '\n----------------------------------------\n\n' + notes);
    }
    
    setIsPaused(false);
    setHasStarted(true);
  };

  // Registrar Evento
  const handleRecordEvent = (id: keyof typeof counters, label: string) => {
    // 1. Contador visual
    setCounters(prev => ({ ...prev, [id]: prev[id] + 1 }));
    
    // 2. Línea de tiempo (JSON)
    setTimeline(prev => [...prev, { label, timestamp: seconds }]);
    
    // 3. Animación
    setActiveFlash(id);
    setTimeout(() => setActiveFlash(null), 200);
  };

  const handleFinish = () => {
    // Generar Resumen de Tags para métricas
    const counts: Record<string, number> = {};
    timeline.forEach(e => { counts[e.label] = (counts[e.label] || 0) + 1; });
    const metricTags = Object.entries(counts).map(([label, count]) => `${label} (${count})`);
    const finalTags = [...selectedFocusTags, ...metricTags];
    
    // Enviamos timeline separado de las notas
    onFinish(notes, seconds, finalTags, timeline);
  };

  const handleBack = () => {
    if (hasStarted && seconds > 10) {
        if (window.confirm("La sesión está en curso. ¿Deseas salir sin guardar?")) onCancel();
    } else {
        onCancel();
    }
  };

  const quickActions = [
    { id: 'catarsis', label: 'Catarsis', icon: Zap, color: 'text-amber-400', baseClass: 'hover:bg-amber-900/20 hover:border-amber-500/50', activeClass: 'bg-amber-500 text-black shadow-[0_0_50px_rgba(245,158,11,0.6)] scale-105 border-amber-400' },
    { id: 'resistencia', label: 'Resistencia', icon: ShieldAlert, color: 'text-red-500', baseClass: 'hover:bg-red-900/20 hover:border-red-500/50', activeClass: 'bg-red-600 text-white shadow-[0_0_50px_rgba(220,38,38,0.6)] scale-105 border-red-500' },
    { id: 'crisis', label: 'Crisis', icon: Activity, color: 'text-orange-500', baseClass: 'hover:bg-orange-900/20 hover:border-orange-500/50', activeClass: 'bg-orange-600 text-white shadow-[0_0_50px_rgba(249,115,22,0.6)] scale-105 border-orange-500' },
    { id: 'silencio', label: 'Silencio', icon: MoreHorizontal, color: 'text-cyan-400', baseClass: 'hover:bg-cyan-900/20 hover:border-cyan-500/50', activeClass: 'bg-cyan-500 text-black shadow-[0_0_50px_rgba(6,182,212,0.6)] scale-105 border-cyan-400' },
    { id: 'lapsus', label: 'Lapsus', icon: AlertTriangle, color: 'text-rose-400', baseClass: 'hover:bg-rose-900/20 hover:border-rose-500/50', activeClass: 'bg-rose-500 text-white shadow-[0_0_50px_rgba(244,63,94,0.6)] scale-105 border-rose-400' },
    { id: 'repeticion', label: 'Repetición', icon: Repeat, color: 'text-violet-400', baseClass: 'hover:bg-violet-900/20 hover:border-violet-500/50', activeClass: 'bg-violet-500 text-white shadow-[0_0_50px_rgba(139,92,246,0.6)] scale-105 border-violet-400' },
    { id: 'sueno', label: 'Sueño', icon: Moon, color: 'text-indigo-400', baseClass: 'hover:bg-indigo-900/20 hover:border-indigo-500/50', activeClass: 'bg-indigo-500 text-white shadow-[0_0_50px_rgba(99,102,241,0.6)] scale-105 border-indigo-400' },
    { id: 'tarea', label: 'Tarea', icon: CheckSquare, color: 'text-emerald-400', baseClass: 'hover:bg-emerald-900/20 hover:border-emerald-500/50', activeClass: 'bg-emerald-500 text-black shadow-[0_0_50px_rgba(16,185,129,0.6)] scale-105 border-emerald-400' },
  ];

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden animate-in fade-in duration-700 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none"></div>
      
      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6 border-b border-zinc-900/50 h-16 md:h-20 shrink-0">
        <div className="flex items-center gap-6">
           <button onClick={handleBack} className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
              <div className="p-2 rounded-full border border-zinc-800 bg-zinc-900/50 group-hover:border-zinc-600 transition-colors"><ArrowLeft size={18} /></div>
           </button>
           <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${!hasStarted ? 'bg-zinc-600' : (isPaused ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]')}`}></div>
              <div><h2 className="text-zinc-500 text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold">{!hasStarted ? 'Preparación' : (isPaused ? 'Pausa' : 'En Vivo')}</h2><h1 className="text-white text-base md:text-lg font-light tracking-wide">{patientName}</h1></div>
           </div>
        </div>
        {hasStarted && (
            <button onClick={() => setIsPaused(!isPaused)} className={`p-2 md:p-3 rounded-full border transition-all ${isPaused ? 'bg-emerald-950/30 border-emerald-900 text-emerald-500' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'}`}>
              {isPaused ? <Play size={18} fill="currentColor"/> : <Pause size={18} fill="currentColor"/>}
            </button>
        )}
      </div>

      {/* --- MODO PREPARACIÓN --- */}
      {!hasStarted && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-10 top-20 overflow-y-auto">
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* 1. Contexto Sesión Anterior */}
                <div className="space-y-4 animate-in slide-in-from-left-10 duration-700 md:col-span-1">
                    <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-xs font-bold">
                        <FileClock size={16} className="text-emerald-500"/>
                        Anteriormente
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl h-[400px] overflow-y-auto shadow-inner">
                        <p className="text-zinc-300 font-light leading-relaxed whitespace-pre-wrap text-sm">
                            {lastSessionContext}
                        </p>
                    </div>
                </div>

                {/* 2. Plan de Sesión */}
                <div className="space-y-6 animate-in slide-in-from-right-10 duration-700 md:col-span-2 flex flex-col">
                    <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-xs font-bold">
                        <Tag size={16} className="text-emerald-500"/>
                        Plan de Sesión
                    </div>
                    
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 space-y-6 flex-1">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Tema Principal / Título</label>
                            <input type="text" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} className="w-full bg-transparent border-b border-zinc-700 py-2 text-xl text-white font-light focus:outline-none focus:border-emerald-500 placeholder-zinc-700 transition-colors" placeholder="Ej. Seguimiento Duelo..." />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">Etiquetas de Métricas</label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {FOCUS_OPTIONS.map(tag => {
                                    const isSelected = selectedFocusTags.includes(tag);
                                    return (
                                        <button key={tag} onClick={() => toggleFocusTag(tag)} className={`px-3 py-2 rounded-lg text-xs border transition-all duration-300 ${isSelected ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}>{tag}</button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="pt-4 mt-auto">
                            <button onClick={handleStart} className="w-full group relative flex items-center justify-center gap-4 px-8 py-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                                <Play size={20} fill="currentColor" />
                                <span className="text-sm font-bold tracking-widest uppercase">Comenzar Sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODO EN VIVO --- */}
      <div className={`flex-1 flex flex-col items-center justify-center relative z-10 transition-all duration-700 min-h-[200px] ${!hasStarted ? 'opacity-0' : 'opacity-100'}`}>
         <div className="flex items-baseline gap-2 md:gap-6 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <span className="text-8xl md:text-[10rem] lg:text-[11rem] font-thin tracking-widest tabular-nums leading-none">{time.h}</span>
            <span className={`text-6xl md:text-8xl font-extralight mb-6 md:mb-10 ${isPaused ? 'text-zinc-600' : 'text-emerald-500 animate-pulse'}`}>:</span>
            <span className="text-8xl md:text-[10rem] lg:text-[11rem] font-thin tracking-widest tabular-nums leading-none">{time.m}</span>
            <span className={`text-6xl md:text-8xl font-extralight mb-6 md:mb-10 ${isPaused ? 'text-zinc-600' : 'text-emerald-500 animate-pulse'}`}>:</span>
            <span className="text-6xl md:text-[7rem] lg:text-[8rem] font-thin tracking-widest tabular-nums leading-none text-zinc-500">{time.s}</span>
         </div>
      </div>

      <div className={`relative z-10 bg-zinc-950 border-t border-zinc-900 p-4 flex flex-col gap-4 h-[60%] md:h-[55%] transition-all duration-700 ${!hasStarted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
         <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 overflow-y-auto">
            {quickActions.map((action) => {
               const count = counters[action.id as keyof typeof counters];
               const isFlashing = activeFlash === action.id;
               return (
                  <button key={action.id} onClick={() => handleRecordEvent(action.id as keyof typeof counters, action.label)} className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border transition-all duration-100 active:scale-[0.98] min-h-[90px] ${isFlashing ? action.activeClass : `bg-zinc-900/40 border-zinc-800 text-zinc-500 ${action.baseClass}`}`}>
                     <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[5rem] font-bold opacity-[0.03] select-none pointer-events-none">{count}</span>
                     <action.icon size={32} strokeWidth={1.5} className={`transition-colors duration-300 ${count > 0 ? action.color : 'text-zinc-600'} ${isFlashing ? 'text-current' : ''}`}/>
                     <span className={`text-[10px] uppercase tracking-[0.15em] font-bold ${count > 0 ? 'text-zinc-300' : 'text-zinc-600'}`}>{action.label}</span>
                     {count > 0 && <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-bold font-mono ${action.color}`}>{count}</div>}
                  </button>
               );
            })}
         </div>

         <div className="h-14 md:h-16 shrink-0 flex gap-4">
            <div className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center px-4 focus-within:border-emerald-900/50 focus-within:ring-1 focus-within:ring-emerald-900/30 transition-all">
               <Brain size={18} className="text-zinc-600 mr-3 shrink-0"/>
               <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-transparent border-none text-zinc-200 font-light focus:outline-none placeholder-zinc-600 text-sm" placeholder="Notas rápidas..." autoComplete="off"/>
            </div>
            <button onClick={handleFinish} className="h-full px-6 md:px-8 bg-red-950/20 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/50 transition-all flex items-center gap-2 group whitespace-nowrap">
               <StopCircle size={20} /><span className="hidden md:inline text-xs uppercase tracking-widest font-bold">Terminar</span>
            </button>
         </div>
      </div>
    </div>
  );
};