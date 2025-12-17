# 🔑 API-nycklar Checklista - Komplett Guide

**Datum:** 2025-12-17  
**Syfte:** Exakt lista över alla API-nycklar och var de ska läggas till  
**Status:** Action-ready

---

## ✅ **SNABB CHECKLISTA:**

### **Steg 1: Lokal utveckling (.env i root)**
- [ ] Skapa/uppdatera `.env` i root-mappen
- [ ] Lägg till KRITISKA nycklar (Gemini, Groq)
- [ ] Lägg till REKOMMENDERADE nycklar (Firecrawl)
- [ ] Starta om servern: `npm run dev`

### **Steg 2: Vercel production**
- [ ] Logga in på Vercel Dashboard
- [ ] Lägg till samma nycklar i Environment Variables
- [ ] Välj: Production + Preview (INTE Development)
- [ ] Redeploy

### **Steg 3: Testa**
- [ ] Testa lokalt
- [ ] Testa i production
- [ ] Klart!

---

## 📍 **VAR SKA NYCKLARNA LÄGGAS TILL?**

### **2 platser:**

1. **`.env` (root-mappen)** - För lokal utveckling
   ```
   lead-hunter-v5.0/
   ├── .env                    ← HÄR (lokal utveckling)
   ├── package.json
   ├── vite.config.ts
   └── ...
   ```

2. **Vercel Dashboard** - För production
   ```
   https://vercel.com/dashboard
   → Välj projekt: lead-hunter-v5.0
   → Settings → Environment Variables
   → Lägg till nycklar
   ```

---

## 🔴 **KRITISKA API-NYCKLAR (MÅSTE HA):**

### **1. Gemini (Google)**

**Var:** `.env` + Vercel

**Nyckel:**
```env
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://aistudio.google.com/app/apikey
2. Klicka "Create API Key"
3. Kopiera nyckeln
4. Lägg till i `.env` och Vercel

**Kostnad:** GRATIS (20 requests/dag per modell)  
**Används för:** AI-analys, kontaktpersoner, opportunity score

---

### **2. Groq**

**Var:** `.env` + Vercel

**Nyckel:**
```env
VITE_GROQ_API_KEY=gsk_...din_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://console.groq.com/keys
2. Klicka "Create API Key"
3. Kopiera nyckeln (börjar med `gsk_`)
4. Lägg till i `.env` och Vercel

**Kostnad:** GRATIS (14,400 requests/dag)  
**Används för:** Fallback när Gemini når quota, snabbare analys

---

## 🟡 **REKOMMENDERADE API-NYCKLAR:**

### **3. Firecrawl**

**Var:** `.env` + Vercel

**Nyckel:**
```env
VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
```

**Har redan nyckel:** `fc-0fe3e552a23248159a621397d9a29b1b`

**Kostnad:** Freemium (500 credits/månad gratis)  
**Används för:** Allabolag-scraping, webbplatser, nyheter

---

### **4. DeepSeek (valfritt)**

**Var:** `.env` + Vercel

**Nyckel:**
```env
VITE_DEEPSEEK_API_KEY=din_deepseek_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://platform.deepseek.com
2. Skapa konto
3. API Keys → Create new key
4. Lägg till i `.env` och Vercel

**Kostnad:** $0.14/1M tokens (mycket billig)  
**Används för:** Backup AI-analys

---

### **5. Algolia (valfritt)**

**Var:** `.env` + Vercel

**Nycklar:**
```env
VITE_ALGOLIA_APP_ID=din_app_id_här
VITE_ALGOLIA_API_KEY=din_algolia_nyckel_här
VITE_ALGOLIA_INDEX_NAME=leads
```

**Skaffa nycklar:**
1. Gå till: https://www.algolia.com
2. Skapa konto
3. Settings → API Keys
4. Kopiera Application ID och Search API Key
5. Lägg till i `.env` och Vercel

**Kostnad:** Gratis (10,000 records)  
**Används för:** Sökfunktionalitet (ej integrerad ännu)

---

## 🟢 **VALFRIA API-NYCKLAR:**

### **6. NewsAPI (valfritt)**

**Var:** `.env` + Vercel

**Nyckel:**
```env
VITE_NEWS_API_KEY=din_news_api_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://newsapi.org
2. Skapa konto (gratis)
3. Kopiera API key
4. Lägg till i `.env` och Vercel

**Kostnad:** Gratis (100 requests/dag)  
**Används för:** Nyhetsökning om företag

---

### **7. Claude (valfritt, betald)**

**Var:** `.env` + Vercel

**Nyckel:**
```env
VITE_CLAUDE_API_KEY=sk-ant-api03-...din_nyckel_här
```

**Skaffa nyckel:**
1. Gå till: https://console.anthropic.com
2. Skapa konto + lägg till betalkort
3. API Keys → Create key
4. Lägg till i `.env` och Vercel

**Kostnad:** $3-15/1M tokens  
**Används för:** Premium AI-analys (ej integrerad ännu)

---

## 📝 **KOMPLETT .env FIL:**

### **Minimal (endast kritiska):**

```env
# ============================================
# LEAD HUNTER v5.0 - Environment Variables
# ============================================

# === KRITISKA API-NYCKLAR (MÅSTE HA) ===
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel_här
VITE_GROQ_API_KEY=gsk_...din_nyckel_här
```

---

### **Rekommenderad (kritiska + rekommenderade):**

```env
# ============================================
# LEAD HUNTER v5.0 - Environment Variables
# ============================================

# === KRITISKA API-NYCKLAR (MÅSTE HA) ===
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel_här
VITE_GROQ_API_KEY=gsk_...din_nyckel_här

# === REKOMMENDERADE API-NYCKLAR ===
VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
VITE_DEEPSEEK_API_KEY=din_deepseek_nyckel_här
VITE_ALGOLIA_APP_ID=din_algolia_app_id
VITE_ALGOLIA_API_KEY=din_algolia_nyckel
VITE_ALGOLIA_INDEX_NAME=leads
```

---

### **Full (alla nycklar):**

```env
# ============================================
# LEAD HUNTER v5.0 - Environment Variables
# ============================================

# === KRITISKA API-NYCKLAR (MÅSTE HA) ===
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel_här
VITE_GROQ_API_KEY=gsk_...din_nyckel_här

# === REKOMMENDERADE API-NYCKLAR ===
VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
VITE_DEEPSEEK_API_KEY=din_deepseek_nyckel_här
VITE_ALGOLIA_APP_ID=din_algolia_app_id
VITE_ALGOLIA_API_KEY=din_algolia_nyckel
VITE_ALGOLIA_INDEX_NAME=leads

# === VALFRIA API-NYCKLAR ===
VITE_NEWS_API_KEY=din_news_api_nyckel_här
VITE_CLAUDE_API_KEY=sk-ant-api03-...din_nyckel_här
```

---

## 🚀 **STEG-FÖR-STEG GUIDE:**

### **STEG 1: Skapa .env fil (5 min)**

**1.1 Öppna root-mappen:**
```bash
cd c:\Users\A\Downloads\lead-hunter-v5.0
```

**1.2 Skapa .env fil:**
```bash
notepad .env
```

**1.3 Kopiera och klistra in:**
```env
# === KRITISKA API-NYCKLAR ===
VITE_GEMINI_API_KEY=din_gemini_nyckel_här
VITE_GROQ_API_KEY=din_groq_nyckel_här

# === REKOMMENDERADE ===
VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b
```

**1.4 Ersätt "din_*_nyckel_här" med riktiga nycklar**

**1.5 Spara och stäng**

---

### **STEG 2: Skaffa API-nycklar (10 min)**

**2.1 Gemini:**
- Gå till: https://aistudio.google.com/app/apikey
- Klicka "Create API Key"
- Kopiera nyckeln
- Klistra in i `.env` efter `VITE_GEMINI_API_KEY=`

**2.2 Groq:**
- Gå till: https://console.groq.com/keys
- Klicka "Create API Key"
- Kopiera nyckeln (börjar med `gsk_`)
- Klistra in i `.env` efter `VITE_GROQ_API_KEY=`

**2.3 Firecrawl:**
- Använd befintlig nyckel: `fc-0fe3e552a23248159a621397d9a29b1b`
- Redan ifylld i exemplet ovan

---

### **STEG 3: Testa lokalt (2 min)**

**3.1 Starta servern:**
```bash
npm run dev
```

**3.2 Öppna browser:**
```
http://localhost:5173
```

**3.3 Logga in och testa:**
- Sök efter ett företag
- Kontrollera att AI-analys fungerar
- Kontrollera att data hämtas

---

### **STEG 4: Lägg till i Vercel (15 min)**

**4.1 Logga in på Vercel:**
```
https://vercel.com/dashboard
```

**4.2 Välj projekt:**
- Klicka på: `lead-hunter-v5.0`

**4.3 Gå till Environment Variables:**
- Settings → Environment Variables

**4.4 Lägg till varje nyckel:**

**För varje nyckel:**
1. Klicka "Add New"
2. Name: `VITE_GEMINI_API_KEY` (exakt som i .env)
3. Value: Din nyckel
4. Environment: Välj **Production** + **Preview** (INTE Development)
5. Klicka "Save"

**Upprepa för:**
- `VITE_GEMINI_API_KEY`
- `VITE_GROQ_API_KEY`
- `VITE_FIRECRAWL_API_KEY`
- (Valfritt) `VITE_DEEPSEEK_API_KEY`
- (Valfritt) `VITE_ALGOLIA_APP_ID`
- (Valfritt) `VITE_ALGOLIA_API_KEY`
- (Valfritt) `VITE_ALGOLIA_INDEX_NAME`

**4.5 Redeploy:**
- Gå till "Deployments"
- Klicka på senaste deployment
- Klicka "Redeploy"
- Vänta 2-3 minuter

---

### **STEG 5: Verifiera production (5 min)**

**5.1 Öppna production URL:**
```
https://your-app.vercel.app
```

**5.2 Öppna browser console (F12):**
```javascript
// Kör detta i console:
console.log('Gemini:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...');
console.log('Groq:', import.meta.env.VITE_GROQ_API_KEY?.substring(0, 10) + '...');
```

**Förväntat resultat:**
```
Gemini: AIzaSy...
Groq: gsk_...
```

**5.3 Testa funktionalitet:**
- Logga in
- Sök efter företag
- Kontrollera att AI-analys fungerar

---

## ⚠️ **VIKTIGT ATT VETA:**

### **1. Prefix VITE_ är obligatoriskt**
```env
✅ VITE_GEMINI_API_KEY=...     # Fungerar
❌ GEMINI_API_KEY=...          # Fungerar INTE
```

### **2. .env ska vara i ROOT, inte i server/**
```
✅ lead-hunter-v5.0/.env       # Rätt plats
❌ lead-hunter-v5.0/server/.env # Fel plats
```

### **3. Starta om servern efter ändringar**
```bash
# Stoppa servern
Ctrl+C

# Rensa Vite cache
Remove-Item -Recurse -Force node_modules\.vite

# Starta om
npm run dev
```

### **4. Vercel: Production + Preview, INTE Development**
```
✅ Production   # Välj denna
✅ Preview      # Välj denna
❌ Development  # Välj INTE denna (använd lokal .env)
```

---

## 🔧 **ANNAT SOM MÅSTE GÖRAS:**

### **✅ Ingenting mer!**

**Om du har gjort:**
1. ✅ Lagt till nycklar i `.env`
2. ✅ Lagt till nycklar i Vercel
3. ✅ Redeployat
4. ✅ Testat lokalt och i production

**Då är du klar!**

---

## 📊 **SAMMANFATTNING:**

### **Vad du behöver:**
- 🔴 **MÅSTE HA:** Gemini + Groq (gratis)
- 🟡 **BÖR HA:** Firecrawl (gratis tier)
- 🟢 **KAN HA:** DeepSeek, Algolia, NewsAPI (valfritt)

### **Var du lägger dem:**
- 📁 **Lokal:** `.env` i root
- ☁️ **Production:** Vercel Environment Variables

### **Tid:**
- ⏱️ **Total:** ~30 minuter
- ⏱️ **Kritiska nycklar:** ~15 minuter

---

## 🎯 **SNABB CHECKLISTA (COPY-PASTE):**

```
□ Skapa .env i root
□ Lägg till VITE_GEMINI_API_KEY
□ Lägg till VITE_GROQ_API_KEY
□ Lägg till VITE_FIRECRAWL_API_KEY
□ Spara .env
□ Starta om: npm run dev
□ Testa lokalt
□ Logga in på Vercel
□ Settings → Environment Variables
□ Lägg till alla VITE_* variabler
□ Välj: Production + Preview
□ Redeploy
□ Testa production
□ KLART!
```

---

**Version:** 5.0  
**Status:** Komplett action-ready checklista  
**Tid:** ~30 minuter total

