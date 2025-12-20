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
import { PatientsView } from './modules/patients/PatientsView';

type View = 'dashboard' | 'patients' | 'calendar' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('patients');

  const PlaceholderView = ({ title }: { title: string }) => (
    <div className="flex-1 h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500">
      <Brain size={48} className="mb-4 opacity-20 animate-pulse" />
      <h2 className="text-xl font-semibold text-zinc-400">Módulo de {title}</h2>
      <p className="text-sm mt-2">Próximamente...</p>
    </div>
  );

  return (
    // CAMBIO CLAVE 1: 'h-screen w-screen overflow-hidden' 
    // Esto congela la ventana y evita que el navegador haga scroll general
    <div className="flex h-screen w-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <nav className="w-20 flex-shrink-0 flex flex-col items-center py-6 border-r border-zinc-800 bg-zinc-950 z-20">
        <div className="mb-8 p-3 bg-emerald-500/10 rounded-xl">
          <Brain className="text-emerald-500" size={24} />
        </div>

        <div className="flex-1 flex flex-col gap-4 w-full px-3">
          <NavButton 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')}
            icon={<LayoutGrid size={22} />}
            label="Inicio"
          />
          <NavButton 
            active={currentView === 'patients'} 
            onClick={() => setCurrentView('patients')}
            icon={<Users size={22} />}
            label="Pacientes"
          />
          <NavButton 
            active={currentView === 'calendar'} 
            onClick={() => setCurrentView('calendar')}
            icon={<Calendar size={22} />}
            label="Agenda"
          />
          <NavButton 
            active={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')}
            icon={<Settings size={22} />}
            label="Ajustes"
          />
        </div>

        <button className="mt-auto p-3 text-zinc-500 hover:text-red-400 transition-colors rounded-xl hover:bg-red-400/10">
          <LogOut size={22} />
        </button>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      {/* CAMBIO CLAVE 2: 'relative' para que los hijos absolutos se posicionen bien dentro de él */}
      <main className="flex-1 h-full relative bg-black overflow-hidden flex flex-col">
        {currentView === 'dashboard' && <PlaceholderView title="Dashboard" />}
        {/* Aquí renderizamos PatientsView que ya está configurado con h-full */}
        {currentView === 'patients' && <PatientsView />}
        {currentView === 'calendar' && <PlaceholderView title="Agenda y Sesiones" />}
        {currentView === 'settings' && <PlaceholderView title="Configuración" />}
      </main>

    </div>
  );
}

// Sub-componente NavButton (sin cambios mayores, solo optimización visual)
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
      relative group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200
      ${active 
        ? 'bg-zinc-800 text-emerald-400 shadow-lg shadow-black/50' 
        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
      }
    `}
    title={label}
  >
    {icon}
    {active && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1 h-8 bg-emerald-500 rounded-r-full" />
    )}
  </button>
);

export default App;