import React, { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { Lock, Mail } from 'lucide-react';

// API Configuration - inline to ensure it works in production
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction 
  ? '/api'
  : 'http://localhost:3001/api';

interface TenantInfo {
  id: string;
  name: string;
  domain: string;
  subdomain: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  searchTerm: string;
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [isSuperAdminLogin, setIsSuperAdminLogin] = useState(true);
  const { login } = useAuth();

  useEffect(() => {
    // Kolla först efter tenant-parameter i URL
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    
    if (tenantParam) {
      // Hämta tenant info från backend baserat på subdomain-parameter
      fetch(`${API_BASE_URL}/tenant-auth/info?subdomain=${tenantParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.tenant) {
            setTenantInfo(data.tenant);
            setIsSuperAdminLogin(false);
            // Sätt CSS-variabler för tenant-färger
            document.documentElement.style.setProperty('--tenant-primary', data.tenant.primaryColor);
            document.documentElement.style.setProperty('--tenant-secondary', data.tenant.secondaryColor);
          } else {
            setIsSuperAdminLogin(true);
          }
        })
        .catch(() => setIsSuperAdminLogin(true));
      return;
    }
    
    // Annars, detektera subdomän från URL
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Om localhost eller ingen subdomän, visa super admin login
    if (hostname === 'localhost' || parts.length < 3) {
      setIsSuperAdminLogin(true);
      return;
    }
    
    // Extrahera subdomän (första delen)
    const subdomain = parts[0];
    
    // Hämta tenant info från backend
    fetch(`${API_BASE_URL}/tenant-auth/info?subdomain=${subdomain}`)
      .then(res => res.json())
      .then(data => {
        if (data.tenant) {
          setTenantInfo(data.tenant);
          setIsSuperAdminLogin(false);
          // Sätt CSS-variabler för tenant-färger
          document.documentElement.style.setProperty('--tenant-primary', data.tenant.primaryColor);
          document.documentElement.style.setProperty('--tenant-secondary', data.tenant.secondaryColor);
        } else {
          setIsSuperAdminLogin(true);
        }
      })
      .catch(() => setIsSuperAdminLogin(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError('Felaktigt användarnamn eller lösenord');
    } finally {
      setIsLoading(false);
    }
  };

  const companyName = tenantInfo?.name || 'Lead Hunter';
  const searchTerm = tenantInfo?.searchTerm || 'EurekAI';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, var(--tenant-primary) 0, var(--tenant-primary) 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Login Card */}
        <div className="bg-white shadow-2xl overflow-hidden">
          {/* Header with Corporate Identity */}
          <div className="p-8 text-center relative bg-white border-b-2 border-gray-200">
            <div className="h-20 mx-auto mb-4 flex items-center justify-center">
              {tenantInfo?.logoUrl ? (
                <img src={tenantInfo.logoUrl} alt={companyName} className="h-16 object-contain" />
              ) : (
                <img 
                  src="/eurekai-logo.svg" 
                  alt="EUREKAI" 
                  className="h-12 w-auto"
                />
              )}
            </div>
            {!isSuperAdminLogin && (
              <div className="mt-4">
                <h1 className="text-xl font-bold text-gray-800">
                  {companyName}
                </h1>
              </div>
            )}
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mt-3">
              Sales Intelligence Platform
            </p>
          </div>

          {/* Login Form */}
          <div className="p-8 bg-white">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-black uppercase tracking-wide">
                Välkommen
              </h2>
              <div className="w-16 h-1 mx-auto mt-2 bg-[#FFC400]"></div>
            </div>

            {error && (
              <div className="bg-error/10 border-l-4 border-error p-4 mb-6">
                <p className="text-sm text-error font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-black uppercase tracking-wide mb-2">
                  E-post
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 focus:ring-0 transition-colors font-medium"
                    style={{ borderColor: 'rgb(209 213 219)', outlineColor: tenantInfo?.primaryColor || '#FFC400' }}
                    placeholder={isSuperAdminLogin ? 'admin@leadhunter.com' : `din.email@${tenantInfo?.domain || 'company.se'}`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-black uppercase tracking-wide mb-2">
                  Lösenord
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 focus:focus:ring-0 transition-colors font-medium"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full text-black font-black py-4 px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Loggar in...
                  </span>
                ) : (
                  'Logga in'
                )}
              </button>
            </form>

            {isSuperAdminLogin && (
              <div className="mt-8 pt-6 border-t-2 border-gray-100">
                <div className="bg-[#FFC400]/10 p-4 border-l-4 border-[#FFC400]">
                  <p className="text-xs font-bold text-black uppercase tracking-wide mb-2">Super Admin:</p>
                  <p className="text-sm font-semibold text-black">admin@leadhunter.com</p>
                  <p className="text-xs text-gray-600 mt-1">Lösenord: <span className="font-semibold">LeadHunter2024!</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Stripe */}
          <div className="h-2 bg-[#FFC400]"></div>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs font-bold text-black/70 mt-6 uppercase tracking-wide">
          &copy; 2024 {isSuperAdminLogin ? 'Lead Hunter' : companyName}
        </p>
      </div>
    </div>
  );
};
