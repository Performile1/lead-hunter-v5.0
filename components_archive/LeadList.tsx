import React from 'react';
import { 
  Building, Hash, MapPin, TrendingUp, TrendingDown, 
  CircleCheck, XCircle, Zap, Eye, ChevronRight 
} from 'lucide-react';

interface Lead {
  id: string;
  company_name: string;
  org_number?: string;
  segment: string;
  city?: string;
  revenue_tkr?: number;
  previous_revenue_tkr?: number;
  uses_dhl?: string;
  analysis_date?: string;
  triggers?: Array<{ type: string; title: string }>;
  competitive_intelligence?: {
    opportunity_score: number;
  };
}

interface LeadListProps {
  leads: Lead[];
  selectedLeadId?: string;
  onLeadClick: (lead: Lead) => void;
  isCompact?: boolean;
}

export const LeadList: React.FC<LeadListProps> = ({ 
  leads, 
  selectedLeadId, 
  onLeadClick,
  isCompact = false 
}) => {
  
  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      DM: 'bg-gray-100 text-gray-800 border-gray-300',
      TS: 'bg-green-100 text-green-800 border-green-300',
      FS: 'bg-blue-100 text-blue-800 border-blue-300',
      KAM: 'bg-[#D40511] text-white border-red-700',
      UNKNOWN: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[segment] || colors.UNKNOWN;
  };

  const calculateRevenueChange = (lead: Lead) => {
    if (!lead.revenue_tkr || !lead.previous_revenue_tkr) return null;
    const change = ((lead.revenue_tkr - lead.previous_revenue_tkr) / lead.previous_revenue_tkr) * 100;
    return Math.round(change * 10) / 10;
  };

  const formatRevenue = (tkr?: number) => {
    if (!tkr) return 'N/A';
    if (tkr >= 1000000) return `${(tkr / 1000000).toFixed(1)}md`;
    if (tkr >= 1000) return `${(tkr / 1000).toFixed(0)}M`;
    return `${tkr}K`;
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white border-2 border-slate-300 rounded-lg shadow-md p-12 text-center">
        <Building className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700 mb-2">Inga leads hittade</h3>
        <p className="text-slate-500">Använd sökpanelen för att hitta leads</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-slate-300 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-[#FFCC00] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black italic text-[#D40511] uppercase flex items-center gap-2">
            <Building className="w-5 h-5" />
            {isCompact ? 'Andra Leads' : 'Lead Lista'}
          </h3>
          <div className="text-sm font-bold text-slate-600">
            {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
          </div>
        </div>
      </div>

      {/* List */}
      <div className={`divide-y divide-slate-200 ${isCompact ? 'max-h-[500px]' : 'max-h-[800px]'} overflow-y-auto`}>
        {leads.map((lead) => {
          const revenueChange = calculateRevenueChange(lead);
          const isSelected = lead.id === selectedLeadId;
          
          return (
            <button
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className={`w-full text-left p-4 transition-all hover:bg-slate-50 ${
                isSelected ? 'bg-red-50 border-l-4 border-l-[#D40511]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Company Info */}
                <div className="flex-1 min-w-0">
                  {/* Company Name + Segment */}
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-base text-slate-900 truncate">
                      {lead.company_name}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black border uppercase ${getSegmentColor(lead.segment)}`}>
                      {lead.segment}
                    </span>
                    
                    {/* DHL Status */}
                    {lead.uses_dhl === 'yes' ? (
                      <CircleCheck className="w-4 h-4 text-green-600" title="DHL-kund" />
                    ) : lead.uses_dhl === 'no' ? (
                      <XCircle className="w-4 h-4 text-red-600" title="Ej DHL-kund" />
                    ) : null}
                    
                    {/* Triggers */}
                    {lead.triggers && lead.triggers.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded-sm text-[10px] font-bold">
                        <Zap className="w-3 h-3" />
                        {lead.triggers.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Details Row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    {lead.org_number && (
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{lead.org_number}</span>
                      </span>
                    )}
                    
                    {lead.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {lead.city}
                      </span>
                    )}
                    
                    {lead.revenue_tkr && (
                      <span className="flex items-center gap-1 font-semibold">
                        <TrendingUp className="w-3 h-3 text-slate-400" />
                        {formatRevenue(lead.revenue_tkr)} SEK
                      </span>
                    )}
                  </div>
                  
                  {/* Revenue Change */}
                  {revenueChange !== null && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        revenueChange >= 0 
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {revenueChange >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {revenueChange >= 0 ? '+' : ''}{revenueChange}%
                      </span>
                    </div>
                  )}
                  
                  {/* Analysis Date */}
                  {lead.analysis_date && (
                    <div className="mt-1 text-[10px] text-slate-400">
                      Analyserad: {new Date(lead.analysis_date).toLocaleDateString('sv-SE')}
                    </div>
                  )}
                </div>
                
                {/* Right: Opportunity Score + Arrow */}
                <div className="flex items-center gap-3">
                  {lead.competitive_intelligence?.opportunity_score && (
                    <div className="text-center">
                      <div className={`text-2xl font-black ${
                        lead.competitive_intelligence.opportunity_score >= 80 ? 'text-red-600' :
                        lead.competitive_intelligence.opportunity_score >= 60 ? 'text-orange-600' :
                        lead.competitive_intelligence.opportunity_score >= 40 ? 'text-yellow-600' :
                        'text-slate-400'
                      }`}>
                        {lead.competitive_intelligence.opportunity_score}
                      </div>
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Score</div>
                    </div>
                  )}
                  
                  <ChevronRight className={`w-5 h-5 transition-transform ${
                    isSelected ? 'text-[#D40511] transform rotate-90' : 'text-slate-400'
                  }`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LeadList;
