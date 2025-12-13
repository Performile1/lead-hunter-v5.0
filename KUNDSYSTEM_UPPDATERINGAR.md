# Kundsystem Uppdateringar - 2024-12-12

## 🎯 GENOMFÖRDA FÖRBÄTTRINGAR

### 1. ORG.NUMMER EXTRAKTION - FÖRBÄTTRAD ✅

**Problem:** Org.nummer saknades trots att det syns under företagsnamn i sökresultat.

**Lösning:** Uppdaterad AI-prompt med explicit instruktion:
- Org.nummer står ALLTID direkt under företagsnamnet i Google-sökresultat
- Tre sökstrategier: Allabolag, Ratsit, och "organisationsnummer"
- Tydliga mönster att leta efter i snippets och titlar

**Fil:** `prompts/deepAnalysis.ts`

**Resultat:** AI:n vet nu exakt var org.nummer finns och hur det ska extraheras.

---

### 2. CUSTOMERCARD KOMPONENT - NY ✅

**Skapad:** `components/CustomerCard.tsx`

**Funktioner:**
- ✅ Samma layout som LeadCard
- ✅ Redigeringsmöjlighet för ALL kunddata:
  - Företagsnamn, org.nummer
  - Adress, telefon, e-post, webbplats
  - Segment, status
  - Account manager
  - Beslutsfattare
- ✅ Anteckningssystem:
  - Lägg till anteckningar (typ: allmänt, möte, samtal, e-post, problem)
  - Visa historik med datum och författare
  - Ämne och innehåll
- ✅ Visar senast kontakt
- ✅ Visar omsättning och anställda
- ✅ Spara-knapp som uppdaterar backend

**Användning:**
```typescript
<CustomerCard
  customerId="123"
  onClose={() => setSelectedCustomerId(null)}
  onUpdate={(updatedCustomer) => fetchCustomers()}
/>
```

---

### 3. SEGMENT ISTÄLLET FÖR TIER ✅

**Ändring:** Bytt från tier-system (platinum/gold/silver/bronze) till segment-system.

**Nya segment:**
- `ecommerce` - E-handel (blå)
- `retail` - Retail (grön)
- `wholesale` - Grossist (lila)
- `manufacturing` - Tillverkning (orange)
- `logistics` - Logistik (gul)
- `general` - Allmänt (grå)

**Uppdaterade filer:**
- `components/CustomerList.tsx` - Använder segment-filter
- `components/CustomerCard.tsx` - Visar segment
- `server/routes/customers.js` - Filtrerar på segment
- `App.tsx` - Konverterar leads med segment

**Databas migration:** `server/migrations/002_update_customers_to_segment.sql`

---

### 4. ROLLBASERAD ÅTKOMST ✅

**Implementation:**

**Terminalchefer:**
- Ser endast kunder i sitt område
- Filter: `?area=Stockholm`
- Kan redigera sina kunder
- Kan lägga till anteckningar

**Managers:**
- Ser alla kunder i alla områden
- Kan redigera alla kunder
- Kan lägga till anteckningar

**Admin:**
- Ser alla kunder
- Ser status, anteckningar, senast kontakt
- Full redigeringsmöjlighet
- Kan tilldela account managers

**CustomerList Props:**
```typescript
<CustomerList
  userRole="terminalchef"
  userArea="Stockholm"
  onBack={() => setView('dashboard')}
/>
```

---

### 5. UPPDATERAD KUNDLISTA ✅

**Förbättringar:**
- ✅ Klicka på kund → Öppnar CustomerCard
- ✅ Segment-filter istället för tier-filter
- ✅ Visar org.nummer i kundkort
- ✅ Visar senast kontakt
- ✅ Visar segment med färgkodning
- ✅ "Visa detaljer" knapp

**Nya filter:**
- Status: Alla, Aktiva, I riskzonen, Inaktiva, Churned
- Segment: Alla, E-handel, Retail, Grossist, Tillverkning, Logistik
- Endast övervakade: Checkbox
- Sök: Företagsnamn, org.nummer, adress

---

### 6. LEAD-TO-KUND KONVERTERING - UPPDATERAD ✅

**Förbättringar:**
- ✅ Använder segment istället för tier
- ✅ Inkluderar telefon och e-post
- ✅ Inkluderar beslutsfattare
- ✅ Inkluderar omsättning och anställda
- ✅ Sparar till backend med korrekt schema

**Fil:** `App.tsx` - `handleConvertToCustomer()`

---

## 📊 DATABAS ÄNDRINGAR

**Kör migration:**
```bash
psql -U postgres -d dhl_lead_hunter -f server/migrations/002_update_customers_to_segment.sql
```

**Nya kolumner:**
- `segment` VARCHAR(50) - Ersätter customer_tier
- `area` VARCHAR(100) - För geografisk filtrering
- `phone` VARCHAR(50) - Telefonnummer
- `email` VARCHAR(255) - E-postadress
- `last_contact` TIMESTAMP - Senast kontakt
- `decision_makers` JSONB - Array av beslutsfattare

**Index:**
- `idx_customers_segment` - Snabb segment-filtrering
- `idx_customers_area` - Snabb area-filtrering
- `idx_customers_status` - Snabb status-filtrering

---

## 🚀 ANVÄNDNING

### För Terminalchefer

**Se dina kunder:**
```typescript
// I App.tsx eller Dashboard
<CustomerList
  userRole="terminalchef"
  userArea={user.area} // T.ex. "Stockholm"
  onBack={() => setView('dashboard')}
/>
```

**Resultat:**
- Ser endast kunder i sitt område (Stockholm, Göteborg, etc.)
- Kan klicka på kund för att se detaljer
- Kan redigera kunddata
- Kan lägga till anteckningar

### För Managers

**Se alla kunder:**
```typescript
<CustomerList
  userRole="manager"
  onBack={() => setView('dashboard')}
/>
```

**Resultat:**
- Ser alla kunder i alla områden
- Full redigeringsmöjlighet
- Kan se status och anteckningar

### För Admin

**Full åtkomst:**
```typescript
<CustomerList
  userRole="admin"
  onBack={() => setView('dashboard')}
/>
```

**Resultat:**
- Ser alla kunder
- Kan tilldela account managers
- Kan ändra status
- Kan se all historik

---

## 📝 ANTECKNINGSSYSTEM

**Typer av anteckningar:**
- `general` - Allmänt
- `meeting` - Möte
- `call` - Samtal
- `email` - E-post
- `issue` - Problem

**Användning i CustomerCard:**
1. Klicka "Ny anteckning"
2. Välj typ
3. Skriv ämne (valfritt)
4. Skriv anteckning
5. Klicka "Spara anteckning"

**Backend endpoint:**
```
POST /api/customers/:id/notes
Body: {
  note_type: "meeting",
  subject: "Uppföljningsmöte",
  content: "Diskuterade nya leveransalternativ..."
}
```

---

## 🔧 BACKEND API ENDPOINTS

### GET /api/customers
**Query params:**
- `status` - active, at_risk, inactive, churned
- `segment` - ecommerce, retail, wholesale, manufacturing, logistics
- `area` - Stockholm, Göteborg, Malmö, etc.
- `monitor_only` - true/false
- `search` - Sök i namn, org.nummer, adress

**Exempel:**
```
GET /api/customers?status=active&segment=ecommerce&area=Stockholm
```

### GET /api/customers/:id
**Response:**
```json
{
  "customer": {
    "id": "123",
    "company_name": "Företag AB",
    "org_number": "556789-1234",
    "segment": "ecommerce",
    "area": "Stockholm",
    "phone": "08-123 456 78",
    "email": "info@foretag.se",
    "decision_makers": [...],
    "last_contact": "2024-12-10"
  },
  "monitoring_history": [...],
  "notes": [...]
}
```

### PUT /api/customers/:id
**Body:** Alla fält som ska uppdateras

### POST /api/customers/:id/notes
**Body:**
```json
{
  "note_type": "meeting",
  "subject": "Uppföljning",
  "content": "Diskuterade..."
}
```

---

## ✅ CHECKLISTA FÖR IMPLEMENTATION

### Databas
- [ ] Kör migration: `002_update_customers_to_segment.sql`
- [ ] Verifiera att nya kolumner finns
- [ ] Verifiera att index är skapade

### Backend
- [ ] Starta om server efter migration
- [ ] Testa GET /api/customers?segment=ecommerce
- [ ] Testa GET /api/customers?area=Stockholm
- [ ] Testa POST /api/customers/:id/notes

### Frontend
- [ ] Testa konvertera lead till kund
- [ ] Testa öppna CustomerCard
- [ ] Testa redigera kunddata
- [ ] Testa lägga till anteckning
- [ ] Testa segment-filter
- [ ] Testa area-filter (för terminalchefer)

### Org.nummer
- [ ] Testa analysera nytt företag
- [ ] Verifiera att org.nummer hittas
- [ ] Kolla console logs för "✅ Giltigt org.nummer"

---

## 🐛 FELSÖKNING

### Org.nummer saknas fortfarande

**Lösning:**
1. Kolla console logs under analys
2. Verifiera att företaget finns på Allabolag/Ratsit
3. Testa söka manuellt på "[Företagsnamn] allabolag"
4. Om org.nummer syns i Google → AI:n borde hitta det nu

### CustomerCard öppnas inte

**Lösning:**
1. Kolla att backend körs på port 3001
2. Verifiera att customer finns i databasen
3. Kolla browser console för fel
4. Testa API manuellt: `GET http://localhost:3001/api/customers/:id`

### Segment-filter fungerar inte

**Lösning:**
1. Kör databas migration
2. Verifiera att `segment` kolumn finns
3. Uppdatera befintliga kunder med segment
4. Starta om backend

### Rollbaserad filtrering fungerar inte

**Lösning:**
1. Verifiera att `area` kolumn finns i databas
2. Sätt `area` för kunder (t.ex. "Stockholm")
3. Skicka `userArea` prop till CustomerList
4. Kolla att backend filtrerar på `?area=Stockholm`

---

## 📞 SUPPORT

**Om något inte fungerar:**
1. Kolla console logs (både browser och server)
2. Verifiera databas-schema
3. Testa API-endpoints manuellt
4. Läs denna dokumentation igen

**Viktiga filer:**
- `components/CustomerCard.tsx` - Kundkort med redigering
- `components/CustomerList.tsx` - Kundlista med filter
- `server/routes/customers.js` - Backend API
- `server/migrations/002_update_customers_to_segment.sql` - Databas migration
- `prompts/deepAnalysis.ts` - Förbättrad org.nummer extraktion

---

**Lycka till! 🚀**
