import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, TrendingUp, Target, Award, ChevronDown, ChevronRight } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  role_in_team?: string;
  avatar_url?: string;
  stats: {
    total_leads: number;
    active_leads: number;
    converted_leads: number;
    conversion_rate: number;
    total_value: number;
  };
}

interface TeamHierarchyProps {
  managerId: string;
  managerName: string;
}

export const TeamHierarchy: React.FC<TeamHierarchyProps> = ({ managerId, managerName }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, [managerId]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/managers/${managerId}/team`);
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna teammedlem?')) return;

    try {
      await fetch(`/api/managers/${managerId}/team/${memberId}`, {
        method: 'DELETE'
      });
      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const totalStats = teamMembers.reduce((acc, member) => ({
    total_leads: acc.total_leads + member.stats.total_leads,
    active_leads: acc.active_leads + member.stats.active_leads,
    converted_leads: acc.converted_leads + member.stats.converted_leads,
    total_value: acc.total_value + member.stats.total_value
  }), { total_leads: 0, active_leads: 0, converted_leads: 0, total_value: 0 });

  const avgConversionRate = teamMembers.length > 0
    ? teamMembers.reduce((sum, m) => sum + m.stats.conversion_rate, 0) / teamMembers.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-dhl-red to-red-700 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold uppercase mb-2">Mitt Team</h2>
            <p className="text-white text-opacity-90">
              Manager: <span className="font-semibold">{managerName}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold">{teamMembers.length}</p>
            <p className="text-sm uppercase tracking-wide">Teammedlemmar</p>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-semibold text-blue-700">Totalt Leads</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">{totalStats.total_leads}</p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm font-semibold text-green-700">Aktiva Leads</p>
          </div>
          <p className="text-3xl font-bold text-green-900">{totalStats.active_leads}</p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-gray-700" />
            <p className="text-sm font-semibold text-black">Konverterade</p>
          </div>
          <p className="text-3xl font-bold text-black">{totalStats.converted_leads}</p>
          <p className="text-xs text-gray-700 mt-1">{avgConversionRate.toFixed(1)}% avg</p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-dhl-yellow p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-700">Totalt Värde</p>
          </div>
          <p className="text-3xl font-bold text-yellow-900">
            {(totalStats.total_value / 1000).toFixed(0)}K
          </p>
        </div>
      </div>

      {/* Add Member Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition font-semibold uppercase flex items-center gap-2 shadow-md"
        >
          <UserPlus className="w-5 h-5" />
          Lägg till Teammedlem
        </button>
      </div>

      {/* Add Member Form */}
      {showAddMember && (
        <div className="bg-white border-2 border-primary p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-primary mb-4">Lägg till Teammedlem</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Välj Säljare
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                <option value="">-- Välj säljare --</option>
                {/* TODO: Populate from API */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Roll i Team (valfritt)
              </label>
              <input
                type="text"
                placeholder="t.ex. Team Lead, Senior, Junior"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition font-semibold uppercase"
              >
                Lägg till
              </button>
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold uppercase"
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Members List */}
      <div className="space-y-3">
        {teamMembers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold">Inga teammedlemmar än</p>
            <p className="text-gray-400 text-sm mt-2">Lägg till säljare för att se deras leads och statistik</p>
          </div>
        ) : (
          teamMembers.map(member => (
            <div
              key={member.id}
              className="bg-white border-l-4 border-dhl-yellow p-5 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-2xl">
                    {member.full_name.split(' ').map(n => n[0]).join('')}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{member.full_name}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase">
                        {member.role}
                      </span>
                      {member.role_in_team && (
                        <span className="px-3 py-1 bg-[#FFC400] text-black rounded-full text-xs font-semibold">
                          {member.role_in_team}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.email}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Totalt</p>
                        <p className="text-2xl font-bold text-gray-900">{member.stats.total_leads}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Aktiva</p>
                        <p className="text-2xl font-bold text-green-600">{member.stats.active_leads}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Konverterade</p>
                        <p className="text-2xl font-bold text-gray-700">{member.stats.converted_leads}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Conv. Rate</p>
                        <p className="text-2xl font-bold text-blue-600">{member.stats.conversion_rate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                    className="p-2 hover:bg-gray-100 rounded transition"
                  >
                    {expandedMember === member.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="p-2 hover:bg-red-100 rounded transition"
                    title="Ta bort från team"
                  >
                    <UserMinus className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedMember === member.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <button className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition text-sm font-semibold uppercase">
                      Se Alla Leads
                    </button>
                    <button className="flex-1 bg-secondary text-black px-4 py-2 rounded hover:bg-opacity-90 transition text-sm font-semibold uppercase">
                      Statistik
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamHierarchy;
