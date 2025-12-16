import React, { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';

interface ErrorReportButtonProps {
  entityType: 'lead' | 'customer';
  entityId: string;
  entityName: string;
  currentData?: any;
}

export const ErrorReportButton: React.FC<ErrorReportButtonProps> = ({
  entityType,
  entityId,
  entityName,
  currentData
}) => {
  const [showModal, setShowModal] = useState(false);
  const [reportData, setReportData] = useState({
    error_type: 'incorrect_data',
    description: '',
    suggested_correction: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('eurekai_token');
      
      const response = await fetch(`${API_BASE_URL}/error-reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          error_type: reportData.error_type,
          description: reportData.description,
          suggested_correction: reportData.suggested_correction,
          current_data: currentData
        })
      });

      if (!response.ok) throw new Error('Failed to submit report');
      
      alert('Felrapport skickad! Super Admin kommer granska den.');
      setShowModal(false);
      setReportData({ error_type: 'incorrect_data', description: '', suggested_correction: '' });
    } catch (err) {
      alert('Kunde inte skicka felrapport');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 text-orange-600 hover:text-orange-800 text-xs font-semibold"
        title="Rapportera fel i data"
      >
        <AlertTriangle className="w-3 h-3" />
        Rapportera fel
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-black">Rapportera Fel</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm font-semibold text-gray-700">
                {entityType === 'lead' ? 'Lead' : 'Kund'}: <span className="text-[#FFC400]">{entityName}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Typ av fel</label>
                <select
                  value={reportData.error_type}
                  onChange={(e) => setReportData({ ...reportData, error_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
                >
                  <option value="incorrect_data">Felaktig data</option>
                  <option value="hallucination">AI Hallucination</option>
                  <option value="outdated">Utdaterad information</option>
                  <option value="missing_data">Saknad data</option>
                  <option value="duplicate">Duplikat</option>
                  <option value="other">Annat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Beskrivning av felet *</label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  rows={4}
                  placeholder="Beskriv vad som är fel..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Föreslagen rättelse (valfritt)</label>
                <textarea
                  value={reportData.suggested_correction}
                  onChange={(e) => setReportData({ ...reportData, suggested_correction: e.target.value })}
                  rows={3}
                  placeholder="Om du vet rätt information, ange den här..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting || !reportData.description}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Skickar...' : 'Skicka Rapport'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
