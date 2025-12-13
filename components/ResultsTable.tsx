
import React, { useState, useMemo, useEffect } from 'react';
import { LeadData, Segment } from '../types';
import { Search, ExternalLink, ArrowRight, ShieldAlert, Ban, CheckCircle2, AlertTriangle, ArrowUpDown, Filter, Phone, DollarSign, Users2, Download, Check, Database, MapPin, Truck, Hash, LayoutList, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, Microscope, ScanSearch, X, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';

interface ResultsTableProps {
  data: LeadData[];
  onDeepDive: (companyName: string) => void;
  initialFilterScope?: string; 
  allExclusions?: string[]; 
  existingCustomers?: string[]; 
  downloadedLeads?: string[]; 
  onDownloadSingle?: (lead: LeadData) => void;
  onDownloadSelected?: (leads: LeadData[]) => void;
  onExcludeSelected?: (leads: LeadData[]) => boolean; 
  onDeepDiveSelected?: (leads: LeadData[]) => void; 
  onReportError?: (lead: LeadData) => void; 
  initialSearchGeo?: string; 
}

const safeRender = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(item => safeRender(item)).join(", ");
  if (typeof value === 'object') {
    if (value.beskrivning) return value.beskrivning;
    return JSON.stringify(value); 
  }
  return "";
};

const parseFinancialValue = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = raw.toLowerCase().replace(/tkr/g, '').replace(/kr/g, '').replace(/\s/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
};

const formatOrgNr = (raw: string) => {
  if (!raw) return "-";
  let clean = raw.replace(/^SE/i, '').trim();
  const digits = clean.replace(/[^0-9]/g, '');
  
  if (digits.length === 12 && digits.endsWith('01')) {
      const core = digits.substring(0, 10);
      return core.substring(0, 6) + "-" + core.substring(6);
  }
  
  if (digits.length === 10) {
      return digits.substring(0, 6) + "-" + digits.substring(6);
  }
  
  if (clean.length > 13) return clean.substring(0, 11) + "..";
  return clean;
};

const extractCity = (address: string | undefined) => {
    if (!address) return "Okänd ort";
    const parts = address.split(',');
    const lastPart = parts[parts.length - 1].trim();
    return lastPart.replace(/\d{5}/, '').trim();
};

const formatFinancialCompact = (raw: string) => {
    if (!raw || raw === '0' || raw === '0 tkr') return "Ej tillgänglig";
    
    const match = raw.match(/^([\d\s.,]+)(?:tkr|kr)?/i);
    if (match) {
        let numStr = match[1].replace(/\s/g, '').replace(/\u00A0/g, '').replace(',', '.');
        const valTkr = parseFloat(numStr);
        if (isNaN(valTkr)) return raw;

        const valSEK = valTkr * 1000;
        
        if (valSEK >= 1000000000) {
            return (valSEK / 1000000000).toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + " mdSEK";
        }
        if (valSEK >= 1000000) {
            return (valSEK / 1000000).toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + " MSEK";
        }
        return valTkr.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + " tkr";
    }
    return raw;
};

type SortKey = 'companyName' | 'revenue' | 'segment' | 'org' | 'city' | 'contact' | 'actions';
type SortDirection = 'asc' | 'desc';

const ResultsTable: React.FC<ResultsTableProps> = ({ 
  data, 
  onDeepDive, 
  initialFilterScope, 
  allExclusions = [],
  downloadedLeads = [], 
  onDownloadSingle,
  onDownloadSelected,
  onExcludeSelected,
  onDeepDiveSelected,
  onReportError,
  initialSearchGeo
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  
  const [filters, setFilters] = useState({
    global: '',
    org: '',
    company: '',
    city: '',
    revenue: '',
    segment: 'ALL',
    contact: ''
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setFilters(prev => ({
        ...prev,
        segment: (initialFilterScope && ['TS', 'FS', 'KAM', 'DM'].includes(initialFilterScope)) ? initialFilterScope : 'ALL',
        city: initialSearchGeo || ''
    }));
  }, [initialFilterScope, initialSearchGeo]);

  const uniqueCities = useMemo(() => {
     const cities = new Set<string>();
     data.forEach(lead => {
         const c = extractCity(lead.address);
         if (c && c !== "Okänd ort") cities.add(c);
     });
     return Array.from(cities).sort();
  }, [data]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
      if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
      return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-black" /> : <ArrowDown className="w-3 h-3 text-black" />;
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
      setFilters({
        global: '',
        org: '',
        company: '',
        city: '',
        revenue: '',
        segment: 'ALL',
        contact: ''
      });
  };

  const filteredAndSortedData = useMemo(() => {
    let processed = [...data];

    if (filters.global) {
      const term = filters.global.toLowerCase();
      processed = processed.filter(item => {
        if (item.companyName.toLowerCase().includes(term)) return true;
        if (item.orgNumber && item.orgNumber.toLowerCase().includes(term)) return true;
        if (item.address && item.address.toLowerCase().includes(term)) return true;
        if (item.legalStatus && item.legalStatus.toLowerCase().includes(term)) return true;
        if (item.phoneNumber && item.phoneNumber.includes(term)) return true;
        
        if (item.decisionMakers.some(dm => 
            dm.name.toLowerCase().includes(term) || 
            dm.title.toLowerCase().includes(term) ||
            dm.email.toLowerCase().includes(term)
        )) return true;

        if (item.logisticsProfile && item.logisticsProfile.toLowerCase().includes(term)) return true;
        
        return false;
      });
    }

    if (filters.org) {
        const t = filters.org.toLowerCase();
        processed = processed.filter(item => 
            (item.orgNumber && item.orgNumber.toLowerCase().includes(t)) ||
            (item.legalStatus && item.legalStatus.toLowerCase().includes(t))
        );
    }

    if (filters.company) {
        const t = filters.company.toLowerCase();
        processed = processed.filter(item => item.companyName.toLowerCase().includes(t));
    }

    if (filters.city) {
        const t = filters.city.toLowerCase();
        processed = processed.filter(item => {
             const addressMatch = item.address && item.address.toLowerCase().includes(t);
             const cityExtract = extractCity(item.address).toLowerCase();
             return addressMatch || cityExtract.includes(t);
        });
    }

    if (filters.revenue) {
        const t = filters.revenue.toLowerCase();
        const numericFilter = parseFloat(t.replace(/\s/g, ''));
        
        if (!isNaN(numericFilter)) {
             processed = processed.filter(item => {
                const val = parseFinancialValue(item.revenue);
                return val >= numericFilter;
            });
        } else {
            processed = processed.filter(item => item.revenue && item.revenue.toLowerCase().includes(t));
        }
    }

    if (filters.segment !== 'ALL') {
        processed = processed.filter(item => item.segment === filters.segment);
    }

    if (filters.contact) {
        const t = filters.contact.toLowerCase();
        processed = processed.filter(item => 
            item.decisionMakers.some(dm => 
                dm.name.toLowerCase().includes(t) || 
                dm.title.toLowerCase().includes(t)
            )
        );
    }

    if (sortConfig) {
      processed.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        switch (sortConfig.key) {
            case 'revenue':
                valA = parseFinancialValue(a.revenue);
                valB = parseFinancialValue(b.revenue);
                break;
            case 'companyName':
                valA = a.companyName.toLowerCase();
                valB = b.companyName.toLowerCase();
                break;
            case 'segment':
                const rank = { 'KAM': 4, 'FS': 3, 'TS': 2, 'DM': 1, 'UNKNOWN': 0 };
                valA = rank[a.segment as keyof typeof rank] || 0;
                valB = rank[b.segment as keyof typeof rank] || 0;
                break;
            case 'org':
                valA = (a.orgNumber || '').replace(/[^0-9]/g, '');
                valB = (b.orgNumber || '').replace(/[^0-9]/g, '');
                break;
            case 'city':
                valA = extractCity(a.address).toLowerCase();
                valB = extractCity(b.address).toLowerCase();
                break;
            case 'contact':
                valA = (a.decisionMakers?.[0]?.name || '').toLowerCase();
                valB = (b.decisionMakers?.[0]?.name || '').toLowerCase();
                break;
            case 'actions':
                // Analyzed logic: Priority for already analyzed
                const isDownloadedA = downloadedLeads.includes(a.companyName);
                const isDownloadedB = downloadedLeads.includes(b.companyName);
                const isAnalyzedA = !!a.analysisDate;
                const isAnalyzedB = !!b.analysisDate;
                
                const scoreA = isDownloadedA ? 0 : (isAnalyzedA ? 2 : 1);
                const scoreB = isDownloadedB ? 0 : (isAnalyzedB ? 2 : 1);
                valA = scoreA;
                valB = scoreB;
                break;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processed;
  }, [data, sortConfig, filters, downloadedLeads]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = filteredAndSortedData.map(l => l.id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

    if (allSelected) {
       setSelectedIds(prev => {
          const next = new Set(prev);
          allIds.forEach(id => next.delete(id));
          return next;
       });
    } else {
       setSelectedIds(prev => {
          const next = new Set(prev);
          allIds.forEach(id => next.add(id));
          return next;
       });
    }
  };

  const handleBatchDownload = () => {
     if (onDownloadSelected) {
        const selectedLeads = data.filter(l => selectedIds.has(l.id));
        onDownloadSelected(selectedLeads);
        setSelectedIds(new Set()); 
     }
  };

  const handleBatchDeepDive = () => {
    if (onDeepDiveSelected) {
       const selectedLeads = data.filter(l => selectedIds.has(l.id));
       onDeepDiveSelected(selectedLeads);
       setSelectedIds(new Set()); 
    }
  };

  const handleBatchExclude = () => {
    if (onExcludeSelected) {
       const selectedLeads = data.filter(l => selectedIds.has(l.id));
       const confirmed = onExcludeSelected(selectedLeads);
       if (confirmed) {
           setSelectedIds(new Set()); 
       }
    }
  };

  const hasGroupConflict = (lead: LeadData): boolean => {
    if (allExclusions.length === 0 || !lead.parentCompany || lead.parentCompany.toLowerCase() === 'nej') return false;
    const norm = (s: string) => s.toLowerCase().replace(/ab|as|oy|ltd|inc/g, '').trim();
    const parentName = norm(lead.parentCompany);
    return allExclusions.some(customer => {
      const cust = norm(customer);
      if (cust.length < 3) return false;
      return parentName.includes(cust);
    });
  };

  const isAlreadyDownloaded = (companyName: string) => {
    return downloadedLeads.includes(companyName);
  };

  return (
    <div className="w-full">
      <div className="bg-slate-100 p-2 border-t-4 border-[#D40511] border-b border-slate-200 flex flex-col items-start gap-3">
        
        {/* ROW 1: SEARCH & ACTIONS */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
             {selectedIds.size > 0 && (onDownloadSelected || onExcludeSelected) ? (
                 <div className="flex gap-2 animate-fadeIn">
                    <span className="text-xs font-bold text-slate-500 uppercase flex items-center mr-2">
                        {selectedIds.size} valda
                    </span>
                    {onDeepDiveSelected && (
                      <button
                        type="button"
                        onClick={handleBatchDeepDive}
                        className="bg-slate-800 text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase hover:bg-black flex items-center gap-1 transition-colors shadow-sm"
                        title="Utför djupanalys på markerade företag sekventiellt"
                      >
                        <Microscope className="w-3 h-3" />
                        Djupanalysera
                      </button>
                    )}
                    {onDownloadSelected && (
                      <button 
                          type="button"
                          onClick={handleBatchDownload}
                          className="bg-green-600 text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase hover:bg-green-700 flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <Download className="w-3 h-3" />
                        Ladda ned
                      </button>
                    )}
                    {onExcludeSelected && (
                      <button 
                          type="button"
                          onClick={handleBatchExclude}
                          className="bg-red-600 text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase hover:bg-red-700 flex items-center gap-1 transition-colors shadow-sm"
                          title="Ta bort från resultatlistan och lägg i exkluderingslistan (t.ex. vid Konkurs)"
                      >
                        <Trash2 className="w-3 h-3" />
                        Ta bort
                      </button>
                    )}
                 </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Snabbsök (Globalt)..."
                        value={filters.global}
                        onChange={(e) => handleFilterChange('global', e.target.value)}
                        className="pl-7 pr-2 py-1 w-48 text-xs border border-slate-300 rounded-sm focus:ring-[#D40511] focus:border-[#D40511]"
                      />
                    </div>

                    <div className="h-4 w-px bg-slate-300 mx-1"></div>

                    <span className="text-xs text-slate-500 italic">
                        Klicka på rubrikerna nedan för att sortera.
                    </span>
                    
                    <div className="flex-1 text-right text-[10px] text-slate-500 italic">
                        Visar {filteredAndSortedData.length} av {data.length}
                    </div>
                </div>
              )}
        </div>
      </div>

      <div className="bg-white shadow-md w-full overflow-x-auto">
        <div className="min-w-[840px]">
            <div className="grid grid-cols-[40px_110px_minmax(150px,2fr)_minmax(100px,1fr)_110px_60px_minmax(150px,1.5fr)_90px] bg-[#FFCC00] border-b border-slate-300 text-xs font-black uppercase tracking-wider py-2 gap-2">
                <div className="flex items-center justify-center">
                    <input 
                    type="checkbox" 
                    className="rounded-sm border-slate-400 text-[#D40511] focus:ring-[#D40511] cursor-pointer"
                    onChange={toggleSelectAll}
                    checked={filteredAndSortedData.length > 0 && filteredAndSortedData.every(l => selectedIds.has(l.id))}
                    title="Markera ALLA i hela listan"
                    />
                </div>
                
                <button onClick={() => handleSort('org')} className="pl-4 text-left hover:text-[#D40511] flex items-center gap-1 transition-colors">
                    Status/Org {getSortIcon('org')}
                </button>
                <button onClick={() => handleSort('companyName')} className="text-left hover:text-[#D40511] flex items-center gap-1 transition-colors">
                    Företag {getSortIcon('companyName')}
                </button>
                <button onClick={() => handleSort('city')} className="text-left hover:text-[#D40511] flex items-center gap-1 transition-colors">
                    Ort {getSortIcon('city')}
                </button>
                <button onClick={() => handleSort('revenue')} className="text-left hover:text-[#D40511] flex items-center gap-1 transition-colors">
                    Omsättning {getSortIcon('revenue')}
                </button>
                <button onClick={() => handleSort('segment')} className="text-left hover:text-[#D40511] flex items-center gap-1 transition-colors">
                    Seg {getSortIcon('segment')}
                </button>
                <button onClick={() => handleSort('contact')} className="text-left hover:text-[#D40511] flex items-center gap-1 transition-colors">
                    Kontakt {getSortIcon('contact')}
                </button>
                <button onClick={() => handleSort('actions')} className="text-right pr-4 hover:text-[#D40511] flex items-center justify-end gap-1 transition-colors">
                    Åtgärd {getSortIcon('actions')}
                </button>
            </div>

            <div className="grid grid-cols-[40px_110px_minmax(150px,2fr)_minmax(100px,1fr)_110px_60px_minmax(150px,1.5fr)_90px] bg-slate-50 border-b border-slate-200 py-1.5 gap-2 sticky top-0 z-10">
                 <div className="flex items-center justify-center">
                    {(filters.org || filters.company || filters.city || filters.revenue || filters.segment !== 'ALL' || filters.contact) && (
                        <button onClick={clearAllFilters} className="text-red-600 hover:bg-red-50 p-1 rounded-sm" title="Rensa alla filter">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                 </div>
                 <div className="pl-4 pr-1">
                     <input 
                       type="text" 
                       placeholder="Org / Status..." 
                       value={filters.org}
                       onChange={(e) => handleFilterChange('org', e.target.value)}
                       className="w-full text-[10px] py-0.5 px-1 border-slate-300 rounded-sm focus:border-[#D40511] focus:ring-[#D40511]"
                     />
                 </div>
                 <div className="pr-1">
                     <input 
                       type="text" 
                       placeholder="Företagsnamn..." 
                       value={filters.company}
                       onChange={(e) => handleFilterChange('company', e.target.value)}
                       className="w-full text-[10px] py-0.5 px-1 border-slate-300 rounded-sm focus:border-[#D40511] focus:ring-[#D40511]"
                     />
                 </div>
                 <div className="pr-1">
                     <input 
                       type="text" 
                       list="city-suggestions"
                       placeholder="Ort..." 
                       value={filters.city}
                       onChange={(e) => handleFilterChange('city', e.target.value)}
                       className="w-full text-[10px] py-0.5 px-1 border-slate-300 rounded-sm focus:border-[#D40511] focus:ring-[#D40511]"
                     />
                     <datalist id="city-suggestions">
                         {uniqueCities.map(city => <option key={city} value={city} />)}
                     </datalist>
                 </div>
                 <div className="pr-1">
                     <input 
                       type="text" 
                       placeholder="Min Oms..." 
                       value={filters.revenue}
                       onChange={(e) => handleFilterChange('revenue', e.target.value)}
                       className="w-full text-[10px] py-0.5 px-1 border-slate-300 rounded-sm focus:border-[#D40511] focus:ring-[#D40511]"
                       title="Ange siffra för 'Minst X tkr', eller text för matchning"
                     />
                 </div>
                 <div className="pr-1">
                     <select 
                       value={filters.segment}
                       onChange={(e) => handleFilterChange('segment', e.target.value)}
                       className="w-full text-[10px] py-0.5 px-0 border-slate-300 rounded-sm focus:border-[#D40511] focus:ring-[#D40511]"
                     >
                        <option value="ALL">Alla</option>
                        <option value="KAM">KAM</option>
                        <option value="FS">FS</option>
                        <option value="TS">TS</option>
                        <option value="DM">DM</option>
                     </select>
                 </div>
                 <div className="pr-1">
                     <input 
                       type="text" 
                       placeholder="Namn / Titel..." 
                       value={filters.contact}
                       onChange={(e) => handleFilterChange('contact', e.target.value)}
                       className="w-full text-[10px] py-0.5 px-1 border-slate-300 rounded-sm focus:border-[#D40511] focus:ring-[#D40511]"
                     />
                 </div>
                 <div>{/* Action Column Empty */}</div>
            </div>

            <div className="divide-y divide-slate-200">
            {paginatedData.map((lead) => {
                const isBankruptcy = lead.legalStatus && (lead.legalStatus.toLowerCase().includes('konkurs') || lead.legalStatus.toLowerCase().includes('likvidation'));
                const isCreditWeak = lead.creditRatingLabel && (lead.creditRatingLabel.toLowerCase().includes('svag') || lead.creditRatingLabel.toLowerCase().includes('varning') || lead.creditRatingLabel.toLowerCase().includes('anmärkning'));
                const showWarning = isBankruptcy || isCreditWeak;
                const isConflict = hasGroupConflict(lead);
                const isDownloaded = isAlreadyDownloaded(lead.companyName);
                
                // Enhanced Analyzed Check: Check if we have an analysis date
                // Fallback to other fields only if date is missing but data is clearly enriched
                const isAnalyzed = !!lead.analysisDate || (!!lead.logisticsProfile && lead.logisticsProfile.length > 0) || (lead.decisionMakers && lead.decisionMakers.length > 0);
                
                const isSelected = selectedIds.has(lead.id);
                const city = extractCity(lead.address);
                const dmDisplay = lead.decisionMakers && lead.decisionMakers.length > 0 
                    ? lead.decisionMakers[0].name 
                    : "Saknas";
                const revenueText = formatFinancialCompact(safeRender(lead.revenue));
                const growth = lead.financials?.growthPercent;

                return (
                <div 
                    key={lead.id} 
                    className={`grid grid-cols-[40px_110px_minmax(150px,2fr)_minmax(100px,1fr)_110px_60px_minmax(150px,1.5fr)_90px] hover:bg-slate-50 transition-colors group py-3 items-center gap-2 ${isDownloaded ? 'bg-green-50/30' : ''} ${isSelected ? 'bg-[#D40511]/5' : ''}`}
                    onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
                        toggleSelect(lead.id);
                    }}
                >
                    <div className="flex items-center justify-center">
                    <input 
                        type="checkbox" 
                        className="rounded-sm border-slate-300 text-[#D40511] focus:ring-[#D40511] cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelect(lead.id)}
                    />
                    </div>

                    <div className="pl-4 flex items-center gap-1.5 overflow-hidden">
                    {showWarning ? (
                        <div title={isBankruptcy ? "Konkurs/Likvidation" : "Kreditvarning"}>
                            {isBankruptcy ? <Ban className="w-4 h-4 text-red-600 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                        </div>
                    ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-200 flex-shrink-0" />
                    )}
                    <span className="text-[10px] font-mono font-bold text-slate-600 truncate">
                        {formatOrgNr(safeRender(lead.orgNumber))}
                    </span>
                    </div>

                    <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-[#D40511] truncate" title={safeRender(lead.companyName)}>
                            {safeRender(lead.companyName)}
                        </div>
                        {isConflict && (
                            <div className="text-[9px] text-yellow-700 font-bold flex items-center gap-1 animate-pulse">
                                <Users2 className="w-3 h-3" /> Koncernkonflikt
                            </div>
                        )}
                        {lead.source === 'cache' && (
                            <div className="text-[9px] text-slate-400 flex items-center gap-1">
                            <Database className="w-2.5 h-2.5" /> Reservoir
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-slate-600 truncate pr-2 flex items-center gap-1" title={safeRender(lead.address)}>
                        <MapPin className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        {city}
                    </div>

                    <div className="text-xs truncate pr-2 flex items-center gap-1" title={safeRender(lead.revenue)}>
                    {revenueText === "Ej tillgänglig" ? (
                        <span className="text-slate-400 italic text-[10px]">{revenueText}</span>
                    ) : (
                        <span className="font-bold text-slate-700">{revenueText}</span>
                    )}
                    {growth !== undefined && (
                        growth > 0 ? (
                            <span title={`Ökade ${growth}% föregående år`}>
                                <TrendingUp className="w-3 h-3 text-green-600" />
                            </span>
                        ) : growth < 0 ? (
                            <span title={`Minskade ${Math.abs(growth)}% föregående år`}>
                                <TrendingDown className="w-3 h-3 text-red-500" />
                            </span>
                        ) : null
                    )}
                    </div>

                    <div>
                    <span className={`px-1.5 py-0.5 inline-flex text-[9px] font-bold uppercase rounded-sm border justify-center w-8 ${
                            lead.segment === 'KAM' ? 'bg-[#D40511] text-white border-red-800' :
                            lead.segment === 'FS' ? 'bg-[#FFCC00] text-black border-yellow-500' :
                            lead.segment === 'TS' ? 'bg-green-100 text-green-800 border-green-200' :
                            lead.segment === 'DM' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                            {lead.segment}
                        </span>
                    </div>

                    <div className="text-xs truncate pr-2 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-300 flex-shrink-0" />
                    <span className={`truncate ${dmDisplay === 'Saknas' ? 'text-slate-400 italic' : 'text-slate-700'}`} title={dmDisplay}>
                        {dmDisplay}
                    </span>
                    </div>

                    <div className="pr-4 flex justify-end gap-1">
                        {onReportError && (
                             <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onReportError(lead); }}
                                className="p-1.5 rounded-sm transition-colors border bg-white text-orange-400 border-slate-300 hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50"
                                title="Rapportera fel / Hallucination"
                             >
                                <AlertTriangle className="w-3 h-3" />
                             </button>
                        )}

                        {onDownloadSingle && (
                            <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDownloadSingle(lead); }}
                            disabled={isDownloaded}
                            className={`p-1.5 rounded-sm transition-colors border ${
                                isDownloaded 
                                ? 'bg-green-100 text-green-700 border-green-200 opacity-50 cursor-default' 
                                : 'bg-white text-slate-500 border-slate-300 hover:text-green-600 hover:border-green-600'
                            }`}
                            title={isDownloaded ? "Redan nedladdad" : "Ladda ner CSV"}
                            >
                            {isDownloaded ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeepDive(lead.companyName);
                            }}
                            className={`p-1.5 rounded-sm transition-colors border ${
                            isAnalyzed 
                                ? 'bg-slate-800 text-white border-slate-900 hover:bg-black' 
                                : 'bg-[#D40511] text-white border-[#b0040e] hover:bg-[#a0040d]'
                            }`}
                            title={isAnalyzed ? `Analys Klar ${lead.analysisDate ? '(' + new Date(lead.analysisDate).toLocaleDateString() + ')' : ''}. Klicka för att öppna.` : "Starta Analys"}
                        >
                            {isAnalyzed ? <LayoutList className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                        </button>
                        {onExcludeSelected && (
                            <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onExcludeSelected([lead]);
                            }}
                            className="p-1.5 rounded-sm transition-colors border bg-white text-slate-400 border-slate-300 hover:text-red-600 hover:border-red-600 hover:bg-red-50"
                            title="Ta bort (Exkludera)"
                            >
                            <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                </div>
                );
            })}
            </div>
        </div>
      </div>

      {filteredAndSortedData.length > 0 && (
        <div className="bg-white border-t border-slate-200 p-2 flex items-center justify-between shadow-sm mt-1">
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-slate-600 uppercase">Visa:</span>
             <select 
               value={itemsPerPage}
               onChange={(e) => setItemsPerPage(Number(e.target.value))}
               className="text-xs border-slate-300 rounded-sm py-1 pl-2 pr-6 focus:ring-[#D40511] focus:border-[#D40511] bg-slate-50"
             >
               <option value={10}>10</option>
               <option value={20}>20</option>
               <option value={50}>50</option>
               <option value={100}>100</option>
             </select>
             <span className="text-[10px] text-slate-400 italic ml-2">
               Visar {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} av {filteredAndSortedData.length}
             </span>
          </div>
          
          <div className="flex items-center gap-1">
             <button 
               type="button"
               onClick={() => goToPage(1)}
               disabled={currentPage === 1}
               className="p-1 border border-slate-300 rounded-sm hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
               title="Första sidan"
             >
               <ChevronsLeft className="w-4 h-4 text-slate-600" />
             </button>
             <button 
               type="button"
               onClick={() => goToPage(currentPage - 1)}
               disabled={currentPage === 1}
               className="p-1 border border-slate-300 rounded-sm hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
               title="Föregående"
             >
               <ChevronLeft className="w-4 h-4 text-slate-600" />
             </button>
             
             <span className="mx-2 text-xs font-bold text-slate-800">
                Sida {currentPage} av {totalPages}
             </span>

             <button 
               type="button"
               onClick={() => goToPage(currentPage + 1)}
               disabled={currentPage === totalPages}
               className="p-1 border border-slate-300 rounded-sm hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
               title="Nästa"
             >
               <ChevronRight className="w-4 h-4 text-slate-600" />
             </button>
             <button 
               type="button"
               onClick={() => goToPage(totalPages)}
               disabled={currentPage === totalPages}
               className="p-1 border border-slate-300 rounded-sm hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
               title="Sista sidan"
             >
               <ChevronsRight className="w-4 h-4 text-slate-600" />
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;
