// UBICACIÓN: src/modules/admin/AdminUsersView.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreHorizontal, Shield, 
  CreditCard, User, CheckCircle2, XCircle, 
  AlertTriangle, Lock, Trash2, Edit
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'psychologist';
  subscription_plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'past_due' | 'canceled';
  created_at: string;
}

export const AdminUsersView = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Consultamos la tabla 'profiles' que creamos en el SQL
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando usuarios:', error);
    } else {
      setUsers(data as UserProfile[]);
    }
    setLoading(false);
  };

  // --- FILTROS ---
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.subscription_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // --- HELPERS VISUALES ---
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'pro': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">PRO</span>;
      case 'enterprise': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">Enterprise</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">Gratis</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-500';
      case 'past_due': return 'text-amber-500';
      case 'canceled': return 'text-red-500';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-black p-6 md:p-10 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-indigo-500" size={32} />
            Gestión de Usuarios
          </h1>
          <p className="text-zinc-500 mt-1">Administra accesos, roles y suscripciones de la plataforma.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col items-center min-w-[100px]">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total</span>
                <span className="text-xl font-bold text-white">{users.length}</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col items-center min-w-[100px]">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Activos</span>
                <span className="text-xl font-bold text-emerald-500">{users.filter(u => u.subscription_status === 'active').length}</span>
            </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {['all', 'active', 'past_due', 'canceled'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors border ${
                filterStatus === status 
                  ? 'bg-zinc-800 text-white border-zinc-600' 
                  : 'text-zinc-500 border-transparent hover:bg-zinc-900'
              }`}
            >
              {status === 'all' ? 'Todos' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Cargando base de datos...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No se encontraron usuarios.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold border border-zinc-700">
                          {user.full_name ? user.full_name.substring(0,2).toUpperCase() : <User size={18}/>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.full_name || 'Sin nombre'}</p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                          <Shield size={12} fill="currentColor" /> Admin
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">Psicólogo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPlanBadge(user.subscription_plan)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.subscription_status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs font-medium capitalize ${getStatusColor(user.subscription_status)}`}>
                          {user.subscription_status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors" title="Editar Suscripción">
                           <Edit size={16} />
                        </button>
                        <button className="p-2 hover:bg-red-900/20 rounded-lg text-zinc-400 hover:text-red-500 transition-colors" title="Bloquear Acceso">
                           <Lock size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};