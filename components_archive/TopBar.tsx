import React, { useState } from 'react';
import { 
  Settings, Database, Target, XCircle, HardDrive, RefreshCw, 
  User, LogOut, Bell, ChevronDown, Activity 
} from 'lucide-react';

interface TopBarProps {
  currentUser?: {
    name: string;
    role: 'admin' | 'terminal_chef' | 'manager' | 'salesperson';
  };
  selectedProtocol?: string;
  selectedLLM?: string;
  onProtocolChange?: (protocol: string) => void;
  onLLMChange?: (llm: string) => void;
  onRefresh?: () => void;
  onLogout?: () => void;
  notifications?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser = { name: 'Anna Andersson', role: 'salesperson' },
  selectedProtocol = 'Djupanalys',
  selectedLLM = 'GPT-4',
  onProtocolChange,
  onLLMChange,
  onRefresh,
  onLogout,
  notifications = 3
}) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isAdmin = currentUser.role === 'admin';
  const isTerminalChef = currentUser.role === 'terminal_chef';

  return (
    <div className="bg-[#FFCC00] shadow-lg">
      {/* Main Top Bar */}
      <div className="border-b-2 border-[#D40511]">
        <div className="max-w-[1920px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            
            {/* Left: Logo + Branding */}
            <div className="flex items-center gap-4">
              {/* DHL Logo */}
              <div className="bg-[#D40511] text-[#FFCC00] px-4 py-2 font-black text-2xl italic">
                DHL
              </div>
              
              {/* Divider */}
              <div className="w-px h-8 bg-[#D40511]"></div>
              
              {/* Branding */}
              <div>
                <h1 className="text-2xl font-black italic text-black uppercase leading-tight">
                  Lead Hunter
                </h1>
                <p className="text-xs font-bold text-black uppercase tracking-wider">
                  Sales Intelligence
                </p>
              </div>
            </div>

            {/* Center: Protocol & LLM Selector */}
            <div className="flex items-center gap-4">
              {/* Divider */}
              <div className="w-px h-8 bg-[#D40511]"></div>
              
              {/* Protocol Selector */}
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-black uppercase tracking-wide mb-1">
                  Protokoll
                </label>
                <select
                  value={selectedProtocol}
                  onChange={(e) => onProtocolChange?.(e.target.value)}
                  className="bg-white border-2 border-[#D40511] rounded-sm px-3 py-1 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#D40511]"
                >
                  <option value="Snabbanalys">Snabbanalys</option>
                  <option value="Standardanalys">Standardanalys</option>
                  <option value="Djupanalys">Djupanalys (Rek)</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              {/* LLM Selector */}
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-black uppercase tracking-wide mb-1">
                  LLM
                </label>
                <select
                  value={selectedLLM}
                  onChange={(e) => onLLMChange?.(e.target.value)}
                  className="bg-white border-2 border-[#D40511] rounded-sm px-3 py-1 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#D40511]"
                >
                  <option value="GPT-4">GPT-4</option>
                  <option value="GPT-4-Turbo">GPT-4 Turbo</option>
                  <option value="Claude-3">Claude 3</option>
                  <option value="Gemini-Pro">Gemini Pro</option>
                </select>
              </div>
            </div>

            {/* Right: Tools, Notifications, Refresh, User */}
            <div className="flex items-center gap-3">
              
              {/* Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                  className="flex items-center gap-2 bg-white border-2 border-[#D40511] rounded-sm px-4 py-2 text-sm font-bold text-black hover:bg-slate-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Verktyg
                  <ChevronDown className={`w-4 h-4 transition-transform ${showToolsMenu ? 'rotate-180' : ''}`} />
                </button>

                {showToolsMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border-2 border-[#D40511] rounded-sm shadow-xl z-50">
                    {isAdmin && (
                      <>
                        <button className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-200 transition-colors">
                          <Activity className="w-4 h-4 text-[#D40511]" />
                          <span className="text-sm font-semibold">Visa Systemstatus</span>
                        </button>
                        <button className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-200 transition-colors">
                          <Database className="w-4 h-4 text-[#D40511]" />
                          <span className="text-sm font-semibold">Reservoir Cache</span>
                        </button>
                      </>
                    )}
                    <button className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-200 transition-colors">
                      <Target className="w-4 h-4 text-[#D40511]" />
                      <span className="text-sm font-semibold">Riktad Sökning - Välj SNI</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-200 transition-colors">
                      <XCircle className="w-4 h-4 text-[#D40511]" />
                      <span className="text-sm font-semibold">Exkluderingar</span>
                    </button>
                    {isAdmin && (
                      <button className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                        <HardDrive className="w-4 h-4 text-[#D40511]" />
                        <span className="text-sm font-semibold">System Backups</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={onRefresh}
                className="bg-[#D40511] text-white border-2 border-[#D40511] rounded-sm px-4 py-2 text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                title="Uppdatera data"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-[#D40511]"></div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative bg-white border-2 border-[#D40511] rounded-sm p-2 hover:bg-slate-50 transition-colors"
                  title="Meddelanden"
                >
                  <Bell className="w-5 h-5 text-[#D40511]" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#D40511] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-[#D40511] rounded-sm shadow-xl z-50 max-h-96 overflow-y-auto">
                    <div className="bg-[#D40511] text-white px-4 py-2 font-bold text-sm">
                      Meddelanden ({notifications})
                    </div>
                    <div className="divide-y divide-slate-200">
                      <div className="px-4 py-3 hover:bg-slate-50">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">Ny bevakning: Boozt Fashion AB</p>
                            <p className="text-xs text-slate-600 mt-1">Trigger: Omsättningsökning +25%</p>
                            <p className="text-[10px] text-slate-400 mt-1">För 2 timmar sedan</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">Nytt tilldelat lead</p>
                            <p className="text-xs text-slate-600 mt-1">Ellos AB har tilldelats dig</p>
                            <p className="text-[10px] text-slate-400 mt-1">För 5 timmar sedan</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-50">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">Analys klar</p>
                            <p className="text-xs text-slate-600 mt-1">RevolutionRace AB - Opportunity Score: 85</p>
                            <p className="text-[10px] text-slate-400 mt-1">Igår 14:30</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-white border-2 border-[#D40511] rounded-sm px-4 py-2 text-sm font-bold text-black hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  {currentUser.name}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-[#D40511] rounded-sm shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{currentUser.role.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 transition-colors text-[#D40511] font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      Logga ut
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
