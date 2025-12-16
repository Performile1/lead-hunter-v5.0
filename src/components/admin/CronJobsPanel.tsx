import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Trash2, Plus, CheckCircle, XCircle, Calendar, Search, X, ArrowLeft } from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'success' | 'error';
  lastError?: string;
  type?: 'lead_search' | 'data_update' | 'backup' | 'custom';
  config?: any;
}

interface CronJobsPanelProps {
  userRole?: 'admin' | 'terminalchef' | 'säljare' | 'manager';
  onBack?: () => void;
}

export const CronJobsPanel: React.FC<CronJobsPanelProps> = ({ userRole = 'admin', onBack }) => {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const hasFetchedRef = useRef(false);
  
  // Alla roller kan skapa cronjobs
  const canCreateJobs = true;
  const canDeleteJobs = userRole === 'admin' || userRole === 'manager';

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchJobs();
    }
    
    // Poll every 10 seconds only if API is available
    const interval = setInterval(() => {
      if (apiAvailable === true) {
        fetchJobs();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [apiAvailable]);

  const fetchJobs = async () => {
    // Don't retry if we already know API is unavailable
    if (apiAvailable === false) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/cronjobs`);
      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          console.warn('Cronjobs API not available yet. Showing empty list.');
          setApiAvailable(false);
          setJobs([]);
          return;
        }
        throw new Error('Failed to fetch cronjobs');
      }
      const data = await response.json();
      setJobs(Array.isArray(data) ? data : []);
      setApiAvailable(true);
    } catch (error) {
      console.warn('Cronjobs API not available yet. Showing empty list.');
      setApiAvailable(false);
      setJobs([]);
    }
  };

  const toggleJob = async (id: string, enabled: boolean) => {
    try {
      await fetch(`${API_BASE_URL}/cronjobs/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      fetchJobs();
    } catch (error) {
      console.error('Failed to toggle job:', error);
    }
  };

  const runJob = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/cronjobs/${id}/run`, { method: 'POST' });
      fetchJobs();
    } catch (error) {
      console.error('Failed to run job:', error);
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta cronjob?')) return;
    
    try {
      await fetch(`${API_BASE_URL}/cronjobs/${id}`, { method: 'DELETE' });
      fetchJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const getStatusBadge = (status: CronJob['status']) => {
    switch (status) {
      case 'running':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">KÖRS</span>;
      case 'success':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded flex items-center gap-1"><CheckCircle className="w-3 h-3" />KLAR</span>;
      case 'error':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded flex items-center gap-1"><XCircle className="w-3 h-3" />FEL</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded">VÄNTAR</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-semibold text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6 text-black" />
              Cronjobs
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Hantera schemalagda uppgifter och automatiseringar
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-[#B00410] font-semibold text-sm uppercase tracking-wide"
        >
          <Plus className="w-4 h-4" />
          Nytt Cronjob
        </button>
      </div>

      <div className="space-y-4">
        {jobs.map(job => (
          <div key={job.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{job.name}</h3>
                  {getStatusBadge(job.status)}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={job.enabled}
                      onChange={(e) => toggleJob(job.id, e.target.checked)}
                      className="w-4 h-4 text-black rounded focus:ring-[#2563EB]"
                    />
                    <span className="text-sm font-semibold text-slate-600">
                      {job.enabled ? 'Aktiverad' : 'Inaktiverad'}
                    </span>
                  </label>
                </div>
                <p className="text-sm text-slate-600 mb-2">{job.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Schema: <code className="bg-slate-100 px-1 rounded">{job.schedule}</code>
                  </span>
                  {job.lastRun && (
                    <span>
                      Senaste körning: {new Date(job.lastRun).toLocaleString('sv-SE')}
                    </span>
                  )}
                  {job.nextRun && (
                    <span>
                      Nästa körning: {new Date(job.nextRun).toLocaleString('sv-SE')}
                    </span>
                  )}
                </div>
                {job.lastError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                    <strong>Fel:</strong> {job.lastError}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runJob(job.id)}
                  disabled={job.status === 'running'}
                  className="p-2 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Kör nu"
                >
                  <Play className="w-4 h-4 text-green-600" />
                </button>
                {canDeleteJobs && (
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Ta bort"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">Inga cronjobs konfigurerade</p>
            <p className="text-sm mt-2">Klicka på "Nytt Cronjob" för att skapa ett</p>
          </div>
        )}
      </div>

      {/* Add Cronjob Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900">Nytt Cronjob</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-lg mb-4">Välj typ av cronjob</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lead Search Cronjob */}
                  <button
                    onClick={() => {/* TODO: Open lead search config */}}
                    className="p-6 border-2 border-slate-200 rounded-lg hover:hover:bg-slate-50 transition-all text-left group"
                  >
                    <Search className="w-8 h-8 text-black mb-3" />
                    <h5 className="font-bold text-lg mb-2 group-hover:text-black">Sök nya leads</h5>
                    <p className="text-sm text-slate-600">
                      Schemalägg automatisk sökning efter nya leads baserat på dina kriterier
                    </p>
                    <div className="mt-3 text-xs text-slate-500">
                      <strong>Exempel:</strong> Daglig sökning i Stockholm, KAM-segment
                    </div>
                  </button>

                  {/* Data Update Cronjob */}
                  <button
                    onClick={() => {/* TODO: Open data update config */}}
                    className="p-6 border-2 border-slate-200 rounded-lg hover:hover:bg-slate-50 transition-all text-left group"
                  >
                    <Calendar className="w-8 h-8 text-black mb-3" />
                    <h5 className="font-bold text-lg mb-2 group-hover:text-black">Uppdatera kunddata</h5>
                    <p className="text-sm text-slate-600">
                      Schemalägg automatisk uppdatering av befintlig kunddata från Allabolag
                    </p>
                    <div className="mt-3 text-xs text-slate-500">
                      <strong>Exempel:</strong> Veckovis uppdatering av omsättning
                    </div>
                  </button>

                  {/* Custom Cronjob */}
                  <button
                    onClick={() => {/* TODO: Open custom config */}}
                    className="p-6 border-2 border-slate-200 rounded-lg hover:hover:bg-slate-50 transition-all text-left group"
                  >
                    <Plus className="w-8 h-8 text-black mb-3" />
                    <h5 className="font-bold text-lg mb-2 group-hover:text-black">Anpassat cronjob</h5>
                    <p className="text-sm text-slate-600">
                      Skapa ett anpassat cronjob med egna inställningar
                    </p>
                    <div className="mt-3 text-xs text-slate-500">
                      <strong>Exempel:</strong> Backup, rapporter, notifikationer
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
