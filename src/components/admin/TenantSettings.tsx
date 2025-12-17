import React, { useState, useEffect } from 'react';
import { Building2, Users, Settings, Bell, FileText, Download, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TenantSettingsData {
  company_name: string;
  org_number: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  max_users: number;
  max_leads: number;
  features_enabled: string[];
  notification_email: string;
  notification_frequency: 'realtime' | 'daily' | 'weekly';
  export_format: 'csv' | 'excel' | 'pdf';
  timezone: string;
  language: string;
}

export const TenantSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TenantSettingsData>({
    company_name: user?.tenant_name || '',
    org_number: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Sverige',
    phone: '',
    email: user?.email || '',
    website: '',
    logo_url: '',
    primary_color: '#D40511',
    secondary_color: '#FFC400',
    max_users: 10,
    max_leads: 1000,
    features_enabled: ['leads', 'customers', 'analytics'],
    notification_email: user?.email || '',
    notification_frequency: 'daily',
    export_format: 'excel',
    timezone: 'Europe/Stockholm',
    language: 'sv'
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'branding' | 'users' | 'notifications' | 'export'>('company');

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save tenant settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-dhl-red" />
            Företagsinställningar
          </h2>
          <p className="text-gray-600 mt-1">
            Hantera inställningar för {user?.tenant_name}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-dhl-red text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Sparar...' : saved ? 'Sparat!' : 'Spara ändringar'}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Tenant Admin-behörighet</h3>
            <p className="text-sm text-blue-700 mt-1">
              Du kan endast hantera inställningar för ditt eget företag ({user?.tenant_name}). 
              För systemövergripande inställningar, kontakta Super Admin.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'company'
                ? 'border-dhl-red text-dhl-red'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Företagsinformation
            </div>
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'branding'
                ? 'border-dhl-red text-dhl-red'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Varumärke & Design
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-dhl-red text-dhl-red'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Användare & Gränser
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'border-dhl-red text-dhl-red'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifikationer
            </div>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'export'
                ? 'border-dhl-red text-dhl-red'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export & Data
            </div>
          </button>
        </nav>
      </div>

      {/* Company Information Tab */}
      {activeTab === 'company' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Företagsinformation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Företagsnamn
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organisationsnummer
              </label>
              <input
                type="text"
                value={settings.org_number}
                onChange={(e) => setSettings({ ...settings, org_number: e.target.value })}
                placeholder="XXXXXX-XXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adress
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stad
              </label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postnummer
              </label>
              <input
                type="text"
                value={settings.postal_code}
                onChange={(e) => setSettings({ ...settings, postal_code: e.target.value })}
                placeholder="XXX XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+46 XX XXX XX XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-post
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webbplats
              </label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Varumärke & Design</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logotyp URL
              </label>
              <input
                type="url"
                value={settings.logo_url}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Rekommenderad storlek: 200x60px, format: PNG eller SVG
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primärfärg
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sekundärfärg
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Förhandsgranskning</h4>
              <div className="space-y-2">
                <button
                  style={{ backgroundColor: settings.primary_color }}
                  className="px-4 py-2 text-white rounded-lg font-medium"
                >
                  Primär knapp
                </button>
                <button
                  style={{ backgroundColor: settings.secondary_color }}
                  className="px-4 py-2 text-black rounded-lg font-medium ml-2"
                >
                  Sekundär knapp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users & Limits Tab */}
      {activeTab === 'users' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Användare & Gränser</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Max användare</span>
                <span className="text-2xl font-bold text-dhl-red">{settings.max_users}</span>
              </div>
              <p className="text-xs text-gray-500">
                Kontakta Super Admin för att öka gränsen
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Max leads</span>
                <span className="text-2xl font-bold text-dhl-red">{settings.max_leads}</span>
              </div>
              <p className="text-xs text-gray-500">
                Kontakta Super Admin för att öka gränsen
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Aktiverade funktioner
            </label>
            <div className="space-y-2">
              {[
                { id: 'leads', label: 'Lead Management' },
                { id: 'customers', label: 'Kundhantering' },
                { id: 'analytics', label: 'Analytics & Rapporter' },
                { id: 'export', label: 'Data Export' },
                { id: 'api', label: 'API Access' }
              ].map(feature => (
                <div key={feature.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={feature.id}
                    checked={settings.features_enabled.includes(feature.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          features_enabled: [...settings.features_enabled, feature.id]
                        });
                      } else {
                        setSettings({
                          ...settings,
                          features_enabled: settings.features_enabled.filter(f => f !== feature.id)
                        });
                      }
                    }}
                    className="w-4 h-4 text-dhl-red border-gray-300 rounded focus:ring-dhl-red"
                  />
                  <label htmlFor={feature.id} className="ml-2 text-sm text-gray-700">
                    {feature.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Notifikationer</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notifikations-e-post
              </label>
              <input
                type="email"
                value={settings.notification_email}
                onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notifikationsfrekvens
              </label>
              <select
                value={settings.notification_frequency}
                onChange={(e) => setSettings({ ...settings, notification_frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              >
                <option value="realtime">Realtid</option>
                <option value="daily">Daglig sammanfattning</option>
                <option value="weekly">Veckovis sammanfattning</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Export & Data</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard exportformat
              </label>
              <select
                value={settings.export_format}
                onChange={(e) => setSettings({ ...settings, export_format: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel (XLSX)</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tidszon
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              >
                <option value="Europe/Stockholm">Europa/Stockholm (CET)</option>
                <option value="Europe/London">Europa/London (GMT)</option>
                <option value="America/New_York">Amerika/New York (EST)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Språk
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dhl-red focus:border-transparent"
              >
                <option value="sv">Svenska</option>
                <option value="en">English</option>
                <option value="no">Norsk</option>
                <option value="da">Dansk</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-dhl-red text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Sparar...' : saved ? 'Sparat!' : 'Spara alla ändringar'}
        </button>
      </div>
    </div>
  );
};
