import React, { useState } from 'react';
import { Search, Filter, Download, Building2, MapPin, TrendingUp, Calendar } from 'lucide-react';
import { LeadCard } from './LeadCard';

interface Lead {
  id: string;
  companyName: string;
  orgNumber?: string;
  segment: string;
  city?: string;
  revenueTkr?: number;
  analysisDate?: string;
  assignedSalesperson?: string;
}

interface LeadListProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

export const LeadList: React.FC<LeadListProps> = ({ leads, onLeadClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'date'>('date');

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

  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch = lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lead.orgNumber?.includes(searchTerm) ||
                           lead.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSegment = filterSegment === 'all' || lead.segment === filterSegment;
      return matchesSearch && matchesSegment;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.companyName.localeCompare(b.companyName);
        case 'revenue':
          return (b.revenueTkr || 0) - (a.revenueTkr || 0);
        case 'date':
          return new Date(b.analysisDate || 0).getTime() - new Date(a.analysisDate || 0).getTime();
        default:
          return 0;
      }
    });

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    if (onLeadClick) {
      onLeadClick(lead);
    }
  };

  const exportToCSV = () => {
    const headers = ['Företag', 'Org.nr', 'Segment', 'Stad', 'Omsättning (TKR)', 'Datum'];
    const rows = filteredLeads.map(lead => [
      lead.companyName,
      lead.orgNumber || '',
      lead.segment,
      lead.city || '',
      lead.revenueTkr || '',
      lead.analysisDate || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border-l-4 border-primary p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-primary uppercase">Leads</h2>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-secondary text-black px-4 py-2 rounded hover:bg-opacity-90 transition font-semibold uppercase text-sm"
          >
            <Download className="w-4 h-4" />
            Exportera
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sök företag, org.nr, stad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            />
          </div>

          {/* Segment Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterSegment}
              onChange={(e) => setFilterSegment(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary appearance-none"
            >
              <option value="all">Alla segment</option>
              <option value="DM">DM - Direct Marketing</option>
              <option value="TS">TS - Telesales</option>
              <option value="FS">FS - Field Sales</option>
              <option value="KAM">KAM - Key Account</option>
              <option value="UNKNOWN">Oklassificerad</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'revenue' | 'date')}
            className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
          >
            <option value="date">Senast analyserade</option>
            <option value="name">Företagsnamn (A-Ö)</option>
            <option value="revenue">Omsättning (högst först)</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          Visar <span className="font-semibold text-primary">{filteredLeads.length}</span> av{' '}
          <span className="font-semibold">{leads.length}</span> leads
        </div>
      </div>

      {/* Lead Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLeads.length > 0 ? (
          filteredLeads.map(lead => (
            <div
              key={lead.id}
              onClick={() => handleLeadClick(lead)}
              className="bg-white border-l-4 border-primary p-6 shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-gray-900">{lead.companyName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSegmentColor(lead.segment)}`}>
                      {lead.segment}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {lead.orgNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold">Org.nr:</span>
                        <span>{lead.orgNumber}</span>
                      </div>
                    )}
                    {lead.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{lead.city}</span>
                      </div>
                    )}
                    {lead.revenueTkr && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>{lead.revenueTkr.toLocaleString('sv-SE')} TKR</span>
                      </div>
                    )}
                  </div>

                  {lead.analysisDate && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                      <Calendar className="w-3 h-3" />
                      <span>Analyserad: {new Date(lead.analysisDate).toLocaleDateString('sv-SE')}</span>
                    </div>
                  )}

                  {lead.assignedSalesperson && (
                    <div className="mt-2">
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                        Tilldelad: {lead.assignedSalesperson}
                      </span>
                    </div>
                  )}
                </div>

                <button className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition text-sm font-semibold uppercase">
                  Visa
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 text-center shadow-md">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Inga leads hittades</p>
            <p className="text-gray-400 text-sm mt-2">Prova att ändra sökfilter eller lägg till nya leads</p>
          </div>
        )}
      </div>

      {/* Lead Card Modal */}
      {selectedLead && (
        <LeadCard
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
};
