import React, { useState, useEffect } from 'react';
import { Cpu, Key, DollarSign, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LLMConfig {
  id: string;
  provider: string;
  model_name: string;
  is_enabled: boolean;
  priority: number;
  cost_per_1m_tokens: number;
  features: string[];
  api_key_set: boolean;
}

export const LLMConfigPanel: React.FC = () => {
  const [configs, setConfigs] = useState<LLMConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/llm-configs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setConfigs(data.configs || []);
    } catch (error) {
      console.error('Failed to load LLM configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLLM = async (id: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/admin/llm-configs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_enabled: enabled })
      });
      loadConfigs();
    } catch (error) {
      console.error('Toggle LLM error:', error);
    }
  };

  const updateAPIKey = async (id: string) => {
    if (!apiKeyInput.trim()) {
      alert('API-nyckel kan inte vara tom');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/llm-configs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key: apiKeyInput })
      });

      if (response.ok) {
        alert('✅ API-nyckel uppdaterad!');
        setEditingKey(null);
        setApiKeyInput('');
        loadConfigs();
      } else {
        alert('❌ Kunde inte uppdatera API-nyckel');
      }
    } catch (error) {
      console.error('Update API key error:', error);
      alert('Nätverksfel');
    }
  };

  const testLLM = async (id: string, provider: string) => {
    setTestingProvider(provider);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/llm-configs/${id}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ ${provider} fungerar!\n\nSvar: ${result.response}`);
      } else {
        alert(`❌ ${provider} misslyckades:\n${result.error}`);
      }
    } catch (error) {
      alert(`❌ Test misslyckades: ${error}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const updatePriority = async (id: string, priority: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/admin/llm-configs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority })
      });
      loadConfigs();
    } catch (error) {
      console.error('Update priority error:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Laddar LLM-konfigurationer...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Cpu className="w-6 h-6" />
          LLM Configuration
        </h2>
        <p className="text-gray-600 mt-1">
          Hantera AI-modeller och API-nycklar. Aktivera/inaktivera providers och sätt prioritet.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Så fungerar prioritering:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Högre prioritet = används först</li>
              <li>Om primär LLM misslyckas, används nästa i ordningen</li>
              <li>Groq (gratis) rekommenderas som fallback</li>
            </ul>
          </div>
        </div>
      </div>

      {/* LLM Cards */}
      <div className="grid gap-4">
        {configs.map((config) => (
          <div
            key={config.id}
            className={`bg-white rounded-lg shadow-md p-6 border-2 ${
              config.is_enabled ? 'border-green-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{config.provider}</h3>
                  {config.is_enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{config.model_name}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Enable/Disable Toggle */}
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={config.is_enabled}
                    onChange={(e) => toggleLLM(config.id, e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`block w-14 h-8 rounded-full ${
                      config.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                      config.is_enabled ? 'transform translate-x-6' : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-medium">Prioritet</span>
                </div>
                <input
                  type="number"
                  value={config.priority}
                  onChange={(e) => updatePriority(config.id, parseInt(e.target.value))}
                  className="w-full text-lg font-bold bg-transparent border-0 p-0"
                  min="0"
                  max="100"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium">Kostnad/1M tokens</span>
                </div>
                <div className="text-lg font-bold">
                  ${config.cost_per_1m_tokens.toFixed(2)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Key className="w-4 h-4" />
                  <span className="text-xs font-medium">API-nyckel</span>
                </div>
                <div className="text-lg font-bold">
                  {config.api_key_set ? (
                    <span className="text-green-600">✓ Konfigurerad</span>
                  ) : (
                    <span className="text-red-600">✗ Saknas</span>
                  )}
                </div>
              </div>
            </div>

            {/* API Key Management */}
            <div className="border-t pt-4">
              {editingKey === config.id ? (
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Ange API-nyckel..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => updateAPIKey(config.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => {
                      setEditingKey(null);
                      setApiKeyInput('');
                    }}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Avbryt
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingKey(config.id)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    {config.api_key_set ? 'Uppdatera API-nyckel' : 'Lägg till API-nyckel'}
                  </button>
                  <button
                    onClick={() => testLLM(config.id, config.provider)}
                    disabled={!config.api_key_set || testingProvider === config.provider}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {testingProvider === config.provider ? 'Testar...' : 'Testa'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-bold mb-3">📚 Var får jag API-nycklar?</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Google Gemini:</strong>{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              https://aistudio.google.com/app/apikey
            </a>
          </li>
          <li>
            <strong>Groq (GRATIS):</strong>{' '}
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              https://console.groq.com/keys
            </a>
          </li>
          <li>
            <strong>OpenAI:</strong>{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              https://platform.openai.com/api-keys
            </a>
          </li>
          <li>
            <strong>Anthropic Claude:</strong>{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              https://console.anthropic.com/settings/keys
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
