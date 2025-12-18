# 🚀 Setup Instructions - Lead Hunter v5.0

## 📋 Översikt

Denna guide hjälper dig att sätta upp alla nya funktioner:
1. ✅ Databas migrations (Supabase)
2. ✅ Vercel API integration för API-nycklar
3. ✅ SuperAdmin settings integration

---

## 1️⃣ Supabase Database Setup

### **Steg 1: Gå till Supabase Dashboard**
```
https://app.supabase.com/project/YOUR_PROJECT_ID
→ SQL Editor
```

### **Steg 2: Kör migrations i ordning**

Kopiera och kör dessa SQL-filer en i taget:

#### **Befintliga migrations (om inte redan körda):**
1. `server/migrations/003_multi_tenant_system.sql`
2. `server/migrations/004_add_subdomain_to_tenants.sql`
3. `server/migrations/005_error_reports_simple.sql`
4. `server/migrations/add_deep_analysis_table.sql`
5. `server/migrations/add_financial_metrics.sql`

#### **NYA migrations (kör dessa nu):**
6. ✅ `server/migrations/006_add_tenant_settings.sql` ⚠️ **VIKTIGT**
7. ✅ `server/migrations/007_add_audit_logs.sql` ⚠️ **VIKTIGT**
8. ✅ `server/migrations/008_add_api_quota.sql` ⚠️ **VIKTIGT**
9. 📋 `server/migrations/009_add_shared_lead_access.sql` (optional)

### **Steg 3: Verifiera**
```sql
-- Kolla att alla tabeller finns
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Förväntat resultat ska inkludera:
-- ✅ tenant_settings
-- ✅ audit_logs
-- ✅ api_quota
```

---

## 2️⃣ Vercel API Integration

### **Steg 1: Lägg till Vercel credentials i .env**

Öppna `.env` och lägg till:

```bash
# Vercel API Integration
VERCEL_TOKEN=ysjOcFl9gpFYkOUsfj8b39rG
VERCEL_PROJECT_ID=prj_QfsIMxbgtyXq1bOvnXsDgcyG03w2
VERCEL_TEAM_ID=Rickard wigrund's projects
```

### **Steg 2: Lägg till i Vercel Dashboard**

Gå till Vercel Dashboard:
```
https://vercel.com/YOUR_PROJECT/settings/environment-variables
```

Lägg till samma variabler:
- `VERCEL_TOKEN` = `ysjOcFl9gpFYkOUsfj8b39rG`
- `VERCEL_PROJECT_ID` = `prj_QfsIMxbgtyXq1bOvnXsDgcyG03w2`
- `VERCEL_TEAM_ID` = `Rickard wigrund's projects`

**Target:** Production, Preview, Development

### **Steg 3: Redeploy**

```bash
# Från terminalen:
git push

# Eller från Vercel Dashboard:
Deployments → Redeploy
```

---

## 3️⃣ Testa SuperAdmin Settings

### **Steg 1: Logga in som SuperAdmin**

Gå till applikationen och logga in med SuperAdmin-konto.

### **Steg 2: Navigera till Settings**

Dashboard → **"System Inställningar"** card (vit card längst ner till höger)

### **Steg 3: Uppdatera API-nycklar**

1. Scrolla till **"API-nycklar & Environment Variables"**
2. Fyll i dina API-nycklar:
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `FIRECRAWL_API_KEY`
3. Klicka **"Spara & Uppdatera Vercel"**
4. Vänta på bekräftelse: ✅ "API-nycklar sparade och uppdaterade i Vercel!"

### **Steg 4: Verifiera i Vercel**

Gå till Vercel Dashboard:
```
https://vercel.com/YOUR_PROJECT/settings/environment-variables
```

Kontrollera att dina API-nycklar har uppdaterats.

---

## 4️⃣ Befintliga Verktyg (Redan implementerade)

Du har redan dessa verktyg i SuperAdmin Dashboard:

### **Quick Actions Cards:**

1. **API-nycklar** (röd card)
   - Hantera och testa API-nycklar
   - Synkar automatiskt till Vercel

2. **Konfigurera Scraping** (gul card)
   - Puppeteer & AI-inställningar
   - Timeout och retry-logik

3. **Övervaka Quota** (svart card)
   - Realtidsövervakning av API-användning
   - Per tenant och provider

4. **Hantera Tenants** (gul card)
   - Skapa/redigera/radera tenants
   - Tenant-specifika inställningar

5. **Hantera Användare** (svart card)
   - Användarhantering
   - Roller och behörigheter

6. **Visa Alla Leads** (vit card)
   - Alla leads från databasen
   - Filtrera och exportera

7. **Visa Kunder** (vit card)
   - Alla kunder
   - Konverteringsstatistik

8. **Granska Felrapporter** (vit card)
   - Kvalitetskontroll
   - Felsökning

9. **System Inställningar** (vit card)
   - Backup & underhåll
   - Notifikationer
   - Tenant-gränser

---

## 5️⃣ Nya Tabeller och Funktioner

### **tenant_settings**
Lagrar tenant-specifika inställningar:
- Primary carrier (DHL, PostNord, etc)
- Lead sharing preferences
- Scraping timeout settings
- Notification preferences

### **audit_logs**
Säkerhetsloggning:
- API-nyckel ändringar
- Tenant-ändringar
- Användaraktivitet
- IP-adress tracking

### **api_quota**
API-användning tracking:
- Per tenant och provider
- Requests, tokens, cost
- Quota limits och varningar

---

## 6️⃣ Troubleshooting

### **Problem: Vercel sync misslyckades**

**Lösning:**
1. Kontrollera att `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, och `VERCEL_TEAM_ID` är korrekt konfigurerade
2. Kolla Vercel API token permissions
3. Se server logs: `vercel logs`

### **Problem: Migrations misslyckas**

**Lösning:**
1. Kolla att du kör migrations i rätt ordning
2. Se Supabase logs: Dashboard → Logs → Postgres Logs
3. Kör migrations en i taget

### **Problem: API-nycklar sparas inte**

**Lösning:**
1. Kontrollera att du är inloggad som SuperAdmin
2. Kolla browser console för fel
3. Verifiera att backend endpoint `/api/admin/env-vars` fungerar

---

## 7️⃣ Nästa Steg

### **Rekommenderade åtgärder:**

1. ✅ Kör alla nya migrations i Supabase
2. ✅ Lägg till Vercel credentials i .env
3. ✅ Testa API-nyckel uppdatering
4. ✅ Verifiera att Vercel sync fungerar
5. 📋 Sätt upp backup-rutiner
6. 📋 Konfigurera audit logging
7. 📋 Sätt upp API quota limits

---

## 📚 Dokumentation

### **Relaterade filer:**
- `DATABASE_AUDIT.md` - Komplett databas-översikt
- `SUPABASE_SETUP_GUIDE.md` - Detaljerad Supabase-guide
- `VERCEL_API_INTEGRATION.md` - Vercel API-dokumentation
- `DASHBOARD_REFACTOR_PLAN.md` - Dashboard-refactor plan

---

## 🆘 Support

### **Loggar:**
```bash
# Backend logs (lokal utveckling)
npm run dev

# Vercel logs (production)
vercel logs

# Supabase logs
Dashboard → Logs → Postgres Logs
```

### **Endpoints att testa:**
```bash
# Hämta env vars
GET /api/admin/env-vars

# Uppdatera env vars
POST /api/admin/env-vars
Body: { "envVars": { "GROQ_API_KEY": "..." } }
```

---

## ✅ Checklist

- [ ] Kör migration 006_add_tenant_settings.sql
- [ ] Kör migration 007_add_audit_logs.sql
- [ ] Kör migration 008_add_api_quota.sql
- [ ] Lägg till VERCEL_TOKEN i .env
- [ ] Lägg till VERCEL_PROJECT_ID i .env
- [ ] Lägg till VERCEL_TEAM_ID i .env
- [ ] Lägg till Vercel credentials i Vercel Dashboard
- [ ] Redeploy applikationen
- [ ] Testa API-nyckel uppdatering
- [ ] Verifiera Vercel sync
- [ ] Kolla audit logs fungerar
- [ ] Kolla API quota tracking fungerar

---

Lycka till! 🚀
