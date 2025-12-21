// UBICACIÓN: src/modules/patients/PatientsView.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Clock, 
  ChevronRight, FileText, 
  Activity, X, Mail, Phone, User,
  Trash2, Archive, AlertTriangle, AlertCircle,
  CheckCircle2, FolderClosed, ShieldAlert,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Componentes internos
import { FichaMedica } from './components/FichaMedica';
import { SessionList } from './components/SessionList';
import { SessionDetail } from './components/SessionDetail';

interface Patient {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'discharged';
  avatar?: string;
  email?: string;
  phone?: string;
}

export const PatientsView = () => {
  // --- ESTADOS ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Vistas
  const [activeView, setActiveView] = useState<'dashboard' | 'technical_sheet' | 'sessions'>('dashboard');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Menú de opciones (Header)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Modal Creación
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // Modales Confirmación
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, patientId: string | null} >({isOpen: false, patientId: null});
  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, title: string, message: string, type: 'error' | 'success'} >({isOpen: false, title: '', message: '', type: 'error'});


  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data, error } = await supabase.from('patients').select('*').order('name');
        if (error) throw error;
        if (data) {
          setPatients(data);
          if (data.length > 0 && !selectedPatientId) setSelectedPatientId(data[0].id);
        }
      } catch (error) {
        console.error('Error cargando pacientes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // --- LÓGICA DE CREACIÓN (Con validación de duplicados) ---
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.name.trim()) return;
    setIsCreating(true);

    // Validar Duplicados
    if (newPatientData.email || newPatientData.phone) {
      let query = supabase.from('patients').select('id, name');
      const conditions = [];
      if (newPatientData.email) conditions.push(`email.eq.${newPatientData.email}`);
      if (newPatientData.phone) conditions.push(`phone.eq.${newPatientData.phone}`);
      
      if (conditions.length > 0) {
        const { data: duplicates } = await query.or(conditions.join(','));
        if (duplicates && duplicates.length > 0) {
          setAlertInfo({
            isOpen: true,
            title: 'Paciente Duplicado',
            message: `Ya existe: ${duplicates[0].name}.`,
            type: 'error'
          });
          setIsCreating(false);
          return; 
        }
      }
    }
    
    const { data, error } = await supabase
      .from('patients')
      .insert([{ 
        name: newPatientData.name, 
        email: newPatientData.email,
        phone: newPatientData.phone,
        status: 'active' 
      }])
      .select()
      .single();

    if (error) {
       setAlertInfo({ isOpen: true, title: 'Error', message: error.message, type: 'error' });
    } else if (data) {
      setPatients([...patients, data]);
      setSelectedPatientId(data.id);
      setActiveView('technical_sheet'); // Ir directo a ficha
      setIsCreateModalOpen(false);
      setNewPatientData({ name: '', email: '', phone: '' });
    }
    setIsCreating(false);
  };

  // --- LÓGICA ELIMINAR / ARCHIVAR ---
  const requestDelete = () => {
    if (selectedPatient) {
        setDeleteModal({ isOpen: true, patientId: selectedPatient.id });
        setIsMenuOpen(false); // Cerrar menú del header si estaba abierto
    }
  };

  const confirmDeletePatient = async () => {
    if (!deleteModal.patientId) return;
    const { error } = await supabase.from('patients').delete().eq('id', deleteModal.patientId);
    if (error) {
      setAlertInfo({
        isOpen: true,
        title: 'No se puede eliminar',
        message: 'Es probable que tenga historial clínico. Archívalo en su lugar.',
        type: 'error'
      });
    } else {
      const updatedList = patients.filter(p => p.id !== deleteModal.patientId);
      setPatients(updatedList);
      if (updatedList.length > 0) setSelectedPatientId(updatedList[0].id);
      else setSelectedPatientId(null);
    }
    setDeleteModal({ isOpen: false, patientId: null });
  };

  const handleToggleStatus = async () => {
    if (!selectedPatient) return;
    const newStatus = selectedPatient.status === 'active' ? 'discharged' : 'active';
    const { error } = await supabase.from('patients').update({ status: newStatus }).eq('id', selectedPatient.id);
    if (!error) {
      setPatients(patients.map(p => p.id === selectedPatient.id ? { ...p, status: newStatus } : p));
      setIsMenuOpen(false); // Cerrar menú del header si estaba abierto
    }
  };

  if (loading) return <div className="p-8 text-zinc-400">Cargando sistema...</div>;

  return (
    <div className="flex h-full w-full bg-black text-zinc-100 overflow-hidden relative">
      
      {/* SIDEBAR */}
      <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users size={20} className="text-emerald-500" />
              Pacientes
            </h2>
            <button onClick={() => setIsCreateModalOpen(true)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-emerald-500 hover:text-emerald-400">
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
            <input type="text" placeholder="Buscar paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredPatients.map(patient => (
            <div
              key={patient.id}
              onClick={() => {
                setSelectedPatientId(patient.id);
                setActiveView('dashboard');
                setSelectedSessionId(null);
                setIsMenuOpen(false);
              }}
              className={`p-4 border-b border-zinc-800/50 cursor-pointer transition-all hover:bg-zinc-900 ${selectedPatientId === patient.id ? 'bg-zinc-900 border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${selectedPatientId === patient.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    {patient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`font-medium ${selectedPatientId === patient.id ? 'text-white' : 'text-zinc-300'}`}>
                      {patient.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${patient.status === 'active' ? 'bg-emerald-500' : patient.status === 'discharged' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                      <span className="text-xs text-zinc-500 capitalize">{patient.status === 'discharged' ? 'Alta' : patient.status}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className={`text-zinc-600 ${selectedPatientId === patient.id ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AREA DE TRABAJO */}
      <main className="flex-1 flex flex-col bg-black min-w-0">
        {selectedPatient ? (
          <>
            {/* Header Limpio */}
            <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-sm relative z-10">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedPatient.name}
                  {selectedPatient.status === 'discharged' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] uppercase border border-blue-500/20">
                      Paciente de Alta
                    </span>
                  )}
                </h1>
                
                {/* Pestañas */}
                <div className="flex gap-1 ml-4 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  <button onClick={() => setActiveView('dashboard')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeView === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Dashboard</button>
                  <button onClick={() => setActiveView('technical_sheet')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeView === 'technical_sheet' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Ficha Clínica</button>
                  <button onClick={() => setActiveView('sessions')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeView === 'sessions' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Sesiones</button>
                </div>
              </div>

              {/* Menú de Opciones (Solo los 3 puntos) */}
              <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                  >
                    <MoreVertical size={18} />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-10 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                      <button 
                        onClick={handleToggleStatus}
                        className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <Archive size={16} className="text-blue-400" />
                        {selectedPatient.status === 'active' ? 'Dar de Alta' : 'Reactivar'}
                      </button>
                      <div className="h-px bg-zinc-800 my-0"></div>
                      <button 
                        onClick={requestDelete}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} />
                        Eliminar Paciente
                      </button>
                    </div>
                  )}
                </div>
            </header>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6 relative" onClick={() => setIsMenuOpen(false)}>
              
              {activeView === 'technical_sheet' && <FichaMedica patientId={selectedPatient.id} onClose={() => setActiveView('dashboard')} />}
              
              {activeView === 'sessions' && (
                selectedSessionId ? (
                  <SessionDetail 
                    sessionId={selectedSessionId} 
                    patientId={selectedPatient.id}  /* CLAVE: Pasamos el patientId para la creación diferida */
                    onBack={() => setSelectedSessionId(null)} 
                  />
                ) : (
                  <SessionList 
                    patientId={selectedPatient.id} 
                    onSelectSession={(id) => setSelectedSessionId(id)} 
                  />
                )
              )}

              {activeView === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  
                  {/* COLUMNA PRINCIPAL */}
                  <div className="lg:col-span-2 space-y-6">
                    {selectedPatient.status === 'discharged' && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                         <AlertTriangle className="text-blue-400 mt-1" size={20} />
                         <div>
                            <h4 className="text-blue-400 font-medium">Expediente Archivado</h4>
                            <p className="text-sm text-blue-200/60 mt-1">Este paciente ha sido dado de alta. Los datos son de solo lectura hasta que se reactive.</p>
                         </div>
                      </div>
                    )}

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Clock className="text-emerald-500" size={20} />
                        Próxima Sesión
                      </h3>
                      <div className="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                        <div className="bg-zinc-800 p-3 rounded-lg text-center min-w-[60px]">
                          <span className="block text-xs text-zinc-400 uppercase">HOY</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">Continuar Tratamiento</p>
                          <p className="text-sm text-zinc-400">Verificar disponibilidad</p>
                        </div>
                        <button onClick={() => setActiveView('sessions')} disabled={selectedPatient.status === 'discharged'} className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors">Ir a Sesiones</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3">
                             <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Mail size={18}/></div>
                             <div>
                                 <p className="text-xs text-zinc-500 uppercase">Correo</p>
                                 <p className="text-sm text-zinc-200 truncate">{selectedPatient.email || 'No registrado'}</p>
                             </div>
                         </div>
                         <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-3">
                             <div className="p-2 bg-green-500/10 text-green-400 rounded-lg"><Phone size={18}/></div>
                             <div>
                                 <p className="text-xs text-zinc-500 uppercase">Teléfono</p>
                                 <p className="text-sm text-zinc-200">{selectedPatient.phone || 'No registrado'}</p>
                             </div>
                         </div>
                    </div>
                  </div>

                  {/* COLUMNA LATERAL - DASHBOARD DE ESTADO */}
                  <div className="space-y-6">
                    
                    {/* Tarjeta de Estado */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <h4 className="font-medium mb-4 flex items-center gap-2 text-sm text-zinc-300">
                        <Activity size={16} className="text-blue-400" />
                        Estado del Expediente
                      </h4>
                      <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                        <div className={`p-3 rounded-full ${
                            selectedPatient.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                            {selectedPatient.status === 'active' ? <CheckCircle2 size={24} /> : <Archive size={24} />}
                        </div>
                        <div>
                            <p className="text-white font-bold capitalize">{selectedPatient.status === 'active' ? 'Activo' : 'Dado de Alta'}</p>
                            <p className="text-xs text-zinc-500">
                                {selectedPatient.status === 'active' ? 'Puede agendar sesiones' : 'Solo lectura'}
                            </p>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta de Administración */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <h4 className="font-medium mb-4 flex items-center gap-2 text-sm text-zinc-300">
                        <ShieldAlert size={16} className="text-zinc-500" />
                        Administración
                      </h4>
                      <div className="space-y-3">
                        <button 
                            onClick={handleToggleStatus}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors text-zinc-300 text-sm"
                        >
                            {selectedPatient.status === 'active' ? (
                                <>
                                    <FolderClosed size={18} className="text-blue-400"/>
                                    <span>Dar de Alta (Archivar)</span>
                                </>
                            ) : (
                                <>
                                    <Activity size={18} className="text-emerald-400"/>
                                    <span>Reactivar Paciente</span>
                                </>
                            )}
                        </button>

                        <button 
                            onClick={requestDelete}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-red-900/30 hover:bg-red-900/10 hover:border-red-900/50 transition-colors text-red-400 text-sm"
                        >
                            <Trash2 size={18} />
                            <span>Eliminar Paciente</span>
                        </button>
                      </div>
                    </div>

                    {/* Notas Rápidas */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                       <h4 className="font-medium mb-3 flex items-center gap-2 text-sm text-zinc-300">
                        <FileText size={16} className="text-amber-400" />
                        Notas Rápidas
                      </h4>
                      <textarea className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none h-32" placeholder="Escribir recordatorio..."></textarea>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800">
              <Users size={32} className="opacity-50" />
            </div>
            <p className="text-lg font-medium text-zinc-400">Selecciona un paciente</p>
            <p className="text-sm opacity-60">o crea uno nuevo para comenzar</p>
          </div>
        )}
      </main>

      {/* MODALES */}
      
      {/* 1. CREAR PACIENTE */}
      {isCreateModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors"><X size={20} /></button>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Users className="text-emerald-500" size={24}/>Nuevo Paciente</h2>
            <form onSubmit={handleCreatePatient} className="space-y-4">
                <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Nombre Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-zinc-600" size={18} />
                        <input type="text" required placeholder="Ej. Juan Pérez" value={newPatientData.name} onChange={e => setNewPatientData({...newPatientData, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"/>
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Correo Electrónico</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-zinc-600" size={18} />
                        <input type="email" placeholder="juan@ejemplo.com" value={newPatientData.email} onChange={e => setNewPatientData({...newPatientData, email: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"/>
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Teléfono / WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-zinc-600" size={18} />
                        <input type="tel" placeholder="+52 55 1234 5678" value={newPatientData.phone} onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"/>
                    </div>
                </div>
                <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors font-medium">Cancelar</button>
                    <button type="submit" disabled={isCreating} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition-colors disabled:opacity-50">{isCreating ? 'Creando...' : 'Crear y abrir ficha'}</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CONFIRMACIÓN ELIMINAR */}
      {deleteModal.isOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¿Eliminar Paciente?</h3>
              <p className="text-zinc-400 text-sm mb-6">Esta acción es permanente y no se puede deshacer.</p>
              <div className="flex gap-3">
                 <button onClick={() => setDeleteModal({isOpen: false, patientId: null})} className="flex-1 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors font-medium">Cancelar</button>
                 <button onClick={confirmDeletePatient} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/20 transition-colors">Sí, Eliminar</button>
              </div>
           </div>
        </div>
      )}

      {/* 3. ALERTA INFORMATIVA */}
      {alertInfo.isOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{alertInfo.title}</h3>
              <p className="text-zinc-400 text-sm mb-6">{alertInfo.message}</p>
              <button onClick={() => setAlertInfo({...alertInfo, isOpen: false})} className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors">Entendido</button>
           </div>
        </div>
      )}

    </div>
  );
};