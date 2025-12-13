import React, { useState } from 'react';
import { Eye, Mail, Clock, CheckCircle, X } from 'lucide-react';

interface WatchFormProps {
  leadId: string;
  companyName: string;
  onWatchAdded: () => void;
  onClose: () => void;
}

export const WatchForm: React.FC<WatchFormProps> = ({ leadId, companyName, onWatchAdded, onClose }) => {
  const [intervalDays, setIntervalDays] = useState(30);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [autoReanalyze, setAutoReanalyze] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Triggers
  const [triggers, setTriggers] = useState({
    revenue_increase: false,
    revenue_decrease: false,
    bankruptcy: false,
    liquidation: false,
    payment_remarks: false,
    warehouse_move: false,
    news: false,
    segment_change: false
  });
  
  const [revenueThreshold, setRevenueThreshold] = useState(10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/monitoring/watch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lead_id: leadId,
          interval_days: intervalDays,
          notification_email: notificationEmail,
          auto_reanalyze: autoReanalyze,
          triggers: triggers,
          revenue_change_threshold_percent: revenueThreshold
        })
      });

      if (response.ok) {
        alert('✅ Bevakning skapad!');
        onWatchAdded();
        onClose();
      } else {
        const error = await response.json();
        alert(`❌ Fel: ${error.error || 'Kunde inte skapa bevakning'}`);
      }
    } catch (error) {
      console.error('Failed to create watch:', error);
      alert('❌ Nätverksfel');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-dhl-red text-white p-6 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6" />
            <h2 className="text-xl font-bold uppercase">Lägg till Bevakning</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Company Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Företag</p>
            <p className="font-bold text-lg text-gray-900">{companyName}</p>
          </div>

          {/* Interval */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 uppercase">
              <Clock className="w-4 h-4 text-dhl-red" />
              Kontrollintervall
            </label>
            <select
              value={intervalDays}
              onChange={(e) => setIntervalDays(Number(e.target.value))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-dhl-red"
              required
            >
              <option value={7}>Varje vecka (7 dagar)</option>
              <option value={14}>Varannan vecka (14 dagar)</option>
              <option value={30}>Varje månad (30 dagar)</option>
              <option value={60}>Varannan månad (60 dagar)</option>
              <option value={90}>Varje kvartal (90 dagar)</option>
              <option value={180}>Varje halvår (180 dagar)</option>
              <option value={365}>Varje år (365 dagar)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hur ofta systemet ska kontrollera leadet för ändringar
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2 uppercase">
              <Mail className="w-4 h-4 text-dhl-red" />
              Email för Notifikationer
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="din.email@dhl.se"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:border-dhl-red"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Du får email när ändringar upptäcks
            </p>
          </div>

          {/* Triggers */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 uppercase">
              <Eye className="w-4 h-4 text-dhl-red" />
              Händelser att Bevaka (Triggers)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={triggers.revenue_increase}
                  onChange={(e) => setTriggers({...triggers, revenue_increase: e.target.checked})}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm">📈 Ökad Omsättning</span>
              </label>
              
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={triggers.revenue_decrease}
                  onChange={(e) => setTriggers({...triggers, revenue_decrease: e.target.checked})}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm">📉 Minskad Omsättning</span>
              </label>
              
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={triggers.bankruptcy}
                  onChange={(e) => setTriggers({...triggers, bankruptcy: e.target.checked})}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm">⚠️ Konkurs</span>
              </label>
              
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={triggers.liquidation}
                  onChange={(e) => setTriggers({...triggers, liquidation: e.target.checked})}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm">🔴 Likvidation</span>
              </label>
              
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={triggers.payment_remarks}
                  onChange={(e) => setTriggers({...triggers, payment_remarks: e.target.checked})}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm">💳 Betalningsanmärkning</span>
              </label>
              
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={triggers.warehouse_move}
                  onChange={(e) => setTriggers({...triggers, warehouse_move: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm">📦 Lagerflytt</span>
              </label>
              
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={triggers.news}
                  onChange={(e) => setTriggers({...triggers, news: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm">📰 Nyheter</span>
              </label>
              
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={triggers.segment_change}
                  onChange={(e) => setTriggers({...triggers, segment_change: e.target.checked})}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm">🔄 Segmentändring</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Välj vilka händelser som ska trigga en notifikation
            </p>
          </div>

          {/* Revenue Threshold */}
          {(triggers.revenue_increase || triggers.revenue_decrease) && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                Tröskelvärde för Omsättningsändring
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={revenueThreshold}
                  onChange={(e) => setRevenueThreshold(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="font-bold text-lg text-dhl-red w-16 text-right">{revenueThreshold}%</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Notifiera endast om omsättningen ändras med mer än {revenueThreshold}%
              </p>
            </div>
          )}

          {/* Auto Reanalyze */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoReanalyze}
                onChange={(e) => setAutoReanalyze(e.target.checked)}
                className="mt-1 w-5 h-5 text-dhl-red border-gray-300 rounded focus:ring-dhl-red"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <CheckCircle className="w-4 h-4 text-dhl-red" />
                  Automatisk Omanalys
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Kör en fullständig omanalys av leadet vid varje kontroll. Detta uppdaterar all data inklusive
                  omsättning, beslutsfattare, nyheter och Kronofogden-status.
                </p>
              </div>
            </label>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tips:</strong> Använd kortare intervall (7-14 dagar) för viktiga kunder eller kunder med
              risk. Använd längre intervall (90-365 dagar) för stabila kunder.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-dhl-red text-white px-6 py-3 rounded hover:bg-opacity-90 transition disabled:bg-gray-300 font-semibold uppercase flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Skapar...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Skapa Bevakning
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50 transition font-semibold uppercase"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
