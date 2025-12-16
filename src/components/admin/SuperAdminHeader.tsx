import React, { useState, useRef, useEffect } from 'react';
import { Settings, ChevronDown, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import lsaLogo from '../../assets/lsa-logo.svg';

interface SuperAdminHeaderProps {
  onNavigateToDashboard?: () => void;
}

export const SuperAdminHeader: React.FC<SuperAdminHeaderProps> = ({ 
  onNavigateToDashboard
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-[#FFC400] shadow-md sticky top-0 z-50 border-b-4 border-black">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          
          {/* LEFT: LSA LOGO */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {onNavigateToDashboard ? (
                <button onClick={onNavigateToDashboard} className="hover:opacity-80 transition-opacity">
                  <img 
                    src={lsaLogo} 
                    alt="LSA Super Admin" 
                    className="h-12 w-auto"
                  />
                </button>
              ) : (
                <img 
                  src={lsaLogo} 
                  alt="LSA Super Admin" 
                  className="h-12 w-auto"
                />
              )}
              
              {/* Subtitle */}
              <div className="hidden lg:block border-l-2 border-[#8B5CF6]/20 pl-4">
                <div className="text-[#8B5CF6] font-black italic uppercase tracking-widest text-lg leading-none">
                  Super Admin
                </div>
                <div className="text-[10px] text-black font-bold uppercase tracking-wide opacity-80">
                  System Management
                </div>
              </div>
            </div>
          </div>
          
          {/* RIGHT: USER & ACTIONS */}
          <div className="flex items-center gap-3">
             
             {/* ADMIN BADGE */}
             <div className="flex items-center gap-2 bg-[#FFC400] text-black px-4 py-2 rounded-none shadow-sm border-2 border-black">
               <Shield className="w-4 h-4" />
               <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Super Admin</span>
             </div>

              <div className="w-px h-6 bg-black/10 mx-1"></div>

              <div className="flex items-center gap-2 bg-white/50 px-3 py-2 rounded-sm border border-black/5">
                <User className="w-4 h-4 text-[#8B5CF6]" />
                <span className="text-xs font-semibold text-slate-700">{user?.name || user?.email}</span>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-2 bg-white/50 hover:bg-white text-slate-700 hover:text-[#8B5CF6] px-3 py-2 rounded-sm transition-colors shadow-sm border border-black/5"
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
