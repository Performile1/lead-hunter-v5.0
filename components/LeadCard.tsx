



import React, { useState, useEffect } from 'react';
import { LeadData, Segment, DecisionMaker, FinancialRecord, SourceLink } from '../types';
import { TrendingUp, User, Linkedin, Mail, Target, MapPin, Hash, Database, ShieldCheck, Truck, Globe, ExternalLink, CheckCircle2, XCircle, BarChart3, Link2, Star, Warehouse, Undo2, Building, AlertOctagon, Phone, Search, Loader2, Code, Box, Store, Newspaper, Edit2, Save, X, Plus, Trash2, Package, ShoppingCart, RefreshCw, TrendingDown, Minus, AlertTriangle, Clock } from 'lucide-react';

interface LeadCardProps {
  data: LeadData;
  prio1Role?: string; // Passed from App to know what to search for
  onRunLinkedInSearch?: (role: string) => void;
  isSearchingLinkedIn?: boolean;
  isEnriching?: boolean; // New prop to show skeleton states
  onUpdateLead?: (lead: LeadData) => void; // New prop for saving edits
  onRefreshAnalysis?: (lead: LeadData) => void; // New prop to force re-analysis
  onReportError?: (lead: LeadData) => void; // New prop to report incorrect data
  onClose?: () => void; // New prop to close LeadCard
  onConvertToCustomer?: (lead: LeadData) => void; // New prop to convert lead to customer
  isSuperAdmin?: boolean; // New prop to determine if user is super admin
  tenantSearchTerm?: string; // Tenant-specific search term (e.g., 'DHL', 'PostNord')
}

const safeRender = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(item => safeRender(item)).join(", ");
  if (typeof value === 'object') {
    if (value.beskrivning) return value.beskrivning + (value.källor ? ` (${value.källor})` : '');
    return JSON.stringify(value);
  }
  return "";
};

// Helper to format financial strings (tkr -> MSEK -> mdSEK) with separators
const formatFinancial = (raw: string) => {
  if (!raw) return "";

  // Flexible Regex: Matches number at start, optionally tkr/kr, captures rest (source)
  // Handles: "1 400 000", "1 400 000 tkr", "100 (Estimat)"
  const match = raw.match(/^([\d\s.,]+)(?:tkr|kr)?\s*(.*)/i);
  
  if (match) {
    // Clean string: remove spaces, replace decimal comma with dot for parsing
    let numStr = match[1].replace(/\s/g, '').replace(/\u00A0/g, '').replace(',', '.');
    
    // Safety check for empty or just dots
    if (!numStr || numStr === '.') return raw;

    const valTkr = parseFloat(numStr);
    
    if (!isNaN(valTkr)) {
      // Logic: Input is TKR (Standard for this app)
      const valSEK = valTkr * 1000;
      let formatted = "";
      
      if (valSEK >= 1000000000) {
        // >= 1 Billion -> mdSEK
        const val = valSEK / 1000000000;
        formatted = val.toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + " mdSEK";
      } else if (valSEK >= 1000000) {
        // >= 1 Million -> MSEK
        const val = valSEK / 1000000;
        formatted = val.toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + " MSEK";
      } else {
        // < 1 Million -> tkr
        // Use toLocaleString to get thousand separators (e.g., "850 tkr" or "5 000 tkr")
        formatted = valTkr.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + " tkr";
      }
      
      // Append any extra text found after the number (e.g. source info)
      if (match[2] && match[2].trim().length > 0) {
         formatted += " " + match[2].trim();
      }
      
      return formatted;
    }
  }
  
  return raw;
};

// Helper to ensure LinkedIn links are absolute
const formatUrl = (url: string) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

// Helper to clean org number for URLs
const cleanOrgForUrl = (org: string | undefined) => {
  if (!org) return "";
  return org.replace(/[^0-9]/g, '');
};

const cleanOrgForRatsit = (org: string | undefined) => {
    if (!org) return "";
    let clean = org.replace(/[^0-9]/g, '');
    // Ratsit standard 10 digit, strip 16 prefix if 12 digit
    if (clean.length === 12 && clean.startsWith('16')) clean = clean.substring(2);
    // Strip trailing 01 if 12 digit
    if (clean.length === 12 && clean.endsWith('01')) clean = clean.substring(0, 10);
    return clean;
};

const SegmentBadge: React.FC<{ segment: Segment }> = ({ segment }) => {
  const colors = {
    [Segment.TS]: 'bg-green-100 text-green-800 border-green-200',
    [Segment.FS]: 'bg-black text-black border-yellow-300',
    [Segment.KAM]: 'bg-black text-white border-red-700',
    [Segment.DM]: 'bg-blue-50 text-blue-800 border-blue-200',
    [Segment.UNKNOWN]: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-none text-xs font-black border uppercase tracking-wider ${colors[segment] || colors[Segment.UNKNOWN]}`}>
      {segment}
    </span>
  );
};

// Skeleton component
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 rounded-sm ${className}`}></div>
);

// Helper to check source type
const getSourceType = (title: string, domain: string) => {
    const t = (title + domain).toLowerCase();
    if (t.includes('trustpilot') || t.includes('google') && t.includes('review') || t.includes('omdöme')) return 'review';
    if (t.includes('allabolag') || t.includes('ratsit') || t.includes('proff') || t.includes('merinfo') || t.includes('syna') || t.includes('bolagsverket') || t.includes('kronofogden')) return 'financial';
    if (t.includes('linkedin')) return 'social';
    if (t.includes('ehandel') || t.includes('breakit') || t.includes('di.se')) return 'news';
    return 'general';
};

const LeadCard: React.FC<LeadCardProps> = ({ data, prio1Role, onRunLinkedInSearch, isSearchingLinkedIn, isEnriching, onUpdateLead, onRefreshAnalysis, onReportError, onClose, onConvertToCustomer }) => {
  const [roleInput, setRoleInput] = useState(prio1Role || "Logistikchef");
  
  // EDIT MODE STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<LeadData>(data);

  // Sync editData when prop data changes, but not if user is actively editing
  useEffect(() => {
    if (!isEditing) {
      setEditData(data);
    }
  }, [data, isEditing]);

  const handleSave = () => {
    if (onUpdateLead) {
        onUpdateLead(editData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  // --- DYNAMIC FINANCIAL HISTORY LOGIC ---

  const recalculateFinancials = (history: FinancialRecord[]) => {
      // 1. Sort history descending by year
      const sorted = [...history].sort((a, b) => {
         const yearA = parseInt(a.year.replace(/\D/g, '')) || 0;
         const yearB = parseInt(b.year.replace(/\D/g, '')) || 0;
         return yearB - yearA;
      });

      // 2. Determine Latest & Previous
      const latest = sorted[0];
      const previous = sorted[1];
      
      let newRevenue = "";
      let newFreight = "";
      let newGrowth: number | undefined = undefined;
      
      // Update displayed Revenue & Freight based on Latest
      if (latest && latest.revenue > 0) {
          newRevenue = latest.revenue.toLocaleString('sv-SE') + " tkr";
          const freightVal = Math.round(latest.revenue * 0.05);
          newFreight = freightVal.toLocaleString('sv-SE') + " tkr";
      }

      // Calc Growth
      if (latest && previous && previous.revenue > 0) {
          const growth = ((latest.revenue - previous.revenue) / previous.revenue) * 100;
          newGrowth = parseFloat(growth.toFixed(1));
      }

      return {
          history: sorted,
          revenue: newRevenue || editData.revenue,
          freightBudget: newFreight || editData.freightBudget,
          revenueSource: 'Manuell input',
          financials: {
              ...editData.financials,
              history: sorted,
              yearCurrent: latest?.year || editData.financials?.yearCurrent,
              revenueCurrent: latest?.revenue || editData.financials?.revenueCurrent,
              yearPrevious: previous?.year || editData.financials?.yearPrevious,
              revenuePrevious: previous?.revenue || editData.financials?.revenuePrevious,
              growthPercent: newGrowth
          }
      };
  };

  const handleFinancialChange = (index: number, field: keyof FinancialRecord, value: string) => {
      const currentHistory = editData.financials?.history || [];
      const updatedHistory = [...currentHistory];
      
      // Initialize if empty but editing
      if (updatedHistory.length === 0) {
         return; 
      }
      
      const record = { ...updatedHistory[index] };
      
      if (field === 'revenue') {
          const cleanVal = value.replace(/tkr/gi, '').replace(/kr/gi, '').replace(/\s/g, '').replace(',', '.');
          const numVal = parseFloat(cleanVal);
          record.revenue = isNaN(numVal) ? 0 : numVal;
      } else {
          record.year = value;
      }
      
      updatedHistory[index] = record;
      
      // Recalculate everything
      const updates = recalculateFinancials(updatedHistory);
      setEditData({ ...editData, ...updates });
  };

  const addFinancialYear = () => {
      const currentHistory = editData.financials?.history || [];
      // Default new year to next logical year or current year
      const newYear = currentHistory.length > 0 
        ? (parseInt(currentHistory[0].year) - 1).toString() 
        : new Date().getFullYear().toString();
      
      const newRecord: FinancialRecord = { year: newYear, revenue: 0 };
      const newHistory = [...currentHistory, newRecord];
      
      const updates = recalculateFinancials(newHistory);
      setEditData({ ...editData, ...updates });
  };

  const removeFinancialYear = (index: number) => {
      const currentHistory = editData.financials?.history || [];
      const newHistory = currentHistory.filter((_, i) => i !== index);
      const updates = recalculateFinancials(newHistory);
      setEditData({ ...editData, ...updates });
  };

  // Ensure history exists if editing (populate from legacy fields if needed)
  useEffect(() => {
     if (isEditing && (!editData.financials?.history || editData.financials.history.length === 0)) {
         const initHistory: FinancialRecord[] = [];
         if (editData.financials?.revenueCurrent) {
             initHistory.push({ 
                 year: editData.financials.yearCurrent || "Senaste", 
                 revenue: editData.financials.revenueCurrent 
             });
         }
         if (editData.financials?.revenuePrevious) {
             initHistory.push({ 
                 year: editData.financials.yearPrevious || "Föregående", 
                 revenue: editData.financials.revenuePrevious 
             });
         }
         
         if (initHistory.length > 0) {
             setEditData(prev => ({
                 ...prev,
                 financials: {
                     ...prev.financials,
                     history: initHistory
                 }
             }));
         }
     }
  }, [isEditing]);

  const updateDM = (index: number, field: keyof DecisionMaker, value: string) => {
    const updatedDMs = [...editData.decisionMakers];
    updatedDMs[index] = { ...updatedDMs[index], [field]: value };
    setEditData({ ...editData, decisionMakers: updatedDMs });
  };

  const addDM = () => {
    setEditData({
      ...editData,
      decisionMakers: [...editData.decisionMakers, { name: "", title: "", email: "", linkedin: "", directPhone: "" }]
    });
  };

  const removeDM = (index: number) => {
    const updatedDMs = [...editData.decisionMakers];
    updatedDMs.splice(index, 1);
    setEditData({ ...editData, decisionMakers: updatedDMs });
  };

  // Determine if tenant's provider is used (for tenant users)
  const usesTenantProvider = safeRender(data.usesDhl).toLowerCase().includes('ja');
  
  // Parse checkout position to extract all providers (for super admin)
  const parseCheckoutProviders = (checkoutText: string) => {
    if (!checkoutText) return [];
    const providers: Array<{name: string, position: number, found: boolean}> = [];
    
    // Match patterns like "1. DHL", "2. PostNord", "Nej (Konkurrent: PostNord)"
    const matches = checkoutText.match(/\d+\.\s*([^,\n]+)|Konkurrent:\s*([^,\)\n]+)/gi);
    if (matches) {
      matches.forEach((match, idx) => {
        const providerMatch = match.match(/\d+\.\s*(.+)|Konkurrent:\s*(.+)/i);
        if (providerMatch) {
          const name = (providerMatch[1] || providerMatch[2]).trim();
          providers.push({
            name,
            position: idx + 1,
            found: true
          });
        }
      });
    }
    return providers;
  };

  // Rating color logic
  const getRatingColor = (score: string) => {
    const num = parseFloat(score.replace(',', '.').split('/')[0]);
    if (isNaN(num)) return 'text-slate-500';
    if (num >= 4) return 'text-green-600';
    if (num >= 3) return 'text-yellow-600';
    return 'text-black';
  };

  // Updated Risk Logic: Only trigger RED for actual legal issues
  const isHighRisk = data.legalStatus && (
      data.legalStatus.toLowerCase().includes('konkurs') || 
      data.legalStatus.toLowerCase().includes('likvidation') ||
      data.legalStatus.toLowerCase().includes('rekonstruktion') ||
      data.legalStatus.includes('VARNING') // For Kronofogden
  );

  const isCreditWarning = data.creditRatingLabel && (
      data.creditRatingLabel.toLowerCase().includes('varning') ||
      data.creditRatingLabel.toLowerCase().includes('avråder') ||
      data.creditRatingLabel.toLowerCase().includes('konkurs') ||
      data.creditRatingLabel.toLowerCase().includes('svag')
  );

  const isManual = data.source === 'manual';
  const hasMissingOrgNr = !data.orgNumber || data.orgNumber.length === 0;

  // SOURCE FILTERING LOGIC
  // 1. Deduplicate Trustpilot (Keep only main company link, remove review sub-links)
  // 2. Filter duplicate domains
  const getFilteredSources = (links: SourceLink[] = []): SourceLink[] => {
      const unique = new Map<string, SourceLink>();
      const trustpilotLinks: SourceLink[] = [];

      links.forEach(link => {
          const domain = (link.domain || link.url).toLowerCase();
          // Filter internal Google links again just in case
          if (domain.includes('google') || domain.includes('vertex')) return;

          // Handle Trustpilot separately
          if (domain.includes('trustpilot')) {
              trustpilotLinks.push(link);
              return;
          }
          if (!unique.has(domain)) {
              unique.set(domain, link);
          }
      });

      // Process Trustpilot: Keep one. Prefer the one with "review" in path (usually main profile) but shortest path is usually category.
      // Actually, main profile is trustpilot.com/review/domain.com.
      if (trustpilotLinks.length > 0) {
          unique.set('trustpilot', trustpilotLinks[0]);
      }

      return Array.from(unique.values());
  };

  const displayedSources = getFilteredSources(data.sourceLinks);

  // Helper to find specific source match for credit verification text
  const getCreditVerificationSource = () => {
     const financialDomains = ['allabolag', 'ratsit', 'syna', 'uc.se', 'proff', 'bolagsverket', 'kronofogden'];
     const match = displayedSources.find(l => {
         const d = (l.domain || l.url).toLowerCase();
         return financialDomains.some(fd => d.includes(fd));
     });
     return match ? (match.title || match.domain) : null;
  };

  // --- SMART URL SELECTION FOR ALLABOLAG ---
  // If AI found a specific deep link to Allabolag (with internal IDs), prioritize that.
  // Otherwise, construct the standard org-nr link.
  const getAllabolagUrl = () => {
      // 1. Check for specific deep link found by AI
      const deepLink = data.sourceLinks?.find(l => 
          l.url.includes('allabolag.se/foretag/') || 
          (l.url.includes('allabolag.se') && l.url.includes(cleanOrgForUrl(data.orgNumber)))
      );
      if (deepLink) return deepLink.url;

      // 2. Fallback to constructed URL
      const cleanOrg = cleanOrgForUrl(data.orgNumber);
      if (cleanOrg) return `https://www.allabolag.se/${cleanOrg}`;
      
      // 3. Last resort: Search query
      return `https://www.allabolag.se/bransch-s%C3%B6k?q=${encodeURIComponent(data.companyName)}`;
  };

  const creditSource = getCreditVerificationSource();

  // Progressive Loading Checks
  const isLoadingLogistics = isEnriching && !data.logisticsProfile;
  const isLoadingPeople = isEnriching && data.decisionMakers.length === 0;

  return (
    <div className="bg-white rounded-none shadow-md border-t-4 border-black overflow-hidden mb-6 transition-all hover:shadow-xl w-full relative">
      
      {/* Header */}
      <div className="bg-[#FFC400] border-b-2 border-black p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {isEditing ? (
              <input
                type="text"
                value={editData.companyName}
                onChange={(e) => setEditData({...editData, companyName: e.target.value})}
                className="text-xl font-black italic text-black uppercase w-full max-w-md border-b border-slate-300 focus:border-black focus:ring-0 outline-none bg-transparent"
                placeholder="Företagsnamn"
              />
            ) : (
              <h3 className="text-xl font-black italic text-black uppercase truncate">{safeRender(data.companyName)}</h3>
            )}
            
            <SegmentBadge segment={data.segment as Segment} />
            
            {/* Legal Status Warning (Only real risks) */}
            {isHighRisk && (
               <span className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 text-xs font-bold uppercase tracking-wider animate-pulse shadow-sm">
                 <AlertOctagon className="w-3 h-3" />
                 {data.legalStatus}
               </span>
            )}

            {/* Manual Source Badge (Blue) */}
            {isManual && (
                <span className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200 border px-2 py-0.5 text-xs font-bold uppercase tracking-wider shadow-sm">
                    <Edit2 className="w-3 h-3" />
                    Manuellt inlagd
                </span>
            )}

            {/* F-Tax Status Badge */}
            {data.hasFtax && (
              <span className={`px-1.5 py-0.5 text-[10px] font-bold border rounded-sm flex items-center gap-1 uppercase tracking-wider ${data.hasFtax.toLowerCase().includes('ja') ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                F-skatt: {data.hasFtax}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm text-slate-600 items-center">
            {/* Org Nr */}
            <div className="flex items-center gap-1">
                <span className="flex items-center gap-1 min-w-0">
                  <Hash className="w-3.5 h-3.5 text-black flex-shrink-0" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.orgNumber}
                      onChange={(e) => setEditData({...editData, orgNumber: e.target.value})}
                      className="font-mono font-semibold text-xs border-slate-300 rounded-sm p-1 w-24 focus:border-black focus:ring-[#2563EB]"
                      placeholder="Org.nr"
                    />
                  ) : (
                    <span className="truncate font-mono font-semibold">{safeRender(data.orgNumber) || 'N/A'}</span>
                  )}
                </span>
                
                {/* Parent Company (READ ONLY IN EDIT MODE TO SIMPLIFY) */}
                {data.parentCompany && data.parentCompany.toLowerCase() !== 'nej' && (
                    <span className="text-[10px] text-slate-400 italic ml-1">
                        (Dotterbolag till {data.parentCompany})
                    </span>
                )}
            </div>
            
            {/* Website URL */}
            {isEditing ? (
                <div className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-black flex-shrink-0" />
                  <input
                    type="text"
                    value={editData.websiteUrl}
                    onChange={(e) => setEditData({...editData, websiteUrl: e.target.value})}
                    className="text-xs border-slate-300 rounded-sm p-1 w-40 focus:border-black focus:ring-[#2563EB]"
                    placeholder="Webbplats"
                  />
                </div>
            ) : (
              data.websiteUrl && (
                <a href={formatUrl(data.websiteUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-black hover:underline min-w-0 max-w-[250px]">
                  <Globe className="w-3.5 h-3.5 text-black flex-shrink-0" />
                  <span className="truncate font-semibold">{data.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                </a>
              )
            )}

            {/* Phone */}
            <span className="flex items-center gap-1 min-w-0">
              <Phone className="w-3.5 h-3.5 text-black flex-shrink-0" />
              {isEditing ? (
                  <input
                    type="text"
                    value={editData.phoneNumber}
                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                    className="text-xs font-bold border-slate-300 rounded-sm p-1 w-28 focus:border-black focus:ring-[#2563EB]"
                    placeholder="Telefon"
                  />
              ) : (
                data.phoneNumber ? (
                  <span className="truncate font-bold">{data.phoneNumber}</span>
                ) : (
                  <span className="truncate italic text-slate-400 text-xs">Saknas</span>
                )
              )}
            </span>
          </div>
        </div>
        
        {/* Credit Rating & Actions */}
        <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
          <div className="flex gap-2 items-center">
             {/* Analysis Timestamp */}
             {data.analysisDate && (
                 <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-sm border border-slate-200 shadow-sm" title={`Analys utförd: ${new Date(data.analysisDate).toLocaleString()}`}>
                    <Clock className="w-3 h-3 text-black" />
                    Analys: {new Date(data.analysisDate).toLocaleDateString('sv-SE')}
                 </div>
             )}

             {onUpdateLead && (
                <div className="flex gap-2">
                    {!isEditing && onRefreshAnalysis && (
                    <button 
                        onClick={() => onRefreshAnalysis(data)}
                        className={`flex items-center gap-1 px-3 py-1.5 border rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm ${
                           hasMissingOrgNr 
                           ? 'bg-red-50 text-black border-black hover:bg-black hover:text-white animate-pulse' 
                           : 'bg-white border-slate-300 text-slate-700 hover:bg-black hover:text-white hover:border-black'
                        }`}
                        title={hasMissingOrgNr ? "Kritisk data saknas. Klicka för att försöka hämta igen." : "Starta en helt ny sökning/analys på detta företag"}
                    >
                        {hasMissingOrgNr ? <AlertTriangle className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                        {hasMissingOrgNr ? "Försök Igen (Saknar Org.nr)" : "Ny Analys"}
                    </button>
                    )}

                {isEditing ? (
                    <>
                    <button 
                        onClick={handleCancel}
                        className="p-1.5 text-slate-500 hover:text-red-600 bg-white border border-slate-300 hover:bg-red-50 rounded-sm transition-colors"
                        title="Avbryt"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                        title="Spara ändringar"
                    >
                        <Save className="w-3 h-3" />
                        Spara
                    </button>
                    </>
                ) : (
                    <>
                    {/* BACK TO LIST BUTTON */}
                    <button
                        onClick={() => onClose ? onClose() : window.history.back()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                        title="Tillbaka till leadlistan"
                    >
                        <Undo2 className="w-3 h-3" />
                        Tillbaka
                    </button>
                    {/* REPORT ERROR BUTTON */}
                    {onReportError && (
                        <button
                            onClick={() => onReportError(data)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-orange-600 hover:bg-orange-50 hover:border-orange-500 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                            title="Rapportera fel data eller ta bort"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            Rapportera
                        </button>
                    )}
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-600 hover:text-black hover:border-black rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                        title="Redigera grunduppgifter"
                    >
                        <Edit2 className="w-3 h-3" />
                        Redigera
                    </button>
                    {/* CONVERT TO CUSTOMER BUTTON */}
                    {onConvertToCustomer && (
                        <button
                            onClick={() => onConvertToCustomer(data)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white border border-green-700 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                            title="Konvertera till kund och lägg till i kundlistan"
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            Konvertera till Kund
                        </button>
                    )}
                    </>
                )}
                </div>
             )}
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="text-[10px] text-black uppercase tracking-wider font-bold">Kreditvärdighet</div>
            {/* UPDATED: Dynamic Color for Credit Badge */}
            <div className={`font-mono font-bold px-3 py-1 rounded-sm inline-block shadow-sm text-xs ${
                isCreditWarning 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-black text-black'
            }`}>
                {safeRender(data.creditRatingLabel) || '-'}
            </div>
            
            {/* Source Verification Subtext */}
            {creditSource ? (
                <div className="text-[9px] text-slate-500 italic">
                   Verifierad via: <span className="font-semibold">{creditSource}</span>
                </div>
            ) : (
                <div className="text-[9px] text-slate-400 italic">
                   Källa saknas
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Financials & Logistics & Ratings */}
        <div className="space-y-4 min-w-0">
          <h4 className="text-sm font-bold text-black border-b-2 border-black pb-2 flex items-center gap-2 uppercase">
            <TrendingUp className="w-4 h-4 text-black" />
            Ekonomi & Logistik
          </h4>
          
          <div className="bg-slate-50 p-3 border border-slate-100 space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Omsättning & Historik</span>
                {isEditing ? (
                  <div className="space-y-2">
                      {/* DYNAMIC LIST FOR EDITING */}
                      {(editData.financials?.history || []).map((record, index) => (
                          <div key={index} className="flex gap-1 items-center animate-fadeIn">
                             <input 
                                type="text" 
                                value={record.year}
                                onChange={(e) => handleFinancialChange(index, 'year', e.target.value)}
                                className="w-16 text-xs font-bold border-slate-300 rounded-sm p-1 focus:border-black focus:ring-[#2563EB]"
                                placeholder="År"
                             />
                             <input 
                                type="text" 
                                value={record.revenue}
                                onChange={(e) => handleFinancialChange(index, 'revenue', e.target.value)}
                                className="flex-1 text-xs font-bold border-slate-300 rounded-sm p-1 focus:border-black focus:ring-[#2563EB]"
                                placeholder="Omsättning (tkr)"
                             />
                             <span className="text-[10px] text-slate-400">tkr</span>
                             <button onClick={() => removeFinancialYear(index)} className="text-slate-400 hover:text-red-600 p-1">
                                <X className="w-3 h-3" />
                             </button>
                          </div>
                      ))}
                      <button 
                        onClick={addFinancialYear}
                        className="w-full py-1 text-[10px] border border-dashed border-slate-300 text-slate-500 hover:text-black hover:border-black rounded-sm font-bold uppercase"
                      >
                         + Lägg till År
                      </button>
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-black text-xs break-words block">{formatFinancial(safeRender(data.revenue))}</span>
                    {data.revenueSource && (
                      <span className="text-[9px] text-slate-400 block italic mb-1">Källa: {data.revenueSource}</span>
                    )}
                    {/* Verification Links */}
                    <div className="flex gap-1 mt-1">
                        <a 
                            href={getAllabolagUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-black hover:text-white hover:border-black transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Allabolag
                        </a>
                        <a 
                            href={cleanOrgForRatsit(data.orgNumber) ? `https://www.ratsit.se/${cleanOrgForRatsit(data.orgNumber)}` : `https://www.ratsit.se/sok/foretag?q=${encodeURIComponent(data.companyName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 hover:bg-black hover:text-white hover:border-black transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Ratsit
                        </a>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-2">
                <span className="text-xs text-slate-500 block mb-1">Est. Frakt (5%)</span>
                {/* Freight Budget is calculated, so kept read-only even in edit mode, unless we want manual override. Keeping read-only to simplify as requested. */}
                <span className="font-bold text-black text-xs break-words">{formatFinancial(safeRender(data.freightBudget))}</span>
              </div>
            </div>

            {/* Financial Trend Section (Previous vs Current) */}
            {(!isEditing && data.financials?.yearPrevious) && (
               <div className="bg-white border border-slate-200 p-2 rounded-sm mt-2">
                 <span className="text-[10px] text-slate-500 font-bold uppercase mb-1 block flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> Utveckling (Bokslut)
                 </span>
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 w-10">{data.financials?.yearCurrent || "Nu"}:</span>
                          <span className="text-xs font-bold">{data.financials?.revenueCurrent ? formatFinancial(data.financials.revenueCurrent + " tkr") : "-"}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 w-10">{data.financials?.yearPrevious || "Föreg"}:</span>
                          <span className="text-[10px] text-slate-500">{data.financials?.revenuePrevious ? formatFinancial(data.financials.revenuePrevious + " tkr") : "-"}</span>
                       </div>
                    </div>

                    {data.financials?.growthPercent !== undefined && (
                      <div className={`px-2 py-1 rounded-sm text-xs font-bold flex items-center gap-1 border ${
                        data.financials.growthPercent > 0 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : data.financials.growthPercent < 0 
                             ? 'bg-red-50 text-red-700 border-red-200' 
                             : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                         {data.financials.growthPercent > 0 ? <TrendingUp className="w-3 h-3" /> : data.financials.growthPercent < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                         {data.financials.growthPercent > 0 ? '+' : ''}{data.financials.growthPercent}%
                      </div>
                    )}
                 </div>
               </div>
            )}
            
            {/* Liquidity */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> Kassalikviditet
                </span>
                <span className="font-bold text-black text-xs">{safeRender(data.liquidity) || "-"}</span>
            </div>

            {/* Ecommerce Platform (Tech Stack) */}
            {isLoadingLogistics ? (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ) : (
                <div className="border-t border-slate-200 pt-2">
                    <span className="text-xs text-slate-500 block flex items-center gap-1 mb-1">
                    <Code className="w-3 h-3" /> Tech Stack & Betalning
                    </span>
                    <span className="font-bold text-black text-xs">{safeRender(data.ecommercePlatform) || "-"}</span>
                </div>
            )}
            
            {/* Multi-Brand Information */}
            <div className="border-t border-slate-200 pt-2">
                <span className="text-xs text-slate-500 block flex items-center gap-1 mb-1">
                <Store className="w-3 h-3" /> Driver även butiker:
                </span>
                {data.multiBrands && data.multiBrands.toLowerCase() !== 'nej' ? (
                    <p className="font-bold text-black text-[10px] mt-0.5 leading-tight">
                        {safeRender(data.multiBrands)}
                    </p>
                ) : (
                    <span className="text-[10px] text-slate-400 italic">Nej</span>
                )}
            </div>

            {/* Credit Description */}
            <div className="border-t border-slate-200 pt-2">
                <span className="text-xs text-slate-500 block flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3 h-3" /> Kreditbedömning
                </span>
                {data.creditRatingDescription && (
                    <p className="text-[10px] text-slate-700 italic leading-snug mt-0.5">
                    {safeRender(data.creditRatingDescription)}
                    </p>
                )}
            </div>

          </div>

          {/* Logistics Analysis Block */}
          <div className="bg-white border border-slate-200 p-3 shadow-sm min-h-[140px]">
            {isLoadingLogistics ? (
                 <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="w-4 h-4 rounded-full" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-12 w-full" />
                 </div>
            ) : (
                <>
                <div className="flex flex-col gap-2 mb-2">
                <span className="text-xs font-bold flex items-center gap-1 text-slate-700">
                    <Truck className="w-3 h-3 text-black" />
                    Transportörer
                </span>
                
                {data.carriers && data.carriers.length > 0 && (
                    <div className="text-[11px] text-slate-700 mb-1">
                        <span className="font-bold">Hittade:</span> {safeRender(data.carriers)}
                    </div>
                )}

                {/* Show tenant-specific provider status for tenant users */}
                {!isSuperAdmin && data.usesDhl && (
                    <div className={`text-[10px] font-bold px-2 py-1.5 rounded flex items-start gap-2 border ${usesTenantProvider ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-black border-red-100'}`}>
                    {usesTenantProvider ? <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0"/> : <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0"/>}
                    <span className="leading-tight">{tenantSearchTerm || 'DHL'}: {data.usesDhl}</span>
                    </div>
                )}
                
                {/* Show all checkout providers for super admin */}
                {isSuperAdmin && data.checkoutPosition && (
                    <div className="space-y-1">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Checkout Providers:</span>
                        {parseCheckoutProviders(data.checkoutPosition).map((provider, idx) => (
                            <div key={idx} className="text-[10px] font-bold px-2 py-1.5 rounded flex items-start gap-2 border bg-blue-50 text-blue-800 border-blue-100">
                                <span className="leading-tight">{provider.position}. {provider.name}</span>
                            </div>
                        ))}
                        {parseCheckoutProviders(data.checkoutPosition).length === 0 && (
                            <div className="text-[10px] text-slate-500 italic">Ingen checkout-data</div>
                        )}
                    </div>
                )}
                </div>

                <div className="text-xs text-slate-600">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Marknader & Profil</span>
                    <div className="flex flex-wrap gap-1 mb-2">
                        {safeRender(data.logisticsProfile).split(',').map((tag, i) => (
                        <span key={i} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">{tag.trim()}</span>
                        ))}
                    </div>
                    <div className="text-[11px] leading-relaxed">
                        <span className="font-bold text-slate-800">Export/Import:</span> {safeRender(data.markets) || "Ingen data"}
                    </div>
                </div>

                {/* Delivery Services List */}
                <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                        <Package className="w-3 h-3" /> Leveranstjänster
                    </span>
                    {data.deliveryServices && data.deliveryServices.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {data.deliveryServices.map((service, idx) => (
                                <span key={idx} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] border border-blue-100 font-semibold">
                                    {service}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Checkout Position */}
                <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" /> Checkout Ranking
                    </span>
                    {data.checkoutPosition && (
                        <div className="text-[10px] font-mono bg-slate-50 p-1 border border-slate-200 rounded text-slate-700 leading-tight">
                            {data.checkoutPosition}
                        </div>
                    )}
                </div>
                </>
            )}
          </div>
          
           {/* Rating Block */}
           {!isLoadingPeople && (
              <div className="bg-white border border-slate-200 p-3 shadow-sm flex flex-col gap-2">
                 {data.rating ? (
                    <div className="flex items-start gap-3">
                        <div className="bg-slate-50 p-2 rounded-full border border-slate-100">
                            <Star className={`w-5 h-5 ${getRatingColor(data.rating.score)}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                            <span className={`text-lg font-black ${getRatingColor(data.rating.score)}`}>{data.rating.score}</span>
                            <span className="text-xs text-slate-500 font-bold">/ 5</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                            Baserat på {data.rating.count} omdömen via {data.rating.source}
                            </div>
                            {data.rating.sentiment && (
                            <div className="mt-1 text-[10px] italic text-slate-600 bg-slate-50 p-1 rounded border border-slate-100 leading-tight break-words whitespace-pre-wrap">
                                "{data.rating.sentiment}"
                            </div>
                            )}
                        </div>
                    </div>
                 ) : (
                    <div className="text-center text-slate-400 py-1">
                        <span className="text-xs italic block mb-2">Inga omdömen hittades automatiskt.</span>
                        <a 
                            href={`https://se.trustpilot.com/search?query=${encodeURIComponent(data.companyName)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 text-slate-600 hover:bg-black hover:text-white hover:border-black px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-colors"
                        >
                            <Search className="w-3 h-3" />
                            Sök på Trustpilot
                        </a>
                    </div>
                 )}
              </div>
           )}
        </div>

        {/* Column 2: AI Insights & Sources (MOVED TO MIDDLE) */}
        <div className="space-y-4 min-w-0">
          <h4 className="text-sm font-bold text-black border-b-2 border-black pb-2 flex items-center gap-2 uppercase">
            <Target className="w-4 h-4 text-black" />
            AI Säljanalys
          </h4>
          
          <div className="space-y-3">
             {/* Addresses Grid (Redesigned) */}
             <div className="bg-white border border-slate-200 text-xs shadow-sm">
                <div className="bg-slate-50 border-b border-slate-100 p-2 font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-black" /> Logistiknätverk
                </div>
                <div className="grid grid-cols-2 gap-px bg-slate-100">
                    <div className="bg-white p-2 flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Building className="w-3 h-3" /> Säte
                        </span>
                        {isEditing ? (
                            <textarea
                                value={editData.address}
                                onChange={(e) => setEditData({...editData,address: e.target.value})}
                                className="text-[10px] border-slate-300 rounded-sm p-1 focus:border-black focus:ring-[#2563EB] resize-none h-10 font-mono"
                            />
                        ) : (
                            <span className="font-mono text-slate-700 break-words leading-tight">{safeRender(data.address) || "-"}</span>
                        )}
                    </div>
                    <div className="bg-white p-2 flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Besök
                        </span>
                        {isEditing ? (
                            <textarea
                                value={editData.visitingAddress}
                                onChange={(e) => setEditData({...editData, visitingAddress: e.target.value})}
                                className="text-[10px] border-slate-300 rounded-sm p-1 focus:border-black focus:ring-[#2563EB] resize-none h-10 font-mono"
                            />
                        ) : (
                            <span className="font-mono text-slate-700 break-words leading-tight">{safeRender(data.visitingAddress) || "-"}</span>
                        )}
                    </div>
                    <div className="bg-white p-2 flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Warehouse className="w-3 h-3" /> Lager
                        </span>
                        {isEditing ? (
                            <textarea
                                value={editData.warehouseAddress}
                                onChange={(e) => setEditData({...editData, warehouseAddress: e.target.value})}
                                className="text-[10px] border-slate-300 rounded-sm p-1 focus:border-black focus:ring-[#2563EB] resize-none h-10 font-mono"
                            />
                        ) : (
                            <span className="font-mono text-slate-700 break-words leading-tight">{safeRender(data.warehouseAddress) || "-"}</span>
                        )}
                    </div>
                    <div className="bg-white p-2 flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Undo2 className="w-3 h-3" /> Retur
                        </span>
                        {isEditing ? (
                            <textarea
                                value={editData.returnAddress}
                                onChange={(e) => setEditData({...editData, returnAddress: e.target.value})}
                                className="text-[10px] border-slate-300 rounded-sm p-1 focus:border-black focus:ring-[#2563EB] resize-none h-10 font-mono"
                            />
                        ) : (
                            <span className="font-mono text-slate-700 break-words leading-tight">{safeRender(data.returnAddress) || "-"}</span>
                        )}
                    </div>
                </div>
            </div>

             {/* Trend & Risk */}
             {isLoadingPeople ? (
                 <Skeleton className="h-24 w-full" />
             ) : (
                <div className="bg-slate-50 p-3 border border-slate-200 shadow-sm">
                    <div className="flex items-start gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-black mt-0.5" />
                        <span className="text-xs font-bold text-slate-700 uppercase">Marknadsposition & Risk</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic pl-6">
                        {safeRender(data.trendRisk) || "Ingen specifik trenddata hittades."}
                    </p>

                    {/* Kronofogden Specific Warning */}
                    {data.kronofogdenCheck && (
                        <div className="mt-2 pl-6">
                            <div className="bg-red-100 border border-red-200 text-red-800 p-2 rounded-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" />
                                <span className="text-xs font-bold">{data.kronofogdenCheck}</span>
                            </div>
                        </div>
                    )}
                </div>
             )}

            {/* Latest News */}
            {!isLoadingPeople && (
                <div className="bg-white p-3 border border-slate-200 shadow-sm border-l-4 border-l-[#2563EB]">
                    <div className="flex items-start gap-2 mb-1">
                        <Newspaper className="w-4 h-4 text-black mt-0.5" />
                        <span className="text-xs font-bold text-slate-700 uppercase">Senaste Nytt</span>
                    </div>
                    {data.latestNews && (
                        <>
                            <p className="text-xs text-slate-600 leading-relaxed pl-6">
                                {safeRender(data.latestNews)}
                            </p>
                            {data.latestNewsUrl && (
                                <div className="pl-6 mt-1">
                                    <a 
                                        href={formatUrl(data.latestNewsUrl)} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[10px] text-black hover:underline flex items-center gap-1 font-bold uppercase tracking-wide"
                                    >
                                        Läs mer <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Icebreaker */}
            {!isLoadingPeople && (
                <div className="bg-black/10 border border-black p-3 rounded-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Förslag på inledning (Icebreaker)</span>
                <p className="text-xs text-slate-800 italic leading-relaxed">
                    "{safeRender(data.icebreaker)}"
                </p>
                </div>
            )}
            
            {/* SOURCES (Categorized Chips) */}
            <div className="pt-2 border-t border-slate-200">
               <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2">
                 <Link2 className="w-3 h-3" /> Verifierade Källor
               </span>
               <div className="flex flex-wrap gap-2">
                  {displayedSources && displayedSources.length > 0 ? (
                      displayedSources.map((link, i) => {
                          const sourceType = getSourceType(link.title || "", link.domain || link.url || "");
                          
                          let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
                          let typeLabel = '';

                          if (sourceType === 'financial') {
                              // UPDATED: If High Risk OR Credit Warning, mark financial sources RED specifically
                              const d = (link.domain || link.url || "").toLowerCase();
                              // Specifically highlight Allabolag/Ratsit/Kronofogden/Syna if risk is present
                              const isCoreFinancial = d.includes('allabolag') || d.includes('ratsit') || d.includes('kronofogden') || d.includes('syna');

                              if ((isCreditWarning || isHighRisk) && isCoreFinancial) {
                                  badgeColor = 'bg-red-100 text-red-800 border-red-200 animate-pulse';
                              } else {
                                  badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                              }
                              typeLabel = 'Ekonomi';
                          } else if (sourceType === 'review') {
                              badgeColor = 'bg-green-50 text-green-700 border-green-100';
                              typeLabel = 'Omdöme';
                          } else if (sourceType === 'news') {
                              badgeColor = 'bg-purple-50 text-purple-700 border-purple-100';
                              typeLabel = 'Nyheter';
                          } else if (sourceType === 'social') {
                              badgeColor = 'bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/20';
                              typeLabel = 'Profil';
                          }

                          return (
                            <a 
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`px-2 py-1 rounded-sm text-[10px] font-bold border transition-colors flex items-center gap-1 max-w-[150px] truncate shadow-sm hover:underline ${badgeColor}`}
                                title={link.url}
                            >
                                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>{link.title || link.domain || "Källa"}</span>
                                {typeLabel && <span className="opacity-50 text-[8px] uppercase ml-1 border-l pl-1 border-current">{typeLabel}</span>}
                            </a>
                          );
                      })
                  ) : (
                      <span className="text-[10px] text-slate-300 italic">Inga verifierade källor.</span>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Column 3: Decision Makers (MOVED TO RIGHT) */}
        <div className="space-y-4 min-w-0">
          <h4 className="text-sm font-bold text-black border-b-2 border-black pb-2 flex items-center gap-2 uppercase">
            <User className="w-4 h-4 text-black" />
            Beslutsfattare
          </h4>

          {isLoadingPeople ? (
             <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-full mt-2" />
                 </div>
               ))}
             </div>
          ) : (
             <div className="space-y-3">
            {editData.decisionMakers.map((dm, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-3 shadow-sm hover:border-black transition-colors group relative">
                {isEditing && (
                    <button 
                        onClick={() => removeDM(idx)}
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
                
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 mb-1 min-w-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-black text-white text-xs font-bold">
                      {dm.name && dm.name !== "Okänd" ? dm.name.charAt(0) : "U"}
                    </div>
                    <div className="min-w-0">
                        {isEditing ? (
                            <input 
                            type="text" 
                            value={dm.name}
                            onChange={(e) => updateDM(idx, 'name', e.target.value)}
                            className="w-full text-sm font-bold border-slate-300 rounded-sm p-0.5 focus:border-black focus:ring-[#2563EB] mb-1"
                            placeholder="Namn"
                            />
                        ) : (
                            <div className="font-bold text-sm text-slate-800 truncate" title={dm.name}>{dm.name}</div>
                        )}
                        
                        {isEditing ? (
                            <input 
                            type="text" 
                            value={dm.title}
                            onChange={(e) => updateDM(idx, 'title', e.target.value)}
                            className="w-full text-xs text-slate-500 border-slate-300 rounded-sm p-0.5 focus:border-black focus:ring-[#2563EB]"
                            placeholder="Titel"
                            />
                        ) : (
                            <div className="text-xs text-slate-500 uppercase tracking-wide truncate" title={dm.title}>{dm.title}</div>
                        )}
                    </div>
                  </div>
                  
                  {!isEditing && dm.linkedin && (
                    <a 
                      href={formatUrl(dm.linkedin)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#0077b5] hover:bg-[#0077b5] hover:text-white p-1 rounded transition-colors"
                      title="Gå till LinkedIn profil"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-100">
                  {/* EMAIL */}
                  <div className="flex items-center gap-2 text-xs min-w-0">
                    <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    {isEditing ? (
                         <input 
                            type="text" 
                            value={dm.email}
                            onChange={(e) => updateDM(idx, 'email', e.target.value)}
                            className="flex-1 text-xs border-slate-300 rounded-sm p-0.5 focus:border-black focus:ring-[#2563EB]"
                            placeholder="Email"
                        />
                    ) : (
                        <span className="truncate text-slate-600 font-mono select-all">
                        {dm.email || (data.emailStructure ? <span className="text-slate-400 italic opacity-70">Gissning: {data.emailStructure}</span> : <span className="text-slate-300 italic">Ej tillgänglig</span>)}
                        </span>
                    )}
                  </div>

                  {/* DIRECT PHONE */}
                  <div className="flex items-center gap-2 text-xs min-w-0">
                    <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={dm.directPhone}
                            onChange={(e) => updateDM(idx, 'directPhone', e.target.value)}
                            className="flex-1 text-xs border-slate-300 rounded-sm p-0.5 focus:border-black focus:ring-[#2563EB]"
                            placeholder="Direktnummer"
                        />
                    ) : (
                        <span className="truncate text-slate-600 font-mono select-all">
                            {dm.directPhone || <span className="text-slate-300 italic">Ej tillgängligt</span>}
                        </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isEditing && (
                <button 
                    onClick={addDM}
                    className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-400 font-bold uppercase text-xs hover:border-black hover:text-black transition-colors rounded-sm flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Lägg till person
                </button>
            )}

            {!isEditing && (
                <div className="bg-slate-50 p-3 rounded-sm border border-slate-200">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    Hittade vi inte rätt person?
                </h5>
                <div className="flex gap-2">
                    <input 
                    type="text" 
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="flex-1 text-xs border-slate-300 rounded-sm focus:ring-[#2563EB] focus:border-black"
                    placeholder="Titel (t.ex. VD)"
                    />
                    <button 
                    onClick={() => onRunLinkedInSearch && onRunLinkedInSearch(roleInput)}
                    disabled={isSearchingLinkedIn}
                    className="bg-[#0077b5] text-white px-3 py-1 rounded-sm text-xs font-bold hover:bg-[#006097] transition-colors disabled:opacity-50"
                    >
                    {isSearchingLinkedIn ? <Loader2 className="w-3 h-3 animate-spin" /> : <Linkedin className="w-3 h-3" />}
                    </button>
                </div>
                </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
