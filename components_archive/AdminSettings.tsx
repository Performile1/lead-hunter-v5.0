import React, { useState } from 'react';
import { 
  Settings, Database, Zap, Globe, Code, Shield, 
  Save, RefreshCw, Trash2, Download, Upload,
  ChevronRight, ChevronDown, Activity, Bell
} from 'lucide-react';

interface AdminSettingsProps {
  onSave: (settings: SystemSettings) => void;
}

interface SystemSettings {
  // Scraping Settings
  scraping: {
    method: 'traditional' | 'ai' | 'hybrid';
    timeout: number;
    retries: number;
    cacheEnabled: boolean;
    cacheDuration: number;
    headless: boolean;
    userAgent: string;
  };
  
  // API Settings
  api: {
    openai_key: string;
    openai_model: string;
    anthropic_key: string;
    anthropic_model: string;
    google_key: string;
    google_model: string;
    rate_limit: number;
    max_concurrent: number;
  };
  
  // Search Settings
  search: {
    default_protocol: string;
    default_llm: string;
    max_batch_size: number;
    auto_analyze: boolean;
    default_focus_positions: {
      prio1: string[];
      prio2: string[];
      prio3: string[];
    };
  };
  
  // UI Settings
  ui: {
    theme: 'light' | 'dark';
    primary_color: string;
    secondary_color: string;
    show_segment_column: boolean;
    default_table_rows: number;
    enable_notifications: boolean;
    notification_sound: boolean;
  };
  
  // Data Settings
  data: {
    auto_backup: boolean;
    backup_frequency: 'daily' | 'weekly' | 'monthly';
    retention_days: number;
    export_format: 'csv' | 'excel' | 'json';
  };
  
  // Security Settings
  security: {
    session_timeout: number;
    require_2fa: boolean;
    password_expiry_days: number;
    max_login_attempts: number;
  };
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onSave }) => {
  const [activeSection, setActiveSection] = useState<string>('scraping');
  const [settings, setSettings] = useState<SystemSettings>({
    scraping: {
      method: 'hybrid',
      timeout: 30000,
      retries: 3,
      cacheEnabled: true,
      cacheDuration: 24,
      headless: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    api: {
      openai_key: '',
      openai_model: 'gpt-4',
      anthropic_key: '',
      anthropic_model: 'claude-3-opus',
      google_key: '',
      google_model: 'gemini-pro',
      rate_limit: 100,
      max_concurrent: 5
    },
    search: {
      default_protocol: 'Djupanalys',
      default_llm: 'GPT-4',
      max_batch_size: 1000,
      auto_analyze: false,
      default_focus_positions: {
        prio1: ['Head of Logistics', 'Logistics Manager', 'COO'],
        prio2: ['Head of Ecommerce', 'Supply Chain Manager'],
        prio3: ['CEO', 'CFO', 'VD']
      }
    },
    ui: {
      theme: 'light',
      primary_color: '#D40511',
      secondary_color: '#FFCC00',
      show_segment_column: true,
      default_table_rows: 50,
      enable_notifications: true,
      notification_sound: true
    },
    data: {
      auto_backup: true,
      backup_frequency: 'daily',
      retention_days: 90,
      export_format: 'excel'
    },
    security: {
      session_timeout: 60,
      require_2fa: false,
      password_expiry_days: 90,
      max_login_attempts: 5
    }
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(settings);
    setHasChanges(false);
  };

  const sections = [
    { id: 'scraping', name: 'Scraping & Crawling', icon: Globe },
    { id: 'api', name: 'API & LLM', icon: Zap },
    { id: 'search', name: 'Sök & Protokoll', icon: Settings },
    { id: 'ui', name: 'UI & Utseende', icon: Code },
    { id: 'data', name: 'Data & Backup', icon: Database },
    { id: 'security', name: 'Säkerhet', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-2 border-[#D40511] rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black italic text-[#D40511] uppercase flex items-center gap-3">
                <Settings className="w-8 h-8" />
                Admin Inställningar
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Konfigurera alla aspekter av DHL Lead Hunter
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 bg-[#D40511] text-white px-6 py-3 rounded-sm font-bold uppercase hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              Spara Ändringar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar */}
          <div className="bg-white border-2 border-slate-300 rounded-lg shadow-md p-4 lg:sticky lg:top-6 lg:self-start">
            <h3 className="text-sm font-bold text-slate-700 uppercase mb-3">Kategorier</h3>
            <div className="space-y-1">
              {sections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-sm flex items-center gap-3 transition-colors ${
                      activeSection === section.id
                        ? 'bg-[#D40511] text-white'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{section.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white border-2 border-slate-300 rounded-lg shadow-md p-6">
            
            {/* Scraping Settings */}
            {activeSection === 'scraping' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#D40511]" />
                    Scraping & Crawling Inställningar
                  </h2>
                  <p className="text-sm text-slate-600 mb-6">
                    Konfigurera hur systemet hämtar data från webbplatser
                  </p>
                </div>

                {/* Scraping Method */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Scraping Metod
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['traditional', 'ai', 'hybrid'].map(method => (
                      <button
                        key={method}
                        onClick={() => updateSetting('scraping', 'method', method)}
                        className={`p-4 rounded-sm border-2 transition-all ${
                          settings.scraping.method === method
                            ? 'border-[#D40511] bg-red-50'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div className="font-bold text-sm capitalize">{method}</div>
                        <div className="text-xs text-slate-600 mt-1">
                          {method === 'traditional' && 'Puppeteer/Playwright'}
                          {method === 'ai' && 'Crawl4AI (LLM)'}
                          {method === 'hybrid' && 'Båda metoderna'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timeout */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={settings.scraping.timeout}
                    onChange={(e) => updateSetting('scraping', 'timeout', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  />
                  <p className="text-xs text-slate-500 mt-1">Hur länge ska systemet vänta på svar från webbplatser</p>
                </div>

                {/* Retries */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Antal Försök
                  </label>
                  <input
                    type="number"
                    value={settings.scraping.retries}
                    onChange={(e) => updateSetting('scraping', 'retries', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  />
                  <p className="text-xs text-slate-500 mt-1">Hur många gånger ska systemet försöka igen vid fel</p>
                </div>

                {/* Cache Settings */}
                <div className="border-t-2 border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Cache Inställningar</h3>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      checked={settings.scraping.cacheEnabled}
                      onChange={(e) => updateSetting('scraping', 'cacheEnabled', e.target.checked)}
                      className="w-5 h-5 text-[#D40511] border-2 border-slate-300 rounded focus:ring-[#D40511]"
                    />
                    <label className="text-sm font-semibold text-slate-700">
                      Aktivera Cache
                    </label>
                  </div>

                  {settings.scraping.cacheEnabled && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Cache Varaktighet (timmar)
                      </label>
                      <input
                        type="number"
                        value={settings.scraping.cacheDuration}
                        onChange={(e) => updateSetting('scraping', 'cacheDuration', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                      />
                    </div>
                  )}
                </div>

                {/* Headless Mode */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.scraping.headless}
                    onChange={(e) => updateSetting('scraping', 'headless', e.target.checked)}
                    className="w-5 h-5 text-[#D40511] border-2 border-slate-300 rounded focus:ring-[#D40511]"
                  />
                  <label className="text-sm font-semibold text-slate-700">
                    Headless Mode (Dölj webbläsare)
                  </label>
                </div>

                {/* User Agent */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    User Agent
                  </label>
                  <input
                    type="text"
                    value={settings.scraping.userAgent}
                    onChange={(e) => updateSetting('scraping', 'userAgent', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511] font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* API Settings */}
            {activeSection === 'api' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#D40511]" />
                    API & LLM Inställningar
                  </h2>
                </div>

                {/* OpenAI */}
                <div className="border-2 border-slate-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">OpenAI</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">API Key</label>
                      <input
                        type="password"
                        value={settings.api.openai_key}
                        onChange={(e) => updateSetting('api', 'openai_key', e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511] font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Model</label>
                      <select
                        value={settings.api.openai_model}
                        onChange={(e) => updateSetting('api', 'openai_model', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                      >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Anthropic */}
                <div className="border-2 border-slate-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Anthropic (Claude)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">API Key</label>
                      <input
                        type="password"
                        value={settings.api.anthropic_key}
                        onChange={(e) => updateSetting('api', 'anthropic_key', e.target.value)}
                        placeholder="sk-ant-..."
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511] font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Model</label>
                      <select
                        value={settings.api.anthropic_model}
                        onChange={(e) => updateSetting('api', 'anthropic_model', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                      >
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Google */}
                <div className="border-2 border-slate-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Google (Gemini)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">API Key</label>
                      <input
                        type="password"
                        value={settings.api.google_key}
                        onChange={(e) => updateSetting('api', 'google_key', e.target.value)}
                        placeholder="AIza..."
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511] font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Model</label>
                      <select
                        value={settings.api.google_model}
                        onChange={(e) => updateSetting('api', 'google_model', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                      >
                        <option value="gemini-pro">Gemini Pro</option>
                        <option value="gemini-ultra">Gemini Ultra</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rate Limiting */}
                <div className="border-t-2 border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Rate Limiting</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Max Requests/Minut
                      </label>
                      <input
                        type="number"
                        value={settings.api.rate_limit}
                        onChange={(e) => updateSetting('api', 'rate_limit', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Max Samtidiga
                      </label>
                      <input
                        type="number"
                        value={settings.api.max_concurrent}
                        onChange={(e) => updateSetting('api', 'max_concurrent', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Settings */}
            {activeSection === 'search' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#D40511]" />
                    Sök & Protokoll Inställningar
                  </h2>
                </div>

                {/* Default Protocol */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Standard Protokoll
                  </label>
                  <select
                    value={settings.search.default_protocol}
                    onChange={(e) => updateSetting('search', 'default_protocol', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  >
                    <option value="Snabbanalys">Snabbanalys</option>
                    <option value="Standardanalys">Standardanalys</option>
                    <option value="Djupanalys">Djupanalys</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                {/* Default LLM */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Standard LLM
                  </label>
                  <select
                    value={settings.search.default_llm}
                    onChange={(e) => updateSetting('search', 'default_llm', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  >
                    <option value="GPT-4">GPT-4</option>
                    <option value="GPT-4-Turbo">GPT-4 Turbo</option>
                    <option value="Claude-3">Claude 3</option>
                    <option value="Gemini-Pro">Gemini Pro</option>
                  </select>
                </div>

                {/* Max Batch Size */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Max Batch Storlek
                  </label>
                  <input
                    type="number"
                    value={settings.search.max_batch_size}
                    onChange={(e) => updateSetting('search', 'max_batch_size', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  />
                </div>

                {/* Auto Analyze */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.search.auto_analyze}
                    onChange={(e) => updateSetting('search', 'auto_analyze', e.target.checked)}
                    className="w-5 h-5 text-[#D40511] border-2 border-slate-300 rounded focus:ring-[#D40511]"
                  />
                  <label className="text-sm font-semibold text-slate-700">
                    Auto-analysera nya leads
                  </label>
                </div>

                {/* Default Focus Positions */}
                <div className="border-t-2 border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Standard Fokus-Positioner</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-red-700 mb-2">Prio 1</label>
                      <textarea
                        value={settings.search.default_focus_positions.prio1.join(', ')}
                        onChange={(e) => updateSetting('search', 'default_focus_positions', {
                          ...settings.search.default_focus_positions,
                          prio1: e.target.value.split(',').map(s => s.trim())
                        })}
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-yellow-700 mb-2">Prio 2</label>
                      <textarea
                        value={settings.search.default_focus_positions.prio2.join(', ')}
                        onChange={(e) => updateSetting('search', 'default_focus_positions', {
                          ...settings.search.default_focus_positions,
                          prio2: e.target.value.split(',').map(s => s.trim())
                        })}
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-blue-700 mb-2">Prio 3</label>
                      <textarea
                        value={settings.search.default_focus_positions.prio3.join(', ')}
                        onChange={(e) => updateSetting('search', 'default_focus_positions', {
                          ...settings.search.default_focus_positions,
                          prio3: e.target.value.split(',').map(s => s.trim())
                        })}
                        rows={2}
                        className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UI Settings */}
            {activeSection === 'ui' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5 text-[#D40511]" />
                    UI & Utseende Inställningar
                  </h2>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tema</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateSetting('ui', 'theme', 'light')}
                      className={`p-4 rounded-sm border-2 ${
                        settings.ui.theme === 'light'
                          ? 'border-[#D40511] bg-red-50'
                          : 'border-slate-300'
                      }`}
                    >
                      Ljust
                    </button>
                    <button
                      onClick={() => updateSetting('ui', 'theme', 'dark')}
                      className={`p-4 rounded-sm border-2 ${
                        settings.ui.theme === 'dark'
                          ? 'border-[#D40511] bg-red-50'
                          : 'border-slate-300'
                      }`}
                    >
                      Mörkt
                    </button>
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Primär Färg
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.ui.primary_color}
                        onChange={(e) => updateSetting('ui', 'primary_color', e.target.value)}
                        className="w-16 h-10 border-2 border-slate-300 rounded-sm"
                      />
                      <input
                        type="text"
                        value={settings.ui.primary_color}
                        onChange={(e) => updateSetting('ui', 'primary_color', e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511] font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Sekundär Färg
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.ui.secondary_color}
                        onChange={(e) => updateSetting('ui', 'secondary_color', e.target.value)}
                        className="w-16 h-10 border-2 border-slate-300 rounded-sm"
                      />
                      <input
                        type="text"
                        value={settings.ui.secondary_color}
                        onChange={(e) => updateSetting('ui', 'secondary_color', e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511] font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Table Settings */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Standard Antal Rader i Tabell
                  </label>
                  <input
                    type="number"
                    value={settings.ui.default_table_rows}
                    onChange={(e) => updateSetting('ui', 'default_table_rows', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.ui.show_segment_column}
                      onChange={(e) => updateSetting('ui', 'show_segment_column', e.target.checked)}
                      className="w-5 h-5 text-[#D40511] border-2 border-slate-300 rounded focus:ring-[#D40511]"
                    />
                    <label className="text-sm font-semibold text-slate-700">
                      Visa Segment-kolumn (för alla roller)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.ui.enable_notifications}
                      onChange={(e) => updateSetting('ui', 'enable_notifications', e.target.checked)}
                      className="w-5 h-5 text-[#D40511] border-2 border-slate-300 rounded focus:ring-[#D40511]"
                    />
                    <label className="text-sm font-semibold text-slate-700">
                      Aktivera Notifikationer
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.ui.notification_sound}
                      onChange={(e) => updateSetting('ui', 'notification_sound', e.target.checked)}
                      className="w-5 h-5 text-[#D40511] border-2 border-slate-300 rounded focus:ring-[#D40511]"
                    />
                    <label className="text-sm font-semibold text-slate-700">
                      Notifikationsljud
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Data Settings */}
            {activeSection === 'data' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#D40511]" />
                    Data & Backup Inställningar
                  </h2>
                </div>

                {/* Auto Backup */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.data.auto_backup}
                    onChange={(e) => updateSetting('data', 'auto_backup', e.target.checked)}
                    className="w-5 h-5 text-[#D40511] border-2 border-slate-300 rounded focus:ring-[#D40511]"
                  />
                  <label className="text-sm font-semibold text-slate-700">
                    Automatisk Backup
                  </label>
                </div>

                {settings.data.auto_backup && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Backup Frekvens
                    </label>
                    <select
                      value={settings.data.backup_frequency}
                      onChange={(e) => updateSetting('data', 'backup_frequency', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                    >
                      <option value="daily">Dagligen</option>
                      <option value="weekly">Veckovis</option>
                      <option value="monthly">Månadsvis</option>
                    </select>
                  </div>
                )}

                {/* Retention */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Behåll Data (dagar)
                  </label>
                  <input
                    type="number"
                    value={settings.data.retention_days}
                    onChange={(e) => updateSetting('data', 'retention_days', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  />
                </div>

                {/* Export Format */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Standard Export Format
                  </label>
                  <select
                    value={settings.data.export_format}
                    onChange={(e) => updateSetting('data', 'export_format', e.target.value)}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  >
                    <option value="csv">CSV</option>
                    <option value="excel">Excel</option>
                    <option value="json">JSON</option>
                  </select>
                </div>

                {/* Backup Actions */}
                <div className="border-t-2 border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Backup Åtgärder</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-sm font-bold hover:bg-blue-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Ladda Ned Backup
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-sm font-bold hover:bg-green-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      Återställ Backup
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#D40511]" />
                    Säkerhetsinställningar
                  </h2>
                </div>

                {/* Session Timeout */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Session Timeout (minuter)
                  </label>
                  <input
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  />
                </div>

                {/* 2FA */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.security.require_2fa}
                    onChange={(e) => updateSetting('security', 'require_2fa', e.target.checked)}
                    className="w-5 h-5 text-[#D40511] border-2 border-slate-300 rounded focus:ring-[#D40511]"
                  />
                  <label className="text-sm font-semibold text-slate-700">
                    Kräv Tvåfaktorsautentisering (2FA)
                  </label>
                </div>

                {/* Password Expiry */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Lösenord Utgår Efter (dagar)
                  </label>
                  <input
                    type="number"
                    value={settings.security.password_expiry_days}
                    onChange={(e) => updateSetting('security', 'password_expiry_days', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  />
                </div>

                {/* Max Login Attempts */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Max Inloggningsförsök
                  </label>
                  <input
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={(e) => updateSetting('security', 'max_login_attempts', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-sm focus:outline-none focus:border-[#D40511]"
                  />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Floating Save Button */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-[#D40511] text-white px-8 py-4 rounded-lg font-bold uppercase shadow-2xl hover:bg-red-700 transition-all animate-pulse"
            >
              <Save className="w-5 h-5" />
              Spara Ändringar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
