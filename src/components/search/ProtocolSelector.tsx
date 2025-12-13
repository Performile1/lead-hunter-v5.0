import React, { useState, useEffect } from 'react';
import { Zap, Target, Layers, Users, Clock, DollarSign, CheckCircle } from 'lucide-react';

interface Protocol {
  id: string;
  name: string;
  description: string;
  estimated_time: number | string;
  cost_estimate: string;
  features: string[];
}

interface ProtocolSelectorProps {
  selectedProtocol: string;
  onProtocolChange: (protocol: string) => void;
  selectedProvider?: string;
  onProviderChange?: (provider: string) => void;
}

export const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({
  selectedProtocol,
  onProtocolChange
}) => {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/analysis/protocols', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProtocols(data.protocols || []);
    } catch (error) {
      console.error('Failed to load protocols:', error);
      // Fallback till hårdkodade protokoll
      setProtocols(getDefaultProtocols());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultProtocols = (): Protocol[] => [
    {
      id: 'deep_pro',
      name: 'Djupanalys PRO',
      description: '3-stegs sekventiell analys med web grounding. Högsta kvalitet.',
      estimated_time: 60,
      cost_estimate: '$0.001',
      features: [
        'Web grounding för verifierad data',
        'Kronofogden-kontroll',
        'Org.nummer validering',
        'Beslutsfattare med LinkedIn',
        'Fullständig finansiell analys',
        'Tech stack analys'
      ]
    },
    {
      id: 'deep',
      name: 'Djupanalys Standard',
      description: '3-stegs analys utan grounding. Bra kvalitet, snabbare.',
      estimated_time: 45,
      cost_estimate: '$0.0008',
      features: [
        'Grundläggande företagsdata',
        'Finansiell översikt',
        'Beslutsfattare',
        'Logistikprofil',
        'Snabbare än PRO'
      ]
    },
    {
      id: 'quick',
      name: 'Snabbskanning',
      description: 'Snabb översikt av företag. Perfekt för initial screening.',
      estimated_time: 15,
      cost_estimate: '$0.0003',
      features: [
        'Grundläggande info',
        'Segment-klassificering',
        'Snabb omsättningsuppskattning',
        'Mycket snabb'
      ]
    },
    {
      id: 'batch_prospecting',
      name: 'Batch Prospecting',
      description: 'Hitta många leads samtidigt baserat på kriterier.',
      estimated_time: 'Varierar',
      cost_estimate: '$0.0005/lead',
      features: [
        'Hitta 10-100 leads samtidigt',
        'Geografisk filtrering',
        'Finansiell filtrering',
        'Trigger-baserad sökning',
        'Automatisk segmentering'
      ]
    }
  ];

  const getProtocolIcon = (id: string) => {
    switch (id) {
      case 'deep_pro':
        return <Target className="w-6 h-6" />;
      case 'deep':
        return <Layers className="w-6 h-6" />;
      case 'quick':
        return <Zap className="w-6 h-6" />;
      case 'batch_prospecting':
        return <Users className="w-6 h-6" />;
      default:
        return <Target className="w-6 h-6" />;
    }
  };

  const getProtocolColor = (id: string) => {
    switch (id) {
      case 'deep_pro':
        return 'border-purple-500 bg-purple-50';
      case 'deep':
        return 'border-blue-500 bg-blue-50';
      case 'quick':
        return 'border-green-500 bg-green-50';
      case 'batch_prospecting':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Laddar protokoll...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-2">Välj Analysprotokoll</h3>
        <p className="text-sm text-gray-600 mb-4">
          Olika protokoll för olika behov - från snabb screening till djupanalys
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protocols.map((protocol) => (
          <div
            key={protocol.id}
            onClick={() => onProtocolChange(protocol.id)}
            className={`
              border-2 rounded-lg p-4 cursor-pointer transition-all
              ${selectedProtocol === protocol.id
                ? `${getProtocolColor(protocol.id)} border-opacity-100 shadow-lg`
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${selectedProtocol === protocol.id
                    ? 'bg-white shadow-sm'
                    : 'bg-gray-100'
                  }
                `}>
                  {getProtocolIcon(protocol.id)}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{protocol.name}</h4>
                  <p className="text-xs text-gray-600">{protocol.description}</p>
                </div>
              </div>
              {selectedProtocol === protocol.id && (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>

            <div className="flex items-center gap-4 mb-3 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{protocol.estimated_time}s</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>{protocol.cost_estimate}</span>
              </div>
            </div>

            <div className="space-y-1">
              {protocol.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedProtocol && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">
                {protocols.find(p => p.id === selectedProtocol)?.name} valt
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {protocols.find(p => p.id === selectedProtocol)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
