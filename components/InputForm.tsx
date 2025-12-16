import React, { useState, useEffect } from 'react';
import { SearchFormData } from '../types';
import { Search, Building2, MapPin, DollarSign, Users, Briefcase, Zap, X, UserSearch, HelpCircle, Activity } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: SearchFormData) => void;
  isLoading: boolean;
  protocolMode: 'quick' | 'deep' | 'batch_prospecting' | 'deep_pro' | 'groq_fast' | 'groq_deep';
  setProtocolMode: (mode: 'quick' | 'deep' | 'batch_prospecting' | 'deep_pro' | 'groq_fast' | 'groq_deep') => void;
  onOpenTour?: () => void; // New prop
  demoDataTrigger?: { type: 'single' | 'batch', timestamp: number } | null; // New prop to trigger fill
  resetTrigger?: number; // New prop for resetting form
  apiCallCount?: number; // New prop for API usage stats
}

// Internal reusable Chip Input Component
const ChipInput = ({ 
  label, 
  chips, 
  onAdd, 
  onRemove, 
  placeholder, 
  icon: Icon,
  helperText 
}: {
  label: string;
  chips: string[];
  onAdd: (val: string) => void;
  onRemove: (val: string) => void;
  placeholder: string;
  icon: React.ElementType;
  helperText?: string;
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputVal.trim();
      if (trimmed && !chips.includes(trimmed)) {
        onAdd(trimmed);
        setInputVal('');
      }
    }
  };

  return (
    <div className="mb-2">
      <label className="block text-xs font-bold text-slate-800 mb-1 flex justify-between">
        <span className="flex items-center gap-1">
          <Icon className="w-3 h-3 text-[#2563EB]" />
          {label}
        </span>
        <span className="text-[9px] font-normal text-slate-500 italic self-center">Enter för att lägga till</span>
      </label>
      
      <div className="border border-slate-300 p-1.5 bg-white rounded-none focus-within:ring-1 focus-within:ring-[#2563EB] focus-within:border-[#2563EB]">
        <div className="flex flex-wrap gap-1 mb-1">
          {chips.map((chip, index) => (
            <span key={index} className="bg-slate-100 border border-slate-300 text-slate-800 text-[10px] font-semibold px-1.5 py-0.5 flex items-center gap-1 rounded-sm">
              {chip}
              <button 
                type="button" 
                onClick={() => onRemove(chip)}
                className="hover:text-[#2563EB] focus:outline-none"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chips.length === 0 ? placeholder : "Lägg till..."}
            className="block w-full border-none focus:ring-0 text-xs p-0.5 placeholder:text-slate-400 placeholder:italic"
          />
        </div>
      </div>
      {helperText && (
        <p className="mt-0.5 text-[9px] text-slate-500 italic leading-tight">
          {helperText}
        </p>
      )}
    </div>
  );
};

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, protocolMode, setProtocolMode, onOpenTour, demoDataTrigger, resetTrigger, apiCallCount }) => {
  
  // Default Roles
  const DEFAULT_PRIO_1 = [
    "Head of Logistics", 
    "Logistics Manager", 
    "Fulfillment Manager", 
    "Last Mile", 
    "Logistikchef", 
    "COO"
  ];
  const DEFAULT_PRIO_2 = [
    "Head of Ecommerce", 
    "Ecommerce Manager", 
    "Head of Operations", 
    "Supply Chain Manager", 
    "Inköpschef"
  ];
  const DEFAULT_PRIO_3 = ["CEO", "CFO", "VD"];

  const [formData, setFormData] = useState<SearchFormData>({
    companyNameOrOrg: '',
    geoArea: '',
    financialScope: '',
    triggers: '',
    leadCount: 3,
    // batchMode is now handled by prop protocolMode
    focusRole1: '',
    focusRole2: '',
    focusRole3: '',
    icebreakerTopic: '',
    specificPerson: '' 
  });

  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  
  // State for Chips
  const [triggerChips, setTriggerChips] = useState<string[]>([]);
  const [prio1Chips, setPrio1Chips] = useState<string[]>(DEFAULT_PRIO_1);
  const [prio2Chips, setPrio2Chips] = useState<string[]>(DEFAULT_PRIO_2);
  const [prio3Chips, setPrio3Chips] = useState<string[]>(DEFAULT_PRIO_3);

  // Sync chips to formData whenever they change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      triggers: triggerChips.join(', '),
      focusRole1: prio1Chips.join(', '),
      focusRole2: prio2Chips.join(', '),
      focusRole3: prio3Chips.join(', ')
    }));
  }, [triggerChips, prio1Chips, prio2Chips, prio3Chips]);

  // Handle RESET trigger
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      setFormData({
        companyNameOrOrg: '',
        geoArea: '',
        financialScope: '',
        triggers: '',
        leadCount: 3,
        focusRole1: '',
        focusRole2: '',
        focusRole3: '',
        icebreakerTopic: '',
        specificPerson: ''
      });
      setTriggerChips([]);
      // Reset roles to defaults
      setPrio1Chips(DEFAULT_PRIO_1);
      setPrio2Chips(DEFAULT_PRIO_2);
      setPrio3Chips(DEFAULT_PRIO_3);
    }
  }, [resetTrigger]);

  // Handle Demo Data Filling from Tour
  useEffect(() => {
    if (demoDataTrigger) {
      if (demoDataTrigger.type === 'single') {
        setActiveTab('single');
        setFormData(prev => ({ ...prev, companyNameOrOrg: 'RevolutionRace AB' }));
        setProtocolMode('deep');
      } else {
        setActiveTab('batch');
        setFormData(prev => ({ ...prev, geoArea: 'Borås', financialScope: 'KAM', leadCount: 3 }));
        setProtocolMode('batch_prospecting'); // Default to v6.6 for Batch Demo
      }
    }
  }, [demoDataTrigger, setProtocolMode]);

  // Handle Tab Switch with Strict Cleaning & Default Protocol Switching
  const handleTabChange = (tab: 'single' | 'batch') => {
    setActiveTab(tab);
    
    if (tab === 'single') {
      // Clean Batch fields when switching to Single
      setFormData(prev => ({
        ...prev,
        geoArea: '',
        financialScope: '',
      }));
      // Set Default Protocol for Single -> Deep
      setProtocolMode('deep');

    } else {
      // Clean Single fields when switching to Batch
      setFormData(prev => ({
        ...prev,
        companyNameOrOrg: '',
        specificPerson: '',
        // Set Default "All" for simpler searching
        financialScope: 'Alla' 
      }));
       // Set Default Protocol for Batch -> Batch Prospecting (v6.6)
      setProtocolMode('batch_prospecting');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'leadCount' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double check cleanup before submit
    const submissionData = { ...formData };
    if (activeTab === 'batch') {
      submissionData.companyNameOrOrg = '';
      submissionData.specificPerson = '';
    } else {
      submissionData.geoArea = '';
      submissionData.financialScope = '';
    }

    onSubmit(submissionData);
  };

  return (
    <div className="bg-white rounded-none shadow-lg border-t-4 border-[#2563EB] overflow-hidden">
      <div className="bg-[#4F46E5] p-3 text-black flex items-center justify-between border-b border-[#2563EB]/10">
        <h2 className="text-sm font-bold italic flex items-center gap-2">
          <Search className="w-4 h-4 text-[#2563EB]" />
          Konfigurera Sökning
        </h2>
        
        <div className="flex items-center gap-2">
          {apiCallCount !== undefined && (
            <div className="flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded-full" title="Antal API-anrop idag">
              <Activity className="w-3 h-3 text-[#2563EB]" />
              <span className="text-[10px] font-bold font-mono">{apiCallCount}</span>
            </div>
          )}
          
          {onOpenTour && (
            <button 
              onClick={onOpenTour}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
              title="Starta Guidad Tur"
            >
              <HelpCircle className="w-4 h-4 text-black" />
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          id="tab-single"
          type="button"
          onClick={() => handleTabChange('single')}
          className={`flex-1 py-2 px-3 text-xs font-bold transition-colors uppercase tracking-wide ${
            activeTab === 'single' 
              ? 'bg-white text-[#2563EB] border-b-2 border-[#2563EB]' 
              : 'text-slate-500 hover:bg-slate-50 bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Building2 className="w-3 h-3" />
            Enstaka
          </div>
        </button>
        <button
          id="tab-batch"
          type="button"
          onClick={() => handleTabChange('batch')}
          className={`flex-1 py-2 px-3 text-xs font-bold transition-colors uppercase tracking-wide ${
            activeTab === 'batch' 
              ? 'bg-white text-[#2563EB] border-b-2 border-[#2563EB]' 
              : 'text-slate-500 hover:bg-slate-50 bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-3 h-3" />
            Batch
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-3 space-y-3">
        
        {/* MODE 1: SINGLE COMPANY */}
        {activeTab === 'single' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Sök på företagsnamn / Org.nr
                </label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-[#2563EB]" />
                  <input
                    id="input-company"
                    type="text"
                    name="companyNameOrOrg"
                    value={formData.companyNameOrOrg}
                    onChange={handleChange}
                    placeholder="t.ex. RevolutionRace AB / 556754-5262"
                    className="pl-8 block w-full rounded-none border-slate-300 shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] text-xs border p-2"
                    autoFocus
                  />
                </div>
              </div>

              {/* SPECIFIC PERSON SEARCH FIELD */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  Sök Specifik Person (Valfritt)
                  <span className="text-[9px] font-normal text-slate-400 italic">- Extra personanalys</span>
                </label>
                <div className="relative">
                  <UserSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="specificPerson"
                    value={formData.specificPerson || ''}
                    onChange={handleChange}
                    placeholder="t.ex. Anders Andersson"
                    className="pl-8 block w-full rounded-none border-slate-300 shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] text-xs border p-2"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                Sökningen använder automatiskt det protokoll som är valt i menyn (Rek: Djupanalys).
              </p>
            </div>
          </div>
        )}

        {/* MODE 2: BATCH SEARCH */}
        {activeTab === 'batch' && (
          <div className="space-y-3 animate-fadeIn">
            
            {/* Note: Protocol Selector Removed from here, now in Header */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Geografiskt område
                </label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-[#2563EB]" />
                  <input
                    id="input-geo"
                    type="text"
                    name="geoArea"
                    value={formData.geoArea}
                    onChange={handleChange}
                    placeholder="Ort/Postnr"
                    className="pl-8 block w-full rounded-none border-slate-300 shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] text-xs border p-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Fraktomsättning (Est.)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-[#2563EB]" />
                  <select
                    id="input-segment"
                    name="financialScope"
                    value={formData.financialScope}
                    onChange={handleChange}
                    className="pl-8 block w-full rounded-none border-slate-300 shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] text-xs border p-2 bg-white"
                  >
                    <option value="Alla">Alla (Enklast)</option>
                    <option value="KAM">KAM (≥ 5M)</option>
                    <option value="FS">FS (750k - 5M)</option>
                    <option value="TS">TS (250k - 750k)</option>
                    <option value="DM">DM (&lt; 250k)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Triggers Chip Input */}
            <div id="section-triggers">
              <ChipInput
                label="Triggers"
                icon={Zap}
                chips={triggerChips}
                onAdd={(val) => setTriggerChips([...triggerChips, val])}
                onRemove={(val) => setTriggerChips(triggerChips.filter(c => c !== val))}
                placeholder="Ex. Lagerflytt, Export..."
                helperText={triggerChips.length === 0 ? "Tomt = Auto DHL-signaler." : undefined}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex justify-between">
                <span>Antal leads (Mål)</span>
                {formData.leadCount > 20 && <span className="text-[#2563EB] italic text-[10px]">Batch-loop aktiv</span>}
              </label>
              <div className="flex items-center gap-2">
                 <input
                  type="number"
                  name="leadCount"
                  min="1"
                  max="100"
                  value={formData.leadCount}
                  onChange={handleChange}
                  className="block w-20 rounded-none border-slate-300 shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] text-xs border p-2 text-center font-bold"
                />
                <input
                  type="range"
                  name="leadCount"
                  min="1"
                  max="100"
                  value={formData.leadCount}
                  onChange={handleChange}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 px-1">
                <span>1</span>
                <span>100</span>
              </div>
            </div>
          </div>
        )}

        {/* COMMON INPUTS (ROLES & ICEBREAKER) */}
        <div id="section-roles" className="border-t border-slate-200 pt-3">
          <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1 uppercase tracking-wide">
            <Briefcase className="w-3 h-3 text-[#2563EB]" />
            Fokus-Positioner & Sökord
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-0 mb-2">
            <ChipInput
              label="Roll / Sökord Prio 1"
              icon={Users}
              chips={prio1Chips}
              onAdd={(val) => setPrio1Chips([...prio1Chips, val])}
              onRemove={(val) => setPrio1Chips(prio1Chips.filter(c => c !== val))}
              placeholder="Titel eller Funktion (t.ex. Last Mile)..."
            />
             <ChipInput
              label="Roll / Sökord Prio 2"
              icon={Users}
              chips={prio2Chips}
              onAdd={(val) => setPrio2Chips([...prio2Chips, val])}
              onRemove={(val) => setPrio2Chips(prio2Chips.filter(c => c !== val))}
              placeholder="Titel eller Funktion..."
            />
             <ChipInput
              label="Roll / Sökord Prio 3"
              icon={Users}
              chips={prio3Chips}
              onAdd={(val) => setPrio3Chips([...prio3Chips, val])}
              onRemove={(val) => setPrio3Chips(prio3Chips.filter(c => c !== val))}
              placeholder="Titel eller Funktion..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Ice Breaker Ämne
            </label>
            <textarea
              name="icebreakerTopic"
              value={formData.icebreakerTopic}
              onChange={handleChange}
              rows={2}
              placeholder="Ämne för inledning..."
              className="block w-full rounded-none border-slate-300 shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] text-xs border p-2"
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-none shadow-sm text-sm font-bold text-white bg-[#2563EB] hover:bg-[#b0040e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] transition-all uppercase tracking-wider ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Kör Protokoll'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputForm;