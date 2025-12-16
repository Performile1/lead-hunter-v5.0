import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Award } from 'lucide-react';

interface TeamStats {
  total_leads: number;
  total_revenue_tkr: number;
  avg_revenue_per_lead: number;
  leads_this_month: number;
  leads_last_month: number;
  growth_percentage: number;
  top_performer: {
    name: string;
    leads_count: number;
    revenue_tkr: number;
  };
  segment_distribution: {
    DM: number;
    TS: number;
    FS: number;
    KAM: number;
  };
}

export const TeamStats: React.FC = () => {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/managers/team-stats?range=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 text-center shadow-md">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Laddar statistik...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white p-12 text-center shadow-md">
        <p className="text-gray-500">Ingen statistik tillgänglig</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="bg-white border-l-4 border-primary p-6 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-primary uppercase">Team Statistik</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded font-semibold text-sm uppercase transition ${
                timeRange === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Vecka
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded font-semibold text-sm uppercase transition ${
                timeRange === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Månad
            </button>
            <button
              onClick={() => setTimeRange('quarter')}
              className={`px-4 py-2 rounded font-semibold text-sm uppercase transition ${
                timeRange === 'quarter'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Kvartal
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-l-4 border-dhl-blue p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-dhl-blue" />
              <span className="text-sm text-gray-600 uppercase font-semibold">Totalt Leads</span>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-2">{stats.total_leads}</p>
          <div className="flex items-center gap-2 text-sm">
            {stats.growth_percentage >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-semibold">+{stats.growth_percentage}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-red-600 font-semibold">{stats.growth_percentage}%</span>
              </>
            )}
            <span className="text-gray-500">vs förra perioden</span>
          </div>
        </div>

        <div className="bg-white border-l-4 border-dhl-green p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <span className="text-sm text-gray-600 uppercase font-semibold">Total Omsättning</span>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-2">
            {(stats.total_revenue_tkr / 1000).toFixed(1)}M
          </p>
          <p className="text-sm text-gray-500">
            Snitt: {(stats.avg_revenue_per_lead / 1000).toFixed(1)}M per lead
          </p>
        </div>

        <div className="bg-white border-l-4 border-dhl-yellow p-6 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-yellow-600" />
              <span className="text-sm text-gray-600 uppercase font-semibold">Denna Period</span>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-2">{stats.leads_this_month}</p>
          <p className="text-sm text-gray-500">
            Förra perioden: {stats.leads_last_month}
          </p>
        </div>
      </div>

      {/* Top Performer */}
      {stats.top_performer && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-dhl-yellow p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="bg-secondary text-black p-4 rounded-full">
              <Award className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 uppercase mb-1">Top Performer</h3>
              <p className="text-2xl font-bold text-primary">{stats.top_performer.name}</p>
              <div className="flex items-center gap-6 mt-2 text-sm">
                <span className="text-gray-700">
                  <strong>{stats.top_performer.leads_count}</strong> leads
                </span>
                <span className="text-gray-700">
                  <strong>{(stats.top_performer.revenue_tkr / 1000).toFixed(1)}M</strong> omsättning
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Segment Distribution */}
      <div className="bg-white border-l-4 border-primary p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase">Segment-Fördelning</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">DM</p>
            <p className="text-3xl font-bold text-gray-900">{stats.segment_distribution.DM}</p>
            <p className="text-xs text-gray-500 mt-1">Direct Marketing</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">TS</p>
            <p className="text-3xl font-bold text-green-600">{stats.segment_distribution.TS}</p>
            <p className="text-xs text-gray-500 mt-1">Telesales</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">FS</p>
            <p className="text-3xl font-bold text-blue-600">{stats.segment_distribution.FS}</p>
            <p className="text-xs text-gray-500 mt-1">Field Sales</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">KAM</p>
            <p className="text-3xl font-bold text-gray-700">{stats.segment_distribution.KAM}</p>
            <p className="text-xs text-gray-500 mt-1">Key Account</p>
          </div>
        </div>
      </div>
    </div>
  );
};
