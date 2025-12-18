import React, { useState } from 'react';
import { 
  Settings, Users, Key, Database, Wrench, 
  LogOut, Menu, X, ChevronDown, Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  onOpenTools?: (tool: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenTools }) => {
  const { user, logout } = useAuth();
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isSuperAdmin = user?.role === 'admin' && !user?.tenant_id;

  const tools = isSuperAdmin ? [
    { id: 'api-keys', label: 'API-nycklar', icon: Key },
    { id: 'tenants', label: 'Hantera Tenants', icon: Database },
    { id: 'users', label: 'Hantera Användare', icon: Users },
    { id: 'scraping', label: 'Konfigurera Scraping', icon: Wrench },
    { id: 'quota', label: 'Konfigurera Quota', icon: Settings },
  ] : [
    { id: 'settings', label: 'Inställningar', icon: Settings },
  ];

  const handleToolClick = (toolId: string) => {
    setShowToolsMenu(false);
    onOpenTools?.(toolId);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#FFC400] rounded flex items-center justify-center">
                <span className="text-black font-black text-xl">LH</span>
              </div>
              <div>
                <h1 className="text-lg font-black text-black uppercase tracking-tight">
                  Lead Hunter
                </h1>
                <p className="text-xs text-gray-500">
                  {isSuperAdmin ? 'SuperAdmin' : user?.tenant_name || 'Dashboard'}
                </p>
              </div>
            </div>
          </div>

          {/* Center - Tools Menu */}
          <div className="flex items-center gap-4">
            {/* Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold text-sm"
              >
                <Wrench className="w-4 h-4" />
                Verktyg
                <ChevronDown className={`w-4 h-4 transition-transform ${showToolsMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showToolsMenu && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {tools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(tool.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <Icon className="w-5 h-5 text-gray-600" />
                          <span className="font-semibold text-gray-800">{tool.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>

          {/* Right - User Menu */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-[#FFC400] rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-sm">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold text-gray-800">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute top-full mt-2 right-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {isSuperAdmin ? 'SuperAdmin' : user?.role}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleToolClick('settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-800">Inställningar</span>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-semibold text-red-600">Logga ut</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showToolsMenu || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowToolsMenu(false);
            setShowUserMenu(false);
          }}
        ></div>
      )}
    </div>
  );
};
