import React, { useState } from 'react';
import { Search, X, HelpCircle, Activity } from 'lucide-react';

type SearchMode = 'single' | 'batch';
type UserRole = 'admin' | 'terminal_chef' | 'manager' | 'salesperson';

interface EnhancedSearchPanelProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
  userRole?: UserRole;
  apiUsage?: {
    used: number;
    limit: number;
  };
}

interface SearchParams {
  mode: SearchMode;
  // Single mode
  companyName?: string;
  specificPerson?: string;
  // Batch mode
  region?: string;
  segment?: string;
  targetCount?: number;
  // Common
  triggers?: string[];
  focusPositionsPrio1: string[];
  focusPositionsPrio2: string[];
  focusPositionsPrio3: string[];
  iceBreakerTopic?: string;
}

export const EnhancedSearchPanel: React.FC<EnhancedSearchPanelProps> = ({ 
  onSearch, 
  isLoading = false,
  userRole = 'salesperson',
  apiUsage = { used: 127, limit: 1000 }
}) => {
  const [mode, setMode] = useState<SearchMode>('single');
  const [showGuide, setShowGuide] = useState(false);
  
  // Single mode state
  const [companyName, setCompanyName] = useState('');
  const [specificPerson, setSpecificPerson] = useState('');
  
  // Batch mode state
  const [region, setRegion] = useState('');
  const [segment, setSegment] = useState('all');
  const [targetCount, setTargetCount] = useState(100);
  
  // Common state
  const [triggers, setTriggers] = useState<string[]>([]);
  const [triggerInput, setTriggerInput] = useState('');
  
  const [prio1, setPrio1] = useState<string[]>([
    'Head of Logistics',
    'Logistics Manager',
    'Fulfillment Manager',
    'Last Mile',
    'Logistikchef',
    'COO'
  ]);
  const [prio1Input, setPrio1Input] = useState('');
  
  const [prio2, setPrio2] = useState<string[]>([
    'Head of Ecommerce',
    'Ecommerce Manager',
    'Head of Operations',
    'Supply Chain Manager',
    'Inköpschef'
  ]);
  const [prio2Input, setPrio2Input] = useState('');
  
  const [prio3, setPrio3] = useState<string[]>(['CEO', 'CFO', 'VD']);
  const [prio3Input, setPrio3Input] = useState('');
  
  const [iceBreakerTopic, setIceBreakerTopic] = useState('');

  const handleAddChip = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()]);
      inputSetter('');
    }
  };

  const handleRemoveChip = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearch = () => {
    const params: SearchParams = {
      mode,
      focusPositionsPrio1: prio1,
      focusPositionsPrio2: prio2,
      focusPositionsPrio3: prio3,
      iceBreakerTopic,
      triggers
    };

    if (mode === 'single') {
      params.companyName = companyName;
      params.specificPerson = specificPerson;
    } else {
      params.region = region;
      params.segment = segment;
      params.targetCount = targetCount;
    }

    onSearch(params);
  };

  // Check permissions based on role
  const canAccessAllRegions = userRole === 'admin' || userRole === 'terminal_chef';
  const canAccessAllSegments = userRole === 'admin' || userRole === 'terminal_chef';

  return (
    <div className="bg-white border-2 border-[#D40511] rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FFCC00] to-yellow-300 border-b-2 border-[#D40511] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black italic text-black uppercase flex items-center gap-2">
            <Search className="w-5 h-5" />
            Konfigurera Sökning
          </h3>
          
          {/* Guide Button */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="p-2 bg-white border-2 border-[#D40511] rounded-full hover:bg-slate-50 transition-colors"
            title="Visa guide"
          >
            <HelpCircle className="w-5 h-5 text-[#D40511]" />
          </button>
        </div>

        {/* API Usage Counter */}
        <div className="bg-white border border-[#D40511] rounded-sm p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#D40511]" />
            <span className="text-xs font-bold text-slate-700">API-användning:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-[#D40511]">
              {apiUsage.used} / {apiUsage.limit}
            </span>
            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D40511] transition-all"
                style={{ width: `${(apiUsage.used / apiUsage.limit) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Guide Popup */}
      {showGuide && (
        <div className="bg-blue-50 border-b-2 border-blue-200 p-4">
          <h4 className="font-bold text-sm text-blue-900 mb-2">📖 Snabbguide</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• <strong>Enstaka:</strong> Sök på specifikt företag eller org.nummer</li>
            <li>• <strong>Batch:</strong> Hitta flera leads baserat på kriterier</li>
            <li>• <strong>Fokus-positioner:</strong> Vilka roller ska vi leta efter?</li>
            <li>• <strong>Triggers:</strong> Specifika händelser (t.ex. "Ny etablering")</li>
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        
        {/* Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('single')}
            className={`flex-1 py-2 px-4 rounded-sm font-bold text-sm uppercase tracking-wider transition-all ${
              mode === 'single'
                ? 'bg-[#D40511] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Enstaka
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`flex-1 py-2 px-4 rounded-sm font-bold text-sm uppercase tracking-wider transition-all ${
              mode === 'batch'
                ? 'bg-[#D40511] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Batch
          </button>
        </div>

        {/* Single Mode */}
        {mode === 'single' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Företagsnamn / Org.nr
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="T.ex. Boozt Fashion AB eller 556793-5183"
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#D40511] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Sök Specifik Person
                <span className="text-[10px] text-slate-400 ml-1 normal-case">- Valfritt</span>
              </label>
              <input
                type="text"
                value={specificPerson}
                onChange={(e) => setSpecificPerson(e.target.value)}
                placeholder="T.ex. Johan Svensson"
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#D40511] transition-colors"
              />
            </div>
          </div>
        )}

        {/* Batch Mode */}
        {mode === 'batch' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Geografiskt område
                {!canAccessAllRegions && (
                  <span className="text-[10px] text-orange-600 ml-1 normal-case">
                    - Begränsat till ditt område
                  </span>
                )}
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={canAccessAllRegions ? "T.ex. Stockholm, Göteborg, Sverige" : "Ditt tilldelade område"}
                disabled={!canAccessAllRegions}
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#D40511] transition-colors disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Fraktomsättning (Segment)
                {!canAccessAllSegments && (
                  <span className="text-[10px] text-orange-600 ml-1 normal-case">
                    - Begränsat till ditt segment
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Alla', 'KAM', 'FS', 'TS', 'DM'].map((seg) => (
                  <button
                    key={seg}
                    onClick={() => setSegment(seg.toLowerCase())}
                    disabled={!canAccessAllSegments && seg !== 'Alla'}
                    className={`py-2 px-3 rounded-sm text-xs font-bold uppercase tracking-wide transition-all ${
                      segment === seg.toLowerCase()
                        ? 'bg-[#D40511] text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {seg === 'Alla' ? 'Alla' :
                     seg === 'KAM' ? 'KAM (≥5M)' :
                     seg === 'FS' ? 'FS (750k-5M)' :
                     seg === 'TS' ? 'TS (250k-750k)' :
                     'DM (<250k)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Triggers
                <span className="text-[10px] text-slate-400 ml-1 normal-case italic">
                  - Enter för att lägga till
                </span>
              </label>
              <input
                type="text"
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChip(triggerInput, setTriggers, setTriggerInput);
                  }
                }}
                placeholder="T.ex. Ny etablering, Expansion"
                className="w-full px-3 py-2 border-2 border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#D40511] transition-colors mb-2"
              />
              {triggers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {triggers.map((trigger, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-sm text-xs font-semibold border border-orange-200"
                    >
                      {trigger}
                      <button
                        onClick={() => handleRemoveChip(idx, setTriggers)}
                        className="hover:text-orange-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Antal leads (Mål)
              </label>
              <input
                type="range"
                min="1"
                max="1000"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>1</span>
                <span className="font-bold text-[#D40511]">{targetCount}</span>
                <span>1000</span>
              </div>
            </div>
          </div>
        )}

        {/* Common: Focus Positions */}
        <div className="space-y-3 pt-3 border-t-2 border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Fokus-Positioner & Sökord
          </h4>

          {/* Prio 1 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
              Prio 1
              <span className="text-[9px] text-slate-400 ml-1 normal-case italic">
                - Enter för att lägga till
              </span>
            </label>
            <input
              type="text"
              value={prio1Input}
              onChange={(e) => setPrio1Input(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChip(prio1Input, setPrio1, setPrio1Input);
                }
              }}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-sm text-xs focus:outline-none focus:border-[#D40511] transition-colors mb-1"
            />
            <div className="flex flex-wrap gap-1">
              {prio1.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-sm text-[10px] font-semibold border border-red-200"
                >
                  {item}
                  <button
                    onClick={() => handleRemoveChip(idx, setPrio1)}
                    className="hover:text-red-900"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Prio 2 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
              Prio 2
              <span className="text-[9px] text-slate-400 ml-1 normal-case italic">
                - Enter för att lägga till
              </span>
            </label>
            <input
              type="text"
              value={prio2Input}
              onChange={(e) => setPrio2Input(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChip(prio2Input, setPrio2, setPrio2Input);
                }
              }}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-sm text-xs focus:outline-none focus:border-[#D40511] transition-colors mb-1"
            />
            <div className="flex flex-wrap gap-1">
              {prio2.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-sm text-[10px] font-semibold border border-yellow-200"
                >
                  {item}
                  <button
                    onClick={() => handleRemoveChip(idx, setPrio2)}
                    className="hover:text-yellow-900"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Prio 3 */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">
              Prio 3
              <span className="text-[9px] text-slate-400 ml-1 normal-case italic">
                - Enter för att lägga till
              </span>
            </label>
            <input
              type="text"
              value={prio3Input}
              onChange={(e) => setPrio3Input(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChip(prio3Input, setPrio3, setPrio3Input);
                }
              }}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-sm text-xs focus:outline-none focus:border-[#D40511] transition-colors mb-1"
            />
            <div className="flex flex-wrap gap-1">
              {prio3.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm text-[10px] font-semibold border border-blue-200"
                >
                  {item}
                  <button
                    onClick={() => handleRemoveChip(idx, setPrio3)}
                    className="hover:text-blue-900"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ice Breaker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
            Ice Breaker Ämne
          </label>
          <textarea
            value={iceBreakerTopic}
            onChange={(e) => setIceBreakerTopic(e.target.value)}
            placeholder="T.ex. Hållbar logistik, E-handel tillväxt, Internationell expansion..."
            rows={2}
            className="w-full px-3 py-2 border-2 border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#D40511] transition-colors resize-none"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isLoading || (mode === 'single' && !companyName)}
          className="w-full bg-[#D40511] text-white py-3 px-4 rounded-sm font-black text-sm uppercase tracking-wider shadow-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Söker...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Kör Protokoll
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EnhancedSearchPanel;
