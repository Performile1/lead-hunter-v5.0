# Quota Tracking System - Setup Guide

## 📊 Översikt

Det nya quota tracking-systemet spårar API-användning per tenant i realtid och visar korrekta värden i SuperAdmin-panelen.

## 🚀 Installation

### 1. Kör databas-migration

```bash
# Anslut till din PostgreSQL-databas
psql -U your_user -d your_database

# Kör migrationen
\i server/migrations/011_api_usage_tracking.sql
```

Eller via Node.js:

```bash
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync('server/migrations/011_api_usage_tracking.sql', 'utf8');
pool.query(sql).then(() => {
  console.log('✅ Migration completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
"
```

### 2. Starta servern

```bash
cd server
npm start
```

### 3. Verifiera API-endpoints

Testa att quota-API:et fungerar:

```bash
# Hämta quota-statistik (kräver autentisering)
curl -X GET http://localhost:3001/api/quotas/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Förväntat svar:
{
  "quotas": [
    {
      "name": "Gemini",
      "service": "AI Analysis",
      "used": 0,
      "limit": 20,
      "percentage": 0,
      "status": "healthy",
      ...
    }
  ],
  "tenant_id": null,
  "is_super_admin": true
}
```

## 🔧 Integrera i AI-services

För att quota-systemet ska fungera måste du integrera `trackUsage()` i dina AI-service anrop:

### Exempel: Gemini Service

```javascript
import { trackUsage } from '../services/quotaTrackingService.js';

async function callGeminiAPI(prompt, tenantId, userId) {
  // Kolla om quota finns tillgänglig
  const hasQuota = quotaService.hasQuotaAvailable('gemini', tenantId);
  if (!hasQuota) {
    throw new Error('Gemini quota exceeded. Please wait or use fallback service.');
  }

  // Gör API-anrop
  const response = await gemini.generateContent(prompt);
  
  // Spåra användning
  await trackUsage('gemini', tenantId, userId);
  
  return response;
}
```

### Exempel: Groq Service

```javascript
async function callGroqAPI(prompt, tenantId, userId) {
  const hasQuota = quotaService.hasQuotaAvailable('groq', tenantId);
  if (!hasQuota) {
    throw new Error('Groq quota exceeded.');
  }

  const response = await groq.chat.completions.create({...});
  
  await trackUsage('groq', tenantId, userId);
  
  return response;
}
```

### Exempel: Firecrawl Service

```javascript
async function scrapeWebsite(url, tenantId, userId) {
  const hasQuota = quotaService.hasQuotaAvailable('firecrawl', tenantId);
  if (!hasQuota) {
    throw new Error('Firecrawl quota exceeded.');
  }

  const data = await firecrawl.scrape(url);
  
  await trackUsage('firecrawl', tenantId, userId);
  
  return data;
}
```

## 📈 Quota-gränser

Per tenant:

| Service   | Hourly | Daily   | Monthly   |
|-----------|--------|---------|-----------|
| Gemini    | 20     | 100     | -         |
| Groq      | 14,400 | 14,400  | -         |
| Firecrawl | -      | -       | 500       |
| DeepSeek  | -      | -       | 1,000,000 |
| NewsAPI   | -      | 100     | -         |

## 🎯 Användning i SuperAdmin

1. Logga in som SuperAdmin
2. Gå till "Quota Management" panel
3. Se realtids-användning för alla services
4. Klicka "Återställ Quota" för att manuellt nollställa en service
5. Auto-refresh uppdaterar data var 60:e sekund

## 🔄 API-endpoints

### GET /api/quotas/stats
Hämta alla quota-statistik för current tenant/global

**Response:**
```json
{
  "quotas": [...],
  "tenant_id": "uuid",
  "is_super_admin": false
}
```

### POST /api/quotas/track
Spåra API-användning (anropas automatiskt av services)

**Body:**
```json
{
  "service": "gemini"
}
```

### POST /api/quotas/reset
Återställ quota för en service (SuperAdmin only)

**Body:**
```json
{
  "service": "gemini",
  "tenant_id": "uuid" // optional
}
```

### GET /api/quotas/check/:service
Kolla om quota finns tillgänglig

**Response:**
```json
{
  "service": "gemini",
  "has_quota_available": true,
  "usage": {...},
  "time_until_reset_ms": 3600000
}
```

## 🐛 Felsökning

### Quota visar 0 för alla services
- Kontrollera att `trackUsage()` anropas i dina AI-services
- Verifiera att migrationen har körts korrekt
- Kolla server-loggar för fel

### "Failed to fetch quota stats"
- Kontrollera att servern körs på port 3001
- Verifiera att du är inloggad (token finns)
- Kolla CORS-inställningar

### Quota återställs inte automatiskt
- Systemet använder in-memory cache som rensas automatiskt
- Vid server-restart nollställs alla quotas
- Manuell reset via API fungerar alltid

## 📝 Nästa steg

1. ✅ Kör databas-migration
2. ⏳ Integrera `trackUsage()` i alla AI-service anrop
3. ⏳ Testa i SuperAdmin-panelen
4. ⏳ Övervaka quota-användning i produktion
5. ⏳ Justera limits vid behov

## 🎉 Resultat

Efter implementering kommer SuperAdmin-panelen att visa:
- ✅ Korrekta quota-värden per tenant
- ✅ Realtids-användning
- ✅ Status-indikatorer (healthy/warning/critical)
- ✅ Tid tills reset
- ✅ Trend-analys
- ✅ Möjlighet att manuellt återställa quotas

Inga mer felaktiga värden som "18/20 Gemini" när inga sökningar har gjorts! 🎊
