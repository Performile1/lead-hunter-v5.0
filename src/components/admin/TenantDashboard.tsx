import React, { useState, useEffect } from 'react';
import { 
  Users, Package, TrendingUp, DollarSign,
  AlertCircle, CheckCircle, Clock, BarChart3,
  Activity, Zap, Award, Search, UserPlus, Settings
} from 'lucide-react';

interface TenantMetrics {
  subscription_tier: string;
  usage: {
    users: { current: number; max: number; percentage: string };
    leads: { current: number; max: number; percentage: string };
    customers: { current: number; max: number; percentage: string };
  };
  performance: {
    total_leads: number;
    total_customers: number;
    conversion_rate: number;
    avg_time_to_conversion: number;
  };
  activity: {
    active_users_24h: number;
    leads_this_month: number;
    customers_this_month: number;
  };
  needs_upgrade: boolean;
}

export const TenantDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'users'>('dashboard');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      // For now, use mock data since API endpoints don't exist yet
      const users = { total: 5 };
      const leads = { total: 150, leads: [] };
      const customers = { total: 25, customers: [] };
      const quality = { conversion_rate: 16.7 };

      // Calculate usage (example limits)
      const maxUsers = 50;
      const maxLeads = 5000;
      const maxCustomers = 1000;

      const currentUsers = users.total || 0;
      const currentLeads = leads.total || 0;
      const currentCustomers = customers.total || 0;

      const userUsage = ((currentUsers / maxUsers) * 100).toFixed(1);
      const leadUsage = ((currentLeads / maxLeads) * 100).toFixed(1);
      const customerUsage = ((currentCustomers / maxCustomers) * 100).toFixed(1);

      const needsUpgrade = 
        parseFloat(userUsage) > 80 || 
        parseFloat(leadUsage) > 80 || 
        parseFloat(customerUsage) > 80;

      // Calculate activity
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const leadsThisMonth = leads.leads?.filter((l: any) => 
        new Date(l.created_at) > monthAgo
      ).length || 0;

      const customersThisMonth = customers.customers?.filter((c: any) => 
        new Date(c.created_at) > monthAgo
      ).length || 0;

      setMetrics({
        subscription_tier: 'professional',
        usage: {
          users: { current: currentUsers, max: maxUsers, percentage: userUsage },
          leads: { current: currentLeads, max: maxLeads, percentage: leadUsage },
          customers: { current: currentCustomers, max: maxCustomers, percentage: customerUsage }
        },
        performance: {
          total_leads: currentLeads,
          total_customers: currentCustomers,
          conversion_rate: parseFloat(quality.conversion_rate || 0),
          avg_time_to_conversion: parseFloat(quality.avg_days || 0)
        },
        activity: {
          active_users_24h: users.users?.filter((u: any) => {
            const lastLogin = new Date(u.last_login);
            return (now.getTime() - lastLogin.getTime()) < 24 * 60 * 60 * 1000;
          }).length || 0,
          leads_this_month: leadsThisMonth,
          customers_this_month: customersThisMonth
        },
        needs_upgrade: needsUpgrade
      });

    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!metrics) return null;

  const getTierBadge = (tier: string) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800 border-gray-300',
      professional: 'bg-blue-100 text-blue-800 border-blue-300',
      enterprise: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[tier as keyof typeof colors] || colors.basic;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide">
            Tenant Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Översikt över din organisations användning och prestanda
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded border-2 font-bold uppercase text-sm ${getTierBadge(metrics.subscription_tier)}`}>
            {metrics.subscription_tier}
          </span>
          <button
            onClick={loadMetrics}
            className="flex items-center gap-2 bg-black hover:bg-[#a0040d] text-white px-4 py-2 rounded font-semibold"
          >
            <Zap className="w-4 h-4" />
            Uppdatera
          </button>
        </div>
      </div>

      {/* Upgrade Warning */}
      {metrics.needs_upgrade && (
        <div className="bg-orange-50 border-2 border-orange-300 p-4 rounded flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-orange-900">Uppgradering rekommenderas</p>
            <p className="text-sm text-orange-700">
              Du närmar dig gränserna för din nuvarande plan. Uppgradera för att få tillgång till fler resurser.
            </p>
          </div>
        </div>
      )}

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Användare</p>
              <p className="text-2xl font-black text-black mt-1">
                {metrics.usage.users.current} / {metrics.usage.users.max}
              </p>
            </div>
            <Users className="w-10 h-10 text-[#4F46E5]" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                parseFloat(metrics.usage.users.percentage) > 80 ? 'bg-red-600' : 
                parseFloat(metrics.usage.users.percentage) > 60 ? 'bg-orange-600' : 
                'bg-green-600'
              }`}
              style={{ width: `${metrics.usage.users.percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">{metrics.usage.users.percentage}% använt</p>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Leads (månad)</p>
              <p className="text-2xl font-black text-black mt-1">
                {metrics.activity.leads_this_month} / {metrics.usage.leads.max}
              </p>
            </div>
            <Package className="w-10 h-10 text-[#4F46E5]" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                parseFloat(metrics.usage.leads.percentage) > 80 ? 'bg-red-600' : 
                parseFloat(metrics.usage.leads.percentage) > 60 ? 'bg-orange-600' : 
                'bg-green-600'
              }`}
              style={{ width: `${((metrics.activity.leads_this_month / metrics.usage.leads.max) * 100).toFixed(1)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {((metrics.activity.leads_this_month / metrics.usage.leads.max) * 100).toFixed(1)}% använt denna månad
          </p>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Kunder</p>
              <p className="text-2xl font-black text-black mt-1">
                {metrics.usage.customers.current} / {metrics.usage.customers.max}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-[#4F46E5]" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                parseFloat(metrics.usage.customers.percentage) > 80 ? 'bg-red-600' : 
                parseFloat(metrics.usage.customers.percentage) > 60 ? 'bg-orange-600' : 
                'bg-green-600'
              }`}
              style={{ width: `${metrics.usage.customers.percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">{metrics.usage.customers.percentage}% använt</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Totalt Leads</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.performance.total_leads}
              </p>
            </div>
            <Package className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Totalt Kunder</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.performance.total_customers}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Konvertering</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.performance.conversion_rate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Snitt Tid</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.performance.avg_time_to_conversion.toFixed(0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">dagar</p>
            </div>
            <Clock className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>
      </div>

      {/* Activity This Month */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-black" />
          <h2 className="text-lg font-black text-black uppercase">Aktivitet Denna Månad</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-3xl font-black text-blue-700">{metrics.activity.active_users_24h}</p>
            <p className="text-sm font-bold text-blue-600 mt-1">Aktiva användare (24h)</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded border border-green-200">
            <p className="text-3xl font-black text-green-700">{metrics.activity.leads_this_month}</p>
            <p className="text-sm font-bold text-green-600 mt-1">Nya leads</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded border border-purple-200">
            <p className="text-3xl font-black text-purple-700">{metrics.activity.customers_this_month}</p>
            <p className="text-sm font-bold text-purple-600 mt-1">Nya kunder</p>
          </div>
        </div>
      </div>
    </div>
  );
};
