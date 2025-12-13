# 🔄 Konsolideringsplan & Nya Komponenter

## 📋 Analys av Befintliga Komponenter

### ✅ Komponenter att Behålla (Unika funktioner)

1. **Dashboard.tsx** (root) - Huvuddashboard för alla användare
2. **AdminSettings.tsx** (root) - Allmänna inställningar
3. **TenantManagement.tsx** - Tenant CRUD (endast super admin)
4. **UserManagement.tsx** (src/components/admin) - User CRUD
5. **LeadCard.tsx** - Detaljerad lead-vy
6. **ResultsTable.tsx** - Lead-tabell
7. **CustomerList.tsx** - Kundlista
8. **CustomerDetail.tsx** - Kunddetaljer

### 🔄 Komponenter att Konsolidera

#### 1. Lead Assignment (3 versioner → 1)
**Befintliga:**
- `src/components/admin/LeadAssignment.tsx` - Admin version
- `src/components/terminal/LeadAssignment.tsx` - Terminal version
- `src/components/managers/TeamView.tsx` - Innehåller assignment-logik

**Lösning:** Skapa en unified `LeadAssignmentPanel.tsx` med role-based rendering:
```tsx
<LeadAssignmentPanel 
  role={user.role} 
  scope={user.role === 'admin' ? 'all' : user.role === 'terminal_manager' ? 'terminal' : 'team'}
/>
```

#### 2. Batch Jobs (2 versioner → 1)
**Befintliga:**
- `BatchJobManager.tsx` - Manager
- `BatchJobForm.tsx` - Form

**Lösning:** Behåll båda men integrera i en vy

#### 3. Settings (Flera versioner)
**Befintliga:**
- `AdminSettings.tsx` (root) - 23KB
- `src/components/admin/AdminPanel.tsx` - Överlapp?

**Lösning:** Konsolidera till en Settings-komponent med tabs

### ❌ Komponenter att Ta Bort (Dubletter)

1. **components_archive/** - Hela mappen (gamla versioner)
2. **src/components/admin/AdminPanel.tsx** - Om den överlappar AdminSettings

---

## 🆕 Nya Komponenter att Skapa

### 🔴 HÖGSTA PRIORITET

#### 1. Super Admin Dashboard
**Fil:** `src/components/admin/SuperAdminDashboard.tsx`

**Features:**
- **E-handelsplattformar:** Procent per plattform (Shopify, WooCommerce, Magento, etc.)
- **Checkout-lösningar:** Distribution (Klarna, Stripe, Adyen, etc.)
- **Transportörer:** Marknadsandelar (DHL, PostNord, Bring, etc.)
- **Leveranssätt:** Hemleverans, Utlämningsställe, Paketbox, etc.
- **Tenant Activity:**
  - Senast skapade lead per tenant
  - Senast nedladdade data
  - Senast konverterade kund
  - Aktivitetsflöde
- **System Health:**
  - API-användning
  - Databas-storlek
  - Aktiva användare
  - Felfrekvens

**Backend API:** `/api/admin/analytics`

#### 2. Notification System Backend
**Fil:** `server/routes/notifications.js`

**Endpoints:**
- GET `/api/notifications` - Hämta notifikationer
- POST `/api/notifications/:id/read` - Markera som läst
- POST `/api/notifications/read-all` - Markera alla
- POST `/api/notifications` - Skapa (intern)

**Databas:** Tabell finns redan i schema

#### 3. Analytics API
**Fil:** `server/routes/analytics.js`

**Endpoints:**
- GET `/api/analytics/platforms` - E-handelsplattformar
- GET `/api/analytics/checkout` - Checkout-lösningar
- GET `/api/analytics/carriers` - Transportörer
- GET `/api/analytics/delivery-methods` - Leveranssätt
- GET `/api/analytics/tenant-activity` - Tenant-aktivitet
- GET `/api/analytics/system-health` - Systemhälsa

---

### 🟡 MEDEL PRIORITET

#### 4. Unified Lead Assignment Panel
**Fil:** `src/components/common/LeadAssignmentPanel.tsx`

**Features:**
- Role-based filtering
- Drag-and-drop assignment
- Bulk assignment
- Assignment history

#### 5. Sales Dashboard (för säljare)
**Fil:** `src/components/sales/SalesDashboard.tsx`

**Features:**
- Personliga KPIs
- Lead pipeline
- Dagens uppgifter
- Prestationsmått
- Aktivitetslogg

#### 6. Manager Dashboard
**Fil:** `src/components/managers/ManagerDashboard.tsx`

**Features:**
- Team-översikt
- Team-prestanda
- Lead-pipeline för teamet
- Aktivitetsflöde
- Måluppföljning

#### 7. Tenant Dashboard (för tenant admin)
**Fil:** `src/components/admin/TenantDashboard.tsx`

**Features:**
- Tenant-översikt
- Användningsstatistik
- Team-prestanda
- Quota-status
- Systemhälsa

---

### 🟢 LÅG PRIORITET

#### 8. Lead Pipeline View
**Fil:** `src/components/leads/LeadPipeline.tsx`

**Features:**
- Visuell pipeline (Kanban)
- Drag-and-drop
- Status-tracking
- Filtrering

#### 9. Activity Timeline
**Fil:** `src/components/common/ActivityTimeline.tsx`

**Features:**
- Historik över aktiviteter
- Kommentarer
- Tidslinje-vy
- Filtrering

#### 10. Reports Generator
**Fil:** `src/components/reports/ReportGenerator.tsx`

**Features:**
- Generera rapporter
- Export till Excel/PDF
- Schemalagda rapporter
- Mallar

---

## 🎯 Super Admin Dashboard - Detaljerad Spec

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Super Admin Dashboard                                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Total Tenants│  │ Active Users │  │ Total Leads  │  │
│  │      7       │  │     142      │  │    8,453     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ E-handelsplattformar                                 ││
│  │ ┌────────────────────────────────────────────────┐  ││
│  │ │ Shopify        ████████████████ 45%            │  ││
│  │ │ WooCommerce    ████████████ 30%                │  ││
│  │ │ Magento        ████████ 15%                    │  ││
│  │ │ Custom         ████ 10%                        │  ││
│  │ └────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Checkout-lösningar                                   ││
│  │ ┌────────────────────────────────────────────────┐  ││
│  │ │ Klarna         ████████████████████ 50%        │  ││
│  │ │ Stripe         ████████████ 25%                │  ││
│  │ │ Adyen          ████████ 15%                    │  ││
│  │ │ PayPal         ████ 10%                        │  ││
│  │ └────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Transportörer i Checkout                             ││
│  │ ┌────────────────────────────────────────────────┐  ││
│  │ │ PostNord       ████████████████████ 35%        │  ││
│  │ │ DHL            ████████████████ 28%            │  ││
│  │ │ Bring          ████████████ 20%                │  ││
│  │ │ Budbee         ████████ 12%                    │  ││
│  │ │ Instabox       ████ 5%                         │  ││
│  │ └────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Tenant Activity (Senaste 24h)                       ││
│  │ ┌────────────────────────────────────────────────┐  ││
│  │ │ DHL Freight    • Lead skapad    2 min sedan    │  ││
│  │ │ PostNord       • Data nedladdad 15 min sedan   │  ││
│  │ │ DHL Express    • Kund konverterad 1h sedan     │  ││
│  │ │ Bring          • Analys körd    2h sedan       │  ││
│  │ └────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Data Sources

**E-handelsplattformar:**
```sql
SELECT 
  ecommerce_platform,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM leads
WHERE ecommerce_platform IS NOT NULL
GROUP BY ecommerce_platform
ORDER BY count DESC;
```

**Checkout-lösningar:**
```sql
SELECT 
  checkout_provider,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM website_analysis
WHERE checkout_provider IS NOT NULL
GROUP BY checkout_provider
ORDER BY count DESC;
```

**Transportörer:**
```sql
SELECT 
  provider_name,
  COUNT(*) as count,
  AVG(position_in_checkout) as avg_position,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM shipping_provider_detections
GROUP BY provider_name
ORDER BY count DESC;
```

**Tenant Activity:**
```sql
SELECT 
  t.company_name,
  al.action_type,
  al.created_at,
  u.full_name as user_name
FROM activity_logs al
JOIN users u ON al.user_id = u.id
JOIN tenants t ON u.tenant_id = t.id
WHERE al.created_at > NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC
LIMIT 50;
```

---

## 📊 Ytterligare Förslag för Super Admin

### 1. **Competitive Intelligence Dashboard**
- Vilka konkurrenter dyker upp mest i checkouts
- Marknadsandelar per region
- Trender över tid
- Vem vinner/förlorar marknadsandelar

### 2. **Lead Quality Metrics**
- Genomsnittlig lead-kvalitet per tenant
- Konverteringsgrad lead → kund
- Tid från lead till konvertering
- Lead-sources prestanda

### 3. **System Performance Monitor**
- API response times
- Database query performance
- LLM API-kostnader per tenant
- Error rates och typer

### 4. **Tenant Comparison**
- Jämför tenants prestanda
- Användning vs limits
- Aktivitetsnivå
- ROI-beräkningar

### 5. **Predictive Analytics**
- Förutse vilka leads som konverterar
- Identifiera högrisk-kunder
- Rekommendera åtgärder
- Trendprognoser

### 6. **Audit & Compliance**
- Alla system-ändringar
- User access logs
- Data exports
- GDPR-compliance tracking

### 7. **Billing & Revenue**
- Intäkter per tenant
- Användning vs subscription tier
- Upsell-möjligheter
- Churn risk

---

## 🚀 Implementation Plan

### Fas 1: Kritiska Komponenter (Vecka 1)
1. ✅ Notification System Backend
2. ✅ Analytics API
3. ✅ Super Admin Dashboard (grundläggande)

### Fas 2: Konsolidering (Vecka 2)
1. Unified Lead Assignment Panel
2. Ta bort dubletter
3. Konsolidera settings

### Fas 3: Role-Specifika Dashboards (Vecka 3)
1. Sales Dashboard
2. Manager Dashboard
3. Tenant Dashboard

### Fas 4: Advanced Features (Vecka 4)
1. Lead Pipeline View
2. Reports Generator
3. Competitive Intelligence

---

## 📝 Sammanfattning

**Att Ta Bort:**
- components_archive/ (hela mappen)
- Eventuellt AdminPanel.tsx om den överlappar

**Att Konsolidera:**
- 3 Lead Assignment → 1 Unified
- Settings-komponenter → 1 med tabs

**Att Skapa (Prioriterat):**
1. 🔴 Super Admin Dashboard
2. 🔴 Notification System Backend
3. 🔴 Analytics API
4. 🟡 Sales Dashboard
5. 🟡 Manager Dashboard
6. 🟡 Tenant Dashboard
7. 🟢 Lead Pipeline
8. 🟢 Reports Generator

**Förväntad Effekt:**
- Mindre kodduplicering
- Bättre översikt för super admin
- Mer insikter i e-handelsmarknaden
- Enklare att underhålla
