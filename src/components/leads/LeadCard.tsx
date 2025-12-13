import React, { useState } from 'react';
import { X, Building2, MapPin, Phone, Globe, Mail, Calendar, User, TrendingUp, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface Lead {
  id: string;
  companyName: string;
  orgNumber?: string;
  segment: string;
  address?: string;
  postalCode?: string;
  city?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  email?: string;
  revenueTkr?: number;
  freightBudgetTkr?: number;
  legalStatus?: string;
  creditRating?: string;
  kronofogdenCheck?: string;
  ecommercePlatform?: string;
  decisionMakers?: DecisionMaker[];
  latestNews?: string;
  analysisDate?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedSalesperson?: string;
  source?: string;
}

interface DecisionMaker {
  name: string;
  title: string;
  email?: string;
  linkedin?: string;
  directPhone?: string;
}

interface LeadCardProps {
  lead: Lead;
  onClose: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'history'>('overview');

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      DM: 'bg-gray-100 text-gray-800',
      TS: 'bg-green-100 text-green-800',
      FS: 'bg-blue-100 text-blue-800',
      KAM: 'bg-purple-100 text-purple-800',
      UNKNOWN: 'bg-yellow-100 text-yellow-800'
    };
    return colors[segment] || colors.UNKNOWN;
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return `${amount.toLocaleString('sv-SE')} TKR`;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('sv-SE');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-dhl-red text-white p-6 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-6 h-6" />
              <h2 className="text-2xl font-bold uppercase">{lead.companyName}</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {lead.orgNumber && (
                <span className="flex items-center gap-1">
                  <span className="opacity-80">Org.nr:</span>
                  <span className="font-semibold">{lead.orgNumber}</span>
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSegmentColor(lead.segment)}`}>
                {lead.segment}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold uppercase text-sm transition ${
                activeTab === 'overview'
                  ? 'border-b-2 border-dhl-red text-dhl-red bg-white'
                  : 'text-gray-600 hover:text-dhl-red'
              }`}
            >
              Översikt
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-6 py-3 font-semibold uppercase text-sm transition ${
                activeTab === 'contacts'
                  ? 'border-b-2 border-dhl-red text-dhl-red bg-white'
                  : 'text-gray-600 hover:text-dhl-red'
              }`}
            >
              Kontakter
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-semibold uppercase text-sm transition ${
                activeTab === 'history'
                  ? 'border-b-2 border-dhl-red text-dhl-red bg-white'
                  : 'text-gray-600 hover:text-dhl-red'
              }`}
            >
              Historik
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Kontaktinformation */}
              <section>
                <h3 className="text-lg font-bold text-dhl-red mb-4 uppercase">Kontaktinformation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-dhl-red mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Adress</p>
                        <p className="text-gray-900">{lead.address}</p>
                        <p className="text-gray-900">{lead.postalCode} {lead.city}</p>
                      </div>
                    </div>
                  )}
                  {lead.phoneNumber && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-dhl-red mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Telefon</p>
                        <p className="text-gray-900">{lead.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  {lead.websiteUrl && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-dhl-red mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Webbplats</p>
                        <a
                          href={lead.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dhl-blue hover:underline flex items-center gap-1"
                        >
                          {lead.websiteUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-dhl-red mt-1" />
                      <div>
                        <p className="font-semibold text-sm text-gray-600">Email</p>
                        <a href={`mailto:${lead.email}`} className="text-dhl-blue hover:underline">
                          {lead.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Ekonomi */}
              <section>
                <h3 className="text-lg font-bold text-dhl-red mb-4 uppercase">Ekonomi</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border-l-4 border-dhl-blue p-4">
                    <p className="text-sm text-gray-600 mb-1">Omsättning</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(lead.revenueTkr)}</p>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-dhl-yellow p-4">
                    <p className="text-sm text-gray-600 mb-1">Fraktbudget (5%)</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(lead.freightBudgetTkr)}</p>
                  </div>
                  <div className="bg-green-50 border-l-4 border-dhl-green p-4">
                    <p className="text-sm text-gray-600 mb-1">Kreditbetyg</p>
                    <p className="text-2xl font-bold text-gray-900">{lead.creditRating || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Status & Varningar */}
              <section>
                <h3 className="text-lg font-bold text-dhl-red mb-4 uppercase">Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-sm">Legal Status</p>
                      <p className="text-gray-700">{lead.legalStatus || 'Okänd'}</p>
                    </div>
                  </div>
                  {lead.kronofogdenCheck && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-semibold text-sm text-red-900">Kronofogden</p>
                        <p className="text-red-700">{lead.kronofogdenCheck}</p>
                      </div>
                    </div>
                  )}
                  {lead.ecommercePlatform && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-sm">E-handelsplattform</p>
                        <p className="text-gray-700">{lead.ecommercePlatform}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Nyheter */}
              {lead.latestNews && (
                <section>
                  <h3 className="text-lg font-bold text-dhl-red mb-4 uppercase">Senaste Nyheter</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{lead.latestNews}</p>
                  </div>
                </section>
              )}

              {/* Tidsstämplar */}
              <section>
                <h3 className="text-lg font-bold text-dhl-red mb-4 uppercase">Tidsstämplar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Analyserad</p>
                      <p className="font-semibold">{formatDate(lead.analysisDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Skapad</p>
                      <p className="font-semibold">{formatDate(lead.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Uppdaterad</p>
                      <p className="font-semibold">{formatDate(lead.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-dhl-red mb-4 uppercase">Beslutsfattare</h3>
              {lead.decisionMakers && lead.decisionMakers.length > 0 ? (
                <div className="space-y-3">
                  {lead.decisionMakers.map((dm, index) => (
                    <div key={index} className="border-l-4 border-dhl-yellow bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-dhl-red mt-1" />
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{dm.name}</h4>
                          <p className="text-gray-600 mb-2">{dm.title}</p>
                          <div className="space-y-1 text-sm">
                            {dm.email && (
                              <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <a href={`mailto:${dm.email}`} className="text-dhl-blue hover:underline">
                                  {dm.email}
                                </a>
                              </p>
                            )}
                            {dm.directPhone && (
                              <p className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span>{dm.directPhone}</span>
                              </p>
                            )}
                            {dm.linkedin && (
                              <p className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-gray-500" />
                                <a
                                  href={dm.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-dhl-blue hover:underline"
                                >
                                  LinkedIn-profil
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Inga beslutsfattare registrerade</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-dhl-red mb-4 uppercase">Historik</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-semibold">Lead skapad</p>
                    <p className="text-sm text-gray-600">{formatDate(lead.createdAt)}</p>
                    <p className="text-xs text-gray-500">Källa: {lead.source || 'AI'}</p>
                  </div>
                </div>
                {lead.analysisDate && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-semibold">Analys genomförd</p>
                      <p className="text-sm text-gray-600">{formatDate(lead.analysisDate)}</p>
                    </div>
                  </div>
                )}
                {lead.assignedSalesperson && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-semibold">Tilldelad säljare</p>
                      <p className="text-sm text-gray-600">{lead.assignedSalesperson}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
          >
            Stäng
          </button>
          <button className="bg-dhl-red text-white px-6 py-2 rounded hover:bg-opacity-90 transition uppercase font-semibold">
            Redigera
          </button>
        </div>
      </div>
    </div>
  );
};
