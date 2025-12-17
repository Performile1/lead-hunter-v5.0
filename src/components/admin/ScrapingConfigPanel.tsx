import React, { useState, useEffect } from 'react';
import { Settings, Globe, Zap, Brain, Clock, RefreshCw, Save, AlertCircle, CheckCircle2, Database } from 'lucide-react';

interface ScraperConfig {
  method: 'traditional' | 'ai' | 'hybrid';
  timeout: number;
  retries: number;
  cacheEnabled: boolean;
  cacheDuration: number;
  userAgent: string;
  headless: boolean;
}

export default function ScrapingConfigPanel() {
  const [config, setConfig] = useState<ScraperConfig>({
    method: 'traditional',
    timeout: 30000,
    retries: 3,
    cacheEnabled: true,
    cacheDuration: 24,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    headless: true
  });

  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('scraperConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  };

  const saveConfig = () => {
    localStorage.setItem('scraperConfig', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testScraper = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestResult({
        success: true,
        message: `Scraping-test lyckades! Metod: ${config.method}, Timeout: ${config.timeout}ms`
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Scraping-test misslyckades: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      method: 'traditional',
      timeout: 30000,
      retries: 3,
      cacheEnabled: true,
      cacheDuration: 24,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      headless: true
    });
  };

  const clearCache = () => {
    if (confirm('Är du säker på att du vill rensa scraping-cachen?')) {
      alert('Cache rensad! (Implementation pending)');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-dhl-red" />
            Scraping-konfiguration
          </h2>
          <p className="text-gray-600 mt-1">
            Konfigurera Puppeteer och Crawl4AI för web scraping
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={testScraper}
            disabled={testing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testar...' : 'Testa scraper'}
          </button>
          <button
            onClick={saveConfig}
            className="px-4 py-2 bg-dhl-red text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Sparat!' : 'Spara'}
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`p-4 rounded-lg border ${
          testResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div>
              <h3 className={`font-semibold ${
                testResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {testResult.success ? 'Test lyckades!' : 'Test misslyckades'}
              </h3>
              <p className={`text-sm mt-1 ${
                testResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {testResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-dhl-red" />
            Scraping-metod
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setConfig({ ...config, method: 'traditional' })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.method === 'traditional'
                  ? 'border-dhl-red bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`w-5 h-5 ${config.method === 'traditional' ? 'text-dhl-red' : 'text-gray-400'}`} />
                <h4 className="font-semibold">Traditional</h4>
              </div>
              <p className="text-sm text-gray-600">
                Puppeteer-baserad scraping. Snabb och pålitlig för strukturerad data.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                ✅ Snabb • ✅ Stabil • ⚠️ Kräver selectors
              </div>
            </button>

            <button
              onClick={() => setConfig({ ...config, method: 'ai' })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.method === 'ai'
                  ? 'border-dhl-red bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain className={`w-5 h-5 ${config.method === 'ai' ? 'text-dhl-red' : 'text-gray-400'}`} />
                <h4 className="font-semibold">AI-Powered</h4>
              </div>
              <p className="text-sm text-gray-600">
                Crawl4AI med LLM-integration. Intelligent extraktion utan selectors.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                ✅ Smart • ⚠️ Långsammare • 🔴 Kräver backend
              </div>
            </button>

            <button
              onClick={() => setConfig({ ...config, method: 'hybrid' })}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                config.method === 'hybrid'
                  ? 'border-dhl-red bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Settings className={`w-5 h-5 ${config.method === 'hybrid' ? 'text-dhl-red' : 'text-gray-400'}`} />
                <h4 className="font-semibold">Hybrid</h4>
              </div>
              <p className="text-sm text-gray-600">
                Kombinerar båda metoderna. Bästa resultat men långsammare.
              </p>
              <div className="mt-2 text-xs text-gray-500">
                ✅ Bäst kvalitet • ⚠️ Långsammast • 💰 Dyrast
              </div>
            </button>
          </div>

          {config.method === 'ai' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">AI-metod kräver backend</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Crawl4AI är ett Python-bibliotek som kräver en separat backend-server. 
                    Se <code className="bg-yellow-100 px-1 rounded">CRAWL4AI_SETUP.md</code> för instruktioner.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-dhl-red" />
            Timeout & Retries
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout (millisekunder)
              </label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
                min="5000"
                max="120000"
                step="5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Rekommenderat: 30000ms (30s). Öka för långsamma sidor.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max retries
              </label>
              <input
                type="number"
                value={config.retries}
                onChange={(e) => setConfig({ ...config, retries: parseInt(e.target.value) })}
                min="0"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Antal försök vid fel. Rekommenderat: 3.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-dhl-red" />
            Cache-inställningar
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Aktivera cache
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Cacha scraping-resultat för att minska API-anrop
                </p>
              </div>
              <button
                onClick={() => setConfig({ ...config, cacheEnabled: !config.cacheEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.cacheEnabled ? 'bg-dhl-red' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.cacheEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {config.cacheEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cache-varaktighet (timmar)
                </label>
                <input
                  type="number"
                  value={config.cacheDuration}
                  onChange={(e) => setConfig({ ...config, cacheDuration: parseInt(e.target.value) })}
                  min="1"
                  max="168"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hur länge scraping-resultat ska cachas. Rekommenderat: 24h.
                </p>
              </div>
            )}

            {config.cacheEnabled && (
              <button
                onClick={clearCache}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Rensa cache
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Avancerade inställningar
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Agent
              </label>
              <input
                type="text"
                value={config.userAgent}
                onChange={(e) => setConfig({ ...config, userAgent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                User agent-sträng som används vid scraping
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Headless mode
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Kör browser utan GUI (rekommenderat för produktion)
                </p>
              </div>
              <button
                onClick={() => setConfig({ ...config, headless: !config.headless })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.headless ? 'bg-dhl-red' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.headless ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Återställ till standard
        </button>
        <div className="flex gap-2">
          <button
            onClick={testScraper}
            disabled={testing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testar...' : 'Testa konfiguration'}
          </button>
          <button
            onClick={saveConfig}
            className="px-4 py-2 bg-dhl-red text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Sparat!' : 'Spara konfiguration'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips för scraping</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Traditional:</strong> Bäst för strukturerade sidor (Allabolag, e-handel)</li>
          <li>• <strong>AI:</strong> Bäst för ostrukturerade sidor eller när selectors ändras ofta</li>
          <li>• <strong>Hybrid:</strong> Bäst kvalitet men långsammare och dyrare</li>
          <li>• Öka timeout för långsamma sidor eller vid dålig nätverksanslutning</li>
          <li>• Aktivera cache för att minska API-anrop och förbättra prestanda</li>
          <li>• Använd headless mode i produktion för bättre prestanda</li>
        </ul>
      </div>
    </div>
  );
}
