import React, { useState, useRef } from 'react';
import { Database, Download, ArrowUpRight, Trash2, X, Filter, LayoutGrid, Upload, FileText, CheckCircle2, FileSpreadsheet, FileDown } from 'lucide-react';
import { LeadData, Segment } from '../types';
import * as XLSX from 'xlsx';

interface CacheManagerProps {
  isOpen: boolean;
  onClose: () => void;
  cacheData: LeadData[];
  setCacheData: (data: LeadData[]) => void;
  onMoveToActive: (leads: LeadData[]) => void;
  onDownloadAndExclude: (lead: LeadData) => void;
  onDownloadAll: () => void;
  activeLeads: LeadData[]; 
  existingCustomers: string[]; // New prop
  downloadedLeads: string[]; // New prop
}

export const CacheManager: React.FC<CacheManagerProps> = ({
  isOpen,
  onClose,
  cacheData,
  setCacheData,
  onMoveToActive,
  onDownloadAndExclude,
  onDownloadAll,
  activeLeads,
  existingCustomers,
  downloadedLeads
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'import'>('view');
  const [filterSegment, setFilterSegment] = useState<string>('ALL');
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredData = cacheData.filter(lead => 
    filterSegment === 'ALL' || lead.segment === filterSegment
  );

  const normalizeStr = (s: string) => s.toLowerCase().replace(/ab|as|oy|ltd|inc/g, '').replace(/[^a-z0-9]/g, '');

  const isExcluded = (companyName: string, orgNr: string | undefined) => {
    const allExclusions = [...existingCustomers, ...downloadedLeads];
    const normName = normalizeStr(companyName);
    const normOrg = orgNr ? normalizeStr(orgNr) : '';
    
    return allExclusions.some(ex => {
      const normEx = normalizeStr(ex);
      if (normEx.length < 3) return false; 
      return normName.includes(normEx) || (normOrg && normOrg.includes(normEx));
    });
  };

  const handleClearCache = () => {
    if (window.confirm("Är du säker? Detta tar bort alla sparade leads i reservoaren som inte laddats ner.")) {
      setCacheData([]);
    }
  };

  const handleMoveAll = () => {
    const leadsToMove = filteredData.filter(c => !activeLeads.some(al => al.companyName === c.companyName));
    if (leadsToMove.length > 0) {
      onMoveToActive(leadsToMove);
    }
    onClose();
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { 
        "Org.nr": "556000-0000", 
        "Företagsnamn": "Exempel Bolag AB", 
        "Omsättning": "100 000 tkr", 
        "Segment": "KAM", 
        "Beslutsfattare": "Anders Andersson (VD)" 
      },
      { 
        "Org.nr": "SE556123456701", 
        "Företagsnamn": "Testbolaget HB", 
        "Omsättning": "5 000 tkr", 
        "Segment": "TS", 
        "Beslutsfattare": "" 
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Importmall");
    XLSX.writeFile(wb, "DHL_Reservoir_Mall.xlsx");
  };

  const handleImport = () => {
    if (!importText.trim()) return;

    const lines = importText.split('\n');
    const newLeads: LeadData[] = [];
    let excludedCount = 0;

    lines.forEach(line => {
      const parts = line.split(/,|;|\t/).map(s => s.trim());
      if (parts.length > 0 && parts[0]) {
        let p1 = parts[0];
        let p2 = parts[1] || "";
        
        let name = p1;
        let org = p2;

        if (p1.match(/^(SE)?\d/)) { 
           org = p1;
           name = p2 || "Okänt Bolag";
        }

        if (isExcluded(name, org)) {
            excludedCount++;
            return;
        }

        const importedLead: LeadData = {
          id: crypto.randomUUID(),
          companyName: name,
          orgNumber: org,
          address: parts[2] || "", 
          segment: Segment.UNKNOWN, 
          revenue: "",
          freightBudget: "",
          legalStatus: "Okänd (Importerad)",
          creditRatingLabel: "",
          creditRatingDescription: "",
          liquidity: "",
          trendRisk: "",
          trigger: "Manuell Import",
          emailStructure: "",
          decisionMakers: [],
          icebreaker: "",
          websiteUrl: "",
          carriers: "",
          usesDhl: "",
          shippingTermsLink: "",
          source: 'cache',
          analysisDate: new Date().toISOString()
        };
        newLeads.push(importedLead);
      }
    });

    if (newLeads.length > 0 || excludedCount > 0) {
      setCacheData([...cacheData, ...newLeads.filter(nl => !cacheData.some(c => c.companyName === nl.companyName))]);
      setImportText('');
      setActiveTab('view');
      let msg = `${newLeads.length} företag importerades.`;
      if (excludedCount > 0) msg += `\n${excludedCount} företag exkluderades (Befintlig kund/Historik).`;
      alert(msg);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const newLeads: LeadData[] = [];
      let textBuffer = ""; 
      let excludedCount = 0;
      
      jsonData.forEach((row, index) => {
        if (row.length === 0) return;
        
        const getVal = (idx: number) => row[idx] ? String(row[idx]).trim() : "";

        const col0 = getVal(0); // Org.nr
        const col1 = getVal(1); // Name
        const col2 = getVal(2); // Revenue
        const col3 = getVal(3); // Segment
        const col4 = getVal(4); // Decision Maker

        if (index === 0 && (col0.toLowerCase().includes('org') || col1.toLowerCase().includes('namn'))) return;

        let name = "";
        let org = "";
        let revenue = col2;
        let segmentInput = col3.toUpperCase();
        let dmName = col4;

        const isOrgLike = (s: string) => s.match(/^(SE)?\d{6}/) || s.match(/\d{6}-\d{4}/);
        
        if (isOrgLike(col0) || (col0 && col1)) {
            org = col0;
            name = col1 || "Okänt Bolag";
        } else {
            if (!isOrgLike(col0) && isOrgLike(col1)) {
                name = col0;
                org = col1;
            } else if (!name) {
                name = col0; 
            }
        }

        if (org) {
            let clean = org.replace(/^SE/i, '').replace(/-/, '').replace(/\s/g, '');
            if (clean.length === 12 && clean.endsWith('01')) clean = clean.substring(0, 10);
            if (clean.length === 10) org = clean.substring(0, 6) + "-" + clean.substring(6);
        }

        // CHECK EXCLUSION
        if (isExcluded(name, org)) {
            excludedCount++;
            return; // Skip adding to list
        }

        let segment = Segment.UNKNOWN;
        if (segmentInput === 'KAM') segment = Segment.KAM;
        else if (segmentInput === 'FS') segment = Segment.FS;
        else if (segmentInput === 'TS') segment = Segment.TS;
        else if (segmentInput === 'DM') segment = Segment.DM;

        if (name) {
             const importedLead: LeadData = {
                id: crypto.randomUUID(),
                companyName: name,
                orgNumber: org,
                address: "", 
                segment: segment, 
                revenue: revenue,
                freightBudget: "",
                legalStatus: "Okänd (Excel)",
                creditRatingLabel: "",
                creditRatingDescription: "",
                liquidity: "",
                trendRisk: "",
                trigger: "Excel Import",
                emailStructure: "",
                decisionMakers: dmName ? [{ name: dmName, title: "Importerad", email: "", linkedin: "" }] : [],
                icebreaker: "",
                websiteUrl: "",
                carriers: "",
                usesDhl: "",
                shippingTermsLink: "",
                source: 'cache',
                analysisDate: new Date().toISOString()
            };
            newLeads.push(importedLead);
            textBuffer += `${name}, ${org} [${revenue ? revenue : '-'}]\n`;
        }
      });

      if (newLeads.length > 0 || excludedCount > 0) {
          setCacheData([...cacheData, ...newLeads.filter(nl => !cacheData.some(c => c.companyName === nl.companyName))]);
          setImportText(textBuffer); 
          let msg = `${newLeads.length} företag importerades.`;
          if (excludedCount > 0) msg += `\n${excludedCount} företag exkluderades automatiskt (Finns i Exkluderingslistan).`;
          alert(msg);
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
      
    } catch (error) {
      console.error("Error parsing Excel:", error);
      alert("Kunde inte läsa Excel-filen.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-4xl shadow-2xl border-t-8 border-slate-600 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-slate-700 p-2 rounded-full">
               <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black italic uppercase text-white">Lead Reservoir (Cache)</h2>
              <p className="text-xs text-slate-400">
                Lagra, hantera och importera företag för framtida analys.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100">
          <button
            onClick={() => setActiveTab('view')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${
              activeTab === 'view' 
                ? 'bg-white text-slate-900 border-b-2 border-slate-900' 
                : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Hantering ({cacheData.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${
              activeTab === 'import' 
                ? 'bg-white text-slate-900 border-b-2 border-slate-900' 
                : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Importera Lista
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'view' ? (
          <>
            {/* Toolbar */}
            <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-slate-300 px-2 py-1 rounded-sm">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select 
                    value={filterSegment}
                    onChange={(e) => setFilterSegment(e.target.value)}
                    className="text-xs font-bold border-none p-0 focus:ring-0 cursor-pointer text-slate-700 bg-transparent"
                  >
                    <option value="ALL">Visa Alla Segment</option>
                    <option value="KAM">KAM (&gt; 5M)</option>
                    <option value="FS">FS (750k - 5M)</option>
                    <option value="TS">TS (250k - 750k)</option>
                    <option value="DM">DM (&lt; 250k)</option>
                    <option value="UNKNOWN">Osegmenterade (Import)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                {filteredData.length > 0 && (
                  <>
                    <button 
                      type="button"
                      onClick={onDownloadAll}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm rounded-sm"
                    >
                      <Download className="w-4 h-4" />
                      Spara Hela (.CSV)
                    </button>
                    <button 
                      type="button"
                      onClick={handleMoveAll}
                      className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Flytta Urval
                    </button>
                  </>
                )}
                <button 
                  type="button"
                  onClick={handleClearCache}
                  disabled={cacheData.length === 0}
                  className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors rounded-sm disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Töm Cache
                </button>
              </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
              {filteredData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Database className="w-12 h-12 opacity-20" />
                  <p className="text-sm italic">Cachen är tom för detta urval.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredData.map((lead, idx) => {
                    const isActive = activeLeads.some(al => al.companyName === lead.companyName);
                    
                    return (
                      <div key={idx} className={`bg-white border p-3 flex items-center justify-between hover:shadow-md transition-shadow group ${isActive ? 'border-green-200 bg-green-50/20' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-4 overflow-hidden">
                          <span className={`flex-shrink-0 w-16 text-center text-[10px] font-bold px-1 py-0.5 border ${
                            lead.segment === 'KAM' ? 'bg-[#D40511] text-white border-red-800' :
                            lead.segment === 'FS' ? 'bg-[#FFCC00] text-black border-yellow-500' :
                            lead.segment === 'TS' ? 'bg-green-100 text-green-800 border-green-200' :
                            lead.segment === 'DM' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {lead.segment === Segment.UNKNOWN ? 'IMPORT' : lead.segment}
                          </span>
                          
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-sm text-slate-800 truncate">{lead.companyName}</div>
                              {isActive && (
                                <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 rounded-sm flex items-center gap-1 border border-green-200">
                                  <LayoutGrid className="w-3 h-3" />
                                  Arbetsvy
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              {lead.orgNumber && <span className="font-mono bg-slate-100 px-1 rounded-sm text-slate-700">{lead.orgNumber}</span>}
                              {lead.orgNumber && lead.revenue && <span>•</span>}
                              {lead.revenue && <span className="text-slate-700 font-bold">{lead.revenue}</span>}
                              {!lead.orgNumber && !lead.revenue && <span className="italic text-slate-300">Ingen detaljdata</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pl-4">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                onMoveToActive([lead]);
                              }}
                              className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-sm"
                              title="Flytta till Arbetsvy (Aktivera för analys)"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDownloadAndExclude(lead)}
                            className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm rounded-sm"
                            title="Ladda ner CSV & Exkludera"
                          >
                            <Download className="w-3 h-3" />
                            Hämta
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* IMPORT TAB CONTENT */
          <div className="flex-1 p-6 flex flex-col bg-slate-50">
             <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <h4 className="text-xs font-bold text-blue-900 uppercase flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4" />
                  Instruktion för Import
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Ladda upp en Excel-fil (.xlsx) med följande kolumnordning för bäst resultat:
                  <br/>
                  <span className="font-mono bg-blue-100 px-1 rounded text-[10px] mt-1 inline-block">
                    A: Org.nr | B: Företagsnamn | C: Omsättning | D: Segment | E: Beslutsfattare
                  </span>
                  <br/>
                  <span className="italic opacity-80 mt-1 block">Endast Org.nr och Namn är obligatoriska.</span>
                </p>
                <div className="bg-blue-100 p-2 mt-2 rounded text-[10px] text-blue-900 font-bold border border-blue-200 flex items-center gap-2">
                   <CheckCircle2 className="w-3 h-3" />
                   Systemet kontrollerar automatiskt mot din exkluderingslista vid import.
                </div>
             </div>

             <div className="flex gap-2 mb-2 items-center">
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="reservoir-upload"
                />
                <label 
                  htmlFor="reservoir-upload" 
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-green-700 transition-colors cursor-pointer shadow-sm rounded-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Ladda upp Excel
                </label>
                
                <button
                   onClick={handleDownloadTemplate}
                   className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-sm rounded-sm"
                   title="Ladda ner en exempelfil att fylla i"
                >
                   <FileDown className="w-4 h-4" />
                   Ladda ner Mall (.xlsx)
                </button>
             </div>

             <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`Förhandsgranskning av import visas här...`}
                className="flex-1 w-full p-4 border border-slate-300 rounded-sm font-mono text-xs focus:ring-[#D40511] focus:border-[#D40511] resize-none mb-4 shadow-inner bg-white"
                readOnly
             />

             <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 italic">
                  {importText.split('\n').filter(l => l.trim().length > 0).length} rader identifierade
                </span>
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="flex items-center gap-2 bg-[#D40511] text-white px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-[#a0040d] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  Spara till Reservoar
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};