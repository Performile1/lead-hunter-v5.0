# 📋 Lead Assignment Guide - Terminal Chefer

## 🎯 Översikt

Terminal chefer kan nu tilldela leads till specifika säljare baserat på deras postnummer.

---

## ✨ Funktioner

### För Terminal Chefer
- ✅ Se alla säljare i sin terminal med deras postnummer
- ✅ Se otilldelade leads
- ✅ Tilldela enskilda leads till säljare
- ✅ Bulk-tilldela flera leads samtidigt
- ✅ Se vilka säljare som matchar varje lead (baserat på postnummer)
- ✅ Ta bort tilldelningar

### För Säljare (FS/TS/KAM/DM)
- ✅ Se alla leads som tilldelats dem
- ✅ Filtrerade baserat på deras postnummer

---

## 🗄️ Databas-Ändringar

### Nya Kolumner i `leads`-tabellen
```sql
assigned_salesperson_id UUID REFERENCES users(id)  -- Tilldelad säljare
assigned_at TIMESTAMP                               -- När tilldelning gjordes
assigned_by UUID REFERENCES users(id)              -- Vem som tilldelade
```

---

## 🔌 API Endpoints

### 1. Hämta Säljare i Terminal
```http
GET /api/assignments/salespeople
Authorization: Bearer {token}
```

**Response:**
```json
{
  "salespeople": [
    {
      "id": "uuid",
      "full_name": "Anna Andersson",
      "email": "anna@dhl.se",
      "role": "fs",
      "postal_codes": [
        { "postal_code": "100", "city": "Stockholm" },
        { "postal_code": "101", "city": "Stockholm" }
      ],
      "assigned_leads_count": 5
    }
  ]
}
```

### 2. Hämta Otilldelade Leads
```http
GET /api/assignments/unassigned-leads?limit=50&offset=0
Authorization: Bearer {token}
```

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "company_name": "Test AB",
      "postal_code": "10115",
      "city": "Stockholm",
      "segment": "FS",
      "revenue_tkr": 5000
    }
  ],
  "total": 10
}
```

### 3. Tilldela Lead till Säljare
```http
POST /api/assignments/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_id": "uuid",
  "salesperson_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Lead tilldelad",
  "lead_id": "uuid",
  "salesperson_id": "uuid"
}
```

### 4. Bulk-Tilldela Leads
```http
POST /api/assignments/bulk-assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_ids": ["uuid1", "uuid2", "uuid3"],
  "salesperson_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Bulk-tilldelning slutförd",
  "assigned": 3,
  "failed": 0,
  "total": 3
}
```

### 5. Ta Bort Tilldelning
```http
DELETE /api/assignments/unassign/{leadId}
Authorization: Bearer {token}
```

### 6. Hämta Mina Tilldelade Leads (Säljare)
```http
GET /api/assignments/my-leads?limit=50&offset=0
Authorization: Bearer {token}
```

---

## 🎨 Frontend Komponenter

### LeadAssignment.tsx
Huvudkomponent för lead-tilldelning:

**Funktioner:**
- Lista alla säljare med postnummer
- Visa otilldelade leads
- Markera flera leads
- Tilldela till vald säljare
- Visuell matchning (vilka säljare har rätt postnummer)

**Användning:**
```tsx
import { LeadAssignment } from './components/terminal/LeadAssignment';

<LeadAssignment />
```

### TerminalDashboard.tsx
Dashboard för terminal chefer:

**Tabs:**
1. **Översikt** - Statistik
2. **Tilldela Leads** - LeadAssignment-komponenten
3. **Säljare** - Lista över säljare

---

## 🔐 Behörigheter

### Terminal Manager
- ✅ Kan tilldela leads i sin terminal
- ✅ Kan se alla säljare i sin terminal
- ✅ Kan bara tilldela till säljare med matchande postnummer
- ❌ Kan inte tilldela leads från andra terminaler

### Säljare (FS/TS/KAM/DM)
- ✅ Kan se sina tilldelade leads
- ❌ Kan inte tilldela leads

### Admin/Manager
- ✅ Full åtkomst till alla tilldelningar

---

## 📊 Hur Det Fungerar

### 1. Postnummer-Matchning
```
Lead: Postnummer 10115 (Stockholm)
↓
Prefix: 101
↓
Säljare med postnummer 101 kan tilldelas
```

### 2. Validering
När terminal chef försöker tilldela:
1. ✅ Kontrollera att leadet finns i chefens terminal
2. ✅ Kontrollera att säljaren har rätt postnummer
3. ✅ Tilldela och logga

### 3. Auto-Förslag
Systemet visar automatiskt vilka säljare som matchar varje lead baserat på postnummer.

---

## 💡 Användningsexempel

### Scenario 1: Tilldela Ett Lead
```
1. Terminal chef loggar in
2. Går till "Tilldela Leads"
3. Ser lista med otilldelade leads
4. Väljer säljare "Anna Andersson" (har postnummer 100-102)
5. Markerar lead med postnummer 10115
6. Klickar "Tilldela"
7. ✅ Lead tilldelat till Anna
```

### Scenario 2: Bulk-Tilldelning
```
1. Terminal chef ser 10 leads i Stockholm (100-139)
2. Väljer säljare "Erik Eriksson" (har postnummer 100-110)
3. Markerar alla leads med postnummer 100-110
4. Klickar "Tilldela (5)"
5. ✅ 5 leads tilldelade till Erik
```

### Scenario 3: Säljare Ser Sina Leads
```
1. Säljare loggar in
2. Går till "Mina Leads"
3. Ser alla leads som tilldelats av terminal chef
4. Kan börja jobba med dem
```

---

## 🚀 Installation

### 1. Uppdatera Databas
```bash
psql -d dhl_lead_hunter -f DATABASE_SCHEMA.sql
```

### 2. Starta Backend
```bash
cd server
npm run dev
```

### 3. Använd i Frontend
```tsx
import { TerminalDashboard } from './components/terminal/TerminalDashboard';

// För terminal managers
{user.role === 'terminal_manager' && <TerminalDashboard />}
```

---

## 📈 Statistik & Rapporter

### För Terminal Chefer
```sql
-- Se tilldelningsstatistik
SELECT 
  u.full_name,
  COUNT(l.id) as assigned_leads,
  SUM(l.revenue_tkr) as total_revenue
FROM users u
LEFT JOIN leads l ON l.assigned_salesperson_id = u.id
WHERE u.role IN ('fs', 'ts', 'kam', 'dm')
GROUP BY u.id, u.full_name
ORDER BY assigned_leads DESC;
```

### För Säljare
```sql
-- Se mina tilldelade leads
SELECT * FROM leads
WHERE assigned_salesperson_id = 'user-uuid'
ORDER BY assigned_at DESC;
```

---

## ⚠️ Viktigt att Veta

### Postnummer-Krav
- Säljare MÅSTE ha postnummer tilldelade för att kunna få leads
- Postnummer lagras som första 3 siffrorna (t.ex. "101" för "10115")
- Terminal chef kan bara tilldela till säljare med matchande postnummer

### Validering
- System validerar automatiskt att säljaren har rätt postnummer
- Om postnummer inte matchar, visas varning
- Bulk-tilldelning skippar leads som inte matchar

### Audit Trail
- Alla tilldelningar loggas i `activity_logs`
- `assigned_by` visar vem som tilldelade
- `assigned_at` visar när tilldelning gjordes

---

## 🎉 Sammanfattning

**Nya Funktioner:**
- ✅ Lead-tilldelning baserat på postnummer
- ✅ Visuell matchning av säljare
- ✅ Bulk-tilldelning
- ✅ Komplett audit trail

**Nya Filer:**
- ✅ `server/routes/assignments.js` (300+ rader)
- ✅ `src/components/terminal/LeadAssignment.tsx` (300+ rader)
- ✅ `src/components/terminal/TerminalDashboard.tsx` (100+ rader)

**Databas-Ändringar:**
- ✅ 3 nya kolumner i `leads`-tabellen
- ✅ 1 nytt index

**API Endpoints:**
- ✅ 6 nya endpoints för tilldelning

**Status:** 🚀 **PRODUCTION-READY!**
