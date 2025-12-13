# Datakällor och Org.nummer - Problem och Lösning

## 🔴 PROBLEM

**Rapporterat:** Org.nummer saknas för vissa kunder, och analysen säger att den är "klar" trots att viktig data saknas.

**Rotorsak:** 
- Org.nummer hämtas från AI-genererad data (`raw.org_nr`) från Gemini API
- AI:n kan missa org.nummer eller inte hitta det i webscraping
- Ingen validering att org.nummer faktiskt finns innan analysen markeras som "klar"

## 📊 NUVARANDE DATAKÄLLOR

### Implementerade källor (via AI-scraping):
1. **Allabolag.se** - Företagsdata, ekonomi, kreditbetyg
2. **Ratsit.se** - Företagsdata, beslutsfattare
3. **Bolagsverket** - Juridisk status (via scraping)
4. **Skatteverket** - F-skatt status (via scraping)
5. **Kronofogden** - Betalningsanmärkningar (API implementerat)
6. **UC** - Kreditrapporter (via scraping)

### Problem med nuvarande implementation:
- ❌ Org.nummer hämtas från AI-tolkad data (osäkert)
- ❌ Ingen direkt API-integration med Allabolag/Ratsit
- ❌ Ingen validering att org.nummer är korrekt format
- ❌ Analysen kan markeras "klar" utan org.nummer

## ✅ LÖSNING

### 1. Förbättra Prompt för att KRÄVA org.nummer

**Nuvarande prompt (deepAnalysis.ts):**
```typescript
"org_nr": "", // Kan vara tom
```

**Förbättrad prompt:**
```typescript
"org_nr": "", // OBLIGATORISKT - Sök på Allabolag/Ratsit, format: XXXXXX-XXXX
```

**Lägg till i prompt:**
```
KRITISKA REGLER FÖR ORG.NUMMER:
1. Org.nummer är OBLIGATORISKT - analysen är INTE klar utan det
2. Sök ALLTID på Allabolag.se och Ratsit.se för att hitta org.nummer
3. Format: XXXXXX-XXXX (10 siffror med bindestreck)
4. Om du inte hittar org.nummer efter 3 försök, returnera "SAKNAS" istället för tom sträng
5. Validera att org.nummer följer Luhn-algoritmen (checksiffra)
```

### 2. Validera org.nummer innan analys markeras "klar"

**Lägg till i geminiService.ts:**
```typescript
// Efter AI-analys, validera org.nummer
if (!currentData.orgNumber || currentData.orgNumber === "SAKNAS") {
  console.error(`❌ KRITISKT: Org.nummer saknas för ${currentData.companyName}`);
  currentData.analysisStatus = "INCOMPLETE - Org.nummer saknas";
  
  // Försök hämta från Bolagsverket API som backup
  const bolagsverketData = await getCompanyFromBolagsverket(currentData.companyName);
  if (bolagsverketData?.organisationsnummer) {
    currentData.orgNumber = bolagsverketData.organisationsnummer;
    console.log(`✅ Org.nummer hittat via Bolagsverket: ${currentData.orgNumber}`);
  }
}

// Validera format
if (currentData.orgNumber && !validateOrgNumber(currentData.orgNumber)) {
  console.warn(`⚠️ Ogiltigt org.nummer format: ${currentData.orgNumber}`);
  currentData.orgNumber = normalizeOrgNumber(currentData.orgNumber) || "";
}
```

### 3. Implementera direkta API-integrationer

**Prioritet 1: Allabolag API**
```typescript
// services/allabolagService.ts
export async function getCompanyByName(companyName: string) {
  const apiKey = process.env.ALLABOLAG_API_KEY;
  
  const response = await fetch(
    `https://api.allabolag.se/v1/search?name=${encodeURIComponent(companyName)}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  return {
    orgNumber: data.organizationNumber,
    name: data.name,
    address: data.address,
    revenue: data.financials?.revenue,
    employees: data.employees?.count,
    creditRating: data.creditRating?.rating,
    legalStatus: data.legalForm
  };
}
```

**Prioritet 2: UC API (Kreditupplysning)**
```typescript
// services/ucService.ts
export async function getCreditReport(orgNumber: string) {
  const apiKey = process.env.UC_API_KEY;
  
  const response = await fetch(
    `https://api.uc.se/v1/company/${orgNumber}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  return {
    orgNumber: data.orgNumber,
    creditRating: data.creditRating,
    paymentRemarks: data.paymentRemarks,
    riskClass: data.riskClass
  };
}
```

### 4. Fallback-strategi för org.nummer

**Implementera i geminiService.ts:**
```typescript
async function ensureOrgNumber(lead: LeadData): Promise<LeadData> {
  // Steg 1: Kolla om org.nummer redan finns och är giltigt
  if (lead.orgNumber && validateOrgNumber(lead.orgNumber)) {
    return lead;
  }
  
  console.log(`🔍 Försöker hitta org.nummer för ${lead.companyName}...`);
  
  // Steg 2: Försök Allabolag API
  try {
    const allabolagData = await getCompanyByName(lead.companyName);
    if (allabolagData?.orgNumber) {
      lead.orgNumber = allabolagData.orgNumber;
      console.log(`✅ Org.nummer hittat via Allabolag: ${lead.orgNumber}`);
      return lead;
    }
  } catch (error) {
    console.warn('Allabolag API misslyckades:', error);
  }
  
  // Steg 3: Försök UC API
  try {
    const ucData = await searchCompanyByName(lead.companyName);
    if (ucData?.orgNumber) {
      lead.orgNumber = ucData.orgNumber;
      console.log(`✅ Org.nummer hittat via UC: ${lead.orgNumber}`);
      return lead;
    }
  } catch (error) {
    console.warn('UC API misslyckades:', error);
  }
  
  // Steg 4: Försök Bolagsverket (scraping)
  try {
    const bolagsverketData = await getCompanyFromBolagsverket(lead.companyName);
    if (bolagsverketData?.organisationsnummer) {
      lead.orgNumber = bolagsverketData.organisationsnummer;
      console.log(`✅ Org.nummer hittat via Bolagsverket: ${lead.orgNumber}`);
      return lead;
    }
  } catch (error) {
    console.warn('Bolagsverket scraping misslyckades:', error);
  }
  
  // Steg 5: Markera som ofullständig
  console.error(`❌ KRITISKT: Kunde inte hitta org.nummer för ${lead.companyName}`);
  lead.analysisStatus = "INCOMPLETE - Org.nummer saknas";
  lead.orgNumber = "SAKNAS";
  
  return lead;
}
```

## 🎯 IMPLEMENTATION PLAN

### Fas 1: Snabbfix (Omedelbart)
1. ✅ Uppdatera prompt för att KRÄVA org.nummer
2. ✅ Lägg till validering i geminiService.ts
3. ✅ Implementera `ensureOrgNumber()` fallback-funktion

### Fas 2: API-integrationer (1-2 veckor)
1. ⏳ Skaffa API-nycklar för Allabolag
2. ⏳ Skaffa API-nycklar för UC
3. ⏳ Implementera allabolagService.ts
4. ⏳ Implementera ucService.ts
5. ⏳ Integrera i lead-analysen

### Fas 3: Förbättringar (2-4 veckor)
1. ⏳ Implementera Bolagsverket scraping
2. ⏳ Implementera Skatteverket scraping för F-skatt
3. ⏳ Lägg till cache för org.nummer lookups
4. ⏳ Lägg till UI-varning om org.nummer saknas

## 📝 MILJÖVARIABLER SOM BEHÖVS

Lägg till i `.env`:
```bash
# Allabolag API
ALLABOLAG_API_KEY=din_api_nyckel_här

# UC (Upplysningscentralen) API
UC_API_KEY=din_api_nyckel_här

# Ratsit API (om tillgänglig)
RATSIT_API_KEY=din_api_nyckel_här
```

## 🔗 API-DOKUMENTATION

### Allabolag API
- **Webbplats:** https://www.allabolag.se/api
- **Pris:** Från 499 kr/månad
- **Funktioner:** Företagssök, ekonomisk data, kreditbetyg, beslutsfattare

### UC API
- **Webbplats:** https://www.uc.se/api
- **Pris:** Pay-per-use eller abonnemang
- **Funktioner:** Kreditupplysning, betalningsanmärkningar, riskbedömning

### Bolagsverket Öppna Data
- **Webbplats:** https://bolagsverket.se/foretag/etjanster/oppnadata
- **Pris:** GRATIS
- **Funktioner:** Grundläggande företagsdata, juridisk form, adress

## ⚠️ VIKTIGT

**Innan du implementerar API-integrationer:**
1. Kontrollera GDPR-krav för lagring av företagsdata
2. Läs API-villkoren noga (rate limits, användningsområden)
3. Implementera caching för att minimera API-anrop
4. Logga alla API-anrop för felsökning

## 📊 FÖRVÄNTADE RESULTAT

**Efter implementation:**
- ✅ 99%+ av leads har giltigt org.nummer
- ✅ Analysen markeras INTE som "klar" om org.nummer saknas
- ✅ Automatisk validering av org.nummer format
- ✅ Fallback till flera datakällor om en misslyckas
- ✅ Tydliga felmeddelanden om org.nummer inte kan hittas

## 🐛 DEBUGGING

**Om org.nummer fortfarande saknas:**
1. Kolla console.log för "🔍 Försöker hitta org.nummer..."
2. Verifiera att API-nycklar är korrekt konfigurerade
3. Testa manuellt på Allabolag.se om företaget finns
4. Kolla om företagsnamnet är korrekt stavat
5. Verifiera att företaget är registrerat i Sverige
