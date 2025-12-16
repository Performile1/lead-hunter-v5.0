import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Mail, Lock, Shield } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  last_login?: string;
}

export const TenantUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'sales',
    status: 'active'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch('${API_BASE_URL}/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load users');

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      full_name: '',
      password: '',
      role: 'sales',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: '',
      role: user.role,
      status: user.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('eurekai_token');
      const url = editingUser 
        ? `${API_BASE_URL}/users/${editingUser.id}`
        : '${API_BASE_URL}/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save user');

      await loadUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Kunde inte spara användare');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna användare?')) return;

    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');

      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Kunde inte ta bort användare');
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Admin' },
      manager: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Manager' },
      sales: { bg: 'bg-green-100', text: 'text-green-800', label: 'Säljare' },
      terminal_manager: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Terminalchef' }
    };
    return badges[role] || badges.sales;
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktiv' }
      : { bg: 'bg-red-100', text: 'text-red-800', label: 'Inaktiv' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide">
            Användarhantering
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Hantera användare i din organisation
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-black hover:bg-[#a0040d] text-white px-4 py-2 rounded font-semibold"
        >
          <Plus className="w-5 h-5" />
          Ny Användare
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 p-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Totalt</p>
              <p className="text-2xl font-black text-black mt-1">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-[#4F46E5]" />
          </div>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Aktiva</p>
              <p className="text-2xl font-black text-green-600 mt-1">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Admins</p>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Säljare</p>
              <p className="text-2xl font-black text-blue-600 mt-1">
                {users.filter(u => u.role === 'sales').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border-2 border-gray-200 rounded shadow-sm overflow-hidden">
        <table className="min-w-full divide-y-2 divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Användare
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Roll
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Senaste Inloggning
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const roleBadge = getRoleBadge(user.role);
              const statusBadge = getStatusBadge(user.status);
              
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded ${roleBadge.bg} ${roleBadge.text}`}>
                      {roleBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded ${statusBadge.bg} ${statusBadge.text}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString('sv-SE') : 'Aldrig'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-none shadow-xl max-w-md w-full mx-4 ">
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-200">
              <h2 className="text-xl font-black text-black uppercase">
                {editingUser ? 'Redigera Användare' : 'Ny Användare'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Namn *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">E-post *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Lösenord {editingUser ? '(lämna tomt för att behålla)' : '*'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    required={!editingUser}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Roll *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                >
                  <option value="sales">Säljare</option>
                  <option value="manager">Manager</option>
                  <option value="terminal_manager">Terminalchef</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black hover:bg-[#a0040d] text-white rounded font-semibold"
                >
                  {editingUser ? 'Uppdatera' : 'Skapa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
