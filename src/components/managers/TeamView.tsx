import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Package, Award, Calendar } from 'lucide-react';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  assigned_leads_count: number;
  total_revenue_tkr: number;
  last_login?: string;
}

interface TeamStats {
  total_members: number;
  total_leads: number;
  total_revenue_tkr: number;
  avg_leads_per_member: number;
}

export const TeamView: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Hämta team members
      const teamResponse = await fetch('/api/managers/my-team', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const teamData = await teamResponse.json();
      setTeam(teamData.team || []);

      // Hämta stats
      const statsResponse = await fetch('/api/managers/team-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData.stats);

    } catch (error) {
      console.error('Failed to load team:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 text-center shadow-md">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Laddar team...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-l-4 border-primary p-6 shadow-md">
        <h2 className="text-2xl font-bold text-primary uppercase flex items-center gap-2">
          <Users className="w-6 h-6" />
          Mitt Team
        </h2>
        <p className="text-gray-600 mt-1">Översikt över ditt säljteam och deras prestanda</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border-l-4 border-dhl-blue p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-dhl-blue" />
              <div>
                <p className="text-sm text-gray-600">Teammedlemmar</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_members}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-l-4 border-dhl-yellow p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Totalt Leads</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_leads}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-l-4 border-dhl-green p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Omsättning</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(stats.total_revenue_tkr / 1000).toFixed(0)}M
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-l-4 border-yellow-500 p-6 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-8 h-8 text-gray-700" />
              <div>
                <p className="text-sm text-gray-600">Snitt Leads/Person</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.avg_leads_per_member.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white border-l-4 border-primary p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase">Teammedlemmar</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-4 py-3 text-left uppercase font-bold text-sm">Namn</th>
                <th className="px-4 py-3 text-left uppercase font-bold text-sm">Roll</th>
                <th className="px-4 py-3 text-left uppercase font-bold text-sm">Email</th>
                <th className="px-4 py-3 text-right uppercase font-bold text-sm">Leads</th>
                <th className="px-4 py-3 text-right uppercase font-bold text-sm">Omsättning</th>
                <th className="px-4 py-3 text-left uppercase font-bold text-sm">Senast Inloggad</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member, index) => (
                <tr key={member.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {member.full_name.charAt(0)}
                      </div>
                      <span className="font-semibold">{member.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold uppercase">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">
                      {member.assigned_leads_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {(member.total_revenue_tkr / 1000).toFixed(1)}M
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {member.last_login ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(member.last_login).toLocaleDateString('sv-SE')}
                      </div>
                    ) : (
                      <span className="text-gray-400">Aldrig</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {team.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Inga teammedlemmar ännu</p>
          </div>
        )}
      </div>
    </div>
  );
};
