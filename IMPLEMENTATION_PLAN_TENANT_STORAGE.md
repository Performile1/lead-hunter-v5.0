# Implementation Plan: Tenant Lead Storage & Auto-Refresh

## Mål
1. Spara alla leads och kunder per tenant automatiskt
2. Ladda sparade leads/kunder direkt vid öppning
3. Sök i shared pool innan nya API-anrop
4. Auto-refresh av gamla analyser (6 månader default, konfigurerbart)

---

## Databas-ändringar

### 1. Lägg till last_analyzed_at i leads-tabellen
```sql
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS analysis_version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_leads_last_analyzed ON leads(last_analyzed_at);
CREATE INDEX IF NOT EXISTS idx_leads_shared ON leads(is_shared);
```

### 2. Lägg till system_settings för refresh-intervall
```sql
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('lead_refresh_interval_months', '6', 'Antal månader innan lead-analys uppdateras automatiskt'),
  ('auto_refresh_enabled', 'true', 'Aktivera automatisk refresh av gamla analyser')
ON CONFLICT (setting_key) DO NOTHING;
```

---

## Backend API Endpoints

### 1. Lead Storage API (`server/routes/leads.js`)

#### POST /api/leads/save
- Spara lead med tenant_id
- Sätt last_analyzed_at till NOW()
- Returnera saved lead

#### GET /api/leads/tenant/:tenant_id
- Hämta alla leads för en tenant
- Sortera på created_at DESC
- Inkludera shared leads (is_shared = true)

#### GET /api/leads/search
- Sök först i tenant's egna leads
- Sök sedan i shared pool
- Om inte hittat, returnera null (frontend gör API-anrop)

#### POST /api/leads/check-refresh
- Ta emot company_name eller org_number
- Kolla om lead finns och om last_analyzed_at > refresh_interval
- Returnera { needsRefresh: boolean, existingLead: Lead | null }

### 2. Shared Pool API (`server/routes/shared-leads.js`)

#### GET /api/shared-leads
- Hämta alla leads där is_shared = true
- Filtrera bort leads som redan tillhör tenant

#### POST /api/shared-leads/:lead_id/claim
- Kopiera lead till tenant
- Logga i shared_lead_access

### 3. System Settings API (`server/routes/system-settings.js`)

#### GET /api/system-settings
- Hämta alla system settings (SuperAdmin only)

#### PUT /api/system-settings/:key
- Uppdatera setting (SuperAdmin only)

---

## Frontend Implementation

### 1. Lead Service (`services/leadService.ts`)

```typescript
export const saveLead = async (leadData: LeadData, tenantId: string) => {
  const response = await fetch('/api/leads/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...leadData, tenant_id: tenantId })
  });
  return response.json();
};

export const getTenantLeads = async (tenantId: string) => {
  const response = await fetch(`/api/leads/tenant/${tenantId}`);
  return response.json();
};

export const searchLeadBeforeAPI = async (companyName: string, tenantId: string) => {
  const response = await fetch('/api/leads/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_name: companyName, tenant_id: tenantId })
  });
  return response.json();
};

export const checkLeadRefresh = async (companyName: string) => {
  const response = await fetch('/api/leads/check-refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_name: companyName })
  });
  return response.json();
};
```

### 2. App.tsx - Auto-save efter analys

```typescript
const handleDeepDive = async (companyName: string) => {
  // 1. Kolla om lead finns och behöver refresh
  const { needsRefresh, existingLead } = await checkLeadRefresh(companyName);
  
  if (existingLead && !needsRefresh) {
    // Använd befintlig analys
    setDeepDiveLead(existingLead);
    return;
  }
  
  // 2. Kör ny analys
  const newLead = await generateDeepDiveSequential(companyName, ...);
  
  // 3. Spara automatiskt
  await saveLead(newLead, user.tenant_id);
  
  setDeepDiveLead(newLead);
};
```

### 3. Leads Dashboard - Ladda sparade leads

```typescript
const LeadsDashboard = () => {
  const [leads, setLeads] = useState<LeadData[]>([]);
  
  useEffect(() => {
    const loadLeads = async () => {
      const tenantLeads = await getTenantLeads(user.tenant_id);
      setLeads(tenantLeads);
    };
    loadLeads();
  }, [user.tenant_id]);
  
  return (
    <div>
      <h2>Sparade Leads</h2>
      {leads.map(lead => <LeadCard key={lead.id} data={lead} />)}
    </div>
  );
};
```

### 4. SuperAdmin Settings - Refresh Interval

```typescript
const SystemSettings = () => {
  const [refreshInterval, setRefreshInterval] = useState(6);
  
  const updateSetting = async () => {
    await fetch('/api/system-settings/lead_refresh_interval_months', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: refreshInterval })
    });
  };
  
  return (
    <div>
      <label>Lead Refresh Interval (månader)</label>
      <input 
        type="number" 
        value={refreshInterval}
        onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
      />
      <button onClick={updateSetting}>Spara</button>
    </div>
  );
};
```

---

## Implementation Order

1. ✅ Databas-migrationer (leads columns + system_settings)
2. ✅ Backend API endpoints (leads, shared-leads, system-settings)
3. ✅ Frontend lead service
4. ✅ Auto-save efter analys
5. ✅ Ladda sparade leads i dashboard
6. ✅ Sök i shared pool innan API
7. ✅ SuperAdmin settings för refresh interval
8. ✅ Testa hela flödet

---

## Flödesdiagram

```
User söker efter företag
    ↓
Sök i tenant's egna leads
    ↓
Finns? → Ja → Behöver refresh?
              ↓ Nej          ↓ Ja
         Visa cached    Kör ny analys
              ↓              ↓
              └──────────────┘
                     ↓
              Spara/uppdatera lead
                     ↓
                Visa resultat
```

---

## Säkerhet

- Tenant isolation: Användare ser endast sina egna leads + shared pool
- Row-Level Security (RLS) på leads-tabellen
- SuperAdmin-only för system settings
- Validering av tenant_id i alla API-anrop

---

## Performance

- Index på tenant_id, last_analyzed_at, is_shared
- Caching av tenant leads i frontend
- Lazy loading av lead-detaljer
- Pagination för stora lead-listor
