// src/modules/patients/PatientsView.tsx
import { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Calendar, Clock, 
  ChevronRight, MoreVertical, FileText, 
  Activity 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Importamos los componentes modulares
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
  
  // Control de Vistas (Pestañas)
  const [activeView, setActiveView] = useState<'dashboard' | 'technical_sheet' | 'sessions'>('dashboard');
  
  // Control específico para la vista de sesiones (si estamos viendo la lista o una sesión específica)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .order('name');
        
        if (error) throw error;
        if (data) {
          setPatients(data);
          // Seleccionar el primero por defecto si existe
          if (data.length > 0 && !selectedPatientId) {
            setSelectedPatientId(data[0].id);
          }
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

  // Crear paciente rápido
  const handleCreatePatient = async () => {
    const name = prompt("Nombre del nuevo paciente:");
    if (!name) return;
    
    const { data } = await supabase
      .from('patients')
      .insert([{ name, status: 'active' }])
      .select()
      .single();

    if (data) {
      setPatients([...patients, data]);
      setSelectedPatientId(data.id);
    }
  };

  if (loading) return <div className="p-8 text-zinc-400">Cargando sistema...</div>;

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden">
      
      {/* --- COLUMNA IZQUIERDA: LISTA DE PACIENTES --- */}
      <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users size={20} className="text-emerald-500" />
              Pacientes
            </h2>
            <button 
              onClick={handleCreatePatient}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-emerald-500"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
            <input 
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredPatients.map(patient => (
            <div
              key={patient.id}
              onClick={() => {
                setSelectedPatientId(patient.id);
                setActiveView('dashboard'); // Volver al dashboard al cambiar de paciente
                setSelectedSessionId(null); // Resetear selección de sesión
              }}
              className={`p-4 border-b border-zinc-800/50 cursor-pointer transition-all hover:bg-zinc-900 ${
                selectedPatientId === patient.id ? 'bg-zinc-900 border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedPatientId === patient.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {patient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`font-medium ${selectedPatientId === patient.id ? 'text-white' : 'text-zinc-300'}`}>
                      {patient.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${
                        patient.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-xs text-zinc-500 capitalize">{patient.status}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className={`text-zinc-600 ${selectedPatientId === patient.id ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- COLUMNA DERECHA: AREA DE TRABAJO --- */}
      <main className="flex-1 flex flex-col bg-black min-w-0">
        {selectedPatient ? (
          <>
            {/* Header del Paciente */}
            <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-white">{selectedPatient.name}</h1>
                
                {/* PESTAÑAS DE NAVEGACIÓN */}
                <div className="flex gap-1 ml-4 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  <button 
                    onClick={() => setActiveView('dashboard')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      activeView === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => setActiveView('technical_sheet')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      activeView === 'technical_sheet' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Ficha Técnica
                  </button>
                  <button 
                    onClick={() => setActiveView('sessions')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      activeView === 'sessions' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Sesiones
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                  <Calendar size={18} />
                </button>
                <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </header>

            {/* CONTENIDO PRINCIPAL CAMBIANTE */}
            <div className="flex-1 overflow-y-auto p-6 relative">
              
              {/* VISTA 1: FICHA TÉCNICA */}
              {activeView === 'technical_sheet' && (
                <FichaMedica 
                  patientId={selectedPatient.id} 
                  onClose={() => setActiveView('dashboard')} 
                />
              )}

              {/* VISTA 2: SESIONES (Lista o Detalle) */}
              {activeView === 'sessions' && (
                selectedSessionId ? (
                  <SessionDetail 
                    sessionId={selectedSessionId} 
                    onBack={() => setSelectedSessionId(null)} 
                  />
                ) : (
                  <SessionList 
                    patientId={selectedPatient.id} 
                    onSelectSession={(id) => setSelectedSessionId(id)} 
                  />
                )
              )}

              {/* VISTA 3: DASHBOARD (Resumen) */}
              {activeView === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  
                  {/* Panel Principal Dashboard */}
                  <div className="lg:col-span-2 space-y-6">
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
                        <button 
                          onClick={() => setActiveView('sessions')}
                          className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Ir a Sesiones
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Actividad Reciente</h3>
                      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <p className="text-zinc-500 text-sm text-center">
                          El historial detallado está disponible en la pestaña "Sesiones".
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Derecho Dashboard */}
                  <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                      <h4 className="font-medium mb-4 flex items-center gap-2 text-sm text-zinc-300">
                        <Activity size={16} className="text-blue-400" />
                        Estado Actual
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">Estado</span>
                          <span className="text-emerald-400 capitalize">{selectedPatient.status}</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                       <h4 className="font-medium mb-3 flex items-center gap-2 text-sm text-zinc-300">
                        <FileText size={16} className="text-amber-400" />
                        Notas Rápidas
                      </h4>
                      <textarea 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 resize-none h-32"
                        placeholder="Escribir recordatorio..."
                      ></textarea>
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
    </div>
  );
};