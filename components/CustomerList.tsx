import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, Plus, TrendingDown, AlertTriangle, CheckCircle, Clock, Eye, RefreshCw, ArrowLeft } from 'lucide-react';
import { CustomerCard } from './CustomerCard';

interface Customer {
  id: string;
  company_name: string;
  org_number: string;
  customer_status: string;
  segment: string;
  account_manager_name: string;
  monitor_checkout: boolean;
  last_monitored: string;
  monitoring_count: number;
  website_url: string;
  uses_dhl: boolean;
  checkout_position: string;
  last_contact?: string;
}

interface CustomerListProps {
  onBack?: () => void;
  userRole?: 'admin' | 'manager' | 'terminalchef';
  userArea?: string;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onBack, userRole = 'terminalchef', userArea }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [monitorOnlyFilter, setMonitorOnlyFilter] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, segmentFilter, monitorOnlyFilter, searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        ...(segmentFilter !== 'all' && { segment: segmentFilter }),
        ...(monitorOnlyFilter && { monitor_only: 'true' }),
        ...(searchTerm && { search: searchTerm }),
        ...(userRole === 'terminalchef' && userArea && { area: userArea }),
      });

      const response = await fetch(`${API_BASE_URL}/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('dhl_token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          console.warn('Customer API not available yet. Showing empty list.');
          setCustomers([]);
          return;
        }
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'ecommerce': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'retail': return 'bg-green-100 text-green-800 border-green-300';
      case 'wholesale': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'manufacturing': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'logistics': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'at_risk': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'churned': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  // Show CustomerCard if customer is selected
  if (selectedCustomerId) {
    return (
      <CustomerCard
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onUpdate={(updatedCustomer) => {
          // Refresh customer list after update
          fetchCustomers();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFCC00]/10 to-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-sm shadow-lg p-6 mb-6 border-t-4 border-[#FFCC00]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-semibold text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Tillbaka
                </button>
              )}
              <Building2 className="w-8 h-8 text-[#D40511]" />
              <div>
                <h1 className="text-3xl font-black text-black uppercase tracking-wide">Kundlista</h1>
                <p className="text-sm text-gray-600 font-semibold">Befintliga DHL-kunder med checkout-övervakning</p>
              </div>
            </div>
            <button
              onClick={() => {/* TODO: Open add customer modal */}}
              className="flex items-center gap-2 bg-[#D40511] hover:bg-[#a0040d] text-white px-6 py-3 rounded-sm transition-colors font-bold uppercase tracking-wide shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Lägg till kund
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Sök företag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-sm focus:border-[#D40511] focus:ring-0 font-medium"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-sm focus:border-[#D40511] focus:ring-0 font-bold"
            >
              <option value="all">Alla status</option>
              <option value="active">Aktiva</option>
              <option value="at_risk">I riskzonen</option>
              <option value="inactive">Inaktiva</option>
              <option value="churned">Churned</option>
            </select>

            {/* Segment Filter */}
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-sm focus:border-[#D40511] focus:ring-0 font-bold"
            >
              <option value="all">Alla segment</option>
              <option value="ecommerce">E-handel</option>
              <option value="retail">Retail</option>
              <option value="wholesale">Grossist</option>
              <option value="manufacturing">Tillverkning</option>
              <option value="logistics">Logistik</option>
            </select>

            {/* Monitor Only */}
            <label className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-sm cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={monitorOnlyFilter}
                onChange={(e) => setMonitorOnlyFilter(e.target.checked)}
                className="w-4 h-4 text-[#D40511] border-gray-300 rounded focus:ring-[#D40511]"
              />
              <span className="font-bold text-sm">Endast övervakade</span>
            </label>
          </div>
        </div>

        {/* Customer List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#D40511]"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-sm shadow-lg p-12 text-center border-t-4 border-[#D40511]">
            <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-600">Inga kunder hittades</p>
            <p className="text-gray-500 mt-2">Prova att ändra dina filter eller lägg till en ny kund</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-sm shadow-md hover:shadow-xl transition-all cursor-pointer border-t-4 border-[#D40511] p-6"
                onClick={() => setSelectedCustomerId(customer.id)}
              >
                <div className="flex items-start justify-between gap-4">
                    {/* Main Content */}
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <Building2 className="w-6 h-6 text-[#D40511]" />
                        <h3 className="text-2xl font-bold text-gray-900">{customer.company_name}</h3>
                        {customer.segment && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getSegmentColor(customer.segment)}`}>
                            {customer.segment}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {getStatusIcon(customer.customer_status)}
                          <span className="text-sm font-semibold text-gray-600 capitalize">{customer.customer_status}</span>
                        </div>
                      </div>

                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <div className="bg-gray-50 p-3 rounded-sm border-t-2 border-gray-400">
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <span>Org.nr</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{customer.org_number || 'N/A'}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-sm border-t-2 border-blue-500">
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <span>Account Manager</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{customer.account_manager_name || 'Ej tilldelad'}</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-sm border-t-2 border-[#FFCC00]">
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <span>Checkout Position</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{customer.checkout_position || 'Ej scrapad'}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-sm border-t-2 border-green-500">
                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                            <span>Använder DHL</span>
                          </div>
                          <p className={`text-lg font-bold ${customer.uses_dhl ? 'text-green-600' : 'text-red-600'}`}>
                            {customer.uses_dhl ? 'Ja' : 'Nej'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Monitoring Status */}
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {customer.monitor_checkout && (
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                          <RefreshCw className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-blue-600">ÖVERVAKAS</span>
                        </div>
                      )}
                      {customer.last_monitored && (
                        <div className="text-xs text-gray-500">
                          <span className="font-bold">Senast scrapad:</span>
                          <br />
                          {new Date(customer.last_monitored).toLocaleString('sv-SE')}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        <span className="font-bold">{customer.monitoring_count}</span> scraping-historik
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(customer.id);
                        }}
                        className="flex items-center gap-2 bg-[#D40511] hover:bg-[#a0040d] text-white px-4 py-2 rounded-sm transition-colors font-bold text-sm uppercase"
                      >
                        <Eye className="w-4 h-4" />
                        Visa detaljer
                      </button>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
