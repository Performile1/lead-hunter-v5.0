import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, TrendingUp, TrendingDown, RefreshCw, Clock, AlertTriangle, CheckCircle, Globe, Package, CreditCard, Users, FileText, Plus } from 'lucide-react';

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
}

interface Customer {
  id: string;
  company_name: string;
  org_number: string;
  address: string;
  website_url: string;
  customer_status: string;
  customer_tier: string;
  customer_since: string;
  account_manager_name: string;
  account_manager_email: string;
  annual_contract_value: number;
  monitor_checkout: boolean;
  monitor_frequency: string;
  monitor_times: string[];
  uses_dhl: boolean;
  checkout_position: string;
  carriers: string;
  ecommerce_platform: string;
  website_analysis: any;
}

interface MonitoringHistory {
  id: number;
  monitored_at: string;
  checkout_position: number;
  total_shipping_options: number;
  shipping_providers: string[];
  dhl_position: number;
  position_change: number;
  alert_triggered: boolean;
  alert_type: string;
  alert_message: string;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId, onBack }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [monitoringHistory, setMonitoringHistory] = useState<MonitoringHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'monitoring' | 'notes'>('overview');

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch customer');

      const data = await response.json();
      setCustomer(data.customer);
      setMonitoringHistory(data.monitoring_history || []);
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualScrape = async () => {
    setScraping(true);
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`,
        },
      });

      if (!response.ok) throw new Error('Scraping failed');

      await fetchCustomerDetails(); // Refresh data
      alert('Scraping slutförd!');
    } catch (error) {
      console.error('Error scraping:', error);
      alert('Scraping misslyckades');
    } finally {
      setScraping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-600">Kund hittades inte</p>
          <button onClick={onBack} className="mt-4 text-black font-bold hover:underline">
            Tillbaka till listan
          </button>
        </div>
      </div>
    );
  }

  const latestMonitoring = monitoringHistory[0];
  const previousMonitoring = monitoringHistory[1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-black hover:text-[#a0040d] font-bold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Tillbaka till kundlistan
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-t-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-black" />
                <h1 className="text-3xl font-black text-black uppercase">{customer.company_name}</h1>
                {customer.customer_tier && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                    customer.customer_tier === 'platinum' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                    customer.customer_tier === 'gold' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                    customer.customer_tier === 'silver' ? 'bg-gray-100 text-gray-800 border-gray-300' :
                    'bg-orange-100 text-orange-800 border-orange-300'
                  }`}>
                    {customer.customer_tier}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 font-semibold">{customer.org_number}</p>
              <p className="text-sm text-gray-600">{customer.address}</p>
            </div>

            <button
              onClick={handleManualScrape}
              disabled={scraping}
              className="flex items-center gap-2 bg-black hover:bg-[#a0040d] text-white px-6 py-3 rounded-sm transition-colors font-bold uppercase tracking-wide shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${scraping ? 'animate-spin' : ''}`} />
              {scraping ? 'Scrapar...' : 'Scrapa nu'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-bold uppercase mb-1">Account Manager</p>
              <p className="text-lg font-black text-blue-900">{customer.account_manager_name || 'Ej tilldelad'}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-bold uppercase mb-1">Kund sedan</p>
              <p className="text-lg font-black text-green-900">
                {customer.customer_since ? new Date(customer.customer_since).toLocaleDateString('sv-SE') : 'N/A'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-600 font-bold uppercase mb-1">Årligt värde</p>
              <p className="text-lg font-black text-yellow-900">
                {customer.annual_contract_value ? `${(customer.annual_contract_value / 1000).toFixed(0)}k SEK` : 'N/A'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 font-bold uppercase mb-1">Status</p>
              <p className="text-lg font-black text-purple-900 capitalize">{customer.customer_status}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: 'Översikt', icon: Building2 },
              { id: 'monitoring', label: 'Övervakning', icon: TrendingUp },
              { id: 'notes', label: 'Anteckningar', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-bold uppercase tracking-wide transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-4 text-black'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Checkout Position */}
                <div className="bg-gradient-to-br from-[#4F46E5]/20 to-white p-6 rounded-lg ">
                  <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                    <Package className="w-6 h-6 text-black" />
                    Checkout-position
                  </h3>
                  {latestMonitoring ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 font-bold uppercase">DHL Position</p>
                        <p className="text-3xl font-black text-black">
                          #{latestMonitoring.dhl_position || 'N/A'}
                        </p>
                        {previousMonitoring && latestMonitoring.position_change !== 0 && (
                          <div className={`flex items-center gap-1 mt-1 ${
                            latestMonitoring.position_change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {latestMonitoring.position_change > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="text-sm font-bold">
                              {Math.abs(latestMonitoring.position_change)} positioner
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-bold uppercase">Totalt alternativ</p>
                        <p className="text-3xl font-black text-black">{latestMonitoring.total_shipping_options}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-bold uppercase">Senast scrapad</p>
                        <p className="text-sm font-semibold text-black">
                          {new Date(latestMonitoring.monitored_at).toLocaleString('sv-SE')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Ingen scraping-data tillgänglig ännu</p>
                  )}
                </div>

                {/* Website Analysis */}
                {customer.website_analysis && (
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                    <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                      <Globe className="w-6 h-6 text-black" />
                      Webbplats-analys
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">E-handelsplattform</p>
                        <p className="text-sm font-semibold text-black">
                          {customer.website_analysis.ecommerce_platform || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Checkout</p>
                        <p className="text-sm font-semibold text-black">
                          {customer.website_analysis.has_checkout ? 'Ja' : 'Nej'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Internationell frakt</p>
                        <p className="text-sm font-semibold text-black">
                          {customer.website_analysis.international_shipping ? 'Ja' : 'Nej'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Teknologier</p>
                        <p className="text-sm font-semibold text-black">
                          {customer.website_analysis.technologies?.join(', ') || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Monitoring Settings */}
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                  <h3 className="text-xl font-black text-black uppercase mb-4 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-black" />
                    Övervakningsinställningar
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Övervakning aktiv</p>
                      <p className={`text-sm font-bold ${customer.monitor_checkout ? 'text-green-600' : 'text-red-600'}`}>
                        {customer.monitor_checkout ? 'Ja' : 'Nej'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Frekvens</p>
                      <p className="text-sm font-semibold text-black capitalize">{customer.monitor_frequency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Tider</p>
                      <p className="text-sm font-semibold text-black">
                        {customer.monitor_times?.join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div className="space-y-4">
                <h3 className="text-xl font-black text-black uppercase mb-4">Övervakningshistorik</h3>
                {monitoringHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Ingen historik tillgänglig ännu</p>
                ) : (
                  <div className="space-y-3">
                    {monitoringHistory.map((record) => (
                      <div
                        key={record.id}
                        className={`p-4 rounded-lg border-2 ${
                          record.alert_triggered
                            ? 'bg-red-50 border-red-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-sm font-bold text-gray-600">
                                {new Date(record.monitored_at).toLocaleString('sv-SE')}
                              </p>
                              {record.alert_triggered && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold uppercase rounded-full border border-red-300">
                                  Alert: {record.alert_type}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 font-bold">DHL Position:</span>
                                <span className="ml-2 font-black text-black">#{record.dhl_position || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-bold">Totalt:</span>
                                <span className="ml-2 font-semibold">{record.total_shipping_options}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-bold">Förändring:</span>
                                <span className={`ml-2 font-bold ${
                                  record.position_change > 0 ? 'text-green-600' :
                                  record.position_change < 0 ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  {record.position_change > 0 ? '+' : ''}{record.position_change || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-bold">Leverantörer:</span>
                                <span className="ml-2 font-semibold">{record.shipping_providers?.join(', ')}</span>
                              </div>
                            </div>
                            {record.alert_message && (
                              <p className="mt-2 text-sm text-red-700 font-semibold">{record.alert_message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-black uppercase">Anteckningar</h3>
                  <button className="flex items-center gap-2 bg-black hover:bg-[#a0040d] text-white px-4 py-2 rounded-sm transition-colors font-bold text-sm uppercase">
                    <Plus className="w-4 h-4" />
                    Ny anteckning
                  </button>
                </div>
                <p className="text-gray-500 text-center py-8">Inga anteckningar ännu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
