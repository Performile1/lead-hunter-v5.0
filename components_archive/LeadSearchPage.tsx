import React, { useState } from 'react';
import { SearchPanel } from './SearchPanel';
import { ImprovedLeadCard } from './ImprovedLeadCard';
import { LeadList } from './LeadList';

interface SearchParams {
  mode: 'single' | 'batch';
  companyName?: string;
  specificPerson?: string;
  region?: string;
  segment?: 'all' | 'KAM' | 'FS' | 'TS' | 'DM';
  triggers?: string[];
  targetCount?: number;
  focusPositionsPrio1: string[];
  focusPositionsPrio2: string[];
  focusPositionsPrio3: string[];
  iceBreakerTopic?: string;
}

export const LeadSearchPage: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [allLeads, setAllLeads] = useState<any[]>([]);

  const handleSearch = async (params: SearchParams) => {
    setIsSearching(true);
    
    try {
      // TODO: Replace with actual API call
      console.log('Searching with params:', params);
      
      if (params.mode === 'single') {
        // Single search - fetch one lead
        const response = await fetch('/api/leads/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: params.companyName,
            specificPerson: params.specificPerson,
            focusPositions: {
              prio1: params.focusPositionsPrio1,
              prio2: params.focusPositionsPrio2,
              prio3: params.focusPositionsPrio3
            },
            iceBreakerTopic: params.iceBreakerTopic
          })
        });
        
        const lead = await response.json();
        setAllLeads([lead]);
        setSelectedLead(null); // Don't auto-select, show in list first
      } else {
        // Batch search - fetch multiple leads
        const response = await fetch('/api/leads/batch-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            region: params.region,
            segment: params.segment,
            triggers: params.triggers,
            targetCount: params.targetCount,
            focusPositions: {
              prio1: params.focusPositionsPrio1,
              prio2: params.focusPositionsPrio2,
              prio3: params.focusPositionsPrio3
            },
            iceBreakerTopic: params.iceBreakerTopic
          })
        });
        
        const leads = await response.json();
        setAllLeads(leads);
        setSelectedLead(null); // Don't auto-select, show in list first
      }
    } catch (error) {
      console.error('Search error:', error);
      // TODO: Show error message to user
    } finally {
      setIsSearching(false);
    }
  };

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead);
  };

  const handleRefresh = async () => {
    if (!selectedLead) return;
    
    setIsSearching(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/leads/${selectedLead.id}/refresh`, {
        method: 'POST'
      });
      const updatedLead = await response.json();
      
      // Update in allLeads array
      setAllLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
      setSelectedLead(updatedLead);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReport = () => {
    if (!selectedLead) return;
    // TODO: Open report modal
    console.log('Report lead:', selectedLead.id);
  };

  const handleEdit = () => {
    if (!selectedLead) return;
    // TODO: Open edit modal
    console.log('Edit lead:', selectedLead.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* DHL Header */}
      <div className="bg-[#D40511] text-white py-4 px-6 shadow-lg">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#FFCC00] text-black px-4 py-2 font-black text-2xl italic">
              DHL
            </div>
            <h1 className="text-2xl font-black italic uppercase">Lead Hunter</h1>
          </div>
          <div className="text-sm">
            <span className="opacity-75">Protokoll:</span>{' '}
            <span className="font-bold">Djupanalys</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left: Search Panel (Sticky) */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <SearchPanel onSearch={handleSearch} isLoading={isSearching} />
          </div>

          {/* Right: Content Area */}
          <div className="space-y-6">
            {/* Loading State */}
            {isSearching && allLeads.length === 0 && (
              <div className="bg-white border-2 border-[#D40511] rounded-lg shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D40511] border-t-transparent mx-auto mb-4"></div>
                <p className="text-xl font-bold text-slate-700">Söker efter leads...</p>
                <p className="text-sm text-slate-500 mt-2">Detta kan ta några sekunder</p>
              </div>
            )}

            {/* Welcome Screen (No search yet) */}
            {!isSearching && allLeads.length === 0 && (
              <div className="bg-white border-2 border-slate-300 rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-slate-700 mb-2">
                  Välkommen till DHL Lead Hunter
                </h2>
                <p className="text-slate-500">
                  Använd sökpanelen till vänster för att hitta nya leads
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="font-bold text-sm text-[#D40511] mb-1">Enstaka Sökning</div>
                    <div className="text-xs text-slate-600">
                      Sök på ett specifikt företag eller org.nummer
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="font-bold text-sm text-[#D40511] mb-1">Batch Sökning</div>
                    <div className="text-xs text-slate-600">
                      Hitta flera leads baserat på kriterier
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Area */}
            {allLeads.length > 0 && (
              <>
                {/* Lead Card (when selected) */}
                {selectedLead && (
                  <div className="space-y-4">
                    {/* Close Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => setSelectedLead(null)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-sm text-xs font-bold uppercase hover:bg-slate-300 transition-colors"
                      >
                        ← Tillbaka till lista
                      </button>
                    </div>
                    
                    {/* Lead Card */}
                    <ImprovedLeadCard
                      lead={selectedLead}
                      onRefresh={handleRefresh}
                      onReport={handleReport}
                      onEdit={handleEdit}
                    />
                  </div>
                )}

                {/* Lead List (always visible, compact when lead is selected) */}
                <LeadList
                  leads={allLeads}
                  selectedLeadId={selectedLead?.id}
                  onLeadClick={handleLeadClick}
                  isCompact={!!selectedLead}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadSearchPage;
