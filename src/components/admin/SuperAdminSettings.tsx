import React, { useState } from 'react';
import { Settings, Database, Shield, Bell, Mail, Key, Save } from 'lucide-react';

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

  const handleSave = () => {
    alert('Inställningar sparade! (Backend integration behövs)');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#8B5CF6]" />
            System Settings
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Konfigurera systemets globala inställningar
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-4 py-2 rounded font-semibold"
        >
          <Save className="w-4 h-4" />
          Spara Ändringar
        </button>
      </div>

      {/* General Settings */}
      <div className="bg-white  rounded-none p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-[#8B5CF6]" />
          <h2 className="text-lg font-black text-black uppercase">Allmänna Inställningar</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Systemnamn</label>
            <input
              type="text"
              value={settings.systemName}
              onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Tenant Limits */}
      <div className="bg-white  rounded-none p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[#8B5CF6]" />
          <h2 className="text-lg font-black text-black uppercase">Tenant Gränser</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Max Tenants</label>
            <input
              type="number"
              value={settings.maxTenantsLimit}
              onChange={(e) => setSettings({ ...settings, maxTenantsLimit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Standard Användargräns</label>
            <input
              type="number"
              value={settings.defaultUserLimit}
              onChange={(e) => setSettings({ ...settings, defaultUserLimit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Standard Lead-gräns</label>
            <input
              type="number"
              value={settings.defaultLeadLimit}
              onChange={(e) => setSettings({ ...settings, defaultLeadLimit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white  rounded-none p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-[#8B5CF6]" />
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Backup & Maintenance */}
      <div className="bg-white  rounded-none p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-[#8B5CF6]" />
          <h2 className="text-lg font-black text-black uppercase">Backup & Underhåll</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Backup Frekvens</label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent"
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
