import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Save, AlertCircle, Shield } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  tenant_id: string;
  tenant_name?: string;
  created_at: string;
  last_login?: string;
}

interface Tenant {
  id: string;
  company_name: string;
}

export const SuperAdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'sales',
    tenant_id: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data since API endpoints don't exist yet
      const mockTenants: Tenant[] = [
        { id: '1', company_name: 'DHL Express Sweden' },
        { id: '2', company_name: 'PostNord Logistics' },
        { id: '3', company_name: 'Bring Logistics' }
      ];

      const mockUsers: User[] = [
        {
          id: '1',
          full_name: 'Anna Andersson',
          email: 'anna.andersson@dhl.se',
          role: 'sales',
          status: 'active',
          tenant_id: '1',
          tenant_name: 'DHL Express Sweden',
          created_at: new Date('2024-01-20').toISOString(),
          last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          full_name: 'Erik Eriksson',
          email: 'erik.eriksson@dhl.se',
          role: 'manager',
          status: 'active',
          tenant_id: '1',
          tenant_name: 'DHL Express Sweden',
          created_at: new Date('2024-01-20').toISOString(),
          last_login: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          full_name: 'Maria Svensson',
          email: 'maria.svensson@dhl.se',
          role: 'sales',
          status: 'active',
          tenant_id: '1',
          tenant_name: 'DHL Express Sweden',
          created_at: new Date('2024-02-01').toISOString(),
          last_login: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          full_name: 'Johan Johansson',
          email: 'johan.johansson@postnord.se',
          role: 'sales',
          status: 'active',
          tenant_id: '2',
          tenant_name: 'PostNord Logistics',
          created_at: new Date('2024-02-15').toISOString(),
          last_login: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          full_name: 'Lisa Larsson',
          email: 'lisa.larsson@bring.se',
          role: 'admin',
          status: 'active',
          tenant_id: '3',
          tenant_name: 'Bring Logistics',
          created_at: new Date('2024-03-10').toISOString(),
          last_login: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setUsers(mockUsers);
      setTenants(mockTenants);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: 'sales',
      tenant_id: tenants[0]?.id || '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      tenant_id: user.tenant_id,
      status: user.status
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('eurekai_token');
      const url = editingUser
        ? `${API_BASE_URL}/users/${editingUser.id}`
        : '${API_BASE_URL}/users';
      
      const body = editingUser
        ? { ...formData, password: formData.password || undefined }
        : formData;

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save user');
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Är du säker på att du vill ta bort ${name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800 border-purple-300',
      admin: 'bg-red-100 text-red-800 border-red-300',
      manager: 'bg-blue-100 text-blue-800 border-blue-300',
      sales: 'bg-green-100 text-green-800 border-green-300',
      terminal: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
            <Users className="w-8 h-8 text-[#8B5CF6]" />
            User Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Hantera användare över alla tenants
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2 rounded font-semibold"
        >
          <Plus className="w-4 h-4" />
          Skapa Användare
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white  rounded-none overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Användare</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Roll</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Senaste Login</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.tenant_name || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded border ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString('sv-SE') : 'Aldrig'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, user.full_name)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-none p-6 max-w-2xl w-full mx-4 ">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-black">
                {editingUser ? 'Redigera Användare' : 'Skapa Ny Användare'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Namn *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Lösenord {editingUser ? '(lämna tomt för att behålla)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tenant *</label>
                <select
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
                >
                  <option value="">Välj tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.company_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Roll *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
                >
                  <option value="sales">Sales</option>
                  <option value="terminal">Terminal</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2 rounded font-semibold"
              >
                <Save className="w-4 h-4" />
                {editingUser ? 'Uppdatera' : 'Skapa'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
