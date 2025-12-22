# Kompletta Environment Variables för Vercel - Lead Hunter v5.0.4

Baserat på `.env.example` - Alla variabler som projektet använder.

---

## ✅ KRITISKA (Måste ha för att appen ska fungera)

```bash
# === FRONTEND API KEYS (VITE_ prefix för Vite) ===
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here

# === DATABASE ===
DATABASE_URL=postgresql://postgres.nkejygbqvqcciqfdbabe:[YOUR-PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
DB_HOST=aws-1-eu-north-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.nkejygbqvqcciqfdbabe
DB_PASSWORD=your_supabase_password

# === JWT AUTHENTICATION ===
JWT_SECRET=C3sy1MoW8dflVYz4J5AnBHge0NqKQbGx
JWT_EXPIRES_IN=7d

# === SERVER CONFIG ===
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://lead-hunter-v5-fixed.vercel.app,https://lead-hunter-v5-0.vercel.app
```

---

## 🤖 AI SERVICES (Rekommenderade)

```bash
# === BACKEND AI KEYS (utan VITE_ prefix) ===
API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# === FRONTEND AI KEYS (med VITE_ prefix) ===
VITE_CLAUDE_API_KEY=your_claude_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

---

## 📰 NEWS & DATA (Rekommenderade)

```bash
# NewsAPI - För företagsnyheter
NEWS_API_KEY=your_newsapi_key_here
VITE_NEWS_API_KEY=your_newsapi_key_here
VITE_NEWSAPI_ORG_KEY=28879aac75384ce0944917ecc31a5653
```

---

## 🇸🇪 SWEDISH BUSINESS DATA (Rekommenderade)

```bash
# Ratsit - För svensk företagsdata och kreditbetyg
RATSIT_API_KEY=your_ratsit_api_key_here
VITE_RATSIT_API_KEY=your_ratsit_api_key_here

# UC (Upplysningscentralen) - För kreditrapporter
UC_API_KEY=your_uc_api_key_here
VITE_UC_API_KEY=your_uc_api_key_here
```

---

## 📧 EMAIL & VERIFICATION (Rekommenderade)

```bash
# Hunter.io - För email-verifiering och sökning
HUNTER_API_KEY=your_hunter_api_key_here
VITE_HUNTER_API_KEY=your_hunter_api_key_here

# Apollo.io - För kontaktpersoner
VITE_APOLLO_API_KEY=your_apollo_api_key_here
```

---

## 🔍 TECH ANALYSIS (Valfria)

```bash
# BuiltWith - För detaljerad tech stack-analys
BUILTWITH_API_KEY=your_builtwith_api_key_here
VITE_BUILTWITH_API_KEY=your_builtwith_api_key_here

# Wappalyzer - För teknologi-detektion
WAPPALYZER_API_KEY=your_wappalyzer_api_key_here
VITE_WAPPALYZER_API_KEY=your_wappalyzer_api_key_here
```

---

## 🔎 SEARCH & SCRAPING (Valfria)

```bash
# Google Search API
GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
VITE_GOOGLE_API_KEY=your_google_search_api_key_here
VITE_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here

# Algolia - För snabb sökindexering
ALGOLIA_APP_ID=your_algolia_app_id_here
ALGOLIA_API_KEY=your_algolia_api_key_here
ALGOLIA_INDEX_NAME=leads

# Firecrawl - För intelligent web scraping
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
VITE_FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Octoparse - Cloud-baserad web scraping
OCTOPARSE_API_KEY=your_octoparse_api_key_here

# Browse.ai - För automatiserad web scraping
BROWSE_AI_API_KEY=your_browse_ai_api_key_here

# Crawl4AI - AI-powered web crawling
CRAWL4AI_ENABLED=true
```

---

## 🔗 ADDITIONAL SERVICES (Valfria)

```bash
# Tandem.ai - AI samarbete och analys
TANDEM_AI_API_KEY=your_tandem_ai_api_key_here

# Tavily - Web search för AI
VITE_TAVILY_API_KEY=your_tavily_api_key_here

# LinkedIn
VITE_LINKEDIN_ACCESS_TOKEN=your_linkedin_token

# Kreditupplysning.se
VITE_KREDITUPPLYSNING_API_KEY=your_kreditupplysning_api_key

# Salesforce CRM
VITE_SALESFORCE_CLIENT_ID=your_salesforce_client_id
VITE_SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret
VITE_SALESFORCE_USERNAME=your_salesforce_username
VITE_SALESFORCE_PASSWORD=your_salesforce_password
VITE_SALESFORCE_SECURITY_TOKEN=your_salesforce_security_token
VITE_SALESFORCE_INSTANCE_URL=https://yourinstance.salesforce.com
```

---

## 🎯 MINIMAL KONFIGURATION (För att testa)

Om du bara vill testa att appen fungerar, lägg till minst dessa:

```bash
# Frontend AI
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here

# Backend AI
API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Database
DATABASE_URL=postgresql://postgres.nkejygbqvqcciqfdbabe:[YOUR-PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
DB_HOST=aws-1-eu-north-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.nkejygbqvqcciqfdbabe
DB_PASSWORD=your_supabase_password

# JWT
JWT_SECRET=C3sy1MoW8dflVYz4J5AnBHge0NqKQbGx
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app

# News (med befintlig nyckel)
VITE_NEWSAPI_ORG_KEY=28879aac75384ce0944917ecc31a5653
```

---

## 📋 VIKTIGA NOTER

### VITE_ Prefix
- **Frontend-kod** (services/, src/): Använd `VITE_` prefix
- **Backend-kod** (server/): Använd UTAN `VITE_` prefix
- Vissa variabler behöver båda versionerna

### Dubbletter
Dessa variabler behöver både med och utan `VITE_` prefix:
- `GEMINI_API_KEY` / `VITE_GEMINI_API_KEY`
- `GROQ_API_KEY` / `VITE_GROQ_API_KEY`
- `NEWS_API_KEY` / `VITE_NEWS_API_KEY`
- `HUNTER_API_KEY` / `VITE_HUNTER_API_KEY`
- osv.

### Environment i Vercel
När du lägger till i Vercel, välj:
- ✅ Production
- ✅ Preview
- ✅ Development

---

## 🚀 Deployment Checklist

1. ✅ Lägg till alla KRITISKA variabler
2. ✅ Lägg till AI Services (minst Gemini + Groq)
3. ✅ Lägg till News API
4. ✅ Ersätt `[YOUR-PASSWORD]` med faktiskt lösenord
5. ✅ Uppdatera `ALLOWED_ORIGINS` med din Vercel URL
6. ✅ Välj alla tre environments för varje variabel
7. ✅ Redeploy efter att alla variabler är tillagda

---

**Skapad:** 2025-12-21  
**Version:** 5.0.4  
**Baserad på:** .env.example
