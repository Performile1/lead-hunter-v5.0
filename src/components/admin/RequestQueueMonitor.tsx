import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getQueueStatus, clearQueue } from '../../../services/requestQueue';

export const RequestQueueMonitor: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateStatus = () => {
      try {
        const currentStatus = getQueueStatus();
        setStatus(currentStatus);
      } catch (error) {
        console.error('Failed to get queue status:', error);
      }
    };

    updateStatus();

    if (autoRefresh) {
      const interval = setInterval(updateStatus, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleClearQueue = () => {
    if (confirm('Är du säker på att du vill rensa hela kön? Detta avbryter alla väntande requests.')) {
      clearQueue();
      setStatus(getQueueStatus());
    }
  };

  if (!status) {
    return (
      <div className="bg-white rounded-none p-6">
        <p className="text-gray-500">Laddar queue-status...</p>
      </div>
    );
  }

  const getServiceStatusColor = (minuteCount: number, limit: number) => {
    const percentage = (minuteCount / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getServiceStatusIcon = (minuteCount: number, limit: number) => {
    const percentage = (minuteCount / limit) * 100;
    if (percentage >= 90) return <AlertCircle className="w-4 h-4" />;
    if (percentage >= 70) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-wide flex items-center gap-3">
            <Activity className="w-7 h-7 text-[#FFC400]" />
            Request Queue Monitor
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Realtidsövervakning av API-requests och rate limits
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded font-semibold ${
              autoRefresh 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-black'
            }`}
          >
            {autoRefresh ? '⏸️ Pausa' : '▶️ Starta'} Auto-refresh
          </button>
          <button
            onClick={handleClearQueue}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold"
            disabled={status.queueSize === 0}
          >
            <XCircle className="w-4 h-4 inline mr-2" />
            Rensa Kö
          </button>
        </div>
      </div>

      {/* Queue Overview */}
      <div className="bg-white rounded-none p-6">
        <h3 className="text-lg font-black text-black uppercase mb-4">Köstatus</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase">Väntande Requests</p>
                <p className="text-3xl font-black text-blue-900 mt-1">{status.queueSize}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className={`border-2 p-4 rounded ${
            status.processing 
              ? 'bg-green-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase" style={{ color: status.processing ? '#16a34a' : '#6b7280' }}>
                  Processing Status
                </p>
                <p className="text-3xl font-black mt-1" style={{ color: status.processing ? '#14532d' : '#1f2937' }}>
                  {status.processing ? 'AKTIV' : 'VILANDE'}
                </p>
              </div>
              {status.processing ? (
                <Activity className="w-8 h-8 text-green-400 animate-pulse" />
              ) : (
                <Activity className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase">Aktiva Services</p>
                <p className="text-3xl font-black text-gray-900 mt-1">
                  {status.serviceStats.filter((s: any) => s.active > 0).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="bg-white rounded-none p-6">
        <h3 className="text-lg font-black text-black uppercase mb-4">Service Rate Limits</h3>
        
        <div className="space-y-3">
          {status.serviceStats.map((service: any) => {
            const limits = getServiceLimits(service.service);
            const minutePercentage = (service.minuteCount / limits.requestsPerMinute) * 100;
            const hourPercentage = (service.hourCount / limits.requestsPerHour) * 100;

            return (
              <div key={service.service} className="border-2 border-gray-200 p-4 rounded hover:border-[#FFC400] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-black text-lg uppercase ${getServiceStatusColor(service.minuteCount, limits.requestsPerMinute)}`}>
                      {service.service}
                    </span>
                    {getServiceStatusIcon(service.minuteCount, limits.requestsPerMinute)}
                    {service.active > 0 && (
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-bold">
                        {service.active} aktiv
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Minute Limit */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-600">PER MINUT</span>
                      <span className={getServiceStatusColor(service.minuteCount, limits.requestsPerMinute)}>
                        {service.minuteCount} / {limits.requestsPerMinute}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          minutePercentage >= 90 ? 'bg-red-500' :
                          minutePercentage >= 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, minutePercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Hour Limit */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-gray-600">PER TIMME</span>
                      <span className={getServiceStatusColor(service.hourCount, limits.requestsPerHour)}>
                        {service.hourCount} / {limits.requestsPerHour}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          hourPercentage >= 90 ? 'bg-red-500' :
                          hourPercentage >= 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, hourPercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {status.serviceStats.some((s: any) => {
        const limits = getServiceLimits(s.service);
        return (s.minuteCount / limits.requestsPerMinute) >= 0.9;
      }) && (
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800">⚠️ Rate Limit Varning</p>
              <p className="text-sm text-red-700 mt-1">
                En eller flera services närmar sig sina rate limits. Requests kommer automatiskt köas och fördröjas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get service limits (should match requestQueue.ts)
function getServiceLimits(service: string) {
  const limits: Record<string, { requestsPerMinute: number; requestsPerHour: number }> = {
    gemini: { requestsPerMinute: 15, requestsPerHour: 1500 },
    groq: { requestsPerMinute: 30, requestsPerHour: 14400 },
    deepseek: { requestsPerMinute: 20, requestsPerHour: 3000 },
    firecrawl: { requestsPerMinute: 10, requestsPerHour: 500 },
    octoparse: { requestsPerMinute: 5, requestsPerHour: 100 },
    allabolag: { requestsPerMinute: 10, requestsPerHour: 200 },
    ratsit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    hunter: { requestsPerMinute: 10, requestsPerHour: 100 },
    newsapi: { requestsPerMinute: 5, requestsPerHour: 100 }
  };

  return limits[service] || { requestsPerMinute: 10, requestsPerHour: 100 };
}
