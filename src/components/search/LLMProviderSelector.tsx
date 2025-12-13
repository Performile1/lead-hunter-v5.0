import React, { useState, useEffect } from 'react';
import { Cpu, Zap, DollarSign, CheckCircle, Star, AlertCircle } from 'lucide-react';

interface LLMProvider {
  id: string;
  name: string;
  model: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  cost: 'free' | 'low' | 'medium' | 'high';
  quality: 'good' | 'high' | 'excellent';
  features: string[];
  available: boolean;
  recommended?: boolean;
}

interface LLMProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  protocol: string;
}

export const LLMProviderSelector: React.FC<LLMProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  protocol
}) => {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/llm-configs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Konvertera till vårt format
      const formattedProviders = data.configs?.map((config: any) => ({
        id: config.provider.toLowerCase().replace(/\s+/g, '_'),
        name: config.provider,
        model: config.model_name,
        description: getProviderDescription(config.provider),
        speed: getProviderSpeed(config.provider),
        cost: getProviderCost(config.provider),
        quality: getProviderQuality(config.provider),
        features: config.metadata?.features || [],
        available: config.is_enabled && config.api_key_set,
        recommended: config.priority >= 90
      })) || [];

      setProviders(formattedProviders);
    } catch (error) {
      console.error('Failed to load providers:', error);
      setProviders(getDefaultProviders());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultProviders = (): LLMProvider[] => [
    {
      id: 'gemini',
      name: 'Google Gemini',
      model: 'gemini-2.0-flash-exp',
      description: 'Snabb, gratis, med web grounding',
      speed: 'fast',
      cost: 'free',
      quality: 'excellent',
      features: ['Web Grounding', 'Gratis', 'Snabb', 'Hög kvalitet'],
      available: true,
      recommended: true
    },
    {
      id: 'groq',
      name: 'Groq',
      model: 'llama-3.1-70b',
      description: 'Extremt snabb, gratis, bra kvalitet',
      speed: 'fast',
      cost: 'free',
      quality: 'high',
      features: ['Gratis', 'Extremt snabb', 'Bra kvalitet'],
      available: true,
      recommended: true
    },
    {
      id: 'openai',
      name: 'OpenAI',
      model: 'gpt-4o-mini',
      description: 'Hög kvalitet, låg kostnad',
      speed: 'medium',
      cost: 'low',
      quality: 'excellent',
      features: ['Hög kvalitet', 'Pålitlig', 'Låg kostnad'],
      available: false
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      model: 'claude-3-5-haiku',
      description: 'Utmärkt för analys, medel kostnad',
      speed: 'medium',
      cost: 'medium',
      quality: 'excellent',
      features: ['Djup analys', 'Lång kontext', 'Hög kvalitet'],
      available: false
    },
    {
      id: 'ollama',
      name: 'Ollama (Lokal)',
      model: 'llama3.1',
      description: 'Lokal, gratis, privat',
      speed: 'slow',
      cost: 'free',
      quality: 'good',
      features: ['Gratis', 'Lokal', '100% privat', 'Ingen API-nyckel'],
      available: false
    }
  ];

  const getProviderDescription = (provider: string): string => {
    const descriptions: Record<string, string> = {
      'Google Gemini': 'Snabb, gratis, med web grounding',
      'Groq': 'Extremt snabb, gratis, bra kvalitet',
      'OpenAI': 'Hög kvalitet, låg kostnad',
      'Anthropic Claude': 'Utmärkt för analys, medel kostnad',
      'Ollama': 'Lokal, gratis, privat'
    };
    return descriptions[provider] || 'AI-modell';
  };

  const getProviderSpeed = (provider: string): 'fast' | 'medium' | 'slow' => {
    const speeds: Record<string, 'fast' | 'medium' | 'slow'> = {
      'Google Gemini': 'fast',
      'Groq': 'fast',
      'OpenAI': 'medium',
      'Anthropic Claude': 'medium',
      'Ollama': 'slow'
    };
    return speeds[provider] || 'medium';
  };

  const getProviderCost = (provider: string): 'free' | 'low' | 'medium' | 'high' => {
    const costs: Record<string, 'free' | 'low' | 'medium' | 'high'> = {
      'Google Gemini': 'free',
      'Groq': 'free',
      'OpenAI': 'low',
      'Anthropic Claude': 'medium',
      'Ollama': 'free'
    };
    return costs[provider] || 'medium';
  };

  const getProviderQuality = (provider: string): 'good' | 'high' | 'excellent' => {
    const quality: Record<string, 'good' | 'high' | 'excellent'> = {
      'Google Gemini': 'excellent',
      'Groq': 'high',
      'OpenAI': 'excellent',
      'Anthropic Claude': 'excellent',
      'Ollama': 'good'
    };
    return quality[provider] || 'high';
  };

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'fast':
        return <Zap className="w-4 h-4 text-green-600" />;
      case 'medium':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'slow':
        return <Zap className="w-4 h-4 text-gray-600" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getCostBadge = (cost: string) => {
    const badges: Record<string, string> = {
      free: 'bg-green-100 text-green-800',
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return badges[cost] || badges.medium;
  };

  if (loading) {
    return <div className="text-center py-4">Laddar LLM-providers...</div>;
  }

  const availableProviders = providers.filter(p => p.available);
  const unavailableProviders = providers.filter(p => !p.available);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          Välj AI-Modell
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Alla modeller ger liknande resultat för {protocol}-protokollet. Välj baserat på hastighet och kostnad.
        </p>
      </div>

      {availableProviders.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Tillgängliga Modeller:</h4>
          <div className="grid grid-cols-1 gap-3">
            {availableProviders.map((provider) => (
              <div
                key={provider.id}
                onClick={() => onProviderChange(provider.id)}
                className={`
                  border-2 rounded-lg p-4 cursor-pointer transition-all
                  ${selectedProvider === provider.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-bold">{provider.name}</h5>
                      {provider.recommended && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Rekommenderad
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{provider.model}</p>
                    <p className="text-sm text-gray-700">{provider.description}</p>
                  </div>
                  {selectedProvider === provider.id && (
                    <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1">
                    {getSpeedIcon(provider.speed)}
                    <span className="text-xs text-gray-600 capitalize">{provider.speed}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCostBadge(provider.cost)}`}>
                    {provider.cost === 'free' ? 'GRATIS' : provider.cost.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-600">
                    Kvalitet: {provider.quality}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {provider.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unavailableProviders.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500">Ej Tillgängliga (Kräver API-nyckel):</h4>
          <div className="grid grid-cols-1 gap-2">
            {unavailableProviders.map((provider) => (
              <div
                key={provider.id}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-700">{provider.name}</h5>
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">{provider.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">API-nyckel saknas</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Kontakta admin för att aktivera fler modeller
          </p>
        </div>
      )}

      {selectedProvider && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">
                {providers.find(p => p.id === selectedProvider)?.name} vald
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Alla protokoll använder nu denna modell för analys
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
