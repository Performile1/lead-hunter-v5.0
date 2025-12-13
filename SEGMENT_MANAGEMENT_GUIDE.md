# 🏷️ Segment Management Guide - Flytta Leads & Ändra Segment

## 🎯 Översikt

**ALLA användare** kan nu:
- ✅ Ändra segment för leads (TS → KAM, etc.)
- ✅ Flytta leads mellan säljare
- ✅ Ändra segment OCH flytta säljare samtidigt
- ✅ Bulk-ändra segment för flera leads

---

## 📋 Våra Segment (Minsta → Största)

### DM - Direct Marketing
**Beskrivning:** Minsta kunderna - Direktmarknadsföring
**Typisk kund:**
- Omsättning: < 1 MSEK
- Mycket små företag
- Standardiserade lösningar
- Email, direktutskick, digital marknadsföring
- Ingen personlig kontakt

### TS - Telesales
**Beskrivning:** Telefonsäljare - Små kunder
**Typisk kund:**
- Omsättning: 1-5 MSEK
- Kan hanteras per telefon
- Standardiserade behov
- Snabba beslut
- Ingen personlig kontakt

### FS - Field Sales
**Beskrivning:** Säljare ute - Medelstora kunder, personlig kontakt
**Typisk kund:**
- Omsättning: 5-10 MSEK
- Lokala företag
- Behöver personlig kontakt
- Regelbundna besök
- Standardiserade lösningar

### KAM - Key Account Manager
**Beskrivning:** Stora kunder - Strategiska relationer
**Typisk kund:**
- Omsättning: 10+ MSEK
- Komplexa logistikbehov
- Långsiktiga avtal
- Dedikerad kontaktperson
- Skräddarsydda lösningar

### UNKNOWN - Oklassificerad
**Beskrivning:** Behöver klassificeras
**Användning:**
- Nya leads som inte analyserats
- Otillräcklig information
- Behöver manuell granskning

---

## 🔌 API Endpoints

### 1. Ändra Segment
```http
POST /api/lead-management/change-segment
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_id": "uuid",
  "new_segment": "KAM",
  "reason": "Kunden är större än förväntat"
}
```

**Response:**
```json
{
  "message": "Segment ändrat",
  "lead_id": "uuid",
  "old_segment": "TS",
  "new_segment": "KAM",
  "company_name": "Stora AB"
}
```

### 2. Bulk-Ändra Segment
```http
POST /api/lead-management/bulk-change-segment
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_ids": ["uuid1", "uuid2", "uuid3"],
  "new_segment": "KAM",
  "reason": "Alla är större kunder"
}
```

**Response:**
```json
{
  "message": "Segment ändrade",
  "updated": 3,
  "total": 3,
  "new_segment": "KAM"
}
```

### 3. Flytta till Ny Säljare
```http
POST /api/lead-management/reassign-salesperson
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_id": "uuid",
  "new_salesperson_id": "uuid",
  "reason": "Anna har bättre relation med kunden"
}
```

**Response:**
```json
{
  "message": "Lead flyttat till ny säljare",
  "lead_id": "uuid",
  "from_salesperson": "Erik Eriksson",
  "to_salesperson": "Anna Andersson"
}
```

### 4. Ändra Segment OCH Flytta Säljare
```http
POST /api/lead-management/change-segment-and-reassign
Authorization: Bearer {token}
Content-Type: application/json

{
  "lead_id": "uuid",
  "new_segment": "KAM",
  "new_salesperson_id": "uuid",
  "reason": "Uppgraderad till KAM-kund, behöver KAM-säljare"
}
```

**Response:**
```json
{
  "message": "Segment ändrat och lead flyttat",
  "lead_id": "uuid",
  "old_segment": "TS",
  "new_segment": "KAM",
  "to_salesperson": "Anna Andersson"
}
```

### 5. Segment-Statistik
```http
GET /api/lead-management/segment-stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "stats": [
    {
      "segment": "FS",
      "count": 150,
      "total_revenue_tkr": 750000,
      "avg_revenue_tkr": 5000,
      "salespeople_count": 5
    }
  ],
  "segments": {
    "FS": "Field Sales - Säljare ute",
    "TS": "Telesales - Telefonsäljare",
    "KAM": "Key Account Manager - Stora kunder",
    "DM": "Decision Maker - Strategiska kunder",
    "UNKNOWN": "Oklassificerad"
  }
}
```

---

## 📊 Användningsscenarier

### Scenario 1: Lead Kom in på Fel Segment
**Problem:** Lead kom in som TS men är egentligen en KAM-kund

**Lösning:**
```javascript
// 1. Ändra segment
POST /api/lead-management/change-segment
{
  "lead_id": "lead-uuid",
  "new_segment": "KAM",
  "reason": "Omsättning 50 MSEK, komplexa behov"
}

// 2. Flytta till KAM-säljare
POST /api/lead-management/reassign-salesperson
{
  "lead_id": "lead-uuid",
  "new_salesperson_id": "kam-salesperson-uuid",
  "reason": "Behöver KAM-kompetens"
}
```

**Eller kombinerat:**
```javascript
POST /api/lead-management/change-segment-and-reassign
{
  "lead_id": "lead-uuid",
  "new_segment": "KAM",
  "new_salesperson_id": "kam-salesperson-uuid",
  "reason": "Uppgraderad till KAM-kund"
}
```

### Scenario 2: Kund Växer
**Problem:** FS-kund har vuxit och behöver uppgraderas till KAM

**Workflow:**
```
1. Upptäck tillväxt (ny omsättning 25 MSEK)
2. Ändra segment: FS → KAM
3. Tilldela KAM-säljare
4. Informera gamla säljaren
5. Handover-möte
```

**API:**
```javascript
POST /api/lead-management/change-segment-and-reassign
{
  "lead_id": "growing-customer-uuid",
  "new_segment": "KAM",
  "new_salesperson_id": "kam-specialist-uuid",
  "reason": "Kunden har vuxit från 5 MSEK till 25 MSEK"
}
```

### Scenario 3: Bulk-Omklassificering
**Problem:** 20 leads klassificerades fel som TS, ska vara FS

**Lösning:**
```javascript
POST /api/lead-management/bulk-change-segment
{
  "lead_ids": [/* 20 UUIDs */],
  "new_segment": "FS",
  "reason": "Felklassificerade av AI, behöver personlig kontakt"
}
```

---

## 🎨 Frontend Integration

### Använd SegmentChanger
```tsx
import { SegmentChanger } from './components/leads/SegmentChanger';

<SegmentChanger
  lead={lead}
  onSegmentChanged={() => refreshLeads()}
/>
```

### Manuell Segment-Ändring
```typescript
const changeSegment = async (leadId: string, newSegment: string) => {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('/api/lead-management/change-segment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      lead_id: leadId,
      new_segment: newSegment,
      reason: 'Manuell ändring'
    })
  });

  if (response.ok) {
    alert('✅ Segment ändrat!');
  }
};
```

---

## 🔐 Behörigheter

### Alla Användare Kan:
- ✅ Ändra segment för alla leads
- ✅ Flytta leads mellan säljare (med postnummer-validering)
- ✅ Se segment-statistik

### Admin Kan:
- ✅ Allt ovanstående
- ✅ Flytta leads UTAN postnummer-validering
- ✅ Bulk-operationer utan begränsningar

### Postnummer-Validering:
```javascript
// Admin: Ingen validering
if (user.role === 'admin') {
  // ✅ Kan tilldela till vem som helst
}

// Andra: Måste matcha postnummer
else {
  // ✅ Säljaren måste ha rätt postnummer
  if (!salesperson.postal_codes.includes(lead.postal_code)) {
    throw new Error('Postnummer matchar inte');
  }
}
```

---

## 📈 Segment-Beslutskriterier

### När Använda FS:
- Omsättning: 1-10 MSEK
- Lokala företag
- Standardiserade behov
- Personlig kontakt viktigt

### När Använda TS:
- Omsättning: 1-5 MSEK
- Enkla behov
- Kan hanteras per telefon
- Snabba beslut

### När Använda KAM:
- Omsättning: 10-100 MSEK
- Komplexa logistikbehov
- Långsiktiga relationer
- Dedikerad kontakt krävs

### När Använda DM:
- Omsättning: 100+ MSEK
- Enterprise-nivå
- C-level kontakter
- Strategiska partnerskap

---

## 🔄 Audit Logging

Alla segment-ändringar loggas automatiskt:

```sql
SELECT 
  al.created_at,
  u.full_name as changed_by,
  al.details->>'company_name' as company,
  al.details->>'old_segment' as from_segment,
  al.details->>'new_segment' as to_segment,
  al.details->>'reason' as reason
FROM activity_logs al
JOIN users u ON al.user_id = u.id
WHERE al.action_type = 'change_segment'
ORDER BY al.created_at DESC;
```

**Exempel logg:**
```json
{
  "action_type": "change_segment",
  "user_id": "user-uuid",
  "details": {
    "company_name": "Stora AB",
    "old_segment": "TS",
    "new_segment": "KAM",
    "reason": "Kunden har vuxit till 25 MSEK"
  }
}
```

---

## 📁 Skapade Filer

1. ✅ `server/routes/lead-management.js` (300+ rader)
   - 5 endpoints för segment/säljare-hantering
   - Audit logging
   - Validering

2. ✅ `src/components/leads/SegmentChanger.tsx` (200+ rader)
   - Visuell segment-väljare
   - Anlednings-fält
   - Varningar

3. ✅ `server/routes/leads.js` (uppdaterad)
   - Segment-validering i PUT

4. ✅ `server/index.js` (uppdaterad)
   - Lead-management routes

5. ✅ `SEGMENT_MANAGEMENT_GUIDE.md` (denna fil)
   - Komplett dokumentation

---

## 💡 Best Practices

### 1. Alltid Ange Anledning
```javascript
{
  "reason": "Kunden har vuxit från 5 MSEK till 25 MSEK, behöver KAM-kompetens"
}
```

### 2. Informera Säljare
När du flyttar ett lead, informera både gamla och nya säljaren.

### 3. Granska Regelbundet
Kör segment-statistik regelbundet för att hitta felklassificeringar:
```javascript
GET /api/lead-management/segment-stats
```

### 4. Använd Bulk för Många
Om du behöver ändra många leads, använd bulk-endpoint:
```javascript
POST /api/lead-management/bulk-change-segment
```

---

## 🎉 Sammanfattning

### ✅ Implementerat
- Ändra segment för leads
- Flytta leads mellan säljare
- Kombinerad segment + säljare-ändring
- Bulk-operationer
- Segment-statistik
- Audit logging

### ✅ Segment
- **FS** - Field Sales (1-10 MSEK)
- **TS** - Telesales (1-5 MSEK)
- **KAM** - Key Account Manager (10-100 MSEK)
- **DM** - Decision Maker (100+ MSEK)
- **UNKNOWN** - Oklassificerad

### ✅ Funktioner
- Alla användare kan ändra segment
- Postnummer-validering för säljare
- Admin kan ignorera validering
- Komplett audit trail

**Status:** 🚀 **PRODUCTION-READY!**

Alla användare kan nu hantera segment och flytta leads mellan säljare! 🎊
