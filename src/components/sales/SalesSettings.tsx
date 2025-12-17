import React, { useState } from 'react';
import { User, Target, Bell, Palette, Save, X } from 'lucide-react';

interface SalesSettingsProps {
  onBack: () => void;
}

export const SalesSettings: React.FC<SalesSettingsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'goals' | 'notifications' | 'preferences'>('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profil', icon: User },
    { id: 'goals' as const, label: 'Mål', icon: Target },
    { id: 'notifications' as const, label: 'Notiser', icon: Bell },
    { id: 'preferences' as const, label: 'Preferenser', icon: Palette },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide">
            Mina Inställningar
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Hantera din profil och preferenser
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
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'goals' && <GoalsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
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

// Profile Tab
const ProfileTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Personlig Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Förnamn
            </label>
            <input
              type="text"
              defaultValue="Anna"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Efternamn
            </label>
            <input
              type="text"
              defaultValue="Andersson"
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
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Adress
            </label>
            <input
              type="text"
              defaultValue="Terminalvägen 1, Stockholm"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-black mb-4">Arbetsroll</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titel
            </label>
            <input
              type="text"
              defaultValue="Säljare"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
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
    </div>
  );
};

// Goals Tab
const GoalsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Personliga Mål</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Månadsmål Leads
            </label>
            <input
              type="number"
              defaultValue="50"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Månadsmål Kunder
            </label>
            <input
              type="number"
              defaultValue="10"
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
              defaultValue="250000"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-black mb-4">Nuvarande Prestanda</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">Leads denna månad</span>
              <span className="text-gray-600">42 / 50</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-black h-3 rounded-full" style={{ width: '84%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">Kunder denna månad</span>
              <span className="text-gray-600">8 / 10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-green-600 h-3 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">Konvertering</span>
              <span className="text-gray-600">19.0% / 20%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: '95%' }}></div>
            </div>
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
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3">E-post</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-5 h-5" />
                <span className="text-sm">Ny lead tilldelad</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-5 h-5" />
                <span className="text-sm">Lead statusändring</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-sm">Daglig sammanfattning</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-sm">Veckorapport</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Push-notiser</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="w-5 h-5" />
                <span className="text-sm">Ny lead tilldelad</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="text-sm">Påminnelser</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Preferences Tab
const PreferencesTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-black mb-4">Visuella Preferenser</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Språk
            </label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none">
              <option selected>Svenska</option>
              <option>English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tidszon
            </label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none">
              <option selected>Europe/Stockholm (UTC+1)</option>
              <option>Europe/London (UTC+0)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Datumformat
            </label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:border-black focus:outline-none">
              <option selected>YYYY-MM-DD</option>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-black mb-4">Arbetsflöde</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="text-sm font-medium">Visa onboarding-tips</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <span className="text-sm font-medium">Auto-spara utkast</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5" />
            <span className="text-sm font-medium">Kompakt vy</span>
          </label>
        </div>
      </div>
    </div>
  );
};
