import React, { useState } from 'react';
import { 
  Search, Filter, Download, Building2, MapPin, TrendingUp, TrendingDown, Calendar,
  AlertTriangle, Shield, DollarSign, CheckCircle, Target, Package
} from 'lucide-react';
import { EnhancedLeadCard } from './EnhancedLeadCard';

interface Lead {
  id: string;
  company_name: string;
  org_number?: string;
  segment: string;
  city?: string;
  postal_code?: string;
  
  // Ekonomi
  revenue_tkr?: number;
  revenue_year?: string;
  freight_budget_tkr?: number;
  financial_data?: {
    revenue_change_percent?: number;
    previous_year_revenue?: number;
  };
  
  // Kredit & Varningar
  credit_rating?: string;
  kronofogden_check?: string;
  legal_status?: string;
  
  // Logistik
  uses_dhl?: string;
  ecommerce_platform?: string;
  carriers?: string;
  
  // Competitive Intelligence
  competitive_intelligence?: {
    opportunity_score: number;
    is_dhl_customer: boolean;
  };
  
  // Kontaktpersoner
  decision_makers?: Array<{
    name: string;
    title: string;
    linkedin_url?: string;
  }>;
  
  // Metadata
  analysis_date?: string;
  assigned_salesperson?: string;
  created_at?: string;
}

interface EnhancedLeadListProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

export const EnhancedLeadList: React.FC<EnhancedLeadListProps> = ({ leads, onLeadClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [filterWarnings, setFilterWarnings] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'date' | 'opportunity'>('date');

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      DM: 'bg-gray-100 text-gray-800 border-gray-300',
      TS: 'bg-green-100 text-green-800 border-green-300',
      FS: 'bg-blue-100 text-blue-800 border-blue-300',
      KAM: 'bg-purple-100 text-purple-800 border-purple-300',
      UNKNOWN: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[segment] || colors.UNKNOWN;
  };

  const hasWarnings = (lead: Lead) => {
    return lead.kronofogden_check || 
           lead.legal_status?.toLowerCase().includes('konkurs') ||
           lead.legal_status?.toLowerCase().includes('likvidation') ||
           lead.legal_status?.toLowerCase().includes('rekonstruktion');
  };

  const getRevenueChange = (lead: Lead) => {
    if (lead.financial_data?.revenue_change_percent !== undefined) {
      return lead.financial_data.revenue_change_percent;
    }
    if (lead.financial_data?.previous_year_revenue && lead.revenue_tkr) {
      const change = ((lead.revenue_tkr - lead.financial_data.previous_year_revenue) / lead.financial_data.previous_year_revenue) * 100;
      return Math.round(change * 10) / 10;
    }
    return null;
  };

  const getCreditColor = (rating?: string) => {
    if (!rating) return 'text-gray-500';
    const r = rating.toUpperCase();
    if (r.includes('AAA') || r.includes('AA')) return 'text-green-600';
    if (r.includes('A')) return 'text-blue-600';
    if (r.includes('B')) return 'text-yellow-600';
    if (r.includes('C') || r.includes('D')) return 'text-red-600';
    return 'text-gray-500';
  };

  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch = lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.org_number?.includes(searchTerm) ||
                           lead.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSegment = filterSegment === 'all' || lead.segment === filterSegment;
      const matchesWarnings = !filterWarnings || hasWarnings(lead);
      return matchesSearch && matchesSegment && matchesWarnings;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.company_name.localeCompare(b.company_name);
        case 'revenue':
          return (b.revenue_tkr || 0) - (a.revenue_tkr || 0);
        case 'date':
          return new Date(b.analysis_date || b.created_at || 0).getTime() - new Date(a.analysis_date || a.created_at || 0).getTime();
        case 'opportunity':
          return (b.competitive_intelligence?.opportunity_score || 0) - (a.competitive_intelligence?.opportunity_score || 0);
        default:
          return 0;
      }
    });

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    if (onLeadClick) {
      onLeadClick(lead);
    }
  };

  const exportToCSV = () => {
    const headers = ['Företag', 'Org.nr', 'Segment', 'Stad', 'Omsättning (TKR)', 'Förändring %', 'Kreditbetyg', 'Varningar', 'Datum'];
    const rows = filteredLeads.map(lead => [
      lead.company_name,
      lead.org_number || '',
      lead.segment,
      lead.city || '',
      lead.revenue_tkr || '',
      getRevenueChange(lead) || '',
      lead.credit_rating || '',
      hasWarnings(lead) ? 'JA' : 'NEJ',
      lead.analysis_date || lead.created_at || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhl_leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border-l-4 border-dhl-red p-6 shadow-md rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-dhl-red uppercase">Leads</h2>
            <p className="text-sm text-gray-600 mt-1">
              Visar <span className="font-semibold text-dhl-red">{filteredLeads.length}</span> av{' '}
              <span className="font-semibold">{leads.length}</span> leads
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-dhl-yellow text-black px-6 py-3 rounded-lg hover:bg-opacity-90 transition font-semibold uppercase text-sm shadow-md"
          >
            <Download className="w-4 h-4" />
            Exportera CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sök företag, org.nr, stad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-dhl-red focus:ring-2 focus:ring-dhl-red focus:ring-opacity-20"
            />
          </div>

          {/* Segment Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterSegment}
              onChange={(e) => setFilterSegment(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-dhl-red appearance-none"
            >
              <option value="all">Alla segment</option>
              <option value="DM">DM - Direct Marketing</option>
              <option value="TS">TS - Telesales</option>
              <option value="FS">FS - Field Sales</option>
              <option value="KAM">KAM - Key Account</option>
              <option value="UNKNOWN">Oklassificerad</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-dhl-red"
          >
            <option value="date">Senast analyserade</option>
            <option value="name">Företagsnamn (A-Ö)</option>
            <option value="revenue">Omsättning (högst först)</option>
            <option value="opportunity">Opportunity Score</option>
          </select>

          {/* Warnings Filter */}
          <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={filterWarnings}
              onChange={(e) => setFilterWarnings(e.target.checked)}
              className="w-4 h-4 text-dhl-red"
            />
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold">Endast varningar</span>
          </label>
        </div>
      </div>

      {/* Lead Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLeads.length > 0 ? (
          filteredLeads.map(lead => {
            const revenueChange = getRevenueChange(lead);
            const warnings = hasWarnings(lead);
            
            return (
              <div
                key={lead.id}
                onClick={() => handleLeadClick(lead)}
                className={`bg-white border-l-4 ${warnings ? 'border-red-500' : 'border-dhl-red'} p-6 shadow-md hover:shadow-xl transition cursor-pointer rounded-lg`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Main Content */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 className="w-6 h-6 text-dhl-red" />
                      <h3 className="text-2xl font-bold text-gray-900">{lead.company_name}</h3>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSegmentColor(lead.segment)}`}>
                        {lead.segment}
                      </span>
                      
                      {lead.uses_dhl === 'yes' && (
                        <span className="bg-dhl-yellow text-black px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          DHL
                        </span>
                      )}
                      
                      {warnings && (
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          VARNING
                        </span>
                      )}
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                      {/* Omsättning med förändring */}
                      <div className="bg-blue-50 p-3 rounded-lg border-l-2 border-blue-500">
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <DollarSign className="w-3 h-3" />
                          <span>Omsättning {lead.revenue_year}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {lead.revenue_tkr ? `${(lead.revenue_tkr / 1000).toFixed(0)}M` : 'N/A'}
                        </p>
                        {revenueChange !== null && (
                          <div className={`flex items-center gap-1 text-xs mt-1 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {revenueChange >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span className="font-bold">{revenueChange >= 0 ? '+' : ''}{revenueChange}%</span>
                          </div>
                        )}
                      </div>

                      {/* Fraktbudget */}
                      <div className="bg-yellow-50 p-3 rounded-lg border-l-2 border-dhl-yellow">
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <Package className="w-3 h-3" />
                          <span>Fraktbudget</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {lead.freight_budget_tkr ? `${(lead.freight_budget_tkr / 1000).toFixed(1)}M` : 'N/A'}
                        </p>
                      </div>

                      {/* Kreditbetyg */}
                      <div className="bg-green-50 p-3 rounded-lg border-l-2 border-green-500">
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <Shield className="w-3 h-3" />
                          <span>Kredit</span>
                        </div>
                        <p className={`text-lg font-bold ${getCreditColor(lead.credit_rating)}`}>
                          {lead.credit_rating || 'N/A'}
                        </p>
                      </div>

                      {/* Opportunity Score */}
                      {lead.competitive_intelligence && (
                        <div className="bg-purple-50 p-3 rounded-lg border-l-2 border-purple-500">
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <Target className="w-3 h-3" />
                            <span>Opportunity</span>
                          </div>
                          <p className="text-lg font-bold text-purple-600">
                            {lead.competitive_intelligence.opportunity_score}/100
                          </p>
                        </div>
                      )}

                      {/* Location */}
                      <div className="bg-gray-50 p-3 rounded-lg border-l-2 border-gray-400">
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>Plats</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {lead.city || 'N/A'}
                        </p>
                        {lead.postal_code && (
                          <p className="text-xs text-gray-600">{lead.postal_code}</p>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
                      {lead.org_number && (
                        <span className="text-gray-600">
                          <strong>Org.nr:</strong> {lead.org_number}
                        </span>
                      )}
                      
                      {lead.decision_makers && lead.decision_makers.length > 0 && (
                        <span className="text-gray-700">
                          <strong>Kontakt:</strong> {lead.decision_makers[0].name} ({lead.decision_makers[0].title})
                        </span>
                      )}
                      
                      {lead.ecommerce_platform && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold">
                          {lead.ecommerce_platform}
                        </span>
                      )}
                      
                      {lead.carriers && (
                        <span className="text-gray-600">
                          <strong>Transportörer:</strong> {lead.carriers.split(',').slice(0, 2).join(', ')}
                        </span>
                      )}
                      
                      {lead.analysis_date && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.analysis_date).toLocaleDateString('sv-SE')}
                        </span>
                      )}
                      
                      {lead.assigned_salesperson && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                          {lead.assigned_salesperson}
                        </span>
                      )}
                    </div>

                    {/* Warnings Details */}
                    {warnings && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                          <div className="text-xs text-red-900">
                            {lead.kronofogden_check && <p>• {lead.kronofogden_check}</p>}
                            {lead.legal_status?.toLowerCase().includes('konkurs') && <p>• Konkursansökan</p>}
                            {lead.legal_status?.toLowerCase().includes('likvidation') && <p>• Likvidation</p>}
                            {lead.legal_status?.toLowerCase().includes('rekonstruktion') && <p>• Rekonstruktion</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button className="bg-dhl-red text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition text-sm font-semibold uppercase shadow-md whitespace-nowrap">
                    Visa Detaljer
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 text-center shadow-md rounded-lg">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold">Inga leads hittades</p>
            <p className="text-gray-400 text-sm mt-2">Prova att ändra sökfilter eller lägg till nya leads</p>
          </div>
        )}
      </div>

      {/* Lead Card Modal */}
      {selectedLead && (
        <EnhancedLeadCard
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
};
