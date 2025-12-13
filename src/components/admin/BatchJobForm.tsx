import React, { useState, useEffect } from 'react';
import { X, Clock, Search, BarChart3, Calendar, Settings } from 'lucide-react';

interface BatchJobFormProps {
  onClose: () => void;
  onJobCreated: () => void;
}

export const BatchJobForm: React.FC<BatchJobFormProps> = ({ onClose, onJobCreated }) => {
  const [jobName, setJobName] = useState('');
  const [jobType, setJobType] = useState<'search' | 'analysis' | 'both'>('both');
  const [scheduleTime, setScheduleTime] = useState('22:00');
  const [scheduleDays, setScheduleDays] = useState('weekdays');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [analysisProtocol, setAnalysisProtocol] = useState('quick');
  const [llmProvider, setLlmProvider] = useState('gemini');
  const [autoAssign, setAutoAssign] = useState(false);
  const [assignToTerminal, setAssignToTerminal] = useState('');
  const [terminals, setTerminals] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTerminals();
  }, []);

  const loadTerminals = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/terminals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setTerminals(data.terminals || []);
    } catch (error) {
      console.error('Failed to load terminals:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/batch-jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_name: jobName,
          job_type: jobType,
          schedule_time: scheduleTime,
          schedule_days: scheduleDays,
          search_query: searchQuery || null,
          max_results: maxResults,
          analysis_protocol: analysisProtocol,
          llm_provider: llmProvider,
          auto_assign: autoAssign,
          assign_to_terminal: autoAssign ? assignToTerminal : null
        })
      });

      if (response.ok) {
        alert('✅ Batch-jobb skapat!');
        onJobCreated();
        onClose();
      } else {
        const error = await response.json();
        alert(`❌ Fel: ${error.error || 'Kunde inte skapa batch-jobb'}`);
      }
    } catch (error) {
      console.error('Failed to create batch job:', error);
      alert('❌ Nätverksfel');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-dhl-red text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6" />
            <h2 className="text-xl font-bold uppercase">Skapa Batch-Jobb</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Job Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
              Jobbnamn
            </label>
            <input
              type="text"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="t.ex. Nattlig sökning - Logistikföretag"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-dhl-red"
              required
            />
          </div>

          {/* Job Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
              Jobbtyp
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`flex items-center gap-2 p-4 border-2 rounded cursor-pointer transition ${
                jobType === 'search' ? 'border-dhl-red bg-red-50' : 'border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="jobType"
                  value="search"
                  checked={jobType === 'search'}
                  onChange={(e) => setJobType(e.target.value as any)}
                  className="w-4 h-4"
                />
                <Search className="w-5 h-5" />
                <span className="font-semibold">Endast Sökning</span>
              </label>

              <label className={`flex items-center gap-2 p-4 border-2 rounded cursor-pointer transition ${
                jobType === 'analysis' ? 'border-dhl-red bg-red-50' : 'border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="jobType"
                  value="analysis"
                  checked={jobType === 'analysis'}
                  onChange={(e) => setJobType(e.target.value as any)}
                  className="w-4 h-4"
                />
                <BarChart3 className="w-5 h-5" />
                <span className="font-semibold">Endast Analys</span>
              </label>

              <label className={`flex items-center gap-2 p-4 border-2 rounded cursor-pointer transition ${
                jobType === 'both' ? 'border-dhl-red bg-red-50' : 'border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="jobType"
                  value="both"
                  checked={jobType === 'both'}
                  onChange={(e) => setJobType(e.target.value as any)}
                  className="w-4 h-4"
                />
                <Settings className="w-5 h-5" />
                <span className="font-semibold">Sök & Analysera</span>
              </label>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                Tid
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-dhl-red"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Rekommenderat: 20:00 - 23:00 (kvällstid)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                Dagar
              </label>
              <select
                value={scheduleDays}
                onChange={(e) => setScheduleDays(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-dhl-red"
              >
                <option value="daily">Varje dag</option>
                <option value="weekdays">Vardagar (Mån-Fre)</option>
                <option value="weekends">Helger (Lör-Sön)</option>
              </select>
            </div>
          </div>

          {/* Search Query */}
          {(jobType === 'search' || jobType === 'both') && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                Sökfråga
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="t.ex. logistikföretag Stockholm"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-dhl-red"
              />
              <p className="text-xs text-gray-500 mt-1">
                Sök efter företag i Bolagsverket eller andra datakällor
              </p>
            </div>
          )}

          {/* Max Results */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
              Max Antal Resultat: {maxResults}
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Högre antal = längre körtid och högre kostnad
            </p>
          </div>

          {/* Analysis Settings */}
          {(jobType === 'analysis' || jobType === 'both') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Analysprotokoll
                  </label>
                  <select
                    value={analysisProtocol}
                    onChange={(e) => setAnalysisProtocol(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-dhl-red"
                  >
                    <option value="quick">Quick Scan (Snabb)</option>
                    <option value="batch">Batch Prospecting (Batch)</option>
                    <option value="deep">Deep Analysis (Djup)</option>
                    <option value="deep-pro">Deep PRO (Mest omfattande)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    AI-Modell
                  </label>
                  <select
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-dhl-red"
                  >
                    <option value="gemini">Gemini (Rekommenderad)</option>
                    <option value="groq">Groq (Snabbast)</option>
                    <option value="openai">OpenAI (GPT-4)</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="ollama">Ollama (Lokal)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Auto-Assign */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAssign}
                onChange={(e) => setAutoAssign(e.target.checked)}
                className="mt-1 w-5 h-5 text-dhl-red border-gray-300 rounded focus:ring-dhl-red"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  Automatisk Tilldelning
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Tilldela automatiskt nya leads till en terminal baserat på postnummer
                </p>
              </div>
            </label>

            {autoAssign && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Välj Terminal
                </label>
                <select
                  value={assignToTerminal}
                  onChange={(e) => setAssignToTerminal(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-dhl-red"
                  required={autoAssign}
                >
                  <option value="">Välj terminal...</option>
                  {terminals.map(terminal => (
                    <option key={terminal.id} value={terminal.id}>
                      {terminal.name} ({terminal.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tips:</strong> Batch-jobb körs automatiskt på schemalagd tid. Använd kvällstid
              (20:00-23:00) för att undvika att påverka dagtid-prestanda. Quick Scan eller Batch
              Prospecting rekommenderas för stora volymer.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-dhl-red text-white px-6 py-3 rounded hover:bg-opacity-90 transition disabled:bg-gray-300 font-semibold uppercase flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Skapar...
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  Skapa Batch-Jobb
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50 transition font-semibold uppercase"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
