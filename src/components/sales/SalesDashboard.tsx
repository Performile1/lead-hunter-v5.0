import React, { useState, useEffect } from 'react';
import { 
  Target, TrendingUp, Clock, CheckCircle, 
  AlertCircle, Package, Users, BarChart3,
  Calendar, Award, Zap
} from 'lucide-react';

interface SalesMetrics {
  my_leads: {
    total: number;
    this_week: number;
    this_month: number;
  };
  my_customers: {
    total: number;
    this_month: number;
  };
  conversion_rate: number;
  avg_time_to_conversion: number;
  pipeline: {
    new: number;
    contacted: number;
    qualified: number;
    proposal: number;
    negotiation: number;
  };
  recommendations: Array<{
    lead_id: string;
    company_name: string;
    action: string;
    priority: string;
    reason: string;
  }>;
}

interface SalesDashboardProps {
  leads: any[];
  onNavigateToLeads: () => void;
  onNavigateToCustomers: () => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ leads, onNavigateToLeads, onNavigateToCustomers }) => {
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Load multiple endpoints in parallel
      const [leadsRes, customersRes, qualityRes] = await Promise.all([
        fetch('/api/leads?assigned_to=me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/customers?assigned_to=me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/lead-quality/conversion-rate', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const leads = await leadsRes.json();
      const customers = await customersRes.json();
      const quality = await qualityRes.json();

      // Calculate metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const leadsThisWeek = leads.leads?.filter((l: any) => 
        new Date(l.created_at) > weekAgo
      ).length || 0;

      const leadsThisMonth = leads.leads?.filter((l: any) => 
        new Date(l.created_at) > monthAgo
      ).length || 0;

      const customersThisMonth = customers.customers?.filter((c: any) => 
        new Date(c.created_at) > monthAgo
      ).length || 0;

      // Group leads by status (simplified pipeline)
      const pipeline = {
        new: leads.leads?.filter((l: any) => l.status === 'new').length || 0,
        contacted: leads.leads?.filter((l: any) => l.status === 'contacted').length || 0,
        qualified: leads.leads?.filter((l: any) => l.status === 'qualified').length || 0,
        proposal: leads.leads?.filter((l: any) => l.status === 'proposal').length || 0,
        negotiation: leads.leads?.filter((l: any) => l.status === 'negotiation').length || 0
      };

      setMetrics({
        my_leads: {
          total: leads.total || 0,
          this_week: leadsThisWeek,
          this_month: leadsThisMonth
        },
        my_customers: {
          total: customers.total || 0,
          this_month: customersThisMonth
        },
        conversion_rate: parseFloat(quality.conversion_rate || 0),
        avg_time_to_conversion: parseFloat(quality.avg_days || 0),
        pipeline,
        recommendations: []
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2"></div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide">
            Min Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Översikt över dina leads och prestanda
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="flex items-center gap-2 bg-black hover:bg-[#a0040d] text-white px-4 py-2 rounded font-semibold"
        >
          <Zap className="w-4 h-4" />
          Uppdatera
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Mina Leads</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.my_leads.total}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                +{metrics.my_leads.this_week} denna vecka
              </p>
            </div>
            <Package className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Mina Kunder</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.my_customers.total}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                +{metrics.my_customers.this_month} denna månad
              </p>
            </div>
            <Users className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Konvertering</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.conversion_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Lead → Kund
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
                {metrics.avg_time_to_conversion.toFixed(0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                dagar till konvertering
              </p>
            </div>
            <Clock className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-black" />
          <h2 className="text-lg font-black text-black uppercase">Min Pipeline</h2>
        </div>
        
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4">
              <p className="text-2xl font-black text-blue-700">{metrics.pipeline.new}</p>
              <p className="text-xs font-bold text-blue-600 mt-1 uppercase">Nya</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
              <p className="text-2xl font-black text-yellow-700">{metrics.pipeline.contacted}</p>
              <p className="text-xs font-bold text-yellow-600 mt-1 uppercase">Kontaktade</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 border-2 border-yellow-300 rounded-lg p-4">
              <p className="text-2xl font-black text-black">{metrics.pipeline.qualified}</p>
              <p className="text-xs font-bold text-gray-700 mt-1 uppercase">Kvalificerade</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-4">
              <p className="text-2xl font-black text-orange-700">{metrics.pipeline.proposal}</p>
              <p className="text-xs font-bold text-orange-600 mt-1 uppercase">Offert</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
              <p className="text-2xl font-black text-green-700">{metrics.pipeline.negotiation}</p>
              <p className="text-xs font-bold text-green-600 mt-1 uppercase">Förhandling</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-black" />
            <h2 className="text-lg font-black text-black uppercase">Dagens Uppgifter</h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Följ upp {metrics.pipeline.contacted} kontaktade leads</p>
                <p className="text-xs text-gray-600">Prioritet: Hög</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <Target className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Kvalificera {metrics.pipeline.new} nya leads</p>
                <p className="text-xs text-gray-600">Prioritet: Medium</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Skicka {metrics.pipeline.proposal} offerter</p>
                <p className="text-xs text-gray-600">Prioritet: Hög</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-black" />
            <h2 className="text-lg font-black text-black uppercase">Min Prestanda</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">Månadsmål Leads</span>
                <span className="text-gray-600">{metrics.my_leads.this_month} / 50</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-black h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((metrics.my_leads.this_month / 50) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">Månadsmål Kunder</span>
                <span className="text-gray-600">{metrics.my_customers.this_month} / 10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((metrics.my_customers.this_month / 10) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">Konverteringsmål</span>
                <span className="text-gray-600">{metrics.conversion_rate.toFixed(1)}% / 20%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min((metrics.conversion_rate / 20) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
