import React, { useState } from 'react';
import { MapPin, Users, Save, Plus, Trash2, Edit2, Building2 } from 'lucide-react';

interface Territory {
  id: string;
  name: string;
  regions: string[];
  postalCodes: string[];
  cities: string[];
}

interface UserAssignment {
  userId: string;
  userName: string;
  role: 'Säljare' | 'Manager' | 'Terminalchef';
  territories: string[];
  segment: 'DM' | 'TS' | 'FS' | 'KAM' | 'Alla';
}

export const SalesTerritoryManager: React.FC = () => {
  const [territories, setTerritories] = useState<Territory[]>([
    {
      id: '1',
      name: 'Stockholm Nord',
      regions: ['Stockholm', 'Uppsala'],
      postalCodes: ['100-199'],
      cities: ['Stockholm', 'Solna', 'Sundbyberg', 'Uppsala']
    },
    {
      id: '2',
      name: 'Stockholm Syd',
      regions: ['Stockholm', 'Södertälje'],
      postalCodes: ['120-149'],
      cities: ['Huddinge', 'Södertälje', 'Haninge']
    },
    {
      id: '3',
      name: 'Västra Sverige',
      regions: ['Västra Götaland'],
      postalCodes: ['400-499'],
      cities: ['Göteborg', 'Borås', 'Trollhättan']
    },
    {
      id: '4',
      name: 'Södra Sverige',
      regions: ['Skåne'],
      postalCodes: ['200-299'],
      cities: ['Malmö', 'Lund', 'Helsingborg']
    }
  ]);

  const [assignments, setAssignments] = useState<UserAssignment[]>([
    {
      userId: '1',
      userName: 'Anna Andersson',
      role: 'Säljare',
      territories: ['1'],
      segment: 'TS'
    },
    {
      userId: '2',
      userName: 'Per Persson',
      role: 'Säljare',
      territories: ['2'],
      segment: 'FS'
    },
    {
      userId: '3',
      userName: 'Lisa Larsson',
      role: 'Manager',
      territories: ['1', '2'],
      segment: 'Alla'
    },
    {
      userId: '4',
      userName: 'Erik Eriksson',
      role: 'Terminalchef',
      territories: ['1', '2', '3', '4'],
      segment: 'Alla'
    }
  ]);

  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [showTerritoryForm, setShowTerritoryForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  const handleSaveTerritory = (territory: Territory) => {
    if (editingTerritory) {
      setTerritories(territories.map(t => t.id === territory.id ? territory : t));
    } else {
      setTerritories([...territories, { ...territory, id: Date.now().toString() }]);
    }
    setShowTerritoryForm(false);
    setEditingTerritory(null);
  };

  const handleDeleteTerritory = (id: string) => {
    if (confirm('Är du säker på att du vill ta bort detta område?')) {
      setTerritories(territories.filter(t => t.id !== id));
      // Remove from assignments
      setAssignments(assignments.map(a => ({
        ...a,
        territories: a.territories.filter(t => t !== id)
      })));
    }
  };

  const handleSaveAssignment = (assignment: UserAssignment) => {
    const existing = assignments.find(a => a.userId === assignment.userId);
    if (existing) {
      setAssignments(assignments.map(a => a.userId === assignment.userId ? assignment : a));
    } else {
      setAssignments([...assignments, assignment]);
    }
    setShowAssignmentForm(false);
  };

  const handleDeleteAssignment = (userId: string) => {
    if (confirm('Är du säker på att du vill ta bort denna tilldelning?')) {
      setAssignments(assignments.filter(a => a.userId !== userId));
    }
  };

  const getTerritoryName = (id: string) => {
    return territories.find(t => t.id === id)?.name || 'Okänt område';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Säljare': return 'bg-green-100 text-green-800 border-green-300';
      case 'Manager': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Terminalchef': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'DM': return 'bg-gray-100 text-gray-800';
      case 'TS': return 'bg-green-100 text-green-800';
      case 'FS': return 'bg-blue-100 text-blue-800';
      case 'KAM': return 'bg-purple-100 text-purple-800';
      case 'Alla': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-wide flex items-center gap-3">
            <MapPin className="w-7 h-7 text-[#FFC400]" />
            Områdesindelning & Tilldelning
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Hantera geografiska områden och tilldela säljare, managers och terminalchefer
          </p>
        </div>
      </div>

      {/* Territories Section */}
      <div className="bg-white rounded-none p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-black uppercase flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#FFC400]" />
            Geografiska Områden
          </h3>
          <button
            onClick={() => {
              setEditingTerritory(null);
              setShowTerritoryForm(true);
            }}
            className="flex items-center gap-2 bg-[#FFC400] hover:bg-black hover:text-white text-black px-3 py-2 rounded font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Nytt Område
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {territories.map(territory => (
            <div key={territory.id} className="border-2 border-gray-200 p-4 rounded hover:border-[#FFC400] transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-black text-black uppercase">{territory.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {territory.regions.join(', ')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingTerritory(territory);
                      setShowTerritoryForm(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteTerritory(territory.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-bold text-gray-700">Postnummer:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {territory.postalCodes.map((code, idx) => (
                      <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-gray-700">Städer:</span>
                  <p className="text-gray-600 mt-1">{territory.cities.join(', ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Assignments Section */}
      <div className="bg-white rounded-none p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-black uppercase flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FFC400]" />
            Användartilldelningar
          </h3>
          <button
            onClick={() => setShowAssignmentForm(true)}
            className="flex items-center gap-2 bg-[#FFC400] hover:bg-black hover:text-white text-black px-3 py-2 rounded font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Ny Tilldelning
          </button>
        </div>

        <div className="space-y-3">
          {assignments.map(assignment => (
            <div key={assignment.userId} className="border-2 border-gray-200 p-4 rounded hover:border-[#FFC400] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-black text-black">{assignment.userName}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border-2 ${getRoleColor(assignment.role)}`}>
                      {assignment.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getSegmentColor(assignment.segment)}`}>
                      {assignment.segment}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {assignment.territories.map(territoryId => (
                      <span key={territoryId} className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs font-semibold border border-blue-200">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {getTerritoryName(territoryId)}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteAssignment(assignment.userId)}
                  className="p-1 hover:bg-red-100 rounded ml-2"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Territory Form Modal */}
      {showTerritoryForm && (
        <TerritoryForm
          territory={editingTerritory}
          onSave={handleSaveTerritory}
          onCancel={() => {
            setShowTerritoryForm(false);
            setEditingTerritory(null);
          }}
        />
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <AssignmentForm
          territories={territories}
          onSave={handleSaveAssignment}
          onCancel={() => setShowAssignmentForm(false)}
        />
      )}

      {/* Summary */}
      <div className="bg-[#FFC400] text-black rounded-none p-6">
        <h3 className="text-lg font-black uppercase mb-4">Sammanfattning</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-50 p-3 rounded">
            <p className="text-xs font-bold uppercase mb-1">Områden</p>
            <p className="text-2xl font-black">{territories.length}</p>
          </div>
          <div className="bg-white bg-opacity-50 p-3 rounded">
            <p className="text-xs font-bold uppercase mb-1">Säljare</p>
            <p className="text-2xl font-black">{assignments.filter(a => a.role === 'Säljare').length}</p>
          </div>
          <div className="bg-white bg-opacity-50 p-3 rounded">
            <p className="text-xs font-bold uppercase mb-1">Managers</p>
            <p className="text-2xl font-black">{assignments.filter(a => a.role === 'Manager').length}</p>
          </div>
          <div className="bg-white bg-opacity-50 p-3 rounded">
            <p className="text-xs font-bold uppercase mb-1">Terminalchefer</p>
            <p className="text-2xl font-black">{assignments.filter(a => a.role === 'Terminalchef').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Territory Form Component
const TerritoryForm: React.FC<{
  territory: Territory | null;
  onSave: (territory: Territory) => void;
  onCancel: () => void;
}> = ({ territory, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Territory>(
    territory || {
      id: '',
      name: '',
      regions: [],
      postalCodes: [],
      cities: []
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-none p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black text-black uppercase mb-4">
          {territory ? 'Redigera Område' : 'Nytt Område'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Områdesnamn</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Regioner (kommaseparerade)</label>
            <input
              type="text"
              value={formData.regions.join(', ')}
              onChange={(e) => setFormData({ ...formData, regions: e.target.value.split(',').map(s => s.trim()) })}
              placeholder="Stockholm, Uppsala"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Postnummer (kommaseparerade)</label>
            <input
              type="text"
              value={formData.postalCodes.join(', ')}
              onChange={(e) => setFormData({ ...formData, postalCodes: e.target.value.split(',').map(s => s.trim()) })}
              placeholder="100-199, 200-299"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Städer (kommaseparerade)</label>
            <input
              type="text"
              value={formData.cities.join(', ')}
              onChange={(e) => setFormData({ ...formData, cities: e.target.value.split(',').map(s => s.trim()) })}
              placeholder="Stockholm, Solna, Sundbyberg"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-[#FFC400] hover:bg-black hover:text-white text-black px-4 py-2 rounded font-bold"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Spara
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded font-bold"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assignment Form Component
const AssignmentForm: React.FC<{
  territories: Territory[];
  onSave: (assignment: UserAssignment) => void;
  onCancel: () => void;
}> = ({ territories, onSave, onCancel }) => {
  const [formData, setFormData] = useState<UserAssignment>({
    userId: Date.now().toString(),
    userName: '',
    role: 'Säljare',
    territories: [],
    segment: 'Alla'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleTerritory = (territoryId: string) => {
    if (formData.territories.includes(territoryId)) {
      setFormData({
        ...formData,
        territories: formData.territories.filter(t => t !== territoryId)
      });
    } else {
      setFormData({
        ...formData,
        territories: [...formData.territories, territoryId]
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-none p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black text-black uppercase mb-4">Ny Användartilldelning</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Användarnamn</label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Roll</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            >
              <option value="Säljare">Säljare</option>
              <option value="Manager">Manager</option>
              <option value="Terminalchef">Terminalchef</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 uppercase">Segment</label>
            <select
              value={formData.segment}
              onChange={(e) => setFormData({ ...formData, segment: e.target.value as any })}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#FFC400] focus:border-transparent"
            >
              <option value="Alla">Alla</option>
              <option value="DM">DM</option>
              <option value="TS">TS</option>
              <option value="FS">FS</option>
              <option value="KAM">KAM</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">Områden</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border-2 border-gray-200 rounded p-3">
              {territories.map(territory => (
                <label key={territory.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.territories.includes(territory.id)}
                    onChange={() => toggleTerritory(territory.id)}
                    className="w-4 h-4 text-[#FFC400] focus:ring-[#FFC400]"
                  />
                  <span className="font-semibold">{territory.name}</span>
                  <span className="text-xs text-gray-500">({territory.regions.join(', ')})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-[#FFC400] hover:bg-black hover:text-white text-black px-4 py-2 rounded font-bold"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Spara
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded font-bold"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
