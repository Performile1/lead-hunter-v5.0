# Vercel Environment Variables - Lead Hunter v5.0.4

## 🔑 Alla Environment Variables för Nytt Vercel-Projekt

Kopiera dessa till Vercel Dashboard → Settings → Environment Variables

---

## ✅ KRITISKA (Måste ha för att appen ska fungera)

```bash
# NewsAPI - För företagsnyheter
VITE_NEWSAPI_ORG_KEY=28879aac75384ce0944917ecc31a5653

# Database - PostgreSQL/Supabase (Backend)
DATABASE_URL=postgresql://postgres.nkejygbqvqcciqfdbabe:[YOUR-PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
DB_HOST=aws-1-eu-north-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.nkejygbqvqcciqfdbabe
DB_PASSWORD=din_supabase_password

# JWT för autentisering
JWT_SECRET=C3sy1MoW8dflVYz4J5AnBHge0NqKQbGx
JWT_EXPIRES_IN=7d
```

---

## 🤖 AI Services (Rekommenderade)

```bash
# Google Gemini - Primär AI för lead-analys
VITE_GEMINI_API_KEY=din_gemini_api_key

# OpenAI GPT-4 - Backup AI
VITE_OPENAI_API_KEY=din_openai_api_key

# Anthropic Claude - Backup AI
VITE_CLAUDE_API_KEY=din_claude_api_key

# Groq - Snabb AI för enklare analyser
VITE_GROQ_API_KEY=din_groq_api_key
```

---

## 📧 Kontaktpersons-sökning (Rekommenderade)

```bash
# Hunter.io - Email-sökning och verifiering
VITE_HUNTER_API_KEY=din_hunter_api_key

# Apollo.io - Kontaktpersons-databas
VITE_APOLLO_API_KEY=din_apollo_api_key
```

---

## 🔍 Tech Stack Analysis (Valfria)

```bash
# BuiltWith - Teknisk stack-analys
VITE_BUILTWITH_API_KEY=din_builtwith_api_key

# Wappalyzer - Teknologi-detektion
VITE_WAPPALYZER_API_KEY=din_wappalyzer_api_key
```

---

## 🔎 Google Search (Valfria)

```bash
# Google Custom Search - För företagssökning
VITE_GOOGLE_API_KEY=din_google_api_key
VITE_GOOGLE_SEARCH_ENGINE_ID=din_search_engine_id
```

---

## 💼 CRM Integration (Valfria)

```bash
# Salesforce - CRM-integration
VITE_SALESFORCE_CLIENT_ID=din_salesforce_client_id
VITE_SALESFORCE_CLIENT_SECRET=din_salesforce_client_secret
VITE_SALESFORCE_USERNAME=din_salesforce_username
VITE_SALESFORCE_PASSWORD=din_salesforce_password
VITE_SALESFORCE_SECURITY_TOKEN=din_salesforce_security_token
VITE_SALESFORCE_INSTANCE_URL=https://yourinstance.salesforce.com
```

---

## 🔗 LinkedIn (Valfria)

```bash
# LinkedIn - Kontaktpersons-sökning
VITE_LINKEDIN_ACCESS_TOKEN=din_linkedin_token
```

---

## 💳 Kreditupplysning (Valfria)

```bash
# Kreditupplysning.se - Skuld-information
VITE_KREDITUPPLYSNING_API_KEY=din_kreditupplysning_api_key
```

---

## 🔍 Web Search (Valfria)

```bash
# Tavily - Web search för AI
VITE_TAVILY_API_KEY=din_tavily_api_key
```

---

## 📋 Sammanfattning av Prioritet

### MÅSTE HA (Kritiska):
1. ✅ `VITE_NEWSAPI_ORG_KEY` - Företagsnyheter
2. ✅ `DATABASE_URL` - PostgreSQL/Supabase databas
3. ✅ `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Databas-credentials
4. ✅ `JWT_SECRET` - JWT autentisering
5. ✅ `JWT_EXPIRES_IN` - JWT token livslängd

### BÖR HA (Rekommenderade):
2. 🤖 `VITE_GEMINI_API_KEY` - Primär AI
3. 🤖 `VITE_OPENAI_API_KEY` - Backup AI
4. 🤖 `VITE_GROQ_API_KEY` - Snabb AI
5. 📧 `VITE_HUNTER_API_KEY` - Email-sökning
6. 📧 `VITE_APOLLO_API_KEY` - Kontaktpersoner

### KAN HA (Valfria):
7. 🔍 `VITE_BUILTWITH_API_KEY` - Tech stack
8. 🔍 `VITE_WAPPALYZER_API_KEY` - Tech detection
9. 🔎 `VITE_GOOGLE_API_KEY` - Google search
10. 💼 Salesforce credentials - CRM integration
11. 🔗 `VITE_LINKEDIN_ACCESS_TOKEN` - LinkedIn
12. 💳 `VITE_KREDITUPPLYSNING_API_KEY` - Kreditupplysning
13. 🔍 `VITE_TAVILY_API_KEY` - Web search

---

## 🚀 Hur man lägger till i Vercel

### Steg 1: Gå till Vercel Dashboard
```
https://vercel.com/dashboard
```

### Steg 2: Välj ditt projekt
- Klicka på det nya projektet du just skapade

### Steg 3: Settings → Environment Variables
- Klicka på **"Settings"** i sidomenyn
- Klicka på **"Environment Variables"**

### Steg 4: Lägg till variabler
För varje variabel:
1. Klicka **"Add New"**
2. **Name:** `VITE_NEWSAPI_ORG_KEY` (exakt som ovan)
3. **Value:** `28879aac75384ce0944917ecc31a5653` (din API-nyckel)
4. **Environment:** Välj alla (Production, Preview, Development)
5. Klicka **"Save"**

### Steg 5: Redeploy
Efter att du lagt till alla variabler:
1. Gå till **"Deployments"**
2. Klicka på senaste deployment
3. Klicka **"..." → "Redeploy"**

---

## ⚠️ VIKTIGT

- **Alla variabler MÅSTE börja med `VITE_`** för att Vite ska kunna läsa dem
- **Lägg till minst `VITE_NEWSAPI_ORG_KEY`** för att appen ska fungera
- **Lägg till AI-nycklar** för att få lead-analys att fungera
- **Environment:** Välj alla tre (Production, Preview, Development)

---

## 🎯 Minimal Konfiguration (För att testa)

Om du bara vill testa att appen fungerar utan alla features:

```bash
VITE_NEWSAPI_ORG_KEY=28879aac75384ce0944917ecc31a5653
```

Detta är tillräckligt för att:
- ✅ Appen laddar utan krasch
- ✅ Dashboard fungerar
- ✅ Login fungerar
- ✅ Företagsnyheter hämtas

---

## 🔐 Säkerhet

- **Dela ALDRIG dessa nycklar publikt**
- **Använd olika nycklar för development och production**
- **Rotera nycklar regelbundet**
- **Vercel krypterar alla environment variables automatiskt**

---

**Skapad:** 2025-12-20  
**Version:** 5.0.4  
**Status:** Production Ready
