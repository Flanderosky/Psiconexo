// UBICACIÓN: src/App.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { AuthView } from './modules/auth/AuthView';
import { DashboardView } from './modules/dashboard/DashboardView';
import { PatientsView } from './modules/patients/PatientsView';
import { AdminUsersView } from './modules/admin/AdminUsersView';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Nuevo Estado: ¿Debemos abrir el formulario de paciente automáticamente?
  const [autoOpenPatientForm, setAutoOpenPatientForm] = useState(false);

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

  // Función de navegación inteligente
  const handleNavigation = (route: string) => {
    if (route === 'patients-new') {
      setActiveTab('patients');
      setAutoOpenPatientForm(true); // Activa el trigger
    } else {
      setActiveTab(route);
    }
  };

  if (loading) return <div className="h-screen w-full bg-black flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={48} /></div>;
  if (!session) return <AuthView />;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
        
        {/* Pasamos la función de navegación al Dashboard */}
        {activeTab === 'dashboard' && <DashboardView onNavigate={handleNavigation} />}
        
        {/* Pasamos el estado de auto-apertura a Pacientes y la función para apagarlo */}
        {activeTab === 'patients' && (
          <PatientsView 
            initialCreateMode={autoOpenPatientForm} 
            onResetCreateMode={() => setAutoOpenPatientForm(false)} 
          />
        )}
        
        {activeTab === 'admin' && <AdminUsersView />}
      </main>
    </div>
  );
}

export default App;