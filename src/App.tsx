// UBICACIÓN: src/App.tsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Loader2, AlertTriangle } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { AuthView } from './modules/auth/AuthView';
import { DashboardView } from './modules/dashboard/DashboardView';
import { PatientsView } from './modules/patients/PatientsView';
import { AdminUsersView } from './modules/admin/AdminUsersView';
import { CalendarView } from './modules/calendar/CalendarView';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  
  // --- MEJORA: INICIALIZAR ROL DESDE LOCALSTORAGE ---
  // Esto evita que el botón desaparezca mientras carga
  const [userRole, setUserRole] = useState<string | null>(() => {
    return localStorage.getItem('psiconexo_role');
  });

  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);

  // Estados de navegación
  const [activeTab, setActiveTab] = useState('dashboard');
  const [autoOpenPatientForm, setAutoOpenPatientForm] = useState(false);
  const [patientIdToOpen, setPatientIdToOpen] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      // 1. Obtener sesión inicial
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (mounted) {
        if (initialSession?.user) {
          setSession(initialSession);
          sessionRef.current = initialSession;
          // Si no tenemos rol en memoria, lo buscamos
          if (!localStorage.getItem('psiconexo_role')) {
             await fetchUserRole(initialSession.user.id);
          } else {
             // Si ya lo tenemos, validamos en segundo plano silenciosamente
             fetchUserRole(initialSession.user.id);
             setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }

      // 2. Escuchar cambios de sesión
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;

        // Si es Logout, limpiamos todo
        if (event === 'SIGNED_OUT') {
          setLoading(true);
          localStorage.removeItem('psiconexo_role'); // Borramos memoria
          setSession(null);
          setUserRole(null);
          sessionRef.current = null;
          setActiveTab('dashboard');
          setLoading(false);
        } 
        // Si es Login o cambio real de sesión
        else if (currentSession && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
           const isNewUser = currentSession.user.id !== sessionRef.current?.user.id;
           
           if (isNewUser || !userRole) {
             setSession(currentSession);
             sessionRef.current = currentSession;
             await fetchUserRole(currentSession.user.id);
           }
        }
      });

      return () => subscription.unsubscribe();
    };

    initApp();

    return () => { mounted = false; };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data) {
        console.log("✅ Rol confirmado:", data.role);
        setUserRole(data.role);
        // GUARDAMOS EN MEMORIA LOCAL
        localStorage.setItem('psiconexo_role', data.role);
      } else {
        console.warn("⚠️ Perfil no encontrado o error:", error);
        // Si falla, intentamos mantener el rol que ya tenía en memoria si existe
        // Si no, fallback a psychologist
        if (!userRole) setUserRole('psychologist');
      }
    } catch (err) {
      console.error("Error fetching role:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  const handleNavigation = (route: string) => {
    if (route === 'patients-new') {
      setActiveTab('patients');
      setAutoOpenPatientForm(true);
    } else {
      setActiveTab(route);
    }
  };

  const handleGoToPatient = (patientId: string) => {
    setPatientIdToOpen(patientId);
    setActiveTab('patients');
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center gap-4 text-emerald-500">
        <Loader2 className="animate-spin" size={48} />
        <p className="text-xs font-mono text-zinc-500 animate-pulse">Cargando...</p>
      </div>
    );
  }

  if (!session) return <AuthView />;

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
        userRole={userRole} // <--- Pasamos el rol recuperado
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
        {activeTab === 'dashboard' && <DashboardView onNavigate={handleNavigation} />}
        {activeTab === 'calendar' && <CalendarView onNavigateToPatient={handleGoToPatient} />}
        
        {activeTab === 'patients' && (
          <PatientsView 
            initialCreateMode={autoOpenPatientForm} 
            onResetCreateMode={() => setAutoOpenPatientForm(false)} 
            initialPatientId={patientIdToOpen}
            onResetPatientId={() => setPatientIdToOpen(null)}
          />
        )}
        
        {/* LÓGICA DE ADMIN */}
        {activeTab === 'admin' && userRole === 'admin' && <AdminUsersView />}
        
        {/* PANTALLA DE ACCESO DENEGADO */}
        {activeTab === 'admin' && userRole !== 'admin' && (
           <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <div className="p-4 bg-zinc-900 rounded-full mb-2 border border-zinc-800">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl text-white font-medium">Acceso Restringido</h2>
              <p className="text-sm text-zinc-400">Rol actual detectado: <span className="text-white font-mono">{userRole || 'Ninguno'}</span></p>
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="mt-4 px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400"
              >
                Volver al Dashboard
              </button>
           </div>
        )}
      </main>
    </div>
  );
}

export default App;