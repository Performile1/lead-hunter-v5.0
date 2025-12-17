import React, { useState } from 'react';
import { LayoutDashboard, Users, MapPin, TrendingUp, Settings } from 'lucide-react';
import { LeadAssignment } from './LeadAssignment';
import { TerminalSettings } from './TerminalSettings';

interface TerminalDashboardProps {
  terminalName: string;
  terminalCode: string;
}

export const TerminalDashboard: React.FC<TerminalDashboardProps> = ({ terminalName, terminalCode }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'salespeople' | 'settings'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Översikt', icon: LayoutDashboard },
    { id: 'assignments' as const, label: 'Tilldela Leads', icon: Users },
    { id: 'salespeople' as const, label: 'Säljare', icon: MapPin },
    { id: 'settings' as const, label: 'Inställningar', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Terminal Manager Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Hantera leads och säljare för din terminal
              </p>
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
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'assignments' && <LeadAssignment />}
        {activeTab === 'salespeople' && <SalespeopleTab />}
        {activeTab === 'settings' && <TerminalSettings onBack={() => setActiveTab('overview')} />}
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Terminal Översikt</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Totalt Leads</p>
              <p className="text-3xl font-bold mt-2">0</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Otilldelade</p>
              <p className="text-3xl font-bold mt-2">0</p>
            </div>
            <Users className="w-12 h-12 text-orange-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktiva Säljare</p>
              <p className="text-3xl font-bold mt-2">0</p>
            </div>
            <MapPin className="w-12 h-12 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Salespeople Tab
const SalespeopleTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Säljare i Din Terminal</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Lista över säljare kommer här...</p>
      </div>
    </div>
  );
};
