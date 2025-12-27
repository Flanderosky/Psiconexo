// UBICACIÓN: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Esta llave la usaremos SOLO para crear usuarios administrativos
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Admin (Opcional: úsalo con precaución)
// Si no tienes la variable configurada, usará la anónima (y fallará al crear usuarios)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : supabase;