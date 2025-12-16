import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  CheckCircle, 
  Clock, 
  Bell, 
  Search,
  Building2,
  Calendar,
  ArrowRight,
  Activity,
  DollarSign,
  Zap
} from 'lucide-react';
import { LeadData } from '../types';

interface DashboardProps {
  leads: LeadData[];
  onNavigateToLeads: () => void;
  onNavigateToCustomers: () => void;
  onNavigateToCronjobs: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  onNavigateToLeads,
  onNavigateToCustomers,
  onNavigateToCronjobs
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cronjobs, setCronjobs] = useState<any[]>([]);

  // Calculate KPIs
  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => l.legalStatus === 'Aktivt').length;
  const convertedLeads = leads.filter(l => l.source === 'converted').length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
  
  // Recent leads (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentLeads = leads.filter(l => {
    const leadDate = new Date(l.analysisDate || l.timestamp || 0);
    return leadDate >= sevenDaysAgo;
  }).length;

  // Average revenue
  const leadsWithRevenue = leads.filter(l => l.revenue && l.revenue > 0);
  const avgRevenue = leadsWithRevenue.length > 0
    ? Math.round(leadsWithRevenue.reduce((sum, l) => sum + (l.revenue || 0), 0) / leadsWithRevenue.length)
    : 0;

  useEffect(() => {
    // Fetch notifications (mock data for now)
    setNotifications([
      { id: '1', type: 'lead_assigned', title: 'Nytt lead tilldelat', message: 'Du har fått ett nytt lead: Acme AB', timestamp: new Date(), read: false },
      { id: '2', type: 'cronjob_complete', title: 'Cronjob klart', message: 'Lead-sökning Stockholm har slutförts', timestamp: new Date(), read: false },
    ]);

    // Fetch cronjobs (mock data for now)
    setCronjobs([
      { id: '1', name: 'Daglig lead-sökning Stockholm', nextRun: new Date(Date.now() + 3600000), enabled: true },
      { id: '2', name: 'Veckovis kunddata-uppdatering', nextRun: new Date(Date.now() + 86400000), enabled: true },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-sm shadow-lg p-6 border-t-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
                <Activity className="w-8 h-8 text-black" />
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 font-semibold mt-1">Översikt och snabbåtkomst</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Senast uppdaterad</p>
              <p className="text-sm font-bold text-gray-900">{new Date().toLocaleString('sv-SE')}</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads */}
          <div className="bg-white rounded-sm shadow-md p-6 border-t-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">TOTALT</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-1">{totalLeads}</h3>
            <p className="text-sm text-gray-600 font-semibold">Totalt antal leads</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="font-bold text-green-600">+{recentLeads}</span> senaste 7 dagarna
            </div>
          </div>

          {/* Active Leads */}
          <div className="bg-white rounded-sm shadow-md p-6 border-t-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">AKTIVA</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-1">{activeLeads}</h3>
            <p className="text-sm text-gray-600 font-semibold">Aktiva leads</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="font-bold">{totalLeads > 0 ? ((activeLeads / totalLeads) * 100).toFixed(0) : 0}%</span> av totalt
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-sm shadow-md p-6 border-t-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <span className="text-xs font-bold text-black bg-red-100 px-2 py-1 rounded">KONVERTERING</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-1">{conversionRate}%</h3>
            <p className="text-sm text-gray-600 font-semibold">Konverteringsgrad</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-4 h-4 text-black" />
              <span className="font-bold">{convertedLeads}</span> konverterade leads
            </div>
          </div>

          {/* Average Revenue */}
          <div className="bg-white rounded-sm shadow-md p-6 border-t-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">OMSÄTTNING</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-1">{(avgRevenue / 1000000).toFixed(1)}M</h3>
            <p className="text-sm text-gray-600 font-semibold">Genomsnittlig omsättning</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <TrendingUp className="w-4 h-4 text-yellow-600" />
              <span className="font-bold">{leadsWithRevenue.length}</span> leads med data
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-sm shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-black" />
            Snabbåtkomst
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Leads Button */}
            <button
              onClick={onNavigateToLeads}
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-sm border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <Target className="w-8 h-8 text-blue-600" />
                <ArrowRight className="w-5 h-5 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Leads</h3>
              <p className="text-sm text-gray-600">Sök och hantera leads</p>
              <div className="mt-3 text-xs font-bold text-blue-600">{totalLeads} aktiva leads</div>
            </button>

            {/* Customers Button */}
            <button
              onClick={onNavigateToCustomers}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-sm border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <Building2 className="w-8 h-8 text-green-600" />
                <ArrowRight className="w-5 h-5 text-green-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Kunder</h3>
              <p className="text-sm text-gray-600">Hantera befintliga kunder</p>
              <div className="mt-3 text-xs font-bold text-green-600">Kundövervakning</div>
            </button>

            {/* Cronjobs Button */}
            <button
              onClick={onNavigateToCronjobs}
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-sm border-2 border-yellow-200 hover:border-purple-400 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-8 h-8 text-gray-700" />
                <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Cronjobs</h3>
              <p className="text-sm text-gray-600">Automatisera uppgifter</p>
              <div className="mt-3 text-xs font-bold text-gray-700">{cronjobs.filter(c => c.enabled).length} aktiva jobb</div>
            </button>
          </div>
        </div>

        {/* Bottom Row: Notifications & Cronjobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notifications */}
          <div className="bg-white rounded-sm shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-black" />
                Senaste notifikationer
              </h2>
              <span className="text-xs font-bold text-gray-500 uppercase">Senaste 24h</span>
            </div>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map(notif => (
                  <div key={notif.id} className="p-4 bg-slate-50 rounded-sm border-t-4 border-blue-500 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-900 mb-1">{notif.title}</h4>
                        <p className="text-xs text-gray-600">{notif.message}</p>
                      </div>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{new Date(notif.timestamp).toLocaleString('sv-SE')}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-semibold">Inga notifikationer</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Cronjobs */}
          <div className="bg-white rounded-sm shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-black" />
                Kommande cronjobs
              </h2>
              <span className="text-xs font-bold text-gray-500 uppercase">Nästa 24h</span>
            </div>
            <div className="space-y-3">
              {cronjobs.length > 0 ? (
                cronjobs.slice(0, 5).map(job => (
                  <div key={job.id} className="p-4 bg-slate-50 rounded-sm border-t-4 border-green-500 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-900 mb-1">{job.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <p className="text-xs text-gray-600">
                            Nästa körning: {new Date(job.nextRun).toLocaleString('sv-SE')}
                          </p>
                        </div>
                      </div>
                      {job.enabled && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">AKTIV</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-semibold">Inga schemalagda jobb</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
