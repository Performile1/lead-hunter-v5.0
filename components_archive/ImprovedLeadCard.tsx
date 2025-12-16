import React from 'react';
import { 
  Hash, Globe, Phone, Clock, RefreshCw, TriangleAlert, Pen, 
  TrendingUp, ChartColumn, Code, Store, ShieldCheck, Truck, 
  CircleCheck, Package, ShoppingCart, MapPin, Building, Warehouse,
  Undo2, Newspaper, Link2, ExternalLink, User, Mail, Linkedin,
  Search, Star, Target, Zap, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';

interface Lead {
  // Grundinfo
  company_name: string;
  org_number?: string;
  segment: string;
  parent_company?: string;
  
  // Kontakt
  website_url?: string;
  phone_number?: string;
  email_structure?: string;
  
  // Adresser
  address?: string;
  postal_code?: string;
  city?: string;
  visiting_address?: string;
  warehouse_address?: string;
  return_address?: string;
  
  // Ekonomi
  revenue_tkr?: number;
  revenue_year?: string;
  previous_revenue_tkr?: number;
  freight_budget_tkr?: number;
  liquidity?: string;
  credit_rating?: string;
  credit_description?: string;
  
  // Juridiskt
  has_ftax?: string;
  legal_status?: string;
  kronofogden_check?: string;
  
  // E-handel & Tech
  ecommerce_platform?: string;
  checkout_providers?: string[];
  uses_dhl?: string;
  carriers?: string;
  markets?: string;
  delivery_services?: string[];
  
  // Nyheter & Rating
  latest_news?: string;
  latest_news_url?: string;
  rating?: {
    score: number;
    max_score: number;
    review_count: number;
    source: string;
    summary: string;
  };
  
  // Metadata
  analysis_date?: string;
  source?: string;
  source_links?: string[];
  
  // Beslutsfattare
  decision_makers?: Array<{
    name: string;
    title: string;
    email?: string;
    linkedin_url?: string;
    direct_phone?: string;
  }>;
  
  // Website Analysis
  website_analysis?: {
    shipping_providers: Array<{
      name: string;
      type: 'competitor' | 'dhl' | 'other';
      position_in_checkout?: number;
    }>;
    has_dhl: boolean;
    dhl_position?: number;
    shipping_terms: {
      free_shipping_threshold?: number;
      standard_cost?: number;
    };
  };
  
  // Competitive Intelligence
  competitive_intelligence?: {
    opportunity_score: number;
    sales_pitch: string;
    is_dhl_customer: boolean;
  };
  
  // Triggers
  triggers?: Array<{
    type: string;
    title: string;
    description: string;
    detected_at: string;
  }>;
}

interface ImprovedLeadCardProps {
  lead: Lead;
  onRefresh?: () => void;
  onReport?: () => void;
  onEdit?: () => void;
}

export const ImprovedLeadCard: React.FC<ImprovedLeadCardProps> = ({
  lead,
  onRefresh,
  onReport,
  onEdit
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

  const calculateRevenueChange = () => {
    if (!lead.revenue_tkr || !lead.previous_revenue_tkr) return null;
    const change = ((lead.revenue_tkr - lead.previous_revenue_tkr) / lead.previous_revenue_tkr) * 100;
    return Math.round(change * 10) / 10;
  };

  const revenueChange = calculateRevenueChange();

  const formatRevenue = (tkr?: number) => {
    if (!tkr) return 'N/A';
    if (tkr >= 1000000) return `${(tkr / 1000000).toFixed(1)} mdSEK`;
    if (tkr >= 1000) return `${(tkr / 1000).toFixed(0)} MSEK`;
    return `${tkr.toLocaleString('sv-SE')} TKR`;
  };

  return (
    <div id="lead-card-container" className="animate-slideDown">
      <div className="bg-white rounded-none shadow-md border-t-4 border-[#D40511] overflow-hidden mb-6 transition-all hover:shadow-xl w-full">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-xl font-black italic text-black uppercase truncate">
                {lead.company_name}
              </h3>
              
              <span className={`px-2.5 py-0.5 rounded-none text-xs font-black border uppercase tracking-wider ${getSegmentColor(lead.segment)}`}>
                {lead.segment}
              </span>
              
              {lead.has_ftax && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold border rounded-sm flex items-center gap-1 uppercase tracking-wider bg-blue-50 text-blue-800 border-blue-200">
                  F-skatt: {lead.has_ftax}
                </span>
              )}
              
              {lead.uses_dhl === 'yes' && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold border rounded-sm flex items-center gap-1 uppercase tracking-wider bg-green-50 text-green-800 border-green-200">
                  <CircleCheck className="w-3 h-3" />
                  DHL-Kund
                </span>
              )}
              
              {lead.triggers && lead.triggers.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold border rounded-sm flex items-center gap-1 uppercase tracking-wider bg-orange-50 text-orange-800 border-orange-200 animate-pulse">
                  <Zap className="w-3 h-3" />
                  {lead.triggers.length} Triggers
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm text-slate-600 items-center">
              {lead.org_number && (
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-1 min-w-0">
                    <Hash className="w-3.5 h-3.5 text-[#D40511] flex-shrink-0" />
                    <span className="truncate font-mono font-semibold">{lead.org_number}</span>
                  </span>
                  {lead.parent_company && (
                    <span className="text-[10px] text-slate-400 italic ml-1">
                      (Dotterbolag till {lead.parent_company})
                    </span>
                  )}
                </div>
              )}
              
              {lead.website_url && (
                <a href={lead.website_url} target="_blank" rel="noopener noreferrer" 
                   className="flex items-center gap-1 hover:text-[#D40511] hover:underline min-w-0 max-w-[250px]">
                  <Globe className="w-3.5 h-3.5 text-[#D40511] flex-shrink-0" />
                  <span className="truncate font-semibold">{lead.website_url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </a>
              )}
              
              {lead.phone_number && (
                <span className="flex items-center gap-1 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-[#D40511] flex-shrink-0" />
                  <span className="truncate font-bold">{lead.phone_number}</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
            <div className="flex gap-2 items-center">
              {lead.analysis_date && (
                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-sm border border-slate-200 shadow-sm"
                     title={`Analys utförd: ${lead.analysis_date}`}>
                  <Clock className="w-3 h-3 text-[#D40511]" />
                  Analys: {new Date(lead.analysis_date).toLocaleDateString('sv-SE')}
                </div>
              )}
              
              <div className="flex gap-2">
                {onRefresh && (
                  <button onClick={onRefresh}
                          className="flex items-center gap-1 px-3 py-1.5 border rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm bg-[#FFC400] border-slate-300 text-slate-700 hover:bg-[#D40511] hover:text-white hover:border-[#D40511]"
                          title="Starta en helt ny sökning/analys på detta företag">
                    <RefreshCw className="w-3 h-3" />
                    Ny Analys
                  </button>
                )}
                
                {onReport && (
                  <button onClick={onReport}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#FFC400] border border-slate-300 text-orange-600 hover:bg-orange-50 hover:border-orange-500 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                          title="Rapportera fel data eller ta bort">
                    <TriangleAlert className="w-3 h-3" />
                    Rapportera
                  </button>
                )}
                
                {onEdit && (
                  <button onClick={onEdit}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#FFC400] border border-slate-300 text-slate-600 hover:text-[#D40511] hover:border-[#D40511] rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                          title="Redigera grunduppgifter">
                    <Pen className="w-3 h-3" />
                    Redigera
                  </button>
                )}
              </div>
            </div>
            
            {lead.credit_rating && (
              <div className="flex flex-col items-end gap-1">
                <div className="text-[10px] text-[#D40511] uppercase tracking-wider font-bold">
                  Kreditvärdighet
                </div>
                <div className="font-mono font-bold px-3 py-1 rounded-sm inline-block shadow-sm text-xs bg-[#FFCC00] text-black">
                  {lead.credit_rating}
                </div>
                {lead.credit_description && (
                  <div className="text-[9px] text-slate-400 italic">{lead.credit_description}</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 3-COLUMN LAYOUT */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KOLUMN 1: EKONOMI & LOGISTIK */}
          <div className="space-y-4 min-w-0">
            <h4 className="text-sm font-bold text-black border-b-2 border-[#FFCC00] pb-2 flex items-center gap-2 uppercase">
              <TrendingUp className="w-4 h-4 text-[#D40511]" />
              Ekonomi & Logistik
            </h4>
            
            <div className="bg-slate-50 p-3 border border-slate-100 space-y-3">
              {/* Omsättning */}
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Omsättning & Historik</span>
                  <span className="font-bold text-black text-xs break-words block">
                    {formatRevenue(lead.revenue_tkr)} {lead.revenue_year && `(${lead.revenue_year})`}
                  </span>
                  {lead.source && (
                    <span className="text-[9px] text-slate-400 block italic mb-1">
                      Källa: {lead.source}
                    </span>
                  )}
                  
                  {/* Länkar till källor */}
                  <div className="flex gap-1 mt-1">
                    {lead.org_number && (
                      <>
                        <a href={`https://www.allabolag.se/${lead.org_number.replace('-', '')}`}
                           target="_blank" rel="noopener noreferrer"
                           className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-[#D40511] hover:text-white hover:border-[#D40511] transition-colors">
                          Allabolag
                        </a>
                        <a href={`https://www.ratsit.se/${lead.org_number.replace('-', '')}`}
                           target="_blank" rel="noopener noreferrer"
                           className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-[#D40511] hover:text-white hover:border-[#D40511] transition-colors">
                          Ratsit
                        </a>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Fraktbudget */}
                {lead.freight_budget_tkr && (
                  <div className="mt-2">
                    <span className="text-xs text-slate-500 block mb-1">Est. Frakt (5%)</span>
                    <span className="font-bold text-[#D40511] text-xs break-words">
                      {formatRevenue(lead.freight_budget_tkr)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Utveckling */}
              {lead.previous_revenue_tkr && revenueChange !== null && (
                <div className="bg-white border border-slate-200 p-2 rounded-sm mt-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block flex items-center gap-1">
                    <ChartColumn className="w-3 h-3" />
                    Utveckling (Bokslut)
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-10">{lead.revenue_year}:</span>
                        <span className="text-xs font-bold">{formatRevenue(lead.revenue_tkr)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-10">
                          {parseInt(lead.revenue_year || '0') - 1}:
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatRevenue(lead.previous_revenue_tkr)}
                        </span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-sm text-xs font-bold flex items-center gap-1 border ${
                      revenueChange >= 0 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      <TrendingUp className="w-3 h-3" />
                      {revenueChange >= 0 ? '+' : ''}{revenueChange}%
                    </div>
                  </div>
                </div>
              )}
              
              {/* Likviditet */}
              {lead.liquidity && (
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <ChartColumn className="w-3 h-3" />
                    Kassalikviditet
                  </span>
                  <span className="font-bold text-black text-xs">{lead.liquidity}</span>
                </div>
              )}
              
              {/* Tech Stack */}
              {lead.ecommerce_platform && (
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-xs text-slate-500 block flex items-center gap-1 mb-1">
                    <Code className="w-3 h-3" />
                    Tech Stack & Betalning
                  </span>
                  <span className="font-bold text-black text-xs">
                    {lead.ecommerce_platform}
                    {lead.checkout_providers && lead.checkout_providers.length > 0 && 
                      ` (${lead.checkout_providers.join(', ')})`
                    }
                  </span>
                </div>
              )}
            </div>
            
            {/* Transportörer */}
            {(lead.carriers || lead.website_analysis) && (
              <div className="bg-white border border-slate-200 p-3 shadow-sm min-h-[140px]">
                <div className="flex flex-col gap-2 mb-2">
                  <span className="text-xs font-bold flex items-center gap-1 text-slate-700">
                    <Truck className="w-3 h-3 text-[#D40511]" />
                    Transportörer
                  </span>
                  
                  {lead.carriers && (
                    <div className="text-[11px] text-slate-700 mb-1">
                      <span className="font-bold">Hittade:</span> {lead.carriers}
                    </div>
                  )}
                  
                  {lead.website_analysis && (
                    <div className={`text-[10px] font-bold px-2 py-1.5 rounded flex items-start gap-2 border ${
                      lead.website_analysis.has_dhl
                        ? 'bg-green-50 text-green-800 border-green-100'
                        : 'bg-red-50 text-red-800 border-red-100'
                    }`}>
                      {lead.website_analysis.has_dhl ? (
                        <>
                          <CircleCheck className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="leading-tight">
                            DHL: Ja {lead.website_analysis.dhl_position && `(Position #${lead.website_analysis.dhl_position})`}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="leading-tight">DHL: Nej - Opportunity!</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Marknader */}
                {lead.markets && (
                  <div className="text-xs text-slate-600">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Marknader & Profil
                    </span>
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold text-slate-800">Export/Import:</span> {lead.markets}
                    </div>
                  </div>
                )}
                
                {/* Leveranstjänster */}
                {lead.delivery_services && lead.delivery_services.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Leveranstjänster
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {lead.delivery_services.map((service, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] border border-blue-100 font-semibold">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Checkout Ranking */}
                {lead.website_analysis && lead.website_analysis.shipping_providers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      Checkout Ranking
                    </span>
                    <div className="text-[10px] font-mono bg-slate-50 p-1 border border-slate-200 rounded text-slate-700 leading-tight">
                      {lead.website_analysis.shipping_providers
                        .sort((a, b) => (a.position_in_checkout || 999) - (b.position_in_checkout || 999))
                        .map((p, idx) => `${idx + 1}. ${p.name}`)
                        .join(', ')}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Rating */}
            {lead.rating && (
              <div className="bg-white border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-50 p-2 rounded-full border border-slate-100">
                    <Star className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-green-600">
                        {lead.rating.score} av {lead.rating.max_score}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">/ {lead.rating.max_score}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Baserat på {lead.rating.review_count.toLocaleString('sv-SE')} omdömen via {lead.rating.source}
                    </div>
                    {lead.rating.summary && (
                      <div className="mt-1 text-[10px] italic text-slate-600 bg-slate-50 p-1 rounded border border-slate-100 leading-tight break-words whitespace-pre-wrap">
                        "{lead.rating.summary}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* KOLUMN 2: AI SÄLJANALYS */}
          <div className="space-y-4 min-w-0">
            <h4 className="text-sm font-bold text-black border-b-2 border-[#FFCC00] pb-2 flex items-center gap-2 uppercase">
              <Target className="w-4 h-4 text-[#D40511]" />
              AI Säljanalys
            </h4>
            
            {/* Logistiknätverk */}
            <div className="bg-white border border-slate-200 text-xs shadow-sm">
              <div className="bg-slate-50 border-b border-slate-100 p-2 font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-3 h-3 text-[#D40511]" />
                Logistiknätverk
              </div>
              <div className="grid grid-cols-2 gap-px bg-slate-100">
                <div className="bg-white p-2 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    Säte
                  </span>
                  <span className="font-mono text-slate-700 break-words leading-tight">
                    {lead.address ? `${lead.address}, ${lead.postal_code} ${lead.city}` : '-'}
                  </span>
                </div>
                <div className="bg-white p-2 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Besök
                  </span>
                  <span className="font-mono text-slate-700 break-words leading-tight">
                    {lead.visiting_address || lead.address || '-'}
                  </span>
                </div>
                <div className="bg-white p-2 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Warehouse className="w-3 h-3" />
                    Lager
                  </span>
                  <span className="font-mono text-slate-700 break-words leading-tight">
                    {lead.warehouse_address || '-'}
                  </span>
                </div>
                <div className="bg-white p-2 flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Undo2 className="w-3 h-3" />
                    Retur
                  </span>
                  <span className="font-mono text-slate-700 break-words leading-tight">
                    {lead.return_address || '-'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Triggers */}
            {lead.triggers && lead.triggers.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-3 shadow-sm">
                <div className="flex items-start gap-2 mb-2">
                  <Zap className="w-4 h-4 text-orange-600 mt-0.5" />
                  <span className="text-xs font-bold text-orange-800 uppercase">
                    Expansionssignaler ({lead.triggers.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {lead.triggers.map((trigger, idx) => (
                    <div key={idx} className="bg-white border border-orange-100 p-2 rounded-sm">
                      <div className="font-bold text-xs text-orange-900">{trigger.title}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{trigger.description}</div>
                      <div className="text-[9px] text-slate-400 mt-1">
                        {new Date(trigger.detected_at).toLocaleDateString('sv-SE')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Competitive Intelligence */}
            {lead.competitive_intelligence && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 shadow-sm">
                <div className="flex items-start gap-2 mb-2">
                  <Target className="w-4 h-4 text-gray-700 mt-0.5" />
                  <span className="text-xs font-bold text-black uppercase">
                    Opportunity Score
                  </span>
                </div>
                <div className="text-center mb-3">
                  <div className="text-4xl font-black text-gray-700">
                    {lead.competitive_intelligence.opportunity_score}
                  </div>
                  <div className="text-xs text-black font-bold">
                    {lead.competitive_intelligence.opportunity_score >= 80 ? '🔥 KONTAKTA NU!' :
                     lead.competitive_intelligence.opportunity_score >= 60 ? '⭐ Kontakta snart' :
                     lead.competitive_intelligence.opportunity_score >= 40 ? '👀 Bevaka' : '❌ Låg prioritet'}
                  </div>
                </div>
                {lead.competitive_intelligence.sales_pitch && (
                  <div className="bg-white border border-purple-100 p-2 rounded-sm">
                    <div className="text-[10px] font-bold text-black mb-1">Säljpitch:</div>
                    <div className="text-[10px] text-slate-700 italic leading-relaxed">
                      {lead.competitive_intelligence.sales_pitch}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Senaste Nytt */}
            {lead.latest_news && (
              <div className="bg-white p-3 border border-slate-200 shadow-sm border-l-4 border-l-[#D40511]">
                <div className="flex items-start gap-2 mb-1">
                  <Newspaper className="w-4 h-4 text-[#D40511] mt-0.5" />
                  <span className="text-xs font-bold text-slate-700 uppercase">Senaste Nytt</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">{lead.latest_news}</p>
                {lead.latest_news_url && (
                  <div className="pl-6 mt-1">
                    <a href={lead.latest_news_url} target="_blank" rel="noopener noreferrer"
                       className="text-[10px] text-[#D40511] hover:underline flex items-center gap-1 font-bold uppercase tracking-wide">
                      Läs mer <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {/* Icebreaker */}
            {lead.competitive_intelligence?.sales_pitch && (
              <div className="bg-[#FFCC00]/10 border border-[#FFCC00] p-3 rounded-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                  Förslag på inledning (Icebreaker)
                </span>
                <p className="text-xs text-slate-800 italic leading-relaxed">
                  {lead.competitive_intelligence.sales_pitch}
                </p>
              </div>
            )}
            
            {/* Verifierade Källor */}
            {lead.source_links && lead.source_links.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2">
                  <Link2 className="w-3 h-3" />
                  Verifierade Källor
                </span>
                <div className="flex flex-wrap gap-2">
                  {lead.source_links.map((link, idx) => (
                    <a key={idx} href={link} target="_blank" rel="noopener noreferrer"
                       className="px-2 py-1 rounded-sm text-[10px] font-bold border transition-colors flex items-center gap-1 max-w-[150px] truncate shadow-sm hover:underline bg-green-50 text-green-700 border-green-100"
                       title={link}>
                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      <span>{new URL(link).hostname.replace('www.', '')}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* KOLUMN 3: BESLUTSFATTARE */}
          <div className="space-y-4 min-w-0">
            <h4 className="text-sm font-bold text-black border-b-2 border-[#FFCC00] pb-2 flex items-center gap-2 uppercase">
              <User className="w-4 h-4 text-[#D40511]" />
              Beslutsfattare
            </h4>
            
            <div className="space-y-3">
              {lead.decision_makers && lead.decision_makers.length > 0 ? (
                lead.decision_makers.map((dm, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 p-3 shadow-sm hover:border-[#D40511] transition-colors group relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 mb-1 min-w-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#D40511] text-white text-xs font-bold">
                          {dm.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-800 truncate" title={dm.name}>
                            {dm.name}
                          </div>
                          <div className="text-xs text-slate-500 uppercase tracking-wide truncate" title={dm.title}>
                            {dm.title}
                          </div>
                        </div>
                      </div>
                      
                      {dm.linkedin_url && (
                        <a href={dm.linkedin_url} target="_blank" rel="noopener noreferrer"
                           className="text-[#0077b5] hover:bg-[#0077b5] hover:text-white p-1 rounded transition-colors"
                           title="Gå till LinkedIn profil">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    
                    <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-100">
                      {dm.email && (
                        <div className="flex items-center gap-2 text-xs min-w-0">
                          <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate text-slate-600 font-mono select-all">{dm.email}</span>
                        </div>
                      )}
                      
                      {dm.direct_phone ? (
                        <div className="flex items-center gap-2 text-xs min-w-0">
                          <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate text-slate-600 font-mono select-all">{dm.direct_phone}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs min-w-0">
                          <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate text-slate-600 font-mono select-all">
                            <span className="text-slate-300 italic">Ej tillgängligt</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-6 rounded-sm border border-slate-200 text-center">
                  <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Inga beslutsfattare hittade</p>
                </div>
              )}
              
              {/* Sök fler beslutsfattare */}
              <div className="bg-slate-50 p-3 rounded-sm border border-slate-200">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  Hittade vi inte rätt person?
                </h5>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 text-xs border-slate-300 rounded-sm focus:ring-[#D40511] focus:border-[#D40511]"
                    placeholder="Titel (t.ex. VD)"
                    type="text"
                    defaultValue="Head of Logistics, Logistics Manager, Fulfillment Manager, Last Mile, Logistikchef, COO"
                  />
                  <button className="bg-[#0077b5] text-white px-3 py-1 rounded-sm text-xs font-bold hover:bg-[#006097] transition-colors disabled:opacity-50">
                    <Linkedin className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ImprovedLeadCard;
