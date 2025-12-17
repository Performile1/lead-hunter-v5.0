# 🔍 Settings Audit - Alla användarroller

**Syfte:** Komplett översikt över vilka inställningar som finns för varje användarroll  
**Datum:** 2025-12-17  
**Status:** Audit komplett

---

## 📊 **SAMMANFATTNING:**

### **Befintliga inställningar:**

| Roll | Dashboard | Settings-sidor | Status |
|------|-----------|----------------|--------|
| **Super Admin** | ✅ SuperAdminDashboard | ✅ SuperAdminSettings, APIKeysPanel, ScrapingConfigPanel, QuotaManagementPanel, LLMConfigPanel, TenantSegmentConfig, CronJobsPanel, RequestQueueMonitor, BatchJobManager, SalesTerritoryManager | ✅ KOMPLETT |
| **Tenant Admin** | ✅ TenantDashboard | ⚠️ Använder SuperAdminSettings (fel!) | 🟡 BEHÖVER EGEN |
| **Manager** | ✅ ManagerDashboard | ❌ Ingen settings-sida | 🔴 SAKNAS |
| **Terminal Manager** | ✅ TerminalDashboard | ❌ Ingen settings-sida | 🔴 SAKNAS |
| **Sales (FS/TS/KAM/DM)** | ✅ SalesDashboard | ❌ Ingen settings-sida | 🔴 SAKNAS |

---

## 🔴 **SUPER ADMIN - KOMPLETT**

### **Dashboard:** `SuperAdminDashboard.tsx`

**Navigering:**
- ✅ API-nycklar (APIKeysPanel)
- ✅ Scraping (ScrapingConfigPanel)
- ✅ Quota (QuotaManagementPanel)
- ✅ Tenants (TenantManagement)
- ✅ Användare (SuperAdminUserManagement)
- ✅ Leads (SuperAdminLeadSearch)
- ✅ Kunder (SuperAdminCustomers)
- ✅ Felrapporter (ErrorReportReview)
- ✅ Inställningar (SuperAdminSettings)

### **Settings-komponenter:**

#### **1. SuperAdminSettings.tsx**
**Innehåll:**
- System-wide inställningar
- LLM-konfiguration
- Segment-konfiguration
- Request Queue-inställningar
- Cron Jobs
- Batch Jobs
- Sales Territory

**Tabs:**
- LLM Config (LLMConfigPanel)
- Segment Config (TenantSegmentConfig)
- Request Queue (RequestQueueMonitor)
- Cron Jobs (CronJobsPanel)
- Batch Jobs (BatchJobManager)
- Sales Territory (SalesTerritoryManager)

#### **2. APIKeysPanel.tsx** ← NY
**Innehåll:**
- Visa alla API-nycklar
- Testa nycklar
- Status för varje nyckel
- Länkar till dokumentation

#### **3. ScrapingConfigPanel.tsx** ← NY
**Innehåll:**
- Scraping-metod (Traditional/AI/Hybrid)
- Timeout & retries
- Cache-inställningar
- User Agent
- Headless mode

#### **4. QuotaManagementPanel.tsx** ← NY
**Innehåll:**
- Realtidsövervakning av quota
- Varningar och alerts
- Auto-refresh
- Tröskelvärden

#### **5. LLMConfigPanel.tsx**
**Innehåll:**
- Gemini-inställningar
- Groq-inställningar
- DeepSeek-inställningar
- Fallback-ordning

#### **6. TenantSegmentConfig.tsx**
**Innehåll:**
- Segment-definitioner
- Segment-regler
- Tenant-tilldelning

#### **7. CronJobsPanel.tsx**
**Innehåll:**
- Schemalagda jobb
- Jobb-status
- Jobb-historik

#### **8. RequestQueueMonitor.tsx**
**Innehåll:**
- Request Queue-status
- Rate limiting
- Retry-logik

#### **9. BatchJobManager.tsx**
**Innehåll:**
- Batch-jobb
- Jobb-status
- Jobb-historik

#### **10. SalesTerritoryManager.tsx**
**Innehåll:**
- Säljområden
- Territorium-tilldelning
- Territorium-regler

**Status:** ✅ **KOMPLETT - 10 settings-komponenter**

---

## 🟡 **TENANT ADMIN - BEHÖVER EGEN SETTINGS**

### **Dashboard:** `TenantDashboard.tsx`

**Nuvarande situation:**
- ⚠️ Använder `SuperAdminSettings` (fel!)
- ❌ Ingen tenant-specifik settings-sida

### **Vad som behövs:**

#### **TenantSettings.tsx** (SAKNAS)
**Innehåll:**
- Företagsinformation
- Logotyp
- Färgtema
- Kontaktinformation
- Faktureringsuppgifter
- Användarhantering (endast egna användare)
- Lead-inställningar
- Export-inställningar

**Prioritet:** 🟡 MEDEL (Tenant Admin kan använda Super Admin Settings tillfälligt)

---

## 🔴 **MANAGER - SAKNAS HELT**

### **Dashboard:** `ManagerDashboard.tsx`

**Nuvarande situation:**
- ❌ Ingen settings-sida alls
- ❌ Ingen navigation till settings

### **Vad som behövs:**

#### **ManagerSettings.tsx** (SAKNAS)
**Innehåll:**
- Team-mål
- KPI-inställningar
- Rapportinställningar
- Team-medlemmar
- Territorium-översikt
- Notifikationsinställningar

**Prioritet:** 🟢 LÅG (Managers behöver främst rapporter, inte inställningar)

---

## 🔴 **TERMINAL MANAGER - SAKNAS HELT**

### **Dashboard:** `TerminalDashboard.tsx`

**Nuvarande situation:**
- ❌ Ingen settings-sida alls
- ❌ Ingen navigation till settings

### **Vad som behövs:**

#### **TerminalSettings.tsx** (SAKNAS)
**Innehåll:**
- Terminal-information
- Terminal-mål
- Terminal-KPI:er
- Terminal-team
- Notifikationsinställningar

**Prioritet:** 🟢 LÅG (Terminal Managers behöver främst operativa vyer)

---

## 🔴 **SALES (FS/TS/KAM/DM) - SAKNAS HELT**

### **Dashboard:** `SalesDashboard.tsx`

**Nuvarande situation:**
- ❌ Ingen settings-sida alls
- ❌ Ingen navigation till settings

### **Vad som behövs:**

#### **PersonalSettings.tsx** (SAKNAS)
**Innehåll:**
- Personliga preferenser
- Notifikationsinställningar
- Dashboard-layout
- Export-format
- Språk
- Tidszon

**Prioritet:** 🟢 LÅG (Säljare behöver främst leads och kunder, inte inställningar)

---

## 🎯 **PROTOKOLL-ANALYS:**

### **Problem med nuvarande implementation:**

#### **1. APIKeysPanel - BRYTER PROTOKOLL**
**Problem:**
- ❌ Kräver manuell testning
- ❌ Kräver manuell inmatning
- ❌ Nycklar ska vara i Vercel, inte i UI

**Lösning:**
- ✅ Konvertera till **read-only monitoring**
- ✅ Visa endast status (från environment variables)
- ✅ Ingen edit-funktionalitet
- ✅ Automatisk testning i bakgrunden

#### **2. ScrapingConfigPanel - DELVIS BRYTER PROTOKOLL**
**Problem:**
- ❌ Kräver manuell konfiguration
- ⚠️ Inställningar ska vara hårdkodade

**Lösning:**
- ✅ Skapa `services/scraperConfig.ts` med defaults
- ✅ Konvertera panel till **monitoring + override**
- ✅ Visa aktuell konfiguration
- ✅ Tillåt override för debugging (Super Admin only)

#### **3. QuotaManagementPanel - OK**
**Status:**
- ✅ Endast monitoring (ingen edit)
- ✅ Följer protokoll
- ✅ Automatisk refresh

---

## 📋 **REKOMMENDATIONER:**

### **Prioritet 1: Fixa protokoll-brott (2-3h)**

#### **A. Hårdkoda konfiguration i kod:**

**Skapa:** `services/scraperConfig.ts`
```typescript
export const SCRAPER_CONFIG = {
  method: 'traditional' as const,
  timeout: 30000,
  retries: 3,
  cacheEnabled: true,
  cacheDuration: 24,
  headless: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};
```

**Skapa:** `services/quotaConfig.ts`
```typescript
export const QUOTA_CONFIG = {
  warningThreshold: 70,
  criticalThreshold: 90,
  autoRefresh: true,
  refreshInterval: 60
};
```

#### **B. Konvertera APIKeysPanel till read-only:**
- Ta bort edit-funktionalitet
- Ta bort "Testa alla nycklar"-knapp
- Visa endast status från environment
- Automatisk testning i bakgrunden (var 5:e minut)

#### **C. Konvertera ScrapingConfigPanel till monitoring:**
- Visa aktuell konfiguration från `scraperConfig.ts`
- Ta bort edit-funktionalitet (eller gör read-only)
- Visa endast status och statistik

### **Prioritet 2: Lägg till API-nycklar i Vercel (15 min)**

**Vercel Dashboard:**
1. Gå till: https://vercel.com/dashboard
2. Settings → Environment Variables
3. Lägg till:
   - `VITE_GEMINI_API_KEY`
   - `VITE_GROQ_API_KEY`
   - `VITE_FIRECRAWL_API_KEY`
4. Välj: Production + Preview
5. Redeploy

### **Prioritet 3: Skapa saknade settings (valfritt, 4-6h)**

**Om tid finns:**
- TenantSettings.tsx (4h)
- ManagerSettings.tsx (2h)
- TerminalSettings.tsx (2h)
- PersonalSettings.tsx (2h)

**Men:**
- 🟢 Inte kritiskt
- 🟢 Kan vänta
- 🟢 Nuvarande lösning fungerar

---

## ✅ **SLUTSATS:**

### **Vad som finns:**
- ✅ Super Admin: 10 settings-komponenter (KOMPLETT)
- ⚠️ Tenant Admin: Använder Super Admin Settings (fungerar men inte optimalt)
- ❌ Manager: Ingen settings (inte kritiskt)
- ❌ Terminal Manager: Ingen settings (inte kritiskt)
- ❌ Sales: Ingen settings (inte kritiskt)

### **Vad som behöver fixas:**
1. **APIKeysPanel** → Konvertera till read-only monitoring (1h)
2. **ScrapingConfigPanel** → Hårdkoda config i kod (1h)
3. **Vercel** → Lägg till API-nycklar (15 min)

### **Vad som kan vänta:**
- TenantSettings.tsx
- ManagerSettings.tsx
- TerminalSettings.tsx
- PersonalSettings.tsx

**Total tid för protokoll-compliance:** ~2-3h

---

## 🚀 **NÄSTA STEG:**

1. **Skapa config-filer** (30 min)
2. **Konvertera panels till read-only** (1.5h)
3. **Lägg till nycklar i Vercel** (15 min)
4. **Testa** (30 min)
5. **Commit** (5 min)

**Total:** ~3h för full protokoll-compliance

