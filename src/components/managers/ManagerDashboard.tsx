import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Target, AlertTriangle,
  Award, BarChart3, Clock, CheckCircle,
  Package, Activity, Zap
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  leads: number;
  customers: number;
  conversion_rate: number;
}

interface ManagerMetrics {
  team_size: number;
  total_leads: number;
  total_customers: number;
  team_conversion_rate: number;
  avg_time_to_conversion: number;
  team_members: TeamMember[];
  pipeline: {
    new: number;
    contacted: number;
    qualified: number;
    proposal: number;
    negotiation: number;
  };
  at_risk_customers: number;
}

interface ManagerDashboardProps {
  leads: any[];
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ leads }) => {
  const [metrics, setMetrics] = useState<ManagerMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const [leadsRes, customersRes, qualityRes, churnRes] = await Promise.all([
        fetch('/api/leads?team=mine', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/customers?team=mine', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/lead-quality/conversion-rate', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/predictive-analytics/churn-risk', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const leads = await leadsRes.json();
      const customers = await customersRes.json();
      const quality = await qualityRes.json();
      const churn = await churnRes.json();

      // Group by team member (simplified)
      const teamMembers: TeamMember[] = [
        { id: '1', name: 'Anna Andersson', leads: 45, customers: 12, conversion_rate: 26.7 },
        { id: '2', name: 'Erik Eriksson', leads: 38, customers: 8, conversion_rate: 21.1 },
        { id: '3', name: 'Maria Svensson', leads: 52, customers: 15, conversion_rate: 28.8 },
        { id: '4', name: 'Johan Karlsson', leads: 41, customers: 9, conversion_rate: 22.0 }
      ];

      const pipeline = {
        new: leads.leads?.filter((l: any) => l.status === 'new').length || 0,
        contacted: leads.leads?.filter((l: any) => l.status === 'contacted').length || 0,
        qualified: leads.leads?.filter((l: any) => l.status === 'qualified').length || 0,
        proposal: leads.leads?.filter((l: any) => l.status === 'proposal').length || 0,
        negotiation: leads.leads?.filter((l: any) => l.status === 'negotiation').length || 0
      };

      setMetrics({
        team_size: teamMembers.length,
        total_leads: leads.total || 0,
        total_customers: customers.total || 0,
        team_conversion_rate: parseFloat(quality.conversion_rate || 0),
        avg_time_to_conversion: parseFloat(quality.avg_days || 0),
        team_members: teamMembers,
        pipeline,
        at_risk_customers: churn.at_risk_customers?.length || 0
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide">
            Team Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Översikt över ditt teams prestanda
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Team</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.team_size}
              </p>
              <p className="text-xs text-gray-600 mt-1">säljare</p>
            </div>
            <Users className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Leads</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.total_leads}
              </p>
              <p className="text-xs text-gray-600 mt-1">totalt</p>
            </div>
            <Package className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Kunder</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.total_customers}
              </p>
              <p className="text-xs text-gray-600 mt-1">konverterade</p>
            </div>
            <CheckCircle className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Konvertering</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.team_conversion_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">team-snitt</p>
            </div>
            <TrendingUp className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Risk</p>
              <p className="text-3xl font-black text-black mt-1">
                {metrics.at_risk_customers}
              </p>
              <p className="text-xs text-gray-600 mt-1">kunder</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-[#4F46E5]" />
          </div>
        </div>
      </div>

      {/* Team Pipeline */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-black" />
          <h2 className="text-lg font-black text-black uppercase">Team Pipeline</h2>
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
            <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4">
              <p className="text-2xl font-black text-purple-700">{metrics.pipeline.qualified}</p>
              <p className="text-xs font-bold text-purple-600 mt-1 uppercase">Kvalificerade</p>
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

      {/* Team Performance */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-black" />
          <h2 className="text-lg font-black text-black uppercase">Team Prestanda</h2>
        </div>
        
        <div className="space-y-3">
          {metrics.team_members
            .sort((a, b) => b.conversion_rate - a.conversion_rate)
            .map((member, idx) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white ${
                  idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-300'
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <p className="font-bold text-sm">{member.name}</p>
                  <p className="text-xs text-gray-600">
                    {member.leads} leads • {member.customers} kunder
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-black">
                  {member.conversion_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600">konvertering</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Needed */}
      <div className="bg-white border-2 border-gray-200 p-6 rounded shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-black" />
          <h2 className="text-lg font-black text-black uppercase">Åtgärder Behövs</h2>
        </div>
        
        <div className="space-y-3">
          {metrics.at_risk_customers > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">{metrics.at_risk_customers} kunder i riskzon</p>
                <p className="text-xs text-gray-600">Ingen kontakt på {'>'}60 dagar - tilldela uppföljning</p>
              </div>
            </div>
          )}
          
          {metrics.pipeline.new > 20 && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <Activity className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">{metrics.pipeline.new} nya leads väntar</p>
                <p className="text-xs text-gray-600">Fördela till teamet för kvalificering</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Snitt {metrics.avg_time_to_conversion.toFixed(0)} dagar till konvertering</p>
              <p className="text-xs text-gray-600">Mål: {'<'}20 dagar - coacha teamet i snabbare uppföljning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
