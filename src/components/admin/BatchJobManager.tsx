import React, { useState, useEffect } from 'react';
import { Clock, Play, Trash2, Plus, Calendar, Search, BarChart3, Settings } from 'lucide-react';

interface BatchJob {
  id: string;
  job_name: string;
  job_type: 'search' | 'analysis' | 'both';
  schedule_time: string;
  schedule_days: string;
  is_active: boolean;
  search_query?: string;
  max_results: number;
  analysis_protocol: string;
  llm_provider: string;
  auto_assign: boolean;
  terminal_name?: string;
  last_run_at?: string;
  next_run_at: string;
  total_runs: number;
  total_leads_found: number;
  total_leads_analyzed: number;
  created_by_name: string;
  execution_count: number;
}

export const BatchJobManager: React.FC = () => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/batch-jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to load batch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeJob = async (jobId: string) => {
    if (!confirm('Vill du köra detta batch-jobb nu?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/batch-jobs/${jobId}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Batch-jobb startat!');
        loadJobs();
      } else {
        alert('❌ Kunde inte starta batch-jobb');
      }
    } catch (error) {
      console.error('Failed to execute job:', error);
      alert('❌ Nätverksfel');
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/batch-jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to toggle job:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta batch-jobb?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/batch-jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Batch-jobb borttaget');
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'search': return <Search className="w-5 h-5" />;
      case 'analysis': return <BarChart3 className="w-5 h-5" />;
      case 'both': return <Settings className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'search': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-green-100 text-green-800';
      case 'both': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSchedule = (time: string, days: string) => {
    const dayLabels: Record<string, string> = {
      daily: 'Varje dag',
      weekdays: 'Vardagar',
      weekends: 'Helger',
      custom: 'Anpassat'
    };
    return `${time} - ${dayLabels[days] || days}`;
  };

  if (loading) {
    return (
      <div className="bg-white p-12 text-center shadow-md">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Laddar batch-jobb...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-primary p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary uppercase flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Schemalagda Batch-Jobb
            </h2>
            <p className="text-gray-600 mt-1">
              Automatiska sökningar och analyser som körs på kvällar
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded hover:bg-opacity-90 transition font-semibold uppercase"
          >
            <Plus className="w-5 h-5" />
            Nytt Jobb
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Totalt Jobb</p>
            <p className="text-3xl font-bold text-blue-600">{jobs.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Aktiva</p>
            <p className="text-3xl font-bold text-green-600">
              {jobs.filter(j => j.is_active).length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Totalt Leads Hittade</p>
            <p className="text-3xl font-bold text-purple-600">
              {jobs.reduce((sum, j) => sum + j.total_leads_found, 0)}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Totalt Analyserade</p>
            <p className="text-3xl font-bold text-yellow-600">
              {jobs.reduce((sum, j) => sum + j.total_leads_analyzed, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Job List */}
      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map(job => (
            <div
              key={job.id}
              className={`bg-white border-l-4 p-6 shadow-md hover:shadow-lg transition ${
                job.is_active ? 'border-dhl-yellow' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded ${getJobTypeColor(job.job_type)}`}>
                      {getJobTypeIcon(job.job_type)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{job.job_name}</h3>
                      <p className="text-sm text-gray-600">Skapad av: {job.created_by_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getJobTypeColor(job.job_type)}`}>
                      {job.job_type}
                    </span>
                    {!job.is_active && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                        INAKTIV
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-gray-600">Schema</p>
                        <p className="font-semibold">{formatSchedule(job.schedule_time, job.schedule_days)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-gray-600">Nästa Körning</p>
                        <p className="font-semibold">
                          {new Date(job.next_run_at).toLocaleString('sv-SE', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-gray-600">Körningar</p>
                        <p className="font-semibold">{job.total_runs}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Search className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-gray-600">Resultat</p>
                        <p className="font-semibold">
                          {job.total_leads_found} / {job.total_leads_analyzed}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Config */}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {job.search_query && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Query: {job.search_query}
                      </span>
                    )}
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Max: {job.max_results} leads
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Protocol: {job.analysis_protocol}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      LLM: {job.llm_provider}
                    </span>
                    {job.auto_assign && job.terminal_name && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Auto-assign: {job.terminal_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => executeJob(job.id)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition text-sm font-semibold uppercase"
                  >
                    <Play className="w-4 h-4" />
                    Kör Nu
                  </button>

                  <button
                    onClick={() => toggleJobStatus(job.id, job.is_active)}
                    className={`px-4 py-2 rounded transition text-sm font-semibold uppercase ${
                      job.is_active
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {job.is_active ? 'Pausa' : 'Aktivera'}
                  </button>

                  <button
                    onClick={() => deleteJob(job.id)}
                    className="flex items-center gap-2 bg-white border border-red-300 text-red-600 px-4 py-2 rounded hover:bg-red-50 transition text-sm font-semibold uppercase"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ta Bort
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center shadow-md">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Inga batch-jobb ännu</p>
          <p className="text-gray-400 text-sm mt-2">
            Skapa ditt första batch-jobb för automatiska sökningar och analyser
          </p>
        </div>
      )}
    </div>
  );
};
