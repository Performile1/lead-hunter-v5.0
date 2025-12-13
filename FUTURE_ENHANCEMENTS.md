# 🚀 Framtida Förbättringar & Roadmap - DHL Lead Hunter

## ✅ Implementerat Nu (Session)

### Grundläggande System
- ✅ Multi-user med 7 roller
- ✅ Postnummer-baserad filtrering
- ✅ Terminal chefer med dashboard
- ✅ Lead assignment system
- ✅ 4 analysprotokoll (Deep PRO, Deep, Quick, Batch)
- ✅ 5 LLM-providers (Gemini, Groq, OpenAI, Claude, Ollama)
- ✅ Segment-hantering (FS, TS, KAM, DM)
- ✅ Audit logging
- ✅ SSO med Azure AD

---

## 📋 Nästa Steg (Prioriterat)

### 1. Verifierade Kontaktuppgifter (KRITISKT) ⭐⭐⭐
**Status:** Planerad - Fas 1
**Prioritet:** HÖGST
**Kostnad:** Delvis gratis, delvis betald

**Problem:** Säljare saknar direkta telefonnummer och verifierade emails till beslutsfattare

**Lösningar:**

#### A. Hunter.io (Email-Verifiering) - FREE TIER! ✅
**Kostnad:** GRATIS upp till 50 verifieringar/månad
**Paid:** $49/månad för 1,000 verifieringar

**Implementation:**
```typescript
// services/hunterService.ts
import axios from 'axios';

export async function verifyEmail(email: string) {
  const response = await axios.get('https://api.hunter.io/v2/email-verifier', {
    params: {
      email: email,
      api_key: process.env.HUNTER_API_KEY
    }
  });
  
  return {
    valid: response.data.data.status === 'valid',
    score: response.data.data.score,
    smtp_check: response.data.data.smtp_check,
    deliverable: response.data.data.result === 'deliverable'
  };
}

export async function findEmail(domain: string, firstName: string, lastName: string) {
  const response = await axios.get('https://api.hunter.io/v2/email-finder', {
    params: {
      domain: domain,
      first_name: firstName,
      last_name: lastName,
      api_key: process.env.HUNTER_API_KEY
    }
  });
  
  return response.data.data.email;
}
```

**Free Tier Limits:**
- 50 email verifications/månad
- 25 email searches/månad
- Perfekt för att börja!

#### B. Ratsit API (Telefonnummer) - BETALD
**Kostnad:** ~2,000-5,000 kr/månad
**Data:** Direkta telefonnummer, adresser, beslutsfattare

#### C. Merinfo API (Beslutsfattare) - BETALD
**Kostnad:** ~3,000-7,000 kr/månad
**Data:** VD, CFO, Logistikchef med kontaktuppgifter

**Rekommendation:** Börja med Hunter.io FREE tier först! ✅

---

### 2. API-Integrationer (Offentliga & Gratis) ⭐⭐⭐
**Status:** Delvis implementerat
**Kostnad:** GRATIS (Offentliga API:er)

#### A. Arbetsförmedlingen API - GRATIS ✅
**Kostnad:** GRATIS
**Data:** Platsannonser, rekryteringstrender

**Implementation:**
```typescript
// services/arbetsformedlingenService.ts
export async function getJobPostings(orgNumber: string) {
  const response = await axios.get('https://jobsearch.api.jobtechdev.se/search', {
    params: {
      employer: orgNumber
    }
  });
  
  return {
    active_postings: response.data.total.value,
    positions: response.data.hits.map(hit => ({
      title: hit.headline,
      published: hit.publication_date,
      application_deadline: hit.application_deadline
    }))
  };
}
```

**Användning:** Trigger för expansion (rekrytering = tillväxt)

#### B. Bolagsverket API - GRATIS ✅
**Kostnad:** GRATIS (Vi använder redan)
**Data:** Företagsinfo, styrelse, årsredovisningar

**Nuvarande Status:** ✅ Redan implementerat i `bolagsverketService.ts`

**Utöka med:**
- Styrelseändringar (trigger för nya VD)
- Nya dotterbolag (expansion)
- Adressändringar (lagerflytt)

#### C. Skatteverket API - GRATIS? ✅
**Kostnad:** GRATIS (Offentlig data)
**Data:** Momsregistrering, F-skatt

**Status:** ❌ INTE implementerat ännu

**Implementation:**
```typescript
// services/skatteverketService.ts
export async function checkVATRegistration(orgNumber: string) {
  // Skatteverket har ingen officiell API, men data är offentlig
  // Kan scrapa från https://www.skatteverket.se/
  
  return {
    vat_registered: true,
    f_skatt: true,
    registration_date: '2020-01-01'
  };
}
```

**Användning:** Verifiera att företaget är aktivt

#### D. Kronofogden API - GRATIS ✅
**Kostnad:** GRATIS
**Status:** ✅ Redan implementerat i `kronofogdenService.ts`

**Nuvarande funktioner:**
- Betalningsanmärkningar
- Skulder
- Konkurser

---

### 3. Expansionssignaler (Triggers) ⭐⭐
**Status:** Planerad - Fas 2
**Kostnad:** Mestadels GRATIS

**Nya triggers att implementera:**

```typescript
// Lägg till i trigger-systemet
triggers: {
  // Befintliga (✅ Implementerade)
  revenue_increase: true,
  revenue_decrease: true,
  bankruptcy: true,
  liquidation: true,
  payment_remarks: true,
  warehouse_move: true,
  news: true,
  segment_change: true,
  
  // NYA (❌ Saknas)
  new_job_postings: false,      // Arbetsförmedlingen API (GRATIS)
  board_changes: false,          // Bolagsverket API (GRATIS)
  new_subsidiary: false,         // Bolagsverket API (GRATIS)
  vat_registration: false,       // Skatteverket (GRATIS)
  new_technology: false,         // BuiltWith (BETALD ~$300/månad)
  funding_round: false,          // Manuell data (GRATIS)
  new_office: false              // Bolagsverket API (GRATIS)
}
```

**Implementation:**
```typescript
// server/utils/triggerDetection.js

// Ny trigger: Platsannonser
export function detectJobPostings(oldLead, newLead) {
  const oldPostings = oldLead.job_postings_count || 0;
  const newPostings = newLead.job_postings_count || 0;
  
  if (newPostings > oldPostings && newPostings >= 3) {
    return {
      type: 'new_job_postings',
      severity: 'medium',
      old_value: oldPostings,
      new_value: newPostings,
      message: `🚀 REKRYTERING: ${newPostings} nya platsannonser (expansion!)`
    };
  }
  
  return null;
}

// Ny trigger: Styrelseändringar
export function detectBoardChanges(oldLead, newLead) {
  const oldCEO = oldLead.ceo_name;
  const newCEO = newLead.ceo_name;
  
  if (oldCEO && newCEO && oldCEO !== newCEO) {
    return {
      type: 'board_changes',
      severity: 'high',
      old_value: oldCEO,
      new_value: newCEO,
      message: `👔 NY VD: ${oldCEO} → ${newCEO}`
    };
  }
  
  return null;
}
```

---

### 4. Lead Card & Analys-Tidsstämplar ⭐⭐⭐
**Status:** Behöver implementeras

**Funktioner:**
- ✅ Visa när lead analyserades senast
- ✅ Visa vem som skapade leadet
- ✅ Visa historik av ändringar
- ✅ Fullständig lead card med alla detaljer
- ✅ Terminal chefer ser alla sina leads i lista
- ✅ Klicka för att öppna lead card

**Komponenter att skapa:**
```tsx
// LeadCard.tsx - Fullständig lead-vy
- Företagsinfo
- Beslutsfattare
- Finansiell data
- Logistikprofil
- Tech stack
- Nyheter
- Analys-tidsstämpel
- Ändringshistorik

// LeadList.tsx - Lista för terminal chefer
- Alla leads i terminal
- Filtrera på segment, status, säljare
- Sortera på datum, omsättning
- Klicka för att öppna lead card
```

**Databas:**
```sql
-- Redan finns:
- analysis_date (när lead analyserades)
- created_at (när lead skapades)
- updated_at (när lead uppdaterades)
- created_by (vem som skapade)

-- Behöver lägga till:
- last_viewed_at (när lead visades senast)
- last_viewed_by (vem som visade)
- view_count (antal visningar)
```

---

### 2. Manager Hierarki ⭐⭐⭐
**Status:** Behöver implementeras

**Funktioner:**
- ✅ Managers kan ha flera säljare under sig
- ✅ Managers ser alla sina säljares leads
- ✅ Managers ser nedladdningsstatistik
- ✅ Managers kan tilldela leads till sina säljare
- ✅ Hierarkisk vy av team

**Databas:**
```sql
-- Ny tabell: manager_teams
CREATE TABLE manager_teams (
  id UUID PRIMARY KEY,
  manager_id UUID REFERENCES users(id),
  salesperson_id UUID REFERENCES users(id),
  region VARCHAR(100),
  assigned_at TIMESTAMP,
  UNIQUE(manager_id, salesperson_id)
);

-- Uppdatera users-tabell
ALTER TABLE users ADD COLUMN manager_id UUID REFERENCES users(id);
```

**API:**
```javascript
// GET /api/managers/my-team
// Hämta alla säljare under manager

// GET /api/managers/team-leads
// Hämta alla leads för teamet

// GET /api/managers/team-stats
// Statistik för teamet
```

---

### 3. Integrationer ⭐⭐⭐

#### 3.1 Email Integration
**Providers:**
- Gmail API
- Outlook/Exchange
- SendGrid för bulk-email

**Funktioner:**
- ✅ Skicka email direkt från lead card
- ✅ Email-mallar
- ✅ Spåra öppningar och klick
- ✅ Email-historik per lead
- ✅ Automatiska påminnelser

**Implementation:**
```javascript
// services/emailService.ts
- sendEmail(to, subject, body, template)
- trackEmailOpen(emailId)
- getEmailHistory(leadId)
- scheduleFollowUp(leadId, days)
```

#### 3.2 Salesforce Integration
**Funktioner:**
- ✅ Synka leads till Salesforce
- ✅ Uppdatera leads från Salesforce
- ✅ Bi-direktional synk
- ✅ Mappa DHL-segment till Salesforce-objekt

**Implementation:**
```javascript
// services/salesforceService.ts
- syncLeadToSalesforce(lead)
- updateFromSalesforce(leadId)
- createOpportunity(lead)
- getAccountHistory(orgNumber)
```

#### 3.3 LinkedIn Integration
**Funktioner:**
- ✅ Sök beslutsfattare på LinkedIn
- ✅ Hämta profiler automatiskt
- ✅ Hitta nya kontakter på företag
- ✅ Sales Navigator integration

**Implementation:**
```javascript
// services/linkedinService.ts
- searchDecisionMakers(companyName)
- getProfile(linkedinUrl)
- findContacts(companyName, title)
- enrichProfile(name, company)
```

#### 3.4 Google Search Integration
**Funktioner:**
- ✅ Sök kontaktpersoner via Google
- ✅ Hitta email-adresser
- ✅ Verifiera information
- ✅ Hitta nyheter om företag

**Implementation:**
```javascript
// services/googleSearchService.ts
- searchContacts(companyName, title)
- findEmail(name, company)
- verifyCompanyInfo(orgNumber)
- getCompanyNews(companyName)
```

---

## 🎯 Förbättringsförslag (Kategoriserade)

### A. Data & Analys ⭐⭐⭐

#### 1. Automatisk Re-Analys
**Problem:** Data blir gammal
**Lösning:**
- Automatisk re-analys efter 30/60/90 dagar
- Notifiering om stora förändringar
- Jämför gammal vs ny data

#### 2. Konkurrensintelligens
**Funktioner:**
- Vilka konkurrenter använder kunden?
- Vad kostar deras lösningar?
- Varför valde de konkurrenten?
- Hur kan vi vinna tillbaka?

#### 3. Prediktiv Analys
**AI-driven:**
- Sannolikhet att vinna kund (0-100%)
- Bästa tidpunkt att kontakta
- Rekommenderad approach
- Estimerad deal-storlek

#### 4. Sentiment Analys
**Från nyheter:**
- Positiva/negativa nyheter
- Företagets momentum
- Risk-indikatorer
- Expansion-signaler

---

### B. Säljprocess & CRM ⭐⭐⭐

#### 1. Pipeline Management
**Stages:**
```
1. Prospekt (ny lead)
2. Kvalificerad (analyserad)
3. Kontaktad (email/telefon)
4. Möte bokat
5. Offert skickad
6. Förhandling
7. Vunnen/Förlorad
```

**Funktioner:**
- Drag-and-drop mellan stages
- Automatiska påminnelser
- Sannolikhet per stage
- Estimerad deal-värde

#### 2. Aktivitetslogg
**Per lead:**
- Telefonsamtal (datum, längd, notering)
- Email (skickad, öppnad, svarad)
- Möten (datum, deltagare, notering)
- Offert (skickad, öppnad, status)
- Nästa steg (vad, när, vem)

#### 3. Task Management
**Funktioner:**
- Skapa tasks per lead
- Tilldela tasks till säljare
- Deadlines och påminnelser
- Task-templates (onboarding, follow-up)

#### 4. Dokument-hantering
**Funktioner:**
- Ladda upp offerter
- Kontrakt
- Presentationer
- Versionshantering
- Dela med kund

---

### C. Kommunikation ⭐⭐

#### 1. Email-Kampanjer
**Funktioner:**
- Bulk-email till segment
- A/B-testning
- Email-templates
- Personalisering (företagsnamn, beslutsfattare)
- Spårning (öppningar, klick, svar)

#### 2. SMS-Integration
**Use cases:**
- Snabba påminnelser
- Mötes-bekräftelser
- Uppföljningar
- Kampanjer

#### 3. WhatsApp Business
**Funktioner:**
- Chat med kunder
- Dela dokument
- Statusuppdateringar
- Automatiska svar

#### 4. Telefoni-Integration
**Providers:** Twilio, RingCentral
**Funktioner:**
- Click-to-call från lead card
- Inspelning av samtal
- Automatisk loggning
- Call analytics

---

### D. Rapportering & Analytics ⭐⭐⭐

#### 1. Dashboard för Managers
**Widgets:**
- Team-prestanda
- Pipeline-värde
- Conversion rates
- Aktivitets-nivå
- Top performers
- Bottlenecks

#### 2. Säljare-Dashboard
**Widgets:**
- Mina leads
- Mina tasks
- Pipeline-värde
- Denna vecka/månad
- Mål vs faktiskt
- Nästa steg

#### 3. Executive Dashboard
**För ledning:**
- Total pipeline-värde
- Vunna deals
- Förlorade deals (varför?)
- ROI per kanal
- Cost per lead
- Revenue forecast

#### 4. Custom Reports
**Funktioner:**
- Bygg egna rapporter
- Filtrera på segment, region, säljare
- Exportera till Excel/PDF
- Schemalagda rapporter (email varje måndag)

---

### E. Automatisering ⭐⭐

#### 1. Workflows
**Exempel:**
```
Trigger: Ny lead skapad
→ Tilldela till säljare (baserat på postnummer)
→ Skicka välkomst-email
→ Skapa task: "Ring inom 24h"
→ Notifiera manager
```

#### 2. Lead Scoring
**Automatisk poängsättning:**
- Omsättning (0-30 poäng)
- Tillväxt (0-20 poäng)
- Tech stack (0-15 poäng)
- Nyheter (0-15 poäng)
- Engagement (0-20 poäng)

**Total: 0-100 poäng**
- 80-100: Hot lead
- 60-79: Warm lead
- 40-59: Cold lead
- 0-39: Low priority

#### 3. Automatiska Påminnelser
**Triggers:**
- Ingen aktivitet på 7 dagar → Påminn säljare
- Offert skickad för 3 dagar sedan → Follow-up
- Möte imorgon → Reminder
- Lead inte kontaktad på 30 dagar → Eskalera till manager

#### 4. Data Enrichment
**Automatiskt:**
- Hämta ny finansiell data varje kvartal
- Uppdatera beslutsfattare från LinkedIn
- Kolla Kronofogden varje månad
- Hämta nyheter varje vecka

---

### F. Collaboration ⭐⭐

#### 1. Team Chat
**Per lead:**
- Intern chat
- @mentions
- Dela filer
- Diskutera strategi

#### 2. Handover Process
**När lead flyttas:**
- Automatisk handover-mall
- Tidigare säljare lämnar noteringar
- Ny säljare bekräftar mottagande
- Manager godkänner

#### 3. Knowledge Base
**Internt:**
- Best practices
- Pitch-mallar
- Objection handling
- Success stories
- Konkurrent-info

---

### G. Mobile App ⭐⭐

#### 1. iOS/Android App
**Funktioner:**
- Se leads on-the-go
- Uppdatera status
- Logga aktiviteter
- Push-notifikationer
- Offline-läge

#### 2. Progressive Web App (PWA)
**Fördelar:**
- Fungerar offline
- Installeras som app
- Push-notifikationer
- Snabbare än webb

---

### H. AI & Machine Learning ⭐⭐⭐

#### 1. AI-Assistent
**Chatbot:**
- "Hitta alla KAM-leads i Stockholm"
- "Vem har flest leads denna månad?"
- "Visa leads med hög sannolikhet"
- "Föreslå nästa steg för Lead X"

#### 2. Smart Recommendations
**AI föreslår:**
- Bästa tiden att ringa
- Vilket email-template att använda
- Vilken säljare som passar bäst
- Estimerad deal-storlek

#### 3. Churn Prediction
**Befintliga kunder:**
- Risk att förlora kund (0-100%)
- Varför (inaktivitet, konkurrent, pris)
- Rekommenderade åtgärder

#### 4. Next Best Action
**AI rekommenderar:**
- "Ring kunden nu (bästa tid)"
- "Skicka case study om X"
- "Boka möte med beslutsfattare Y"
- "Eskalera till manager"

---

### I. Säkerhet & Compliance ⭐⭐⭐

#### 1. GDPR-Compliance
**Funktioner:**
- Consent management
- Data retention policies
- Right to be forgotten
- Data export för kunder
- Audit trail

#### 2. Role-Based Access Control (RBAC)
**Granulär:**
- Vem kan se vad
- Vem kan redigera vad
- Vem kan radera vad
- Field-level permissions

#### 3. Data Encryption
**Säkerhet:**
- Kryptering at rest
- Kryptering in transit
- API-nycklar i vault
- Känslig data maskerad

#### 4. Two-Factor Authentication (2FA)
**Extra säkerhet:**
- SMS-kod
- Authenticator app
- Biometri (fingeravtryck, Face ID)

---

### J. Integrationer (Utökade) ⭐⭐

#### 1. Bokföringssystem
**Integration med:**
- Fortnox
- Visma
- Björn Lundén

**Funktioner:**
- Synka fakturor
- Se kundvärde
- Betalningshistorik

#### 2. Logistiksystem
**DHL-system:**
- Hämta fraktvolym
- Se frakthistorik
- Identifiera upsell-möjligheter

#### 3. Marketing Automation
**HubSpot, Marketo:**
- Synka leads
- Marketing-kampanjer
- Lead nurturing

#### 4. Calendar Integration
**Google Calendar, Outlook:**
- Boka möten direkt
- Synka aktiviteter
- Påminnelser

---

## 📊 Prioriteringsmatris

### Måste Ha (Q1 2025)
1. ✅ Lead Card med tidsstämplar
2. ✅ Manager hierarki
3. ✅ Email integration
4. ✅ LinkedIn search
5. ✅ Pipeline management

### Bör Ha (Q2 2025)
1. ✅ Salesforce integration
2. ✅ Automatiska workflows
3. ✅ Lead scoring
4. ✅ Dashboard för managers
5. ✅ Mobile app (PWA)

### Bra att Ha (Q3 2025)
1. ✅ AI-assistent
2. ✅ Prediktiv analys
3. ✅ SMS-integration
4. ✅ Telefoni-integration
5. ✅ Advanced analytics

### Framtid (Q4 2025+)
1. ✅ Machine learning models
2. ✅ Churn prediction
3. ✅ WhatsApp Business
4. ✅ Native mobile apps
5. ✅ Advanced AI features

---

## 💡 Snabba Wins (Kan Göras Nu)

### 1. Lead Card Component ⚡
**Tid:** 2-3 timmar
**Impact:** Hög
```tsx
// LeadCard.tsx
- Visa all lead-data
- Analys-tidsstämpel
- Ändringshistorik
- Beslutsfattare
- Aktiviteter
```

### 2. Manager Team View ⚡
**Tid:** 3-4 timmar
**Impact:** Hög
```sql
-- manager_teams tabell
-- API endpoints
-- Frontend team-lista
```

### 3. Email Templates ⚡
**Tid:** 2 timmar
**Impact:** Medel
```
- Välkomst-email
- Follow-up email
- Offert-email
- Tack-email
```

### 4. LinkedIn Search Button ⚡
**Tid:** 1 timme
**Impact:** Medel
```tsx
// I LeadCard
<button onClick={() => searchLinkedIn(companyName, title)}>
  Sök på LinkedIn
</button>
```

### 5. Google Search Button ⚡
**Tid:** 30 min
**Impact:** Låg-Medel
```tsx
<button onClick={() => searchGoogle(companyName, title)}>
  Sök på Google
</button>
```

---

## 🎯 Rekommenderad Roadmap

### Vecka 1-2: Grundläggande Förbättringar
- ✅ Lead Card med tidsstämplar
- ✅ Manager hierarki
- ✅ LinkedIn/Google search-knappar
- ✅ Email-templates

### Vecka 3-4: Integrationer
- ✅ Email integration (Gmail/Outlook)
- ✅ LinkedIn API integration
- ✅ Salesforce basic sync

### Vecka 5-6: Pipeline & CRM
- ✅ Pipeline stages
- ✅ Aktivitetslogg
- ✅ Task management
- ✅ Dashboard för managers

### Vecka 7-8: Automatisering
- ✅ Workflows
- ✅ Lead scoring
- ✅ Automatiska påminnelser
- ✅ Data enrichment

### Månad 3+: Advanced Features
- ✅ AI-assistent
- ✅ Prediktiv analys
- ✅ Mobile app
- ✅ Advanced analytics

---

## 📁 Filer att Skapa

### Komponenter
```
src/components/
├── leads/
│   ├── LeadCard.tsx ⭐
│   ├── LeadList.tsx ⭐
│   ├── LeadTimeline.tsx
│   ├── LeadActivities.tsx
│   └── LeadPipeline.tsx
├── managers/
│   ├── TeamView.tsx ⭐
│   ├── TeamStats.tsx
│   └── TeamLeads.tsx
├── integrations/
│   ├── EmailComposer.tsx ⭐
│   ├── LinkedInSearch.tsx ⭐
│   ├── SalesforceSync.tsx
│   └── CalendarIntegration.tsx
└── dashboard/
    ├── ManagerDashboard.tsx
    ├── SalespersonDashboard.tsx
    └── ExecutiveDashboard.tsx
```

### Services
```
services/
├── emailService.ts ⭐
├── linkedinService.ts ⭐
├── salesforceService.ts
├── googleSearchService.ts ⭐
├── workflowService.ts
└── scoringService.ts
```

### Backend Routes
```
server/routes/
├── managers.js ⭐
├── integrations.js ⭐
├── pipeline.js
├── activities.js
└── workflows.js
```

---

## 🎉 Sammanfattning

### Implementera Nu (Högsta Prioritet)
1. ✅ Lead Card med tidsstämplar
2. ✅ Manager hierarki
3. ✅ Email integration
4. ✅ LinkedIn/Google search
5. ✅ Pipeline management

### Nästa Fas
1. ✅ Salesforce integration
2. ✅ Automatisering
3. ✅ AI-features
4. ✅ Mobile app

### Långsiktig Vision
- Komplett CRM-system
- AI-driven säljassistent
- Full automation
- Prediktiv analys
- Enterprise-grade

**Vill du att jag börjar implementera något av detta nu?** 🚀

Jag rekommenderar att börja med:
1. Lead Card (mest efterfrågat)
2. Manager hierarki (viktigt för organisation)
3. Email/LinkedIn integration (produktivitet)
