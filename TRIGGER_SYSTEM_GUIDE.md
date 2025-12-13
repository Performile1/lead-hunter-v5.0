# 🔔 Trigger System Guide - Lead Bevakning

## 🎯 Översikt

Trigger-systemet låter användare bevaka leads för specifika händelser och få automatiska notifikationer när något viktigt händer.

**Tillgängligt för:** Alla användare (Säljare, Terminal Chefer, Managers, Admin)

---

## 📋 Tillgängliga Triggers

### 1. 📈 Ökad Omsättning
**Beskrivning:** Notifiera när företagets omsättning ökar

**Tröskelvärde:** 5-50% (konfigurerbart)

**Severity:**
- 📗 Low: 5-25% ökning
- 📙 Medium: 25-50% ökning
- 📕 High: 50%+ ökning

**Användningsfall:**
- Identifiera växande kunder
- Upptäcka uppgraderingsmöjligheter
- Segment-uppgradering (TS → FS → KAM)

**Exempel:**
```
Företag: ABC Logistics AB
Gammal omsättning: 10,000 TKR
Ny omsättning: 15,000 TKR
Förändring: +50%
→ Notifikation skickas (High severity)
```

---

### 2. 📉 Minskad Omsättning
**Beskrivning:** Notifiera när företagets omsättning minskar

**Tröskelvärde:** 5-50% (konfigurerbart)

**Severity:**
- 📗 Low: 5-25% minskning
- 📙 Medium: 25-50% minskning
- 📕 High: 50%+ minskning

**Användningsfall:**
- Identifiera kunder i svårigheter
- Förebygga churn
- Erbjuda support

**Exempel:**
```
Företag: XYZ Transport AB
Gammal omsättning: 20,000 TKR
Ny omsättning: 12,000 TKR
Förändring: -40%
→ Notifikation skickas (Medium severity)
```

---

### 3. ⚠️ Konkurs
**Beskrivning:** Notifiera omedelbart vid konkurs

**Severity:** 🚨 Critical

**Detektering:**
- Kronofogden-check
- Legal status
- Nyckelord: "konkurs", "bankruptcy", "insolvent"

**Användningsfall:**
- Stoppa leveranser
- Kräva förskottsbetalning
- Riskhantering

**Exempel:**
```
Företag: Failed Company AB
Status: Konkurs upptäckt hos Kronofogden
→ Notifikation skickas OMEDELBART (Critical)
```

---

### 4. 🔴 Likvidation
**Beskrivning:** Notifiera vid likvidation/avveckling

**Severity:** 🚨 Critical

**Detektering:**
- Legal status
- Nyckelord: "likvidation", "liquidation", "avveckling"

**Användningsfall:**
- Stoppa nya affärer
- Säkra utestående fordringar
- Hitta ersättningskund

**Exempel:**
```
Företag: Closing Business AB
Status: Under likvidation
→ Notifikation skickas (Critical)
```

---

### 5. 💳 Betalningsanmärkning
**Beskrivning:** Notifiera vid betalningsanmärkningar

**Severity:** 📕 High

**Detektering:**
- Kronofogden-check
- Kreditbetyg
- Nyckelord: "betalningsanmärkning", "payment remark", "skuld"

**Användningsfall:**
- Justera kreditgräns
- Kräva förskottsbetalning
- Riskbedömning

**Exempel:**
```
Företag: Risky Customer AB
Status: Betalningsanmärkning upptäckt
→ Notifikation skickas (High)
```

---

### 6. 📦 Lagerflytt
**Beskrivning:** Notifiera vid byte av lageradress

**Severity:** 📙 Medium

**Detektering:**
- Warehouse address ändrad
- Address ändrad

**Användningsfall:**
- Uppdatera leveransadress
- Kontakta kund för bekräftelse
- Justera logistik

**Exempel:**
```
Företag: Moving Company AB
Gammal adress: Industrivägen 1, Stockholm
Ny adress: Logistikvägen 5, Göteborg
→ Notifikation skickas (Medium)
```

---

### 7. 📰 Nyheter
**Beskrivning:** Notifiera vid nya nyheter om företaget

**Severity:** 📗 Low

**Detektering:**
- Latest news ändrad
- Nya artiklar

**Användningsfall:**
- Hålla sig uppdaterad
- Identifiera säljmöjligheter
- Relationship management

**Exempel:**
```
Företag: Growing Startup AB
Nyhet: "Företaget expanderar till Norge med ny terminal"
→ Notifikation skickas (Low)
```

---

### 8. 🔄 Segmentändring
**Beskrivning:** Notifiera vid automatisk segmentändring

**Severity:** 
- 📙 Medium: Uppgradering (DM → TS → FS → KAM)
- 📗 Low: Nedgradering

**Detektering:**
- Segment ändrat baserat på omsättning

**Användningsfall:**
- Tilldela ny säljare
- Justera servicenivå
- Uppdatera avtal

**Exempel:**
```
Företag: Growing Business AB
Gammalt segment: TS
Nytt segment: FS
→ Notifikation skickas (Medium - Uppgradering)
```

---

## 🎨 Användning

### Skapa Bevakning med Triggers

```typescript
// Frontend - WatchForm.tsx
const [triggers, setTriggers] = useState({
  revenue_increase: true,    // Bevaka ökad omsättning
  revenue_decrease: true,    // Bevaka minskad omsättning
  bankruptcy: true,          // Bevaka konkurs
  liquidation: true,         // Bevaka likvidation
  payment_remarks: true,     // Bevaka betalningsanmärkningar
  warehouse_move: false,     // Bevaka lagerflytt
  news: false,               // Bevaka nyheter
  segment_change: true       // Bevaka segmentändring
});

const [revenueThreshold, setRevenueThreshold] = useState(10); // 10%

// Skicka till backend
await fetch('/api/monitoring/watch', {
  method: 'POST',
  body: JSON.stringify({
    lead_id: leadId,
    interval_days: 30,
    triggers: triggers,
    revenue_change_threshold_percent: revenueThreshold
  })
});
```

### Backend - Spara Triggers

```javascript
// server/routes/monitoring.js
INSERT INTO lead_monitoring (
  lead_id,
  user_id,
  trigger_revenue_increase,
  trigger_revenue_decrease,
  trigger_bankruptcy,
  trigger_liquidation,
  trigger_payment_remarks,
  trigger_warehouse_move,
  trigger_news,
  trigger_segment_change,
  revenue_change_threshold_percent
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
```

### Cron Job - Detektera Triggers

```javascript
// server/cron/monitoring.js
import { detectTriggers } from '../utils/triggerDetection.js';

// Kör varje timme
const triggeredEvents = detectTriggers(watch, oldLead, newLead);

// Skicka email om triggers aktiverades
if (triggeredEvents.length > 0) {
  await sendMonitoringEmail(watch, { triggered_events: triggeredEvents });
}
```

---

## 📊 Severity Levels

### 🚨 Critical
**Färg:** Röd (#D40511)
**Triggers:** Konkurs, Likvidation
**Action:** Omedelbar åtgärd krävs

### 📕 High
**Färg:** Orange (#FF6600)
**Triggers:** Betalningsanmärkning, Stor omsättningsminskning (50%+)
**Action:** Snabb uppföljning rekommenderas

### 📙 Medium
**Färg:** Gul (#FFCC00)
**Triggers:** Lagerflytt, Segmentändring (uppgradering), Måttlig omsättningsändring (25-50%)
**Action:** Uppföljning inom kort

### 📗 Low
**Färg:** Blå (#0066CC)
**Triggers:** Nyheter, Liten omsättningsändring (5-25%)
**Action:** Information, ingen brådska

---

## 📧 Email-Notifikationer

### Email-Format

```html
Subject: 🚨 Lead-bevakning: ABC Logistics AB

Företag: ABC Logistics AB
Org.nummer: 556123-4567
Segment: FS
Severity: CRITICAL

Upptäckta Händelser:
⚠️ KONKURS
  Konkurs upptäckt hos Kronofogden

📉 MINSKAD OMSÄTTNING
  Omsättningen har minskat med 45% (20,000 → 11,000 TKR)
  Förändring: -45%

Kontrollerad: 2025-12-10 23:00
```

### Email-Inställningar

**Mottagare:** Konfigurerbar per bevakning
**Frekvens:** Vid varje trigger-aktivering
**Format:** HTML med DHL-branding

---

## 🗄️ Databas-Schema

### lead_monitoring
```sql
CREATE TABLE lead_monitoring (
    id UUID PRIMARY KEY,
    lead_id UUID,
    user_id UUID,
    
    -- Triggers
    trigger_revenue_increase BOOLEAN DEFAULT false,
    trigger_revenue_decrease BOOLEAN DEFAULT false,
    trigger_bankruptcy BOOLEAN DEFAULT false,
    trigger_liquidation BOOLEAN DEFAULT false,
    trigger_payment_remarks BOOLEAN DEFAULT false,
    trigger_warehouse_move BOOLEAN DEFAULT false,
    trigger_news BOOLEAN DEFAULT false,
    trigger_segment_change BOOLEAN DEFAULT false,
    
    -- Tröskelvärden
    revenue_change_threshold_percent INTEGER DEFAULT 10
);
```

### trigger_events
```sql
CREATE TABLE trigger_events (
    id UUID PRIMARY KEY,
    monitoring_id UUID,
    lead_id UUID,
    trigger_type VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    change_percentage DECIMAL(10,2),
    severity VARCHAR(20),
    created_at TIMESTAMP
);
```

---

## 🎯 Användningsscenarier

### Scenario 1: Växande Kund
```
1. Säljare skapar bevakning på TS-kund
2. Aktiverar: revenue_increase (threshold: 20%)
3. Efter 30 dagar: Omsättning ökat 35%
4. Trigger aktiveras → Email skickas
5. Säljare kontaktar kund för uppgradering till FS
```

### Scenario 2: Risk-Hantering
```
1. Manager skapar bevakning på alla KAM-kunder
2. Aktiverar: bankruptcy, liquidation, payment_remarks
3. Kund får betalningsanmärkning
4. Trigger aktiveras → Email skickas (High severity)
5. Manager justerar kreditgräns omedelbart
```

### Scenario 3: Lagerflytt
```
1. Terminal chef bevakar kunder i sitt område
2. Aktiverar: warehouse_move
3. Kund flyttar lager till annat område
4. Trigger aktiveras → Email skickas
5. Lead flyttas till ny terminal
```

### Scenario 4: Nyhetsbevakning
```
1. Säljare bevakar potentiella kunder
2. Aktiverar: news
3. Företag i nyheterna: "Expanderar till Norge"
4. Trigger aktiveras → Email skickas
5. Säljare kontaktar för säljmöjlighet
```

---

## 🔧 Konfiguration

### Tröskelvärden

**Revenue Change:**
- Min: 5%
- Max: 50%
- Default: 10%
- Steg: 5%

**Intervall:**
- Min: 7 dagar
- Max: 365 dagar
- Rekommenderat: 30 dagar

### Rollbaserad Access

**Alla roller kan:**
- ✅ Skapa bevakningar på sina egna leads
- ✅ Välja vilka triggers som ska aktiveras
- ✅ Konfigurera tröskelvärden
- ✅ Ta emot email-notifikationer

**Admin kan:**
- ✅ Skapa bevakningar på alla leads
- ✅ Se alla triggers i systemet
- ✅ Konfigurera globala inställningar

---

## 📊 Statistik & Rapporter

### Trigger-Statistik
```sql
-- Mest aktiverade triggers
SELECT 
  trigger_type,
  COUNT(*) as activation_count,
  AVG(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_rate
FROM trigger_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY trigger_type
ORDER BY activation_count DESC;
```

### Severity-Fördelning
```sql
-- Fördelning av severity
SELECT 
  severity,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM trigger_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY severity;
```

---

## 🎉 Sammanfattning

### ✅ Implementerat
- 8 olika triggers
- 4 severity-nivåer
- Email-notifikationer
- Konfiguerbara tröskelvärden
- Rollbaserad access
- Detaljerad loggning
- Automatisk körning (cron)

### ✅ Triggers
1. 📈 Ökad Omsättning
2. 📉 Minskad Omsättning
3. ⚠️ Konkurs
4. 🔴 Likvidation
5. 💳 Betalningsanmärkning
6. 📦 Lagerflytt
7. 📰 Nyheter
8. 🔄 Segmentändring

### ✅ Funktioner
- Konfigurerbar per bevakning
- Automatisk detektering
- Email med HTML-formatting
- Severity-baserad prioritering
- Komplett historik
- Statistik och rapporter

**Status:** 🚀 **PRODUCTION-READY!**

Trigger-systemet ger användare full kontroll över vad de vill bevaka och när de vill bli notifierade! 🎊
