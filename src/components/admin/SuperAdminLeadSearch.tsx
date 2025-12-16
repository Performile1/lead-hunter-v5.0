import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface Lead {
  id: string;
  company_name: string;
  domain: string;
  tenant_id: string;
  tenant_name: string;
  ecommerce_platform?: string;
  carriers?: string;
  created_at: string;
  is_anonymized?: boolean;
  analysis_status?: string;
  analyzed_at?: string;
  checkout_position?: string;
}

export const SuperAdminLeadSearch: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTenant, setFilterTenant] = useState('');
  const [showAnonymizedOnly, setShowAnonymizedOnly] = useState(false);

  useEffect(() => {
    loadAllLeads();
  }, []);

  const loadAllLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch('${API_BASE_URL}/admin/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load leads');
      
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('eurekai_token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterTenant) params.append('tenant_id', filterTenant);
      if (showAnonymizedOnly) params.append('anonymized', 'true');

      const response = await fetch(`${API_BASE_URL}/admin/leads?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to search leads');
      
      const data = await response.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymize = async (leadId: string) => {
    if (!confirm('Anonymisera detta lead för cross-tenant användning?')) return;

    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/admin/leads/${leadId}/anonymize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to anonymize lead');
      
      alert('Lead anonymiserat!');
      loadAllLeads();
    } catch (err) {
      alert('Kunde inte anonymisera lead');
    }
  };

  const handleAnalyze = async (leadId: string, domain: string) => {
    if (!confirm(`Analysera/omanalysera lead: ${domain}?`)) return;

    try {
      setAnalyzing(leadId);
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/admin/leads/${leadId}/analyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to analyze lead');
      
      alert('Lead analyserat!');
      loadAllLeads();
    } catch (err) {
      alert('Kunde inte analysera lead: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setAnalyzing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
          <Search className="w-8 h-8 text-[#8B5CF6]" />
          Lead Sökning
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Sök och hantera leads över alla tenants
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Totalt Leads</p>
          <p className="text-2xl font-black text-[#8B5CF6] mt-1">{leads.length}</p>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Analyserade</p>
          <p className="text-2xl font-black text-green-600 mt-1">
            {leads.filter(l => l.analysis_status === 'completed').length}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Ej Analyserade</p>
          <p className="text-2xl font-black text-orange-600 mt-1">
            {leads.filter(l => !l.analysis_status || l.analysis_status === 'pending').length}
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Anonymiserade</p>
          <p className="text-2xl font-black text-blue-600 mt-1">
            {leads.filter(l => l.is_anonymized).length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Sökterm</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLeads()}
              placeholder="Företagsnamn, domän, plattform..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tenant Filter</label>
            <input
              type="text"
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              placeholder="Tenant ID"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={searchLeads}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Söker...' : 'Sök'}
            </button>
            <button
              onClick={loadAllLeads}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
              title="Ladda alla leads"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnonymizedOnly}
              onChange={(e) => setShowAnonymizedOnly(e.target.checked)}
              className="w-4 h-4 text-[#8B5CF6] border-gray-300 rounded focus:ring-[#8B5CF6]"
            />
            <span className="text-sm font-semibold text-gray-700">Visa endast anonymiserade leads</span>
          </label>
        </div>
      </div>

      {/* Results */}
      {loading && leads.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-white border-2 border-gray-200 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6] mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar leads...</p>
          </div>
        </div>
      ) : leads.length > 0 ? (
        <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-700">
              {leads.length} resultat hittade
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Företag</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Plattform</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Transportörer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Analys Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Anonymiserad</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{lead.company_name}</div>
                        <div className="text-xs text-gray-500">{lead.domain}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.tenant_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.ecommerce_platform || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.carriers || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.analysis_status === 'completed' ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Analyserad
                        </span>
                      ) : lead.analysis_status === 'failed' ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" />
                          Misslyckad
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800 w-fit">
                          Ej analyserad
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.is_anonymized ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                          Ja
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                          Nej
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAnalyze(lead.id, lead.domain)}
                          disabled={analyzing === lead.id}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={lead.analysis_status === 'completed' ? 'Omanalysera lead' : 'Analysera lead'}
                        >
                          {analyzing === lead.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleAnonymize(lead.id)}
                          disabled={lead.is_anonymized}
                          className="text-[#8B5CF6] hover:text-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Anonymisera för cross-tenant användning"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Inga leads hittade. Klicka på Sök för att ladda alla leads.</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Anonymisering:</strong> När ett lead anonymiseras tas tenant-specifik data bort och leadet blir tillgängligt för alla tenants att använda som referensdata.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
