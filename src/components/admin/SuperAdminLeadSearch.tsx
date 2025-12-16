import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, AlertCircle, RefreshCw, CheckCircle, XCircle, LayoutGrid, List } from 'lucide-react';
import { LeadCard } from '../leads/LeadCard';
import { LeadData, Segment } from '../../../types';

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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  useEffect(() => {
    loadAllLeads();
  }, []);

  const loadAllLeads = async () => {
    try {
      setLoading(true);
      
      // Mock data - leads from all tenants
      const mockLeads: Lead[] = [
        {
          id: '1',
          company_name: 'Schenker AB',
          domain: 'schenker.se',
          tenant_id: '1',
          tenant_name: 'DHL Express Sweden',
          ecommerce_platform: 'Shopify',
          carriers: 'DHL, PostNord',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          is_anonymized: false,
          analysis_status: 'completed',
          analyzed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          checkout_position: 'Top 3'
        },
        {
          id: '2',
          company_name: 'Lagerhaus Sverige',
          domain: 'lagerhaus.se',
          tenant_id: '1',
          tenant_name: 'DHL Express Sweden',
          ecommerce_platform: 'WooCommerce',
          carriers: 'DHL, Bring',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          is_anonymized: false,
          analysis_status: 'completed',
          analyzed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          checkout_position: 'Not visible'
        },
        {
          id: '3',
          company_name: 'Elgiganten AB',
          domain: 'elgiganten.se',
          tenant_id: '2',
          tenant_name: 'PostNord Logistics',
          ecommerce_platform: 'Custom',
          carriers: 'PostNord, Bring, DHL',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          is_anonymized: true,
          analysis_status: 'completed',
          analyzed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          checkout_position: 'Top 1'
        },
        {
          id: '4',
          company_name: 'Clas Ohlson',
          domain: 'clasohlson.se',
          tenant_id: '1',
          tenant_name: 'DHL Express Sweden',
          ecommerce_platform: 'Magento',
          carriers: 'DHL, PostNord, Bring',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          is_anonymized: false,
          analysis_status: 'pending',
          checkout_position: 'Unknown'
        },
        {
          id: '5',
          company_name: 'Webhallen',
          domain: 'webhallen.com',
          tenant_id: '3',
          tenant_name: 'Bring Logistics',
          ecommerce_platform: 'Shopify',
          carriers: 'Bring, PostNord',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          is_anonymized: false,
          analysis_status: 'completed',
          analyzed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          checkout_position: 'Top 2'
        }
      ];
      
      setLeads(mockLeads);
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
    if (!confirm('Är du säker på att du vill anonymisera detta lead? Detta kan inte ångras.')) {
      return;
    }

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
      alert('Kunde inte anonymisera lead: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleAnalyze = async (leadId: string, domain: string) => {
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

  const convertLeadToLeadData = (lead: Lead): LeadData => {
    return {
      id: lead.id,
      companyName: lead.company_name,
      orgNumber: '',
      address: '',
      visitingAddress: '',
      warehouseAddress: '',
      returnAddress: '',
      phoneNumber: '',
      segment: Segment.UNKNOWN,
      revenue: '',
      revenueSource: '',
      freightBudget: '',
      legalStatus: '',
      creditRatingLabel: '',
      creditRatingDescription: '',
      ecommercePlatform: lead.ecommerce_platform || '',
      hasFtax: '',
      logisticsProfile: '',
      markets: '',
      multiBrands: '',
      deliveryServices: [],
      checkoutPosition: lead.checkout_position || '',
      parentCompany: '',
      liquidity: '',
      trendRisk: '',
      trigger: '',
      emailStructure: '',
      decisionMakers: [],
      icebreaker: '',
      latestNews: '',
      latestNewsUrl: '',
      websiteUrl: lead.domain,
      carriers: lead.carriers || '',
      usesDhl: '',
      shippingTermsLink: '',
      searchLog: {
        primaryQuery: '',
        secondaryQuery: '',
        credibilitySource: ''
      },
      sourceLinks: [],
      analysisDate: lead.created_at,
      source: 'ai'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
          <Search className="w-8 h-8 text-[#FFC400]" />
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
          <p className="text-2xl font-black text-[#FFC400] mt-1">{leads.length}</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tenant Filter</label>
            <input
              type="text"
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              placeholder="Tenant ID"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={searchLeads}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#FFC400] hover:bg-black hover:text-white text-black px-4 py-2 rounded font-semibold disabled:opacity-50"
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
            <div className="flex gap-1 border border-gray-300 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 ${viewMode === 'cards' ? 'bg-[#FFC400] text-black' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="Kortvy"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 ${viewMode === 'table' ? 'bg-[#FFC400] text-black' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                title="Tabellvy"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnonymizedOnly}
              onChange={(e) => setShowAnonymizedOnly(e.target.checked)}
              className="w-4 h-4 text-[#FFC400] border-gray-300 rounded focus:ring-[#FFC400]"
            />
            <span className="text-sm font-semibold text-gray-700">Visa endast anonymiserade leads</span>
          </label>
        </div>
      </div>

      {/* Results */}
      {loading && leads.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-white border-2 border-gray-200 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC400] mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar leads...</p>
          </div>
        </div>
      ) : leads.length > 0 ? (
        viewMode === 'cards' ? (
          <div className="space-y-6">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                data={convertLeadToLeadData(lead)}
                isSuperAdmin={true}
              />
            ))}
          </div>
        ) : (
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
                          className="text-[#FFC400] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
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
        )
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
