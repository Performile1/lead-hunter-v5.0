# 🔬 Analysprotokoll Guide - Alla Kan Söka & Analysera

## 🎯 Översikt

**ALLA användare** kan nu använda alla 4 analysprotokoll för att söka och analysera leads:

1. **Djupanalys PRO** - Högsta kvalitet med web grounding
2. **Djupanalys Standard** - Bra kvalitet, snabbare
3. **Snabbskanning** - Snabb översikt
4. **Batch Prospecting** - Hitta många leads samtidigt

---

## 📋 Protokoll i Detalj

### 1. Djupanalys PRO (deep_pro)

**Bäst för:** Viktiga kunder, stora affärer, kvalitet över kvantitet

**Funktioner:**
- ✅ 3-stegs sekventiell analys
- ✅ Web grounding för verifierad data
- ✅ Kronofogden-kontroll automatiskt
- ✅ Org.nummer validering (exakt 10 siffror)
- ✅ Beslutsfattare med LinkedIn-profiler
- ✅ Fullständig finansiell analys
- ✅ Tech stack analys (ecommerce-plattform, etc.)
- ✅ Nyheter och omdömen

**Tid:** ~60 sekunder
**Kostnad:** ~$0.001 per analys
**LLM:** Gemini 2.0 Flash med grounding

**API:**
```http
POST /api/analysis/deep-pro
Authorization: Bearer {token}
Content-Type: application/json

{
  "company_name": "Test AB",
  "geo_area": "Stockholm",
  "org_number": "5569876543"
}
```

**Frontend:**
```typescript
import { generateDeepDiveSequential } from './services/geminiService';

const result = await generateDeepDiveSequential(
  formData,
  (partialLead) => {
    // Uppdatera UI med delresultat
    console.log('Steg klart:', partialLead);
  }
);
```

---

### 2. Djupanalys Standard (deep)

**Bäst för:** Daglig prospektering, balans mellan kvalitet och hastighet

**Funktioner:**
- ✅ 3-stegs analys
- ✅ Grundläggande företagsdata
- ✅ Finansiell översikt
- ✅ Beslutsfattare
- ✅ Logistikprofil
- ✅ Snabbare än PRO (ingen grounding)

**Tid:** ~45 sekunder
**Kostnad:** ~$0.0008 per analys
**LLM:** Gemini 2.0 Flash

**API:**
```http
POST /api/analysis/deep
Authorization: Bearer {token}
Content-Type: application/json

{
  "company_name": "Företag AB",
  "geo_area": "Göteborg"
}
```

---

### 3. Snabbskanning (quick)

**Bäst för:** Initial screening, kvalificering, stora volymer

**Funktioner:**
- ✅ Grundläggande företagsinfo
- ✅ Segment-klassificering (FS/TS/KAM/DM)
- ✅ Snabb omsättningsuppskattning
- ✅ Mycket snabb
- ✅ Låg kostnad

**Tid:** ~15 sekunder
**Kostnad:** ~$0.0003 per analys
**LLM:** Gemini 2.0 Flash

**API:**
```http
POST /api/analysis/quick
Authorization: Bearer {token}
Content-Type: application/json

{
  "company_name": "Snabb AB"
}
```

**Frontend:**
```typescript
import { generateQuickScan } from './services/geminiService';

const result = await generateQuickScan(formData);
```

---

### 4. Batch Prospecting (batch_prospecting)

**Bäst för:** Hitta många leads samtidigt, marknadsundersökning

**Funktioner:**
- ✅ Hitta 10-100 leads samtidigt
- ✅ Geografisk filtrering
- ✅ Finansiell filtrering (omsättning)
- ✅ Trigger-baserad sökning (expansion, nytt lager, etc.)
- ✅ Automatisk segmentering
- ✅ Parallell bearbetning

**Tid:** Varierar (2 sek/lead)
**Kostnad:** ~$0.0005 per lead
**LLM:** Gemini 2.0 Flash

**API:**
```http
POST /api/analysis/batch-prospecting
Authorization: Bearer {token}
Content-Type: application/json

{
  "geo_area": "Stockholm",
  "financial_scope": "5-50 MSEK",
  "lead_count": 20,
  "triggers": ["expansion", "new_warehouse"]
}
```

**Frontend:**
```typescript
import { generateBatchProspecting } from './services/geminiService';

const results = await generateBatchProspecting(
  formData,
  (lead) => {
    // Lägg till lead i lista
    addLeadToList(lead);
  }
);
```

---

## 🔌 API Endpoints

### GET /api/analysis/protocols
Hämta alla tillgängliga protokoll med detaljer

**Response:**
```json
{
  "protocols": [
    {
      "id": "deep_pro",
      "name": "Djupanalys PRO",
      "description": "...",
      "estimated_time": 60,
      "cost_estimate": "$0.001",
      "features": [...]
    }
  ]
}
```

### POST /api/analysis/deep-pro
Starta djupanalys PRO

### POST /api/analysis/deep
Starta djupanalys standard

### POST /api/analysis/quick
Starta snabbskanning

### POST /api/analysis/batch-prospecting
Starta batch prospecting

### POST /api/analysis/save-result
Spara analysresultat till databas

**Request:**
```json
{
  "lead_data": {
    "companyName": "Test AB",
    "orgNumber": "5569876543",
    "segment": "FS",
    "revenueTkr": 5000,
    ...
  },
  "protocol": "deep_pro"
}
```

---

## 🎨 Frontend Integration

### Använd ProtocolSelector
```tsx
import { ProtocolSelector } from './components/search/ProtocolSelector';

const [selectedProtocol, setSelectedProtocol] = useState('deep_pro');

<ProtocolSelector
  selectedProtocol={selectedProtocol}
  onProtocolChange={setSelectedProtocol}
/>
```

### Kör Analys Baserat på Protokoll
```typescript
const runAnalysis = async () => {
  let result;
  
  switch (selectedProtocol) {
    case 'deep_pro':
      result = await generateDeepDiveSequential(formData, onPartialUpdate);
      break;
    case 'deep':
      result = await generateDeepDive(formData);
      break;
    case 'quick':
      result = await generateQuickScan(formData);
      break;
    case 'batch_prospecting':
      result = await generateBatchProspecting(formData, onLeadFound);
      break;
  }
  
  // Spara till databas
  await saveResult(result, selectedProtocol);
};
```

---

## 📊 Jämförelse

| Protokoll | Tid | Kostnad | Kvalitet | Användning |
|-----------|-----|---------|----------|------------|
| **Deep PRO** | 60s | $0.001 | ⭐⭐⭐⭐⭐ | Viktiga kunder |
| **Deep** | 45s | $0.0008 | ⭐⭐⭐⭐ | Daglig prospektering |
| **Quick** | 15s | $0.0003 | ⭐⭐⭐ | Screening |
| **Batch** | Varierar | $0.0005/lead | ⭐⭐⭐⭐ | Volym |

---

## 🔐 Behörigheter

### ALLA Användare Kan:
- ✅ Använda alla 4 protokoll
- ✅ Söka leads överallt
- ✅ Analysera företag
- ✅ Spara resultat
- ✅ Se sina sökningar

### Inga Begränsningar:
- ❌ Ingen region-begränsning
- ❌ Ingen roll-begränsning
- ❌ Ingen kvot (förutom API-limits)

---

## 💡 Användningsscenarier

### Scenario 1: Kvalificera Ny Lead
```
1. Använd Snabbskanning för initial check
2. Om intressant → Djupanalys Standard
3. Om mycket intressant → Djupanalys PRO
```

### Scenario 2: Hitta Leads i Nytt Område
```
1. Använd Batch Prospecting
2. Hitta 50 leads i Göteborg
3. Snabbskanna alla
4. Djupanalysera de bästa 10
```

### Scenario 3: Stor Affär
```
1. Djupanalys PRO direkt
2. Verifiera org.nummer
3. Kolla Kronofogden
4. Hitta beslutsfattare på LinkedIn
5. Analysera tech stack
```

---

## 🚀 Snabbstart

### 1. Välj Protokoll
```tsx
<ProtocolSelector
  selectedProtocol={protocol}
  onProtocolChange={setProtocol}
/>
```

### 2. Fyll i Formulär
```tsx
<input 
  value={companyName}
  onChange={(e) => setCompanyName(e.target.value)}
  placeholder="Företagsnamn"
/>
```

### 3. Kör Analys
```typescript
const result = await runAnalysis(protocol, formData);
```

### 4. Spara Resultat
```typescript
await saveToDatabase(result, protocol);
```

---

## 📁 Skapade Filer

1. ✅ `server/routes/analysis.js` (300+ rader)
   - 5 endpoints för protokoll
   - API-användning logging
   - Resultat-sparning

2. ✅ `src/components/search/ProtocolSelector.tsx` (200+ rader)
   - Visuell protokoll-väljare
   - Funktionslista
   - Tid/kostnad-estimat

3. ✅ `server/index.js` (uppdaterad)
   - Analysis routes tillagda

4. ✅ `ANALYSIS_PROTOCOLS_GUIDE.md` (denna fil)
   - Komplett dokumentation

---

## 🎉 Sammanfattning

### ✅ Implementerat
- 4 analysprotokoll tillgängliga för ALLA
- Backend API för alla protokoll
- Frontend ProtocolSelector komponent
- API-användning logging
- Resultat-sparning i databas

### ✅ Funktioner
- Djupanalys PRO med grounding
- Djupanalys Standard
- Snabbskanning
- Batch Prospecting
- Alla användare kan använda allt

### ✅ Integration
- Fungerar med befintlig geminiService
- Kompatibel med App.tsx
- Audit logging
- Cost tracking

**Status:** 🚀 **PRODUCTION-READY!**

Alla användare kan nu söka och analysera leads med alla protokoll! 🎊
