import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle2, Clock, BarChart3, RefreshCw, Bell, Settings } from 'lucide-react';

interface ServiceQuota {
  name: string;
  service: string;
  used: number;
  limit: number;
  percentage: number;
  resetTime: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'increasing' | 'stable' | 'decreasing';
  lastHour: number;
  priority: 'critical' | 'recommended' | 'optional';
}

interface QuotaAlert {
  id: string;
  service: string;
  level: 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export default function QuotaManagementPanel() {
  const [quotas, setQuotas] = useState<ServiceQuota[]>([]);
  const [alerts, setAlerts] = useState<QuotaAlert[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [warningThreshold, setWarningThreshold] = useState(70);
  const [criticalThreshold, setCriticalThreshold] = useState(90);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuotas();
    
    if (autoRefresh) {
      const interval = setInterval(loadQuotas, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadQuotas = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch('http://localhost:3001/api/quotas/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quota stats');
      }

      const data = await response.json();
      setQuotas(data.quotas || []);
      checkForAlerts(data.quotas || []);
    } catch (error) {
      console.error('Error loading quotas:', error);
      // Fallback to empty array on error
      setQuotas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetQuota = async (service: string) => {
    if (!confirm(`Är du säker på att du vill återställa quota för ${service}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch('http://localhost:3001/api/quotas/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ service: service.toLowerCase() })
      });

      if (!response.ok) {
        throw new Error('Failed to reset quota');
      }

      alert(`Quota för ${service} har återställts!`);
      loadQuotas();
    } catch (error) {
      console.error('Error resetting quota:', error);
      alert('Kunde inte återställa quota. Försök igen.');
    }
  };

  const checkForAlerts = (quotas: ServiceQuota[]) => {
    const newAlerts: QuotaAlert[] = [];

    quotas.forEach(quota => {
      if (quota.percentage >= criticalThreshold) {
        newAlerts.push({
          id: `${quota.name}-critical-${Date.now()}`,
          service: quota.name,
          level: 'critical',
          message: `${quota.name} har nått ${quota.percentage}% av quota (${quota.used}/${quota.limit})`,
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      } else if (quota.percentage >= warningThreshold) {
        newAlerts.push({
          id: `${quota.name}-warning-${Date.now()}`,
          service: quota.name,
          level: 'warning',
          message: `${quota.name} närmar sig quota-gräns: ${quota.percentage}% (${quota.used}/${quota.limit})`,
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }
    });

    setAlerts(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const uniqueNew = newAlerts.filter(a => !existingIds.has(a.id));
      return [...prev, ...uniqueNew].slice(-10);
    });
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatResetTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours < 1) return `${minutes}m`;
    if (hours < 24) return `${hours}h ${minutes}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const criticalQuotas = quotas.filter(q => q.status === 'critical');
  const warningQuotas = quotas.filter(q => q.status === 'warning');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-dhl-red" />
            Quota Management
          </h2>
          <p className="text-gray-600 mt-1">
            Realtidsövervakning av API-quota och användning
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
              autoRefresh 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={loadQuotas}
            disabled={loading}
            className="px-4 py-2 bg-dhl-red text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Uppdatera
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Totala tjänster</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{quotas.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600">Healthy</div>
          <div className="text-3xl font-bold text-green-700 mt-1">
            {quotas.filter(q => q.status === 'healthy').length}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-600">Warning</div>
          <div className="text-3xl font-bold text-yellow-700 mt-1">{warningQuotas.length}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-600">Critical</div>
          <div className="text-3xl font-bold text-red-700 mt-1">{criticalQuotas.length}</div>
        </div>
      </div>

      {unacknowledgedAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">
                Aktiva varningar ({unacknowledgedAlerts.length})
              </h3>
            </div>
            <button
              onClick={clearAllAlerts}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Rensa alla
            </button>
          </div>
          <div className="space-y-2">
            {unacknowledgedAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded border ${
                  alert.level === 'critical' 
                    ? 'bg-red-100 border-red-300' 
                    : 'bg-yellow-100 border-yellow-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${
                        alert.level === 'critical' ? 'text-red-900' : 'text-yellow-900'
                      }`}>
                        {alert.service}
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(alert.timestamp).toLocaleTimeString('sv-SE')}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      alert.level === 'critical' ? 'text-red-700' : 'text-yellow-700'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {['critical', 'recommended', 'optional'].map(priority => {
          const priorityQuotas = quotas.filter(q => q.priority === priority);
          if (priorityQuotas.length === 0) return null;

          return (
            <div key={priority}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {priority === 'critical' ? '🔴 KRITISKA' : priority === 'recommended' ? '🟡 REKOMMENDERADE' : '🟢 VALFRIA'} tjänster
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {priorityQuotas.map(quota => (
                  <div
                    key={quota.name}
                    className={`bg-white border-2 rounded-lg p-4 ${
                      quota.status === 'critical' ? 'border-red-300' :
                      quota.status === 'warning' ? 'border-yellow-300' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(quota.status)}
                        <div>
                          <h4 className="font-semibold text-gray-900">{quota.name}</h4>
                          <p className="text-sm text-gray-600">{quota.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(quota.trend)}
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(quota.status)}`}>
                          {quota.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Användning</span>
                          <span className="font-semibold">
                            {quota.used.toLocaleString()} / {quota.limit.toLocaleString()} ({quota.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              quota.percentage >= criticalThreshold ? 'bg-red-600' :
                              quota.percentage >= warningThreshold ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(quota.percentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Senaste timmen:</span>
                          <div className="font-semibold text-gray-900">{quota.lastHour} requests</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Återställs om:</span>
                          <div className="font-semibold text-gray-900 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatResetTime(quota.resetTime)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Trend:</span>
                          <div className="font-semibold text-gray-900 flex items-center gap-1">
                            {getTrendIcon(quota.trend)}
                            {quota.trend === 'increasing' ? 'Ökande' : quota.trend === 'decreasing' ? 'Minskande' : 'Stabil'}
                          </div>
                        </div>
                      </div>

                      {quota.percentage >= warningThreshold && (
                        <div className={`p-2 rounded text-sm ${
                          quota.percentage >= criticalThreshold 
                            ? 'bg-red-50 text-red-700' 
                            : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          <strong>Rekommendation:</strong> {
                            quota.percentage >= criticalThreshold 
                              ? `Kritisk nivå! Använd fallback-tjänster eller vänta ${formatResetTime(quota.resetTime)} för återställning.`
                              : 'Överväg att använda fallback-tjänster för att undvika quota exhaustion.'
                          }
                        </div>
                      )}

                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => handleResetQuota(quota.name)}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300 flex items-center gap-2"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Återställ Quota
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-dhl-red" />
          Varningsinställningar
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warning-tröskel (%)
            </label>
            <input
              type="number"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(parseInt(e.target.value))}
              min="50"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Visa varning vid denna användningsnivå
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Critical-tröskel (%)
            </label>
            <input
              type="number"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(parseInt(e.target.value))}
              min="50"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Visa kritisk varning vid denna nivå
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uppdateringsintervall (sekunder)
            </label>
            <input
              type="number"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              min="10"
              max="300"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hur ofta data ska uppdateras automatiskt
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips för quota management</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Grön (Healthy):</strong> &lt;{warningThreshold}% - Normal användning</li>
          <li>• <strong>Gul (Warning):</strong> {warningThreshold}-{criticalThreshold}% - Överväg fallback</li>
          <li>• <strong>Röd (Critical):</strong> &gt;{criticalThreshold}% - Använd fallback omedelbart</li>
          <li>• Request Queue hanterar automatiskt rate limiting och fallback</li>
          <li>• Quota återställs automatiskt enligt varje tjänsts schema</li>
          <li>• Aktivera auto-refresh för realtidsövervakning</li>
        </ul>
      </div>
    </div>
  );
}
