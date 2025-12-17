import React, { useState } from 'react';
import { Users, Target, Bell, FileText, Save, X } from 'lucide-react';

interface ManagerSettingsProps {
  onBack: () => void;
}

export const ManagerSettings: React.FC<ManagerSettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'goals' | 'notifications' | 'reports'>('team');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'team' as const, label: 'Team', icon: Users },
    { id: 'goals' as const, label: 'Mål', icon: Target },
    { id: 'notifications' as const, label: 'Notiser', icon: Bell },
    { id: 'reports' as const, label: 'Rapporter', icon: FileText },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide">
            Manager Inställningar
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Hantera ditt team och dina preferenser
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black border-2 border-black px-4 py-2 rounded font-semibold"
        >
          <X className="w-4 h-4" />
          Stäng
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-2 border-gray-200 rounded shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-black text-black'
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

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'goals' && <GoalsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'reports' && <ReportsTab />}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-black hover:bg-[#FFC400] hover:text-black text-white px-6 py-3 rounded font-bold uppercase tracking-wide transition-colors"
        >
          <Save className="w-5 h-5" />
          {saved ? 'Sparat!' : 'Spara ändringar'}
        </button>
      </div>
    </div>
  );
};

// Team Tab
const TeamTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Personlig Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Namn
            </label>
            <input
              type="text"
              defaultValue="Anna Andersson"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              E-post för notiser
            </label>
            <input
              type="email"
              defaultValue="anna.andersson@dhl.com"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
              placeholder="din.email@dhl.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              defaultValue="070-123 45 67"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Adress
            </label>
            <input
              type="text"
              defaultValue="Terminalvägen 1, Stockholm"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tillhör Terminal(er)
            </label>
            <select
              multiple
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
              size={3}
            >
              <option value="sto" selected>Stockholm Terminal</option>
              <option value="gbg">Göteborg Terminal</option>
              <option value="mmo">Malmö Terminal</option>
              <option value="upp">Uppsala Terminal</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Håll Ctrl/Cmd för att välja flera</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-black mb-4">Team Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Team Namn
            </label>
            <input
              type="text"
              defaultValue="Sales Team Stockholm"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Team Storlek
            </label>
            <input
              type="number"
              defaultValue="4"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-black mb-4">Team Medlemmar</h3>
        <div className="space-y-3">
          {['Anna Andersson', 'Erik Eriksson', 'Maria Svensson', 'Johan Karlsson'].map((name, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#4F46E5] rounded-full flex items-center justify-center text-white font-bold">
                  {name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-sm">{name}</p>
                  <p className="text-xs text-gray-600">Säljare</p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                Redigera
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Goals Tab
const GoalsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Team Mål</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Månadsmål Leads
            </label>
            <input
              type="number"
              defaultValue="200"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Månadsmål Kunder
            </label>
            <input
              type="number"
              defaultValue="40"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Konverteringsmål (%)
            </label>
            <input
              type="number"
              defaultValue="20"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Snitt Tid till Konvertering (dagar)
            </label>
            <input
              type="number"
              defaultValue="15"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Notifications Tab
const NotificationsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Notifikationsinställningar</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="text-sm font-medium">Ny lead tilldelad till team</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="text-sm font-medium">Team medlem når mål</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="text-sm font-medium">Kund i riskzon</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5" />
            <span className="text-sm font-medium">Daglig sammanfattning</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Reports Tab
const ReportsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Rapportinställningar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rapport Frekvens
            </label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none">
              <option>Daglig</option>
              <option selected>Veckovis</option>
              <option>Månadsvis</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rapport Format
            </label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none">
              <option selected>PDF</option>
              <option>Excel</option>
              <option>CSV</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
