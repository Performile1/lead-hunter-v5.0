import React, { useState } from 'react';
import { Tag, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

interface Lead {
  id: string;
  company_name: string;
  segment: string;
  assigned_salesperson_id?: string;
}

interface SegmentChangerProps {
  lead: Lead;
  onSegmentChanged: () => void;
}

const SEGMENTS = {
  DM: {
    name: 'Direct Marketing',
    description: 'Fraktomsättning: 0-250k kr/år (~0-5 MSEK bolag)',
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  },
  TS: {
    name: 'Telesales',
    description: 'Fraktomsättning: 250k-750k kr/år (~5-15 MSEK bolag)',
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  FS: {
    name: 'Field Sales',
    description: 'Fraktomsättning: 750k-5M kr/år (~15-100 MSEK bolag)',
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  KAM: {
    name: 'Key Account Manager',
    description: 'Fraktomsättning: 5M+ kr/år (~100+ MSEK bolag)',
    color: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  UNKNOWN: {
    name: 'Oklassificerad',
    description: 'Behöver klassificeras',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }
};

export const SegmentChanger: React.FC<SegmentChangerProps> = ({ lead, onSegmentChanged }) => {
  const [selectedSegment, setSelectedSegment] = useState(lead.segment);
  const [reason, setReason] = useState('');
  const [changing, setChanging] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleChangeSegment = async () => {
    if (selectedSegment === lead.segment) {
      alert('Välj ett annat segment');
      return;
    }

    setChanging(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/lead-management/change-segment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lead_id: lead.id,
          new_segment: selectedSegment,
          reason
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Segment ändrat från ${data.old_segment} till ${data.new_segment}`);
        setShowForm(false);
        onSegmentChanged();
      } else {
        const error = await response.json();
        alert(`❌ Fel: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to change segment:', error);
      alert('Nätverksfel vid segment-ändring');
    } finally {
      setChanging(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
      >
        <Tag className="w-4 h-4" />
        <span className="text-sm">Ändra Segment</span>
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Ändra Segment
        </h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-600">Nuvarande:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${SEGMENTS[lead.segment as keyof typeof SEGMENTS]?.color || SEGMENTS.UNKNOWN.color}`}>
            {lead.segment}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {lead.company_name}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <label className="text-sm font-medium text-gray-700">Välj nytt segment:</label>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(SEGMENTS).map(([key, segment]) => (
            <div
              key={key}
              onClick={() => setSelectedSegment(key)}
              className={`
                p-3 border-2 rounded-lg cursor-pointer transition
                ${selectedSegment === key
                  ? `${segment.color} border-opacity-100 shadow-md`
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{key} - {segment.name}</div>
                  <div className="text-xs text-gray-600">{segment.description}</div>
                </div>
                {selectedSegment === key && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Anledning (valfritt):
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="T.ex. 'Kunden är större än förväntat, passar bättre för KAM'"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          rows={2}
        />
      </div>

      {selectedSegment !== lead.segment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <ArrowRight className="w-4 h-4 text-blue-600" />
            <span className="font-medium">
              {lead.segment} → {selectedSegment}
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {SEGMENTS[selectedSegment as keyof typeof SEGMENTS]?.description}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleChangeSegment}
          disabled={changing || selectedSegment === lead.segment}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {changing ? (
            <>Ändrar...</>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Ändra Segment
            </>
          )}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Avbryt
        </button>
      </div>

      {lead.assigned_salesperson_id && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <div className="flex items-start gap-2 text-xs text-yellow-800">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              OBS: Leadet är tilldelat en säljare. Överväg om säljaren fortfarande är rätt person efter segment-ändring.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
