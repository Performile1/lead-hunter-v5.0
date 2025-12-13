# 🔄 Avancerad Lead Assignment - Admin & Manager Funktioner

## 🎯 Översikt

Admin och managers kan nu:
- ✅ Tilldela leads till ALLA säljare (inte bara i sin terminal)
- ✅ Flytta leads mellan säljare
- ✅ Flytta leads mellan terminaler
- ✅ Se alla otilldelade leads i hela systemet
- ✅ Admin kan tilldela utan postnummer-begränsningar

---

## 🔐 Behörigheter

### Admin (Fulla Rättigheter)
- ✅ Kan tilldela leads till VEM SOM HELST (ingen postnummer-validering)
- ✅ Kan flytta leads mellan ALLA terminaler
- ✅ Kan flytta leads mellan ALLA säljare
- ✅ Ser ALLA otilldelade leads
- ✅ Ser ALLA säljare i systemet

### Manager
- ✅ Kan tilldela leads till alla säljare (med postnummer-validering)
- ✅ Kan flytta leads mellan terminaler
- ✅ Kan flytta leads mellan säljare
- ✅ Ser alla otilldelade leads
- ✅ Ser alla säljare i systemet

### Terminal Manager
- ✅ Kan tilldela leads till säljare i sin terminal (med postnummer-validering)
- ✅ Kan flytta leads mellan säljare i sin terminal
- ❌ Kan INTE flytta leads mellan terminaler
- ✅ Ser bara otilldelade leads i sin terminal
- ✅ Ser bara säljare i sin terminal

---

## 🔌 Nya API Endpoints

### 1. Hämta Alla Terminaler
```http
GET /api/terminals
Authorization: Bearer {token}
```

**Response:**
```json
{
  "terminals": [
    {
      "id": "uuid",
      "name": "DHL Stockholm",
      "code": "STO",
      "manager_name": "Anna Andersson",
      "leads_count": 45
    }
  ]
}
```

### 2. Flytta Lead till Annan Terminal
```http
POST /api/terminals/reassign-lead
Authorization: Bearer {token}  (admin/manager)
Content-Type: application/json

{
  "lead_id": "uuid",
  "terminal_id": "uuid"
}
```

**Vad som händer:**
- Lead flyttas till ny terminal
- Säljare-tilldelning tas bort (måste tilldelas igen)
- Audit log skapas

**Response:**
```json
{
  "message": "Lead flyttat till ny terminal",
  "lead_id": "uuid",
  "terminal_id": "uuid",
  "terminal_name": "DHL Göteborg"
}
```

### 3. Bulk-Flytta Leads mellan Terminaler
```http
POST /api/terminals/bulk-reassign
Authorization: Bearer {token}  (admin/manager)
Content-Type: application/json

{
  "lead_ids": ["uuid1", "uuid2", "uuid3"],
  "terminal_id": "uuid"
}
```

**Response:**
```json
{
  "message": "Leads flyttade till ny terminal",
  "reassigned": 3,
  "total": 3,
  "terminal_name": "DHL Malmö"
}
```

### 4. Flytta Lead mellan Säljare
```http
POST /api/terminals/transfer-salesperson
Authorization: Bearer {token}  (admin/manager/terminal_manager)
Content-Type: application/json

{
  "lead_id": "uuid",
  "from_salesperson_id": "uuid",
  "to_salesperson_id": "uuid"
}
```

**Behörigheter:**
- **Admin**: Kan flytta mellan ALLA säljare
- **Manager**: Kan flytta mellan alla säljare
- **Terminal Manager**: Kan bara flytta inom sin terminal

**Response:**
```json
{
  "message": "Lead flyttat till ny säljare",
  "lead_id": "uuid",
  "to_salesperson": "Erik Eriksson"
}
```

---

## 📊 Användningsscenarier

### Scenario 1: Lead i Fel Terminal
**Problem:** Lead med postnummer 10115 (Stockholm) hamnade i Göteborg-terminalen

**Lösning (Admin/Manager):**
```javascript
// 1. Flytta lead till rätt terminal
POST /api/terminals/reassign-lead
{
  "lead_id": "lead-uuid",
  "terminal_id": "stockholm-terminal-uuid"
}

// 2. Tilldela till säljare i Stockholm
POST /api/assignments/assign
{
  "lead_id": "lead-uuid",
  "salesperson_id": "anna-uuid"
}
```

### Scenario 2: Säljare Slutar - Flytta Alla Leads
**Problem:** Säljare "Anna" slutar, behöver flytta alla hennes leads till "Erik"

**Lösning (Admin/Manager/Terminal Manager):**
```javascript
// 1. Hämta Annas leads
GET /api/leads?assigned_salesperson_id=anna-uuid

// 2. För varje lead, flytta till Erik
POST /api/terminals/transfer-salesperson
{
  "lead_id": "lead-uuid",
  "from_salesperson_id": "anna-uuid",
  "to_salesperson_id": "erik-uuid"
}
```

### Scenario 3: Lager Flyttar till Annan Stad
**Problem:** Företag flyttar lager från Stockholm (101) till Göteborg (401)

**Lösning (Admin/Manager):**
```javascript
// 1. Uppdatera lead med nytt postnummer
PUT /api/leads/{lead-uuid}
{
  "postal_code": "40115",
  "city": "Göteborg"
}

// 2. Flytta till Göteborg-terminal
POST /api/terminals/reassign-lead
{
  "lead_id": "lead-uuid",
  "terminal_id": "goteborg-terminal-uuid"
}

// 3. Tilldela till säljare i Göteborg
POST /api/assignments/assign
{
  "lead_id": "lead-uuid",
  "salesperson_id": "goteborg-salesperson-uuid"
}
```

### Scenario 4: Admin Nödtilldelning
**Problem:** Akut lead behöver tilldelas trots att säljaren inte har rätt postnummer

**Lösning (Endast Admin):**
```javascript
// Admin kan tilldela UTAN postnummer-validering
POST /api/assignments/assign
{
  "lead_id": "lead-uuid",
  "salesperson_id": "any-salesperson-uuid"
}
// ✅ Fungerar även om postnummer inte matchar!
```

---

## 🔄 Uppdaterade Endpoints

### GET /api/assignments/salespeople
**Före:** Endast terminal managers
**Efter:** Admin, Manager, Terminal Manager

**Beteende:**
- **Admin/Manager**: Ser ALLA säljare i systemet
- **Terminal Manager**: Ser bara säljare i sin terminal

### GET /api/assignments/unassigned-leads
**Före:** Endast terminal managers
**Efter:** Admin, Manager, Terminal Manager

**Beteende:**
- **Admin/Manager**: Ser ALLA otilldelade leads
- **Terminal Manager**: Ser bara otilldelade leads i sin terminal

### POST /api/assignments/assign
**Före:** Endast terminal managers
**Efter:** Admin, Manager, Terminal Manager

**Beteende:**
- **Admin**: Kan tilldela UTAN postnummer-validering
- **Manager**: Kan tilldela med postnummer-validering
- **Terminal Manager**: Kan tilldela med postnummer-validering (bara sin terminal)

---

## 📝 Databas-Ändringar

Inga nya kolumner behövs! Använder befintliga:
- `assigned_terminal_id` - Vilken terminal leadet tillhör
- `assigned_salesperson_id` - Vilken säljare leadet är tilldelat
- `assigned_at` - När tilldelning gjordes
- `assigned_by` - Vem som tilldelade

---

## 🎨 Frontend-Exempel

### Admin/Manager Dashboard
```tsx
import { LeadAssignment } from './components/terminal/LeadAssignment';
import { TerminalReassignment } from './components/admin/TerminalReassignment';

// Admin/Manager ser extra funktioner
{(user.role === 'admin' || user.role === 'manager') && (
  <>
    <LeadAssignment />  {/* Ser ALLA säljare och leads */}
    <TerminalReassignment />  {/* Kan flytta mellan terminaler */}
  </>
)}
```

### Flytta Lead mellan Terminaler (UI)
```tsx
const handleTerminalChange = async (leadId: string, newTerminalId: string) => {
  const response = await fetch('/api/terminals/reassign-lead', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      lead_id: leadId,
      terminal_id: newTerminalId
    })
  });

  if (response.ok) {
    alert('✅ Lead flyttat till ny terminal!');
    refreshLeads();
  }
};
```

---

## 🔒 Säkerhet & Validering

### Postnummer-Validering
```javascript
// Admin: INGEN validering
if (user.role === 'admin') {
  // ✅ Kan tilldela till vem som helst
}

// Manager/Terminal Manager: MED validering
if (user.role !== 'admin') {
  // ✅ Måste matcha postnummer
  if (!salesperson.postal_codes.includes(lead.postal_code)) {
    throw new Error('Postnummer matchar inte');
  }
}
```

### Terminal-Åtkomst
```javascript
// Admin/Manager: Alla terminaler
if (user.role === 'admin' || user.role === 'manager') {
  // ✅ Kan flytta mellan alla terminaler
}

// Terminal Manager: Bara sin terminal
if (user.role === 'terminal_manager') {
  // ❌ Kan INTE flytta mellan terminaler
  throw new Error('Åtkomst nekad');
}
```

---

## 📊 Audit Logging

Alla tilldelningar och flyttar loggas:

```sql
SELECT 
  al.action_type,
  al.created_at,
  u.full_name as performed_by,
  al.details
FROM activity_logs al
JOIN users u ON al.user_id = u.id
WHERE al.action_type IN ('assign_lead', 'reassign_lead_terminal', 'transfer_salesperson')
ORDER BY al.created_at DESC;
```

**Exempel logg:**
```json
{
  "action_type": "reassign_lead_terminal",
  "user_id": "admin-uuid",
  "details": {
    "lead_id": "lead-uuid",
    "from_terminal": "Stockholm",
    "to_terminal": "Göteborg",
    "reason": "Lager flyttat"
  }
}
```

---

## 🎉 Sammanfattning

### Nya Funktioner
- ✅ Admin/Manager kan tilldela leads till alla säljare
- ✅ Admin kan tilldela UTAN postnummer-begränsningar
- ✅ Flytta leads mellan terminaler
- ✅ Flytta leads mellan säljare
- ✅ Bulk-operationer för terminaler

### Nya Filer
- ✅ `server/routes/terminals.js` (200+ rader)
- ✅ `server/index.js` (uppdaterad med terminals route)
- ✅ `server/routes/assignments.js` (uppdaterad för admin/manager)

### Nya Endpoints
- ✅ GET `/api/terminals` - Lista terminaler
- ✅ POST `/api/terminals/reassign-lead` - Flytta lead till terminal
- ✅ POST `/api/terminals/bulk-reassign` - Bulk-flytta till terminal
- ✅ POST `/api/terminals/transfer-salesperson` - Flytta mellan säljare

**Status:** 🚀 **PRODUCTION-READY!**

Admin och managers har nu full kontroll över lead-tilldelningar! 🎊
