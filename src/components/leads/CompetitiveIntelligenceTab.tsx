import React from 'react';
import { 
  Target, Award, Zap, AlertTriangle, TrendingUp, TrendingDown,
  CheckCircle, XCircle, ExternalLink, DollarSign, Package, Truck
} from 'lucide-react';

interface CompetitiveIntelligence {
  is_dhl_customer: boolean;
  dhl_position?: number;
  primary_competitor?: string;
  all_competitors: string[];
  opportunity_score: number;
  sales_pitch: string;
  competitive_advantages?: string[];
  risk_factors?: string[];
  estimated_monthly_shipments?: number;
  estimated_annual_value?: number;
}

interface CompetitiveIntelligenceTabProps {
  intelligence: CompetitiveIntelligence | null;
  companyName: string;
  websiteUrl?: string;
}

export const CompetitiveIntelligenceTab: React.FC<CompetitiveIntelligenceTabProps> = ({
  intelligence,
  companyName,
  websiteUrl
}) => {
  
  if (!intelligence) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-semibold">Ingen competitive intelligence tillgänglig</p>
        <p className="text-gray-400 text-sm mt-2">Kör website scraping för att få insights om konkurrenter</p>
        {websiteUrl && (
          <button className="mt-4 bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition font-semibold uppercase shadow-md">
            Starta Website Scraping
          </button>
        )}
      </div>
    );
  }

  const getOpportunityLevel = (score: number): { label: string; color: string; icon: JSX.Element } => {
    if (score >= 80) return { 
      label: '🔥 KONTAKTA NU!', 
      color: 'text-red-600 bg-red-50 border-red-300',
      icon: <TrendingUp className="w-6 h-6 text-red-600" />
    };
    if (score >= 60) return { 
      label: '⭐ Kontakta snart', 
      color: 'text-orange-600 bg-orange-50 border-orange-300',
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />
    };
    if (score >= 40) return { 
      label: '👀 Bevaka', 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-300',
      icon: <Target className="w-6 h-6 text-yellow-600" />
    };
    return { 
      label: '❌ Låg prioritet', 
      color: 'text-gray-600 bg-gray-50 border-gray-300',
      icon: <TrendingDown className="w-6 h-6 text-gray-600" />
    };
  };

  const opportunityLevel = getOpportunityLevel(intelligence.opportunity_score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-primary uppercase flex items-center gap-2">
          <Target className="w-6 h-6" />
          Competitive Intelligence
        </h3>
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-dhl-blue hover:underline text-sm flex items-center gap-1"
          >
            Besök webbplats
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Opportunity Score - STOR DISPLAY */}
      <div className={`border-2 rounded-xl p-8 ${opportunityLevel.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold mb-2 uppercase tracking-wide">Opportunity Score</p>
            <div className="flex items-baseline gap-4">
              <p className="text-7xl font-bold">
                {intelligence.opportunity_score}
              </p>
              <span className="text-3xl font-semibold opacity-70">/100</span>
            </div>
            <p className="text-xl font-bold mt-4">
              {opportunityLevel.label}
            </p>
          </div>
          <div className="text-right">
            {opportunityLevel.icon}
            <Award className="w-20 h-20 opacity-20 mt-4" />
          </div>
        </div>
      </div>

      {/* DHL Status */}
      <div className={`border-2 rounded-lg p-6 ${
        intelligence.is_dhl_customer 
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-center gap-4">
          {intelligence.is_dhl_customer ? (
            <>
              <CheckCircle className="w-10 h-10 text-green-600" />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-green-900">DHL är redan listad!</h4>
                {intelligence.dhl_position && (
                  <p className="text-green-700 mt-1">
                    Position i checkout: <span className="font-bold">#{intelligence.dhl_position}</span>
                  </p>
                )}
                <p className="text-sm text-green-600 mt-2">
                  ✅ Retention opportunity - Säkerställ att vi behåller kunden
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-10 h-10 text-red-600" />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-red-900">DHL saknas i checkout!</h4>
                <p className="text-red-700 mt-1">
                  Företaget använder {intelligence.all_competitors.length} andra transportörer
                </p>
                <p className="text-sm text-red-600 mt-2">
                  🎯 New business opportunity - Kontakta för att bli listad
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Säljpitch */}
      <div className="bg-gradient-to-r from-dhl-yellow to-yellow-100 border-l-4 border-primary p-6 rounded-lg shadow-md">
        <h4 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-900">
          <Zap className="w-6 h-6 text-primary" />
          Din Säljpitch
        </h4>
        <p className="text-gray-900 leading-relaxed text-lg whitespace-pre-line">
          {intelligence.sales_pitch}
        </p>
      </div>

      {/* Konkurrenter */}
      {intelligence.all_competitors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Konkurrenter ({intelligence.all_competitors.length})
          </h4>
          
          {intelligence.primary_competitor && (
            <div className="mb-4 p-4 bg-red-100 rounded-lg">
              <p className="text-sm text-red-700 font-semibold mb-1">Primär konkurrent:</p>
              <p className="text-2xl font-bold text-red-900">{intelligence.primary_competitor}</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {intelligence.all_competitors.map((competitor, idx) => (
              <span 
                key={idx} 
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  competitor === intelligence.primary_competitor
                    ? 'bg-red-200 text-red-900 border-2 border-red-400'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {competitor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Competitive Advantages */}
      {intelligence.competitive_advantages && intelligence.competitive_advantages.length > 0 && (
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
          <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            DHL:s Fördelar
          </h4>
          <ul className="space-y-2">
            {intelligence.competitive_advantages.map((advantage, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span className="text-gray-900">{advantage}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {intelligence.risk_factors && intelligence.risk_factors.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
          <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            Riskfaktorer
          </h4>
          <ul className="space-y-2">
            {intelligence.risk_factors.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold mt-1">⚠</span>
                <span className="text-gray-900">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Estimat */}
      {(intelligence.estimated_monthly_shipments || intelligence.estimated_annual_value) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {intelligence.estimated_monthly_shipments && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-6 h-6 text-blue-600" />
                <p className="text-sm font-semibold text-blue-700">Estimerade Försändelser</p>
              </div>
              <p className="text-4xl font-bold text-blue-900">
                {intelligence.estimated_monthly_shipments.toLocaleString('sv-SE')}
              </p>
              <p className="text-sm text-blue-600 mt-1">per månad</p>
            </div>
          )}
          
          {intelligence.estimated_annual_value && (
            <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-6 h-6 text-purple-600" />
                <p className="text-sm font-semibold text-purple-700">Estimerat Årligt Värde</p>
              </div>
              <p className="text-4xl font-bold text-purple-900">
                {intelligence.estimated_annual_value.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-sm text-purple-600 mt-1">potentiell årsomsättning</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <button className="flex-1 bg-primary text-white px-6 py-4 rounded-lg hover:bg-opacity-90 transition font-bold uppercase text-lg shadow-lg flex items-center justify-center gap-2">
          <Truck className="w-6 h-6" />
          Kontakta Kund
        </button>
        <button className="flex-1 bg-secondary text-black px-6 py-4 rounded-lg hover:bg-opacity-90 transition font-bold uppercase text-lg shadow-lg flex items-center justify-center gap-2">
          <Target className="w-6 h-6" />
          Skapa Offert
        </button>
      </div>
    </div>
  );
};

export default CompetitiveIntelligenceTab;
