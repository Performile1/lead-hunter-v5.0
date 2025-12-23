# Lead Storage & Auto-Refresh System - Användningsguide

## Översikt

Systemet sparar automatiskt alla leads och kunder per tenant, söker i befintliga data innan API-anrop, och uppdaterar automatiskt gamla analyser efter konfigurerbar tid (default 6 månader).

---

## Funktioner

### ✅ Automatisk Lead-lagring
- Alla leads sparas automatiskt per tenant
- Uppdateras vid ny analys
- Spårar `last_analyzed_at` och `analysis_version`

### ✅ Smart Sökning
1. Söker först i tenant's egna leads
2. Söker sedan i shared pool
3. Gör API-anrop endast om lead inte finns

### ✅ Auto-Refresh
- Leads äldre än 6 månader (konfigurerbart) uppdateras automatiskt
- SuperAdmin kan ändra refresh-intervall
- Spårar antal analyser per lead

### ✅ Shared Pool
- Leads kan delas mellan tenants
- Claim-funktionalitet för att kopiera shared leads
- Spårar åtkomst och popularitet

---

## API Endpoints

### Lead Storage

#### Spara Lead
```javascript
POST /api/lead-storage/save
Body: {
  leadData: {
    company_name: "Företag AB",
    org_number: "556123-4567",
    website: "https://example.com",
    // ... övriga fält
  }
}
```

#### Hämta Tenant's Leads
```javascript
GET /api/lead-storage/tenant?includeShared=true
```

#### Sök Lead Innan API-anrop
```javascript
POST /api/lead-storage/search
Body: {
  searchTerm: "Företag AB"  // eller companyName, orgNumber
}

Response: {
  found: true/false,
  lead: {...},
  needsRefresh: true/false,
  daysSinceAnalysis: 45,
  ownershipStatus: "owned" | "shared"
}
```

#### Kolla Refresh-status
```javascript
POST /api/lead-storage/check-refresh
Body: { leadId: "uuid" }

Response: {
  needsRefresh: true/false,
  daysSinceAnalysis: 180,
  refreshIntervalMonths: 6
}
```

#### Hämta Leads Som Behöver Refresh
```javascript
GET /api/lead-storage/needs-refresh?limit=100
```

### Shared Pool

#### Markera Lead Som Delad
```javascript
POST /api/lead-storage/mark-shared
Body: { leadId: "uuid" }
```

#### Claim Shared Lead
```javascript
POST /api/lead-storage/claim-shared
Body: { leadId: "uuid" }
```

#### Hämta Shared Pool
```javascript
GET /api/lead-storage/shared-pool
```

### System Settings (SuperAdmin)

#### Hämta Alla Settings
```javascript
GET /api/system-settings
```

#### Uppdatera Setting
```javascript
PUT /api/system-settings/lead_refresh_interval_months
Body: { value: "12" }  // Ändra till 12 månader
```

#### Hämta Specifik Setting
```javascript
GET /api/system-settings/lead_refresh_interval_months
```

---

## Frontend Integration

### 1. Auto-save Efter Analys

```typescript
// I App.tsx eller där deep dive körs
const handleDeepDive = async (companyName: string) => {
  try {
    // 1. Sök i befintliga leads först
    const searchResult = await fetch('/api/lead-storage/search', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ searchTerm: companyName })
    }).then(r => r.json());
    
    // 2. Om lead finns och inte behöver refresh, använd den
    if (searchResult.found && !searchResult.needsRefresh) {
      console.log('Using cached lead, no API calls needed!');
      setDeepDiveLead(searchResult.lead);
      return;
    }
    
    // 3. Om lead finns men behöver refresh, eller inte finns alls
    console.log(searchResult.found 
      ? 'Lead found but needs refresh, running new analysis...'
      : 'Lead not found, running new analysis...'
    );
    
    // Kör normal deep dive analys
    const newLead = await generateDeepDiveSequential(companyName, ...);
    
    // 4. Spara automatiskt
    await fetch('/api/lead-storage/save', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ leadData: newLead })
    });
    
    console.log('Lead saved successfully!');
    setDeepDiveLead(newLead);
    
  } catch (error) {
    console.error('Error in deep dive:', error);
  }
};
```

### 2. Ladda Sparade Leads i Dashboard

```typescript
// Ny komponent: SavedLeadsDashboard.tsx
import React, { useState, useEffect } from 'react';

const SavedLeadsDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadLeads();
  }, []);
  
  const loadLeads = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/lead-storage/tenant?includeShared=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      setLeads(data.leads);
      setLoading(false);
    } catch (error) {
      console.error('Error loading leads:', error);
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Sparade Leads</h2>
      
      {loading ? (
        <p>Laddar...</p>
      ) : (
        <div className="grid gap-4">
          {leads.map(lead => (
            <div key={lead.id} className="bg-white p-4 rounded shadow">
              <h3 className="font-bold">{lead.company_name}</h3>
              <p className="text-sm text-gray-600">
                Analyserad: {lead.days_since_analysis} dagar sedan
              </p>
              {lead.ownership_status === 'shared' && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Shared Pool
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedLeadsDashboard;
```

### 3. SuperAdmin Settings Panel

```typescript
// Ny komponent: LeadRefreshSettings.tsx
import React, { useState, useEffect } from 'react';

const LeadRefreshSettings = () => {
  const [refreshInterval, setRefreshInterval] = useState(6);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/system-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      const intervalSetting = data.settings.find(
        s => s.setting_key === 'lead_refresh_interval_months'
      );
      const autoRefreshSetting = data.settings.find(
        s => s.setting_key === 'auto_refresh_enabled'
      );
      
      if (intervalSetting) setRefreshInterval(parseInt(intervalSetting.setting_value));
      if (autoRefreshSetting) setAutoRefreshEnabled(autoRefreshSetting.setting_value === 'true');
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };
  
  const updateSetting = async (key, value) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/system-settings/${key}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: value.toString() })
      });
      
      alert('Inställning uppdaterad!');
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Kunde inte uppdatera inställning');
    }
  };
  
  return (
    <div className="bg-white p-6 rounded shadow">
      <h3 className="text-xl font-bold mb-4">Lead Refresh Inställningar</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">
            Refresh Intervall (månader)
          </label>
          <input
            type="number"
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="border px-3 py-2 rounded w-32"
            min="1"
            max="24"
          />
          <button
            onClick={() => updateSetting('lead_refresh_interval_months', refreshInterval)}
            className="ml-2 bg-[#FFC400] px-4 py-2 rounded font-bold"
          >
            Spara
          </button>
          <p className="text-xs text-gray-600 mt-1">
            Leads äldre än detta uppdateras automatiskt
          </p>
        </div>
        
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => {
                setAutoRefreshEnabled(e.target.checked);
                updateSetting('auto_refresh_enabled', e.target.checked);
              }}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold">Aktivera Auto-Refresh</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LeadRefreshSettings;
```

---

## Databas-schema

### Leads Tabell (uppdaterad)
```sql
leads:
  - id (UUID)
  - tenant_id (UUID) → tenants(id)
  - source_tenant_id (UUID) → tenants(id)
  - company_name (VARCHAR)
  - last_analyzed_at (TIMESTAMP) ← NYT
  - is_shared (BOOLEAN) ← NYT
  - analysis_version (INTEGER) ← NYT
  - ... övriga fält
```

### System Settings Tabell (ny)
```sql
system_settings:
  - id (UUID)
  - setting_key (VARCHAR) UNIQUE
  - setting_value (TEXT)
  - description (TEXT)
  - data_type (VARCHAR)
  - category (VARCHAR)
  - is_public (BOOLEAN)
  - updated_at (TIMESTAMP)
  - updated_by (UUID) → users(id)
```

### Lead Search Cache (ny)
```sql
lead_search_cache:
  - id (UUID)
  - tenant_id (UUID) → tenants(id)
  - search_query (VARCHAR)
  - lead_id (UUID) → leads(id)
  - search_count (INTEGER)
  - first_searched_at (TIMESTAMP)
  - last_searched_at (TIMESTAMP)
```

---

## Flödesdiagram

```
User söker efter "Företag AB"
    ↓
POST /api/lead-storage/search
    ↓
Finns i tenant's leads? ──→ NEJ ──→ Finns i shared pool?
    ↓ JA                                  ↓ NEJ
    ↓                                     ↓
Behöver refresh? ──→ NEJ ──→ Returnera cached lead
    ↓ JA                      (Inga API-anrop!)
    ↓                                     ↓
Kör ny AI-analys ←─────────────────────┘
    ↓
POST /api/lead-storage/save
    ↓
Lead sparad/uppdaterad
    ↓
Visa resultat
```

---

## Kör Migration

```bash
# Kör migration i PostgreSQL
psql -U your_user -d your_database -f server/migrations/010_lead_storage_and_refresh.sql
```

---

## Testa Systemet

### 1. Spara en lead
```bash
curl -X POST http://localhost:3001/api/lead-storage/save \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leadData": {
      "company_name": "Test AB",
      "org_number": "556123-4567",
      "website": "https://test.se"
    }
  }'
```

### 2. Sök efter lead
```bash
curl -X POST http://localhost:3001/api/lead-storage/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"searchTerm": "Test AB"}'
```

### 3. Hämta alla tenant leads
```bash
curl http://localhost:3001/api/lead-storage/tenant \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Fördelar

✅ **Minskar API-kostnader** - Använder cached data när möjligt  
✅ **Snabbare svar** - Ingen väntan på AI-analys för cached leads  
✅ **Automatisk uppdatering** - Gamla analyser uppdateras automatiskt  
✅ **Tenant-isolering** - Varje tenant ser sina egna + shared leads  
✅ **Shared pool** - Dela leads mellan tenants  
✅ **Konfigurerbart** - SuperAdmin kan ändra refresh-intervall  

---

## Nästa Steg

1. ✅ Kör databas-migration
2. ✅ Lägg till routes i server.js
3. ✅ Integrera i frontend (App.tsx)
4. ✅ Skapa SavedLeadsDashboard
5. ✅ Lägg till SuperAdmin settings panel
6. ✅ Testa hela flödet
