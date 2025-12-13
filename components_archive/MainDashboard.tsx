import React, { useState, useEffect } from 'react';
import { TopBar } from './TopBar';
import { EnhancedSearchPanel } from './EnhancedSearchPanel';
import { LeadTable } from './LeadTable';
import { ImprovedLeadCard } from './ImprovedLeadCard';
import { apiClient } from '../services/apiClient';

interface MainDashboardProps {
  currentUser?: {
    name: string;
    role: 'admin' | 'terminal_chef' | 'manager' | 'salesperson';
  };
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  currentUser = { name: 'Anna Andersson', role: 'salesperson' }
}) => {
  const [selectedProtocol, setSelectedProtocol] = useState('Djupanalys');
  const [selectedLLM, setSelectedLLM] = useState('GPT-4');
  const [isSearching, setIsSearching] = useState(false);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [apiUsage, setApiUsage] = useState({ used: 127, limit: 1000 });

  const handleSearch = async (params: any) => {
    setIsSearching(true);
    
    try {
      const result = await apiClient.performSearch(params);
      
      if (result.error) {
        console.error('Search error:', result.error);
        return;
      }
      
      if (result.data) {
        setAllLeads(result.data.leads || []);
        setSelectedLead(null);
        
        // Update API usage
        const usageResult = await apiClient.getApiUsage();
        if (usageResult.data) {
          setApiUsage({
            used: usageResult.data.used,
            limit: usageResult.data.limit
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = async (leadId: string) => {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    if (lead.status === 'analyzed') {
      // Open existing analysis
      setSelectedLead(lead);
    } else {
      // Start new analysis
      setIsSearching(true);
      try {
        const result = await apiClient.analyzeLead(leadId);
        
        if (result.error) {
          console.error('Analysis error:', result.error);
          return;
        }
        
        if (result.data) {
          // Update lead in list
          setAllLeads(prev => prev.map(l => l.id === leadId ? result.data!.lead : l));
          setSelectedLead(result.data.lead);
          
          // Update API usage
          const usageResult = await apiClient.getApiUsage();
          if (usageResult.data) {
            setApiUsage({
              used: usageResult.data.used,
              limit: usageResult.data.limit
            });
          }
        }
      } catch (error) {
        console.error('Analysis error:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleDownload = async (leadId: string) => {
    try {
      await apiClient.downloadLead(leadId);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleReport = async (leadId: string) => {
    try {
      const result = await apiClient.reportLead(leadId, 'hallucination', 'Reported from UI');
      if (result.error) {
        console.error('Report error:', result.error);
      }
    } catch (error) {
      console.error('Report error:', error);
    }
  };

  const handleDelete = async (leadIds: string[], reason: string) => {
    try {
      const result = await apiClient.deleteLeads(leadIds, reason);
      
      if (result.error) {
        console.error('Delete error:', result.error);
        return;
      }
      
      // Remove from list
      setAllLeads(prev => prev.filter(l => !leadIds.includes(l.id)));
      
      // Close lead card if it was deleted
      if (selectedLead && leadIds.includes(selectedLead.id)) {
        setSelectedLead(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleRefresh = async () => {
    if (!selectedLead) return;
    
    setIsSearching(true);
    try {
      const result = await apiClient.refreshLead(selectedLead.id);
      
      if (result.error) {
        console.error('Refresh error:', result.error);
        return;
      }
      
      if (result.data) {
        // Update in list
        setAllLeads(prev => prev.map(l => l.id === result.data!.lead.id ? result.data!.lead : l));
        setSelectedLead(result.data.lead);
        
        // Update API usage
        const usageResult = await apiClient.getApiUsage();
        if (usageResult.data) {
          setApiUsage({
            used: usageResult.data.used,
            limit: usageResult.data.limit
          });
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReportLead = () => {
    if (!selectedLead) return;
    handleReport(selectedLead.id);
  };

  const handleEdit = () => {
    if (!selectedLead) return;
    // TODO: Open edit modal
    console.log('Edit lead:', selectedLead.id);
  };

  const handleLogout = () => {
    // TODO: Implement logout
    console.log('Logout');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Bar */}
      <TopBar
        currentUser={currentUser}
        selectedProtocol={selectedProtocol}
        selectedLLM={selectedLLM}
        onProtocolChange={setSelectedProtocol}
        onLLMChange={setSelectedLLM}
        onRefresh={() => {
          if (selectedLead) {
            handleRefresh();
          }
        }}
        onLogout={handleLogout}
        notifications={3}
      />

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          
          {/* Left: Search Panel (Sticky) */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <EnhancedSearchPanel
              onSearch={handleSearch}
              isLoading={isSearching}
              userRole={currentUser.role}
              apiUsage={apiUsage}
            />
          </div>

          {/* Right: Content Area */}
          <div className="space-y-6">
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
                  onReport={handleReportLead}
                  onEdit={handleEdit}
                />
              </div>
            )}

            {/* Lead Table */}
            {allLeads.length > 0 && (
              <LeadTable
                leads={allLeads}
                onAnalyze={handleAnalyze}
                onDownload={handleDownload}
                onReport={handleReport}
                onDelete={handleDelete}
                userRole={currentUser.role}
              />
            )}

            {/* Welcome Screen (No leads yet) */}
            {!isSearching && allLeads.length === 0 && (
              <div className="bg-white border-2 border-slate-300 rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-slate-700 mb-2">
                  Välkommen till DHL Lead Hunter
                </h2>
                <p className="text-slate-500 mb-6">
                  Använd sökpanelen till vänster för att hitta nya leads
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
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

            {/* Loading State */}
            {isSearching && allLeads.length === 0 && (
              <div className="bg-white border-2 border-[#D40511] rounded-lg shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D40511] border-t-transparent mx-auto mb-4"></div>
                <p className="text-xl font-bold text-slate-700">Söker efter leads...</p>
                <p className="text-sm text-slate-500 mt-2">Detta kan ta några sekunder</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;
