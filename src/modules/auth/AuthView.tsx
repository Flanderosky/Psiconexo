// UBICACIÓN: src/modules/auth/AuthView.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, Brain } from 'lucide-react';

export const AuthView = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      setErrorMsg('Credenciales incorrectas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* --- FONDO TECNOLÓGICO ELEGANTE --- */}
      
      {/* 1. Base sutil (Degradado radial para evitar negro plano) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/30 via-black to-black pointer-events-none"></div>

      {/* 2. Bruma Dinámica (Dos focos de luz respirando) */}
      <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-900/10 rounded-full blur-[150px] pointer-events-none animate-pulse delay-1000 duration-[10000ms] opacity-60"></div>

      {/* 3. Destellos Minimalistas (Puntos de datos flotando) */}
      {/* Destello 1: Arriba derecha, parpadeo rápido tipo ping */}
      <div className="absolute top-[20%] right-[25%] w-0.5 h-0.5 bg-emerald-400 rounded-full blur-[1px] animate-ping duration-[4000ms] opacity-80 pointer-events-none"></div>
      {/* Destello 2: Abajo izquierda, pulso lento */}
      <div className="absolute bottom-[30%] left-[20%] w-1 h-1 bg-emerald-600/40 rounded-full blur-[2px] animate-pulse duration-[6000ms] pointer-events-none"></div>
      {/* Destello 3: Centro sutil */}
      <div className="absolute top-[45%] left-[40%] w-0.5 h-0.5 bg-cyan-400/50 rounded-full blur-[1px] animate-pulse delay-[2000ms] duration-[5000ms] pointer-events-none"></div>

      {/* ---------------------------------- */}


      <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95 duration-700 my-auto">
        
        {/* --- LOGO THIN & GLOW --- */}
        <div className="text-center mb-12 relative group">
          {/* Backlight del logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>

          <div className="relative flex flex-col items-center gap-5">
            <Brain 
              className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
              size={52} 
              strokeWidth={0.8} // Aún más fino para elegancia extrema
            />
            
            <h1 className="text-5xl text-white font-thin tracking-[0.3em] drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] pl-4">
              NEXO
              <span className="text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)] font-normal relative -top-0.5">.</span>
            </h1>
            
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent mt-1"></div>
            
            <p className="text-zinc-600 text-[9px] uppercase tracking-[0.4em] font-medium opacity-60 pt-2 pl-2">
              Clinical Link System
            </p>
          </div>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-900/60 p-8 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Reflejo sutil en la tarjeta */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent opacity-20 pointer-events-none"></div>
          
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            
            <div className="space-y-2">
              <label className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:bg-emerald-900/50 before:rounded-full">
                Credencial ID
              </label>
              <div className="relative group transition-all duration-500">
                <Mail className="absolute left-4 top-3.5 text-zinc-700 group-focus-within:text-emerald-500/70 transition-colors duration-500" size={15} strokeWidth={1.5} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800/80 rounded-xl pl-12 pr-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-800/60 focus:bg-black/80 focus:shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all duration-500 placeholder-zinc-800 font-light tracking-wide"
                  placeholder="usuario@psiconexo.mx"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest ml-2 flex items-center gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:bg-emerald-900/50 before:rounded-full">
                Llave de Acceso
              </label>
              <div className="relative group transition-all duration-500">
                <Lock className="absolute left-4 top-3.5 text-zinc-700 group-focus-within:text-emerald-500/70 transition-colors duration-500" size={15} strokeWidth={1.5} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-800/80 rounded-xl pl-12 pr-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-800/60 focus:bg-black/80 focus:shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all duration-500 placeholder-zinc-800 font-light tracking-[0.2em]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="py-2.5 px-3 rounded-lg border border-red-900/30 bg-red-950/20 flex items-center justify-center gap-2 text-red-500/80 text-[10px] tracking-wide animate-in fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none"></div>
                <AlertCircle size={12} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-950 hover:from-emerald-950 hover:to-zinc-950 border border-zinc-800 hover:border-emerald-900/50 text-zinc-300 hover:text-emerald-100 font-light tracking-[0.2em] text-xs shadow-[0_5px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-500 active:scale-[0.99] flex items-center justify-center gap-4 group mt-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
              {loading ? (
                <Loader2 className="animate-spin text-emerald-500" size={16} />
              ) : (
                <>
                  CONECTAR
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform opacity-50 group-hover:text-emerald-500 duration-500"/>
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="mt-16 text-center opacity-25 hover:opacity-80 transition-opacity duration-700 flex flex-col items-center gap-2">
           <div className="w-px h-8 bg-gradient-to-b from-zinc-800 to-transparent"></div>
           <p className="text-[8px] text-zinc-500 uppercase tracking-[0.3em]">
             Conexión Segura Establecida
           </p>
        </div>

      </div>
    </div>
  );
};
