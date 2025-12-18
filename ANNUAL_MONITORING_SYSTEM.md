# 📊 Annual Financial Monitoring System

## Översikt

Automatiskt system som kör djupanalys på leads när vi närmar oss bokslut (Q4: Oktober-December). Systemet kollar:
- 📈 Uppdaterad omsättning från Allabolag
- ⚖️ Kronofogden (betalningsanmärkningar)
- 💳 Kreditrapport (UC/Creditsafe)
- 🏛️ Skatteverket (F-skatt, moms, skatteskulder)
- 🔍 Google-sökning efter betalningsanmärkningar

---

## 🎯 När körs analysen?

### **Automatisk trigger:**
```javascript
// Q4: Oktober (månad 9), November (10), December (11)
if (month >= 9 && month <= 11) {
  // Kör årlig djupanalys
}
```

### **Manuell trigger:**
- SuperAdmin kan köra batch-analys när som helst
- Tenant kan begära djupanalys på specifikt lead

---

## 🔍 Vad kollas?

### **1. Omsättning (Allabolag)**
```json
{
  "latest_revenue_year": "2023",
  "latest_revenue_tkr": 150000,
  "previous_revenue_year": "2022",
  "previous_revenue_tkr": 120000,
  "revenue_change_percent": 25,
  "trend": "increasing"
}
```

**Risk-påverkan:**
- Minskande omsättning: -15 poäng
- Stabil omsättning: -5 poäng
- Ökande omsättning: 0 poäng

---

### **2. Kronofogden**
```json
{
  "has_records": false,
  "active_cases": 0,
  "total_debt_sek": 0,
  "status": "clean"
}
```

**Risk-påverkan:**
- Har ärenden: -30 poäng
- Skuld: -20 poäng (max, skalas med skuld)

---

### **3. Kreditrapport (UC/Creditsafe)**
```json
{
  "credit_rating": "AA",
  "credit_score": 85,
  "payment_remarks": 0,
  "credit_limit_sek": 500000,
  "bankruptcy_risk": "low",
  "recommendation": "approved"
}
```

**Risk-påverkan:**
- Kreditbetyg C/D: -25 poäng
- Kreditbetyg B: -10 poäng
- Betalningsanmärkningar: -10 poäng per anmärkning

---

### **4. Skatteverket**
```json
{
  "f_tax_registered": true,
  "vat_registered": true,
  "employer_registered": true,
  "tax_debt_sek": 0,
  "status": "compliant"
}
```

**Risk-påverkan:**
- Skatteskuld: -20 poäng
- Saknar F-skatt: -5 poäng

---

### **5. Betalningsanmärkningar (Google)**
```json
{
  "found_remarks": false,
  "sources": [],
  "severity": "none",
  "summary": "Inga betalningsanmärkningar hittades"
}
```

**Söker efter:**
- "företagsnamn betalningsanmärkning"
- "företagsnamn konkurs"
- "företagsnamn obetalda fakturor"
- "org.nummer betalningsproblem"

**Risk-påverkan:**
- Hittade anmärkningar: -15 poäng

---

## 📊 Risk Scoring

### **Beräkning:**
```javascript
Start: 100 poäng (låg risk)

- Minskande omsättning: -15
- Kronofogden-ärenden: -30
- Skuld hos Kronofogden: -20 (max)
- Dåligt kreditbetyg (C/D): -25
- Betalningsanmärkningar: -10 per st
- Skatteskuld: -20
- Saknar F-skatt: -5
- Google-anmärkningar: -15

Slutlig score: 0-100
```

### **Risk Levels:**
```
80-100: LOW      ✅ Låg risk, säker kund
60-79:  MEDIUM   ⚠️ Medel risk, kräver övervakning
40-59:  HIGH     🔴 Hög risk, försiktig kontakt
0-39:   CRITICAL ❌ Kritisk risk, undvik
```

---

## 🗄️ Databas Schema

### **lead_deep_analysis tabell:**
```sql
CREATE TABLE lead_deep_analysis (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  analyzed_at TIMESTAMP,
  
  -- Check results
  revenue_check JSONB,
  kronofogden_check JSONB,
  credit_check JSONB,
  tax_check JSONB,
  payment_remarks_check JSONB,
  
  -- Risk scoring
  risk_score INTEGER DEFAULT 100,
  risk_level VARCHAR(20) DEFAULT 'low',
  
  UNIQUE(lead_id)
);
```

### **leads tabell (ny kolumn):**
```sql
ALTER TABLE leads 
ADD COLUMN last_deep_analysis_at TIMESTAMP;
```

---

## 🚀 Användning

### **1. Automatisk batch-analys (Cronjob)**
```javascript
// Kör varje dag i Q4
import { runAnnualMonitoringBatch } from './annualMonitoringService.js';

// För alla tenants
const tenants = await getTenants();
for (const tenant of tenants) {
  await runAnnualMonitoringBatch(tenant.id);
}
```

### **2. Manuell analys på specifikt lead**
```javascript
import { runDeepAnalysis } from './annualMonitoringService.js';

const lead = await getLeadById(leadId);
const analysis = await runDeepAnalysis(lead);

console.log(`Risk score: ${analysis.risk_score}`);
console.log(`Risk level: ${analysis.risk_level}`);
```

### **3. Hämta leads som behöver analys**
```javascript
import { getLeadsNeedingAnnualReview } from './annualMonitoringService.js';

const leads = await getLeadsNeedingAnnualReview(tenantId);
// Returnerar leads som inte analyserats senaste året
```

---

## 📋 API Endpoints

### **GET /api/leads/:id/deep-analysis**
Hämta senaste djupanalys för ett lead
```json
{
  "success": true,
  "analysis": {
    "lead_id": "uuid",
    "analyzed_at": "2024-12-18T10:00:00Z",
    "risk_score": 85,
    "risk_level": "low",
    "checks": {
      "revenue": {...},
      "kronofogden": {...},
      "credit": {...},
      "tax": {...},
      "payment_remarks": {...}
    }
  }
}
```

### **POST /api/leads/:id/deep-analysis**
Kör ny djupanalys på ett lead
```json
{
  "success": true,
  "message": "Djupanalys startad",
  "job_id": "uuid"
}
```

### **POST /api/admin/annual-monitoring/batch**
Kör batch-analys för alla leads (SuperAdmin)
```json
{
  "tenant_id": "uuid",
  "force": false
}
```

---

## 🎨 UI Integration

### **Lead Card - Risk Badge**
```tsx
{analysis && (
  <div className={`risk-badge ${analysis.risk_level}`}>
    <Shield className="w-4 h-4" />
    Risk: {analysis.risk_level.toUpperCase()}
    <span className="score">{analysis.risk_score}/100</span>
  </div>
)}
```

### **Deep Analysis Tab**
```tsx
<div className="deep-analysis-tab">
  <h3>Årlig Djupanalys</h3>
  
  {/* Omsättning */}
  <div className="check-section">
    <TrendingUp className="w-5 h-5" />
    <h4>Omsättning</h4>
    <p>{analysis.checks.revenue.latest_revenue_tkr} TSEK</p>
    <span className={analysis.checks.revenue.trend}>
      {analysis.checks.revenue.trend}
    </span>
  </div>
  
  {/* Kronofogden */}
  <div className="check-section">
    <AlertTriangle className="w-5 h-5" />
    <h4>Kronofogden</h4>
    <p>{analysis.checks.kronofogden.status}</p>
  </div>
  
  {/* Kreditbetyg */}
  <div className="check-section">
    <Shield className="w-5 h-5" />
    <h4>Kreditbetyg</h4>
    <p>{analysis.checks.credit.credit_rating}</p>
  </div>
  
  {/* Skatteverket */}
  <div className="check-section">
    <Building className="w-5 h-5" />
    <h4>Skatteverket</h4>
    <p>{analysis.checks.tax.status}</p>
  </div>
  
  {/* Betalningsanmärkningar */}
  <div className="check-section">
    <Search className="w-5 h-5" />
    <h4>Betalningsanmärkningar</h4>
    <p>{analysis.checks.payment_remarks.summary}</p>
  </div>
</div>
```

---

## ⚙️ Konfiguration

### **Environment Variables**
```env
# AI för analys
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here

# Allabolag (om API finns)
ALLABOLAG_API_KEY=your_key_here

# UC/Creditsafe (om API finns)
UC_API_KEY=your_key_here
CREDITSAFE_API_KEY=your_key_here
```

### **Tenant Settings**
```sql
ALTER TABLE tenant_settings
ADD COLUMN enable_annual_monitoring BOOLEAN DEFAULT TRUE,
ADD COLUMN monitoring_frequency_days INTEGER DEFAULT 365;
```

---

## 🔄 Workflow

### **Årlig Monitoring Workflow:**
```
1. Cronjob körs varje dag i Q4
   ↓
2. Kolla vilka leads som behöver analys
   (last_deep_analysis_at > 1 år sedan)
   ↓
3. För varje lead:
   a. Hämta omsättning från Allabolag
   b. Kolla Kronofogden
   c. Hämta kreditrapport
   d. Kolla Skatteverket
   e. Google-sök betalningsanmärkningar
   ↓
4. Beräkna risk score
   ↓
5. Spara i lead_deep_analysis
   ↓
6. Uppdatera last_deep_analysis_at
   ↓
7. Skicka notifikation om hög risk
```

---

## 📧 Notifikationer

### **Hög risk upptäckt:**
```
Subject: ⚠️ Hög risk upptäckt - RevolutionRace AB

Djupanalys visar hög risk för RevolutionRace AB:

Risk Score: 45/100 (HIGH)

Upptäckta problem:
- Minskande omsättning: -15%
- 2 betalningsanmärkningar
- Kreditbetyg: BBB

Rekommendation: Kontakta med försiktighet

[Visa fullständig analys]
```

---

## 🧪 Testing

### **Test med mock data:**
```javascript
const mockLead = {
  id: 'test-uuid',
  company_name: 'Test AB',
  org_number: '556000-0000',
  domain: 'test.se'
};

const analysis = await runDeepAnalysis(mockLead);
console.log(analysis);
```

---

## 📈 Metrics

### **Spåra:**
- Antal leads analyserade per månad
- Genomsnittlig risk score
- Antal high/critical risk leads
- Tid per analys
- API-kostnader

### **Dashboard:**
```
┌─────────────────────────────────────┐
│ Årlig Monitoring - Statistik       │
├─────────────────────────────────────┤
│ Analyserade leads: 250              │
│ Genomsnittlig risk: 72 (MEDIUM)    │
│ High risk: 15 (6%)                  │
│ Critical risk: 3 (1.2%)             │
│ Senaste batch: 2024-12-18 10:00    │
└─────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

- [x] Skapa annualMonitoringService.js
- [x] Skapa databas-migration
- [x] Implementera risk scoring
- [ ] Skapa API endpoints
- [ ] Integrera i lead card UI
- [ ] Skapa deep analysis tab
- [ ] Lägg till cronjob
- [ ] Implementera notifikationer
- [ ] Testa med riktiga leads
- [ ] Dokumentera för användare

---

## 🚦 Nästa Steg

1. **Kör migration:**
   ```bash
   psql -d lead_hunter -f server/migrations/add_deep_analysis_table.sql
   ```

2. **Testa service:**
   ```javascript
   import { runDeepAnalysis } from './annualMonitoringService.js';
   const result = await runDeepAnalysis(testLead);
   ```

3. **Integrera i UI:**
   - Lägg till deep analysis tab i EnhancedLeadCard
   - Visa risk badge i lead cards
   - Lägg till filter för risk level

4. **Sätt upp cronjob:**
   - Kör dagligen i Q4
   - Batch-storlek: 50 leads per körning
   - Vänta 2s mellan anrop

Vill du att jag implementerar något specifikt härnäst? 🚀
