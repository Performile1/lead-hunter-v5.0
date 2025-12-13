

import React, { useState, useRef, useEffect } from 'react';
import { ShieldBan, Target, RotateCcw, Settings2, Database, Save, Settings, ChevronDown, Terminal, Activity, FolderOpen, LogOut, User, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationCenter } from '../src/components/notifications/NotificationCenter';

interface HeaderProps {
  onOpenExclusions: () => void;
  onOpenInclusions: () => void;
  onOpenCache: () => void;
  onOpenBriefing: () => void; 
  onOpenBackups: () => void;
  onOpenCronjobs?: () => void;
  onOpenSettings?: () => void;
  onNavigateToDashboard?: () => void;
  inclusionCount: number;
  exclusionCount: number;
  cacheCount: number;
  protocolMode: 'quick' | 'deep' | 'deep_pro' | 'groq_fast' | 'groq_deep' | 'batch_prospecting';
  setProtocolMode: (mode: 'quick' | 'deep' | 'deep_pro' | 'groq_fast' | 'groq_deep' | 'batch_prospecting') => void;
  onReset: () => void;
  showCustomerList?: boolean;
  onToggleCustomerList?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenExclusions, 
  onOpenInclusions,
  onOpenCache,
  onOpenBriefing,
  onOpenBackups,
  onOpenCronjobs,
  onOpenSettings,
  onNavigateToDashboard,
  inclusionCount,
  exclusionCount,
  cacheCount,
  protocolMode,
  setProtocolMode,
  onReset,
  showCustomerList = false,
  onToggleCustomerList,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalBadgeCount = cacheCount + inclusionCount + exclusionCount;

  return (
    <header className="bg-[#FFCC00] shadow-md sticky top-0 z-50 border-b-4 border-[#D40511]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          
          {/* LEFT: LOGO & PROTOCOL SELECTOR */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {/* DHL Logo Image - Clickable to Dashboard */}
              {onNavigateToDashboard ? (
                <button onClick={onNavigateToDashboard} className="hover:opacity-80 transition-opacity">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg" 
                    alt="Lead Hunter" 
                    className="h-10 w-auto"
                  />
                </button>
              ) : (
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/a/ac/DHL_Logo.svg" 
                  alt="DHL Lead Hunter" 
                  className="h-10 w-auto"
                />
              )}
              
              {/* Subtitle */}
              <div className="hidden lg:block border-l-2 border-[#D40511]/20 pl-4">
                <div className="text-[#D40511] font-black italic uppercase tracking-widest text-lg leading-none">
                  Lead Hunter
                </div>
                <div className="text-[10px] text-black font-bold uppercase tracking-wide opacity-80">
                  Sales Intelligence
                </div>
              </div>
            </div>

            {/* Protocol Selector Dropdown */}
            <div className="hidden xl:flex items-center gap-2 ml-4 border-l border-[#D40511]/10 pl-4">
               <div className="flex items-center gap-2 bg-white/50 px-2 py-1 rounded-sm border border-black/5 hover:bg-white transition-colors">
                 <Settings2 className="w-4 h-4 text-[#D40511]" />
                 <div className="flex flex-col">
                   <span className="text-[8px] text-black/60 uppercase font-bold leading-none mb-0.5">Analys Protokoll</span>
                   <select 
                      value={protocolMode}
                      onChange={(e) => setProtocolMode(e.target.value as any)}
                      className="bg-transparent border-none p-0 text-xs font-bold text-black focus:ring-0 cursor-pointer w-[200px] leading-none"
                   >
                     <option value="deep_pro">v8.2 Djupanalys (PRO - Gemini 3)</option>
                     <option value="deep">v8.2 Djupanalys (Standard)</option>
                     <option value="groq_fast">v8.3 Groq Snabbanalys (Llama 3.1)</option>
                     <option value="groq_deep">v8.4 Groq Djupanalys (Llama 3.1)</option>
                     <option value="quick">v6.1 Snabbskanning</option>
                     <option value="batch_prospecting">v6.6 Batch (Prospektering)</option>
                   </select>
                 </div>
               </div>
            </div>
          </div>
          
          {/* RIGHT: ACTION BUTTONS */}
          <div className="flex items-center gap-3">
             
             {/* NOTIFICATION CENTER */}
             <NotificationCenter />
             
             {/* TOOLS DROPDOWN */}
             <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm transition-colors shadow-sm border border-black/5 group ${isMenuOpen ? 'bg-white text-black' : 'bg-white/50 hover:bg-white text-slate-800'}`}
                  title="Öppna Verktygsmeny"
                >
                  <div className="relative">
                    <Settings className="w-4 h-4" />
                    {totalBadgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#D40511] w-2.5 h-2.5 rounded-full border border-white"></span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide hidden sm:inline">Verktyg</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white shadow-xl border-t-4 border-[#D40511] animate-fadeIn z-[60] rounded-b-sm">
                      
                      {/* SYSTEM STATUS ITEM */}
                      <button 
                        onClick={() => { onOpenBriefing(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 group border-b border-slate-100 bg-slate-50/50"
                      >
                         <Terminal className="w-4 h-4 text-slate-600 group-hover:text-black" />
                         <span className="text-sm font-medium text-slate-800">Visa Systemstatus</span>
                         <Activity className="w-3 h-3 text-green-500 ml-auto" />
                      </button>

                      <div className="p-2 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Data & Listor</span>
                      </div>
                      
                      <button 
                        onClick={() => { onOpenCache(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group border-b border-slate-50"
                      >
                        <div className="flex items-center gap-3">
                           <Database className="w-4 h-4 text-slate-600 group-hover:text-[#D40511]" />
                           <span className="text-sm font-medium text-slate-800">Reservoir (Cache)</span>
                        </div>
                        {cacheCount > 0 && (
                           <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{cacheCount}</span>
                        )}
                      </button>

                      <button 
                        onClick={() => { onOpenInclusions(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group border-b border-slate-50"
                      >
                        <div className="flex items-center gap-3">
                           <Target className="w-4 h-4 text-slate-600 group-hover:text-green-600" />
                           <span className="text-sm font-medium text-slate-800">Riktad Sökning</span>
                        </div>
                        {inclusionCount > 0 && (
                           <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{inclusionCount}</span>
                        )}
                      </button>

                      <button 
                        onClick={() => { onOpenExclusions(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                           <ShieldBan className="w-4 h-4 text-slate-600 group-hover:text-[#D40511]" />
                           <span className="text-sm font-medium text-slate-800">Exkluderingar</span>
                        </div>
                        {exclusionCount > 0 && (
                           <span className="bg-red-100 text-[#D40511] text-[10px] font-bold px-2 py-0.5 rounded-full">{exclusionCount}</span>
                        )}
                      </button>

                      <div className="p-2 border-b border-t border-slate-100 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Lagring</span>
                      </div>

                      <button 
                        onClick={() => { onOpenBackups(); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 group border-b border-slate-100"
                      >
                         <FolderOpen className="w-4 h-4 text-slate-600 group-hover:text-blue-600" />
                         <span className="text-sm font-medium text-slate-800">System Backups</span>
                      </button>

                      <div className="p-2 border-b border-t border-slate-100 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Admin & Automation</span>
                      </div>

                      {onOpenCronjobs && (
                        <button 
                          onClick={() => { onOpenCronjobs(); setIsMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 group"
                        >
                           <Clock className="w-4 h-4 text-slate-600 group-hover:text-[#D40511]" />
                           <span className="text-sm font-medium text-slate-800">Cronjobs</span>
                           <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-auto font-bold">ALLA ROLLER</span>
                        </button>
                      )}

                      {onOpenSettings && (
                        <button 
                          onClick={() => { onOpenSettings(); setIsMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 group"
                        >
                           <Settings className="w-4 h-4 text-slate-600 group-hover:text-[#D40511]" />
                           <span className="text-sm font-medium text-slate-800">Systeminställningar</span>
                           <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded ml-auto font-bold">ADMIN</span>
                        </button>
                      )}

                  </div>
                )}
             </div>

              <div className="w-px h-6 bg-black/10 mx-1"></div>

              {onToggleCustomerList && (
                <button 
                  onClick={onToggleCustomerList}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm transition-colors shadow-sm font-bold text-sm uppercase ${
                    showCustomerList 
                      ? 'bg-[#FFCC00] text-black hover:bg-[#e6b800]' 
                      : 'bg-white/50 hover:bg-white text-slate-700 border border-black/5'
                  }`}
                  title={showCustomerList ? 'Visa Leads' : 'Visa Kundlista'}
                >
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">{showCustomerList ? 'Leads' : 'Kunder'}</span>
                </button>
              )}

              <div className="w-px h-6 bg-black/10 mx-1"></div>

              <button 
                onClick={onReset}
                className="flex items-center gap-2 bg-[#D40511] hover:bg-[#a0040d] text-white px-3 py-2 rounded-sm transition-colors shadow-sm"
                title="Systemåterställning (Nollställ vyn, behåll data)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-black/10 mx-1"></div>

              {user?.role === 'super_admin' && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white px-3 py-2 rounded-sm shadow-sm">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Super Admin</span>
                </div>
              )}

              <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-sm border border-black/5">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">{user?.name || user?.email}</span>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 bg-white/50 hover:bg-white text-slate-700 hover:text-[#D40511] px-3 py-2 rounded-sm transition-colors shadow-sm border border-black/5"
                title="Logga ut"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Logga ut</span>
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};