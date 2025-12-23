import React, { useState } from 'react';
import { Settings, Save, RefreshCw, AlertCircle } from 'lucide-react';

interface SegmentThresholds {
  DM: { min: number; max: number };
  TS: { min: number; max: number };
  FS: { min: number; max: number };
  KAM: { min: number; max: number };
}

interface TenantSegmentSettings {
  tenantId: string;
  tenantName: string;
  freightPercentage: number; // Default 5%
  thresholds: SegmentThresholds;
  customRules: string;
}

export const TenantSegmentConfig: React.FC = () => {
  const [settings, setSettings] = useState<TenantSegmentSettings>({
    tenantId: 'dhl',
    tenantName: 'DHL Freight',
    freightPercentage: 5,
    thresholds: {
      DM: { min: 0, max: 249 },
      TS: { min: 250, max: 749 },
      FS: { min: 750, max: 4999 },
      KAM: { min: 5000, max: 999999 }
    },
    customRules: ''
  });

  const [tenants, setTenants] = useState([
    { id: 'dhl', name: 'DHL Freight' },
    { id: 'postnord', name: 'PostNord' },
    { id: 'schenker', name: 'Schenker' }
  ]);

  const handleSave = () => {
    console.log('Saving segment configuration:', settings);
    alert('Segmentkonfiguration sparad!');
    // TODO: Save to backend
  };

  const handleReset = () => {
    setSettings({
      ...settings,
      freightPercentage: 5,
      thresholds: {
        DM: { min: 0, max: 249 },
        TS: { min: 250, max: 749 },
        FS: { min: 750, max: 4999 },
        KAM: { min: 5000, max: 999999 }
      }
    });
  };

  const updateThreshold = (segment: keyof SegmentThresholds, field: 'min' | 'max', value: number) => {
    setSettings({
      ...settings,
      thresholds: {
        ...settings.thresholds,
        [segment]: {
          ...settings.thresholds[segment],
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-wide flex items-center gap-3">
            <Settings className="w-7 h-7 text-[#FFC400]" />
            Segmentkonfiguration per Tenant
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Konfigurera hur leads segmenteras baserat på fraktbudget
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Återställ
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#FFC400] hover:bg-black hover:text-white text-black px-4 py-2 rounded font-semibold"
          >
            <Save className="w-4 h-4" />
            Spara
          </button>
        </div>
      </div>

      {/* Tenant Selection */}
      <div className="bg-white rounded-none p-6">
        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Välj Tenant</label>
        <select
          value={settings.tenantId}
          onChange={(e) => {
            const tenant = tenants.find(t => t.id === e.target.value);
            if (tenant) {
              setSettings({ ...settings, tenantId: tenant.id, tenantName: tenant.name });
            }
          }}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent font-semibold"
        >
          {tenants.map(tenant => (
            <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
          ))}
        </select>
      </div>

      {/* Freight Percentage */}
      <div className="bg-white rounded-none p-6">
        <h3 className="text-lg font-black text-black uppercase mb-4">Fraktbudget Beräkning</h3>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">Fraktbudget = Omsättning × {settings.freightPercentage}%</p>
              <p>Exempel: Företag med 10 000 tkr omsättning → {10000 * (settings.freightPercentage / 100)} tkr fraktbudget</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-bold text-gray-700 uppercase">Fraktbudget Procent:</label>
          <input
            type="number"
            min="1"
            max="20"
            step="0.5"
            value={settings.freightPercentage}
            onChange={(e) => setSettings({ ...settings, freightPercentage: parseFloat(e.target.value) })}
            className="w-24 px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent font-bold text-center"
          />
          <span className="text-2xl font-black text-[#FFC400]">%</span>
        </div>
      </div>

      {/* Segment Thresholds */}
      <div className="bg-white rounded-none p-6">
        <h3 className="text-lg font-black text-black uppercase mb-4">Segment Tröskelvärden (tkr fraktbudget)</h3>
        
        <div className="space-y-4">
          {/* DM Segment */}
          <div className="border-2 border-gray-200 p-4 rounded">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded font-black text-sm border-2 border-gray-300">DM</span>
                <span className="ml-2 text-sm text-gray-600">Direct Mail / Små kunder</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Min (tkr)</label>
                <input
                  type="number"
                  value={settings.thresholds.DM.min}
                  onChange={(e) => updateThreshold('DM', 'min', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Max (tkr)</label>
                <input
                  type="number"
                  value={settings.thresholds.DM.max}
                  onChange={(e) => updateThreshold('DM', 'max', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] font-semibold"
                />
              </div>
            </div>
          </div>

          {/* TS Segment */}
          <div className="border-2 border-green-200 p-4 rounded bg-green-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded font-black text-sm border-2 border-green-300">TS</span>
                <span className="ml-2 text-sm text-gray-600">Telesales / Medelstora kunder</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Min (tkr)</label>
                <input
                  type="number"
                  value={settings.thresholds.TS.min}
                  onChange={(e) => updateThreshold('TS', 'min', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Max (tkr)</label>
                <input
                  type="number"
                  value={settings.thresholds.TS.max}
                  onChange={(e) => updateThreshold('TS', 'max', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] font-semibold"
                />
              </div>
            </div>
          </div>

          {/* FS Segment */}
          <div className="border-2 border-blue-200 p-4 rounded bg-blue-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded font-black text-sm border-2 border-blue-300">FS</span>
                <span className="ml-2 text-sm text-gray-600">Field Sales / Stora kunder</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Min (tkr)</label>
                <input
                  type="number"
                  value={settings.thresholds.FS.min}
                  onChange={(e) => updateThreshold('FS', 'min', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Max (tkr)</label>
                <input
                  type="number"
                  value={settings.thresholds.FS.max}
                  onChange={(e) => updateThreshold('FS', 'max', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] font-semibold"
                />
              </div>
            </div>
          </div>

          {/* KAM Segment */}
          <div className="border-2 border-gray-200 p-4 rounded bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded font-black text-sm border-2 border-gray-300">KAM</span>
                <span className="ml-2 text-sm text-gray-600">Key Account Manager / Enterprise</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Min (tkr)</label>
                <input
                  type="number"
                  value={settings.thresholds.KAM.min}
                  onChange={(e) => updateThreshold('KAM', 'min', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Max (tkr)</label>
                <input
                  type="number"
                  value={settings.thresholds.KAM.max}
                  onChange={(e) => updateThreshold('KAM', 'max', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] font-semibold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Rules */}
      <div className="bg-white rounded-none p-6">
        <h3 className="text-lg font-black text-black uppercase mb-4">Anpassade Regler (Valfritt)</h3>
        <textarea
          value={settings.customRules}
          onChange={(e) => setSettings({ ...settings, customRules: e.target.value })}
          placeholder="T.ex. 'Alla företag i Stockholm med >1000 anställda går till KAM'"
          rows={4}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent font-mono text-sm"
        />
      </div>

      {/* Preview */}
      <div className="bg-[#FFC400] text-black rounded-none p-6">
        <h3 className="text-lg font-black uppercase mb-4">Förhandsvisning</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-50 p-3 rounded">
            <p className="text-xs font-bold uppercase mb-1">DM</p>
            <p className="text-lg font-black">{settings.thresholds.DM.min}-{settings.thresholds.DM.max} tkr</p>
          </div>
          <div className="bg-white bg-opacity-50 p-3 rounded">
            <p className="text-xs font-bold uppercase mb-1">TS</p>
            <p className="text-lg font-black">{settings.thresholds.TS.min}-{settings.thresholds.TS.max} tkr</p>
          </div>
          <div className="bg-white bg-opacity-50 p-3 rounded">
            <p className="text-xs font-bold uppercase mb-1">FS</p>
            <p className="text-lg font-black">{settings.thresholds.FS.min}-{settings.thresholds.FS.max} tkr</p>
          </div>
          <div className="bg-white bg-opacity-50 p-3 rounded">
            <p className="text-xs font-bold uppercase mb-1">KAM</p>
            <p className="text-lg font-black">{settings.thresholds.KAM.min}+ tkr</p>
          </div>
        </div>
      </div>
    </div>
  );
};
