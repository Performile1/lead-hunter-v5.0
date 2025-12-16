import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Building2, Package } from 'lucide-react';

interface Customer {
  id: string;
  company_name: string;
  domain: string;
  tenant_id: string;
  tenant_name: string;
  uses_dhl: boolean;
  uses_competitor: boolean;
  ecommerce_platform?: string;
  created_at: string;
  conversion_date?: string;
}

export const SuperAdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTenant, setFilterTenant] = useState('');
  const [filterDHL, setFilterDHL] = useState<'all' | 'dhl' | 'competitor'>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('eurekai_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterTenant) params.append('tenant_id', filterTenant);
      if (filterDHL !== 'all') params.append('uses_dhl', filterDHL === 'dhl' ? 'true' : 'false');

      const response = await fetch(`${API_BASE_URL}/admin/customers?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load customers');
      
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (searchTerm && !customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !customer.domain.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterTenant && customer.tenant_id !== filterTenant) {
      return false;
    }
    if (filterDHL === 'dhl' && !customer.uses_dhl) {
      return false;
    }
    if (filterDHL === 'competitor' && !customer.uses_competitor) {
      return false;
    }
    return true;
  });

  const stats = {
    total: customers.length,
    dhl: customers.filter(c => c.uses_dhl).length,
    competitor: customers.filter(c => c.uses_competitor).length,
    tenants: new Set(customers.map(c => c.tenant_id)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
          <Users className="w-8 h-8 text-[#8B5CF6]" />
          Alla Kunder
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Översikt över alla kunder från alla tenants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Totalt Kunder</p>
              <p className="text-3xl font-black text-[#8B5CF6] mt-1">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Använder DHL</p>
              <p className="text-3xl font-black text-green-600 mt-1">{stats.dhl}</p>
            </div>
            <Package className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Konkurrent</p>
              <p className="text-3xl font-black text-red-600 mt-1">{stats.competitor}</p>
            </div>
            <Package className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Aktiva Tenants</p>
              <p className="text-3xl font-black text-[#8B5CF6] mt-1">{stats.tenants}</p>
            </div>
            <Building2 className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Sök</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Företagsnamn eller domän..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tenant</label>
            <input
              type="text"
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              placeholder="Tenant ID"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Transportör</label>
            <select
              value={filterDHL}
              onChange={(e) => setFilterDHL(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
            >
              <option value="all">Alla</option>
              <option value="dhl">DHL</option>
              <option value="competitor">Konkurrent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-700">
            {filteredCustomers.length} kunder
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Företag</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Plattform</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Transportör</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Konverterad</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{customer.company_name}</div>
                      <div className="text-xs text-gray-500">{customer.domain}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.tenant_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.ecommerce_platform || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.uses_dhl && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 mr-1">
                        DHL
                      </span>
                    )}
                    {customer.uses_competitor && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                        Konkurrent
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.conversion_date ? new Date(customer.conversion_date).toLocaleDateString('sv-SE') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
