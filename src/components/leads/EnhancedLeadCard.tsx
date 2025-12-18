import React, { useState } from 'react';
import { 
  X, Building2, MapPin, Phone, Globe, Mail, Calendar, User, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, ExternalLink, DollarSign, Package, ShoppingCart, 
  Award, AlertTriangle, Shield, BarChart3, Target, Zap, Clock, FileText,
  Truck, CreditCard, Home, Box, Store, Flag, Code, Search
} from 'lucide-react';
import { FinancialGauge } from '../common/FinancialGauge';

interface Lead {
  id: string;
  company_name: string;
  org_number?: string;
  segment: string;
  
  // Adresser
  address?: string;
  postal_code?: string;
  city?: string;
  visiting_address?: string;
  warehouse_address?: string;
  return_address?: string;
  
  // Kontakt
  phone?: string;
  phone_number?: string;
  domain?: string;
  website_url?: string;
  email_structure?: string;
  
  // Ekonomi
  revenue_tkr?: number;
  revenue_year?: string;
  freight_budget_tkr?: number;
  financial_data?: {
    revenue_history?: Array<{ year: string; revenue: number }>;
    revenue_change_percent?: number;
    previous_year_revenue?: number;
  };
  financial_metrics?: {
    kassalikviditet?: number;
    vinstmarginal?: number;
    soliditet?: number;
    year?: string;
  };
  
  // Juridiskt & Kredit
  legal_status?: string;
  credit_rating?: string;
  credit_description?: string;
  kronofogden_check?: string;
  has_ftax?: string;
  liquidity?: string;
  trend_risk?: string;
  
  // Logistik & Tech
  logistics_profile?: string;
  markets?: string;
  carriers?: string;
  uses_dhl?: string;
  ecommerce_platform?: string;
  delivery_services?: any;
  checkout_position?: string;
  
  // Företagsinfo
  parent_company?: string;
  multi_brands?: string;
  trigger?: string;
  
  // Nyheter
  latest_news?: string;
  latest_news_url?: string;
  rating?: any;
  
  // Metadata
  source?: string;
  analysis_date?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  assigned_salesperson?: string;
  
  // Beslutsfattare
  decision_makers?: DecisionMaker[];
  
  // Competitive Intelligence (från website scraping)
  competitive_intelligence?: {
    is_dhl_customer: boolean;
    dhl_position?: number;
    primary_competitor?: string;
    all_competitors: string[];
    opportunity_score: number;
    sales_pitch: string;
  };
  
  // Website Analysis (från scraping)
  website_analysis?: {
    url: string;
    scraped_at: string;
    ecommerce_platform?: string;
    has_checkout: boolean;
    checkout_providers: string[];
    shipping_providers: Array<{
      name: string;
      type: 'competitor' | 'dhl' | 'other';
      position_in_checkout?: number;
      mentioned_on_pages: string[];
      logo_found: boolean;
    }>;
    has_dhl: boolean;
    dhl_position?: number;
    delivery_options: Array<{
      type: 'home_delivery' | 'parcel_locker' | 'service_point' | 'mailbox' | 'pickup';
      provider?: string;
      cost?: string;
      delivery_time?: string;
    }>;
    shipping_terms: {
      free_shipping_threshold?: number;
      standard_cost?: number;
      express_available: boolean;
      international_shipping: boolean;
      return_policy?: string;
    };
    markets: Array<{
      country: string;
      language: string;
      currency: string;
      has_local_shipping: boolean;
    }>;
    technologies: Array<{
      name: string;
      category: 'ecommerce' | 'payment' | 'analytics' | 'marketing' | 'shipping' | 'other';
      confidence: number;
    }>;
    financial_metrics?: {
      liquidity?: number;
      solidity?: number;
      profit_margin?: number;
      source: string;
    };
  };
}

interface DecisionMaker {
  name: string;
  title: string;
  email?: string;
  linkedin_url?: string;
  direct_phone?: string;
  priority?: number;
}

interface EnhancedLeadCardProps {
  lead: Lead;
  onClose: () => void;
}

export const EnhancedLeadCard: React.FC<EnhancedLeadCardProps> = ({ lead, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'competitive' | 'website' | 'history'>('overview');

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      DM: 'bg-gray-100 text-gray-800 border-gray-300',
      TS: 'bg-green-100 text-green-800 border-green-300',
      FS: 'bg-blue-100 text-blue-800 border-blue-300',
      KAM: 'bg-[#FFC400] text-black border-yellow-300',
      UNKNOWN: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[segment] || colors.UNKNOWN;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return `${amount.toLocaleString('sv-SE')} TKR`;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('sv-SE');
  };

  // Beräkna omsättningsförändring
  const getRevenueChange = () => {
    if (lead.financial_data?.revenue_change_percent !== undefined) {
      return lead.financial_data.revenue_change_percent;
    }
    if (lead.financial_data?.previous_year_revenue && lead.revenue_tkr) {
      const change = ((lead.revenue_tkr - lead.financial_data.previous_year_revenue) / lead.financial_data.previous_year_revenue) * 100;
      return Math.round(change * 10) / 10;
    }
    return null;
  };

  const revenueChange = getRevenueChange();

  // Kolla varningar
  const hasWarnings = () => {
    return lead.kronofogden_check || 
           lead.legal_status?.toLowerCase().includes('konkurs') ||
           lead.legal_status?.toLowerCase().includes('likvidation') ||
           lead.legal_status?.toLowerCase().includes('rekonstruktion');
  };

  const getWarnings = () => {
    const warnings: string[] = [];
    if (lead.kronofogden_check) warnings.push('Betalningsanmärkning');
    if (lead.legal_status?.toLowerCase().includes('konkurs')) warnings.push('Konkursansökan');
    if (lead.legal_status?.toLowerCase().includes('likvidation')) warnings.push('Likvidation');
    if (lead.legal_status?.toLowerCase().includes('rekonstruktion')) warnings.push('Rekonstruktion');
    return warnings;
  };

  // Kreditvärdighet färg
  const getCreditColor = (rating?: string) => {
    if (!rating) return 'bg-gray-100 text-gray-800';
    const r = rating.toUpperCase();
    if (r.includes('AAA') || r.includes('AA')) return 'bg-green-100 text-green-800 border-green-300';
    if (r.includes('A')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (r.includes('B')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (r.includes('C') || r.includes('D')) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-dhl-red text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-7 h-7" />
                <h2 className="text-3xl font-bold uppercase">{lead.company_name}</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                <span className={`px-4 py-1 rounded-full text-sm font-bold border-2 ${getSegmentColor(lead.segment)}`}>
                  {lead.segment}
                </span>
                
                {lead.uses_dhl === 'yes' && (
                  <span className="bg-secondary text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    DHL-KUND
                  </span>
                )}
                
                {hasWarnings() && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    VARNING
                  </span>
                )}
              </div>

              {/* Company Details Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {lead.org_number && (
                  <span className="flex items-center gap-1 bg-white bg-opacity-20 px-3 py-1 rounded">
                    <span className="font-semibold">{lead.org_number}</span>
                  </span>
                )}
                
                {lead.parent_company && (
                  <span className="flex items-center gap-1 bg-white bg-opacity-20 px-3 py-1 rounded">
                    <span className="opacity-90">(Dotterbolag till {lead.parent_company})</span>
                  </span>
                )}
                
                {lead.domain && (
                  <a 
                    href={`https://${lead.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-white bg-opacity-20 px-3 py-1 rounded hover:bg-opacity-30 transition"
                  >
                    <Globe className="w-3 h-3" />
                    <span className="font-semibold">{lead.domain}</span>
                  </a>
                )}
                
                {lead.phone && (
                  <a 
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1 bg-white bg-opacity-20 px-3 py-1 rounded hover:bg-opacity-30 transition"
                  >
                    <Phone className="w-3 h-3" />
                    <span className="font-semibold">{lead.phone}</span>
                  </a>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#FFC400] hover:bg-opacity-20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {['overview', 'contacts', 'competitive', 'website', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 font-semibold uppercase text-sm transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-3 border-primary text-primary bg-white'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                }`}
              >
                {tab === 'overview' && '📊 Översikt'}
                {tab === 'contacts' && '👥 Kontakter'}
                {tab === 'competitive' && '🎯 Konkurrens'}
                {tab === 'website' && '🌐 Website Scraping'}
                {tab === 'history' && '📅 Historik'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-250px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* VARNINGAR - Högst upp om de finns! */}
              {hasWarnings() && (
                <section className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-900 mb-3 uppercase">⚠️ KRITISKA VARNINGAR</h3>
                      <div className="space-y-2">
                        {getWarnings().map((warning, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-red-100 p-3 rounded">
                            <AlertCircle className="w-5 h-5 text-red-700" />
                            <span className="font-semibold text-red-900">{warning}</span>
                          </div>
                        ))}
                      </div>
                      {lead.kronofogden_check && (
                        <p className="mt-3 text-sm text-red-800">{lead.kronofogden_check}</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Ekonomi & Kreditvärdighet */}
              <section>
                <h3 className="text-lg font-bold text-primary mb-4 uppercase flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Ekonomi & Kreditvärdighet
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Omsättning med förändring */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-1 font-semibold">Omsättning {lead.revenue_year}</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(lead.revenue_tkr)}</p>
                    {revenueChange !== null && (
                      <div className={`flex items-center gap-1 mt-2 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {revenueChange >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-bold text-sm">
                          {revenueChange >= 0 ? '+' : ''}{revenueChange}%
                        </span>
                        <span className="text-xs text-gray-600">vs föregående år</span>
                      </div>
                    )}
                  </div>

                  {/* Fraktbudget */}
                  <div className="bg-yellow-50 border-l-4 border-dhl-yellow p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-1 font-semibold">Fraktbudget (5%)</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(lead.freight_budget_tkr)}</p>
                    <p className="text-xs text-gray-600 mt-2">Estimerad årlig fraktkostnad</p>
                  </div>

                  {/* Kreditbetyg */}
                  <div className={`border-l-4 p-4 rounded-lg ${getCreditColor(lead.credit_rating)}`}>
                    <p className="text-sm font-semibold mb-1 flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Kreditbetyg
                    </p>
                    <p className="text-3xl font-bold">{lead.credit_rating || 'N/A'}</p>
                    {lead.credit_description && (
                      <p className="text-xs mt-2">{lead.credit_description}</p>
                    )}
                  </div>

                  {/* Likviditet */}
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-1 font-semibold">Likviditet</p>
                    <p className="text-3xl font-bold text-gray-900">{lead.liquidity || 'N/A'}</p>
                    {lead.trend_risk && (
                      <p className="text-xs text-gray-600 mt-2">{lead.trend_risk}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Kontaktinformation */}
              <section>
                <h3 className="text-lg font-bold text-primary mb-4 uppercase flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Kontaktinformation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.address && (
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Postadress</p>
                        <p className="text-gray-900">{lead.address}</p>
                        <p className="text-gray-900">{lead.postal_code} {lead.city}</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.visiting_address && (
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <Building2 className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Besöksadress</p>
                        <p className="text-gray-900">{lead.visiting_address}</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.warehouse_address && (
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <Package className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Lageradress</p>
                        <p className="text-gray-900">{lead.warehouse_address}</p>
                      </div>
                    </div>
                  )}
                  
                  {lead.phone_number && (
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <Phone className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Telefon</p>
                        <a href={`tel:${lead.phone_number}`} className="text-dhl-blue hover:underline font-semibold">
                          {lead.phone_number}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {lead.website_url && (
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <Globe className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Webbplats</p>
                        <a
                          href={lead.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dhl-blue hover:underline flex items-center gap-1"
                        >
                          {lead.website_url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {lead.email_structure && (
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                      <Mail className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Email-struktur</p>
                        <p className="text-gray-900 font-mono text-sm">{lead.email_structure}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* E-handel & Logistik */}
              {(lead.ecommerce_platform || lead.carriers || lead.markets) && (
                <section>
                  <h3 className="text-lg font-bold text-primary mb-4 uppercase flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    E-handel & Logistik
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {lead.ecommerce_platform && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 mb-1 font-semibold">E-handelsplattform</p>
                        <p className="text-lg font-bold text-gray-900">{lead.ecommerce_platform}</p>
                      </div>
                    )}
                    
                    {lead.carriers && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 mb-1 font-semibold">Transportörer</p>
                        <p className="text-sm text-gray-900">{lead.carriers}</p>
                      </div>
                    )}
                    
                    {lead.markets && (
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                        <p className="text-sm text-gray-700 mb-1 font-semibold">Marknader</p>
                        <p className="text-sm text-gray-900">{lead.markets}</p>
                      </div>
                    )}
                  </div>
                  
                  {lead.logistics_profile && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-sm text-gray-700 mb-2">Logistikprofil</p>
                      <p className="text-gray-900 text-sm">{lead.logistics_profile}</p>
                    </div>
                  )}
                </section>
              )}

              {/* Nyheter */}
              {lead.latest_news && (
                <section>
                  <h3 className="text-lg font-bold text-primary mb-4 uppercase flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Senaste Nyheter
                  </h3>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <p className="text-gray-900">{lead.latest_news}</p>
                    {lead.latest_news_url && (
                      <a
                        href={lead.latest_news_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dhl-blue hover:underline text-sm mt-2 inline-flex items-center gap-1"
                      >
                        Läs mer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Tidsstämplar */}
              <section>
                <h3 className="text-lg font-bold text-primary mb-4 uppercase flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Tidsstämplar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Analyserad</p>
                      <p className="font-semibold">{formatDate(lead.analysis_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Skapad</p>
                      <p className="font-semibold">{formatDate(lead.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Uppdaterad</p>
                      <p className="font-semibold">{formatDate(lead.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Källa</p>
                      <p className="font-semibold uppercase">{lead.source || 'AI'}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary mb-4 uppercase flex items-center gap-2">
                <User className="w-5 h-5" />
                Beslutsfattare
              </h3>
              {lead.decision_makers && lead.decision_makers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.decision_makers.map((dm, index) => (
                    <div key={index} className="border-l-4 border-dhl-yellow bg-yellow-50 p-5 rounded-lg shadow-sm hover:shadow-md transition">
                      <div className="flex items-start gap-3">
                        <div className="bg-secondary rounded-full p-2">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-xl text-gray-900">{dm.name}</h4>
                          <p className="text-gray-600 font-semibold mb-3">{dm.title}</p>
                          <div className="space-y-2 text-sm">
                            {dm.email && (
                              <div className="flex items-center gap-2 bg-white p-2 rounded">
                                <Mail className="w-4 h-4 text-primary" />
                                <a href={`mailto:${dm.email}`} className="text-dhl-blue hover:underline">
                                  {dm.email}
                                </a>
                              </div>
                            )}
                            {dm.direct_phone && (
                              <div className="flex items-center gap-2 bg-white p-2 rounded">
                                <Phone className="w-4 h-4 text-primary" />
                                <a href={`tel:${dm.direct_phone}`} className="text-dhl-blue hover:underline">
                                  {dm.direct_phone}
                                </a>
                              </div>
                            )}
                            {dm.linkedin_url && (
                              <div className="flex items-center gap-2 bg-white p-2 rounded">
                                <ExternalLink className="w-4 h-4 text-primary" />
                                <a
                                  href={dm.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-dhl-blue hover:underline"
                                >
                                  LinkedIn-profil
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Inga beslutsfattare registrerade</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'competitive' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-primary mb-4 uppercase flex items-center gap-2">
                <Target className="w-5 h-5" />
                Competitive Intelligence
              </h3>
              
              {lead.competitive_intelligence ? (
                <>
                  {/* Opportunity Score */}
                  <div className="bg-purple-50 border-2 border-yellow-300 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Opportunity Score</p>
                        <p className="text-5xl font-bold text-gray-700">
                          {lead.competitive_intelligence.opportunity_score}/100
                        </p>
                      </div>
                      <div className="text-right">
                        <Award className="w-16 h-16 text-purple-400 mb-2" />
                        <p className="text-sm font-semibold text-black">
                          {lead.competitive_intelligence.opportunity_score >= 80 ? '🔥 KONTAKTA NU!' :
                           lead.competitive_intelligence.opportunity_score >= 60 ? '⭐ Kontakta snart' :
                           lead.competitive_intelligence.opportunity_score >= 40 ? '👀 Bevaka' : '❌ Låg prioritet'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Säljpitch */}
                  <div className="bg-yellow-50 border-l-4 border-dhl-yellow p-5 rounded-lg">
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-dhl-yellow" />
                      Säljpitch
                    </h4>
                    <p className="text-gray-900 leading-relaxed">{lead.competitive_intelligence.sales_pitch}</p>
                  </div>

                  {/* Konkurrenter */}
                  {lead.competitive_intelligence.all_competitors.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg">
                      <h4 className="font-bold text-lg mb-3">Konkurrenter ({lead.competitive_intelligence.all_competitors.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {lead.competitive_intelligence.all_competitors.map((comp, idx) => (
                          <span key={idx} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {comp}
                          </span>
                        ))}
                      </div>
                      {lead.competitive_intelligence.primary_competitor && (
                        <p className="mt-3 text-sm text-red-900">
                          <strong>Primär konkurrent:</strong> {lead.competitive_intelligence.primary_competitor}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Ingen competitive intelligence tillgänglig</p>
                  <p className="text-gray-400 text-sm mt-2">Kör website scraping för att få insights</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'website' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-primary mb-4 uppercase flex items-center gap-2">
                <Search className="w-5 h-5" />
                Website Scraping - Komplett Analys
              </h3>
              
              {lead.website_analysis ? (
                <>
                  {/* Scraping Info */}
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Scrapade webbplats</p>
                        <a href={lead.website_analysis.url} target="_blank" rel="noopener noreferrer" className="text-dhl-blue hover:underline font-semibold flex items-center gap-1">
                          {lead.website_analysis.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {new Date(lead.website_analysis.scraped_at).toLocaleString('sv-SE')}
                      </div>
                    </div>
                  </div>

                  {/* E-handel & Checkout */}
                  <section>
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-gray-700" />
                      E-handel & Checkout
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {lead.website_analysis.ecommerce_platform && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">E-handelsplattform</p>
                          <p className="text-xl font-bold text-black">{lead.website_analysis.ecommerce_platform}</p>
                        </div>
                      )}
                      
                      <div className={`border-l-4 p-4 rounded-lg ${lead.website_analysis.has_checkout ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-400'}`}>
                        <p className="text-sm text-gray-600 mb-1">Checkout</p>
                        <p className="text-xl font-bold flex items-center gap-2">
                          {lead.website_analysis.has_checkout ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-green-900">Ja</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-gray-600" />
                              <span className="text-gray-900">Nej</span>
                            </>
                          )}
                        </p>
                      </div>

                      {lead.website_analysis.checkout_providers.length > 0 && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Checkout-providers</p>
                          <p className="text-sm font-semibold text-blue-900">{lead.website_analysis.checkout_providers.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Transportörer (KRITISKT!) */}
                  <section>
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-red-600" />
                      Transportörer i Checkout
                    </h4>
                    
                    {/* DHL Status */}
                    <div className={`p-5 rounded-lg mb-4 ${lead.website_analysis.has_dhl ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {lead.website_analysis.has_dhl ? (
                            <>
                              <CheckCircle className="w-8 h-8 text-green-600" />
                              <div>
                                <p className="font-bold text-xl text-green-900">DHL är listad!</p>
                                {lead.website_analysis.dhl_position && (
                                  <p className="text-sm text-green-700">Position i checkout: #{lead.website_analysis.dhl_position}</p>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-8 h-8 text-red-600" />
                              <div>
                                <p className="font-bold text-xl text-red-900">DHL saknas!</p>
                                <p className="text-sm text-red-700">Opportunity för new business</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alla Transportörer */}
                    {lead.website_analysis.shipping_providers.length > 0 && (
                      <div className="space-y-3">
                        {lead.website_analysis.shipping_providers.map((provider, idx) => (
                          <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                            provider.type === 'dhl' ? 'bg-green-50 border-green-500' :
                            provider.type === 'competitor' ? 'bg-red-50 border-red-500' :
                            'bg-gray-50 border-gray-400'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Truck className="w-5 h-5" />
                                  <h5 className="font-bold text-lg">{provider.name}</h5>
                                  {provider.position_in_checkout && (
                                    <span className="bg-white px-2 py-1 rounded text-xs font-bold">
                                      Position #{provider.position_in_checkout}
                                    </span>
                                  )}
                                  {provider.logo_found && (
                                    <span className="bg-white px-2 py-1 rounded text-xs">
                                      🖼️ Logo
                                    </span>
                                  )}
                                </div>
                                
                                {provider.mentioned_on_pages.length > 0 && (
                                  <p className="text-xs text-gray-600">
                                    Nämnd på: {provider.mentioned_on_pages.slice(0, 3).join(', ')}
                                    {provider.mentioned_on_pages.length > 3 && ` +${provider.mentioned_on_pages.length - 3} fler`}
                                  </p>
                                )}
                              </div>
                              
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                provider.type === 'dhl' ? 'bg-green-100 text-green-800' :
                                provider.type === 'competitor' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {provider.type === 'dhl' ? 'DHL' : provider.type === 'competitor' ? 'KONKURRENT' : 'ANNAN'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Leveransalternativ */}
                  {lead.website_analysis.delivery_options.length > 0 && (
                    <section>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Leveransalternativ
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {lead.website_analysis.delivery_options.map((option, idx) => (
                          <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              {option.type === 'home_delivery' && <Home className="w-4 h-4" />}
                              {option.type === 'parcel_locker' && <Box className="w-4 h-4" />}
                              {option.type === 'service_point' && <Store className="w-4 h-4" />}
                              {option.type === 'mailbox' && <Mail className="w-4 h-4" />}
                              {option.type === 'pickup' && <Building2 className="w-4 h-4" />}
                              <p className="font-semibold text-sm">
                                {option.type === 'home_delivery' && 'Hemleverans'}
                                {option.type === 'parcel_locker' && 'Paketskåp'}
                                {option.type === 'service_point' && 'Ombud'}
                                {option.type === 'mailbox' && 'Brevlåda'}
                                {option.type === 'pickup' && 'Upphämtning'}
                              </p>
                            </div>
                            {option.provider && (
                              <p className="text-xs text-gray-600">Provider: {option.provider}</p>
                            )}
                            {option.cost && (
                              <p className="text-xs text-gray-600">Kostnad: {option.cost}</p>
                            )}
                            {option.delivery_time && (
                              <p className="text-xs text-gray-600">Tid: {option.delivery_time}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Fraktvillkor */}
                  <section>
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Fraktvillkor
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {lead.website_analysis.shipping_terms.free_shipping_threshold && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Fri frakt över</p>
                          <p className="text-2xl font-bold text-green-900">{lead.website_analysis.shipping_terms.free_shipping_threshold} kr</p>
                        </div>
                      )}
                      
                      {lead.website_analysis.shipping_terms.standard_cost && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Standard frakt</p>
                          <p className="text-2xl font-bold text-yellow-900">{lead.website_analysis.shipping_terms.standard_cost} kr</p>
                        </div>
                      )}
                      
                      <div className={`border-l-4 p-4 rounded-lg ${lead.website_analysis.shipping_terms.express_available ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-400'}`}>
                        <p className="text-sm text-gray-600 mb-1">Express</p>
                        <p className="text-lg font-bold">{lead.website_analysis.shipping_terms.express_available ? '✅ Ja' : '❌ Nej'}</p>
                      </div>
                      
                      <div className={`border-l-4 p-4 rounded-lg ${lead.website_analysis.shipping_terms.international_shipping ? 'bg-yellow-50 border-yellow-500' : 'bg-gray-50 border-gray-400'}`}>
                        <p className="text-sm text-gray-600 mb-1">International</p>
                        <p className="text-lg font-bold">{lead.website_analysis.shipping_terms.international_shipping ? '✅ Ja' : '❌ Nej'}</p>
                      </div>
                    </div>
                    
                    {lead.website_analysis.shipping_terms.return_policy && (
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold text-sm text-gray-700 mb-2">Returpolicy</p>
                        <p className="text-sm text-gray-900">{lead.website_analysis.shipping_terms.return_policy}</p>
                      </div>
                    )}
                  </section>

                  {/* Marknader */}
                  {lead.website_analysis.markets.length > 0 && (
                    <section>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Flag className="w-5 h-5 text-blue-600" />
                        Marknader ({lead.website_analysis.markets.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {lead.website_analysis.markets.map((market, idx) => (
                          <div key={idx} className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
                            <p className="font-bold text-lg">{market.country}</p>
                            <p className="text-xs text-gray-600">Språk: {market.language}</p>
                            <p className="text-xs text-gray-600">Valuta: {market.currency}</p>
                            {market.has_local_shipping && (
                              <p className="text-xs text-green-600 mt-1">✅ Lokal frakt</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Teknologier */}
                  {lead.website_analysis.technologies.length > 0 && (
                    <section>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Code className="w-5 h-5 text-gray-700" />
                        Teknologier ({lead.website_analysis.technologies.length})
                      </h4>
                      <div className="space-y-3">
                        {['ecommerce', 'payment', 'analytics', 'marketing', 'shipping', 'other'].map(category => {
                          const techs = lead.website_analysis!.technologies.filter(t => t.category === category);
                          if (techs.length === 0) return null;
                          
                          return (
                            <div key={category} className="bg-gray-50 p-4 rounded-lg">
                              <p className="font-semibold text-sm text-gray-700 mb-2 uppercase">
                                {category === 'ecommerce' && '🛒 E-handel'}
                                {category === 'payment' && '💳 Betalning'}
                                {category === 'analytics' && '📊 Analytics'}
                                {category === 'marketing' && '📢 Marketing'}
                                {category === 'shipping' && '🚚 Shipping'}
                                {category === 'other' && '🔧 Övrigt'}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {techs.map((tech, idx) => (
                                  <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm border border-gray-300">
                                    {tech.name}
                                    <span className="text-xs text-gray-500 ml-1">({tech.confidence}%)</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Nyckeltal från webbplats */}
                  {lead.website_analysis.financial_metrics && (
                    <section>
                      <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        Nyckeltal (från webbplats)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {lead.website_analysis.financial_metrics.liquidity && (
                          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Likviditet</p>
                            <p className="text-2xl font-bold text-green-900">{lead.website_analysis.financial_metrics.liquidity}</p>
                          </div>
                        )}
                        
                        {lead.website_analysis.financial_metrics.solidity && (
                          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Soliditet</p>
                            <p className="text-2xl font-bold text-blue-900">{lead.website_analysis.financial_metrics.solidity}%</p>
                          </div>
                        )}
                        
                        {lead.website_analysis.financial_metrics.profit_margin && (
                          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Vinstmarginal</p>
                            <p className="text-2xl font-bold text-black">{lead.website_analysis.financial_metrics.profit_margin}%</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Källa: {lead.website_analysis.financial_metrics.source}
                      </p>
                    </section>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Ingen website scraping-data tillgänglig</p>
                  <p className="text-gray-400 text-sm mt-2">Kör website scraping för att analysera företagets webbplats</p>
                  <button className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition font-semibold uppercase">
                    Starta Scraping
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-primary mb-4 uppercase flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Historik
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <Calendar className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <p className="font-semibold">Lead skapad</p>
                    <p className="text-sm text-gray-600">{formatDate(lead.created_at)}</p>
                    <p className="text-xs text-gray-500">Källa: {lead.source || 'AI'} • Skapad av: {lead.created_by || 'System'}</p>
                  </div>
                </div>
                
                {lead.analysis_date && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                    <BarChart3 className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <p className="font-semibold">Analys genomförd</p>
                      <p className="text-sm text-gray-600">{formatDate(lead.analysis_date)}</p>
                    </div>
                  </div>
                )}
                
                {lead.assigned_salesperson && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-500">
                    <User className="w-5 h-5 text-[#FFC400] mt-1" />
                    <div>
                      <p className="font-semibold">Tilldelad säljare</p>
                      <p className="text-sm text-gray-600">{lead.assigned_salesperson}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {lead.assigned_salesperson && (
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Tilldelad: <strong>{lead.assigned_salesperson}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
            >
              Stäng
            </button>
            <button className="bg-primary text-white px-6 py-2 rounded hover:bg-opacity-90 transition uppercase font-semibold">
              Redigera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
