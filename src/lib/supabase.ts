// UBICACIÓN: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 FALTAN VARIABLES DE ENTORNO EN .ENV");
}

// Cliente Singleton para evitar "Multiple GoTrueClient instances"
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Cliente Admin (Solo funcionará si agregas la SERVICE_ROLE key al .env después)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false // El admin no necesita persistir sesión en el navegador
      }
    }) 
  : supabase; // Fallback al cliente normal si no hay llave (para que no rompa la app)