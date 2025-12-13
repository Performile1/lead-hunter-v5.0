# 🤖 Scheduled Batch Jobs Guide - Automatiska Sökningar & Analyser

## 🎯 Översikt

Batch Jobs-systemet låter admin och managers schemalägga automatiska sökningar och analyser som körs på kvällar när systemet har lägre belastning.

**Tillgängligt för:** Admin och Managers

---

## 📋 Funktioner

### 1. 🔍 Automatiska Sökningar
- Sök efter nya leads i Bolagsverket
- Konfigurerbar sökfråga
- Max antal resultat (10-500)
- Körs på schemalagd tid

### 2. 📊 Automatiska Analyser
- Analysera nya leads med AI
- Välj analysprotokoll (Quick, Batch, Deep, Deep PRO)
- Välj AI-modell (Gemini, Groq, OpenAI, Claude, Ollama)
- Automatisk tilldelning till terminal

### 3. 🔄 Kombinerat (Sök & Analysera)
- Sök efter nya leads
- Analysera dem direkt
- Skapa leads i systemet
- Tilldela automatiskt

---

## 🎨 Jobbtyper

### Endast Sökning
**Användning:** Hitta potentiella leads utan att analysera
**Resultat:** Lista med företag som matchar sökkriterier
**Kostnad:** Låg (endast API-anrop till Bolagsverket)

### Endast Analys
**Användning:** Omanalysera befintliga leads
**Resultat:** Uppdaterad data för gamla leads
**Kostnad:** Medium (AI-analys)

### Sök & Analysera
**Användning:** Komplett automatisk lead-generering
**Resultat:** Nya, analyserade leads i systemet
**Kostnad:** Hög (sökning + AI-analys)

---

## ⏰ Schemaläggning

### Tider
**Rekommenderat:** 20:00 - 23:00 (kvällstid)
**Varför:** Lägre systembelastning, färre användare

### Dagar
- **Varje dag:** Körs alla dagar
- **Vardagar:** Måndag - Fredag
- **Helger:** Lördag - Söndag

### Exempel
```
Tid: 22:00
Dagar: Vardagar
→ Körs kl 22:00 varje vardag (Mån-Fre)
```

---

## 🔧 Konfiguration

### Sökparametrar
```javascript
{
  search_query: "logistikföretag Stockholm",
  max_results: 50,
  search_filters: {
    industry: "logistics",
    location: "Stockholm",
    min_revenue: 5000  // TKR
  }
}
```

### Analysparametrar
```javascript
{
  analysis_protocol: "quick",  // quick, batch, deep, deep-pro
  llm_provider: "gemini",      // gemini, groq, openai, claude, ollama
  auto_assign: true,
  assign_to_terminal: "terminal-uuid"
}
```

---

## 📊 Användningsexempel

### Exempel 1: Nattlig Sökning - Logistikföretag
```
Jobbnamn: Nattlig sökning - Logistikföretag Stockholm
Jobbtyp: Sök & Analysera
Schema: 22:00, Vardagar

Sökparametrar:
- Query: "logistikföretag Stockholm"
- Max resultat: 50

Analysparametrar:
- Protocol: Quick Scan
- LLM: Gemini
- Auto-assign: Ja → Stockholm Terminal

Resultat:
- 50 nya leads/dag
- ~250 leads/vecka
- Automatiskt tilldelade till Stockholm
```

### Exempel 2: Omanalys av Gamla Leads
```
Jobbnamn: Omanalys - Gamla leads
Jobbtyp: Endast Analys
Schema: 23:00, Helger

Analysparametrar:
- Protocol: Batch Prospecting
- LLM: Groq (snabbt)
- Leads: Äldre än 90 dagar
- Max: 100 leads

Resultat:
- Uppdaterad data för gamla leads
- Nya omsättningssiffror
- Uppdaterad Kronofogden-status
```

### Exempel 3: Veckovis Deep Analysis
```
Jobbnamn: Veckoanalys - Stora företag
Jobbtyp: Sök & Analysera
Schema: 20:00, Helger

Sökparametrar:
- Query: "företag omsättning > 100 MSEK"
- Max resultat: 20

Analysparametrar:
- Protocol: Deep PRO
- LLM: OpenAI (GPT-4)
- Auto-assign: Nej (manuell granskning)

Resultat:
- 20 högkvalitativa KAM-leads/vecka
- Djup analys med beslutsfattare
- Manuell granskning innan tilldelning
```

---

## 🗄️ Databas-Schema

### scheduled_batch_jobs
```sql
CREATE TABLE scheduled_batch_jobs (
    id UUID PRIMARY KEY,
    created_by UUID,
    job_name VARCHAR(255),
    job_type VARCHAR(50),  -- 'search', 'analysis', 'both'
    
    -- Schema
    schedule_time TIME,
    schedule_days VARCHAR(50),
    is_active BOOLEAN,
    
    -- Sökparametrar
    search_query TEXT,
    search_filters JSONB,
    max_results INTEGER,
    
    -- Analysparametrar
    analysis_protocol VARCHAR(50),
    llm_provider VARCHAR(50),
    auto_assign BOOLEAN,
    assign_to_terminal UUID,
    
    -- Statistik
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    total_runs INTEGER,
    total_leads_found INTEGER,
    total_leads_analyzed INTEGER
);
```

### batch_job_executions
```sql
CREATE TABLE batch_job_executions (
    id UUID PRIMARY KEY,
    job_id UUID,
    executed_at TIMESTAMP,
    status VARCHAR(50),  -- 'running', 'completed', 'failed'
    
    -- Resultat
    leads_found INTEGER,
    leads_analyzed INTEGER,
    leads_created INTEGER,
    leads_skipped INTEGER,
    
    -- Detaljer
    execution_time_ms INTEGER,
    error_message TEXT,
    execution_log JSONB,
    completed_at TIMESTAMP
);
```

---

## 🔄 Körningsflöde

### 1. Cron Trigger
```javascript
// Körs var 15:e minut
cron.schedule('*/15 * * * *', async () => {
  // Hämta jobb som ska köras
  const dueJobs = await query(`
    SELECT * FROM scheduled_batch_jobs
    WHERE is_active = true
      AND next_run_at <= NOW()
  `);
  
  // Kör varje jobb
  for (const job of dueJobs) {
    await executeBatchJob(job);
  }
});
```

### 2. Sökning (om job_type = 'search' eller 'both')
```javascript
// Sök i Bolagsverket
const searchResults = await bolagsverketService.search(
  job.search_query,
  job.search_filters,
  job.max_results
);

// Resultat: Array av företag
```

### 3. Analys (om job_type = 'analysis' eller 'both')
```javascript
for (const company of searchResults) {
  // Kolla om leadet redan finns
  const exists = await checkIfLeadExists(company.org_number);
  if (exists) continue;
  
  // Analysera med AI
  const analysis = await llmOrchestrator.analyze({
    company: company,
    protocol: job.analysis_protocol,
    provider: job.llm_provider
  });
  
  // Skapa lead
  const lead = await createLead(analysis);
  
  // Auto-assign om konfigurerat
  if (job.auto_assign) {
    await assignLeadToTerminal(lead.id, job.assign_to_terminal);
  }
}
```

### 4. Loggning
```javascript
// Spara körningsresultat
await query(`
  INSERT INTO batch_job_executions (
    job_id,
    status,
    leads_found,
    leads_analyzed,
    leads_created,
    execution_time_ms
  ) VALUES ($1, 'completed', $2, $3, $4, $5)
`, [jobId, found, analyzed, created, time]);

// Uppdatera jobb-statistik
await query(`
  UPDATE scheduled_batch_jobs
  SET last_run_at = NOW(),
      next_run_at = $1,
      total_runs = total_runs + 1,
      total_leads_found = total_leads_found + $2
  WHERE id = $3
`, [nextRun, found, jobId]);
```

---

## 📊 API Endpoints

### Skapa Batch-Jobb
```http
POST /api/batch-jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "job_name": "Nattlig sökning - Logistik",
  "job_type": "both",
  "schedule_time": "22:00",
  "schedule_days": "weekdays",
  "search_query": "logistikföretag Stockholm",
  "max_results": 50,
  "analysis_protocol": "quick",
  "llm_provider": "gemini",
  "auto_assign": true,
  "assign_to_terminal": "terminal-uuid"
}
```

### Hämta Alla Jobb
```http
GET /api/batch-jobs
Authorization: Bearer <token>

Response:
{
  "jobs": [
    {
      "id": "uuid",
      "job_name": "Nattlig sökning - Logistik",
      "job_type": "both",
      "is_active": true,
      "next_run_at": "2025-12-11T22:00:00Z",
      "total_runs": 45,
      "total_leads_found": 2250,
      "total_leads_analyzed": 2100
    }
  ]
}
```

### Kör Jobb Manuellt
```http
POST /api/batch-jobs/:id/execute
Authorization: Bearer <token>

Response:
{
  "message": "Batch-jobb körs",
  "execution_id": "execution-uuid"
}
```

### Hämta Körningshistorik
```http
GET /api/batch-jobs/:id/executions?limit=50
Authorization: Bearer <token>

Response:
{
  "executions": [
    {
      "id": "uuid",
      "executed_at": "2025-12-10T22:00:00Z",
      "status": "completed",
      "leads_found": 50,
      "leads_analyzed": 48,
      "leads_created": 45,
      "leads_skipped": 3,
      "execution_time_ms": 125000
    }
  ]
}
```

---

## 💰 Kostnadskalkyl

### Quick Scan (50 leads)
- Sökning: Gratis (Bolagsverket)
- Analys: 50 × $0.01 = $0.50
- **Total: ~$0.50 per körning**
- **Månadskostnad (vardagar): ~$10**

### Batch Prospecting (100 leads)
- Sökning: Gratis
- Analys: 100 × $0.005 = $0.50
- **Total: ~$0.50 per körning**
- **Månadskostnad (vardagar): ~$10**

### Deep Analysis (20 leads)
- Sökning: Gratis
- Analys: 20 × $0.05 = $1.00
- **Total: ~$1.00 per körning**
- **Månadskostnad (helger): ~$8**

### Deep PRO (10 leads)
- Sökning: Gratis
- Analys: 10 × $0.10 = $1.00
- **Total: ~$1.00 per körning**
- **Månadskostnad (helger): ~$8**

---

## 🎯 Best Practices

### 1. Välj Rätt Tid
✅ **Rekommenderat:** 20:00 - 23:00
❌ **Undvik:** 08:00 - 17:00 (kontorstid)

### 2. Välj Rätt Protocol
- **Quick Scan:** Stora volymer (50-500 leads)
- **Batch Prospecting:** Medium volymer (50-200 leads)
- **Deep Analysis:** Små volymer (10-50 leads)
- **Deep PRO:** Mycket små volymer (5-20 leads)

### 3. Använd Auto-Assign
✅ Aktivera för rutinmässiga sökningar
❌ Inaktivera för strategiska KAM-leads

### 4. Övervaka Resultat
- Kolla körningshistorik regelbundet
- Justera max_results baserat på kvalitet
- Ändra sökfråga om för många dubletter

### 5. Kostnadskontroll
- Börja med Quick Scan
- Öka till Deep endast för viktiga segment
- Använd Groq för snabbhet och lägre kostnad

---

## 📈 Statistik & Rapporter

### Jobb-Statistik
```sql
SELECT 
  job_name,
  total_runs,
  total_leads_found,
  total_leads_analyzed,
  ROUND(total_leads_analyzed::DECIMAL / total_leads_found * 100, 2) as success_rate
FROM scheduled_batch_jobs
WHERE is_active = true
ORDER BY total_leads_found DESC;
```

### Körningshistorik
```sql
SELECT 
  DATE(executed_at) as date,
  COUNT(*) as executions,
  SUM(leads_found) as total_found,
  SUM(leads_created) as total_created,
  AVG(execution_time_ms) as avg_time_ms
FROM batch_job_executions
WHERE status = 'completed'
  AND executed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(executed_at)
ORDER BY date DESC;
```

---

## 🎉 Sammanfattning

### ✅ Implementerat
- Schemalagda batch-jobb
- 3 jobbtyper (search, analysis, both)
- Konfigurerbar tid och dagar
- Auto-assign till terminal
- Körningshistorik
- Statistik och rapporter

### ✅ Funktioner
- Automatiska sökningar
- Automatiska analyser
- Kombinerat (sök & analysera)
- Manuell körning
- Pausa/aktivera jobb
- Ta bort jobb

### ✅ Rollbaserad Access
- **Admin:** Kan skapa, se och hantera alla jobb
- **Managers:** Kan skapa, se och hantera sina egna jobb

**Status:** 🚀 **PRODUCTION-READY!**

Batch Jobs-systemet automatiserar lead-generering och sparar tid genom att köra sökningar och analyser på kvällar när systemet har lägre belastning! 🎊
