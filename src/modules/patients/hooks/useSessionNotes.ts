// UBICACIÓN: src/modules/patients/hooks/useSessionNotes.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export type NoteType = 'general' | 'dream' | 'insight' | 'resistance' | 'homework';

export interface Note {
  id: string;
  content: string;
  type: NoteType;
  created_at: string;
  session_timestamp?: string;
  session_id: string;
}

export const useSessionNotes = (sessionId: string | null) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // 1. CARGAR NOTAS
  const fetchNotes = useCallback(async () => {
    if (!sessionId || sessionId === 'new') return;
    
    setLoadingNotes(true);
    try {
      const { data, error } = await supabase
        .from('session_notes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setNotes(data as Note[]);
    } catch (err) {
      console.error("Error cargando notas:", err);
    } finally {
      setLoadingNotes(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // 2. CREAR NOTA (CORREGIDO: Devuelve true si funciona)
  const addNote = async (content: string, type: NoteType, timestamp: string) => {
    if (!sessionId || sessionId === 'new') {
        console.error("ERROR: Intentando guardar nota sin ID de sesión válido.");
        return false;
    }

    const newNotePayload = {
      session_id: sessionId,
      content,
      type,
      session_timestamp: timestamp
    };

    try {
      const { data, error } = await supabase
        .from('session_notes')
        .insert([newNotePayload])
        .select() 
        .single();

      if (error) throw error;

      if (data) {
        // Agregamos la nota REAL al estado
        setNotes(prev => [...prev, data as Note]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error guardando nota:", err);
      return false;
    }
  };

  // 3. EDITAR NOTA
  const updateNote = async (noteId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('session_notes')
        .update({ content: newContent })
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: newContent } : n));
      return true;
    } catch (err) {
      console.error("Error editando nota:", err);
      return false;
    }
  };

  return { notes, loadingNotes, addNote, updateNote, refreshNotes: fetchNotes };
};