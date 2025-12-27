// UBICACIÓN: src/App.tsx
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { AuthView } from './modules/auth/AuthView';
import { DashboardView } from './modules/dashboard/DashboardView';
import { PatientsView } from './modules/patients/PatientsView';
import { AdminUsersView } from './modules/admin/AdminUsersView';
import { CalendarView } from './modules/calendar/CalendarView';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Nuevo Estado: ¿Debemos abrir el formulario de paciente automáticamente?
  const [autoOpenPatientForm, setAutoOpenPatientForm] = useState(false);

  // --- 1. NUEVO ESTADO: ID del paciente para navegación directa ---
  const [patientIdToOpen, setPatientIdToOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Función de navegación inteligente (Dashboard -> Nuevo Paciente)
  const handleNavigation = (route: string) => {
    if (route === 'patients-new') {
      setActiveTab('patients');
      setAutoOpenPatientForm(true); // Activa el trigger
    } else {
      setActiveTab(route);
    }
  };

  // --- 2. NUEVA FUNCIÓN: Navegar a un paciente específico desde el Calendario ---
  const handleGoToPatient = (patientId: string) => {
    setPatientIdToOpen(patientId);
    setActiveTab('patients');
  };

  if (loading) return <div className="h-screen w-full bg-black flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={48} /></div>;
  if (!session) return <AuthView />;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
        
        {/* Pasamos la función de navegación al Dashboard */}
        {activeTab === 'dashboard' && <DashboardView onNavigate={handleNavigation} />}
        
        {/* 3. CALENDARIO: Le pasamos la función para "ir al paciente" */}
        {activeTab === 'calendar' && <CalendarView onNavigateToPatient={handleGoToPatient} />}
        
        {/* 4. PACIENTES: Recibe el ID y la función para resetear */}
        {activeTab === 'patients' && (
          <PatientsView 
            initialCreateMode={autoOpenPatientForm} 
            onResetCreateMode={() => setAutoOpenPatientForm(false)} 
            initialPatientId={patientIdToOpen}
            onResetPatientId={() => setPatientIdToOpen(null)}
          />
        )}
        
        {activeTab === 'admin' && <AdminUsersView />}
      </main>
    </div>
  );
}

export default App;