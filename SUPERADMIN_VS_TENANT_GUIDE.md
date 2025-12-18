# 🎯 SuperAdmin vs Tenant - Lead Management Guide

## Översikt

Systemet har två olika sätt att hantera leads beroende på användarroll:

### **SuperAdmin** 
- Ser ALLA leads från ALLA tenants
- Ingen leadsökning (inga API-anrop)
- Endast databas-visning
- Kan filtrera och söka i befintliga leads

### **Tenant (t.ex. DHL)**
- Kan söka nya leads (API-anrop)
- Ser endast sina egna leads
- Checkout-filtrering baserat på tenant's transportör
- Option att inkludera konkurrenter

---

## 🔵 SuperAdmin - Lead Viewer

### Funktionalitet
**Vad SuperAdmin SER:**
- ✅ Alla leads från alla tenants i databasen
- ✅ Vilken tenant som sökt varje lead
- ✅ När lead skapades och av vem
- ✅ Transportörer i checkout
- ✅ DHL:s position (om DHL finns)

**Vad SuperAdmin INTE kan:**
- ❌ Söka nya leads (ingen AI-analys)
- ❌ Göra API-anrop för nya företag
- ❌ Skapa nya leads

### UI-komponenter
- **Komponent:** `SuperAdminLeadViewer.tsx`
- **Endpoint:** `GET /api/admin/leads/all`
- **Vy:** Tabell med alla leads från databas

### Filtreringsmöjligheter
```typescript
// SuperAdmin kan filtrera på:
- Tenant (vilken organisation)
- Transportör (DHL, PostNord, etc.)
- Endast med DHL (checkbox)
- Datum-intervall
```

### Statistik som visas
- Totalt antal leads
- Antal leads med DHL
- Antal leads utan DHL
- Leads per tenant (breakdown)

---

## 🟡 Tenant - Lead Search & Management

### Funktionalitet
**Vad Tenant KAN:**
- ✅ Söka nya leads (AI-analys via Gemini/Groq)
- ✅ Se alla sina egna leads
- ✅ Filtrera checkout baserat på sin transportör
- ✅ Inkludera konkurrenter (optional)
- ✅ Se alla transportörer i checkout

**Checkout-filtrering:**
```typescript
// Tenant-specifik filtrering:
Tenant: DHL
  → Fokus: DHL ja/nej
  → Visar: Alla transportörer i checkout
  → Highlight: DHL:s position
  → Option: Inkludera konkurrenter (PostNord, Bring, etc.)

Tenant: PostNord
  → Fokus: PostNord ja/nej
  → Visar: Alla transportörer i checkout
  → Highlight: PostNord:s position
  → Option: Inkludera konkurrenter (DHL, Bring, etc.)
```

### Tenant Settings
Varje tenant har inställningar för checkout-fokus:

```json
{
  "tenant_id": "dhl-sweden",
  "company_name": "DHL Express Sweden",
  "primary_carrier": "DHL",
  "competitor_carriers": ["PostNord", "Bring", "Schenker"],
  "show_competitors": true,
  "checkout_focus": {
    "highlight_primary": true,
    "filter_by_primary": false,
    "show_position": true
  }
}
```

---

## 📊 Checkout Position Logic

### För SuperAdmin
```typescript
// Visar för ALLA leads:
- Transportörer: "DHL, PostNord, Bring"
- DHL Position: "#1" (grön), "#2-3" (gul), "#4+" (röd)
- Checkout Position: "Position 1 av 4"
```

### För Tenant (DHL)
```typescript
// Visar för varje lead:
- Transportörer: "DHL, PostNord, Bring" (DHL highlighted i gult)
- DHL Status: 
  - ✅ "DHL finns - Position 1" (grön)
  - ⚠️ "DHL finns - Position 3" (gul)
  - ❌ "DHL finns ej" (röd)
- Alla transportörer visas ändå
- Option: "Visa endast med DHL" (filter)
```

---

## 🔧 Implementation

### Backend Endpoints

#### SuperAdmin
```javascript
// GET /api/admin/leads/all
// Hämtar alla leads från databas (ingen sökning)
{
  "leads": [
    {
      "id": "uuid",
      "company_name": "RevolutionRace",
      "tenant_id": "dhl-sweden",
      "tenant_name": "DHL Express Sweden",
      "carriers": "DHL, PostNord, Bring",
      "has_dhl": true,
      "dhl_position": 2,
      "created_at": "2025-12-18T18:00:00Z",
      "created_by_user": "Anna Andersson"
    }
  ],
  "total": 150
}
```

#### Tenant
```javascript
// POST /api/leads/search
// Söker nya leads (AI-analys)
{
  "search_term": "e-handel kläder",
  "tenant_id": "dhl-sweden",
  "filters": {
    "primary_carrier_only": false,
    "include_competitors": true
  }
}

// GET /api/leads
// Hämtar tenant's egna leads från databas
{
  "leads": [...],
  "filters": {
    "has_primary_carrier": true,
    "carrier_position": "top3"
  }
}
```

### Frontend Components

#### SuperAdmin
```typescript
// src/components/admin/SuperAdminLeadViewer.tsx
- Visar alla leads i tabell
- Filtrera per tenant, transportör, DHL ja/nej
- Ingen sök-funktion
- Endast databas-data
```

#### Tenant
```typescript
// src/components/LeadSearch.tsx (befintlig)
- Sök nya leads
- Filtrera på tenant's transportör
- Highlight primary carrier
- Option: inkludera konkurrenter
```

---

## 🎨 UI/UX Skillnader

### SuperAdmin Dashboard
```
┌─────────────────────────────────────┐
│ 🗄️  Alla Leads (Databas)           │
│ Visar alla leads från alla tenants  │
├─────────────────────────────────────┤
│ Totalt: 150 │ Med DHL: 89 │ ...    │
├─────────────────────────────────────┤
│ Filter: [Tenant ▼] [Carrier ▼]     │
│         [☑ Endast med DHL]          │
├─────────────────────────────────────┤
│ Företag    │ Tenant │ Carriers │ ... │
│ RevRace    │ DHL    │ DHL,PN   │ #2  │
│ Elgiganten │ PN     │ PN,Bring │ -   │
└─────────────────────────────────────┘
```

### Tenant Dashboard (DHL)
```
┌─────────────────────────────────────┐
│ 🔍 Sök Leads                        │
│ Sök efter nya företag att analysera │
├─────────────────────────────────────┤
│ [Sökterm: e-handel kläder    ] [Sök]│
│ [☑ Visa endast med DHL]             │
│ [☐ Inkludera konkurrenter]          │
├─────────────────────────────────────┤
│ RevolutionRace                      │
│ ✅ DHL finns - Position 2           │
│ Transportörer: [DHL] PostNord Bring │
│ [Visa detaljer]                     │
└─────────────────────────────────────┘
```

---

## 🔐 Permissions & Access Control

### SuperAdmin
```typescript
// Kräver:
- role: 'admin'
- tenant_id: null (ingen tenant)

// Kan:
- Se alla leads (alla tenants)
- Se alla tenants
- Se alla användare
- Hantera system-inställningar
- INTE söka nya leads
```

### Tenant Admin
```typescript
// Kräver:
- role: 'admin'
- tenant_id: 'dhl-sweden' (specifik tenant)

// Kan:
- Söka nya leads (AI-analys)
- Se sina egna leads
- Hantera sina användare
- Konfigurera checkout-fokus
```

### Tenant User (Säljare)
```typescript
// Kräver:
- role: 'fs' | 'ts' | 'kam' | 'dm'
- tenant_id: 'dhl-sweden'

// Kan:
- Se tilldelade leads
- Söka nya leads (begränsat)
- Se checkout-info
- INTE hantera användare
```

---

## 📝 Database Schema

### Leads Table
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  company_name VARCHAR(255),
  org_number VARCHAR(20),
  domain VARCHAR(255),
  tenant_id UUID REFERENCES tenants(id),
  created_by UUID REFERENCES users(id),
  
  -- Checkout data
  shipping_providers TEXT[], -- ['DHL', 'PostNord', 'Bring']
  shipping_providers_with_position JSONB, -- [{"name": "DHL", "position": 2}]
  ecommerce_platform VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_anonymized BOOLEAN DEFAULT FALSE
);
```

### Tenant Settings Table
```sql
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  primary_carrier VARCHAR(50), -- 'DHL', 'PostNord', etc.
  competitor_carriers TEXT[], -- ['PostNord', 'Bring']
  show_competitors BOOLEAN DEFAULT TRUE,
  checkout_focus JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Användningsexempel

### Scenario 1: SuperAdmin granskar alla leads
```
1. SuperAdmin loggar in
2. Går till "Alla Leads (Databas)"
3. Ser 150 leads från alla tenants
4. Filtrerar: "Endast med DHL" → 89 leads
5. Ser att DHL Sweden har 45 leads, PostNord har 30 leads
6. Klickar på ett lead → Ser full info
```

### Scenario 2: DHL Tenant söker nya leads
```
1. DHL Admin loggar in
2. Går till "Sök Leads"
3. Söker: "e-handel kläder Sverige"
4. System analyserar 10 företag
5. Resultat visar:
   - 6 företag med DHL (positions 1-3)
   - 4 företag utan DHL
6. DHL Admin ser alla transportörer men DHL är highlighted
7. Väljer att inkludera konkurrenter → Ser även PostNord, Bring
```

### Scenario 3: Säljare ser tilldelade leads
```
1. Säljare (FS) loggar in
2. Ser "Mina Leads" (10 st)
3. Filtrerar: "Endast med DHL" → 7 leads
4. Öppnar lead → Ser:
   - ✅ DHL finns - Position 1
   - Transportörer: DHL, PostNord, Bring
   - Checkout: Klarna
5. Kontaktar kund med fokus på DHL:s position
```

---

## 🎯 Key Takeaways

### SuperAdmin
- **Ingen sökning** - endast databas-visning
- **Alla tenants** - ser allt
- **Fokus:** Systemöversikt och analys

### Tenant
- **Kan söka** - AI-analys för nya leads
- **Endast egna leads** - tenant-isolerad
- **Fokus:** Försäljning och checkout-position

### Checkout-filtrering
- **Alla ser alla transportörer** i checkout
- **Tenant's transportör** är highlighted
- **Position** visas för tenant's transportör
- **Option** att filtrera på "endast med vår transportör"

---

## 📚 Relaterade filer

### Frontend
- `src/components/admin/SuperAdminLeadViewer.tsx` - SuperAdmin lead-vy
- `src/components/LeadSearch.tsx` - Tenant lead-sökning
- `src/components/LeadCard.tsx` - Lead-detaljer med checkout

### Backend
- `api/admin/leads/all.js` - SuperAdmin endpoint (databas)
- `api/leads/search.js` - Tenant endpoint (AI-sökning)
- `server/services/geminiService.ts` - AI-analys
- `server/services/websiteScraperService.js` - Checkout scraping

### Database
- `migrations/xxx_add_tenant_settings.sql` - Tenant-inställningar
- `migrations/xxx_add_shipping_position.sql` - Checkout position
