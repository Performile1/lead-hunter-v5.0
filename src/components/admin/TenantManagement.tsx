import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

interface Tenant {
  id: string;
  company_name: string;
  domain: string;
  subdomain: string;
  primary_color: string;
  secondary_color: string;
  search_term: string;
  is_active: boolean;
  user_count: number;
  lead_count: number;
  customer_count: number;
  created_at: string;
}

export const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    domain: '',
    subdomain: '',
    primary_color: '#2563EB',
    secondary_color: '#4F46E5',
    checkout_search_term: ''
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      
      // Mock data since API endpoint doesn't exist yet
      const mockTenants: Tenant[] = [
        {
          id: '1',
          company_name: 'DHL Express Sweden',
          domain: 'dhl.se',
          subdomain: 'dhl',
          primary_color: '#FFC400',
          secondary_color: '#000000',
          search_term: 'DHL',
          is_active: true,
          user_count: 15,
          lead_count: 450,
          customer_count: 120,
          created_at: new Date('2024-01-15').toISOString()
        },
        {
          id: '2',
          company_name: 'PostNord Logistics',
          domain: 'postnord.se',
          subdomain: 'postnord',
          primary_color: '#003087',
          secondary_color: '#FFD100',
          search_term: 'PostNord',
          is_active: true,
          user_count: 8,
          lead_count: 280,
          customer_count: 75,
          created_at: new Date('2024-02-10').toISOString()
        },
        {
          id: '3',
          company_name: 'Bring Logistics',
          domain: 'bring.se',
          subdomain: 'bring',
          primary_color: '#00A651',
          secondary_color: '#FFFFFF',
          search_term: 'Bring',
          is_active: true,
          user_count: 5,
          lead_count: 150,
          customer_count: 40,
          created_at: new Date('2024-03-05').toISOString()
        }
      ];

      setTenants(mockTenants);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTenant(null);
    setFormData({
      company_name: '',
      domain: '',
      subdomain: '',
      primary_color: '#2563EB',
      secondary_color: '#4F46E5',
      checkout_search_term: ''
    });
    setShowModal(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      company_name: tenant.company_name,
      domain: tenant.domain,
      subdomain: tenant.subdomain,
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color,
      checkout_search_term: tenant.search_term
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('eurekai_token');
      const url = editingTenant
        ? `${API_BASE_URL}/tenants/${editingTenant.id}`
        : `${API_BASE_URL}/tenants`;
      
      const response = await fetch(url, {
        method: editingTenant ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save tenant');
      }

      setShowModal(false);
      loadTenants();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save tenant');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Är du säker på att du vill ta bort ${name}? Detta tar bort ALL data för denna tenant.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete tenant');
      }

      loadTenants();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete tenant');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC400]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
            <Building2 className="w-8 h-8 text-[#FFC400]" />
            Tenant Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Hantera organisationer och deras inställningar
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-[#FFC400] hover:bg-black text-white px-4 py-2 rounded font-semibold"
        >
          <Plus className="w-4 h-4" />
          Skapa Tenant
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

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-white  rounded-none p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-black text-black">{tenant.company_name}</h3>
                <p className="text-sm text-gray-600">{tenant.domain}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Subdomain: {tenant.subdomain || 'N/A'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(tenant)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tenant.id, tenant.company_name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Colors */}
            <div className="flex gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2 border-gray-300"
                  style={{ backgroundColor: tenant.primary_color }}
                />
                <span className="text-xs text-gray-600">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2 border-gray-300"
                  style={{ backgroundColor: tenant.secondary_color }}
                />
                <span className="text-xs text-gray-600">Secondary</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-black text-[#FFC400]">{tenant.user_count}</p>
                <p className="text-xs text-gray-600">Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#FFC400]">{tenant.lead_count}</p>
                <p className="text-xs text-gray-600">Leads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#FFC400]">{tenant.customer_count}</p>
                <p className="text-xs text-gray-600">Customers</p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4">
              <span
                className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                  tenant.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {tenant.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-none p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-black">
                {editingTenant ? 'Redigera Tenant' : 'Skapa Ny Tenant'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Företagsnamn *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
                  placeholder="DHL Sweden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Domän *
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
                  placeholder="dhl.se"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Subdomän
                </label>
                <input
                  type="text"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
                  placeholder="dhl-sweden"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Checkout Sökterm *
                </label>
                <input
                  type="text"
                  value={formData.checkout_search_term}
                  onChange={(e) => setFormData({ ...formData, checkout_search_term: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
                  placeholder="DHL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Primär Färg
                  </label>
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Sekundär Färg
                  </label>
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 bg-[#FFC400] hover:bg-black text-white px-4 py-2 rounded font-semibold"
              >
                <Save className="w-4 h-4" />
                {editingTenant ? 'Uppdatera' : 'Skapa'}
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
