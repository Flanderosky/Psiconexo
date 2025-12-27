// UBICACIÓN: src/components/Sidebar.tsx
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Shield, 
  Brain,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userRole: string | null; // <--- NUEVA PROP
}

export const Sidebar = ({ activeTab, onTabChange, onLogout, userRole }: SidebarProps) => {
  
  const MenuButton = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => onTabChange(id)}
        className={`w-full flex items-center gap-4 px-4 py-4 md:py-3.5 mb-1 transition-all duration-500 group relative overflow-hidden rounded-xl border ${
          isActive 
            ? 'border-emerald-500/20 bg-emerald-950/10 text-white shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
            : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
        }`}
      >
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent opacity-100"></div>
        )}
        
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-emerald-400 rounded-r-full shadow-[0_0_12px_#34d399] transition-all duration-500 ${isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`}></div>

        <Icon 
          size={22} 
          strokeWidth={isActive ? 1.5 : 1}
          className={`transition-all duration-500 z-10 ${isActive ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'group-hover:text-emerald-500/40'}`} 
        />
        
        <span className={`hidden md:block text-[10px] uppercase tracking-[0.2em] font-medium z-10 transition-all duration-500 ${isActive ? 'text-emerald-100 opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="w-20 md:w-64 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border-r border-zinc-900/80 flex flex-col justify-between h-full transition-all duration-300 relative z-20 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
      
      <div>
        {/* LOGO */}
        <div className="p-6 md:p-8 flex flex-col items-center md:items-start gap-4 mb-4 relative">
          <div className="absolute top-10 left-8 w-16 h-16 bg-emerald-500/5 blur-[30px] rounded-full pointer-events-none hidden md:block"></div>
          
          <div className="flex items-center gap-3 relative z-10 group cursor-default">
             <div className="relative">
                <Brain className="text-emerald-500 group-hover:text-emerald-400 transition-colors drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" size={30} strokeWidth={1} />
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_#34d399]"></div>
             </div>
             <div className="hidden md:block">
               <h1 className="text-2xl text-white font-light tracking-[0.2em] leading-none">
                 NEXO<span className="text-emerald-500 font-normal drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">.</span>
               </h1>
             </div>
          </div>
        </div>

        {/* MENÚ */}
        <nav className="space-y-1 px-3">
          <MenuButton id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <MenuButton id="calendar" icon={Calendar} label="Agenda" />
          <MenuButton id="patients" icon={Users} label="Pacientes" />
          
          {/* RENDERIZADO CONDICIONAL DEL BOTÓN ADMIN */}
          {userRole === 'admin' && (
            <MenuButton id="admin" icon={Shield} label="Admin" />
          )}
        </nav>
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-zinc-900/50 space-y-2">
        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-600 hover:text-white hover:bg-zinc-900/30 transition-colors group">
          <Settings size={20} strokeWidth={1} className="group-hover:rotate-90 transition-transform duration-700"/>
          <span className="hidden md:block text-[10px] uppercase tracking-[0.2em] font-medium opacity-60 group-hover:opacity-100">Ajustes</span>
        </button>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-600 hover:text-red-300 hover:bg-red-950/10 transition-all group"
        >
          <LogOut size={20} strokeWidth={1} />
          <span className="hidden md:block text-[10px] uppercase tracking-[0.2em] font-medium opacity-60 group-hover:opacity-100">Salir</span>
        </button>
      </div>
    </div>
  );
};