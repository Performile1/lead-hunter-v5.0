import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

interface ErrorReport {
  id: string;
  entity_type: 'lead' | 'customer';
  entity_id: string;
  entity_name: string;
  error_type: string;
  description: string;
  suggested_correction?: string;
  current_data?: any;
  status: 'pending' | 'approved' | 'rejected' | 'corrected';
  reported_by: string;
  reporter_name: string;
  tenant_name: string;
  created_at: string;
}

export const ErrorReportReview: React.FC = () => {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  const [correctionData, setCorrectionData] = useState('');

  useEffect(() => {
    loadReports();
  }, [filter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('eurekai_token');
      const params = filter !== 'all' ? `?status=${filter}` : '';
      
      const response = await fetch(`${API_BASE_URL}/admin/error-reports${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load reports');
      
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/admin/error-reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      loadReports();
    } catch (err) {
      alert('Kunde inte uppdatera status');
    }
  };

  const handleCorrection = async (reportId: string) => {
    if (!correctionData) {
      alert('Ange korrigeringsdata');
      return;
    }

    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/admin/error-reports/${reportId}/correct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correction_data: correctionData })
      });

      if (!response.ok) throw new Error('Failed to apply correction');
      
      alert('Korrigering applicerad!');
      setSelectedReport(null);
      setCorrectionData('');
      loadReports();
    } catch (err) {
      alert('Kunde inte applicera korrigering');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      corrected: 'bg-blue-100 text-blue-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getErrorTypeName = (type: string) => {
    const types: Record<string, string> = {
      incorrect_data: 'Felaktig data',
      hallucination: 'AI Hallucination',
      outdated: 'Utdaterad',
      missing_data: 'Saknad data',
      duplicate: 'Duplikat',
      other: 'Annat'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFC400]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-black uppercase tracking-wide flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
          Felrapporter
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Granska och hantera felrapporter från användare
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded font-semibold text-sm uppercase ${
              filter === f
                ? 'bg-[#FFC400] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {f === 'all' ? 'Alla' : f === 'pending' ? 'Väntande' : f === 'approved' ? 'Godkända' : 'Avvisade'}
            {f === 'pending' && reports.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs">
                {reports.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Inga felrapporter att visa</p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white border-2 border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-black text-black">{report.entity_name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-[#FFC400] text-black">
                      {getErrorTypeName(report.error_type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Rapporterad av <strong>{report.reporter_name}</strong> ({report.tenant_name}) • {new Date(report.created_at).toLocaleDateString('sv-SE')}
                  </p>
                </div>

                {report.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(report.id, 'approved')}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Godkänn"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(report.id, 'rejected')}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Avvisa"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="p-2 text-[#FFC400] hover:bg-yellow-50 rounded"
                      title="Korrigera"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Beskrivning</p>
                  <p className="text-sm text-gray-900">{report.description}</p>
                </div>

                {report.suggested_correction && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Föreslagen rättelse</p>
                    <p className="text-sm text-gray-900">{report.suggested_correction}</p>
                  </div>
                )}
              </div>

              {report.current_data && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Nuvarande data</p>
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {JSON.stringify(report.current_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Correction Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-black">Korrigera Data</h2>
              <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-100 rounded">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {selectedReport.entity_type === 'lead' ? 'Lead' : 'Kund'}: <span className="text-[#FFC400]">{selectedReport.entity_name}</span>
              </p>
              <p className="text-sm text-gray-600">{selectedReport.description}</p>
              {selectedReport.suggested_correction && (
                <p className="text-sm text-green-700 mt-2">
                  <strong>Föreslagen rättelse:</strong> {selectedReport.suggested_correction}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Korrigeringsdata (JSON format)
                </label>
                <textarea
                  value={correctionData}
                  onChange={(e) => setCorrectionData(e.target.value)}
                  rows={10}
                  placeholder='{"field": "new_value"}'
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleCorrection(selectedReport.id)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#FFC400] hover:bg-black text-white px-4 py-2 rounded font-semibold"
              >
                <Edit2 className="w-4 h-4" />
                Applicera Korrigering
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
