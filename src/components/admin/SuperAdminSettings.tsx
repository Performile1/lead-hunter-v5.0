import React, { useState, useEffect } from 'react';
import { Settings, Database, Shield, Bell, Mail, Key, Save, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

export const SuperAdminSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    systemName: 'Lead Hunter System',
    maintenanceMode: false,
    allowNewTenants: true,
    maxTenantsLimit: 100,
    defaultUserLimit: 50,
    defaultLeadLimit: 5000,
    emailNotifications: true,
    systemNotifications: true,
    backupFrequency: 'daily',
    logRetentionDays: 90
  });

  const [apiKeys, setApiKeys] = useState({
    GROQ_API_KEY: '',
    GEMINI_API_KEY: '',
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    DATABASE_URL: '',
    JWT_SECRET: ''
  });

  const [showKeys, setShowKeys] = useState({
    GROQ_API_KEY: false,
    GEMINI_API_KEY: false,
    OPENAI_API_KEY: false,
    ANTHROPIC_API_KEY: false,
    DATABASE_URL: false,
    JWT_SECRET: false
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/admin/env-vars`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.envVars || {});
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const handleSaveApiKeys = async () => {
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/admin/env-vars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ envVars: apiKeys })
      });

      if (response.ok) {
        const data = await response.json();
        setSaveStatus('success');
        setStatusMessage(data.message || 'API-nycklar sparade och uppdaterade i Vercel!');
        setTimeout(() => setSaveStatus('idle'), 5000);
      } else {
        const error = await response.json();
        setSaveStatus('error');
        setStatusMessage(error.error || 'Kunde inte spara API-nycklar');
      }
    } catch (error) {
      setSaveStatus('error');
      setStatusMessage('Nätverksfel vid sparande');
      console.error('Error saving API keys:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    alert('Inställningar sparade! (Backend integration behövs)');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#FFC400]" />
            System Settings
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Konfigurera systemets globala inställningar
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#FFC400] hover:bg-black text-white px-4 py-2 rounded font-semibold"
        >
          <Save className="w-4 h-4" />
          Spara Ändringar
        </button>
      </div>

      {/* API Keys Management */}
      <div className="bg-white rounded-none p-6 border-l-4 border-[#FFC400]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#FFC400]" />
            <h2 className="text-lg font-black text-black uppercase">API-nycklar & Environment Variables</h2>
          </div>
          <button
            onClick={handleSaveApiKeys}
            disabled={saving}
            className="flex items-center gap-2 bg-[#FFC400] hover:bg-black text-black hover:text-white px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sparar...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Spara & Uppdatera Vercel
              </>
            )}
          </button>
        </div>

        {saveStatus !== 'idle' && (
          <div className={`mb-4 p-3 rounded flex items-center gap-2 ${
            saveStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveStatus === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-semibold text-sm">{statusMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          {Object.keys(apiKeys).map((keyName) => (
            <div key={keyName}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {keyName.replace(/_/g, ' ')}
              </label>
              <div className="relative">
                <input
                  type={showKeys[keyName as keyof typeof showKeys] ? 'text' : 'password'}
                  value={apiKeys[keyName as keyof typeof apiKeys]}
                  onChange={(e) => setApiKeys({ ...apiKeys, [keyName]: e.target.value })}
                  placeholder={`Ange ${keyName}`}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys({ ...showKeys, [keyName]: !showKeys[keyName as keyof typeof showKeys] })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showKeys[keyName as keyof typeof showKeys] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs text-yellow-800">
            <strong>⚠️ Viktigt:</strong> När du sparar uppdateras både .env-filen lokalt och environment variables i Vercel. 
            Detta kan ta några sekunder. Vercel kommer automatiskt att redeployera applikationen med de nya värdena.
          </p>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white  rounded-none p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-[#FFC400]" />
          <h2 className="text-lg font-black text-black uppercase">Allmänna Inställningar</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Systemnamn</label>
            <input
              type="text"
              value={settings.systemName}
              onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-semibold text-sm">Underhållsläge</p>
              <p className="text-xs text-gray-600">Stäng av systemet för underhåll</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC400]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-semibold text-sm">Tillåt Nya Tenants</p>
              <p className="text-xs text-gray-600">Aktivera skapande av nya organisationer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowNewTenants}
                onChange={(e) => setSettings({ ...settings, allowNewTenants: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC400]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Tenant Limits */}
      <div className="bg-white  rounded-none p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[#FFC400]" />
          <h2 className="text-lg font-black text-black uppercase">Tenant Gränser</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Max Tenants</label>
            <input
              type="number"
              value={settings.maxTenantsLimit}
              onChange={(e) => setSettings({ ...settings, maxTenantsLimit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Standard Användargräns</label>
            <input
              type="number"
              value={settings.defaultUserLimit}
              onChange={(e) => setSettings({ ...settings, defaultUserLimit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Standard Lead-gräns</label>
            <input
              type="number"
              value={settings.defaultLeadLimit}
              onChange={(e) => setSettings({ ...settings, defaultLeadLimit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white  rounded-none p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-[#FFC400]" />
          <h2 className="text-lg font-black text-black uppercase">Notifikationer</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-semibold text-sm">Email Notifikationer</p>
              <p className="text-xs text-gray-600">Skicka systemnotiser via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC400]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-semibold text-sm">System Notifikationer</p>
              <p className="text-xs text-gray-600">Aktivera in-app notifikationer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.systemNotifications}
                onChange={(e) => setSettings({ ...settings, systemNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFC400]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Backup & Maintenance */}
      <div className="bg-white  rounded-none p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-[#FFC400]" />
          <h2 className="text-lg font-black text-black uppercase">Backup & Underhåll</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Backup Frekvens</label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            >
              <option value="hourly">Varje timme</option>
              <option value="daily">Dagligen</option>
              <option value="weekly">Veckovis</option>
              <option value="monthly">Månadsvis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Logg Retention (dagar)</label>
            <input
              type="number"
              value={settings.logRetentionDays}
              onChange={(e) => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-[#FFC400] text-black rounded-none p-6 ">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5" />
          <h2 className="text-lg font-black uppercase">System Information</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs opacity-75">Version</p>
            <p className="text-xl font-black">v4.4</p>
          </div>
          <div>
            <p className="text-xs opacity-75">Environment</p>
            <p className="text-xl font-black">Production</p>
          </div>
          <div>
            <p className="text-xs opacity-75">Database</p>
            <p className="text-xl font-black">PostgreSQL</p>
          </div>
          <div>
            <p className="text-xs opacity-75">Uptime</p>
            <p className="text-xl font-black">99.9%</p>
          </div>
        </div>
      </div>
    </div>
  );
};
