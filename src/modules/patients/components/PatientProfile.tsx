// UBICACIÓN: src/modules/patients/components/PatientProfile.tsx
import { useEffect, useState } from 'react';
import { 
  User, Phone, Mail, Calendar, 
  Brain, Activity, ArrowLeft, Play, 
  FileText, Dna, Hash, // <--- Hash está aquí correctamente
  Trash2, Archive, CheckCircle2, Loader2, ExternalLink
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface PatientProfileProps {
  patient: any;
  onBack: () => void;
  onStartSession: () => void;
  onOpenSession: (sessionId: string) => void; 
}

export const PatientProfile = ({ patient, onBack, onStartSession, onOpenSession }: PatientProfileProps) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [patientStatus, setPatientStatus] = useState(patient.status || 'active');

  // 1. CARGAR HISTORIAL
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });
      
      if (data) setSessions(data);
      setLoadingHistory(false);
    };
    fetchHistory();
  }, [patient.id]);

  // --- ACCIONES ADMINISTRATIVAS ---
  const handleToggleStatus = async () => {
    setActionLoading(true);
    const newStatus = patientStatus === 'active' ? 'archived' : 'active';
    const { error } = await supabase.from('patients').update({ status: newStatus }).eq('id', patient.id);
    if (!error) setPatientStatus(newStatus);
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de ELIMINAR este expediente permanentemente?')) return;
    setActionLoading(true);
    const { error } = await supabase.from('patients').delete().eq('id', patient.id);
    if (!error) onBack(); else { alert('Error al eliminar'); setActionLoading(false); }
  };

  // --- HELPERS ---
  const getAge = (dateString: string) => {
    if (!dateString) return '--';
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age + ' Años';
  };

  const formatFileId = (num: number) => {
    if (!num) return 'EXP-NEW';
    return `EXP-${num.toString().padStart(3, '0')}`;
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-black p-6 md:p-10 animate-in slide-in-from-right-8 duration-500 relative">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* NAV */}
      <button onClick={onBack} className="group flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
        <span className="text-xs uppercase tracking-widest font-medium">Volver a la lista</span>
      </button>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-1 space-y-6">
           <div className={`bg-zinc-950/50 border ${patientStatus === 'active' ? 'border-zinc-900' : 'border-amber-900/30'} p-6 rounded-2xl text-center relative overflow-hidden group transition-colors`}>
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-50"></div>
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800 group-hover:border-emerald-500/30 transition-colors shadow-lg shadow-black">
                 <User size={40} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" strokeWidth={1}/>
              </div>
              <h2 className="text-xl text-white font-light tracking-wide mb-1">{patient.full_name}</h2>
              <p className="text-xs text-emerald-500 uppercase tracking-widest font-bold mb-4">{patient.occupation || 'PACIENTE'}</p>
              <div className="flex justify-center gap-2">
                 <span className={`px-3 py-1 rounded-full text-[10px] border flex items-center gap-1.5 ${patientStatus === 'active' ? 'bg-zinc-900 text-zinc-300 border-zinc-800' : 'bg-amber-950/20 text-amber-500 border-amber-900/30'}`}>
                    {patientStatus === 'active' ? <><Activity size={10} className="text-emerald-500"/> Activo</> : <><Archive size={10} className="text-amber-500"/> Archivado</>}
                 </span>
                 <span className="px-3 py-1 bg-zinc-900 rounded-full text-[10px] text-zinc-300 border border-zinc-800 flex items-center gap-1.5 font-mono">
                    <Hash size={10} className="text-zinc-500"/> {formatFileId(patient.file_number)}
                 </span>
              </div>
           </div>

           <div className="bg-zinc-950/30 border border-zinc-900/50 p-5 rounded-2xl space-y-4">
              <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold border-b border-zinc-800 pb-2">Ficha Técnica</h3>
              <div className="flex items-center gap-3 text-zinc-400"><div className="p-2 bg-zinc-900 rounded-lg"><Mail size={14}/></div><span className="text-xs">{patient.email || 'Sin correo'}</span></div>
              <div className="flex items-center gap-3 text-zinc-400"><div className="p-2 bg-zinc-900 rounded-lg"><Phone size={14}/></div><span className="text-xs">{patient.phone || 'Sin teléfono'}</span></div>
              <div className="flex items-center gap-3 text-zinc-400"><div className="p-2 bg-zinc-900 rounded-lg"><Calendar size={14}/></div><span className="text-xs">{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString() : '--/--/--'}</span></div>
              <div className="flex items-center gap-3 text-zinc-400"><div className="p-2 bg-zinc-900 rounded-lg"><Dna size={14}/></div><span className="text-xs">{getAge(patient.birth_date)}</span></div>
           </div>

           <div className="bg-zinc-950/30 border border-zinc-900/50 p-5 rounded-2xl">
              <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold border-b border-zinc-800 pb-4 mb-4">Administración</h3>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={handleToggleStatus} disabled={actionLoading} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${patientStatus === 'active' ? 'bg-amber-950/10 border-amber-900/20 text-amber-600 hover:bg-amber-900/20 hover:text-amber-500' : 'bg-emerald-950/10 border-emerald-900/20 text-emerald-600 hover:bg-emerald-900/20 hover:text-emerald-500'}`}>
                    {actionLoading ? <Loader2 size={16} className="animate-spin"/> : (patientStatus === 'active' ? <Archive size={18} /> : <CheckCircle2 size={18} />)}
                    <span className="text-[9px] uppercase tracking-wider font-bold">{patientStatus === 'active' ? 'Dar de Alta' : 'Reactivar'}</span>
                 </button>
                 <button onClick={handleDelete} disabled={actionLoading} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-red-950/10 border border-red-900/20 text-red-700 hover:bg-red-900/20 hover:text-red-500 transition-all">
                    {actionLoading ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={18} />}
                    <span className="text-[9px] uppercase tracking-wider font-bold">Eliminar</span>
                 </button>
              </div>
           </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-2 space-y-6">
           
           {patientStatus === 'active' ? (
               <button onClick={onStartSession} className="w-full bg-gradient-to-r from-emerald-950/30 to-zinc-900 border border-emerald-900/50 p-6 rounded-2xl group hover:border-emerald-500/50 hover:bg-emerald-950/40 transition-all duration-300 relative overflow-hidden flex items-center justify-between">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="flex items-center gap-5 relative z-10">
                     <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <Play size={24} fill="currentColor" className="ml-1"/>
                     </div>
                     <div className="text-left">
                        <h3 className="text-lg text-white font-light tracking-wide group-hover:text-emerald-100">Nueva Sesión</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest group-hover:text-emerald-500/70">Iniciar seguimiento clínico</p>
                     </div>
                  </div>
                  <Activity className="text-zinc-700 group-hover:text-emerald-500 transition-colors relative z-10" size={32} strokeWidth={1}/>
               </button>
           ) : (
               <div className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-3 text-amber-500/50"><Archive size={18} /><span className="text-xs uppercase tracking-widest">Paciente Archivado</span></div>
           )}

           <div className="bg-zinc-900/20 border border-zinc-800 p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                 <Brain className="text-emerald-500" size={18} strokeWidth={1.5}/>
                 <h3 className="text-sm text-white font-medium tracking-wide">Contexto del Caso</h3>
              </div>
              <p className="text-zinc-300 text-sm font-light leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-zinc-800">{patient.clinical_summary || "No hay información registrada en la ficha inicial."}</p>
           </div>

           {/* LISTA DE SESIONES INTERACTIVA */}
           <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={14} /> Historial de Sesiones ({sessions.length})</h3>

              {loadingHistory ? (
                <div className="p-8 text-center text-zinc-600 text-xs uppercase tracking-widest animate-pulse">Cargando historial...</div>
              ) : sessions.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-600"><p className="text-xs">No hay sesiones registradas aún.</p></div>
              ) : (
                <div className="space-y-4">
                   {sessions.map((session) => (
                      <div 
                        key={session.id} 
                        // --- AQUÍ CONECTAMOS EL CLIC ---
                        onClick={() => onOpenSession(session.id)}
                        className="group bg-black border border-zinc-900 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-900/5 relative"
                      >
                         {/* Indicador de "Click para abrir" */}
                         <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
                            <ExternalLink size={16} />
                         </div>

                         <div className="bg-zinc-950/50 px-4 py-3 flex items-center justify-between border-b border-zinc-900 group-hover:bg-zinc-900/50 transition-colors">
                             <div className="flex items-center gap-3">
                                 <div className="px-2 py-1 bg-zinc-900 rounded text-[10px] text-zinc-400 font-mono border border-zinc-800">
                                     {new Date(session.created_at).toLocaleDateString()}
                                 </div>
                                 <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                                     {session.tags && session.tags[0] ? session.tags[0] : 'Sesión General'}
                                 </h4>
                             </div>
                             <span className="text-[10px] text-zinc-600 uppercase font-mono mr-6">
                                 {session.duration ? Math.round(session.duration/60) + ' MIN' : ''}
                             </span>
                         </div>
                         <div className="p-4">
                             <p className="text-sm text-zinc-300 font-light leading-relaxed whitespace-pre-wrap line-clamp-3 group-hover:line-clamp-none transition-all">
                                 {session.notes || session.content || "Sin notas registradas."}
                             </p>
                             <div className="mt-2 text-[9px] text-zinc-600 uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Clic para ver detalles completos
                             </div>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </div>

        </div>
      </div>
    </div>
  );
};