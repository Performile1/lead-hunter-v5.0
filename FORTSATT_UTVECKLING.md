# Fortsatt Utveckling - DHL Lead Hunter
## Handlingsplan för Dataimplementation

**Datum:** 2024-12-12  
**Fokus:** Få in VERKLIG data i nuvarande lösning  
**Mål:** Gå från AI-scraping till direkta API-integrationer

---

## 🎯 PRIORITERAD HANDLINGSPLAN

### FAS 1: KRITISKA DATAINTEGRERINGAR (Vecka 1-2)

#### 1.1 Allabolag API Integration ⭐ HÖGSTA PRIORITET
**Varför:** Garanterar org.nummer, ekonomisk data och kreditbetyg

**Steg:**
1. **Skaffa API-nyckel**
   - Gå till: https://www.allabolag.se/api
   - Välj plan: "Företagssök" (499 kr/mån)
   - Registrera och få API-nyckel

2. **Implementera service** (`services/allabolagService.ts`)
   ```typescript
   export async function getCompanyByOrgNumber(orgNumber: string) {
     const apiKey = process.env.ALLABOLAG_API_KEY;
     
     const response = await fetch(
       `https://api.allabolag.se/v1/company/${orgNumber}`,
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
       companyName: data.name,
       address: data.address?.street,
       postalCode: data.address?.postalCode,
       city: data.address?.city,
       revenue: data.financials?.revenue,
       employees: data.employees?.count,
       legalStatus: data.legalForm,
       creditRating: data.creditRating?.rating,
       website: data.website,
       phone: data.phone,
       email: data.email,
       decisionMakers: data.officers?.map(officer => ({
         name: officer.name,
         title: officer.role,
         verified: true
       })) || []
     };
   }
   
   export async function searchCompanyByName(companyName: string) {
     const apiKey = process.env.ALLABOLAG_API_KEY;
     
     const response = await fetch(
       `https://api.allabolag.se/v1/search?name=${encodeURIComponent(companyName)}&limit=5`,
       {
         headers: {
           'Authorization': `Bearer ${apiKey}`,
           'Content-Type': 'application/json'
         }
       }
     );
     
     const data = await response.json();
     return data.companies || [];
   }
   ```

3. **Integrera i geminiService.ts**
   ```typescript
   // Efter AI-analys, verifiera och komplettera med Allabolag
   if (currentData.orgNumber && validateOrgNumber(currentData.orgNumber)) {
     try {
       const allabolagData = await getCompanyByOrgNumber(currentData.orgNumber);
       
       // Komplettera med verifierad data
       currentData.companyName = allabolagData.companyName || currentData.companyName;
       currentData.address = allabolagData.address || currentData.address;
       currentData.revenue = allabolagData.revenue || currentData.revenue;
       currentData.employees = allabolagData.employees || currentData.employees;
       currentData.creditRating = allabolagData.creditRating || currentData.creditRating;
       currentData.websiteUrl = allabolagData.website || currentData.websiteUrl;
       currentData.phoneNumber = allabolagData.phone || currentData.phoneNumber;
       
       // Lägg till verifierade beslutsfattare
       if (allabolagData.decisionMakers?.length > 0) {
         currentData.decisionMakers = allabolagData.decisionMakers;
       }
       
       console.log(`✅ Data verifierad och kompletterad via Allabolag API`);
     } catch (error) {
       console.warn('Allabolag API misslyckades, fortsätter med AI-data:', error);
     }
   }
   ```

4. **Lägg till i .env**
   ```bash
   ALLABOLAG_API_KEY=din_api_nyckel_här
   ```

**Testplan:**
- [ ] Testa med känt org.nummer (t.ex. 556016-0680 - H&M)
- [ ] Verifiera att data kommer från API (kolla console logs)
- [ ] Kontrollera att beslutsfattare är korrekta
- [ ] Testa felhantering (ogiltigt org.nummer)

**Förväntat resultat:**
- ✅ 100% korrekt org.nummer
- ✅ Verifierad ekonomisk data
- ✅ Korrekta beslutsfattare
- ✅ Kreditbetyg från officiell källa

---

#### 1.2 UC API Integration (Kreditupplysning)
**Varför:** Professionella kreditrapporter och riskbedömning

**Steg:**
1. **Skaffa API-nyckel**
   - Gå till: https://www.uc.se/api
   - Kontakta säljteam för offert
   - Välj pay-per-use eller abonnemang

2. **Implementera service** (`services/ucService.ts`)
   ```typescript
   export async function getCreditReport(orgNumber: string) {
     const apiKey = process.env.UC_API_KEY;
     
     const response = await fetch(
       `https://api.uc.se/v1/company/${orgNumber}/credit-report`,
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
       companyName: data.companyName,
       creditRating: {
         rating: data.creditRating?.rating,
         score: data.creditRating?.score,
         riskClass: data.creditRating?.riskClass,
         description: data.creditRating?.description
       },
       paymentRemarks: data.paymentRemarks || [],
       financials: {
         revenue: data.turnover,
         profit: data.profit,
         equity: data.equity,
         employees: data.numberOfEmployees
       },
       riskIndicators: {
         bankruptcyRisk: data.bankruptcyRisk,
         paymentCapacity: data.paymentCapacity,
         liquidity: data.liquidity
       }
     };
   }
   ```

3. **Integrera i geminiService.ts**
   ```typescript
   // Efter Allabolag, hämta UC kreditrapport
   if (currentData.orgNumber && validateOrgNumber(currentData.orgNumber)) {
     try {
       const ucReport = await getCreditReport(currentData.orgNumber);
       
       // Lägg till kreditinformation
       currentData.creditRatingLabel = ucReport.creditRating.rating;
       currentData.creditRatingDescription = ucReport.creditRating.description;
       currentData.riskClass = ucReport.creditRating.riskClass;
       
       // Lägg till betalningsanmärkningar
       if (ucReport.paymentRemarks.length > 0) {
         currentData.paymentRemarks = ucReport.paymentRemarks;
         currentData.legalStatus = `VARNING: ${ucReport.paymentRemarks.length} betalningsanmärkningar`;
       }
       
       console.log(`✅ Kreditrapport hämtad från UC`);
     } catch (error) {
       console.warn('UC API misslyckades:', error);
     }
   }
   ```

4. **Lägg till i .env**
   ```bash
   UC_API_KEY=din_api_nyckel_här
   ```

**Testplan:**
- [ ] Testa med känt org.nummer
- [ ] Verifiera kreditbetyg
- [ ] Kontrollera betalningsanmärkningar
- [ ] Testa felhantering

---

#### 1.3 Bolagsverket Öppna Data (GRATIS)
**Varför:** Officiell källa för juridisk status

**Steg:**
1. **Ladda ner datafiler**
   - Gå till: https://bolagsverket.se/foretag/etjanster/oppnadata
   - Ladda ner "Aktiebolag" CSV-fil (uppdateras månadsvis)
   - Spara i `server/data/bolagsverket.csv`

2. **Implementera parser** (`services/bolagsverketService.ts`)
   ```typescript
   import fs from 'fs';
   import csv from 'csv-parser';
   
   interface BolagsverketData {
     [orgNumber: string]: {
       name: string;
       legalForm: string;
       registrationDate: string;
       status: 'Aktiv' | 'Avregistrerad' | 'Konkurs' | 'Likvidation';
       address: string;
       postalCode: string;
       city: string;
     };
   }
   
   let bolagsverketCache: BolagsverketData = {};
   
   export async function loadBolagsverketData() {
     return new Promise((resolve, reject) => {
       const results: BolagsverketData = {};
       
       fs.createReadStream('server/data/bolagsverket.csv')
         .pipe(csv())
         .on('data', (row) => {
           const orgNumber = normalizeOrgNumber(row.organisationsnummer);
           if (orgNumber) {
             results[orgNumber] = {
               name: row.namn,
               legalForm: row.juridiskForm,
               registrationDate: row.registreringsdatum,
               status: row.status,
               address: row.utdelningsadress,
               postalCode: row.postnummer,
               city: row.postort
             };
           }
         })
         .on('end', () => {
           bolagsverketCache = results;
           console.log(`✅ Bolagsverket data laddad: ${Object.keys(results).length} företag`);
           resolve(results);
         })
         .on('error', reject);
     });
   }
   
   export function getCompanyFromBolagsverket(orgNumber: string) {
     const normalized = normalizeOrgNumber(orgNumber);
     if (!normalized) return null;
     
     return bolagsverketCache[normalized] || null;
   }
   ```

3. **Ladda data vid server start** (`server/index.js`)
   ```javascript
   import { loadBolagsverketData } from './services/bolagsverketService.js';
   
   // Vid server start
   app.listen(PORT, async () => {
     console.log(`Server running on port ${PORT}`);
     
     // Ladda Bolagsverket data
     try {
       await loadBolagsverketData();
       console.log('✅ Bolagsverket data redo');
     } catch (error) {
       console.error('❌ Kunde inte ladda Bolagsverket data:', error);
     }
   });
   ```

4. **Integrera i geminiService.ts**
   ```typescript
   // Verifiera juridisk status med Bolagsverket
   const bolagsverketData = getCompanyFromBolagsverket(currentData.orgNumber);
   if (bolagsverketData) {
     currentData.legalStatus = bolagsverketData.status;
     currentData.legalForm = bolagsverketData.legalForm;
     
     console.log(`✅ Juridisk status verifierad via Bolagsverket: ${bolagsverketData.status}`);
   }
   ```

**Testplan:**
- [ ] Ladda ner Bolagsverket CSV
- [ ] Testa parsing av CSV-fil
- [ ] Verifiera att data laddas vid server start
- [ ] Testa lookup med org.nummer

---

### FAS 2: FÖRBÄTTRAD DATAKVALITET (Vecka 3-4)

#### 2.1 Skatteverket F-skatt Scraping
**Implementation:**
```typescript
// services/skatteverketService.ts
export async function checkFSkatt(orgNumber: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.skatteverket.se/foretagorganisationer/skatter/fskatt.html?orgnr=${orgNumber}`
    );
    
    const html = await response.text();
    
    // Leta efter "Godkänd för F-skatt" eller "Registrerad"
    const hasFSkatt = html.includes('Godkänd för F-skatt') || 
                      html.includes('Status: Registrerad');
    
    return hasFSkatt;
  } catch (error) {
    console.error('Skatteverket scraping misslyckades:', error);
    return false;
  }
}
```

#### 2.2 Ratsit API/Scraping
**Implementation:**
```typescript
// services/ratsitService.ts
export async function getDecisionMakersFromRatsit(orgNumber: string) {
  // Implementera Ratsit scraping eller API
  // Returnera beslutsfattare med kontaktinfo
}
```

#### 2.3 BuiltWith API (Tech Stack)
**Implementation:**
```typescript
// services/builtwithService.ts
export async function getTechStack(domain: string) {
  const apiKey = process.env.BUILTWITH_API_KEY;
  
  const response = await fetch(
    `https://api.builtwith.com/v20/api.json?KEY=${apiKey}&LOOKUP=${domain}`
  );
  
  const data = await response.json();
  
  return {
    ecommercePlatform: data.technologies.ecommerce?.[0]?.name,
    paymentGateway: data.technologies.payment?.[0]?.name,
    analytics: data.technologies.analytics?.map(t => t.name),
    hosting: data.technologies.hosting?.[0]?.name
  };
}
```

---

### FAS 3: BACKEND API ENDPOINTS (Vecka 5-6)

#### 3.1 Customers API
```javascript
// server/routes/customers.js
router.get('/api/customers', async (req, res) => {
  const { status, tier, monitor_only, search } = req.query;
  
  // Hämta från databas
  let query = db.customers.find();
  
  if (status) query = query.where('status').equals(status);
  if (tier) query = query.where('tier').equals(tier);
  if (monitor_only === 'true') query = query.where('monitor_checkout').equals(true);
  if (search) query = query.where('company_name').regex(new RegExp(search, 'i'));
  
  const customers = await query.exec();
  
  res.json({ customers });
});
```

#### 3.2 Notifications API
```javascript
// server/routes/notifications.js
router.get('/api/notifications', async (req, res) => {
  const userId = req.user.id;
  
  const notifications = await db.notifications
    .find({ userId })
    .sort({ timestamp: -1 })
    .limit(50)
    .exec();
  
  res.json(notifications);
});

router.post('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  
  await db.notifications.updateOne(
    { _id: id },
    { $set: { read: true } }
  );
  
  res.json({ success: true });
});
```

#### 3.3 Cronjobs API
```javascript
// server/routes/cronjobs.js
router.get('/api/cronjobs', async (req, res) => {
  const cronjobs = await db.cronjobs
    .find()
    .sort({ nextRun: 1 })
    .exec();
  
  res.json(cronjobs);
});

router.post('/api/cronjobs', async (req, res) => {
  const { name, description, schedule, type, config } = req.body;
  
  const cronjob = await db.cronjobs.create({
    name,
    description,
    schedule,
    type,
    config,
    enabled: true,
    status: 'idle',
    createdBy: req.user.id
  });
  
  res.json(cronjob);
});
```

---

## 📋 CHECKLISTA FÖR IMPLEMENTATION

### Vecka 1
- [ ] Skaffa Allabolag API-nyckel
- [ ] Implementera `services/allabolagService.ts`
- [ ] Integrera i `geminiService.ts`
- [ ] Testa med 10 olika företag
- [ ] Verifiera att org.nummer alltid finns

### Vecka 2
- [ ] Skaffa UC API-nyckel
- [ ] Implementera `services/ucService.ts`
- [ ] Integrera kreditrapporter
- [ ] Ladda ner Bolagsverket data
- [ ] Implementera `services/bolagsverketService.ts`

### Vecka 3
- [ ] Implementera Skatteverket F-skatt check
- [ ] Implementera Ratsit scraping
- [ ] Implementera BuiltWith API
- [ ] Testa alla datakällor tillsammans

### Vecka 4
- [ ] Implementera caching för API-anrop
- [ ] Optimera prestanda
- [ ] Lägg till felhantering
- [ ] Skapa monitoring dashboard

### Vecka 5-6
- [ ] Implementera Customers API
- [ ] Implementera Notifications API
- [ ] Implementera Cronjobs API
- [ ] Testa alla endpoints
- [ ] Dokumentera API

---

## 💰 KOSTNADER

### Månadskostnader
- **Allabolag API:** 499 kr/mån
- **UC API:** ~1000-2000 kr/mån (beroende på användning)
- **BuiltWith API:** $295/mån (~3000 kr/mån)
- **Bolagsverket:** GRATIS
- **Skatteverket:** GRATIS (scraping)
- **Kronofogden:** GRATIS (API)

**Total:** ~4500-5500 kr/mån

### Engångskostnader
- **Utvecklingstid:** ~40-60 timmar
- **Testning:** ~10-20 timmar

---

## 🎯 FÖRVÄNTADE RESULTAT

### Efter Fas 1 (Vecka 1-2)
- ✅ 100% korrekt org.nummer
- ✅ Verifierad ekonomisk data från Allabolag
- ✅ Professionella kreditrapporter från UC
- ✅ Juridisk status från Bolagsverket

### Efter Fas 2 (Vecka 3-4)
- ✅ F-skatt status från Skatteverket
- ✅ Beslutsfattare från Ratsit
- ✅ Tech stack från BuiltWith
- ✅ 95%+ datakvalitet

### Efter Fas 3 (Vecka 5-6)
- ✅ Fungerande backend API
- ✅ Kundlista med verklig data
- ✅ Notifikationssystem
- ✅ Cronjobs-hantering

---

## 🚀 SNABBSTART

**Börja här (idag):**
1. Gå till https://www.allabolag.se/api
2. Registrera och få API-nyckel
3. Lägg till i `.env`: `ALLABOLAG_API_KEY=din_nyckel`
4. Kör: `npm install` (om nya dependencies behövs)
5. Testa med ett företag

**Nästa steg (imorgon):**
1. Kontakta UC för API-nyckel
2. Ladda ner Bolagsverket CSV
3. Implementera `allabolagService.ts`

---

## 📞 SUPPORT & HJÄLP

**Om något inte fungerar:**
1. Kolla console logs för felmeddelanden
2. Verifiera API-nycklar i `.env`
3. Testa API-endpoints manuellt med Postman
4. Läs dokumentation: `DATAKALLOR_OCH_ORGUMMER.md`

**Kontakt för API-nycklar:**
- **Allabolag:** support@allabolag.se
- **UC:** api@uc.se
- **BuiltWith:** support@builtwith.com

---

## 📊 MÄTNING AV FRAMGÅNG

**KPI:er att följa:**
- Andel leads med giltigt org.nummer: **Mål 100%**
- Andel leads med verifierad ekonomisk data: **Mål 95%**
- Andel leads med kreditbetyg: **Mål 90%**
- API-svarstid: **Mål <2 sekunder**
- Felfrekvens: **Mål <1%**

**Logga i console:**
```typescript
console.log(`📊 DATAKVALITET RAPPORT:`);
console.log(`   Org.nummer: ${hasOrgNumber ? '✅' : '❌'}`);
console.log(`   Ekonomisk data: ${hasFinancials ? '✅' : '❌'}`);
console.log(`   Kreditbetyg: ${hasCreditRating ? '✅' : '❌'}`);
console.log(`   Beslutsfattare: ${hasDecisionMakers ? '✅' : '❌'}`);
console.log(`   Datakällor: ${sources.join(', ')}`);
```

---

**Lycka till med implementationen! 🚀**
