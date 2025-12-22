# Tenant-baserad Lead-lagring & Shared Leads

## Status: ✅ REDAN IMPLEMENTERAT

Systemet har redan fullt stöd för tenant-baserad lead-lagring och shared leads via databas-migrationer.

---

## 📊 Databas-schema

### 1. **Tenants** (`tenants` tabell)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  checkout_search_term VARCHAR(255),
  main_competitor VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'basic',
  max_leads_per_month INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  ...
);
```

**Funktioner:**
- Varje tenant (företag) har sitt eget ID
- Konfigurerbara limits (max_leads_per_month)
- Checkout-tracking per tenant
- Subscription tiers (basic, professional, enterprise)

---

### 2. **Leads** (tenant-isolerade)
```sql
ALTER TABLE leads 
ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
```

**Funktioner:**
- Varje lead tillhör en specifik tenant
- Automatisk CASCADE delete när tenant tas bort
- Index för snabb filtrering: `idx_leads_tenant`

**Query exempel:**
```sql
-- Hämta alla leads för en tenant
SELECT * FROM leads WHERE tenant_id = 'tenant-uuid';

-- Räkna leads per tenant
SELECT tenant_id, COUNT(*) FROM leads GROUP BY tenant_id;
```

---

### 3. **Shared Lead Access** (`shared_lead_access` tabell)
```sql
CREATE TABLE shared_lead_access (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id),
  accessed_by_tenant_id UUID NOT NULL REFERENCES tenants(id),
  accessed_by_user_id UUID REFERENCES users(id),
  access_type VARCHAR(50) DEFAULT 'view',
  access_count INTEGER DEFAULT 1,
  first_accessed_at TIMESTAMP,
  last_accessed_at TIMESTAMP,
  UNIQUE(lead_id, accessed_by_tenant_id)
);
```

**Funktioner:**
- Spåra vilka tenants som har åtkomst till shared leads
- Access types: `view`, `export`, `contact`, `claim`
- Räkna antal åtkomster per tenant
- Timestamps för första och senaste åtkomst

**Funktion för att logga åtkomst:**
```sql
SELECT log_shared_lead_access(
  'lead-id'::UUID,
  'tenant-id'::UUID,
  'user-id'::UUID,
  'view'
);
```

---

### 4. **Popular Shared Leads View**
```sql
CREATE VIEW popular_shared_leads AS
SELECT 
  l.id,
  l.company_name,
  l.segment,
  COUNT(DISTINCT sla.accessed_by_tenant_id) as tenant_views,
  SUM(sla.access_count) as total_views,
  MAX(sla.last_accessed_at) as last_viewed_at
FROM leads l
INNER JOIN shared_lead_access sla ON sla.lead_id = l.id
GROUP BY l.id, l.company_name, l.segment
ORDER BY total_views DESC;
```

**Användning:**
```sql
-- Hitta mest populära shared leads
SELECT * FROM popular_shared_leads LIMIT 10;
```

---

## 🔧 Backend API (behöver implementeras)

### Endpoints som behövs:

#### **1. Tenant Leads**
```javascript
// GET /api/leads?tenant_id=xxx
// Hämta alla leads för en tenant
router.get('/leads', authenticateTenant, async (req, res) => {
  const { tenant_id } = req.user;
  const leads = await db.query(
    'SELECT * FROM leads WHERE tenant_id = $1',
    [tenant_id]
  );
  res.json(leads.rows);
});

// POST /api/leads
// Skapa nytt lead för tenant
router.post('/leads', authenticateTenant, async (req, res) => {
  const { tenant_id } = req.user;
  const lead = await db.query(
    'INSERT INTO leads (tenant_id, company_name, ...) VALUES ($1, $2, ...) RETURNING *',
    [tenant_id, req.body.company_name, ...]
  );
  res.json(lead.rows[0]);
});
```

#### **2. Shared Leads**
```javascript
// POST /api/shared-leads/:lead_id/access
// Logga åtkomst till shared lead
router.post('/shared-leads/:lead_id/access', authenticateTenant, async (req, res) => {
  const { lead_id } = req.params;
  const { tenant_id, user_id } = req.user;
  const { access_type } = req.body;
  
  await db.query(
    'SELECT log_shared_lead_access($1, $2, $3, $4)',
    [lead_id, tenant_id, user_id, access_type]
  );
  
  res.json({ success: true });
});

// GET /api/shared-leads/popular
// Hämta populära shared leads
router.get('/shared-leads/popular', authenticateTenant, async (req, res) => {
  const popular = await db.query('SELECT * FROM popular_shared_leads LIMIT 20');
  res.json(popular.rows);
});
```

---

## 🎨 Frontend Integration (behöver implementeras)

### 1. **Lead Creation med Tenant ID**
```typescript
// I App.tsx eller LeadService
const createLead = async (leadData: LeadData) => {
  const { user } = useAuth();
  
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user.token}`
    },
    body: JSON.stringify({
      ...leadData,
      tenant_id: user.tenant_id // Automatiskt från inloggad användare
    })
  });
  
  return response.json();
};
```

### 2. **Shared Leads Dashboard**
```typescript
// Ny komponent: SharedLeadsDashboard.tsx
export const SharedLeadsDashboard: React.FC = () => {
  const [sharedLeads, setSharedLeads] = useState<LeadData[]>([]);
  const [popularLeads, setPopularLeads] = useState<any[]>([]);
  
  useEffect(() => {
    // Hämta shared leads
    fetch('/api/shared-leads')
      .then(res => res.json())
      .then(setSharedLeads);
    
    // Hämta populära shared leads
    fetch('/api/shared-leads/popular')
      .then(res => res.json())
      .then(setPopularLeads);
  }, []);
  
  const handleAccessLead = async (leadId: string, accessType: string) => {
    await fetch(`/api/shared-leads/${leadId}/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_type: accessType })
    });
  };
  
  return (
    <div>
      <h2>Shared Leads</h2>
      {sharedLeads.map(lead => (
        <LeadCard 
          key={lead.id} 
          data={lead}
          onView={() => handleAccessLead(lead.id, 'view')}
          onExport={() => handleAccessLead(lead.id, 'export')}
        />
      ))}
    </div>
  );
};
```

---

## 📋 Implementationssteg

### ✅ Redan klart:
1. Databas-schema för tenants
2. Databas-schema för tenant_id i leads
3. Databas-schema för shared_lead_access
4. SQL-funktioner för att logga åtkomst
5. Views för populära shared leads

### ⏳ Behöver implementeras:
1. **Backend API endpoints:**
   - `GET /api/leads?tenant_id=xxx`
   - `POST /api/leads` (med tenant_id)
   - `POST /api/shared-leads/:id/access`
   - `GET /api/shared-leads/popular`

2. **Frontend komponenter:**
   - Uppdatera lead-skapande för att inkludera tenant_id
   - Skapa SharedLeadsDashboard komponent
   - Lägg till shared leads-vy i navigation

3. **Authentication middleware:**
   - `authenticateTenant` middleware för att verifiera tenant_id
   - Säkerställ att användare endast ser sina egna leads

---

## 🔒 Säkerhet

### Row-Level Security (RLS) - Rekommenderat
```sql
-- Aktivera RLS på leads-tabellen
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Användare ser endast sina egna tenant's leads
CREATE POLICY tenant_isolation_policy ON leads
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy: Super admins ser allt
CREATE POLICY super_admin_policy ON leads
  FOR ALL
  TO super_admin_role
  USING (true);
```

---

## 📊 Användningsexempel

### Scenario 1: DHL skapar ett lead
```javascript
// Användare från DHL (tenant_id = 'dhl-uuid') skapar lead
POST /api/leads
{
  "company_name": "Mockberg AB",
  "org_number": "556789-1234",
  // tenant_id sätts automatiskt från user.tenant_id
}

// Resultat i databas:
leads {
  id: 'lead-uuid',
  company_name: 'Mockberg AB',
  tenant_id: 'dhl-uuid',  // ✅ Automatiskt satt
  ...
}
```

### Scenario 2: PostNord får åtkomst till shared lead
```javascript
// PostNord-användare (tenant_id = 'postnord-uuid') öppnar shared lead
POST /api/shared-leads/lead-uuid/access
{
  "access_type": "view"
}

// Resultat i databas:
shared_lead_access {
  lead_id: 'lead-uuid',
  accessed_by_tenant_id: 'postnord-uuid',
  access_type: 'view',
  access_count: 1,
  first_accessed_at: '2025-12-22 23:00:00'
}
```

### Scenario 3: Visa populära shared leads
```javascript
// Hämta mest populära shared leads
GET /api/shared-leads/popular

// Resultat:
[
  {
    "company_name": "Mockberg AB",
    "tenant_views": 5,      // 5 olika tenants har sett detta lead
    "total_views": 23,      // Totalt 23 visningar
    "last_viewed_at": "2025-12-22 22:45:00"
  }
]
```

---

## 🎯 Sammanfattning

**Status:** Databas-schema är 100% klart och redo att användas.

**Nästa steg:**
1. Implementera backend API endpoints
2. Uppdatera frontend för att använda tenant_id
3. Skapa SharedLeadsDashboard komponent
4. Testa med flera tenants (DHL, PostNord, etc.)

**Fördelar:**
- ✅ Full tenant-isolering
- ✅ Shared leads-funktionalitet
- ✅ Spårning av åtkomst
- ✅ Populära leads-statistik
- ✅ Skalbart för många tenants
