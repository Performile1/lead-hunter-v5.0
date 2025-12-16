import React, { useState, useEffect } from 'react';
import { Building, MapPin, Phone, Mail, Globe, Hash, User, Calendar, Edit2, Save, X, AlertTriangle, Package, TrendingUp, Clock, FileText, Plus, Trash2 } from 'lucide-react';

interface DecisionMaker {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

interface Note {
  id?: string;
  note_type: string;
  subject: string;
  content: string;
  created_at: string;
  author_name?: string;
}

interface Customer {
  id: string;
  company_name: string;
  org_number: string;
  address?: string;
  phone?: string;
  email?: string;
  website_url?: string;
  segment: string;
  customer_status: string;
  customer_since?: string;
  account_manager_name?: string;
  revenue_tkr?: number;
  employees?: number;
  decision_makers?: DecisionMaker[];
  notes?: Note[];
  last_contact?: string;
  monitor_checkout: boolean;
  checkout_position?: string;
  uses_dhl: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomerCardProps {
  customerId: string;
  onClose: () => void;
  onUpdate?: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customerId, onClose, onUpdate }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Customer | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ note_type: 'general', subject: '', content: '' });

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
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
      setEditData(data.customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      alert('Kunde inte hämta kunddata');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editData) return;

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`,
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) throw new Error('Failed to update customer');

      const updatedCustomer = await response.json();
      setCustomer(updatedCustomer);
      setIsEditing(false);
      
      if (onUpdate) onUpdate(updatedCustomer);
      
      alert('✅ Kund uppdaterad!');
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('❌ Kunde inte uppdatera kund');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      alert('Anteckning kan inte vara tom');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('eurekai_token')}`,
        },
        body: JSON.stringify(newNote),
      });

      if (!response.ok) throw new Error('Failed to add note');

      setNewNote({ note_type: 'general', subject: '', content: '' });
      setShowAddNote(false);
      fetchCustomer(); // Refresh to get new note
      
      alert('✅ Anteckning tillagd!');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('❌ Kunde inte lägga till anteckning');
    }
  };

  const handleCancel = () => {
    setEditData(customer);
    setIsEditing(false);
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'ecommerce': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'retail': return 'bg-green-100 text-green-800 border-green-300';
      case 'wholesale': return 'bg-[#FFC400] text-black border-yellow-300';
      case 'manufacturing': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'logistics': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'churned': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"></div>
          <p className="text-slate-600">Laddar kunddata...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">Kunde inte hitta kund</p>
          </div>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-200 rounded-sm">
            Tillbaka
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5]/10 to-white p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Card */}
        <div className="bg-white rounded-sm shadow-lg border-t-4 mb-6">
          <div className="p-6">
            
            {/* Title Row */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Building className="w-8 h-8 text-black" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData?.company_name || ''}
                      onChange={(e) => setEditData(prev => prev ? {...prev, company_name: e.target.value} : null)}
                      className="text-2xl font-bold text-slate-800 border-b-2 focus:outline-none flex-1"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-slate-800">{customer.company_name}</h1>
                  )}
                </div>
                
                {/* Org Number */}
                <div className="flex items-center gap-2 text-slate-600 mb-3">
                  <Hash className="w-4 h-4" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData?.org_number || ''}
                      onChange={(e) => setEditData(prev => prev ? {...prev, org_number: e.target.value} : null)}
                      className="border-b border-slate-300 focus:outline-none focus:"
                      placeholder="XXXXXX-XXXX"
                    />
                  ) : (
                    <span className="font-mono">{customer.org_number || 'Saknas'}</span>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase border ${getSegmentColor(customer.segment)}`}>
                    {customer.segment}
                  </span>
                  <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase border ${getStatusColor(customer.customer_status)}`}>
                    {customer.customer_status}
                  </span>
                  {customer.uses_dhl && (
                    <span className="px-3 py-1 rounded-sm text-xs font-bold uppercase border bg-black text-black">
                      Använder DHL
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="p-2 text-slate-500 hover:text-red-600 bg-[#FFC400] border border-slate-300 hover:bg-red-50 rounded-sm"
                      title="Avbryt"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-sm font-bold"
                      title="Spara ändringar"
                    >
                      <Save className="w-4 h-4" />
                      Spara
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-sm font-bold"
                    >
                      Tillbaka
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-black hover:bg-black hover:text-white rounded-sm font-bold"
                    >
                      <Edit2 className="w-4 h-4" />
                      Redigera
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-1" />
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Adress</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData?.address || ''}
                      onChange={(e) => setEditData(prev => prev ? {...prev, address: e.target.value} : null)}
                      className="w-full border-b border-slate-300 focus:outline-none focus:"
                      placeholder="Gatuadress, Postnummer Ort"
                    />
                  ) : (
                    <div className="text-slate-700">{customer.address || 'Ej angiven'}</div>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-1" />
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Telefon</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData?.phone || ''}
                      onChange={(e) => setEditData(prev => prev ? {...prev, phone: e.target.value} : null)}
                      className="w-full border-b border-slate-300 focus:outline-none focus:"
                      placeholder="08-123 456 78"
                    />
                  ) : (
                    <div className="text-slate-700">{customer.phone || 'Ej angiven'}</div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-1" />
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">E-post</div>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editData?.email || ''}
                      onChange={(e) => setEditData(prev => prev ? {...prev, email: e.target.value} : null)}
                      className="w-full border-b border-slate-300 focus:outline-none focus:"
                      placeholder="info@foretag.se"
                    />
                  ) : (
                    <div className="text-slate-700">{customer.email || 'Ej angiven'}</div>
                  )}
                </div>
              </div>

              {/* Website */}
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-slate-400 mt-1" />
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Webbplats</div>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editData?.website_url || ''}
                      onChange={(e) => setEditData(prev => prev ? {...prev, website_url: e.target.value} : null)}
                      className="w-full border-b border-slate-300 focus:outline-none focus:"
                      placeholder="https://www.foretag.se"
                    />
                  ) : (
                    <a href={customer.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {customer.website_url || 'Ej angiven'}
                    </a>
                  )}
                </div>
              </div>

              {/* Account Manager */}
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 mt-1" />
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Account Manager</div>
                  <div className="text-slate-700">{customer.account_manager_name || 'Ej tilldelad'}</div>
                </div>
              </div>

              {/* Customer Since */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-1" />
                <div className="flex-1">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Kund sedan</div>
                  <div className="text-slate-700">
                    {customer.customer_since ? new Date(customer.customer_since).toLocaleDateString('sv-SE') : 'Ej angiven'}
                  </div>
                </div>
              </div>

              {/* Last Contact */}
              {customer.last_contact && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Senast kontakt</div>
                    <div className="text-slate-700">
                      {new Date(customer.last_contact).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue */}
              {customer.revenue_tkr && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-slate-400 mt-1" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Omsättning</div>
                    <div className="text-slate-700 font-bold">
                      {(customer.revenue_tkr / 1000).toFixed(1)} MSEK
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decision Makers Section */}
        {customer.decision_makers && customer.decision_makers.length > 0 && (
          <div className="bg-white rounded-sm shadow-lg border-t-4 mb-6 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-black" />
              Beslutsfattare
            </h2>
            <div className="space-y-3">
              {customer.decision_makers.map((dm, index) => (
                <div key={index} className="border-l-4 pl-4 py-2">
                  <div className="font-bold text-slate-800">{dm.name}</div>
                  <div className="text-sm text-slate-600">{dm.title}</div>
                  {dm.email && <div className="text-sm text-blue-600">{dm.email}</div>}
                  {dm.phone && <div className="text-sm text-slate-600">{dm.phone}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="bg-white rounded-sm shadow-lg border-t-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-black" />
              Anteckningar
            </h2>
            <button
              onClick={() => setShowAddNote(!showAddNote)}
              className="flex items-center gap-2 px-3 py-1.5 bg-black hover:bg-[#FFC400] hover:text-black text-white rounded-sm text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              Ny anteckning
            </button>
          </div>

          {/* Add Note Form */}
          {showAddNote && (
            <div className="mb-4 p-4 bg-slate-50 rounded-sm border border-slate-200">
              <div className="mb-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Typ</label>
                <select
                  value={newNote.note_type}
                  onChange={(e) => setNewNote(prev => ({...prev, note_type: e.target.value}))}
                  className="w-full border border-slate-300 rounded-sm px-3 py-2 focus:outline-none focus:"
                >
                  <option value="general">Allmänt</option>
                  <option value="meeting">Möte</option>
                  <option value="call">Samtal</option>
                  <option value="email">E-post</option>
                  <option value="issue">Problem</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Ämne</label>
                <input
                  type="text"
                  value={newNote.subject}
                  onChange={(e) => setNewNote(prev => ({...prev, subject: e.target.value}))}
                  className="w-full border border-slate-300 rounded-sm px-3 py-2 focus:outline-none focus:"
                  placeholder="T.ex. Uppföljningsmöte"
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Anteckning</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({...prev, content: e.target.value}))}
                  className="w-full border border-slate-300 rounded-sm px-3 py-2 focus:outline-none focus:h-24"
                  placeholder="Skriv din anteckning här..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-sm font-bold"
                >
                  Spara anteckning
                </button>
                <button
                  onClick={() => {
                    setShowAddNote(false);
                    setNewNote({ note_type: 'general', subject: '', content: '' });
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-sm font-bold"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          {customer.notes && customer.notes.length > 0 ? (
            <div className="space-y-3">
              {customer.notes.map((note, index) => (
                <div key={note.id || index} className="border-l-4 pl-4 py-3 bg-slate-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="inline-block px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-sm uppercase mr-2">
                        {note.note_type}
                      </span>
                      {note.subject && <span className="font-bold text-slate-800">{note.subject}</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(note.created_at).toLocaleDateString('sv-SE')}
                      {note.author_name && ` • ${note.author_name}`}
                    </div>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Inga anteckningar ännu</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
