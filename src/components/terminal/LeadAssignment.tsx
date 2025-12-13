import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MapPin, Hash, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface Salesperson {
  id: string;
  full_name: string;
  email: string;
  role: string;
  postal_codes: Array<{ postal_code: string; city: string }>;
  assigned_leads_count: number;
}

interface Lead {
  id: string;
  company_name: string;
  org_number: string;
  postal_code: string;
  city: string;
  segment: string;
  revenue_tkr: number;
  assigned_salesperson_id?: string;
}

export const LeadAssignment: React.FC = () => {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const [salesResponse, leadsResponse] = await Promise.all([
        fetch('/api/assignments/salespeople', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/assignments/unassigned-leads', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const salesData = await salesResponse.json();
      const leadsData = await leadsResponse.json();

      setSalespeople(salesData.salespeople || []);
      setUnassignedLeads(leadsData.leads || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedSalesperson || selectedLeads.size === 0) {
      alert('Välj säljare och minst en lead');
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/assignments/bulk-assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lead_ids: Array.from(selectedLeads),
          salesperson_id: selectedSalesperson
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ ${result.assigned} leads tilldelade!`);
        setSelectedLeads(new Set());
        setSelectedSalesperson('');
        loadData();
      } else {
        alert(`❌ Fel: ${result.error}`);
      }
    } catch (error) {
      console.error('Assignment error:', error);
      alert('Nätverksfel vid tilldelning');
    } finally {
      setAssigning(false);
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
  };

  const selectAllLeads = () => {
    if (selectedLeads.size === unassignedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(unassignedLeads.map(l => l.id)));
    }
  };

  const getSalespersonForPostalCode = (postalCode: string) => {
    const prefix = postalCode?.substring(0, 3);
    return salespeople.filter(sp => 
      sp.postal_codes.some(pc => pc.postal_code === prefix)
    );
  };

  if (loading) {
    return <div className="p-8 text-center">Laddar...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="w-6 h-6" />
          Tilldela Leads till Säljare
        </h2>
        <p className="text-gray-600 mt-1">
          Tilldela otilldelade leads till säljare baserat på deras postnummer
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Säljare */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Säljare ({salespeople.length})
            </h3>

            <div className="space-y-3">
              {salespeople.map((sp) => (
                <div
                  key={sp.id}
                  onClick={() => setSelectedSalesperson(sp.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition ${
                    selectedSalesperson === sp.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{sp.full_name}</div>
                      <div className="text-xs text-gray-500">{sp.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                          {sp.role.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {selectedSalesperson === sp.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      Postnummer ({sp.postal_codes.length}):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sp.postal_codes.slice(0, 5).map((pc, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {pc.postal_code}
                        </span>
                      ))}
                      {sp.postal_codes.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{sp.postal_codes.length - 5} fler
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    📊 {sp.assigned_leads_count} tilldelade leads
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Otilldelade Leads */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Otilldelade Leads ({unassignedLeads.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllLeads}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedLeads.size === unassignedLeads.length ? 'Avmarkera alla' : 'Markera alla'}
                </button>
                <button
                  onClick={handleAssign}
                  disabled={selectedLeads.size === 0 || !selectedSalesperson || assigning}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  {assigning ? 'Tilldelar...' : `Tilldela (${selectedLeads.size})`}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLeads.size === unassignedLeads.length && unassignedLeads.length > 0}
                        onChange={selectAllLeads}
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Företag</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Postnummer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Segment</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Omsättning</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Matchande Säljare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unassignedLeads.map((lead) => {
                    const matchingSalespeople = getSalespersonForPostalCode(lead.postal_code);
                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-gray-50 ${
                          selectedLeads.has(lead.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => toggleLeadSelection(lead.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{lead.company_name}</div>
                          <div className="text-xs text-gray-500">{lead.org_number}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                            {lead.postal_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{lead.city}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {lead.segment}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{lead.revenue_tkr} TKR</td>
                        <td className="px-4 py-3">
                          {matchingSalespeople.length > 0 ? (
                            <div className="text-xs">
                              {matchingSalespeople.map((sp, idx) => (
                                <div key={idx} className="text-green-600">
                                  ✓ {sp.full_name}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-red-600">
                              ⚠️ Ingen matchande säljare
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {unassignedLeads.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>Alla leads är tilldelade!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
