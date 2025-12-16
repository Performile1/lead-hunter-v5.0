import React, { useState, useEffect } from 'react';
import { Eye, Play, Trash2, Clock, Calendar, Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface Watch {
  id: string;
  lead_id: string;
  company_name: string;
  org_number?: string;
  segment: string;
  interval_days: number;
  next_check_date: string;
  last_check_date?: string;
  notification_email: string;
  auto_reanalyze: boolean;
  check_count: number;
  is_active: boolean;
}

interface WatchListProps {
  userId?: string;
}

export const WatchList: React.FC<WatchListProps> = ({ userId }) => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    loadWatches();
  }, []);

  const loadWatches = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/monitoring/my-watches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setWatches(data.watches || []);
    } catch (error) {
      console.error('Failed to load watches:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeWatch = async (watchId: string) => {
    setExecuting(watchId);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/monitoring/${watchId}/execute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Bevakning körd!\n\nFöretag: ${data.company_name}\nÄndringar: ${JSON.stringify(data.changes, null, 2)}`);
        loadWatches();
      } else {
        alert('❌ Kunde inte köra bevakning');
      }
    } catch (error) {
      console.error('Failed to execute watch:', error);
      alert('❌ Nätverksfel');
    } finally {
      setExecuting(null);
    }
  };

  const deleteWatch = async (watchId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna bevakning?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/monitoring/${watchId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Bevakning borttagen');
        loadWatches();
      } else {
        alert('❌ Kunde inte ta bort bevakning');
      }
    } catch (error) {
      console.error('Failed to delete watch:', error);
      alert('❌ Nätverksfel');
    }
  };

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      DM: 'bg-gray-100 text-gray-800',
      TS: 'bg-green-100 text-green-800',
      FS: 'bg-blue-100 text-blue-800',
      KAM: 'bg-purple-100 text-purple-800'
    };
    return colors[segment] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntilNext = (nextDate: string) => {
    const days = Math.ceil((new Date(nextDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Förfallen';
    if (days === 0) return 'Idag';
    if (days === 1) return 'Imorgon';
    return `Om ${days} dagar`;
  };

  if (loading) {
    return (
      <div className="bg-white border-l-4 border-primary p-12 text-center shadow-md">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Laddar bevakningar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border-l-4 border-primary p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary uppercase flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Mina Bevakningar
            </h2>
            <p className="text-gray-600 mt-1">
              Automatisk övervakning av leads med regelbundna omanalyser
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{watches.length}</p>
            <p className="text-sm text-gray-600">Aktiva bevakningar</p>
          </div>
        </div>
      </div>

      {/* Watch Cards */}
      {watches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {watches.map(watch => (
            <div
              key={watch.id}
              className="bg-white border-l-4 border-dhl-yellow p-6 shadow-md hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Company Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{watch.company_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSegmentColor(watch.segment)}`}>
                      {watch.segment}
                    </span>
                    {watch.auto_reanalyze && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        Auto-analys
                      </span>
                    )}
                  </div>

                  {watch.org_number && (
                    <p className="text-sm text-gray-600 mb-3">Org.nr: {watch.org_number}</p>
                  )}

                  {/* Watch Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-gray-600">Intervall</p>
                        <p className="font-semibold">{watch.interval_days} dagar</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-gray-600">Nästa körning</p>
                        <p className="font-semibold">{getDaysUntilNext(watch.next_check_date)}</p>
                        <p className="text-xs text-gray-500">{formatDate(watch.next_check_date)}</p>
                      </div>
                    </div>

                    {watch.last_check_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-gray-600">Senast körd</p>
                          <p className="font-semibold">{formatDate(watch.last_check_date)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-gray-600">Notifikation</p>
                        <p className="font-semibold text-xs">{watch.notification_email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    <span>Körningar: {watch.check_count}</span>
                    <span>•</span>
                    <span>Status: {watch.is_active ? 'Aktiv' : 'Inaktiv'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => executeWatch(watch.id)}
                    disabled={executing === watch.id}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition disabled:bg-gray-300 text-sm font-semibold uppercase"
                  >
                    {executing === watch.id ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Kör...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Kör Nu
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => deleteWatch(watch.id)}
                    className="flex items-center gap-2 bg-white border border-red-300 text-red-600 px-4 py-2 rounded hover:bg-red-50 transition text-sm font-semibold uppercase"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ta Bort
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center shadow-md">
          <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Inga bevakningar ännu</p>
          <p className="text-gray-400 text-sm mt-2">Lägg till bevakningar för att automatiskt övervaka leads</p>
        </div>
      )}
    </div>
  );
};
