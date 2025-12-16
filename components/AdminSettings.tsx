import React, { useState, useEffect } from 'react';
import { Settings, Palette, Type, Image, Save, Upload, RotateCcw, Eye, ArrowLeft, Check, Building2 } from 'lucide-react';
import { TenantManagement } from './TenantManagement';

interface ColorScheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface LoginText {
  title: string;
  subtitle: string;
  welcomeMessage: string;
  footerText: string;
}

interface SystemSettings {
  colorScheme: ColorScheme;
  loginText: LoginText;
  logoUrl: string;
  customLogo: boolean;
}

const defaultSchemes: ColorScheme[] = [
  {
    name: 'EurekAI',
    primary: '#FFC400',
    secondary: '#000000',
    accent: '#4BC6B8',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  {
    name: 'Mörkt tema',
    primary: '#2563EB',
    secondary: '#4F46E5',
    accent: '#1F2937',
    background: '#111827',
    text: '#F9FAFB'
  },
  {
    name: 'Ljust tema',
    primary: '#3B82F6',
    secondary: '#60A5FA',
    accent: '#1E40AF',
    background: '#F9FAFB',
    text: '#111827'
  },
  {
    name: 'Custom',
    primary: '#2563EB',
    secondary: '#4F46E5',
    accent: '#000000',
    background: '#FFFFFF',
    text: '#1F2937'
  }
];

const defaultLoginText: LoginText = {
  title: 'Lead Hunter',
  subtitle: 'Sales Intelligence Platform',
  welcomeMessage: 'Välkommen till Lead Hunter - din kraftfulla plattform för leadgenerering och kundanalys.',
  footerText: '© 2024 Lead Hunter. Alla rättigheter förbehållna.'
};

export const AdminSettings: React.FC<{ onBack: () => void; isSuperAdmin?: boolean }> = ({ onBack, isSuperAdmin = false }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    colorScheme: defaultSchemes[0],
    loginText: defaultLoginText,
    logoUrl: '',
    customLogo: false
  });

  const [selectedScheme, setSelectedScheme] = useState(0);
  const [customColors, setCustomColors] = useState(defaultSchemes[3]);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'tenants'>('branding');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        const schemeIndex = defaultSchemes.findIndex(s => s.name === data.colorScheme.name);
        if (schemeIndex !== -1) {
          setSelectedScheme(schemeIndex);
          if (schemeIndex === 3) {
            setCustomColors(data.colorScheme);
          }
        }
        
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl);
        }
      }
    } catch (error) {
      console.warn('Settings API not available, using defaults');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      let logoUrl = settings.logoUrl;

      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);

        const uploadResponse = await fetch(`${API_BASE_URL}/settings/upload-logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`
          },
          body: formData
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          logoUrl = url;
        }
      }

      // Save settings
      const updatedSettings = {
        ...settings,
        colorScheme: selectedScheme === 3 ? customColors : defaultSchemes[selectedScheme],
        logoUrl,
        customLogo: !!logoUrl
      };

      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`
        },
        body: JSON.stringify(updatedSettings)
      });

      if (response.ok) {
        setSettings(updatedSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        
        // Apply settings to CSS variables
        applyColorScheme(updatedSettings.colorScheme);
        
        alert('✅ Inställningar sparade! Sidan kommer att laddas om för att tillämpa ändringarna.');
        window.location.reload();
      } else {
        alert('❌ Kunde inte spara inställningar');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Fel vid sparande av inställningar');
    } finally {
      setSaving(false);
    }
  };

  const applyColorScheme = (scheme: ColorScheme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', scheme.primary);
    root.style.setProperty('--color-secondary', scheme.secondary);
    root.style.setProperty('--color-accent', scheme.accent);
    root.style.setProperty('--color-background', scheme.background);
    root.style.setProperty('--color-text', scheme.text);
  };

  const handleSchemeChange = (index: number) => {
    setSelectedScheme(index);
    if (index !== 3) {
      setSettings(prev => ({ ...prev, colorScheme: defaultSchemes[index] }));
    }
  };

  const handleCustomColorChange = (key: keyof ColorScheme, value: string) => {
    setCustomColors(prev => ({ ...prev, [key]: value }));
    setSettings(prev => ({ ...prev, colorScheme: { ...customColors, [key]: value } }));
  };

  const handleLoginTextChange = (key: keyof LoginText, value: string) => {
    setSettings(prev => ({
      ...prev,
      loginText: { ...prev.loginText, [key]: value }
    }));
  };

  const handleReset = () => {
    if (confirm('Är du säker på att du vill återställa alla inställningar till standard?')) {
      setSettings({
        colorScheme: defaultSchemes[0],
        loginText: defaultLoginText,
        logoUrl: '',
        customLogo: false
      });
      setSelectedScheme(0);
      setLogoPreview('');
      setLogoFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-white p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-sm shadow-lg p-6 mb-6 border-t-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-semibold text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Tillbaka
              </button>
              <Settings className="w-8 h-8 text-black" />
              <div>
                <h1 className="text-3xl font-black text-black uppercase tracking-wide">Systeminställningar</h1>
                <p className="text-sm text-gray-600 font-semibold">
                  {isSuperAdmin ? 'Hantera tenants, färgschema, login-text och logotyp' : 'Anpassa färgschema, login-text och logotyp'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {activeTab === 'branding' && (
                <>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-sm transition-colors font-bold uppercase"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Återställ
                  </button>
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-sm transition-colors font-bold uppercase"
                  >
                    <Eye className="w-4 h-4" />
                    {previewMode ? 'Dölj förhandsgranskning' : 'Förhandsgranska'}
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-black hover:bg-[#FFC400] hover:text-black text-white rounded-sm transition-colors font-bold uppercase shadow-lg disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sparar...
                      </>
                    ) : saved ? (
                      <>
                        <Check className="w-5 h-5" />
                        Sparat!
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Spara
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs (endast för super admin) */}
          {isSuperAdmin && (
            <div className="flex gap-2 border-b-2 border-gray-200">
              <button
                onClick={() => setActiveTab('branding')}
                className={`flex items-center gap-2 px-6 py-3 font-bold uppercase transition-colors ${
                  activeTab === 'branding'
                    ? 'border-b-4 text-black -mb-0.5'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Palette className="w-5 h-5" />
                Branding
              </button>
              <button
                onClick={() => setActiveTab('tenants')}
                className={`flex items-center gap-2 px-6 py-3 font-bold uppercase transition-colors ${
                  activeTab === 'tenants'
                    ? 'border-b-4 text-black -mb-0.5'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="w-5 h-5" />
                Tenants
              </button>
            </div>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'tenants' ? (
          <TenantManagement isSuperAdmin={isSuperAdmin} />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Färgschema */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-black" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Färgschema</h2>
                <p className="text-xs text-gray-600 mt-1">Gäller för din tenant/organisation</p>
              </div>
            </div>

            {/* Scheme Selector */}
            <div className="space-y-3 mb-6">
              {defaultSchemes.map((scheme, index) => (
                <div
                  key={scheme.name}
                  onClick={() => handleSchemeChange(index)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedScheme === index
                      ? 'bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-900">{scheme.name}</span>
                    {selectedScheme === index && (
                      <Check className="w-5 h-5 text-black" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="w-12 h-12 rounded border-2 border-gray-300"
                      style={{ backgroundColor: scheme.primary }}
                      title="Primary"
                    />
                    <div
                      className="w-12 h-12 rounded border-2 border-gray-300"
                      style={{ backgroundColor: scheme.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="w-12 h-12 rounded border-2 border-gray-300"
                      style={{ backgroundColor: scheme.accent }}
                      title="Accent"
                    />
                    <div
                      className="w-12 h-12 rounded border-2 border-gray-300"
                      style={{ backgroundColor: scheme.background }}
                      title="Background"
                    />
                    <div
                      className="w-12 h-12 rounded border-2 border-gray-300"
                      style={{ backgroundColor: scheme.text }}
                      title="Text"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Colors */}
            {selectedScheme === 3 && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">Anpassade färger</h3>
                {Object.entries(customColors).map(([key, value]) => {
                  if (key === 'name') return null;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <label className="w-32 font-semibold text-sm capitalize">{key}:</label>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => handleCustomColorChange(key as keyof ColorScheme, e.target.value)}
                        className="w-16 h-10 rounded border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleCustomColorChange(key as keyof ColorScheme, e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-sm font-mono text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Logo Upload */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4">
            <div className="flex items-center gap-3 mb-6">
              <Image className="w-6 h-6 text-black" />
              <h2 className="text-2xl font-bold text-gray-900">Logotyp</h2>
            </div>

            <div className="space-y-4">
              {/* Logo Preview */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="max-h-32 object-contain"
                    />
                    <p className="text-sm text-gray-600 font-semibold">Förhandsgranskning av logo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Image className="w-16 h-16 text-gray-400" />
                    <p className="text-sm text-gray-600 font-semibold">Ingen logo uppladdad</p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-black hover:bg-[#FFC400] hover:text-black text-white rounded-sm transition-colors font-bold uppercase cursor-pointer">
                <Upload className="w-5 h-5" />
                Ladda upp logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>

              <p className="text-xs text-gray-500">
                Rekommenderad storlek: 200x60px. Format: PNG, JPG, SVG
              </p>
            </div>
          </div>

          {/* Login Text */}
          <div className="bg-white rounded-sm shadow-lg p-6 border-t-4 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Type className="w-6 h-6 text-black" />
              <h2 className="text-2xl font-bold text-gray-900">Login-text</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-gray-700 mb-2">Titel</label>
                <input
                  type="text"
                  value={settings.loginText.title}
                  onChange={(e) => handleLoginTextChange('title', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                  placeholder="Lead Hunter"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-2">Undertitel</label>
                <input
                  type="text"
                  value={settings.loginText.subtitle}
                  onChange={(e) => handleLoginTextChange('subtitle', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                  placeholder="Sales Intelligence Platform"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-2">Välkomstmeddelande</label>
                <textarea
                  value={settings.loginText.welcomeMessage}
                  onChange={(e) => handleLoginTextChange('welcomeMessage', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                  placeholder="Välkommen till Lead Hunter..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-2">Footer-text</label>
                <input
                  type="text"
                  value={settings.loginText.footerText}
                  onChange={(e) => handleLoginTextChange('footerText', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-sm focus:focus:ring-0"
                  placeholder="© 2024 DHL. Alla rättigheter förbehållna."
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Preview Mode */}
        {previewMode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b-2 border-gray-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold">Förhandsgranskning</h3>
                <button
                  onClick={() => setPreviewMode(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-sm font-bold"
                >
                  Stäng
                </button>
              </div>
              
              {/* Preview Content */}
              <div 
                className="p-12"
                style={{
                  backgroundColor: selectedScheme === 3 ? customColors.background : defaultSchemes[selectedScheme].background,
                  color: selectedScheme === 3 ? customColors.text : defaultSchemes[selectedScheme].text
                }}
              >
                {/* Logo Preview */}
                {logoPreview && (
                  <div className="mb-8 flex justify-center">
                    <img src={logoPreview} alt="Logo" className="max-h-16 object-contain" />
                  </div>
                )}

                {/* Login Form Preview */}
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-8">
                  <h1 
                    className="text-3xl font-black mb-2"
                    style={{ color: selectedScheme === 3 ? customColors.primary : defaultSchemes[selectedScheme].primary }}
                  >
                    {settings.loginText.title}
                  </h1>
                  <p className="text-lg font-semibold mb-6 text-gray-600">
                    {settings.loginText.subtitle}
                  </p>
                  <p className="text-sm text-gray-600 mb-6">
                    {settings.loginText.welcomeMessage}
                  </p>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Användarnamn"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-sm"
                      disabled
                    />
                    <input
                      type="password"
                      placeholder="Lösenord"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-sm"
                      disabled
                    />
                    <button
                      className="w-full py-3 rounded-sm font-bold uppercase text-white"
                      style={{ backgroundColor: selectedScheme === 3 ? customColors.primary : defaultSchemes[selectedScheme].primary }}
                      disabled
                    >
                      Logga in
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center mt-6">
                    {settings.loginText.footerText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
