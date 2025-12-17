# 🚀 VERCEL DEPLOYMENT & TESTING GUIDE

**Datum:** 2025-12-17  
**Status:** Redo för production deployment  
**Commit:** `340c7a9` + settings integration

---

## ✅ **VAD SOM ÄR KLART:**

### **1. Error Handling (Vit sida-fix)**
- ✅ ErrorBoundary implementerad
- ✅ AI fallback-system (Gemini → Groq → DeepSeek)
- ✅ Användarvänliga felmeddelanden

### **2. Settings för alla roller**
- ✅ ManagerSettings.tsx
- ✅ TerminalSettings.tsx
- ✅ SalesSettings.tsx
- ✅ Integrerade i respektive dashboard

### **3. API-nycklar**
- ✅ Alla 8 nycklar tillagda i Vercel
- ✅ .env skapad lokalt (för referens)

---

## 🔧 **VERCEL DEPLOYMENT:**

### **Steg 1: Verifiera att alla ändringar är pushade**

```bash
git status
# Ska visa: "nothing to commit, working tree clean"

git log --oneline -5
# Senaste commits:
# 340c7a9 CRITICAL FIX: Add error handling, fallback system, and missing settings
# 02d28d8 Optimize all prompts with Firecrawl, NewsAPI, and improved LinkedIn search
# 1bed91a Add comprehensive prompt optimization analysis
```

### **Steg 2: Vercel Auto-Deploy**

Vercel deployer automatiskt när du pushar till `master`:

1. **Gå till Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Välj ditt projekt: `lead-hunter-v5.0`

2. **Kontrollera deployment status:**
   - Senaste deployment ska vara från commit `340c7a9`
   - Status: "Building..." → "Ready"
   - Deployment URL: `https://lead-hunter-v5-0.vercel.app` (eller din custom domain)

3. **Vänta på build:**
   - Bygg-tid: ~2-5 minuter
   - Vercel visar live logs under bygget

### **Steg 3: Verifiera Environment Variables**

Gå till: **Project Settings → Environment Variables**

Kontrollera att alla 8 nycklar finns:

```
VITE_GEMINI_API_KEY=AIza...
VITE_GROQ_API_KEY=sk-proj-...
VITE_DEEPSEEK_API_KEY=sk-...
VITE_FIRECRAWL_API_KEY=fc-...
VITE_ALGOLIA_APP_ID=...
VITE_ALGOLIA_API_KEY=...
VITE_ALGOLIA_INDEX_NAME=leads
VITE_NEWS_API_KEY=...
```

**OBS:** Använd de faktiska nycklarna från din `.env` fil eller Vercel dashboard.

**Viktigt:** Alla ska vara tillgängliga för både **Production** och **Preview**.

---

## 🧪 **TESTING PÅ VERCEL:**

### **Test 1: Vit sida-fix (KRITISKT)**

**Mål:** Verifiera att ingen vit sida visas vid fel

**Steg:**
1. Öppna din Vercel-URL i webbläsaren
2. Logga in
3. Gör en sökning på ett företag (t.ex. "ACME AB")
4. **Förväntat resultat:**
   - Om Gemini failar → Automatisk fallback till Groq
   - Om alla AI-tjänster failar → Användarvänligt felmeddelande
   - **INGEN VIT SIDA**

**Kontrollera:**
- Öppna Developer Console (F12)
- Kolla efter fel i Console-fliken
- Verifiera att ErrorBoundary fångar fel

**Exempel på förväntat beteende:**
```
🤖 Trying GEMINI...
⚠️ GEMINI failed: Quota exceeded
🤖 Trying GROQ...
✅ GROQ succeeded
```

---

### **Test 2: Settings för alla roller**

**Mål:** Verifiera att alla roller har settings

#### **Test 2A: Manager Settings**
1. Logga in som Manager
2. Klicka på "Inställningar"-knappen i dashboard
3. Verifiera att alla 4 tabs fungerar:
   - Team
   - Mål
   - Notiser
   - Rapporter
4. Ändra något och klicka "Spara ändringar"
5. Verifiera att "Sparat!" visas

#### **Test 2B: Terminal Manager Settings**
1. Logga in som Terminal Manager
2. Klicka på "Inställningar"-fliken i navigation
3. Verifiera att alla 4 tabs fungerar:
   - Terminal
   - Säljare
   - Fördelning
   - Mål

#### **Test 2C: Sales Settings**
1. Logga in som Säljare
2. Klicka på "Inställningar"-knappen i dashboard
3. Verifiera att alla 4 tabs fungerar:
   - Profil
   - Mål
   - Notiser
   - Preferenser

---

### **Test 3: AI Fallback-system**

**Mål:** Verifiera att fallback fungerar

**Scenario 1: Gemini quota exceeded**
1. Gör många sökningar tills Gemini når quota
2. Verifiera att Groq tar över automatiskt
3. Kontrollera Console för fallback-meddelanden

**Scenario 2: Alla AI-tjänster failar**
1. Tillfälligt ta bort alla API-nycklar i Vercel (för test)
2. Gör en sökning
3. Verifiera att användarvänligt felmeddelande visas
4. Lägg tillbaka API-nycklarna

---

### **Test 4: Prompt-optimeringar**

**Mål:** Verifiera att nya prompts fungerar

**Test 4A: Firecrawl-integration**
1. Gör en Deep Analysis på ett företag
2. Verifiera att org.nr hittas korrekt
3. Verifiera att omsättning extraheras från Allabolag

**Test 4B: LinkedIn-sökning (Google, inte scraping)**
1. Gör en Deep Analysis
2. Verifiera att kontaktpersoner hittas
3. Kontrollera att LinkedIn-URLs är korrekta (börjar med https://www.linkedin.com/in/)

**Test 4C: NewsAPI**
1. Gör en Deep Analysis
2. Verifiera att företagsnyheter visas
3. Kontrollera att nyheter är relevanta och från senaste 30 dagarna

---

## 🔍 **DEBUGGING PÅ VERCEL:**

### **Visa Vercel Logs:**

1. Gå till Vercel Dashboard
2. Välj ditt projekt
3. Klicka på senaste deployment
4. Klicka på "Functions" eller "Logs"
5. Filtrera på errors

### **Console Logs i Browser:**

Öppna Developer Console (F12) och kolla efter:

```javascript
// Bra tecken:
🤖 Trying GEMINI...
✅ GEMINI succeeded
📊 JSON extraherat från Steg 1

// Varningar (OK, fallback fungerar):
⚠️ GEMINI failed: Quota exceeded
🤖 Trying GROQ...
✅ GROQ succeeded

// Fel (behöver åtgärdas):
❌ All AI services failed
❌ KRITISKT: Org.nummer saknas
```

---

## 🚨 **VANLIGA PROBLEM & LÖSNINGAR:**

### **Problem 1: Vit sida visas fortfarande**

**Orsak:** ErrorBoundary fångar inte felet

**Lösning:**
1. Kontrollera att `App.tsx` är wrappat med ErrorBoundary
2. Kolla Console för uncaught errors
3. Verifiera att alla komponenter är importerade korrekt

### **Problem 2: "API Key missing" error**

**Orsak:** Environment variables inte laddade

**Lösning:**
1. Gå till Vercel → Settings → Environment Variables
2. Verifiera att alla 8 nycklar finns
3. Kontrollera att de är tillgängliga för Production
4. Redeploy projektet (Vercel → Deployments → Redeploy)

### **Problem 3: Settings-knapp saknas**

**Orsak:** Gamla filer cachade i browser

**Lösning:**
1. Hårdladda sidan: Ctrl+Shift+R (Windows) eller Cmd+Shift+R (Mac)
2. Rensa browser cache
3. Öppna i Incognito-läge

### **Problem 4: AI-analys tar för lång tid**

**Orsak:** Gemini är långsam eller har nått quota

**Lösning:**
1. Kontrollera Console för fallback-meddelanden
2. Verifiera att Groq-nyckel fungerar
3. Överväg att använda Groq som primär för Quick Scan

---

## 📊 **PERFORMANCE METRICS:**

### **Förväntade svarstider:**

| Operation | Gemini | Groq | DeepSeek |
|-----------|--------|------|----------|
| Quick Scan | 5-10s | 2-5s | 3-7s |
| Deep Analysis | 15-30s | 8-15s | 10-20s |
| Batch (10 företag) | 2-5 min | 1-3 min | 1.5-4 min |

### **API Quotas:**

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Gemini | 60 req/min | Unlimited |
| Groq | 30 req/min | 6000 req/min |
| DeepSeek | 60 req/min | Unlimited |
| Firecrawl | 500 req/month | Custom |
| NewsAPI | 100 req/day | 1000+ req/day |

---

## ✅ **CHECKLISTA FÖR VERCEL-TEST:**

```
□ Vercel deployment klar (commit 340c7a9)
□ Alla 8 API-nycklar verifierade i Vercel
□ Vit sida-fix testad (ErrorBoundary fungerar)
□ Manager Settings fungerar
□ Terminal Manager Settings fungerar
□ Sales Settings fungerar
□ AI fallback-system testat (Gemini → Groq → DeepSeek)
□ Firecrawl-integration fungerar (org.nr, omsättning)
□ LinkedIn-sökning fungerar (Google, inte scraping)
□ NewsAPI fungerar (företagsnyheter)
□ Inga console errors
□ Performance acceptabel (<30s för Deep Analysis)
```

---

## 🎯 **NÄSTA STEG EFTER TEST:**

### **Om allt fungerar:**
✅ Systemet är production-ready
✅ Dokumentera eventuella buggar i GitHub Issues
✅ Övervaka Vercel logs för errors

### **Om problem hittas:**
1. Dokumentera exakt vad som hände
2. Kopiera Console logs
3. Kopiera Vercel Function logs
4. Rapportera till utvecklare med alla detaljer

---

## 📞 **SUPPORT:**

**Om du stöter på problem:**
1. Kolla först i denna guide under "Vanliga Problem"
2. Kontrollera Vercel logs
3. Kontrollera Browser Console
4. Dokumentera felet noggrant
5. Kontakta support med:
   - Exakt felmeddelande
   - Console logs
   - Vercel Function logs
   - Steg för att reproducera

---

**Lycka till med testningen! 🚀**
