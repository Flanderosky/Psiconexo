// UBICACIÓN: src/modules/admin/AdminUsersView.tsx
import { useState, useEffect } from 'react';
import { 
  Search, Shield, User, 
  AlertTriangle, Lock, Edit, 
  X, Save, CalendarDays, Clock, 
  UserPlus, CheckCircle2, XCircle,
  KeyRound, RefreshCw, Copy, Infinity
} from 'lucide-react';
import { supabase, supabaseAdmin } from '../../lib/supabase';

// --- TIPOS ---
interface UserProfile {
  id?: string;
  full_name: string;
  email: string;
  role: 'admin' | 'psychologist';
  subscription_status: 'active' | 'past_due' | 'canceled';
  subscription_end_date?: string | null; 
  created_at?: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const AdminUsersView = () => {
  // --- ESTADOS ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Panel de Edición/Creación
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [tempPassword, setTempPassword] = useState(''); 

  // Notificaciones
  const [toasts, setToasts] = useState<Toast[]>([]);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando usuarios:', error);
      showToast('Error al conectar con la base de datos', 'error');
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  // --- HELPERS ---
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  const copyToClipboard = () => {
    if(tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      showToast('Contraseña copiada', 'success');
    }
  };

  const isExpired = (dateString?: string | null) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(dateString);
    expiry.setHours(0,0,0,0);
    return expiry < today;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return <span className="text-zinc-600 italic">--/--/--</span>;
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // --- FILTROS ---
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (user.full_name?.toLowerCase() || '').includes(term) || 
                          (user.email?.toLowerCase() || '').includes(term);
    const matchesFilter = filterStatus === 'all' || user.subscription_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // --- HANDLERS ---
  const handleEditClick = (user: UserProfile) => {
    setSelectedUser(user);
    setTempPassword('');
    setIsCreating(false);
    setIsDrawerOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedUser({
      full_name: '',
      email: '',
      role: 'psychologist',
      subscription_status: 'active',
      subscription_end_date: new Date().toISOString().split('T')[0]
    });
    generatePassword(); 
    setIsCreating(true);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
        setSelectedUser(null);
        setTempPassword('');
    }, 300);
  };

  const addMonthToSubscription = () => {
    if (!selectedUser) return;
    const currentStr = selectedUser.subscription_end_date;
    const current = currentStr ? new Date(currentStr) : new Date();
    const today = new Date();
    const baseDate = (!currentStr || current < today) ? today : current;
    
    const nextMonth = new Date(baseDate);
    nextMonth.setDate(baseDate.getDate() + 30);
    
    setSelectedUser({
        ...selectedUser, 
        subscription_end_date: nextMonth.toISOString().split('T')[0],
        subscription_status: 'active'
    });
    showToast('Fecha actualizada (+30 días)', 'success');
  };

  // --- GUARDADO DE USUARIO (CON CORRECCIÓN DE ERROR) ---
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    if (!selectedUser.full_name || !selectedUser.email) {
      showToast('Nombre y Correo son obligatorios', 'error');
      return;
    }
    setSaving(true);

    try {
      if (isCreating) {
        // --- 1. MODO CREAR ---
        if (!tempPassword) {
            showToast('Falta generar una contraseña', 'error');
            setSaving(false); 
            return;
        }

        // A) Crear en Auth (Requiere SERVICE_ROLE en .env)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: selectedUser.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: selectedUser.full_name }
        });

        if (authError) throw new Error('Error Auth: ' + authError.message);
        if (!authData.user) throw new Error('No se pudo generar el usuario');

        // B) Crear Perfil (USAMOS UPSERT PARA EVITAR DUPLICADOS)
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert([{ 
             id: authData.user.id, 
             full_name: selectedUser.full_name,
             email: selectedUser.email,
             role: selectedUser.role,
             subscription_status: selectedUser.subscription_status,
             subscription_end_date: selectedUser.role === 'admin' ? null : selectedUser.subscription_end_date
          }]);

        if (insertError) {
           // Si falla el perfil, podrías optar por borrar el usuario Auth para no dejar basura
           // await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
           throw insertError;
        }

        showToast('Usuario creado correctamente', 'success');

      } else {
        // --- 2. MODO EDITAR ---
        
        // A) Actualizar contraseña si se generó una nueva
        if (tempPassword && selectedUser.id) {
            const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(
                selectedUser.id,
                { password: tempPassword }
            );
            if (passError) throw new Error('Error al cambiar contraseña: ' + passError.message);
            showToast('Contraseña actualizada', 'success');
        }

        // B) Actualizar datos del perfil
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: selectedUser.full_name,
            email: selectedUser.email,
            role: selectedUser.role,
            subscription_status: selectedUser.subscription_status,
            subscription_end_date: selectedUser.role === 'admin' ? null : selectedUser.subscription_end_date
          })
          .eq('id', selectedUser.id);

        if (updateError) throw updateError;
        showToast('Perfil actualizado', 'success');
      }

      await fetchUsers();
      closeDrawer();

    } catch (error: any) {
      console.error('Error al guardar:', error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // --- RENDERIZADO DE BADGES ---
  const getStatusBadge = (user: UserProfile) => {
    if (user.role === 'admin') {
       return (
         <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider w-fit">
            <Shield size={10} fill="currentColor"/> Staff / Admin
         </div>
       );
    }
    if (user.subscription_status === 'canceled') {
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider w-fit">
            <XCircle size={10} /> Bloqueado
          </div>
        );
    }
    if (isExpired(user.subscription_end_date)) {
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider w-fit">
            <Clock size={10} /> Vencido
          </div>
        );
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Activo
      </div>
    );
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-black relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 animate-in fade-in relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Shield className="text-indigo-500" size={32} /> Gestión de Usuarios</h1>
            <p className="text-zinc-500 mt-2 text-sm font-light tracking-wide">Administración de accesos y roles.</p>
          </div>
          <div className="flex gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col items-center min-w-[100px] backdrop-blur-sm">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total</span>
                  <span className="text-2xl font-light text-white">{users.length}</span>
              </div>
              <button onClick={handleCreateClick} className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-4 rounded-xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all active:scale-95 h-fit self-center">
                 <UserPlus size={20} /><span className="hidden md:inline">Nuevo Usuario</span>
              </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-2 mb-6 flex flex-col md:flex-row gap-3 justify-between items-center backdrop-blur-md">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900/50 transition-all placeholder:text-zinc-600" />
          </div>
          <div className="flex p-1 bg-black/50 border border-zinc-800 rounded-xl overflow-hidden w-full md:w-auto">
            {['all', 'active', 'canceled'].map(status => (
              <button key={status} onClick={() => { setFilterStatus(status); setCurrentPage(1); }} className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${filterStatus === status ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}>{status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Bloqueados'}</button>
            ))}
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[400px] flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  <th className="px-6 py-4 font-bold">Usuario</th>
                  <th className="px-6 py-4 font-bold">Rol</th>
                  <th className="px-6 py-4 font-bold">Renovación</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold text-right">Editar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center text-zinc-500 animate-pulse">Cargando...</td></tr>
                ) : currentUsers.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center text-zinc-600">No hay usuarios</td></tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-zinc-900/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-zinc-400 font-bold border border-zinc-700 shadow-lg group-hover:border-zinc-600 transition-colors">
                            {user.full_name ? user.full_name.substring(0,2).toUpperCase() : <User size={18}/>}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{user.full_name || 'Sin nombre'}</p>
                            <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'admin' ? 
                           <span className="text-indigo-400 text-xs font-bold flex items-center gap-1"><Shield size={12} /> Admin</span> : 
                           <span className="text-zinc-500 text-xs flex items-center gap-1"><User size={12} /> Psicólogo</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'admin' ? (
                            <span className="text-xs font-mono text-indigo-500/50 flex items-center gap-1">
                                <Infinity size={14} /> Indefinido
                            </span>
                        ) : (
                            <div className={`flex items-center gap-2 text-xs font-mono ${isExpired(user.subscription_end_date) ? 'text-amber-500 font-bold' : 'text-zinc-400'}`}>
                               <CalendarDays size={14} />{formatDate(user.subscription_end_date)}
                            </div>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(user)}</td>
                      <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEditClick(user)} className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"><Edit size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* PAGINACIÓN */}
          <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Página <span className="text-white">{currentPage}</span> de {totalPages || 1}
            </span>
            {totalPages > 1 && (
                <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 transition-colors"><Edit size={16} className="rotate-180" /></button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 transition-colors"><Edit size={16} /></button>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* NOTIFICACIONES */}
      <div className="absolute bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-right-10 fade-in duration-300 ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-900 text-emerald-100' : 'bg-red-950/80 border-red-900 text-red-100'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertTriangle size={18} className="text-red-500" />}
            <p className="text-xs font-medium">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* DRAWER */}
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={closeDrawer}></div>
      <div className={`absolute top-0 right-0 h-full w-full md:w-[450px] bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">{isCreating ? <UserPlus className="text-emerald-500" size={20}/> : <Edit className="text-emerald-500" size={20} />}{isCreating ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
          <button onClick={closeDrawer} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        
        {selectedUser && (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="flex items-start gap-4 pb-6 border-b border-zinc-900">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-lg shrink-0">{selectedUser.full_name ? selectedUser.full_name.substring(0,2).toUpperCase() : <UserPlus />}</div>
              <div className="w-full space-y-3">
                <input type="text" placeholder="Nombre Completo" value={selectedUser.full_name} onChange={(e) => setSelectedUser({...selectedUser, full_name: e.target.value})} className="w-full bg-transparent border-b border-zinc-800 focus:border-emerald-500 outline-none text-white font-medium placeholder:text-zinc-600 py-1 transition-colors" />
                <input type="email" placeholder="correo@ejemplo.com" value={selectedUser.email} onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})} disabled={!isCreating} className={`w-full bg-transparent border-b border-zinc-800 focus:border-emerald-500 outline-none text-sm placeholder:text-zinc-700 py-1 transition-colors ${!isCreating ? 'text-zinc-500 cursor-not-allowed' : 'text-zinc-400'}`} />
                
                <div className="pt-2">
                    <label className="text-[10px] uppercase text-zinc-600 font-bold tracking-wider mb-1 block">Tipo de Cuenta</label>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedUser({...selectedUser, role: 'psychologist'})} className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${selectedUser.role === 'psychologist' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}>Psicólogo</button>
                        <button onClick={() => setSelectedUser({...selectedUser, role: 'admin'})} className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${selectedUser.role === 'admin' ? 'bg-indigo-900/30 text-indigo-300 border-indigo-500/50' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}>Administrador</button>
                    </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-2"><KeyRound size={12} /> {isCreating ? 'Credenciales de Acceso' : 'Restablecer Contraseña'}</label>
              {isCreating ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-sm tracking-widest relative group">
                        {tempPassword || "Generando..."}
                        <button onClick={generatePassword} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"><RefreshCw size={14}/></button>
                    </div>
                    <button onClick={copyToClipboard} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Copiar"><Copy size={18} /></button>
                  </div>
              ) : (
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 space-y-3">
                      {!tempPassword ? (
                          <div className="flex items-center justify-between">
                             <div className="text-xs text-zinc-500"><p>Contraseña oculta.</p></div>
                             <button onClick={generatePassword} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition-colors border border-zinc-700">Generar Nueva</button>
                          </div>
                      ) : (
                          <div className="animate-in fade-in slide-in-from-top-2 space-y-2">
                             <p className="text-[10px] uppercase font-bold text-emerald-500">Nueva contraseña:</p>
                             <div className="flex items-center gap-2">
                                <div className="flex-1 bg-black border border-emerald-900/50 rounded-lg px-3 py-2 text-emerald-100 font-mono text-sm tracking-wide">{tempPassword}</div>
                                <button onClick={copyToClipboard} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"><Copy size={16} /></button>
                                <button onClick={() => setTempPassword('')} className="p-2 text-zinc-500 hover:text-red-400"><X size={16} /></button>
                             </div>
                          </div>
                      )}
                  </div>
              )}
            </div>

            {selectedUser.role === 'admin' ? (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
                    <Shield className="text-indigo-400 mt-0.5" size={18} />
                    <div><h4 className="text-sm font-bold text-indigo-300">Acceso Permanente</h4><p className="text-xs text-indigo-200/60 mt-1">Los administradores tienen acceso ilimitado.</p></div>
                </div>
            ) : (
                <div className="space-y-4">
                  <label className="text-xs uppercase tracking-wider font-bold text-zinc-500 flex justify-between">Vencimiento de Acceso {isExpired(selectedUser.subscription_end_date) && <span className="text-amber-500 flex items-center gap-1"><AlertTriangle size={12}/> Vencido</span>}</label>
                  <div className="flex gap-2">
                      <input type="date" value={selectedUser.subscription_end_date || ''} onChange={(e) => setSelectedUser({...selectedUser, subscription_end_date: e.target.value})} className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm font-mono" />
                      <button onClick={addMonthToSubscription} className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-xs font-bold hover:bg-zinc-800 hover:text-white transition-colors" title="Añadir 30 días">+30 Días</button>
                  </div>
                </div>
            )}
            
            <div className={`p-4 rounded-xl flex items-center justify-between border transition-colors ${selectedUser.subscription_status === 'canceled' ? 'bg-red-950/10 border-red-900/30' : 'bg-zinc-900/30 border-zinc-800'}`}>
               <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${selectedUser.subscription_status === 'canceled' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-500'}`}><Lock size={18} /></div><div><p className={`text-sm font-medium ${selectedUser.subscription_status === 'canceled' ? 'text-red-200' : 'text-zinc-300'}`}>Bloqueo de Emergencia</p><p className="text-xs opacity-60">Revocar acceso inmediatamente</p></div></div>
               <div onClick={() => setSelectedUser({...selectedUser, subscription_status: selectedUser.subscription_status === 'canceled' ? 'active' : 'canceled'})} className={`h-6 w-11 rounded-full border relative cursor-pointer transition-colors ${selectedUser.subscription_status === 'canceled' ? 'bg-red-900/50 border-red-500' : 'bg-zinc-900 border-zinc-700'}`}><div className={`absolute top-1 h-3.5 w-3.5 rounded-full transition-all duration-300 shadow-sm ${selectedUser.subscription_status === 'canceled' ? 'right-1 bg-red-500' : 'left-1 bg-zinc-500'}`}></div></div>
            </div>
          </div>
        )}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
          <button onClick={closeDrawer} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
          <button onClick={handleSaveUser} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center gap-2 disabled:opacity-50">{saving ? 'Guardando...' : <><Save size={16} /> {isCreating ? 'Crear Usuario' : 'Guardar Cambios'}</>}</button>
        </div>
      </div>
    </div>
  );
};