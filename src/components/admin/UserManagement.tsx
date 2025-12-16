import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Mail, Shield, MapPin, Hash } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'terminal_manager' | 'fs' | 'ts' | 'kam' | 'dm';
  status: 'active' | 'pending' | 'suspended';
  regions: string[];
  postal_codes: string[];
  terminal_name?: string;
  terminal_code?: string;
  created_at: string;
  last_login?: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  full_name: string;
  role: string;
  regions: string[];
  postal_codes: string[];
  terminal_name?: string;
  terminal_code?: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    full_name: '',
    role: 'fs',
    regions: [],
    postal_codes: [],
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Användare skapad!');
        setShowCreateModal(false);
        resetForm();
        loadUsers();
      } else {
        const error = await response.json();
        alert(`Fel: ${error.error || 'Kunde inte skapa användare'}`);
      }
    } catch (error) {
      console.error('Create user error:', error);
      alert('Nätverksfel vid skapande av användare');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Är du säker på att du vill radera denna användare?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Användare raderad');
        loadUsers();
      } else {
        alert('Kunde inte radera användare');
      }
    } catch (error) {
      console.error('Delete user error:', error);
    }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'fs',
      regions: [],
      postal_codes: [],
    });
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-[#FFC400] text-black',
      terminal_manager: 'bg-blue-100 text-blue-800',
      fs: 'bg-green-100 text-green-800',
      ts: 'bg-yellow-100 text-yellow-800',
      kam: 'bg-orange-100 text-orange-800',
      dm: 'bg-pink-100 text-pink-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-8 text-center">Laddar användare...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Användarhantering
          </h2>
          <p className="text-gray-600 mt-1">Hantera användare och behörigheter</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-black text-white px-4 py-2 rounded-none flex items-center gap-2 hover:bg-gray-800 "
        >
          <Plus className="w-5 h-5" />
          Skapa Användare
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-none shadow overflow-hidden "
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Användare</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regioner/Terminal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Senaste Login</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.status}
                    onChange={(e) => handleUpdateStatus(user.id, e.target.value)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${getStatusBadgeColor(user.status)}`}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  {user.terminal_name ? (
                    <div className="text-sm">
                      <div className="font-medium">{user.terminal_name}</div>
                      <div className="text-gray-500">{user.terminal_code}</div>
                    </div>
                  ) : (
                    <div className="text-sm">
                      {user.regions.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {user.regions.slice(0, 2).join(', ')}
                          {user.regions.length > 2 && ` +${user.regions.length - 2}`}
                        </div>
                      )}
                      {user.postal_codes.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                          <Hash className="w-3 h-3" />
                          {user.postal_codes.length} postnummer
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString('sv-SE') : 'Aldrig'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                    title="Redigera"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Radera"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-none p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto "
            <h3 className="text-xl font-bold mb-4">Skapa Ny Användare</h3>
            
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2  rounded-none"
                    placeholder="anvandare@dhl.se"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fullständigt Namn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2  rounded-none"
                    placeholder="Anna Andersson"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lösenord * (minst 8 tecken)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2  rounded-none"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roll *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2  rounded-none"
                  >
                    <option value="fs">FS - Field Sales</option>
                    <option value="ts">TS - Telesales</option>
                    <option value="kam">KAM - Key Account Manager</option>
                    <option value="dm">DM - Decision Maker</option>
                    <option value="terminal_manager">Terminal Manager</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Terminal (only for terminal_manager) */}
                {formData.role === 'terminal_manager' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Terminal Namn
                      </label>
                      <input
                        type="text"
                        value={formData.terminal_name || ''}
                        onChange={(e) => setFormData({ ...formData, terminal_name: e.target.value })}
                        className="w-full px-3 py-2  rounded-none"
                        placeholder="DHL Stockholm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Terminal Kod
                      </label>
                      <input
                        type="text"
                        value={formData.terminal_code || ''}
                        onChange={(e) => setFormData({ ...formData, terminal_code: e.target.value })}
                        className="w-full px-3 py-2  rounded-none"
                        placeholder="STO"
                      />
                    </div>
                  </>
                )}

                {/* Regions */}
                {formData.role !== 'terminal_manager' && formData.role !== 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regioner (kommaseparerade)
                    </label>
                    <input
                      type="text"
                      value={formData.regions.join(', ')}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        regions: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2  rounded-none"
                      placeholder="Stockholm, Göteborg, Malmö"
                    />
                  </div>
                )}

                {/* Postal Codes */}
                {formData.role !== 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postnummer (kommaseparerade, 3 siffror)
                    </label>
                    <input
                      type="text"
                      value={formData.postal_codes.join(', ')}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        postal_codes: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2  rounded-none"
                      placeholder="100, 101, 102"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ange första 3 siffrorna i postnummer (t.ex. 100 för 100 XX)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-black text-white px-4 py-2 rounded-none hover:bg-gray-800 "
                >
                  Skapa Användare
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-white text-black px-4 py-2 rounded-none hover:bg-gray-100 "
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
