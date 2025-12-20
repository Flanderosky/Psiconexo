// UBICACIÓN: src/modules/patients/components/SessionDetail.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // 3 niveles atrás

interface Note {
  id: string;
  content: string;
  type: 'text' | 'observation' | 'analysis' | 'homework';
  created_at: string;
}

interface SessionDetailProps {
  sessionId: string;
  onBack: () => void;
}

export const SessionDetail = ({ sessionId, onBack }: SessionDetailProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchNotes();
  }, [sessionId]);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (data) setNotes(data);
    setLoading(false);
  };

  const handleSendNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newNote = {
      session_id: sessionId,
      content: inputText,
      type: 'text'
    };

    const { error } = await supabase.from('session_notes').insert([newNote]);
    
    if (!error) {
      setInputText('');
      fetchNotes();
    }
  };

  // CORRECCIÓN VISUAL: Usamos h-full y flex-col para ocupar el espacio exacto disponible
  return (
    <div className="flex flex-col h-full w-full bg-zinc-950/30 rounded-xl overflow-hidden"> 
      
      {/* Header Fijo */}
      <div className="flex items-center gap-4 p-4 border-b border-zinc-800 bg-zinc-950/50">
        <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-semibold text-white">Sesión Activa</h2>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
             <span className="flex items-center gap-1"><Clock size={12}/> 50 min</span>
             <span className="text-emerald-500">• En curso</span>
          </div>
        </div>
      </div>

      {/* Área de Chat (Flexible - ocupa el espacio sobrante) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700">
        {loading ? (
            <p className="text-zinc-500 text-center mt-10">Cargando notas...</p>
        ) : notes.length === 0 ? (
            <div className="text-center mt-20 text-zinc-600 flex flex-col items-center">
                <Clock className="mb-2 opacity-20" size={40} />
                <p>Comienza a escribir notas...</p>
            </div>
        ) : (
            notes.map((note) => (
            <div key={note.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg max-w-3xl animate-in slide-in-from-bottom-2">
                <p className="text-zinc-300 text-sm whitespace-pre-wrap">{note.content}</p>
                <span className="text-[10px] text-zinc-600 mt-2 block uppercase tracking-wider">
                  {new Date(note.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {note.type}
                </span>
            </div>
            ))
        )}
      </div>

      {/* Input Fijo al fondo */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950">
        <form onSubmit={handleSendNote} className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe una observación, nota o análisis..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-zinc-200 focus:outline-none focus:border-emerald-500/50 shadow-lg text-sm"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};