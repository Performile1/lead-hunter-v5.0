# 📊 Dashboard Refactor Plan

## Översikt

Flytta alla inställningar från dashboard-cards till Verktyg-menyn i topbar.
Fokusera dashboards på metrics, grafer och data-visualisering.

---

## 🎯 Mål

### **Före:**
- Dashboard = Cards med knappar för inställningar
- Otydligt om ändringar sparats
- Ingen fokus på metrics

### **Efter:**
- Dashboard = Grafer, metrics, statistik
- Alla inställningar i Verktyg-menyn (topbar)
- Tydliga "Spara"-knappar överallt
- Fokus på leads, kunder, quota, felrapporter

---

## 📋 Ändringar per Dashboard

### **1. SuperAdmin Dashboard**

#### **Ta bort från dashboard:**
- ❌ "System Inställningar" card
- ❌ "Hantera Tenants" card
- ❌ "Hantera Användare" card
- ❌ "API-nycklar" card

#### **Behåll/Lägg till:**
- ✅ **Leads per Tenant** (graf)
- ✅ **Kunder per Tenant** (graf)
- ✅ **API Quota Usage** (graf)
- ✅ **Felrapporter** (lista)
- ✅ **Senaste Cronjobs** (timeline)
- ✅ **Nya Leads** (efter cronjob)
- ✅ **Behandlade Leads** (kontaktade, felaktiga, konverterade)
- ✅ **Per Säljare Statistik** (tabell)

#### **Grafer:**
```
┌─────────────────────────────────────────────────┐
│ Leads per Tenant (senaste 30 dagarna)          │
│ [Linjediagram]                                  │
│ DHL: ████████ 150                               │
│ PostNord: ██████ 120                            │
│ Bring: ████ 80                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ API Quota Usage                                 │
│ [Cirkeldiagram]                                 │
│ Gemini: 75% (750/1000)                          │
│ Groq: 45% (450/1000)                            │
│ OpenAI: 20% (200/1000)                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Behandlade Leads (denna månad)                  │
│ [Stapeldiagram]                                 │
│ Kontaktade: ████████ 250                        │
│ Felaktiga: ██ 30                                │
│ Konverterade: ████ 80                           │
└─────────────────────────────────────────────────┘
```

---

### **2. Sales Dashboard**

#### **Ta bort från dashboard:**
- ❌ "Inställningar" card (flytta till Verktyg)

#### **Behåll/Lägg till:**
- ✅ **Mina Leads** (trend-graf)
- ✅ **Mina Kunder** (trend-graf)
- ✅ **Konverteringsrate** (gauge)
- ✅ **Pipeline** (funnel-graf)
- ✅ **Dagens Uppgifter** (lista)
- ✅ **Prestanda vs Mål** (progress bars)
- ✅ **Nya Leads** (efter cronjob)
- ✅ **Behandlade Leads** (status breakdown)

#### **Grafer:**
```
┌─────────────────────────────────────────────────┐
│ Mina Leads (senaste 7 dagarna)                  │
│ [Linjediagram med trendlinje]                   │
│ Mån: 5, Tis: 8, Ons: 12, Tor: 10, Fre: 15      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Pipeline Funnel                                 │
│ [Funnel-diagram]                                │
│ Nya: 50 ████████████████████                    │
│ Kontaktade: 35 ████████████████                 │
│ Kvalificerade: 20 ██████████                    │
│ Offert: 10 █████                                │
│ Förhandling: 5 ██                               │
└─────────────────────────────────────────────────┘
```

---

### **3. Manager Dashboard**

#### **Behåll/Lägg till:**
- ✅ **Team Performance** (graf per säljare)
- ✅ **Team Leads** (trend-graf)
- ✅ **Team Konvertering** (jämförelse)
- ✅ **Top Performers** (leaderboard)
- ✅ **Nya Leads** (team total)
- ✅ **Behandlade Leads** (per säljare)
- ✅ **Quota Status** (per säljare)

#### **Grafer:**
```
┌─────────────────────────────────────────────────┐
│ Team Performance (denna månad)                  │
│ [Grupperat stapeldiagram]                       │
│ Anna: Leads ████ 45, Kunder ██ 12               │
│ Erik: Leads ██████ 60, Kunder ███ 18            │
│ Lisa: Leads ███ 38, Kunder ██ 10                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Konverteringsrate per Säljare                   │
│ [Horisontellt stapeldiagram]                    │
│ Erik: ████████████ 30%                          │
│ Lisa: ████████ 26%                              │
│ Anna: ██████ 20%                                │
└─────────────────────────────────────────────────┘
```

---

### **4. Terminal Manager Dashboard**

#### **Behåll/Lägg till:**
- ✅ **Terminal Performance** (graf)
- ✅ **Leveranser** (timeline)
- ✅ **Kvalitet** (metrics)
- ✅ **Team Status** (översikt)
- ✅ **Nya Leads** (för terminalen)
- ✅ **Behandlade Leads** (status)

---

## 🔧 Verktyg-meny Struktur

### **SuperAdmin:**
```
Verktyg
├── API-nycklar
│   ├── Gemini API Key [Spara]
│   ├── Groq API Key [Spara]
│   ├── OpenAI API Key [Spara]
│   └── Synka till Vercel [✓]
├── Hantera Tenants
│   ├── Lista tenants
│   ├── Skapa ny tenant [Spara]
│   └── Redigera tenant [Spara]
├── Hantera Användare
│   ├── Lista användare
│   ├── Skapa ny användare [Spara]
│   └── Redigera användare [Spara]
├── Konfigurera Scraping
│   ├── Timeout-inställningar [Spara]
│   ├── Retry-inställningar [Spara]
│   └── API-prioritering [Spara]
└── Konfigurera Quota
    ├── Per Tenant Limits [Spara]
    ├── API Rate Limits [Spara]
    └── Storage Limits [Spara]
```

### **Tenant Admin:**
```
Verktyg
├── Inställningar
│   ├── Företagsinformation [Spara]
│   ├── Färgtema [Spara]
│   └── Notifikationer [Spara]
└── Användare
    ├── Lista användare
    ├── Bjud in användare [Spara]
    └── Hantera roller [Spara]
```

---

## 💾 Spara-knappar

### **Alla formulär ska ha:**
```tsx
<div className="flex items-center justify-between mt-6">
  <button
    onClick={handleCancel}
    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
  >
    Avbryt
  </button>
  
  <div className="flex gap-3">
    {hasChanges && (
      <span className="text-sm text-orange-600 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Osparade ändringar
      </span>
    )}
    
    <button
      onClick={handleSave}
      disabled={!hasChanges || saving}
      className="px-6 py-2 bg-[#FFC400] text-black font-bold rounded hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving ? 'Sparar...' : 'Spara'}
    </button>
  </div>
</div>
```

### **Success/Error Feedback:**
```tsx
{saveStatus === 'success' && (
  <div className="bg-green-50 border border-green-200 p-4 rounded flex items-center gap-2">
    <CheckCircle className="w-5 h-5 text-green-600" />
    <span className="text-green-800 font-semibold">Ändringar sparade!</span>
  </div>
)}

{saveStatus === 'error' && (
  <div className="bg-red-50 border border-red-200 p-4 rounded flex items-center gap-2">
    <XCircle className="w-5 h-5 text-red-600" />
    <span className="text-red-800 font-semibold">Kunde inte spara: {errorMessage}</span>
  </div>
)}
```

---

## 📈 Graf-bibliotek

### **Rekommendation: Recharts**
```bash
npm install recharts
```

### **Exempel:**
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<LineChart width={600} height={300} data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="leads" stroke="#FFC400" strokeWidth={2} />
  <Line type="monotone" dataKey="customers" stroke="#000000" strokeWidth={2} />
</LineChart>
```

---

## 🐍 Python Backend för Puppeteer

### **Varför Python?**
- Puppeteer är JavaScript/Node.js (inte Python)
- **Men:** Om ni vill använda Playwright (Python-alternativ)

### **Alternativ 1: Behåll Puppeteer (Node.js)**
```javascript
// Redan implementerat i checkoutDetectionService.js
import puppeteer from 'puppeteer';
```

### **Alternativ 2: Playwright (Python)**
```python
# python-backend/scraper.py
from playwright.async_api import async_playwright

async def scrape_checkout(url):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(url)
        # ... scraping logic
        await browser.close()
```

### **Rekommendation:**
**Behåll Puppeteer (Node.js)** - Det fungerar redan bra och är enklare att deploya på Vercel.

---

## ✅ Implementation Checklist

### **Phase 1: TopBar & Verktyg-meny**
- [x] Skapa TopBar.tsx
- [ ] Integrera TopBar i alla dashboards
- [ ] Skapa modal/drawer för verktyg
- [ ] Implementera routing för verktyg

### **Phase 2: Spara-knappar**
- [ ] Lägg till i API Keys-formulär
- [ ] Lägg till i Quota-formulär
- [ ] Lägg till i Tenant-formulär
- [ ] Lägg till i User-formulär
- [ ] Lägg till i Scraping-formulär
- [ ] Implementera "hasChanges" tracking

### **Phase 3: Dashboard Refactor**
- [ ] SuperAdmin: Ta bort settings cards
- [ ] SuperAdmin: Lägg till grafer
- [ ] Sales: Lägg till grafer
- [ ] Manager: Lägg till grafer
- [ ] Terminal: Lägg till grafer

### **Phase 4: Vercel Integration**
- [ ] Skapa Vercel API Token
- [ ] Lägg till env vars
- [ ] Implementera backend sync
- [ ] Testa integration

### **Phase 5: Graf-implementation**
- [ ] Installera Recharts
- [ ] Skapa graf-komponenter
- [ ] Integrera i dashboards
- [ ] Lägg till real-time data

---

Vill du att jag fortsätter med implementation? 🚀
