import React from 'react';
import { AlertCircle, ExternalLink, Key, Clock, Zap, CheckCircle } from 'lucide-react';

interface QuotaExhaustedModalProps {
  service: 'gemini' | 'groq' | 'all';
  retryIn?: number; // seconds
  onClose: () => void;
}

export const QuotaExhaustedModal: React.FC<QuotaExhaustedModalProps> = ({ 
  service, 
  retryIn,
  onClose 
}) => {
  const getTimeUntilReset = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60));
  };

  const formatRetryTime = (seconds?: number) => {
    if (!seconds) return 'Okänt';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.ceil(minutes / 60);
    return `${hours} timmar`;
  };

  const getServiceInfo = () => {
    switch (service) {
      case 'gemini':
        return {
          title: 'Gemini Quota Slut',
          icon: '🔴',
          color: 'red',
          message: 'Du har använt alla 20 gratis requests för idag.',
          retryMessage: retryIn ? `Försök igen om ${formatRetryTime(retryIn)}` : `Återställs om ~${getTimeUntilReset()} timmar`,
          solutions: [
            {
              title: 'Vänta till imorgon',
              description: 'Quota återställs midnatt UTC (01:00 svensk tid)',
              time: `~${getTimeUntilReset()} timmar`,
              cost: 'Gratis',
              icon: <Clock className="w-5 h-5" />,
              action: null
            },
            {
              title: 'Uppgradera till betald Gemini',
              description: '1500 requests/timme istället för 20/dag',
              time: '5 minuter',
              cost: '~50-100 SEK/månad',
              icon: <Zap className="w-5 h-5" />,
              action: 'https://ai.google.dev/pricing'
            },
            {
              title: 'Fixa Groq fallback',
              description: '14,400 gratis requests/dag - extremt snabbt',
              time: '2 minuter',
              cost: 'Gratis',
              icon: <Key className="w-5 h-5" />,
              action: 'https://console.groq.com/keys'
            }
          ]
        };
      
      case 'groq':
        return {
          title: 'Groq API-nyckel Ogiltig',
          icon: '🔑',
          color: 'yellow',
          message: 'Din Groq API-nyckel fungerar inte (401 Unauthorized).',
          retryMessage: 'Skaffa en ny API-nyckel för att fortsätta',
          solutions: [
            {
              title: 'Skaffa ny Groq API-nyckel',
              description: 'Gratis - 14,400 requests/dag',
              time: '2 minuter',
              cost: 'Gratis',
              icon: <Key className="w-5 h-5" />,
              action: 'https://console.groq.com/keys',
              steps: [
                'Gå till Groq Console',
                'Logga in eller skapa konto',
                'Klicka "Create API Key"',
                'Kopiera nyckeln (börjar med gsk_)',
                'Uppdatera VITE_GROQ_API_KEY i .env',
                'Starta om servern (npm run dev)'
              ]
            },
            {
              title: 'Använd annan AI-tjänst',
              description: 'DeepSeek, Claude eller OpenAI',
              time: '5 minuter',
              cost: 'Varierar',
              icon: <Zap className="w-5 h-5" />,
              action: null
            }
          ]
        };
      
      case 'all':
        return {
          title: 'Alla AI-tjänster Otillgängliga',
          icon: '🚨',
          color: 'red',
          message: 'Både Gemini och Groq är otillgängliga just nu.',
          retryMessage: 'Systemet kan inte utföra AI-analyser',
          solutions: [
            {
              title: 'Fixa Groq (Snabbast)',
              description: 'Skaffa ny API-nyckel - tar 2 minuter',
              time: '2 minuter',
              cost: 'Gratis',
              icon: <Key className="w-5 h-5" />,
              action: 'https://console.groq.com/keys'
            },
            {
              title: 'Uppgradera Gemini',
              description: 'Betald plan ger 1500 requests/timme',
              time: '5 minuter',
              cost: '~50-100 SEK/månad',
              icon: <Zap className="w-5 h-5" />,
              action: 'https://ai.google.dev/pricing'
            },
            {
              title: 'Lägg till DeepSeek',
              description: 'Billig backup - $0.14 per 1M tokens',
              time: '5 minuter',
              cost: '~20-50 SEK/månad',
              icon: <CheckCircle className="w-5 h-5" />,
              action: 'https://platform.deepseek.com'
            }
          ]
        };
      
      default:
        return {
          title: 'API Quota Problem',
          icon: '⚠️',
          color: 'yellow',
          message: 'Ett problem uppstod med API-kvoten.',
          retryMessage: 'Försök igen senare',
          solutions: []
        };
    }
  };

  const info = getServiceInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-${info.color}-50 border-b-4 border-${info.color}-500 p-6`}>
          <div className="flex items-start gap-4">
            <div className="text-5xl">{info.icon}</div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-black uppercase mb-2">
                {info.title}
              </h2>
              <p className="text-gray-700 font-semibold mb-2">
                {info.message}
              </p>
              <div className="bg-white border-2 border-yellow-400 rounded px-3 py-2 inline-block">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-bold text-yellow-800">
                    {info.retryMessage}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Solutions */}
        <div className="p-6">
          <h3 className="text-lg font-black text-black uppercase mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#FFC400]" />
            Lösningar
          </h3>

          <div className="space-y-4">
            {info.solutions.map((solution, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#FFC400] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-[#FFC400] mt-1">
                    {solution.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-black mb-1">
                      {solution.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      {solution.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="font-semibold text-gray-700">
                          {solution.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-green-700">
                          {solution.cost}
                        </span>
                      </div>
                    </div>

                    {solution.steps && (
                      <div className="mt-3 bg-gray-50 rounded p-3">
                        <p className="text-xs font-bold text-gray-700 mb-2 uppercase">
                          Steg-för-steg:
                        </p>
                        <ol className="text-xs space-y-1">
                          {solution.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="font-bold text-[#FFC400]">
                                {i + 1}.
                              </span>
                              <span className="text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {solution.action && (
                      <a
                        href={solution.action}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 bg-[#FFC400] hover:bg-black hover:text-white text-black px-4 py-2 rounded font-bold text-sm transition-colors"
                      >
                        Öppna {solution.title.includes('Groq') ? 'Groq Console' : solution.title.includes('Gemini') ? 'Gemini Pricing' : 'Länk'}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border-t-2 border-blue-200 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-blue-900 mb-1">
                Behöver du hjälp?
              </p>
              <p className="text-blue-800">
                Läs <code className="bg-blue-100 px-2 py-0.5 rounded font-mono text-xs">QUOTA_FIX_GUIDE.md</code> för detaljerade instruktioner.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded font-bold"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
