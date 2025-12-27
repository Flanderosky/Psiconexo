// UBICACIÓN: src/modules/admin/AdminUsersView.tsx
import { useState, useEffect } from 'react';
import { 
  Search, Shield, User, 
  AlertTriangle, Lock, Edit, 
  ChevronLeft, ChevronRight, X, Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Definimos la interfaz de Usuario
interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'psychologist';
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'past_due' | 'canceled';
  created_at: string;
  last_login?: string; 
}

export const AdminUsersView = () => {
  // --- ESTADOS ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Estado para el botón de guardar
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Panel de Edición (Drawer)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
      alert('Error al cargar la lista de usuarios.');
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
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
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedUser(null), 300); // Limpiar después de la animación
  };

  // --- FUNCIÓN DE GUARDADO CONECTADA A SUPABASE ---
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      // 1. Actualizar en Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_plan: selectedUser.subscription_plan,
          subscription_status: selectedUser.subscription_status,
          // Si añades roles editables en el futuro: role: selectedUser.role 
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // 2. Éxito: Recargar lista y cerrar
      alert('Usuario actualizado correctamente.');
      await fetchUsers(); // Refresca la tabla
      closeDrawer();

    } catch (error: any) {
      console.error('Error al actualizar:', error);
      alert(`Hubo un error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  // --- HELPERS VISUALES ---
  const getPlanBadge = (plan: string) => {
    const styles = {
      pro: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      free: 'bg-zinc-800 text-zinc-400 border-zinc-700'
    };
    const style = styles[plan as keyof typeof styles] || styles.free;
    
    return (
      <span className={`px-2 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${style}`}>
        {plan}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Activo
          </div>
        );
      case 'past_due': 
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
            <AlertTriangle size={10} /> Deuda
          </div>
        );
      case 'canceled': 
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
            <X size={10} /> Inactivo
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-black relative">
      
      {/* FONDO AMBIENTAL */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 animate-in fade-in relative z-10">
        
        {/* HEADER & KPI */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="text-indigo-500" size={32} />
              Gestión de Usuarios
            </h1>
            <p className="text-zinc-500 mt-2 text-sm font-light tracking-wide max-w-md">
              Control centralizado de roles, permisos y estados de facturación.
            </p>
          </div>
          
          <div className="flex gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col items-center min-w-[120px] backdrop-blur-sm">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Usuarios</span>
                  <span className="text-2xl font-light text-white">{users.length}</span>
              </div>
              <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-4 flex flex-col items-center min-w-[120px] backdrop-blur-sm">
                  <span className="text-[10px] text-emerald-500/70 uppercase tracking-widest font-bold mb-1">Activos</span>
                  <span className="text-2xl font-light text-emerald-400">{users.filter(u => u.subscription_status === 'active').length}</span>
              </div>
          </div>
        </div>

        {/* TOOLBAR (Buscador y Filtros) */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-2 mb-6 flex flex-col md:flex-row gap-3 justify-between items-center backdrop-blur-md">
          {/* Buscador */}
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, email..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-zinc-900/50 transition-all placeholder:text-zinc-600"
            />
          </div>

          {/* Tabs de Filtro */}
          <div className="flex p-1 bg-black/50 border border-zinc-800 rounded-xl overflow-hidden w-full md:w-auto">
            {['all', 'active', 'past_due'].map(status => (
              <button
                key={status}
                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                  filterStatus === status 
                    ? 'bg-zinc-800 text-white shadow-lg' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {status === 'all' ? 'Todos' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[400px] flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  <th className="px-6 py-4 font-bold">Usuario</th>
                  <th className="px-6 py-4 font-bold">Rol</th>
                  <th className="px-6 py-4 font-bold">Suscripción</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center text-zinc-500 animate-pulse">Cargando base de datos...</td></tr>
                ) : currentUsers.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center text-zinc-600">No se encontraron resultados</td></tr>
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
                        {user.role === 'admin' ? (
                          <span className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold bg-indigo-950/30 px-2 py-1 rounded w-fit border border-indigo-500/20">
                            <Shield size={12} fill="currentColor" /> Admin
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs flex items-center gap-1.5">
                            <User size={12} /> Psicólogo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getPlanBadge(user.subscription_plan)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.subscription_status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Editar usuario"
                          >
                             <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER DE PAGINACIÓN */}
          <div className="border-t border-zinc-800 bg-zinc-950/50 p-4 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Mostrando <span className="text-zinc-300 font-bold">{startIndex + 1}</span> - <span className="text-zinc-300 font-bold">{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> de {filteredUsers.length}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- PANEL LATERAL DE EDICIÓN (DRAWER) --- */}
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
      ></div>

      {/* Drawer */}
      <div className={`absolute top-0 right-0 h-full w-full md:w-[450px] bg-zinc-950 border-l border-zinc-800 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header Drawer */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit className="text-emerald-500" size={20} />
            Editar Usuario
          </h2>
          <button onClick={closeDrawer} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Drawer */}
        {selectedUser && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Info Tarjeta */}
            <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 text-xl font-bold">
                 {selectedUser.full_name?.substring(0,2).toUpperCase() || <User />}
              </div>
              <div>
                <h3 className="text-white font-medium text-lg">{selectedUser.full_name}</h3>
                <p className="text-zinc-500 text-sm">{selectedUser.email}</p>
                <p className="text-xs text-zinc-600 mt-1">ID: <span className="font-mono">{selectedUser.id.substring(0,8)}...</span></p>
              </div>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-bold text-zinc-500">Plan de Suscripción</label>
                <div className="grid grid-cols-3 gap-2">
                  {['free', 'pro', 'enterprise'].map(plan => (
                    <button
                      key={plan}
                      onClick={() => setSelectedUser({...selectedUser, subscription_plan: plan as any})}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all ${
                        selectedUser.subscription_plan === plan
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                          : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs uppercase tracking-wider font-bold text-zinc-500">Estado de Cuenta</label>
                 <select 
                    value={selectedUser.subscription_status}
                    onChange={(e) => setSelectedUser({...selectedUser, subscription_status: e.target.value as any})}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-indigo-500 outline-none text-sm"
                 >
                    <option value="active">Activo (Pagos al día)</option>
                    <option value="past_due">Deuda Pendiente</option>
                    <option value="canceled">Inactivo / Cancelado</option>
                 </select>
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-950/10 border border-red-900/20 rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                        <Lock size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-200">Restringir Acceso</p>
                        <p className="text-xs text-red-500/60">Bloquear entrada a la plataforma</p>
                      </div>
                   </div>
                   
                   {/* TOGGLE SWITCH FUNCIONAL */}
                   <div 
                      onClick={() => setSelectedUser({
                        ...selectedUser, 
                        subscription_status: selectedUser.subscription_status === 'canceled' ? 'active' : 'canceled'
                      })}
                      className={`h-6 w-11 rounded-full border relative cursor-pointer transition-colors ${
                        selectedUser.subscription_status === 'canceled' 
                          ? 'bg-red-900/50 border-red-500' // Bloqueado (ON)
                          : 'bg-zinc-900 border-zinc-700'  // Normal (OFF)
                      }`}
                   >
                      <div className={`absolute top-1 h-3.5 w-3.5 rounded-full transition-all duration-300 shadow-sm ${
                        selectedUser.subscription_status === 'canceled'
                          ? 'right-1 bg-red-500' 
                          : 'left-1 bg-zinc-500'
                      }`}></div>
                   </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer Drawer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
          <button 
            onClick={closeDrawer}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSaveUser}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
               <>Guardando...</>
            ) : (
               <>
                 <Save size={16} />
                 Guardar Cambios
               </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};