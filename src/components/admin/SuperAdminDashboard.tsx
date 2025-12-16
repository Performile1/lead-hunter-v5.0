import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Package, ShoppingCart, Truck, 
  Activity, Database, Clock, BarChart3, PieChart,
  Globe, Store, CreditCard, Home, Building2, Settings,
  Search, AlertTriangle
} from 'lucide-react';
import { TenantManagement } from './TenantManagement';
import { SuperAdminUserManagement } from './SuperAdminUserManagement';
import { SuperAdminSettings } from './SuperAdminSettings';
import { SuperAdminLeadSearch } from './SuperAdminLeadSearch';
import { SuperAdminCustomers } from './SuperAdminCustomers';
import { ErrorReportReview } from './ErrorReportReview';

interface AnalyticsData {
  platforms: Array<{ platform: string; count: number; percentage: number }>;
  checkout_providers: Array<{ provider: string; count: number }>;
  carriers: Array<{ carrier: string; count: number }>;
  delivery_methods: Array<{ method: string; count: number }>;
  recent_activity: Array<{
    tenant_name: string;
    action_type: string;
    created_at: string;
    user_name: string;
  }>;
  system_health: {
    active_tenants: number;
    active_users: number;
    total_leads: number;
    total_customers: number;
  };
}

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'tenants' | 'users' | 'settings' | 'customers' | 'errors'>('dashboard');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch('${API_BASE_URL}/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just nu';
    if (diffMins < 60) return `${diffMins} min sedan`;
    if (diffHours < 24) return `${diffHours}h sedan`;
    return `${diffDays}d sedan`;
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login': return '🔐';
      case 'lead_created': return '📝';
      case 'customer_converted': return '✅';
      case 'data_export': return '📥';
      case 'analysis_run': return '🔍';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  // Show dashboard even if API fails, with placeholder data
  const displayData = data || {
    platforms: [],
    checkout_providers: [],
    carriers: [],
    delivery_methods: [],
    recent_activity: [],
    system_health: {
      active_tenants: 0,
      active_users: 0,
      total_leads: 0,
      total_customers: 0
    }
  };

  const calculatePercentage = (items: Array<{ count: number }>) => {
    const total = items.reduce((sum, item) => sum + Number(item.count), 0);
    return items.map(item => ({
      ...item,
      percentage: total > 0 ? ((Number(item.count) / total) * 100).toFixed(1) : '0'
    }));
  };

  const carriersWithPercentage = calculatePercentage(displayData.carriers);
  const checkoutWithPercentage = calculatePercentage(displayData.checkout_providers);
  const deliveryWithPercentage = calculatePercentage(displayData.delivery_methods);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide">
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Systemöversikt och e-handelsanalys
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2 rounded font-semibold"
        >
          <Activity className="w-4 h-4" />
          Uppdatera
        </button>
      </div>

      {/* API Warning */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Analytics API inte tillgängligt:</strong> Visar placeholder-data. Backend endpoint behöver skapas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <button onClick={() => setCurrentView('tenants')} className="bg-[#FFC400] text-black p-6 rounded-none shadow-lg hover:shadow-xl transition-all text-left border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Hantera</p>
              <p className="text-2xl font-black mt-1">Tenants</p>
              <p className="text-xs opacity-75 mt-2">Organisationer</p>
            </div>
            <Building2 className="w-12 h-12 opacity-80" />
          </div>
        </button>
        
        <button onClick={() => setCurrentView('users')} className="bg-black text-white p-6 rounded-none shadow-lg hover:shadow-xl transition-all text-left border-2 border-black hover:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Hantera</p>
              <p className="text-2xl font-black mt-1">Användare</p>
              <p className="text-xs opacity-75 mt-2">Alla användare</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </button>
        
        <button onClick={() => setCurrentView('leads')} className="bg-white text-black p-6 rounded-none shadow-lg hover:shadow-xl transition-all text-left border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Sök</p>
              <p className="text-2xl font-black mt-1">Leads</p>
              <p className="text-xs opacity-75 mt-2">Alla leads</p>
            </div>
            <Search className="w-12 h-12 opacity-80" />
          </div>
        </button>
        
        <button onClick={() => setCurrentView('customers')} className="bg-white text-black p-6 rounded-none shadow-lg hover:shadow-xl transition-all text-left border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Visa</p>
              <p className="text-2xl font-black mt-1">Kunder</p>
              <p className="text-xs opacity-75 mt-2">Alla kunder</p>
            </div>
            <Package className="w-12 h-12 opacity-80" />
          </div>
        </button>
        
        <button onClick={() => setCurrentView('errors')} className="bg-white text-black p-6 rounded-none shadow-lg hover:shadow-xl transition-all text-left border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">Granska</p>
              <p className="text-2xl font-black mt-1">Felrapporter</p>
              <p className="text-xs opacity-75 mt-2">Kvalitetskontroll</p>
            </div>
            <AlertTriangle className="w-12 h-12 opacity-80" />
          </div>
        </button>
        
        <button onClick={() => setCurrentView('settings')} className="bg-white text-black p-6 rounded-none shadow-lg hover:shadow-xl transition-all text-left border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold opacity-90">System</p>
              <p className="text-2xl font-black mt-1">Inställningar</p>
              <p className="text-xs opacity-75 mt-2">Konfiguration</p>
            </div>
            <Settings className="w-12 h-12 opacity-80" />
          </div>
        </button>
      </div>

      {/* Conditional View Rendering */}
      {currentView === 'tenants' && (
        <div>
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="mb-4 text-[#8B5CF6] hover:underline font-semibold"
          >
            ← Tillbaka till Dashboard
          </button>
          <TenantManagement />
        </div>
      )}

      {currentView === 'users' && (
        <div>
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="mb-4 text-[#8B5CF6] hover:underline font-semibold"
          >
            ← Tillbaka till Dashboard
          </button>
          <SuperAdminUserManagement />
        </div>
      )}

      {currentView === 'settings' && (
        <div>
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="mb-4 text-[#8B5CF6] hover:underline font-semibold"
          >
            ← Tillbaka till Dashboard
          </button>
          <SuperAdminSettings />
        </div>
      )}

      {currentView === 'leads' && (
        <div>
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="mb-4 text-[#8B5CF6] hover:underline font-semibold"
          >
            ← Tillbaka till Dashboard
          </button>
          <SuperAdminLeadSearch />
        </div>
      )}

      {currentView === 'customers' && (
        <div>
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="mb-4 text-[#8B5CF6] hover:underline font-semibold"
          >
            ← Tillbaka till Dashboard
          </button>
          <SuperAdminCustomers />
        </div>
      )}

      {currentView === 'errors' && (
        <div>
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className="mb-4 text-[#8B5CF6] hover:underline font-semibold"
          >
            ← Tillbaka till Dashboard
          </button>
          <ErrorReportReview />
        </div>
      )}

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
      <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Aktiva Tenants</p>
              <p className="text-3xl font-black text-[#8B5CF6] mt-1">
                {displayData.system_health.active_tenants}
              </p>
            </div>
            <Building2 className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Aktiva Användare</p>
              <p className="text-3xl font-black text-[#8B5CF6] mt-1">
                {displayData.system_health.active_users}
              </p>
            </div>
            <Users className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Totalt Leads</p>
              <p className="text-3xl font-black text-[#8B5CF6] mt-1">
                {displayData.system_health.total_leads.toLocaleString()}
              </p>
            </div>
            <Package className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Totalt Kunder</p>
              <p className="text-3xl font-black text-[#8B5CF6] mt-1">
                {displayData.system_health.total_customers.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* E-handelsplattformar */}
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="text-lg font-black text-black uppercase">E-handelsplattformar</h2>
          </div>
          <div className="space-y-3">
            {displayData.platforms.slice(0, 5).map((platform, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{platform.platform}</span>
                  <span className="text-gray-600">{platform.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#8B5CF6] h-2 rounded-full transition-all"
                    style={{ width: `${platform.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Checkout-lösningar */}
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="text-lg font-black text-black uppercase">Checkout-lösningar</h2>
          </div>
          <div className="space-y-3">
            {checkoutWithPercentage.slice(0, 5).map((provider, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{provider.provider}</span>
                  <span className="text-gray-600">{provider.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-black h-2 rounded-full transition-all"
                    style={{ width: `${provider.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transportörer & Leveranssätt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transportörer */}
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="text-lg font-black text-black uppercase">Transportörer i Checkout</h2>
          </div>
          <div className="space-y-3">
            {carriersWithPercentage.slice(0, 6).map((carrier, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{carrier.carrier}</span>
                  <span className="text-gray-600">{carrier.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${carrier.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leveranssätt */}
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="text-lg font-black text-black uppercase">Leveranssätt</h2>
          </div>
          <div className="space-y-3">
            {deliveryWithPercentage.slice(0, 6).map((method, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{method.method}</span>
                  <span className="text-gray-600">{method.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all"
                    style={{ width: `${method.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tenant Activity */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="text-lg font-black text-black uppercase">Tenant Aktivitet (Senaste 24h)</h2>
          </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayData.recent_activity.length === 0 ? (
            <p className="text-gray-500 text-sm">Ingen aktivitet senaste 24h</p>
          ) : (
            displayData.recent_activity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getActionIcon(activity.action_type)}</span>
                  <div>
                    <p className="font-semibold text-sm">
                      {activity.tenant_name || 'System'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.action_type.replace(/_/g, ' ')} • {activity.user_name}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(activity.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
};
