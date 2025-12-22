// UBICACIÓN: src/modules/patients/PatientsView.tsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, User, ChevronRight, Save, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SessionDetail } from './components/SessionDetail';
import { PatientProfile } from './components/PatientProfile';
import { LiveSessionView } from './components/LiveSessionView';

interface PatientsViewProps {
  initialCreateMode?: boolean;
  onResetCreateMode?: () => void;
}

export const PatientsView = ({ initialCreateMode = false, onResetCreateMode }: PatientsViewProps) => {
  // Estados de Navegación
  const [view, setView] = useState<'list' | 'profile' | 'live_session' | 'session' | 'new_patient'>('list');
  
  // Datos
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);
  
  // Control de Sesiones
  const [targetSessionId, setTargetSessionId] = useState<string>('new');
  // Contexto para la preparación
  const [lastSessionContext, setLastSessionContext] = useState<string>('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  
  // Formulario Nuevo Paciente
  const [newPatientData, setNewPatientData] = useState({
    full_name: '', email: '', phone: '', birth_date: '', occupation: '', reason: '', notes: ''
  });

  // EFECTO: Manejo de apertura desde Dashboard
  useEffect(() => {
    if (initialCreateMode) {
      setView('new_patient');
      if (onResetCreateMode) onResetCreateMode();
    }
  }, [initialCreateMode, onResetCreateMode]);

  // EFECTO: Carga inicial
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const { data } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (data) setPatients(data);
    setLoading(false);
  };

  // HANDLER: Preparar Sesión (Buscar contexto anterior)
  const handlePrepareLiveSession = async () => {
    if (!selectedPatientId) return;
    setLoading(true);
    
    // Buscamos la última sesión completada para mostrarla en la preparación
    const { data } = await supabase
        .from('sessions')
        .select('notes')
        .eq('patient_id', selectedPatientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (data) {
        setLastSessionContext(data.notes || "Sin notas registradas en la sesión anterior.");
    } else {
        setLastSessionContext("Esta es la primera sesión registrada para este paciente.");
    }
    
    setLoading(false);
    setView('live_session');
  };

  // HANDLER: Finalizar y Guardar Sesión en Vivo
  const handleFinishLiveSession = async (notes: string, duration: number, tags: string[], timeline: any[]) => {
    if (!selectedPatientId) return;
    setLoading(true); 

    try {
        const { data, error } = await supabase.from('sessions').insert({
            patient_id: selectedPatientId,
            notes: notes,       // Texto (Header + Notas rápidas)
            duration: duration, // Segundos totales
            tags: tags,         // Etiquetas de resumen (ej. "Ansiedad", "Resistencia (3)")
            timeline: timeline, // Array JSON con la cronología exacta
            status: 'completed',
            created_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;

        // Redirigir al editor detallado (Documento)
        if (data) {
            setTargetSessionId(data.id);
            setView('session'); 
        }

    } catch (error) {
        console.error('Error guardando sesión:', error);
        alert('Hubo un error al guardar la sesión.');
    } finally {
        setLoading(false);
    }
  };

  // HANDLER: Crear Paciente
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('patients').insert([{
        full_name: newPatientData.full_name,
        email: newPatientData.email,
        phone: newPatientData.phone,
        birth_date: newPatientData.birth_date,
        occupation: newPatientData.occupation,
        clinical_summary: `Motivo: ${newPatientData.reason}\n\nNotas Iniciales: ${newPatientData.notes}`
      }]);
      
      if (error) throw error;
      await fetchPatients();
      setView('list');
      setNewPatientData({ full_name: '', email: '', phone: '', birth_date: '', occupation: '', reason: '', notes: '' });
    } catch (err) {
      console.error(err);
      alert('Error al crear paciente.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO ---

  if (loading && view === 'live_session') {
      return <div className="h-full flex items-center justify-center bg-black text-emerald-500"><Loader2 className="animate-spin" size={48}/></div>;
  }

  // 1. RELOJ EN VIVO
  if (view === 'live_session' && selectedPatientData) {
      return (
          <LiveSessionView 
            patientName={selectedPatientData.full_name}
            lastSessionContext={lastSessionContext}
            onFinish={handleFinishLiveSession}
            onCancel={() => setView('profile')}
          />
      );
  }

  // 2. DETALLE DE SESIÓN (Documento)
  if (view === 'session' && selectedPatientId) {
    return (
      <SessionDetail 
        sessionId={targetSessionId} 
        patientId={selectedPatientId} 
        onBack={() => {
            setView('profile');
            setTargetSessionId('new');
        }} 
      />
    );
  }

  // 3. PERFIL DE PACIENTE
  if (view === 'profile' && selectedPatientData) {
    return (
      <PatientProfile 
        patient={selectedPatientData}
        onBack={() => setView('list')}
        onStartSession={handlePrepareLiveSession} // Usa la función de preparación
        onOpenSession={(sessionId) => {
            setTargetSessionId(sessionId);
            setView('session');
        }}
      />
    );
  }

  // 4. NUEVO PACIENTE
  if (view === 'new_patient') {
     return (
      <div className="flex-1 h-full overflow-y-auto bg-black p-6 md:p-10 animate-in slide-in-from-bottom-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setView('list')} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 transition-colors">
              <X size={24} />
            </button>
            <div>
              <h2 className="text-2xl text-white font-light tracking-wide">Nueva Ficha Clínica</h2>
              <p className="text-zinc-500 text-sm">Registro de ingreso para paciente</p>
            </div>
          </div>
          <form onSubmit={handleCreatePatient} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest border-b border-zinc-900 pb-2">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-[10px] text-zinc-500 uppercase font-bold">Nombre Completo</label><input required type="text" value={newPatientData.full_name} onChange={e => setNewPatientData({...newPatientData, full_name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none" placeholder="Ej. Ana García" /></div>
                 <div className="space-y-1"><label className="text-[10px] text-zinc-500 uppercase font-bold">Ocupación</label><input type="text" value={newPatientData.occupation} onChange={e => setNewPatientData({...newPatientData, occupation: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none" placeholder="Ej. Arquitecta" /></div>
                 <div className="space-y-1"><label className="text-[10px] text-zinc-500 uppercase font-bold">Teléfono</label><input type="tel" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none" /></div>
                 <div className="space-y-1"><label className="text-[10px] text-zinc-500 uppercase font-bold">Correo Electrónico</label><input type="email" value={newPatientData.email} onChange={e => setNewPatientData({...newPatientData, email: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none" /></div>
                 <div className="space-y-1"><label className="text-[10px] text-zinc-500 uppercase font-bold">Fecha de Nacimiento</label><input type="date" value={newPatientData.birth_date} onChange={e => setNewPatientData({...newPatientData, birth_date: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none" /></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest border-b border-zinc-900 pb-2">Motivo de Consulta</h3>
              <div className="space-y-1"><textarea required rows={3} value={newPatientData.reason} onChange={e => setNewPatientData({...newPatientData, reason: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none resize-none" /></div>
            </div>
             <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest border-b border-zinc-900 pb-2">Observaciones Iniciales</h3>
              <div className="space-y-1"><textarea rows={3} value={newPatientData.notes} onChange={e => setNewPatientData({...newPatientData, notes: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none resize-none" /></div>
            </div>
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={() => setView('list')} className="flex-1 py-3 bg-zinc-900 text-zinc-400 rounded-xl font-medium hover:text-white transition-colors">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"><Save size={18} /> Crear Expediente</button>
            </div>
          </form>
        </div>
      </div>
     );
  }

  // 5. VISTA LISTA (DEFAULT)
  return (
    <div className="flex-1 h-full overflow-y-auto bg-black p-6 md:p-10 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl text-white font-light tracking-wide">Pacientes</h1>
        <button onClick={() => setView('new_patient')} className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-zinc-800">
          <Plus size={18} /> <span className="text-sm font-medium">Nuevo</span>
        </button>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-center py-10">Cargando expediente...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {patients.map(patient => (
            <div key={patient.id} onClick={() => { setSelectedPatientId(patient.id); setSelectedPatientData(patient); setView('profile'); }} className="group bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-emerald-500/30 hover:bg-zinc-900/60 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition-colors"><User size={18} /></div>
                <div><h3 className="text-white font-medium">{patient.full_name}</h3><p className="text-xs text-zinc-500">{patient.occupation || 'Sin ocupación'}</p></div>
              </div>
              <div className="flex items-center gap-4"><ChevronRight className="text-zinc-600 group-hover:text-emerald-500 transition-colors" /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};