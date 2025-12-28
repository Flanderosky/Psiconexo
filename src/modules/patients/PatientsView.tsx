// UBICACIÓN: src/modules/patients/PatientsView.tsx
import { useState, useEffect } from 'react';
import { 
  Plus, Search, User, Phone, Mail, 
  X, Save, Trash2, FileText, 
  Siren, XCircle, CheckCircle2, Calendar, Brain // <--- Brain para el icono
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

import { PatientProfile } from './components/PatientProfile';
import { LiveSessionView } from './components/LiveSessionView';
import { SessionDetail } from './components/SessionDetail'; 

export interface Patient {
  id?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  notes?: string;
  clinical_summary?: string; // <--- NUEVO CAMPO
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  created_at?: string;
  user_id?: string;
}

interface PatientsViewProps {
  initialCreateMode?: boolean;
  onResetCreateMode?: () => void;
  initialPatientId?: string | null;
  onResetPatientId?: () => void;
}

const NotificationToast = ({ message, onClose }: { message: string, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000); 
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
            <div className="bg-zinc-900 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-500" />
                <span className="font-medium text-sm">{message}</span>
            </div>
        </div>
    );
};

export const PatientsView = ({ 
  initialCreateMode, 
  onResetCreateMode,
  initialPatientId,
  onResetPatientId
}: PatientsViewProps) => {
  
  const [currentView, setCurrentView] = useState<'list' | 'profile' | 'live' | 'session-detail'>('list');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null); 
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeLiveSession, setActiveLiveSession] = useState<any>(null); 

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState<Patient | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (initialCreateMode) {
      handleCreateNew();
      if (onResetCreateMode) onResetCreateMode();
    }
    if (initialPatientId && patients.length > 0) {
        const p = patients.find(pat => pat.id === initialPatientId);
        if (p) {
            setSelectedPatient(p);
            setCurrentView('profile'); 
        }
        if (onResetPatientId) onResetPatientId();
    }
  }, [initialCreateMode, initialPatientId, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPatients([]); return; }

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedPatient({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      birth_date: '',
      notes: '',
      clinical_summary: '', // <--- Inicializar vacío
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: ''
    });
    setIsDrawerOpen(true);
  };

  const handleCardClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView('profile');
  };

  const handleEditClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    const { ...cleanPatient } = patient;
    setSelectedPatient(cleanPatient as Patient);
    setIsDrawerOpen(true);
  };

  const handleEmergencyClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation(); 
    setEmergencyData(patient);
    setEmergencyModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar paciente?')) return;
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (!error) setPatients(patients.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    if (!selectedPatient?.first_name || !selectedPatient?.last_name) return alert('Nombre y Apellido requeridos');
    if (!selectedPatient?.emergency_contact_name || !selectedPatient?.emergency_contact_phone) return alert('Contacto de emergencia requerido');

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No sesión");

      const patientData = { 
        ...selectedPatient,
        full_name: `${selectedPatient.first_name} ${selectedPatient.last_name}`.trim(),
        user_id: user.id 
      };

      const { data, error } = await supabase.from('patients').upsert(patientData).select().single();
      if (error) throw error;

      if (selectedPatient.id) {
        setPatients(patients.map(p => p.id === data.id ? data : p));
      } else {
        setPatients([data, ...patients]);
      }
      setIsDrawerOpen(false);
      setNotification('Paciente guardado correctamente');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartLiveSession = (sessionToStart?: any) => {
    setActiveLiveSession(sessionToStart || null);
    setCurrentView('live');
  };

  const handleFinishLiveSession = async (notes: string, duration: number, tags: string[], timeline: any[]) => {
    if (!selectedPatient?.id) return;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (activeLiveSession?.id) {
            await supabase.from('sessions').update({
                notes: notes,
                duration: duration,
                tags: tags,
                timeline: timeline,
                content: JSON.stringify(timeline),
                status: 'completed', 
                created_at: new Date().toISOString()
            }).eq('id', activeLiveSession.id);
        } else {
            await supabase.from('sessions').insert({
                user_id: user?.id,
                patient_id: selectedPatient.id,
                notes: notes,
                duration: duration,
                tags: tags,
                timeline: timeline, 
                content: JSON.stringify(timeline), 
                status: 'completed',
                created_at: new Date().toISOString()
            });
        }
        
        setNotification('Sesión finalizada y guardada con éxito.');
        setActiveLiveSession(null);
        setCurrentView('profile');
    } catch (e) {
        console.error(e);
        alert('Error al guardar sesión');
    }
  };

  const handleOpenSessionDetail = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setCurrentView('session-detail');
  };

  const filteredPatients = patients.filter(p => 
    (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-black text-white relative overflow-hidden">
      
      {notification && <NotificationToast message={notification} onClose={() => setNotification(null)} />}

      {currentView === 'live' && selectedPatient ? (
        <LiveSessionView 
            patientName={selectedPatient.full_name || ''}
            lastSessionContext="Cargando contexto..." 
            initialNotes={activeLiveSession?.notes || ''}
            onFinish={handleFinishLiveSession}
            onCancel={() => {
                setActiveLiveSession(null);
                setCurrentView('profile');
            }}
        />
      ) : currentView === 'session-detail' && selectedSessionId && selectedPatient ? (
        <SessionDetail 
            sessionId={selectedSessionId}
            patientId={selectedPatient.id!}
            onBack={() => setCurrentView('profile')}
        />
      ) : currentView === 'profile' && selectedPatient ? (
        <PatientProfile 
            patient={selectedPatient}
            onBack={() => { setSelectedPatient(null); setCurrentView('list'); }}
            onStartSession={handleStartLiveSession}
            onOpenSession={handleOpenSessionDetail}
        />
      ) : (
        <>
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
                <div>
                <h1 className="text-3xl font-light tracking-tight text-white">Pacientes</h1>
                <p className="text-zinc-500 text-sm mt-1">Gestión de expedientes clínicos.</p>
                </div>
                <button onClick={handleCreateNew} className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Plus size={20} className="group-hover:rotate-90 transition-transform"/> <span>Nuevo Paciente</span>
                </button>
            </div>

            <div className="px-6 md:px-8 mb-6 z-10">
                <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"/>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 z-10">
                {loading ? (
                <div className="flex items-center justify-center h-40 text-emerald-500 animate-pulse">Cargando...</div>
                ) : filteredPatients.length === 0 ? (
                <div className="text-center py-20 text-zinc-600">
                    <User size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No hay pacientes registrados.</p>
                </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredPatients.map(patient => (
                    <div key={patient.id} onClick={() => handleCardClick(patient)} className="group bg-zinc-900/30 border border-zinc-800/60 hover:border-emerald-500/30 hover:bg-zinc-900/60 rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                        <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
                            {(patient.first_name?.[0] || '')}{(patient.last_name?.[0] || '')}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(patient.id!); }} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">{patient.full_name || 'Sin Nombre'}</h3>
                        <div className="space-y-1 mt-2">
                            {patient.email && <div className="flex items-center gap-2 text-xs text-zinc-500"><Mail size={12} /> <span className="truncate">{patient.email}</span></div>}
                            {patient.phone && <div className="flex items-center gap-2 text-xs text-zinc-500"><Phone size={12} /> <span>{patient.phone}</span></div>}
                        </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex gap-2">
                        <button onClick={(e) => handleEmergencyClick(e, patient)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider group/alert">
                            <Siren size={14} className="group-hover/alert:animate-pulse" /> SOS
                        </button>
                        <button onClick={(e) => handleEditClick(e, patient)} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"><FileText size={16}/></button>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
        </>
      )}

      {/* MODAL EMERGENCIA (Igual) */}
      {emergencyModalOpen && emergencyData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm" onClick={() => setEmergencyModalOpen(false)}></div>
           <div className="relative bg-black border-2 border-red-600 w-full max-w-md rounded-3xl p-8 shadow-[0_0_100px_rgba(220,38,38,0.5)] animate-in zoom-in-95">
              <button onClick={() => setEmergencyModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><XCircle size={32}/></button>
              <div className="text-center space-y-6">
                 <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center mx-auto animate-bounce"><Siren size={48} className="text-white" /></div>
                 <div><h2 className="text-xs font-bold text-red-500 tracking-[0.3em] uppercase mb-2">Contacto de Emergencia</h2><h3 className="text-3xl font-bold text-white mb-1">{emergencyData.emergency_contact_name}</h3><span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm font-medium border border-zinc-700">{emergencyData.emergency_contact_relation}</span></div>
                 <div className="w-full bg-zinc-900 rounded-2xl p-6 border border-zinc-800"><a href={`tel:${emergencyData.emergency_contact_phone}`} className="text-2xl md:text-3xl font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-3"><Phone size={24} />{emergencyData.emergency_contact_phone}</a></div>
              </div>
           </div>
        </div>
      )}

      {/* DRAWER FORMULARIO (ACTUALIZADO) */}
      <>
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsDrawerOpen(false)}/>
        <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <h2 className="text-xl font-light text-white flex items-center gap-2"><User className="text-emerald-500" size={20}/> {selectedPatient?.id ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
            <button onClick={() => setIsDrawerOpen(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Nombre *</label>
                      <input className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white w-full" placeholder="Nombre" value={selectedPatient?.first_name || ''} onChange={e => setSelectedPatient({...selectedPatient!, first_name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Apellido *</label>
                      <input className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white w-full" placeholder="Apellido" value={selectedPatient?.last_name || ''} onChange={e => setSelectedPatient({...selectedPatient!, last_name: e.target.value})} />
                    </div>
                 </div>
                 
                 <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Correo</label>
                    <input className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white w-full" placeholder="email@ejemplo.com" value={selectedPatient?.email || ''} onChange={e => setSelectedPatient({...selectedPatient!, email: e.target.value})} />
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Teléfono Celular (WhatsApp)</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                       <input className="bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white w-full focus:border-emerald-500 outline-none transition-colors" placeholder="55 1234 5678" value={selectedPatient?.phone || ''} onChange={e => setSelectedPatient({...selectedPatient!, phone: e.target.value})} />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Fecha de Nacimiento</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                       <input type="date" className="bg-black border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white w-full focus:border-emerald-500 outline-none transition-colors" value={selectedPatient?.birth_date || ''} onChange={e => setSelectedPatient({...selectedPatient!, birth_date: e.target.value})} />
                    </div>
                 </div>

                 {/* --- NUEVO: RESUMEN CLÍNICO (Contexto Inicial) --- */}
                 <div className="space-y-1 pt-4 border-t border-zinc-900">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-2"><Brain size={12}/> Resumen Clínico / Motivo de Consulta</label>
                    <textarea 
                        className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white w-full min-h-[100px] focus:border-emerald-500 outline-none transition-colors resize-none leading-relaxed" 
                        placeholder="Describe brevemente el motivo de consulta o antecedentes importantes..." 
                        value={selectedPatient?.clinical_summary || ''} 
                        onChange={e => setSelectedPatient({...selectedPatient!, clinical_summary: e.target.value})} 
                    />
                 </div>

                 <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-red-500 uppercase">Contacto Emergencia (Obligatorio)</h3>
                    <div className="space-y-1">
                       <label className="text-[10px] text-red-400 uppercase font-bold">Nombre *</label>
                       <input className="bg-black border border-red-900/30 rounded-xl px-4 py-2.5 text-white w-full text-sm" placeholder="Nombre Contacto" value={selectedPatient?.emergency_contact_name || ''} onChange={e => setSelectedPatient({...selectedPatient!, emergency_contact_name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] text-red-400 uppercase font-bold">Teléfono *</label>
                       <input className="bg-black border border-red-900/30 rounded-xl px-4 py-2.5 text-white w-full text-sm" placeholder="Teléfono" value={selectedPatient?.emergency_contact_phone || ''} onChange={e => setSelectedPatient({...selectedPatient!, emergency_contact_phone: e.target.value})} />
                    </div>
                 </div>
              </div>
          </div>
          <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
            <button onClick={() => setIsDrawerOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-2">{saving ? '...' : <><Save size={18}/> Guardar</>}</button>
          </div>
        </div>
      </>
    </div>
  );
};