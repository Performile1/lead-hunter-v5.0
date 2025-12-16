import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Building2, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '../common/DHLNotification';
import { API_BASE_URL } from '../../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'terminalchef' | 'säljare';
  terminal?: string;
}

interface LeadAssignmentProps {
  leadId: string;
  leadName: string;
  currentAssignee?: string;
  onAssign: (userId: string) => void;
}

export const LeadAssignment: React.FC<LeadAssignmentProps> = ({
  leadId,
  leadName,
  currentAssignee,
  onAssign
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(currentAssignee || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch users from API
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      const data = await response.json();
      setUsers(data.filter((u: User) => u.role === 'säljare' || u.role === 'terminalchef'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    try {
      await onAssign(selectedUser);
      const userName = users.find(u => u.id === selectedUser)?.name;
      showSuccess('Lead Tilldelat', `Lead har tilldelats till ${userName}`);
    } catch (error) {
      console.error('Failed to assign lead:', error);
      showError('Tilldelning Misslyckades', 'Kunde inte tilldela lead. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="w-5 h-5 text-black" />
        <h3 className="font-bold text-sm uppercase tracking-wide">Tilldela Lead</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Välj säljare
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:focus:ring-1 focus:ring-[#2563EB]"
          >
            <option value="">-- Välj säljare --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email}) {user.terminal ? `- ${user.terminal}` : ''}
              </option>
            ))}
          </select>
        </div>

        {currentAssignee && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs">
            <div className="flex items-center gap-1 text-blue-800">
              <CheckCircle className="w-3 h-3" />
              <span className="font-semibold">
                Nuvarande: {users.find(u => u.id === currentAssignee)?.name || 'Okänd'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleAssign}
          disabled={!selectedUser || isLoading}
          className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-[#B00410] disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold text-sm uppercase tracking-wide transition-colors"
        >
          {isLoading ? 'Tilldelar...' : 'Tilldela Lead'}
        </button>
      </div>
    </div>
  );
};
