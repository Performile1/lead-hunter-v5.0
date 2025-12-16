import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Save, X, Users, TrendingUp, Package, AlertCircle } from 'lucide-react';

interface Tenant {
  id: string;
  company_name: string;
  domain: string;
  subdomain?: string;
  checkout_search_term: string;
  main_competitor: string;
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  max_users: number;
  max_leads_per_month: number;
  max_customers: number;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  user_count?: number;
  lead_count?: number;
  customer_count?: number;
}

interface TenantManagementProps {
  isSuperAdmin: boolean;
}

export const TenantManagement: React.FC<TenantManagementProps> = ({ isSuperAdmin }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<Partial<Tenant>>({
    company_name: '',
    domain: '',
    subdomain: '',
    checkout_search_term: '',
    main_competitor: '',
    subscription_tier: 'basic',
    max_users: 10,
    max_leads_per_month: 1000,
    max_customers: 500,
    primary_color: '#2563EB',
    secondary_color: '#4F46E5',
    is_active: true
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin]);

  const fetchTenants = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/tenants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTenants();
        setShowCreateModal(false);
        resetForm();
        alert('✅ Tenant skapad!');
      } else {
        const error = await response.json();
        alert(`❌ Fel: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert('❌ Kunde inte skapa tenant');
    }
  };

  const handleUpdate = async () => {
    if (!editingTenant) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${editingTenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTenants();
        setEditingTenant(null);
        resetForm();
        alert('✅ Tenant uppdaterad!');
      } else {
        const error = await response.json();
        alert(`❌ Fel: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      alert('❌ Kunde inte uppdatera tenant');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Är du säker på att du vill ta bort ${name}?\n\nDetta tar bort ALL data för denna tenant (användare, leads, kunder).`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`
        }
      });

      if (response.ok) {
        await fetchTenants();
        alert('✅ Tenant borttagen');
      } else {
        const error = await response.json();
        alert(`❌ Fel: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('❌ Kunde inte ta bort tenant');
    }
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      company_name: tenant.company_name,
      domain: tenant.domain,
      subdomain: tenant.subdomain || '',
      checkout_search_term: tenant.checkout_search_term,
      main_competitor: tenant.main_competitor,
      subscription_tier: tenant.subscription_tier,
      max_users: tenant.max_users,
      max_leads_per_month: tenant.max_leads_per_month,
      max_customers: tenant.max_customers,
      primary_color: tenant.primary_color,
      secondary_color: tenant.secondary_color,
      is_active: tenant.is_active
    });
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      domain: '',
      subdomain: '',
      checkout_search_term: '',
      main_competitor: '',
      subscription_tier: 'basic',
      max_users: 10,
      max_leads_per_month: 1000,
      max_customers: 500,
      primary_color: '#2563EB',
      secondary_color: '#4F46E5',
      is_active: true
    });
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800',
      professional: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-[#FFC400] text-black'
    };
    return colors[tier as keyof typeof colors] || colors.basic;
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-700 font-semibold">Endast Super Admin har åtkomst till Tenant Management</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tenant Management</h2>
          <p className="text-sm text-gray-600 mt-1">Hantera transportföretag som använder systemet</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-sm transition-colors font-bold uppercase"
        >
          <Plus className="w-5 h-5" />
          Ny Tenant
        </button>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-white rounded-sm shadow-md border-t-4 p-6 hover:shadow-lg transition-shadow"
            style={{ borderTopColor: tenant.primary_color }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{tenant.company_name}</h3>
                <p className="text-sm text-gray-600">{tenant.domain}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(tenant)}
                  className="p-2 hover:bg-gray-100 rounded-sm transition-colors"
                  title="Redigera"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(tenant.id, tenant.company_name)}
                  className="p-2 hover:bg-red-50 rounded-sm transition-colors"
                  title="Ta bort"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>

            {/* Tier Badge */}
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getTierBadge(tenant.subscription_tier)}`}>
                {tenant.subscription_tier}
              </span>
              {!tenant.is_active && (
                <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-800">
                  INAKTIV
                </span>
              )}
            </div>

            {/* Checkout Info */}
            <div className="space-y-2 mb-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Söker efter:</span>
                <span className="ml-2 text-gray-900">{tenant.checkout_search_term}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Konkurrent:</span>
                <span className="ml-2 text-gray-900">{tenant.main_competitor}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
              <div className="text-center">
                <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{tenant.user_count || 0}</div>
                <div className="text-xs text-gray-600">Users</div>
              </div>
              <div className="text-center">
                <TrendingUp className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{tenant.lead_count || 0}</div>
                <div className="text-xs text-gray-600">Leads</div>
              </div>
              <div className="text-center">
                <Package className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-gray-900">{tenant.customer_count || 0}</div>
                <div className="text-xs text-gray-600">Kunder</div>
              </div>
            </div>

            {/* Limits */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
              <div>Max: {tenant.max_users} users, {tenant.max_leads_per_month} leads/mån, {tenant.max_customers} kunder</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTenant) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b-2 border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-2xl font-bold">
                {editingTenant ? 'Redigera Tenant' : 'Skapa Ny Tenant'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTenant(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Grundläggande Information</h4>
                
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Företagsnamn *</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                    placeholder="DHL Express Sweden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Domän * (t.ex. dhl.se)</label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                    placeholder="dhl.se"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Subdomän (t.ex. dhl-sweden)</label>
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                    placeholder="dhl-sweden"
                  />
                  <p className="text-xs text-gray-500 mt-1">Används för tenant-specifik URL (valfritt)</p>
                </div>
              </div>

              {/* Checkout Tracking */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Checkout-övervakning</h4>
                
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Sökterm i checkout * (vad systemet letar efter)</label>
                  <input
                    type="text"
                    value={formData.checkout_search_term}
                    onChange={(e) => setFormData({ ...formData, checkout_search_term: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                    placeholder="DHL"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Huvudkonkurrent</label>
                  <input
                    type="text"
                    value={formData.main_competitor}
                    onChange={(e) => setFormData({ ...formData, main_competitor: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                    placeholder="PostNord"
                  />
                </div>
              </div>

              {/* Subscription */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Prenumeration & Limits</h4>
                
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Subscription Tier</label>
                  <select
                    value={formData.subscription_tier}
                    onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                  >
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Max Users</label>
                    <input
                      type="number"
                      value={formData.max_users}
                      onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Max Leads/mån</label>
                    <input
                      type="number"
                      value={formData.max_leads_per_month}
                      onChange={(e) => setFormData({ ...formData, max_leads_per_month: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Max Kunder</label>
                    <input
                      type="number"
                      value={formData.max_customers}
                      onChange={(e) => setFormData({ ...formData, max_customers: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Branding */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Branding</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="w-16 h-10 rounded border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-sm font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">Secondary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="w-16 h-10 rounded border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondary_color}
                        onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-sm font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-[#2563EB]"
                  />
                  <span className="font-semibold text-gray-700">Aktiv tenant</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t-2 border-gray-200 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTenant(null);
                  resetForm();
                }}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-sm font-bold uppercase"
              >
                Avbryt
              </button>
              <button
                onClick={editingTenant ? handleUpdate : handleCreate}
                className="flex items-center gap-2 px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-sm font-bold uppercase"
              >
                <Save className="w-5 h-5" />
                {editingTenant ? 'Uppdatera' : 'Skapa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
