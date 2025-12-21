// UBICACIÓN: src/App.tsx
import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Brain 
} from 'lucide-react';

// Importación de Módulos
import { DashboardView } from './modules/dashboard/DashboardView'; // <--- NUEVO IMPORT
import { PatientsView } from './modules/patients/PatientsView';
import { CalendarView } from './modules/calendar/CalendarView';

// Tipos para la navegación
type View = 'dashboard' | 'patients' | 'calendar' | 'settings';

function App() {
  // Estado de navegación principal
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Vista temporal para módulos en construcción (Solo Settings por ahora)
  const PlaceholderView = ({ title }: { title: string }) => (
    <div className="flex-1 h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 animate-in fade-in">
      <Brain size={48} className="mb-4 opacity-20 animate-pulse" strokeWidth={1.5} />
      <h2 className="text-xl font-semibold text-zinc-400">Módulo de {title}</h2>
      <p className="text-sm mt-2">Próximamente en la siguiente versión...</p>
    </div>
  );

  return (
    // Contenedor Maestro: h-screen y w-screen para ocupar toda la ventana sin scroll global
    <div className="flex h-screen w-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden">
      
      {/* --- SIDEBAR DE NAVEGACIÓN (Diseño Minimalista v2) --- */}
      <nav className="w-24 flex-shrink-0 flex flex-col items-center py-8 bg-black border-r border-zinc-900/50 z-20">
        
        {/* LOGO CORPORATIVO */}
        <div className="mb-10 flex flex-col items-center gap-2 group cursor-default">
          <div className="p-2.5 bg-zinc-900 rounded-xl group-hover:bg-zinc-800 transition-colors border border-zinc-800 group-hover:border-emerald-500/30 shadow-lg shadow-black/50">
            <Brain className="text-emerald-500" size={24} />
          </div>
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase group-hover:text-zinc-300 transition-colors">
            Nexo
          </span>
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <div className="flex-1 flex flex-col gap-6 w-full px-4">
          <NavButton 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')}
            icon={<LayoutGrid size={22} strokeWidth={1.5} />}
            label="Inicio"
          />
          <NavButton 
            active={currentView === 'patients'} 
            onClick={() => setCurrentView('patients')}
            icon={<Users size={22} strokeWidth={1.5} />}
            label="Pacientes"
          />
          <NavButton 
            active={currentView === 'calendar'} 
            onClick={() => setCurrentView('calendar')}
            icon={<Calendar size={22} strokeWidth={1.5} />}
            label="Agenda"
          />
          <NavButton 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')}
            icon={<Settings size={22} strokeWidth={1.5} />}
            label="Ajustes"
          />
        </div>

        {/* BOTÓN SALIDA */}
        <button className="mt-auto p-3 text-zinc-600 hover:text-zinc-300 transition-colors opacity-70 hover:opacity-100">
          <LogOut size={22} strokeWidth={1.5} />
        </button>
      </nav>

      {/* --- ÁREA DE CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 h-full relative bg-black overflow-hidden flex flex-col">
        {/* Renderizado Condicional */}
        
        {/* 1. DASHBOARD REAL */}
        {currentView === 'dashboard' && <DashboardView />}
        
        {/* 2. PACIENTES */}
        {currentView === 'patients' && <PatientsView />}
        
        {/* 3. AGENDA */}
        {currentView === 'calendar' && <CalendarView />}
        
        {/* 4. AJUSTES (Placeholder) */}
        {currentView === 'settings' && <PlaceholderView title="Configuración" />}
      </main>

    </div>
  );
}

// Sub-componente para botones del menú
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton = ({ active, onClick, icon, label }: NavButtonProps) => (
  <button
    onClick={onClick}
    className={`
      relative group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300
      ${active 
        ? 'text-emerald-400 bg-zinc-900/50' 
        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/30'
      }
    `}
    title={label}
  >
    {/* El icono recibe las clases del padre automáticamente */}
    <div className={`transition-transform duration-300 ${active ? 'scale-105' : 'group-hover:scale-105'}`}>
      {icon}
    </div>
    
    {/* Indicador visual de activo (Punto sutil) */}
    {active && (
      <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
    )}
  </button>
);

export default App;