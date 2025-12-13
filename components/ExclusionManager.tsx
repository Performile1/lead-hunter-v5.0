import React, { useState, useEffect, useRef } from 'react';
import { ShieldBan, Download, Trash2, Save, X, History, FileSpreadsheet, Upload, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExclusionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  existingCustomers: string[];
  setExistingCustomers: (list: string[]) => void;
  downloadedLeads: string[];
  setDownloadedLeads: (list: string[]) => void;
}

export const ExclusionManager: React.FC<ExclusionManagerProps> = ({
  isOpen,
  onClose,
  existingCustomers,
  setExistingCustomers,
  downloadedLeads,
  setDownloadedLeads
}) => {
  const [activeTab, setActiveTab] = useState<'existing' | 'history'>('existing');
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'existing') {
      setTextInput(existingCustomers.join('\n'));
    }
  }, [activeTab, existingCustomers, isOpen]);

  if (!isOpen) return null;

  const handleSaveExisting = () => {
    const list = textInput
      .split(/[\n]+/) // Changed to split by newline only to preserve spaces in NEGATIV MATCH
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const uniqueList = Array.from(new Set(list));
    setExistingCustomers(uniqueList);
    onClose();
  };

  const clearHistory = () => {
    if (window.confirm("Är du säker på att du vill rensa historiken över nedladdade leads?")) {
      setDownloadedLeads([]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { "Org.nr": "556000-0000", "Företagsnamn": "Exempel Bolag AB" },
      { "Org.nr": "SE556123456701", "Företagsnamn": "Testbolaget HB" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exkludering");
    XLSX.writeFile(wb, "DHL_Exkludering_Mall.xlsx");
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

      let textBuffer = "";
      
      jsonData.forEach((row, index) => {
        if (row.length === 0) return;

        // Column mapping: 0=Org, 1=Name
        const col0 = row[0] ? String(row[0]).trim() : "";
        const col1 = row[1] ? String(row[1]).trim() : "";

        // Skip header
        if (index === 0 && (col0.toLowerCase().includes('org') || col1.toLowerCase().includes('namn'))) return;

        let name = "";
        let org = "";

        const isOrgNr = (str: string) => str.match(/^(SE)?(16|20|55|7\d|8\d|9\d)\d{2}[-]?\d{4}(01)?$/);

        // STRATEGY: Structured preferred, Fallback to discovery
        if (isOrgNr(col0) || (col0 && col1)) {
            org = col0;
            name = col1;
        } else {
             // Fallback logic
             if (isOrgNr(col1)) { org = col1; name = col0; } // Swapped?
             else { name = col0; } // Just name?
        }

        // Clean Org
        if (org) {
             let clean = org.replace(/^SE/i, '').replace(/-/, '');
             if (clean.length === 12 && clean.endsWith('01')) clean = clean.substring(0, 10);
             if (clean.length === 10) org = clean.substring(0, 6) + "-" + clean.substring(6);
             else org = org; // Keep original if weird format
        }

        // For exclusions, add both to be safe
        if (org) textBuffer += `${org}\n`;
        if (name) textBuffer += `${name}\n`;
      });

      setTextInput(prev => prev + (prev ? "\n" : "") + textBuffer);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (error) {
      console.error("Error parsing Excel:", error);
      alert("Kunde inte läsa Excel-filen.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl shadow-2xl border-t-4 border-[#D40511] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white p-4 flex justify-between items-center border-b border-slate-200">
          <h2 className="text-lg font-black italic uppercase flex items-center gap-2 text-black">
            <ShieldBan className="w-5 h-5 text-[#D40511]" />
            Hantera Exkluderingar & Blockeringar
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('existing')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${
              activeTab === 'existing' 
                ? 'bg-white text-[#D40511] border-b-2 border-[#D40511]' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Befintliga Kunder & Regler ({existingCustomers.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${
              activeTab === 'history' 
                ? 'bg-white text-[#D40511] border-b-2 border-[#D40511]' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Nedladdad Historik ({downloadedLeads.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'existing' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Instruktion:</strong> Lägg till Org.nr eller Företagsnamn för att blockera dem.
                  <br/>
                  <span className="font-mono bg-blue-100 px-1 rounded text-[10px] mt-1 inline-block">
                    A: Org.nr | B: Företagsnamn
                  </span>
                </p>
                
                <p className="text-xs text-blue-800 leading-relaxed mt-2 pt-2 border-t border-blue-200">
                   <strong>Nyhet: Negativa Matchningar (Anti-Hallucination)</strong><br/>
                   För att blockera en <i>specifik felaktig koppling</i> mellan namn och org.nr, använd formatet:<br/>
                   <span className="font-mono bg-orange-100 text-orange-900 px-1 rounded text-[10px]">
                      NEGATIV MATCH: Företaget AB ; 556000-0000
                   </span>
                </p>
              </div>

              <div className="flex gap-2 items-center">
                 <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="exclusion-upload"
                />
                <label 
                  htmlFor="exclusion-upload" 
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-green-700 transition-colors cursor-pointer shadow-sm rounded-sm w-fit"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Ladda upp Excel
                </label>
                <button
                   onClick={handleDownloadTemplate}
                   className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-sm rounded-sm"
                   title="Ladda ner en exempelfil"
                >
                   <FileDown className="w-4 h-4" />
                   Ladda ner Mall (.xlsx)
                </button>
              </div>

              <div>
                <textarea
                  className="w-full h-64 p-3 text-xs border border-slate-300 focus:border-[#D40511] focus:ring-[#D40511] rounded-none font-mono"
                  placeholder="Exempel:&#10;Volvo Cars&#10;556000-0000&#10;NEGATIV MATCH: Fel Bolag AB ; 123456-7890"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                ></textarea>
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {textInput.split(/[\n]+/).filter(s => s.trim().length > 0).length} rader identifierade
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-3">
                <p className="text-xs text-green-800">
                  <strong>Historik:</strong> Här visas företag du redan har laddat ner via CSV-funktionen. Dessa exkluderas automatiskt från framtida Batch-sökningar.
                </p>
              </div>
              
              <div className="border border-slate-200 bg-slate-50 h-64 overflow-y-auto p-2">
                {downloadedLeads.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                    Ingen historik än. Ladda ner en rapport för att fylla på listan.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {downloadedLeads.map((lead, idx) => (
                      <li key={idx} className="text-xs font-mono text-slate-700 border-b border-slate-200 pb-1 last:border-0 flex justify-between">
                        <span>{lead}</span>
                        <span className="text-[10px] text-slate-400 italic">Sparad</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          {activeTab === 'existing' ? (
            <>
              <button 
                 onClick={() => setTextInput('')}
                 className="text-xs text-slate-500 hover:text-[#D40511] font-bold uppercase"
              >
                Rensa Fält
              </button>
              <button
                onClick={handleSaveExisting}
                className="flex items-center gap-2 bg-[#D40511] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-[#a0040d] transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                Spara Lista
              </button>
            </>
          ) : (
            <>
               <div className="text-[10px] text-slate-500 italic">
                 Sparas automatiskt i webbläsaren.
               </div>
               <button
                onClick={clearHistory}
                disabled={downloadedLeads.length === 0}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Rensa Historik
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};