// UBICACIÓN: src/modules/dashboard/DashboardView.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Calendar, 
  Activity, 
  Clock, 
  Zap, 
  UserPlus, 
  CalendarDays, 
  ShieldCheck, 
  Brain 
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (route: string) => void;
}

export const DashboardView = ({ onNavigate }: DashboardViewProps) => {
  const [stats, setStats] = useState({ totalPatients: 0, activeSessions: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Usuario'); 

  // --- CALCULAR SALUDO SEGÚN HORA ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Obtener nombre del perfil (SIN PREFIJOS)
        const { data: profile } = await supabase
           .from('profiles')
           .select('first_name, last_name')
           .eq('id', user.id)
           .single();

        if (profile) {
           const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
           // Si el nombre existe, lo usamos. Si no, dejamos el default.
           if (fullName) setUserName(fullName);
        } else if (user.user_metadata?.full_name) {
           setUserName(user.user_metadata.full_name);
        }

        // 2. Obtener estadísticas FILTRADAS por usuario
        const { count: patientsCount } = await supabase
           .from('patients')
           .select('*', { count: 'exact', head: true })
           .eq('user_id', user.id); 

        const { count: sessionsCount } = await supabase
           .from('sessions')
           .select('*', { count: 'exact', head: true })
           .eq('status', 'in_progress')
           .eq('user_id', user.id); 
        
        setStats({ totalPatients: patientsCount || 0, activeSessions: sessionsCount || 0 });
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  // COMPONENTE: TARJETA DE ESTADÍSTICA
  const StatCard = ({ title, value, icon: Icon, color = "emerald" }: any) => {
    const textClass = color === 'indigo' ? 'text-indigo-400' : 'text-emerald-400';
    const borderClass = color === 'indigo' ? 'group-hover:border-indigo-500/30' : 'group-hover:border-emerald-500/30';
    const bgGlow = color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500';

    return (
      <div className={`relative group overflow-hidden bg-gradient-to-b from-zinc-900/80 to-black border border-zinc-800/80 p-6 rounded-2xl transition-all duration-500 ${borderClass} shadow-lg`}>
         <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
         <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none ${bgGlow}`}></div>
         
         <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                {title}
                <span className={`w-1 h-1 rounded-full ${bgGlow} opacity-50 group-hover:animate-pulse`}></span>
              </h3>
              <div className="text-4xl md:text-5xl font-thin text-white tracking-tight tabular-nums">
                {loading ? <span className="animate-pulse bg-zinc-800 w-12 h-10 rounded block opacity-20"></span> : value}
              </div>
            </div>
            <div className={`p-3.5 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm ${textClass} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
              <Icon size={22} strokeWidth={1} />
            </div>
         </div>
      </div>
    );
  };

  // COMPONENTE: BOTÓN DE ACCIÓN GRANDE
  const ActionButton = ({ label, subLabel, icon: Icon, color, onClick }: { label: string, subLabel: string, icon: any, color: 'blue' | 'violet', onClick: () => void }) => {
     const styles = {
        blue: {
           bg: 'bg-blue-950/10 hover:bg-blue-900/20',
           border: 'border-blue-900/30 hover:border-blue-500/40',
           iconBg: 'bg-blue-500/10 text-blue-400',
           text: 'text-blue-100',
           glow: 'shadow-[0_0_20px_rgba(59,130,246,0.05)] hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]'
        },
        violet: {
           bg: 'bg-violet-950/10 hover:bg-violet-900/20',
           border: 'border-violet-900/30 hover:border-violet-500/40',
           iconBg: 'bg-violet-500/10 text-violet-400',
           text: 'text-violet-100',
           glow: 'shadow-[0_0_20px_rgba(139,92,246,0.05)] hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]'
        }
     };

     const s = styles[color];

     return (
        <button onClick={onClick} className={`w-full flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border transition-all duration-500 group active:scale-[0.98] ${s.bg} ${s.border} ${s.glow}`}>
           <div className={`p-4 rounded-full transition-transform duration-500 group-hover:scale-110 ${s.iconBg}`}>
              <Icon size={32} strokeWidth={1} />
           </div>
           <div className="text-center">
              <span className={`block text-xs font-bold uppercase tracking-widest mb-1 ${s.text}`}>{label}</span>
              <span className="block text-[9px] text-zinc-500 font-medium tracking-wider">{subLabel}</span>
           </div>
        </button>
     );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-black relative">
       
       {/* FONDO AMBIENTAL */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black pointer-events-none"></div>
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/5 rounded-full blur-[120px] pointer-events-none"></div>
       
       <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900/80 pb-6">
            <div>
               <h2 className="text-emerald-500/70 text-[10px] uppercase tracking-[0.3em] mb-1 font-semibold flex items-center gap-2">
                 <Zap size={10} className="fill-current" /> Sistema En Línea
               </h2>
               {/* SALUDO DINÁMICO */}
               <h1 className="text-3xl md:text-4xl text-white font-light tracking-wide">
                 {getGreeting()}, <span className="font-normal text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">{userName}</span>
               </h1>
            </div>
            
            <div className="flex items-center gap-3 text-zinc-400 border border-zinc-800/80 rounded-full px-5 py-2 bg-zinc-950/30 backdrop-blur-md shadow-inner">
               <Clock size={16} strokeWidth={1.5} className="text-emerald-500/60" />
               <span className="text-[10px] uppercase tracking-widest font-medium">
                 {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
               </span>
            </div>
          </div>

          {/* GRID ESTADÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard title="Total Pacientes" value={stats.totalPatients} icon={Users} color="emerald" />
             <StatCard title="Sesiones Activas" value={stats.activeSessions} icon={Activity} color="indigo" />
             <StatCard title="Citas Hoy" value="0" icon={Calendar} color="emerald" />
          </div>

          {/* ZONA PRINCIPAL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* Actividad Reciente */}
             <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-1">
                   <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Monitor de Actividad</h3>
                </div>

                <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl overflow-hidden min-h-[350px] relative group flex items-center justify-center">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:40px_40px] opacity-[0.2]"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80"></div>

                    <div className="text-center relative z-10 opacity-50 group-hover:opacity-100 transition-all duration-700 transform group-hover:scale-105">
                       <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800 group-hover:border-emerald-500/30 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all">
                          <Brain className="text-zinc-600 group-hover:text-emerald-400 transition-colors" size={32} strokeWidth={1}/>
                       </div>
                       <p className="text-zinc-500 group-hover:text-zinc-300 text-xs font-light tracking-[0.2em] transition-colors">SIN ACTIVIDAD RECIENTE</p>
                    </div>
                </div>
             </div>

             {/* COLUMNA DERECHA: Comandos y Suscripción */}
             <div className="space-y-6">
                
                {/* 1. COMANDOS RÁPIDOS */}
                <div>
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] px-1 mb-4">Comandos Rápidos</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <ActionButton 
                        label="Nuevo Paciente" 
                        subLabel="Registrar Ficha" 
                        icon={UserPlus} 
                        color="blue" 
                        onClick={() => onNavigate('patients-new')} 
                     />
                     <ActionButton 
                        label="Ver Agenda" 
                        subLabel="Gestionar Citas" 
                        icon={CalendarDays} 
                        color="violet" 
                        onClick={() => onNavigate('calendar')} 
                     />
                  </div>
                </div>

                {/* 2. ESTADO DE SUSCRIPCIÓN */}
                <div className="p-5 bg-zinc-950/30 rounded-2xl border border-zinc-900 flex items-center justify-between group hover:border-zinc-800 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/5 rounded-lg text-emerald-500/80">
                         <ShieldCheck size={18} strokeWidth={1.5} />
                      </div>
                      <div>
                         <span className="block text-[10px] uppercase tracking-widest font-bold text-zinc-500">Estado de Cuenta</span>
                         <span className="block text-xs font-light text-zinc-300">Acceso Profesional</span>
                      </div>
                   </div>
                   <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                         Al día
                      </span>
                   </div>
                </div>

             </div>

          </div>
       </div>
    </div>
  );
};