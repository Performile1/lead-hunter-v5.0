import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Eye, EyeOff, Copy, ExternalLink, Loader2 } from 'lucide-react';

interface APIKeyStatus {
  name: string;
  envVar: string;
  configured: boolean;
  valid: boolean | null;
  testing: boolean;
  lastTested: string | null;
  usage?: {
    used: number;
    limit: number;
    percentage: number;
  };
  service: string;
  priority: 'critical' | 'recommended' | 'optional';
  cost: string;
  docsUrl: string;
}

export default function APIKeysPanel() {
  const [apiKeys, setApiKeys] = useState<APIKeyStatus[]>([]);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [testingAll, setTestingAll] = useState(false);

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = () => {
    const keys: APIKeyStatus[] = [
      {
        name: 'Gemini (Google)',
        envVar: 'VITE_GEMINI_API_KEY',
        configured: !!import.meta.env.VITE_GEMINI_API_KEY,
        valid: null,
        testing: false,
        lastTested: null,
        service: 'AI Analysis',
        priority: 'critical',
        cost: 'Gratis (20 req/dag)',
        docsUrl: 'https://aistudio.google.com/app/apikey'
      },
      {
        name: 'Groq',
        envVar: 'VITE_GROQ_API_KEY',
        configured: !!import.meta.env.VITE_GROQ_API_KEY,
        valid: null,
        testing: false,
        lastTested: null,
        service: 'AI Fallback',
        priority: 'critical',
        cost: 'Gratis (14,400 req/dag)',
        docsUrl: 'https://console.groq.com/keys'
      },
      {
        name: 'Firecrawl',
        envVar: 'VITE_FIRECRAWL_API_KEY',
        configured: !!import.meta.env.VITE_FIRECRAWL_API_KEY,
        valid: null,
        testing: false,
        lastTested: null,
        service: 'Web Scraping',
        priority: 'recommended',
        cost: 'Freemium (500 credits/månad)',
        docsUrl: 'https://firecrawl.dev'
      },
      {
        name: 'DeepSeek',
        envVar: 'VITE_DEEPSEEK_API_KEY',
        configured: !!import.meta.env.VITE_DEEPSEEK_API_KEY,
        valid: null,
        testing: false,
        lastTested: null,
        service: 'AI Backup',
        priority: 'recommended',
        cost: '$0.14/1M tokens',
        docsUrl: 'https://platform.deepseek.com'
      },
      {
        name: 'Algolia',
        envVar: 'VITE_ALGOLIA_API_KEY',
        configured: !!import.meta.env.VITE_ALGOLIA_API_KEY,
        valid: null,
        testing: false,
        lastTested: null,
        service: 'Search',
        priority: 'recommended',
        cost: 'Gratis (10,000 records)',
        docsUrl: 'https://www.algolia.com'
      },
      {
        name: 'Claude (Anthropic)',
        envVar: 'VITE_CLAUDE_API_KEY',
        configured: !!import.meta.env.VITE_CLAUDE_API_KEY,
        valid: null,
        testing: false,
        lastTested: null,
        service: 'AI Premium',
        priority: 'optional',
        cost: '$3-15/1M tokens',
        docsUrl: 'https://console.anthropic.com'
      },
      {
        name: 'Octoparse',
        envVar: 'VITE_OCTOPARSE_API_KEY',
        configured: !!import.meta.env.VITE_OCTOPARSE_API_KEY,
        valid: null,
        testing: false,
        lastTested: null,
        service: 'Scraping Fallback',
        priority: 'optional',
        cost: 'Betald',
        docsUrl: 'https://www.octoparse.com'
      },
      {
        name: 'NewsAPI',
        envVar: 'VITE_NEWS_API_KEY',
        configured: !!import.meta.env.VITE_NEWS_API_KEY,
        valid: null,
        testing: false,
        lastTested: null,
        service: 'News',
        priority: 'optional',
        cost: 'Gratis (100 req/dag)',
        docsUrl: 'https://newsapi.org'
      },
      {
        name: 'Hunter.io',
        envVar: 'VITE_HUNTER_API_KEY',
        configured: !!import.meta.env.VITE_HUNTER_API_KEY,
        valid: null,
        testing: false,
        lastTested: null,
        service: 'Email Verification',
        priority: 'optional',
        cost: 'Freemium (50 req/månad)',
        docsUrl: 'https://hunter.io/api'
      }
    ];

    setApiKeys(keys);
  };

  const testAPIKey = async (key: APIKeyStatus) => {
    setApiKeys(prev => prev.map(k => 
      k.envVar === key.envVar ? { ...k, testing: true } : k
    ));

    try {
      let isValid = false;

      switch (key.envVar) {
        case 'VITE_GEMINI_API_KEY':
          isValid = await testGeminiKey();
          break;
        case 'VITE_GROQ_API_KEY':
          isValid = await testGroqKey();
          break;
        case 'VITE_FIRECRAWL_API_KEY':
          isValid = await testFirecrawlKey();
          break;
        case 'VITE_DEEPSEEK_API_KEY':
          isValid = await testDeepSeekKey();
          break;
        case 'VITE_ALGOLIA_API_KEY':
          isValid = await testAlgoliaKey();
          break;
        case 'VITE_CLAUDE_API_KEY':
          isValid = await testClaudeKey();
          break;
        default:
          isValid = key.configured;
      }

      setApiKeys(prev => prev.map(k => 
        k.envVar === key.envVar 
          ? { ...k, testing: false, valid: isValid, lastTested: new Date().toISOString() }
          : k
      ));
    } catch (error) {
      console.error(`Error testing ${key.name}:`, error);
      setApiKeys(prev => prev.map(k => 
        k.envVar === key.envVar 
          ? { ...k, testing: false, valid: false, lastTested: new Date().toISOString() }
          : k
      ));
    }
  };

  const testGeminiKey = async (): Promise<boolean> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return false;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'test' }] }]
          })
        }
      );
      return response.ok || response.status === 429;
    } catch {
      return false;
    }
  };

  const testGroqKey = async (): Promise<boolean> => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) return false;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const testFirecrawlKey = async (): Promise<boolean> => {
    const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
    if (!apiKey) return false;

    try {
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      return response.ok || response.status === 402;
    } catch {
      return false;
    }
  };

  const testDeepSeekKey = async (): Promise<boolean> => {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) return false;

    try {
      const response = await fetch('https://api.deepseek.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const testAlgoliaKey = async (): Promise<boolean> => {
    const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
    const apiKey = import.meta.env.VITE_ALGOLIA_API_KEY;
    if (!appId || !apiKey) return false;

    try {
      const response = await fetch(`https://${appId}-dsn.algolia.net/1/indexes`, {
        headers: {
          'X-Algolia-Application-Id': appId,
          'X-Algolia-API-Key': apiKey
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const testClaudeKey = async (): Promise<boolean> => {
    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (!apiKey) return false;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.ok || response.status === 429;
    } catch {
      return false;
    }
  };

  const testAllKeys = async () => {
    setTestingAll(true);
    const configuredKeys = apiKeys.filter(k => k.configured);
    
    for (const key of configuredKeys) {
      await testAPIKey(key);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setTestingAll(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (key: APIKeyStatus) => {
    if (key.testing) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    if (!key.configured) {
      return <XCircle className="w-5 h-5 text-gray-400" />;
    }
    if (key.valid === null) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    if (key.valid) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = (key: APIKeyStatus) => {
    if (key.testing) return 'Testar...';
    if (!key.configured) return 'Inte konfigurerad';
    if (key.valid === null) return 'Ej testad';
    if (key.valid) return 'Giltig';
    return 'Ogiltig';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'recommended': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'optional': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔴 KRITISK';
      case 'recommended': return '🟡 REKOMMENDERAD';
      case 'optional': return '🟢 VALFRI';
      default: return priority;
    }
  };

  const criticalKeys = apiKeys.filter(k => k.priority === 'critical');
  const recommendedKeys = apiKeys.filter(k => k.priority === 'recommended');
  const optionalKeys = apiKeys.filter(k => k.priority === 'optional');

  const configuredCount = apiKeys.filter(k => k.configured).length;
  const validCount = apiKeys.filter(k => k.valid === true).length;
  const criticalConfigured = criticalKeys.filter(k => k.configured).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-7 h-7 text-dhl-red" />
            API-nycklar Management
          </h2>
          <p className="text-gray-600 mt-1">
            Hantera och testa alla API-nycklar för systemet
          </p>
        </div>
        <button
          onClick={testAllKeys}
          disabled={testingAll || configuredCount === 0}
          className="px-4 py-2 bg-dhl-red text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${testingAll ? 'animate-spin' : ''}`} />
          {testingAll ? 'Testar alla...' : 'Testa alla nycklar'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Konfigurerade</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">
            {configuredCount}/{apiKeys.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Giltiga</div>
          <div className="text-3xl font-bold text-green-600 mt-1">
            {validCount}/{configuredCount}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Kritiska OK</div>
          <div className="text-3xl font-bold text-dhl-red mt-1">
            {criticalConfigured}/{criticalKeys.length}
          </div>
        </div>
      </div>

      {criticalConfigured < criticalKeys.length && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Kritiska API-nycklar saknas!</h3>
              <p className="text-sm text-red-700 mt-1">
                Systemet kräver att alla kritiska API-nycklar är konfigurerade för att fungera korrekt.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {[
          { title: '🔴 KRITISKA API-nycklar', keys: criticalKeys },
          { title: '🟡 REKOMMENDERADE API-nycklar', keys: recommendedKeys },
          { title: '🟢 VALFRIA API-nycklar', keys: optionalKeys }
        ].map(section => (
          <div key={section.title}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
            <div className="space-y-3">
              {section.keys.map(key => (
                <div
                  key={key.envVar}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(key)}
                        <div>
                          <h4 className="font-semibold text-gray-900">{key.name}</h4>
                          <p className="text-sm text-gray-600">{key.service}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(key.priority)}`}>
                          {getPriorityLabel(key.priority)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className={`ml-2 font-medium ${
                            key.valid === true ? 'text-green-600' : 
                            key.valid === false ? 'text-red-600' : 
                            'text-yellow-600'
                          }`}>
                            {getStatusText(key)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Kostnad:</span>
                          <span className="ml-2 font-medium text-gray-900">{key.cost}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Variabel:</span>
                          <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{key.envVar}</code>
                        </div>
                        {key.lastTested && (
                          <div>
                            <span className="text-gray-600">Senast testad:</span>
                            <span className="ml-2 text-gray-900">
                              {new Date(key.lastTested).toLocaleString('sv-SE')}
                            </span>
                          </div>
                        )}
                      </div>

                      {key.configured && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded px-3 py-2 font-mono text-sm">
                            {showKeys[key.envVar] 
                              ? (import.meta.env[key.envVar] as string)?.substring(0, 30) + '...'
                              : '••••••••••••••••••••••••••••••'
                            }
                          </div>
                          <button
                            onClick={() => setShowKeys(prev => ({ ...prev, [key.envVar]: !prev[key.envVar] }))}
                            className="p-2 hover:bg-gray-100 rounded"
                            title={showKeys[key.envVar] ? 'Dölj nyckel' : 'Visa nyckel'}
                          >
                            {showKeys[key.envVar] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(import.meta.env[key.envVar] as string)}
                            className="p-2 hover:bg-gray-100 rounded"
                            title="Kopiera nyckel"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {key.configured && (
                        <button
                          onClick={() => testAPIKey(key)}
                          disabled={key.testing}
                          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${key.testing ? 'animate-spin' : ''}`} />
                          Testa
                        </button>
                      )}
                      <a
                        href={key.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Docs
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips för API-nycklar</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Alla frontend-nycklar måste ha <code className="bg-blue-100 px-1 rounded">VITE_</code> prefix</li>
          <li>• Lägg till nycklar i <code className="bg-blue-100 px-1 rounded">.env</code> i root (inte server/.env.mt)</li>
          <li>• Starta om servern efter att ha lagt till nya nycklar</li>
          <li>• Rensa Vite cache: <code className="bg-blue-100 px-1 rounded">Remove-Item -Recurse -Force node_modules\.vite</code></li>
          <li>• Lägg till samma nycklar i Vercel Environment Variables för production</li>
        </ul>
      </div>
    </div>
  );
}
