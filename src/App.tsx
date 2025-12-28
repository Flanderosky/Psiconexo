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
// 1. IMPORTAR LA NUEVA VISTA
import { SessionsView } from './modules/sessions/SessionsView';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  
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
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (mounted) {
        if (initialSession?.user) {
          setSession(initialSession);
          sessionRef.current = initialSession;
          const isValid = await validateUserStatus(initialSession.user.id);
          if (!isValid) return; 

          if (!localStorage.getItem('psiconexo_role')) {
             await fetchUserRole(initialSession.user.id);
          } else {
             fetchUserRole(initialSession.user.id);
             setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setLoading(true);
          localStorage.removeItem('psiconexo_role');
          setSession(null);
          setUserRole(null);
          sessionRef.current = null;
          setActiveTab('dashboard');
          setLoading(false);
        } 
        else if (currentSession && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
           const isNewUser = currentSession.user.id !== sessionRef.current?.user.id;
           
           if (isNewUser || !userRole) {
             setSession(currentSession);
             sessionRef.current = currentSession;
             const isValid = await validateUserStatus(currentSession.user.id);
             if (isValid) await fetchUserRole(currentSession.user.id);
           }
        }
      });

      return () => subscription.unsubscribe();
    };

    initApp();

    return () => { mounted = false; };
  }, []);

  // --- ESCUCHA EN TIEMPO REAL (SEGURIDAD) ---
  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase
      .channel('security_check')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
        async (payload) => {
          const newProfile = payload.new;
          if (newProfile.subscription_status === 'canceled') await handleForceLogout('Tu cuenta ha sido bloqueada por un administrador.');
          
          if (newProfile.role !== 'admin' && newProfile.subscription_end_date) {
             const expiry = new Date(newProfile.subscription_end_date);
             const today = new Date();
             expiry.setHours(0,0,0,0); today.setHours(0,0,0,0);
             if (expiry < today) await handleForceLogout('Tu suscripción ha vencido. Contacta al administrador.');
          }
          if (newProfile.role !== userRole) {
             setUserRole(newProfile.role);
             localStorage.setItem('psiconexo_role', newProfile.role);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, userRole]);

  const validateUserStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data: profile, error } = await supabase.from('profiles').select('subscription_status, subscription_end_date, role').eq('id', userId).single();
      if (error || !profile) return true;
      if (profile.subscription_status === 'canceled') { await handleForceLogout('Tu cuenta se encuentra bloqueada.'); return false; }
      if (profile.role !== 'admin' && profile.subscription_end_date) {
        const expiry = new Date(profile.subscription_end_date);
        const today = new Date();
        expiry.setHours(0,0,0,0); today.setHours(0,0,0,0);
        if (expiry < today) { await handleForceLogout('Tu periodo de suscripción ha finalizado.'); return false; }
      }
      return true;
    } catch (e) { console.error("Error validando usuario", e); return true; }
  };

  const handleForceLogout = async (reason: string) => {
    alert(`⚠️ ACCESO DENEGADO\n\n${reason}`);
    await supabase.auth.signOut();
    setSession(null);
    window.location.href = '/'; 
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (data) { setUserRole(data.role); localStorage.setItem('psiconexo_role', data.role); } 
      else { if (!userRole) setUserRole('psychologist'); }
    } catch (err) { console.error("Error fetching role:", err); } 
    finally { setLoading(false); }
  };

  const handleLogout = async () => { setLoading(true); await supabase.auth.signOut(); };

  const handleNavigation = (route: string) => {
    if (route === 'patients-new') { setActiveTab('patients'); setAutoOpenPatientForm(true); } 
    else { setActiveTab(route); }
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
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} userRole={userRole} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
        {activeTab === 'dashboard' && <DashboardView onNavigate={handleNavigation} />}
        {activeTab === 'calendar' && <CalendarView onNavigateToPatient={handleGoToPatient} />}
        
        {/* 2. AGREGAR LA RUTA AQUÍ */}
        {activeTab === 'sessions' && <SessionsView onNavigateToPatient={handleGoToPatient} />}
        
        {activeTab === 'patients' && (
          <PatientsView 
            initialCreateMode={autoOpenPatientForm} 
            onResetCreateMode={() => setAutoOpenPatientForm(false)} 
            initialPatientId={patientIdToOpen}
            onResetPatientId={() => setPatientIdToOpen(null)}
          />
        )}
        
        {activeTab === 'admin' && userRole === 'admin' && <AdminUsersView />}
        
        {activeTab === 'admin' && userRole !== 'admin' && (
           <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <div className="p-4 bg-zinc-900 rounded-full mb-2 border border-zinc-800">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl text-white font-medium">Acceso Restringido</h2>
              <button onClick={() => setActiveTab('dashboard')} className="mt-4 px-6 py-2 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400">Volver</button>
           </div>
        )}
      </main>
    </div>
  );
}

export default App;