import React, { useState, useEffect } from 'react';
import { Users, Filter, RefreshCw, MapPin, Building2, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';
import { LeadCard } from './LeadCard';
import { LeadData, Segment } from '../../../types';

interface SharedLead {
  id: string;
  company_name: string;
  org_number: string;
  domain: string;
  address: string;
  postal_code: string;
  city: string;
  region: string;
  revenue: string;
  segment: string;
  sni_code: string;
  sni_description: string;
  ecommerce_platform: string;
  shipping_providers: string;
  shipping_providers_with_position: any;
  source_tenant_name: string;
  has_primary_carrier: boolean;
  primary_carrier_position: number;
  created_at: string;
}

export const SharedLeadPool: React.FC = () => {
  const [leads, setLeads] = useState<SharedLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<SharedLead | null>(null);
  
  // Filters
  const [filterSegment, setFilterSegment] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterSniCode, setFilterSniCode] = useState('');
  const [filterMinRevenue, setFilterMinRevenue] = useState('');
  const [filterMaxRevenue, setFilterMaxRevenue] = useState('');
  const [filterWithCarrier, setFilterWithCarrier] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    withPrimaryCarrier: 0,
    bySegment: {} as Record<string, number>
  });

  useEffect(() => {
    loadSharedLeads();
  }, []);

  const loadSharedLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('eurekai_token');
      
      const params = new URLSearchParams();
      if (filterSegment) params.append('segment', filterSegment);
      if (filterArea) params.append('area', filterArea);
      if (filterSniCode) params.append('sni_code', filterSniCode);
      if (filterMinRevenue) params.append('min_revenue', filterMinRevenue);
      if (filterMaxRevenue) params.append('max_revenue', filterMaxRevenue);
      
      const response = await fetch(`${API_BASE_URL}/leads/shared-pool?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        let filteredLeads = data.leads || [];
        
        // Client-side filter for carrier
        if (filterWithCarrier) {
          filteredLeads = filteredLeads.filter((l: SharedLead) => l.has_primary_carrier);
        }
        
        setLeads(filteredLeads);
        
        // Calculate stats
        const withCarrier = filteredLeads.filter((l: SharedLead) => l.has_primary_carrier).length;
        const bySegment = filteredLeads.reduce((acc: Record<string, number>, l: SharedLead) => {
          acc[l.segment] = (acc[l.segment] || 0) + 1;
          return acc;
        }, {});
        
        setStats({
          total: filteredLeads.length,
          withPrimaryCarrier: withCarrier,
          bySegment
        });
      }
    } catch (error) {
      console.error('Failed to load shared leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    loadSharedLeads();
  };

  const handleResetFilters = () => {
    setFilterSegment('');
    setFilterArea('');
    setFilterSniCode('');
    setFilterMinRevenue('');
    setFilterMaxRevenue('');
    setFilterWithCarrier(false);
    setTimeout(() => loadSharedLeads(), 100);
  };

  const convertToLeadData = (lead: SharedLead): LeadData => {
    return {
      id: lead.id,
      companyName: lead.company_name,
      orgNumber: lead.org_number,
      address: lead.address,
      visitingAddress: '',
      warehouseAddress: '',
      returnAddress: '',
      phoneNumber: '',
      segment: lead.segment as Segment,
      revenue: lead.revenue,
      revenueSource: 'shared_pool',
      freightBudget: '',
      legalStatus: '',
      creditRatingLabel: '',
      creditRatingDescription: '',
      ecommercePlatform: lead.ecommerce_platform,
      hasFtax: '',
      logisticsProfile: '',
      markets: '',
      multiBrands: '',
      deliveryServices: [],
      checkoutPosition: lead.primary_carrier_position ? `Position ${lead.primary_carrier_position}` : '',
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
      carriers: lead.shipping_providers,
      usesDhl: lead.has_primary_carrier ? 'Ja' : 'Nej',
      shippingTermsLink: '',
      searchLog: {
        primaryQuery: '',
        secondaryQuery: '',
        credibilitySource: `Delad från ${lead.source_tenant_name}`
      },
      sourceLinks: [],
      analysisDate: lead.created_at,
      source: 'shared_pool'
    };
  };

  if (selectedLead) {
    return (
      <div>
        <button
          onClick={() => setSelectedLead(null)}
          className="mb-4 text-[#FFC400] hover:underline font-semibold"
        >
          ← Tillbaka till delad lead-pool
        </button>
        <LeadCard
          lead={convertToLeadData(selectedLead)}
          onClose={() => setSelectedLead(null)}
          onSave={() => {}}
          onRemove={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
            <Users className="w-8 h-8 text-[#FFC400]" />
            Delad Lead-Pool
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Leads från andra tenants baserat på dina kriterier
          </p>
        </div>
        <button
          onClick={loadSharedLeads}
          disabled={loading}
          className="flex items-center gap-2 bg-[#FFC400] hover:bg-black text-black hover:text-white px-4 py-2 rounded font-semibold transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Vad är delad lead-pool?</p>
            <p className="text-sm text-blue-800 mt-1">
              Här ser du leads som andra tenants har sökt fram, filtrerade efter dina kriterier (segment, område, SNI-kod).
              <strong> Dina egna befintliga kunder är automatiskt exkluderade.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Tillgängliga Leads</p>
          <p className="text-3xl font-black text-[#FFC400] mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Med Din Transportör</p>
          <p className="text-3xl font-black text-green-600 mt-1">{stats.withPrimaryCarrier}</p>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Tier 1 (KAM)</p>
          <p className="text-3xl font-black text-purple-600 mt-1">{stats.bySegment['tier1'] || 0}</p>
        </div>
        <div className="bg-white border-2 border-gray-200 p-4 rounded">
          <p className="text-xs font-bold text-gray-500 uppercase">Tier 2-3</p>
          <p className="text-3xl font-black text-blue-600 mt-1">
            {(stats.bySegment['tier2'] || 0) + (stats.bySegment['tier3'] || 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#FFC400]" />
          <h2 className="text-lg font-black text-black uppercase">Filtrera Leads</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Segment Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Segment (Tier)
            </label>
            <select
              value={filterSegment}
              onChange={(e) => setFilterSegment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            >
              <option value="">Alla segment</option>
              <option value="tier1">Tier 1 - KAM (&gt;50 MSEK)</option>
              <option value="tier2">Tier 2 (10-50 MSEK)</option>
              <option value="tier3">Tier 3 (&lt;10 MSEK)</option>
              <option value="tier4">Tier 4 (Prospekt)</option>
            </select>
          </div>

          {/* Area Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Område (Postnummer)
            </label>
            <input
              type="text"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              placeholder="t.ex. 11, 21, Stockholm"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          {/* SNI Code Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              SNI-kod (Bransch)
            </label>
            <input
              type="text"
              value={filterSniCode}
              onChange={(e) => setFilterSniCode(e.target.value)}
              placeholder="t.ex. 47, 4791"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          {/* Revenue Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              <Package className="w-4 h-4 inline mr-1" />
              Min Omsättning (MSEK)
            </label>
            <input
              type="number"
              value={filterMinRevenue}
              onChange={(e) => setFilterMinRevenue(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Max Omsättning (MSEK)
            </label>
            <input
              type="number"
              value={filterMaxRevenue}
              onChange={(e) => setFilterMaxRevenue(e.target.value)}
              placeholder="Ingen gräns"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          {/* Carrier Filter */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterWithCarrier}
                onChange={(e) => setFilterWithCarrier(e.target.checked)}
                className="w-4 h-4 text-[#FFC400] border-gray-300 rounded focus:ring-[#FFC400]"
              />
              <span className="text-sm font-semibold text-gray-700">Endast med min transportör</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="flex items-center gap-2 bg-[#FFC400] hover:bg-black text-black hover:text-white px-4 py-2 rounded font-semibold transition-colors"
          >
            <Filter className="w-4 h-4" />
            Tillämpa filter
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold"
          >
            Rensa filter
          </button>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-[#FFC400]" />
          </div>
        ) : leads.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">Inga leads hittades med valda filter</p>
            <p className="text-sm text-gray-400 mt-2">Prova att justera dina filterkriterier</p>
          </div>
        ) : (
          leads.map(lead => (
            <div
              key={lead.id}
              className="bg-white border-2 border-gray-200 hover:border-[#FFC400] p-4 rounded cursor-pointer transition-all"
              onClick={() => setSelectedLead(lead)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-black text-lg text-black">{lead.company_name}</h3>
                {lead.has_primary_carrier && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                    ✓ Transportör
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{lead.revenue || 'Okänd omsättning'}</span>
                  <span className={`ml-auto px-2 py-0.5 text-xs font-bold rounded ${
                    lead.segment === 'tier1' ? 'bg-purple-100 text-purple-800' :
                    lead.segment === 'tier2' ? 'bg-blue-100 text-blue-800' :
                    lead.segment === 'tier3' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.segment?.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{lead.city || lead.region || 'Okänd plats'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 text-xs">{lead.sni_description || 'Okänd bransch'}</span>
                </div>

                {lead.primary_carrier_position && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs font-semibold text-green-700">
                      Position #{lead.primary_carrier_position} i checkout
                    </span>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Delad från: <strong>{lead.source_tenant_name}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
