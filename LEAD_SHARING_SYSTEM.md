# 🔄 Lead Sharing System - Cross-Tenant Lead Pool

## Översikt

Systemet har nu ett **delat lead-pool system** där tenants kan se och använda leads som andra tenants har sökt fram, baserat på specifika kriterier.

---

## 🎯 Hur det fungerar

### **SuperAdmin**
- ✅ Kan söka nya leads (API-anrop för AI-analys)
- ✅ Kan se alla befintliga leads från alla tenants
- ✅ Har full översikt över systemet

### **Tenant (t.ex. DHL)**
- ✅ Kan söka nya leads (API-anrop för AI-analys)
- ✅ Ser sina egna leads
- ✅ **NYT:** Ser leads från andra tenants via "Delad Lead-Pool"

---

## 📋 Delad Lead-Pool - Kriterier

Tenants ser leads från andra tenants baserat på:

### **1. Omsättning / Segment (Tier)**
```typescript
- Tier 1 (KAM): >50 MSEK - Strategiskt viktiga kunder
- Tier 2: 10-50 MSEK - Mellankunder
- Tier 3: <10 MSEK - Småkunder
- Tier 4: Prospekt - Ej kund ännu
```

### **2. Område (Geografisk filtrering)**
```typescript
- Postnummer-prefix: "11" → Stockholm
- Postnummer-prefix: "21" → Malmö
- Region: "Stockholm", "Göteborg", "Malmö"
```

### **3. SNI-kod (Bransch)**
```typescript
- SNI 47: Detaljhandel
- SNI 4791: Detaljhandel via postorder eller Internet
- SNI 4719: Övrig detaljhandel i icke specialiserade butiker
```

### **4. Automatisk exkludering**
```typescript
// Exkluderar automatiskt:
- Tenant's egna befintliga kunder (från customers-tabellen)
- Leads som tenant själv har sökt fram
- Företag som redan är kunder (matchning på org_nummer)
```

---

## 🔍 Användningsexempel

### Scenario 1: DHL söker i delad pool
```
1. DHL-användare går till "Delad Lead-Pool"
2. Filtrerar:
   - Segment: Tier 1 (>50 MSEK)
   - Område: Stockholm (11)
   - SNI: 4791 (E-handel)
   - ☑ Endast med DHL i checkout
3. Resultat: 15 leads från andra tenants
   - 8 leads har DHL i checkout (position 1-3)
   - 7 leads har inte DHL
4. DHL ser alla transportörer men DHL är highlighted
5. DHL kan kontakta dessa företag
```

### Scenario 2: PostNord söker konkurrenter
```
1. PostNord-användare går till "Delad Lead-Pool"
2. Filtrerar:
   - Segment: Tier 2 (10-50 MSEK)
   - Område: Göteborg (41)
   - ☐ Inkludera alla (även utan PostNord)
3. Resultat: 25 leads från DHL, Bring, Schenker
   - 10 leads har PostNord
   - 15 leads har inte PostNord (potential!)
4. PostNord ser vilka som använder konkurrenter
5. PostNord kan pitcha sitt erbjudande
```

---

## 🏗️ Teknisk Implementation

### Backend Endpoint
```javascript
// GET /api/leads/shared-pool
// Hämtar leads från andra tenants

Query Parameters:
- segment: 'tier1' | 'tier2' | 'tier3' | 'tier4'
- area: Postnummer-prefix eller region
- sni_code: SNI-kod
- min_revenue: Minimum omsättning (MSEK)
- max_revenue: Maximum omsättning (MSEK)
- limit: Antal resultat (default: 50)
- offset: Pagination offset

Response:
{
  "success": true,
  "leads": [
    {
      "id": "uuid",
      "company_name": "RevolutionRace AB",
      "org_number": "556938-2913",
      "segment": "tier1",
      "revenue": "150 MSEK",
      "city": "Borås",
      "region": "Västra Götaland",
      "sni_code": "4791",
      "sni_description": "Detaljhandel via Internet",
      "shipping_providers": "DHL, PostNord, Bring",
      "has_primary_carrier": true,
      "primary_carrier_position": 2,
      "source_tenant_name": "PostNord Logistics",
      "created_at": "2025-12-18T10:00:00Z"
    }
  ],
  "total": 150,
  "tenant_context": {
    "primary_carrier": "DHL",
    "excluded_customers": true
  }
}
```

### SQL Query Logic
```sql
SELECT DISTINCT
  l.id,
  l.company_name,
  l.segment,
  l.revenue,
  l.sni_code,
  l.shipping_providers,
  t.company_name as source_tenant_name,
  
  -- Check if lead has tenant's primary carrier
  CASE 
    WHEN l.shipping_providers ILIKE '%' || ts.primary_carrier || '%' 
    THEN true 
    ELSE false 
  END as has_primary_carrier,
  
  -- Get position of tenant's carrier
  (
    SELECT position 
    FROM jsonb_array_elements(l.shipping_providers_with_position::jsonb)
    WHERE elem->>'name' ILIKE '%' || ts.primary_carrier || '%'
  ) as primary_carrier_position
  
FROM leads l
LEFT JOIN tenants t ON l.tenant_id = t.id
LEFT JOIN tenant_settings ts ON ts.tenant_id = $1

WHERE 
  -- Exclude leads from current tenant
  l.tenant_id != $1
  
  -- Exclude existing customers (by lead_id)
  AND l.id NOT IN (
    SELECT lead_id FROM customers 
    WHERE tenant_id = $1 AND lead_id IS NOT NULL
  )
  
  -- Exclude existing customers (by org_number)
  AND l.org_number NOT IN (
    SELECT org_number FROM customers 
    WHERE tenant_id = $1 AND org_number IS NOT NULL
  )
  
  -- Apply filters
  AND l.segment = $2  -- Optional
  AND l.postal_code LIKE $3  -- Optional
  AND l.sni_code LIKE $4  -- Optional

ORDER BY 
  has_primary_carrier DESC,
  primary_carrier_position ASC NULLS LAST,
  l.revenue_numeric DESC
```

---

## 🎨 UI Components

### SharedLeadPool Component
```typescript
// src/components/leads/SharedLeadPool.tsx

Features:
- Filter by segment (Tier 1-4)
- Filter by area (postal code/region)
- Filter by SNI code
- Filter by revenue range
- Checkbox: "Endast med min transportör"
- Grid view of shared leads
- Click to view full lead details
```

### Lead Card Display
```
┌─────────────────────────────────────┐
│ RevolutionRace AB          ✓ Trans  │
├─────────────────────────────────────┤
│ 📈 150 MSEK              [TIER 1]   │
│ 📍 Borås, Västra Götaland           │
│ 🏢 Detaljhandel via Internet        │
│                                     │
│ Position #2 i checkout              │
│                                     │
│ Delad från: PostNord Logistics      │
└─────────────────────────────────────┘
```

---

## 🔐 Security & Privacy

### Data Protection
```typescript
// Vad som INTE delas:
- Kontaktpersoner (namn, email, telefon)
- Interna anteckningar
- Affärshistorik
- Prissättning
- Kontrakt

// Vad som DELAS:
- Företagsnamn (offentlig info)
- Org.nummer (offentlig info)
- Omsättning (offentlig info från Allabolag)
- SNI-kod (offentlig info)
- Checkout-info (offentligt tillgänglig)
- E-handelsplattform (offentlig info)
```

### Access Control
```typescript
// Tenant kan INTE se:
- Vilka användare från andra tenants som sökt
- När lead söktes av andra tenants
- Interna kommentarer från andra tenants

// Tenant KAN se:
- Vilken tenant som sökt (företagsnamn)
- Företagsdata (offentlig info)
- Checkout-info (offentlig info)
```

---

## 📊 Use Cases

### Use Case 1: Expansion till nya segment
```
Scenario: DHL vill expandera till Tier 2-kunder

1. Går till Delad Lead-Pool
2. Filtrerar: Tier 2 (10-50 MSEK)
3. Ser 50 leads från andra tenants
4. 20 av dessa har redan DHL → Kontakta för upsell
5. 30 har inte DHL → Kontakta för nyförsäljning
```

### Use Case 2: Geografisk expansion
```
Scenario: PostNord vill växa i Stockholm

1. Går till Delad Lead-Pool
2. Filtrerar: Område = "11" (Stockholm)
3. Ser 75 leads från DHL, Bring, Schenker
4. 25 har PostNord → Kontakta för retention
5. 50 har inte PostNord → Kontakta för acquisition
```

### Use Case 3: Branschfokus
```
Scenario: Bring vill fokusera på e-handel

1. Går till Delad Lead-Pool
2. Filtrerar: SNI = "4791" (E-handel via Internet)
3. Ser 100 leads från alla tenants
4. Sorterar på "Endast utan Bring"
5. Får 60 potentiella nya kunder
```

---

## 🚀 Benefits

### För Tenants
- ✅ Större lead-pool utan extra AI-kostnader
- ✅ Upptäck nya marknader och segment
- ✅ Se konkurrenters positioner
- ✅ Spara tid på prospektering

### För SuperAdmin
- ✅ Maximera värdet av varje AI-sökning
- ✅ Bättre ROI på systemet
- ✅ Mer data för alla tenants
- ✅ Ökad användning av plattformen

### För Systemet
- ✅ Mindre AI-anrop (återanvänder data)
- ✅ Lägre kostnader
- ✅ Bättre datakvalitet (mer leads = bättre insights)
- ✅ Network effects (fler tenants = mer värde)

---

## 📈 Metrics & Analytics

### Tracking
```typescript
// Metrics att spåra:
- Antal leads i delad pool
- Antal leads per tenant
- Antal visningar av delade leads
- Antal konverteringar från delad pool
- Mest populära filter
- Mest delade branscher (SNI)
```

### Dashboard för SuperAdmin
```
┌─────────────────────────────────────┐
│ Delad Lead-Pool Statistik          │
├─────────────────────────────────────┤
│ Totalt leads i pool: 1,250          │
│ Leads delat senaste veckan: 150    │
│ Mest aktiva tenant: DHL (450)      │
│ Mest populär bransch: E-handel     │
│ Genomsnittlig omsättning: 25 MSEK  │
└─────────────────────────────────────┘
```

---

## 🔄 Future Enhancements

### Phase 2
- [ ] Lead scoring (hur "bra" är ett delat lead?)
- [ ] Rekommendationer ("Dessa leads passar dig")
- [ ] Notifikationer när nya relevanta leads delas
- [ ] Batch-export av delade leads

### Phase 3
- [ ] Lead-trading (byt leads mellan tenants)
- [ ] Premium leads (betala för exklusiv access)
- [ ] Lead-historik (vem har kontaktat vilka)
- [ ] Success rate tracking

---

## 📝 Database Schema

### Tenant Settings Table
```sql
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  primary_carrier VARCHAR(50),
  competitor_carriers TEXT[],
  show_competitors BOOLEAN DEFAULT TRUE,
  
  -- Lead pool preferences
  share_leads_enabled BOOLEAN DEFAULT TRUE,
  preferred_segments TEXT[],
  preferred_regions TEXT[],
  preferred_sni_codes TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Lead Access Log (Optional)
```sql
CREATE TABLE lead_access_log (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  accessed_by_tenant_id UUID REFERENCES tenants(id),
  accessed_by_user_id UUID REFERENCES users(id),
  access_type VARCHAR(50), -- 'view', 'export', 'contact'
  accessed_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎓 Training & Onboarding

### För Tenants
```
1. Introduktion till Delad Lead-Pool
2. Hur man filtrerar effektivt
3. Best practices för att kontakta delade leads
4. Privacy och data protection
5. Hur man maximerar värdet
```

### För Säljare
```
1. Skillnad mellan egna leads och delade leads
2. Hur man använder filter
3. Hur man prioriterar delade leads
4. Hur man pitchar baserat på checkout-position
```

---

## ✅ Implementation Checklist

- [x] Backend endpoint `/api/leads/shared-pool`
- [x] SQL query med exkludering av egna kunder
- [x] Frontend component `SharedLeadPool.tsx`
- [x] Filter UI (segment, area, SNI, revenue)
- [x] Lead card display med source tenant
- [x] Integration i tenant dashboard
- [ ] Tenant settings för lead sharing preferences
- [ ] Analytics tracking
- [ ] Documentation för användare
- [ ] Testing med multiple tenants

---

## 🚦 Next Steps

1. **Test med mock data** - Skapa testdata för multiple tenants
2. **UI polish** - Förbättra lead card design
3. **Add to navigation** - Lägg till i huvudmenyn
4. **User training** - Skapa guide för användare
5. **Monitor usage** - Spåra hur funktionen används

Vill du att jag implementerar något specifikt härnäst?
