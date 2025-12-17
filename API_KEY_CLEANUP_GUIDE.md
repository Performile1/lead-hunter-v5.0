# API Key Configuration - Cleanup Guide

## 🎯 Problem
Du har dubbla API-nyckel konfigurationer som kan skapa förvirring:
1. **VITE_ prefixade** (frontend) - ✅ Används av services
2. **Icke-prefixade** (backend) - ❌ Används INTE, men definierade i vite.config.ts
3. **Gamla alias** (`API_KEY`) - ❌ Förvirrande

## 📋 Nuvarande Status

### Services använder (RÄTT):
```typescript
// geminiService.ts, groqService.ts, etc.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
```

### vite.config.ts definierar (ONÖDIGT):
```typescript
// Dessa används INTE av någon service!
'process.env.API_KEY': JSON.stringify(env.API_KEY),
'process.env.GEMINI_API_KEY': JSON.stringify(env.API_KEY),
'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
```

---

## 🔧 Lösning 1: Rensa vite.config.ts (Rekommenderat)

### Steg 1: Uppdatera vite.config.ts
Ta bort onödiga `process.env` definitioner:

```typescript
// vite.config.ts - FÖRE (DÅLIGT)
define: {
  'process.env.API_KEY': JSON.stringify(env.API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.API_KEY),
  'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
  'process.env.BUILTWITH_API_KEY': JSON.stringify(env.BUILTWITH_API_KEY),
  'process.env.NEWS_API_KEY': JSON.stringify(env.NEWS_API_KEY),
  'process.env.NEWSAPI_ORG_KEY': JSON.stringify(env.NEWS_API_KEY)
}

// vite.config.ts - EFTER (BRA)
define: {
  // Vite hanterar VITE_ prefix automatiskt
  // Ingen manuell definition behövs!
}
```

**Eller helt enkelt ta bort hela `define` blocket** - Vite exponerar `VITE_*` variabler automatiskt!

### Steg 2: Rensa .env-filer
Behåll endast `VITE_` prefixade variabler:

```env
# .env - RÄTT KONFIGURATION

# === FRONTEND API KEYS (REQUIRED) ===
VITE_GEMINI_API_KEY=din_gemini_nyckel_här
VITE_GROQ_API_KEY=din_groq_nyckel_här

# === OPTIONAL SERVICES ===
VITE_FIRECRAWL_API_KEY=din_firecrawl_nyckel
VITE_DEEPSEEK_API_KEY=din_deepseek_nyckel
VITE_ALGOLIA_APP_ID=din_algolia_app_id
VITE_ALGOLIA_API_KEY=din_algolia_nyckel
VITE_ALGOLIA_INDEX_NAME=leads

# === BACKEND (endast för serverless functions) ===
DATABASE_URL=postgresql://...
```

### Steg 3: Ta bort gamla variabler
Från `.env`, `.env.local`, `server/.env`:

❌ **Ta bort:**
```env
API_KEY=...                    # Gammal alias
GEMINI_API_KEY=...            # Använd VITE_ prefix istället
GROQ_API_KEY=...              # Använd VITE_ prefix istället
```

✅ **Behåll:**
```env
VITE_GEMINI_API_KEY=...       # Frontend
VITE_GROQ_API_KEY=...         # Frontend
```

---

## 🔧 Lösning 2: Fixa Groq API-nyckel

Din nuvarande Groq-nyckel är ogiltig (401 error):
```
VITE_GROQ_API_KEY=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
```

### Skaffa ny nyckel:
1. Gå till: https://console.groq.com/keys
2. Logga in eller skapa konto (GRATIS)
3. Klicka "Create API Key"
4. Kopiera nyckeln (börjar med `gsk_`)
5. Uppdatera i `.env`:
   ```env
   VITE_GROQ_API_KEY=gsk_DIN_NYA_NYCKEL_HÄR
   ```

---

## 📊 Varför VITE_ prefix?

### Frontend (Browser) - Vite App
```typescript
// ✅ RÄTT - Exponeras automatiskt av Vite
const key = import.meta.env.VITE_GEMINI_API_KEY;
```

**Krav:**
- Måste börja med `VITE_`
- Exponeras till browser
- Läses via `import.meta.env.*`

### Backend (Server) - Node.js
```typescript
// ✅ RÄTT - För serverless functions
const key = process.env.GEMINI_API_KEY;
```

**Krav:**
- Ingen `VITE_` prefix
- Körs på server
- Läses via `process.env.*`

### Din app är Frontend-only!
- Alla AI-anrop görs från browser
- Ingen backend/serverless functions för AI
- **Använd endast `VITE_` prefix**

---

## 🎯 Rekommenderad .env struktur

```env
# ============================================
# FRONTEND API KEYS (VITE_ prefix required)
# ============================================

# === AI Services (REQUIRED) ===
VITE_GEMINI_API_KEY=din_gemini_nyckel
VITE_GROQ_API_KEY=din_groq_nyckel

# === Scraping Services (RECOMMENDED) ===
VITE_FIRECRAWL_API_KEY=din_firecrawl_nyckel
VITE_OCTOPARSE_API_KEY=din_octoparse_nyckel

# === Search (RECOMMENDED) ===
VITE_ALGOLIA_APP_ID=din_algolia_app_id
VITE_ALGOLIA_API_KEY=din_algolia_nyckel
VITE_ALGOLIA_INDEX_NAME=leads

# === Additional AI (OPTIONAL) ===
VITE_DEEPSEEK_API_KEY=din_deepseek_nyckel
VITE_CLAUDE_API_KEY=din_claude_nyckel
VITE_TANDEM_AI_API_KEY=din_tandem_nyckel

# === Swedish Data (OPTIONAL) ===
VITE_RATSIT_API_KEY=din_ratsit_nyckel
VITE_UC_API_KEY=din_uc_nyckel

# === Tech Analysis (OPTIONAL) ===
VITE_BUILTWITH_API_KEY=din_builtwith_nyckel
VITE_WAPPALYZER_API_KEY=din_wappalyzer_nyckel

# === Contact & News (OPTIONAL) ===
VITE_HUNTER_API_KEY=din_hunter_nyckel
VITE_NEWS_API_KEY=din_news_nyckel

# ============================================
# BACKEND (för serverless functions)
# ============================================
DATABASE_URL=postgresql://...
```

---

## ✅ Checklista

### Omedelbart:
- [ ] Skaffa ny Groq API-nyckel från https://console.groq.com/keys
- [ ] Uppdatera `VITE_GROQ_API_KEY` i `.env`
- [ ] Ta bort gamla `API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` (utan VITE_ prefix)
- [ ] Rensa `vite.config.ts` från onödiga `define` entries
- [ ] Starta om servern (`npm run dev`)

### Verifiering:
- [ ] Testa sökning - Groq fallback ska fungera
- [ ] Kolla console - Inga "Invalid API Key" fel
- [ ] Verifiera att `import.meta.env.VITE_GROQ_API_KEY` returnerar rätt nyckel

---

## 🚨 Vanliga Misstag

### ❌ Fel 1: Blandar VITE_ och icke-VITE_
```env
GEMINI_API_KEY=...           # Fungerar INTE i browser
VITE_GEMINI_API_KEY=...      # Fungerar i browser
```

### ❌ Fel 2: Använder process.env i frontend
```typescript
// FUNGERAR INTE i Vite frontend
const key = process.env.GEMINI_API_KEY;

// FUNGERAR i Vite frontend
const key = import.meta.env.VITE_GEMINI_API_KEY;
```

### ❌ Fel 3: Glömmer starta om servern
Efter `.env` ändringar:
```bash
# Stoppa servern (Ctrl+C)
npm run dev  # Starta igen
```

---

## 📞 Support

### Problem: "Invalid API Key" (Groq)
**Lösning:** Skaffa ny nyckel, uppdatera `VITE_GROQ_API_KEY`

### Problem: "undefined" när du läser API-nyckel
**Lösning:** 
1. Kontrollera att variabeln börjar med `VITE_`
2. Starta om servern
3. Använd `import.meta.env.VITE_*` (inte `process.env.*`)

### Problem: Fungerar lokalt men inte i produktion
**Lösning:** 
1. Lägg till environment variables i Vercel dashboard
2. Använd samma `VITE_` prefix
3. Redeploya

---

## 🎓 Sammanfattning

### Nuvarande problem:
1. ❌ Dubbla konfigurationer (VITE_ och icke-VITE_)
2. ❌ Onödiga `process.env` definitioner i vite.config.ts
3. ❌ Ogiltig Groq API-nyckel

### Efter cleanup:
1. ✅ Endast `VITE_` prefixade variabler
2. ✅ Enkel vite.config.ts (Vite hanterar VITE_ automatiskt)
3. ✅ Giltig Groq API-nyckel
4. ✅ Tydlig separation: Frontend (VITE_) vs Backend (ingen prefix)

**Resultat:** Mindre förvirring, enklare underhåll, färre buggar! 🎉
