import React, { useState } from 'react';
import { MapPin, Users, Target, Bell, Save, X } from 'lucide-react';

interface TerminalSettingsProps {
  onBack: () => void;
}

export const TerminalSettings: React.FC<TerminalSettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'salespeople' | 'distribution' | 'goals'>('terminal');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'terminal' as const, label: 'Terminal', icon: MapPin },
    { id: 'salespeople' as const, label: 'Säljare', icon: Users },
    { id: 'distribution' as const, label: 'Fördelning', icon: Target },
    { id: 'goals' as const, label: 'Mål', icon: Bell },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide">
            Terminal Inställningar
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Hantera din terminal och säljare
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
          {activeTab === 'terminal' && <TerminalTab />}
          {activeTab === 'salespeople' && <SalespeopleTab />}
          {activeTab === 'distribution' && <DistributionTab />}
          {activeTab === 'goals' && <GoalsTab />}
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

// Terminal Tab
const TerminalTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Terminal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Terminal Namn
            </label>
            <input
              type="text"
              defaultValue="Stockholm Terminal"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Terminal Kod
            </label>
            <input
              type="text"
              defaultValue="STO-01"
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Telefon
            </label>
            <input
              type="text"
              defaultValue="08-123 456 78"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-black mb-4">Täckningsområde</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Primära Städer
            </label>
            <textarea
              rows={3}
              defaultValue="Stockholm, Uppsala, Västerås"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Postnummer
            </label>
            <textarea
              rows={3}
              defaultValue="100-199, 750-759"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Salespeople Tab
const SalespeopleTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Säljare i Terminal</h3>
        <div className="space-y-3">
          {[
            { name: 'Anna Andersson', leads: 45, status: 'Aktiv' },
            { name: 'Erik Eriksson', leads: 38, status: 'Aktiv' },
            { name: 'Maria Svensson', leads: 52, status: 'Aktiv' },
            { name: 'Johan Karlsson', leads: 41, status: 'Semester' }
          ].map((person, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#4F46E5] rounded-full flex items-center justify-center text-white font-bold">
                  {person.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-sm">{person.name}</p>
                  <p className="text-xs text-gray-600">{person.leads} leads • {person.status}</p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                Hantera
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-black hover:text-black font-semibold transition-colors">
          + Lägg till säljare
        </button>
      </div>
    </div>
  );
};

// Distribution Tab
const DistributionTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Lead-fördelning</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fördelningsmetod
            </label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none">
              <option selected>Round Robin (Jämn fördelning)</option>
              <option>Baserat på prestanda</option>
              <option>Manuell tilldelning</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Max leads per säljare/dag
            </label>
            <input
              type="number"
              defaultValue="10"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5" />
              <span className="text-sm font-medium">Auto-tilldela nya leads</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5" />
              <span className="text-sm font-medium">Omfördela inaktiva leads efter 7 dagar</span>
            </label>
          </div>
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
        <h3 className="text-lg font-bold text-black mb-4">Terminal Mål</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Månadsmål Leads
            </label>
            <input
              type="number"
              defaultValue="500"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Månadsmål Kunder
            </label>
            <input
              type="number"
              defaultValue="100"
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
              Omsättningsmål (SEK)
            </label>
            <input
              type="number"
              defaultValue="1000000"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
