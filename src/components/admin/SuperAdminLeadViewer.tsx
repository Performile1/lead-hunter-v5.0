import React, { useState, useEffect } from 'react';
import { Database, Filter, Download, RefreshCw, Building2, Package, Eye } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

interface Lead {
  id: string;
  company_name: string;
  domain: string;
  org_number: string;
  tenant_id: string;
  tenant_name: string;
  ecommerce_platform?: string;
  carriers?: string;
  has_dhl?: boolean;
  dhl_position?: number;
  checkout_position?: string;
  created_at: string;
  created_by_user?: string;
  is_anonymized?: boolean;
}

export const SuperAdminLeadViewer: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTenant, setFilterTenant] = useState('');
  const [filterCarrier, setFilterCarrier] = useState('');
  const [filterDhlOnly, setFilterDhlOnly] = useState(false);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadAllLeadsFromDatabase();
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const loadAllLeadsFromDatabase = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('eurekai_token');
      
      const params = new URLSearchParams();
      if (filterTenant) params.append('tenant_id', filterTenant);
      if (filterCarrier) params.append('carrier', filterCarrier);
      if (filterDhlOnly) params.append('has_dhl', 'true');
      
      const response = await fetch(`${API_BASE_URL}/admin/leads/all?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error('Failed to load leads:', response.status, response.statusText);
        setLeads([]);
        return;
      }

      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Failed to load leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    if (filterTenant && lead.tenant_id !== filterTenant) return false;
    if (filterCarrier && !lead.carriers?.toLowerCase().includes(filterCarrier.toLowerCase())) return false;
    if (filterDhlOnly && !lead.has_dhl) return false;
    return true;
  });

  // Calculate allocation stats
  const allocatedLeads = filteredLeads.filter(l => l.tenant_id);
  const unallocatedLeads = filteredLeads.filter(l => !l.tenant_id);
  
  const stats = {
    total: filteredLeads.length,
    allocated: allocatedLeads.length,
    unallocated: unallocatedLeads.length,
    byTenant: tenants.map(t => ({
      id: t.id,
      name: t.company_name || t.name,
      count: filteredLeads.filter(l => l.tenant_id === t.id).length
    })).filter(t => t.count > 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
            <Database className="w-8 h-8 text-[#FFC400]" />
            Alla Leads (Databas)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Visar alla leads som sökts av alla tenants - ingen ny sökning
          </p>
        </div>
        <button
          onClick={loadAllLeadsFromDatabase}
          disabled={loading}
          className="flex items-center gap-2 bg-[#FFC400] hover:bg-black text-black hover:text-white px-4 py-2 rounded font-semibold transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Totalt Leads</p>
          <p className="text-3xl font-black text-[#FFC400] mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded cursor-pointer hover:bg-green-50 transition-colors" title="Leads tilldelade till tenants">
          <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
            Allokerade
            <Building2 className="w-4 h-4" />
          </p>
          <p className="text-3xl font-black text-green-600 mt-1">{stats.allocated}</p>
          {stats.byTenant.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Per tenant:</p>
              {stats.byTenant.slice(0, 3).map(t => (
                <div key={t.id} className="text-xs text-gray-700 flex justify-between">
                  <span className="truncate">{t.name}</span>
                  <span className="font-semibold ml-2">{t.count}</span>
                </div>
              ))}
              {stats.byTenant.length > 3 && (
                <p className="text-xs text-gray-500 mt-1">+{stats.byTenant.length - 3} fler...</p>
              )}
            </div>
          )}
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded cursor-pointer hover:bg-red-50 transition-colors" title="Leads utan tenant-tilldelning">
          <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
            Inte allokerade
            <Package className="w-4 h-4" />
          </p>
          <p className="text-3xl font-black text-red-600 mt-1">{stats.unallocated}</p>
          <p className="text-xs text-gray-600 mt-2">Lediga leads tillgängliga för tilldelning</p>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Aktiva Tenants</p>
          <p className="text-3xl font-black text-[#4F46E5] mt-1">{tenants.length}</p>
          <p className="text-xs text-gray-600 mt-2">{stats.byTenant.length} med leads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-gray-200 p-4 rounded">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#FFC400]" />
          <h2 className="text-lg font-black text-black uppercase">Filtrera</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tenant</label>
            <select
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            >
              <option value="">Alla tenants</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Transportör</label>
            <select
              value={filterCarrier}
              onChange={(e) => setFilterCarrier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            >
              <option value="">Alla transportörer</option>
              <option value="DHL">DHL</option>
              <option value="PostNord">PostNord</option>
              <option value="Bring">Bring</option>
              <option value="Schenker">Schenker</option>
              <option value="Budbee">Budbee</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterDhlOnly}
                onChange={(e) => setFilterDhlOnly(e.target.checked)}
                className="w-4 h-4 text-[#FFC400] border-gray-300 rounded focus:ring-[#FFC400]"
              />
              <span className="text-sm font-semibold text-gray-700">Endast med DHL</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterTenant('');
                setFilterCarrier('');
                setFilterDhlOnly(false);
              }}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold"
            >
              Rensa filter
            </button>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white border-2 border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Företag</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Plattform</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Transportörer</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">DHL Position</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Skapad</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Åtgärder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#FFC400]" />
                      <span className="text-gray-600">Laddar leads...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Inga leads hittades
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-gray-900">{lead.company_name}</p>
                        <p className="text-xs text-gray-500">{lead.domain}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                        <Building2 className="w-3 h-3" />
                        {lead.tenant_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{lead.ecommerce_platform || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.carriers?.split(',').map((carrier, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              carrier.trim().toLowerCase().includes('dhl')
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {carrier.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.has_dhl ? (
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          lead.dhl_position === 1 ? 'bg-green-100 text-green-800' :
                          lead.dhl_position && lead.dhl_position <= 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          #{lead.dhl_position || '?'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Ej DHL</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">
                        {new Date(lead.created_at).toLocaleDateString('sv-SE')}
                      </p>
                      {lead.created_by_user && (
                        <p className="text-xs text-gray-500">{lead.created_by_user}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-3 h-3" />
                        Visa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Breakdown */}
      <div className="bg-white border-2 border-gray-200 p-4 rounded">
        <h3 className="text-lg font-black text-black uppercase mb-4">Leads per Tenant</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.byTenant.map((tenant, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded">
              <p className="text-sm font-semibold text-gray-700">{tenant.name}</p>
              <p className="text-2xl font-black text-[#FFC400] mt-1">{tenant.count} leads</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
