// UBICACIÓN: src/modules/patients/PatientsView.tsx
import { useState, useEffect } from 'react';
import { 
  Plus, Search, User, Phone, Mail, 
  X, Save, Trash2, FileText, 
  AlertCircle, Siren, XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// --- INTERFAZ ---
export interface Patient {
  id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  address?: string;
  notes?: string;
  // Campos de emergencia
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

export const PatientsView = ({ 
  initialCreateMode, 
  onResetCreateMode,
  initialPatientId,
  onResetPatientId
}: PatientsViewProps) => {
  
  // --- ESTADOS ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer (Formulario)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [saving, setSaving] = useState(false);

  // MODAL DE EMERGENCIA
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyData, setEmergencyData] = useState<Patient | null>(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (initialCreateMode) {
      handleCreateNew();
      if (onResetCreateMode) onResetCreateMode();
    }
    if (initialPatientId && patients.length > 0) {
        const patientFound = patients.find(p => p.id === initialPatientId);
        if (patientFound) handleEdit(patientFound);
        if (onResetPatientId) onResetPatientId();
    }
  }, [initialCreateMode, initialPatientId, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // 1. Obtener el usuario actual para filtrar
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
         setPatients([]);
         return;
      }

      // 2. Filtrar por user_id
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id) // <--- CORRECCIÓN: Solo sus pacientes
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleCreateNew = () => {
    setSelectedPatient({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: ''
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDrawerOpen(true);
  };

  const handleEmergencyClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation(); 
    setEmergencyData(patient);
    setEmergencyModalOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedPatient(null), 300);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este paciente? Se borrará todo su historial.')) return;
    try {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
      setPatients(patients.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar paciente.');
    }
  };

  const handleSave = async () => {
    // 1. Validaciones
    if (!selectedPatient?.first_name || !selectedPatient?.last_name) {
      alert('⚠️ Nombre y Apellido son obligatorios.');
      return;
    }

    if (!selectedPatient?.emergency_contact_name || !selectedPatient?.emergency_contact_phone) {
      alert('🚨 SEGURIDAD: Debes agregar un contacto de emergencia obligatoriamente.');
      return;
    }

    setSaving(true);
    try {
      // 2. Obtener usuario para asignar propiedad
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión activa");

      // 3. Agregar user_id al objeto
      const patientData = { 
        ...selectedPatient,
        user_id: user.id // <--- CORRECCIÓN: Asigna el paciente al usuario actual
      };

      const { data, error } = await supabase
        .from('patients')
        .upsert(patientData)
        .select()
        .single();

      if (error) throw error;

      if (selectedPatient.id) {
        setPatients(patients.map(p => p.id === data.id ? data : p));
      } else {
        setPatients([data, ...patients]);
      }
      closeDrawer();
    } catch (error: any) {
      console.error('Error guardando:', error);
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-black text-white relative overflow-hidden">
      
      {/* HEADER */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white">Pacientes</h1>
          <p className="text-zinc-500 text-sm mt-1">Gestión de expedientes clínicos.</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="group flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform"/> 
          <span>Nuevo Paciente</span>
        </button>
      </div>

      {/* SEARCH */}
      <div className="px-6 md:px-8 mb-6 z-10">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* GRID */}
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
              <div key={patient.id} onClick={() => handleEdit(patient)} className="group bg-zinc-900/30 border border-zinc-800/60 hover:border-emerald-500/30 hover:bg-zinc-900/60 rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                
                {/* Parte Superior Tarjeta */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
                      {(patient.first_name && patient.first_name.length > 0) ? patient.first_name[0] : ''}
                      {(patient.last_name && patient.last_name.length > 0) ? patient.last_name[0] : ''}
                      {(!patient.first_name && !patient.last_name) && <User size={20} />}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(patient.id!); }}
                      className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">
                    {patient.first_name || 'Sin Nombre'} {patient.last_name || ''}
                  </h3>
                  
                  <div className="space-y-1 mt-2">
                    {patient.email && <div className="flex items-center gap-2 text-xs text-zinc-500"><Mail size={12} /> <span className="truncate">{patient.email}</span></div>}
                    {patient.phone && <div className="flex items-center gap-2 text-xs text-zinc-500"><Phone size={12} /> <span>{patient.phone}</span></div>}
                  </div>
                </div>

                {/* BOTÓN DE EMERGENCIA */}
                <div className="mt-4 pt-4 border-t border-zinc-800/50">
                   <button 
                     onClick={(e) => handleEmergencyClick(e, patient)}
                     className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider group/alert"
                   >
                      <Siren size={14} className="group-hover/alert:animate-pulse" />
                      Emergencia
                   </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL DE ALERTA DE EMERGENCIA --- */}
      {emergencyModalOpen && emergencyData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm" onClick={() => setEmergencyModalOpen(false)}></div>
           
           <div className="relative bg-black border-2 border-red-600 w-full max-w-md rounded-3xl p-8 shadow-[0_0_100px_rgba(220,38,38,0.5)] animate-in zoom-in-95 duration-200">
              <button onClick={() => setEmergencyModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><XCircle size={32}/></button>

              <div className="flex flex-col items-center text-center space-y-6">
                 <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center animate-bounce">
                    <Siren size={48} className="text-white" />
                 </div>

                 <div>
                    <h2 className="text-xs font-bold text-red-500 tracking-[0.3em] uppercase mb-2">Contacto de Emergencia</h2>
                    <h3 className="text-3xl font-bold text-white mb-1">{emergencyData.emergency_contact_name}</h3>
                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm font-medium border border-zinc-700">
                       {emergencyData.emergency_contact_relation}
                    </span>
                 </div>

                 <div className="w-full bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Teléfono de Contacto</p>
                    <a href={`tel:${emergencyData.emergency_contact_phone}`} className="text-2xl md:text-3xl font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-3">
                       <Phone size={24} />
                       {emergencyData.emergency_contact_phone}
                    </a>
                 </div>

                 <button onClick={() => setEmergencyModalOpen(false)} className="text-zinc-500 hover:text-white text-sm underline">
                    Cerrar Alerta
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- DRAWER (FORMULARIO) --- */}
      <>
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeDrawer}/>
        <div className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <h2 className="text-xl font-light text-white flex items-center gap-2">
              {selectedPatient?.id ? <FileText className="text-emerald-500" size={20}/> : <Plus className="text-emerald-500" size={20}/>}
              {selectedPatient?.id ? 'Editar Paciente' : 'Nuevo Paciente'}
            </h2>
            <button onClick={closeDrawer} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-2 flex items-center gap-2"><User size={14}/> Información Personal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Nombre *</label>
                  <input className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="Juan" value={selectedPatient?.first_name || ''} onChange={e => setSelectedPatient({...selectedPatient!, first_name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Apellido *</label>
                  <input className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" placeholder="Pérez" value={selectedPatient?.last_name || ''} onChange={e => setSelectedPatient({...selectedPatient!, last_name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Correo</label>
                  <input type="email" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" value={selectedPatient?.email || ''} onChange={e => setSelectedPatient({...selectedPatient!, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Teléfono</label>
                  <input type="tel" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" value={selectedPatient?.phone || ''} onChange={e => setSelectedPatient({...selectedPatient!, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Nacimiento</label>
                  <input type="date" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors" value={selectedPatient?.birth_date || ''} onChange={e => setSelectedPatient({...selectedPatient!, birth_date: e.target.value})} />
                </div>
              </div>
            </div>

            {/* SECCIÓN OBLIGATORIA DE EMERGENCIA */}
            <div className="pt-6 border-t border-zinc-900">
               <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-red-500 text-white animate-pulse">
                    <AlertCircle size={16} />
                  </div>
                  <h3 className="text-xs uppercase tracking-wider font-bold text-red-500">Contacto de Emergencia (Obligatorio)</h3>
               </div>
               
               <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-red-400 uppercase font-bold">Nombre del Contacto *</label>
                    <input className="w-full bg-black border border-red-900/30 rounded-xl px-4 py-2.5 text-white focus:border-red-500 outline-none transition-colors text-sm" placeholder="Ej: María López" value={selectedPatient?.emergency_contact_name || ''} onChange={e => setSelectedPatient({...selectedPatient!, emergency_contact_name: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] text-red-400 uppercase font-bold">Parentesco *</label>
                        <select className="w-full bg-black border border-red-900/30 rounded-xl px-4 py-2.5 text-white focus:border-red-500 outline-none transition-colors text-sm appearance-none" value={selectedPatient?.emergency_contact_relation || ''} onChange={e => setSelectedPatient({...selectedPatient!, emergency_contact_relation: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          <option value="Padre/Madre">Padre / Madre</option>
                          <option value="Pareja">Pareja</option>
                          <option value="Hijo/a">Hijo/a</option>
                          <option value="Hermano/a">Hermano/a</option>
                          <option value="Amigo/a">Amigo/a</option>
                          <option value="Otro">Otro</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] text-red-400 uppercase font-bold">Teléfono Emergencia *</label>
                        <input type="tel" className="w-full bg-black border border-red-900/30 rounded-xl px-4 py-2.5 text-white focus:border-red-500 outline-none transition-colors text-sm" placeholder="55..." value={selectedPatient?.emergency_contact_phone || ''} onChange={e => setSelectedPatient({...selectedPatient!, emergency_contact_phone: e.target.value})} />
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-zinc-900">
               <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-2">Notas</h3>
               <textarea className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors min-h-[100px] resize-none" placeholder="..." value={selectedPatient?.notes || ''} onChange={e => setSelectedPatient({...selectedPatient!, notes: e.target.value})} />
            </div>
          </div>

          <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
            <button onClick={closeDrawer} className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 disabled:opacity-50">
              {saving ? 'Guardando...' : <><Save size={18}/> Guardar Paciente</>}
            </button>
          </div>
        </div>
      </>
    </div>
  );
};