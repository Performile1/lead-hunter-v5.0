import React, { useState } from 'react';
import { Settings, Users, Cpu, Database, BarChart3, Key } from 'lucide-react';
import { LLMConfigPanel } from './LLMConfigPanel';
import { UserManagement } from './UserManagement';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'llm' | 'api' | 'users' | 'settings'>('llm');

  const tabs = [
    { id: 'llm' as const, label: 'LLM Configuration', icon: Cpu },
    { id: 'api' as const, label: 'API Configuration', icon: Key },
    { id: 'users' as const, label: 'Användarhantering', icon: Users },
    { id: 'settings' as const, label: 'Systeminställningar', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="mt-1 text-sm text-gray-500">
                Hantera användare, LLM-providers och systeminställningar
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database className="w-4 h-4" />
              <span>DHL Lead Hunter Enterprise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'llm' && <LLMConfigPanel />}
        {activeTab === 'api' && <APIConfigPanel />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'settings' && <SystemSettings />}
      </div>
    </div>
  );
};

// Placeholder components
const APIConfigPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Key className="w-6 h-6" />
        API Configuration
      </h2>
      <p className="text-gray-600 mb-4">
        Konfigurera externa API:er för nyheter, tech-analys och företagsdata.
      </p>
      
      <div className="space-y-4">
        {/* NewsAPI */}
        <div className="border rounded-lg p-4">
          <h3 className="font-bold mb-2">NewsAPI.org</h3>
          <input
            type="password"
            placeholder="API Key"
            className="w-full px-3 py-2 border rounded-lg mb-2"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Spara
          </button>
        </div>

        {/* BuiltWith */}
        <div className="border rounded-lg p-4">
          <h3 className="font-bold mb-2">BuiltWith (Tech Analysis)</h3>
          <input
            type="password"
            placeholder="API Key"
            className="w-full px-3 py-2 border rounded-lg mb-2"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Spara
          </button>
        </div>

        {/* Tavily Search */}
        <div className="border rounded-lg p-4">
          <h3 className="font-bold mb-2">Tavily Search</h3>
          <input
            type="password"
            placeholder="API Key"
            className="w-full px-3 py-2 border rounded-lg mb-2"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Spara
          </button>
        </div>
      </div>
    </div>
  );
};

const SystemSettings: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Systeminställningar
      </h2>
      
      <div className="space-y-6">
        {/* General Settings */}
        <div>
          <h3 className="font-bold mb-3">Allmänna Inställningar</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Max leads per sökning</span>
              <input
                type="number"
                defaultValue={50}
                className="w-24 px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Cache TTL (dagar)</span>
              <input
                type="number"
                defaultValue={30}
                className="w-24 px-3 py-2 border rounded-lg"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Auto-backup intervall (timmar)</span>
              <input
                type="number"
                defaultValue={24}
                className="w-24 px-3 py-2 border rounded-lg"
              />
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div>
          <h3 className="font-bold mb-3">Säkerhetsinställningar</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>Kräv SSO för nya användare</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>Aktivera audit logging</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>Kryptera känslig data</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium">
          Spara Inställningar
        </button>
      </div>
    </div>
  );
};
