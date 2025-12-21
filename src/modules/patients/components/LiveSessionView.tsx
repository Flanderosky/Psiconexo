// UBICACIÓN: src/modules/patients/components/LiveSessionView.tsx
import React, { useState } from 'react';
import { 
  Send, StopCircle, Brain, Star, Shield, 
  BookOpen, CheckCircle2, XCircle 
} from 'lucide-react';
import { NoteType } from '../hooks/useSessionNotes'; // Importamos tipos del hook

interface LiveSessionProps {
  timerDisplay: string; // "00:00"
  onStop: () => void;
  onAddNote: (content: string, type: NoteType) => Promise<boolean>; // Función que viene del padre
}

export const LiveSessionView = ({ timerDisplay, onStop, onAddNote }: LiveSessionProps) => {
  const [inputText, setInputText] = useState('');
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Helper para mostrar notificaciones internas
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  // Manejador para botones rápidos
  const handleQuickTag = async (type: NoteType, label: string) => {
    const success = await onAddNote(label, type); // Guardamos solo la etiqueta inicialmente
    if (success) showToast(`${label} registrado`, 'success');
    else showToast('Error al guardar', 'error');
  };

  // Manejador para input de texto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const success = await onAddNote(inputText, 'general');
    if (success) {
      setInputText('');
      showToast('Nota guardada', 'success');
    }
  };

  // Estilos de botones
  const getTypeStyles = (type: NoteType) => {
    switch (type) {
      case 'dream': return 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20';
      case 'insight': return 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20';
      case 'resistance': return 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20';
      case 'homework': return 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20';
      default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black relative animate-in fade-in duration-700">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/20 to-black pointer-events-none"></div>
      
      {/* Botón Detener Flotante */}
      <div className="absolute top-6 right-6 z-20">
         <button onClick={onStop} className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 backdrop-blur border border-red-900/30 text-red-400 rounded-full text-sm font-medium hover:bg-red-950/50 transition-colors">
           <StopCircle size={16} /> Detener
         </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-6 z-10">
         
         {/* RELOJ GIGANTE */}
         <div className="mb-16 text-center">
            <div className="text-[140px] md:text-[180px] leading-none font-extralight tracking-tighter text-white tabular-nums drop-shadow-2xl select-none">
              {timerDisplay}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 opacity-50">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-sm text-zinc-400 uppercase tracking-widest">En curso</span>
            </div>
         </div>

         {/* BOTONERA TÁCTIL */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-12">
            <button onClick={() => handleQuickTag('insight', 'Insight')} className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-transform active:scale-95 ${getTypeStyles('insight')}`}>
               <Star size={28} /> <span className="text-sm font-bold uppercase tracking-wider">Insight</span>
            </button>
            <button onClick={() => handleQuickTag('dream', 'Sueño')} className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-transform active:scale-95 ${getTypeStyles('dream')}`}>
               <Brain size={28} /> <span className="text-sm font-bold uppercase tracking-wider">Sueño</span>
            </button>
            <button onClick={() => handleQuickTag('resistance', 'Resistencia')} className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-transform active:scale-95 ${getTypeStyles('resistance')}`}>
               <Shield size={28} /> <span className="text-sm font-bold uppercase tracking-wider">Resistencia</span>
            </button>
            <button onClick={() => handleQuickTag('homework', 'Tarea')} className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-transform active:scale-95 ${getTypeStyles('homework')}`}>
               <BookOpen size={28} /> <span className="text-sm font-bold uppercase tracking-wider">Tarea</span>
            </button>
         </div>

         {/* INPUT DISCRETO */}
         <div className="w-full max-w-xl">
            <form onSubmit={handleSubmit} className="relative group">
               <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribir nota rápida..." 
                  className="w-full bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-full pl-6 pr-12 py-4 text-zinc-300 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all text-center placeholder-zinc-600 focus:text-left focus:placeholder-zinc-700"
               />
               <button type="submit" disabled={!inputText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <Send size={16} />
               </button>
            </form>
         </div>
      </div>

      {/* TOAST INTERNO */}
      {toast && (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' : 'bg-red-950/80 border-red-800 text-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}
    </div>
  );
};