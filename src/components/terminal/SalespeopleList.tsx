import React, { useState, useEffect } from 'react';
import { User, MapPin, Mail, Phone, Package, TrendingUp } from 'lucide-react';

interface Salesperson {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  postal_codes: string[];
  assigned_leads_count: number;
  total_revenue_tkr: number;
  status: string;
}

export const SalespeopleList: React.FC = () => {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSalespeople();
  }, []);

  const loadSalespeople = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/assignments/salespeople', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSalespeople(data.salespeople || []);
    } catch (error) {
      console.error('Failed to load salespeople:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalespeople = salespeople.filter(sp =>
    sp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sp.postal_codes.some(pc => pc.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="bg-white p-12 text-center shadow-md">
        <div className="animate-spin w-12 h-12 border-4 border-dhl-red border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Laddar säljare...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border-l-4 border-dhl-red p-6 shadow-md">
        <h2 className="text-2xl font-bold text-dhl-red uppercase mb-4">Säljare</h2>
        
        <input
          type="text"
          placeholder="Sök säljare, email, postnummer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-dhl-red"
        />
        
        <div className="mt-4 text-sm text-gray-600">
          Visar <span className="font-semibold text-dhl-red">{filteredSalespeople.length}</span> av{' '}
          <span className="font-semibold">{salespeople.length}</span> säljare
        </div>
      </div>

      {/* Salespeople Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSalespeople.map(sp => (
          <div key={sp.id} className="bg-white border-l-4 border-dhl-yellow p-6 shadow-md hover:shadow-lg transition">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-dhl-red text-white p-3 rounded-full">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{sp.full_name}</h3>
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold uppercase">
                  {sp.role}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-dhl-red" />
                <a href={`mailto:${sp.email}`} className="hover:text-dhl-blue">
                  {sp.email}
                </a>
              </div>
              {sp.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-dhl-red" />
                  <span>{sp.phone}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-dhl-red" />
                <span className="font-semibold text-sm">Postnummer:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {sp.postal_codes.slice(0, 5).map((pc, idx) => (
                  <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {pc}
                  </span>
                ))}
                {sp.postal_codes.length > 5 && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    +{sp.postal_codes.length - 5} till
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600">Leads</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{sp.assigned_leads_count}</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Omsättning</span>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {(sp.total_revenue_tkr / 1000).toFixed(0)}M
                </p>
              </div>
            </div>

            <div className="mt-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                sp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {sp.status === 'active' ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredSalespeople.length === 0 && (
        <div className="bg-white p-12 text-center shadow-md">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Inga säljare hittades</p>
        </div>
      )}
    </div>
  );
};
