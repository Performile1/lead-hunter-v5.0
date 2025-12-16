import React, { useState } from 'react';
import { 
  Search, ChevronUp, ChevronDown, TriangleAlert, Download, 
  Eye, Trash2, X, AlertCircle
} from 'lucide-react';

interface Lead {
  id: string;
  status: 'new' | 'analyzing' | 'analyzed' | 'contacted';
  org_number: string;
  company_name: string;
  city: string;
  postal_code?: string;
  revenue_tkr?: number;
  segment: string;
  contact_person?: string;
}

interface LeadTableProps {
  leads: Lead[];
  onAnalyze: (leadId: string) => void;
  onDownload: (leadId: string) => void;
  onReport: (leadId: string) => void;
  onDelete: (leadIds: string[], reason: string) => void;
  userRole?: 'admin' | 'terminal_chef' | 'manager' | 'salesperson';
}

type SortField = 'org_number' | 'company_name' | 'city' | 'revenue_tkr' | 'segment';
type SortDirection = 'asc' | 'desc';

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  onAnalyze,
  onDownload,
  onReport,
  onDelete,
  userRole = 'salesperson'
}) => {
  const [globalSearch, setGlobalSearch] = useState('');
  const [orgSearch, setOrgSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [revenueSearch, setRevenueSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  
  const [sortField, setSortField] = useState<SortField>('company_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState<string>('');

  const canSeeSegment = userRole === 'admin' || userRole === 'terminal_chef';

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesGlobal = !globalSearch || 
      lead.company_name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      lead.org_number.includes(globalSearch) ||
      lead.city.toLowerCase().includes(globalSearch.toLowerCase());
    
    const matchesOrg = !orgSearch || lead.org_number.includes(orgSearch);
    const matchesCompany = !companySearch || lead.company_name.toLowerCase().includes(companySearch.toLowerCase());
    const matchesCity = !citySearch || lead.city.toLowerCase().includes(citySearch.toLowerCase());
    const matchesRevenue = !revenueSearch || (lead.revenue_tkr && lead.revenue_tkr.toString().includes(revenueSearch));
    const matchesContact = !contactSearch || (lead.contact_person && lead.contact_person.toLowerCase().includes(contactSearch.toLowerCase()));

    return matchesGlobal && matchesOrg && matchesCompany && matchesCity && matchesRevenue && matchesContact;
  });

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'revenue_tkr') {
      aVal = aVal || 0;
      bVal = bVal || 0;
    }

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal?.toLowerCase() || '';
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === sortedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(sortedLeads.map(l => l.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedLeads.length === 0) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!deleteReason) return;
    onDelete(selectedLeads, deleteReason);
    setSelectedLeads([]);
    setShowDeleteModal(false);
    setDeleteReason('');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800 border-blue-200',
      analyzing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      analyzed: 'bg-green-100 text-green-800 border-green-200',
      contacted: 'bg-[#FFC400] text-black border-yellow-200'
    };
    return colors[status] || colors.new;
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      new: 'Ny',
      analyzing: 'Analyserar...',
      analyzed: 'Analyserad',
      contacted: 'Kontaktad'
    };
    return texts[status] || status;
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-3 h-3" /> : 
      <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="bg-white border-2 border-slate-300 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-[#FFCC00] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black italic text-[#D40511] uppercase">
            Lead Lista
          </h3>
          
          {/* Global Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Snabbsök globalt..."
                className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 rounded-sm text-sm focus:outline-none focus:border-[#D40511] transition-colors"
              />
            </div>
          </div>

          {/* Results Counter */}
          <div className="text-sm font-bold text-slate-600">
            Visar {sortedLeads.length} av {leads.length} leads
          </div>
        </div>

        <p className="text-xs text-slate-500 italic">
          Klicka på rubrikerna nedan för att sortera
        </p>
      </div>

      {/* Gold Bar - Select All */}
      <div className="bg-[#FFCC00] border-b-2 border-[#D40511] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 text-[#D40511] border-2 border-[#D40511] rounded focus:ring-[#D40511]"
          />
          <span className="text-sm font-bold text-black">
            Markera alla ({selectedLeads.length} valda)
          </span>
        </div>

        {selectedLeads.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 bg-[#D40511] text-white px-4 py-1.5 rounded-sm text-xs font-bold uppercase hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Ta bort valda ({selectedLeads.length})
          </button>
        )}
      </div>

      {/* Column Headers */}
      <div className="bg-slate-50 border-b-2 border-slate-200 px-4 py-2 grid grid-cols-12 gap-2 text-xs font-bold text-slate-700 uppercase">
        <div className="col-span-1 flex items-center">Val</div>
        <div 
          className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-[#D40511]"
          onClick={() => handleSort('org_number')}
        >
          Status/Org
          <SortIcon field="org_number" />
        </div>
        <div 
          className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-[#D40511]"
          onClick={() => handleSort('company_name')}
        >
          Företag
          <SortIcon field="company_name" />
        </div>
        <div 
          className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-[#D40511]"
          onClick={() => handleSort('city')}
        >
          Ort
          <SortIcon field="city" />
        </div>
        <div 
          className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-[#D40511]"
          onClick={() => handleSort('revenue_tkr')}
        >
          Omsättning
          <SortIcon field="revenue_tkr" />
        </div>
        {canSeeSegment && (
          <div 
            className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-[#D40511]"
            onClick={() => handleSort('segment')}
          >
            Segment
            <SortIcon field="segment" />
          </div>
        )}
        <div className={canSeeSegment ? "col-span-2" : "col-span-3"}>Kontaktperson</div>
        <div className={canSeeSegment ? "col-span-3" : "col-span-3"}>Åtgärd</div>
      </div>

      {/* Search Filters */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 grid grid-cols-12 gap-2">
        <div className="col-span-1"></div>
        <div className="col-span-1">
          <input
            type="text"
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
            placeholder="Org..."
            className="w-full px-2 py-1 border border-slate-300 rounded-sm text-xs focus:outline-none focus:border-[#D40511]"
          />
        </div>
        <div className="col-span-2">
          <input
            type="text"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            placeholder="Företag..."
            className="w-full px-2 py-1 border border-slate-300 rounded-sm text-xs focus:outline-none focus:border-[#D40511]"
          />
        </div>
        <div className="col-span-1">
          <input
            type="text"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
            placeholder="Ort..."
            className="w-full px-2 py-1 border border-slate-300 rounded-sm text-xs focus:outline-none focus:border-[#D40511]"
          />
        </div>
        <div className="col-span-1">
          <input
            type="text"
            value={revenueSearch}
            onChange={(e) => setRevenueSearch(e.target.value)}
            placeholder="Oms..."
            className="w-full px-2 py-1 border border-slate-300 rounded-sm text-xs focus:outline-none focus:border-[#D40511]"
          />
        </div>
        {canSeeSegment && <div className="col-span-1"></div>}
        <div className={canSeeSegment ? "col-span-2" : "col-span-3"}>
          <input
            type="text"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Kontakt..."
            className="w-full px-2 py-1 border border-slate-300 rounded-sm text-xs focus:outline-none focus:border-[#D40511]"
          />
        </div>
        <div className={canSeeSegment ? "col-span-3" : "col-span-3"}></div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
        {sortedLeads.map((lead) => (
          <div
            key={lead.id}
            className={`px-4 py-3 grid grid-cols-12 gap-2 items-center hover:bg-slate-50 transition-colors ${
              selectedLeads.includes(lead.id) ? 'bg-yellow-50' : ''
            }`}
          >
            {/* Checkbox */}
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedLeads.includes(lead.id)}
                onChange={() => handleSelectLead(lead.id)}
                className="w-4 h-4 text-[#D40511] border-2 border-slate-300 rounded focus:ring-[#D40511]"
              />
            </div>

            {/* Status/Org */}
            <div className="col-span-1">
              <div className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border mb-1 ${getStatusColor(lead.status)}`}>
                {getStatusText(lead.status)}
              </div>
              <div className="text-[10px] font-mono text-slate-600">{lead.org_number}</div>
            </div>

            {/* Company */}
            <div className="col-span-2">
              <div className="font-bold text-sm text-slate-900">{lead.company_name}</div>
            </div>

            {/* City */}
            <div className="col-span-1">
              <div className="text-sm text-slate-700">{lead.city}</div>
              {lead.postal_code && (
                <div className="text-[10px] text-slate-400">{lead.postal_code}</div>
              )}
            </div>

            {/* Revenue */}
            <div className="col-span-1">
              {lead.revenue_tkr ? (
                <div className="text-sm font-semibold text-slate-900">
                  {lead.revenue_tkr >= 1000 
                    ? `${(lead.revenue_tkr / 1000).toFixed(0)}M` 
                    : `${lead.revenue_tkr}K`}
                </div>
              ) : (
                <div className="text-xs text-slate-400">N/A</div>
              )}
            </div>

            {/* Segment (only for admin/terminal_chef) */}
            {canSeeSegment && (
              <div className="col-span-1">
                <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
                  lead.segment === 'KAM' ? 'bg-red-100 text-red-800 border-red-200' :
                  lead.segment === 'FS' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  lead.segment === 'TS' ? 'bg-green-100 text-green-800 border-green-200' :
                  'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
                  {lead.segment}
                </span>
              </div>
            )}

            {/* Contact Person */}
            <div className={canSeeSegment ? "col-span-2" : "col-span-3"}>
              {lead.contact_person ? (
                <div className="text-sm text-slate-700">{lead.contact_person}</div>
              ) : (
                <div className="text-xs text-slate-400 italic">Ej tillgänglig</div>
              )}
            </div>

            {/* Actions */}
            <div className={`flex items-center gap-1 ${canSeeSegment ? "col-span-3" : "col-span-3"}`}>
              <button
                onClick={() => onReport(lead.id)}
                className="p-1.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-sm hover:bg-orange-200 transition-colors"
                title="Rapportera fel (hallucination)"
              >
                <TriangleAlert className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDownload(lead.id)}
                className="p-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-sm hover:bg-blue-200 transition-colors"
                title="Ladda ned enstaka"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onAnalyze(lead.id)}
                className={`px-2 py-1.5 rounded-sm text-[10px] font-bold uppercase transition-colors ${
                  lead.status === 'analyzed'
                    ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                    : 'bg-[#D40511] text-white hover:bg-red-700'
                }`}
                title={lead.status === 'analyzed' ? 'Öppna analys' : 'Starta analys'}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" />
                {lead.status === 'analyzed' ? 'Öppna' : 'Starta'}
              </button>

              <button
                onClick={() => {
                  setSelectedLeads([lead.id]);
                  setShowDeleteModal(true);
                }}
                className="p-1.5 bg-red-100 text-red-700 border border-red-200 rounded-sm hover:bg-red-200 transition-colors"
                title="Radera"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="bg-[#D40511] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <h3 className="text-lg font-bold uppercase">
                Ta bort {selectedLeads.length} företag
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason('');
                }}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm font-semibold text-slate-700 mb-4">
                Varför vill du ta bort detta/dessa företag från listan?
              </p>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-sm hover:border-[#D40511] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="deleteReason"
                    value="duplicate"
                    checked={deleteReason === 'duplicate'}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900">Detta är en dublett</div>
                    <div className="text-xs text-slate-600">Tar bort denna rad men behåller andra förekomster av företaget. Svartlistar INTE namnet.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-sm hover:border-[#D40511] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="deleteReason"
                    value="existing_customer"
                    checked={deleteReason === 'existing_customer'}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900">Befintlig kund</div>
                    <div className="text-xs text-slate-600">Tar bort och lägger till namnet i "befintliga kunder" (lägger till namnet och org.nummer i exkluderingar).</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-sm hover:border-[#D40511] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="deleteReason"
                    value="hallucination"
                    checked={deleteReason === 'hallucination'}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900">Felaktig data / Hallucination</div>
                    <div className="text-xs text-slate-600">AI:n har hittat fel företag eller org.nummer. Blockerar detta namn/org.nummer permanent (negativ prompt).</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-sm hover:border-[#D40511] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="deleteReason"
                    value="not_relevant"
                    checked={deleteReason === 'not_relevant'}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900">Ej relevant / Konkurs</div>
                    <div className="text-xs text-slate-600">Tar bort och blockerar företaget från framtida sökningar.</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-sm hover:border-[#D40511] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="deleteReason"
                    value="already_processed"
                    checked={deleteReason === 'already_processed'}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900">Redan bearbetad (manuell)</div>
                    <div className="text-xs text-slate-600">Lägger till i "nedladdad historik" utan att ladda ned fil.</div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={confirmDelete}
                  disabled={!deleteReason}
                  className="flex-1 bg-[#D40511] text-white px-4 py-3 rounded-sm font-bold uppercase hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ta bort
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteReason('');
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 px-4 py-3 rounded-sm font-bold uppercase hover:bg-slate-300 transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadTable;
