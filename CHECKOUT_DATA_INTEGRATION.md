# 🛒 Checkout Data Integration Guide

## 📊 Översikt

Guide för att koppla checkout scraping till databasen och visa grafer i dashboards.

---

## 🔧 Problem & Lösning

### **❌ Nuvarande Problem:**
1. **Checkout scraping sparar INTE till databasen** - Data finns bara i minnet
2. **Leads-tabellen saknar kolumner** för checkout-data
3. **SuperAdmin dashboard visar tomma grafer**
4. **Manager/Terminal dashboards saknar grafer**

### **✅ Lösning:**
1. ✅ Skapa migration för checkout-kolumner
2. ✅ Uppdatera analytics endpoint
3. ✅ Lägg till tenant-specifika analytics
4. 📋 Uppdatera scraping-tjänster att spara till DB
5. 📋 Lägg till grafer i Manager/Terminal dashboards

---

## 🗄️ Databas Migration

### **Migration: 012_add_checkout_data_columns.sql**

Lägger till följande kolumner i `leads` tabellen:

```sql
-- E-commerce platform
ecommerce_platform VARCHAR(100)

-- Shipping carriers (comma-separated)
carriers TEXT

-- Checkout positions (e.g., "1. DHL, 2. PostNord")
checkout_position TEXT

-- Delivery services (array)
delivery_services TEXT[]

-- Checkout/payment providers (array)
checkout_providers TEXT[]

-- Metadata
has_checkout BOOLEAN
checkout_scraped_at TIMESTAMP
checkout_detection_method VARCHAR(50)
```

### **Kör migration:**
```sql
-- I Supabase SQL Editor:
-- Kopiera och kör: server/migrations/012_add_checkout_data_columns.sql
```

---

## 📡 API Endpoints

### **1. SuperAdmin Analytics**
```
GET /api/analytics/overview
```

**Response:**
```json
{
  "platforms": [
    {"platform": "Shopify", "count": 45, "percentage": 35.2},
    {"platform": "WooCommerce", "count": 32, "percentage": 25.0}
  ],
  "checkout_providers": [
    {"provider": "Klarna", "count": 67, "percentage": 52.3},
    {"provider": "Stripe", "count": 41, "percentage": 32.0}
  ],
  "carriers": [
    {"carrier": "DHL", "count": 89, "percentage": 45.2},
    {"carrier": "PostNord", "count": 67, "percentage": 34.0}
  ],
  "delivery_methods": [
    {"method": "home_delivery", "count": 102},
    {"method": "pickup_point", "count": 78}
  ]
}
```

### **2. Tenant-Specific Analytics (Manager/Terminal)**
```
GET /api/analytics/tenant-segments
Query params:
  - terminal_id (optional) - För Terminal Chef
  - region (optional) - För Manager (postnummer prefix)
```

**Response:**
```json
{
  "platforms": [...],
  "checkout_providers": [...],
  "carriers": [...],
  "delivery_methods": [...],
  "segments": [
    {"segment": "E-handel", "count": 45, "percentage": 35.2},
    {"segment": "Detaljhandel", "count": 32, "percentage": 25.0}
  ],
  "filters": {
    "tenant_id": "uuid",
    "terminal_id": "uuid",
    "region": "11"
  }
}
```

---

## 🔗 Integrera Scraping med Databas

### **Uppdatera checkoutDetectionService.js**

Lägg till efter scraping är klar:

```javascript
// I detectCheckoutCarriers() funktionen, efter result är klar:
if (result.has_checkout && leadId) {
  await saveCheckoutData(leadId, result);
}

// Ny funktion:
async function saveCheckoutData(leadId, checkoutData) {
  const { query } = await import('../config/database.js');
  
  try {
    await query(`
      SELECT update_lead_checkout_data($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      leadId,
      checkoutData.ecommerce_platform || null,
      checkoutData.shipping_providers?.join(',') || null,
      checkoutData.checkout_position || null,
      checkoutData.delivery_services || [],
      checkoutData.checkout_providers || [],
      checkoutData.has_checkout,
      checkoutData.detection_method
    ]);
    
    logger.info(`✅ Saved checkout data for lead ${leadId}`);
  } catch (error) {
    logger.error('Error saving checkout data:', error);
  }
}
```

---

## 📊 Dashboard Integration

### **SuperAdmin Dashboard**

**Redan implementerat!** ✅

Grafer finns i `SuperAdminDashboard.tsx`:
- E-handelsplattformar (rad 418-440)
- Checkout-lösningar (rad 442-464)
- Transportörer i Checkout (rad 470-491)
- Leveranssätt (rad 494-515)

Data hämtas från `/api/analytics/overview`

---

### **Manager Dashboard**

Lägg till grafer i `ManagerDashboard.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { Store, CreditCard, Truck, PieChart } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

export const ManagerDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  
  useEffect(() => {
    loadAnalytics();
  }, []);
  
  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('eurekai_token');
      const response = await fetch(`${API_BASE_URL}/analytics/tenant-segments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Segment Distribution */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold">Segment Distribution</h2>
        </div>
        <div className="space-y-3">
          {analytics?.segments?.map((seg, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{seg.segment}</span>
                <span className="text-gray-600">{seg.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${seg.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* E-handelsplattformar */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold">E-handelsplattformar</h2>
        </div>
        <div className="space-y-3">
          {analytics?.platforms?.map((platform, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{platform.platform}</span>
                <span className="text-gray-600">{platform.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${platform.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Checkout Providers */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold">Checkout-lösningar</h2>
        </div>
        <div className="space-y-3">
          {analytics?.checkout_providers?.map((provider, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{provider.provider}</span>
                <span className="text-gray-600">{provider.count} leads</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-black h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Carriers */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold">Transportörer</h2>
        </div>
        <div className="space-y-3">
          {analytics?.carriers?.map((carrier, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{carrier.carrier}</span>
                <span className="text-gray-600">{carrier.count} leads</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

### **Terminal Dashboard**

Samma som Manager men med `terminal_id` filter:

```tsx
const loadAnalytics = async () => {
  const terminalId = getCurrentTerminalId(); // Hämta från context/state
  
  const response = await fetch(
    `${API_BASE_URL}/analytics/tenant-segments?terminal_id=${terminalId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const data = await response.json();
  setAnalytics(data);
};
```

---

## 🚀 Implementation Checklist

### **Databas:**
- [ ] Kör migration `012_add_checkout_data_columns.sql` i Supabase
- [ ] Verifiera kolumner finns: `SELECT * FROM leads LIMIT 1;`

### **Backend:**
- [x] Uppdatera `/api/analytics/overview` (klar)
- [x] Skapa `/api/analytics/tenant-segments` (klar)
- [ ] Uppdatera `checkoutDetectionService.js` att spara till DB
- [ ] Uppdatera `websiteScraperService.js` att spara ecommerce_platform

### **Frontend:**
- [x] SuperAdmin dashboard grafer (redan finns)
- [ ] Lägg till grafer i Manager dashboard
- [ ] Lägg till grafer i Terminal dashboard
- [ ] Testa att data visas korrekt

---

## 📝 Exempel på Sparad Data

Efter checkout scraping:

```sql
SELECT 
  company_name,
  ecommerce_platform,
  carriers,
  checkout_providers,
  has_checkout,
  checkout_detection_method
FROM leads
WHERE has_checkout = TRUE
LIMIT 5;
```

**Resultat:**
```
company_name        | ecommerce_platform | carriers           | checkout_providers      | detection_method
--------------------|--------------------|--------------------|------------------------|------------------
Acme E-handel AB    | Shopify            | DHL,PostNord,Bring | {Klarna,Stripe}        | firecrawl
Nordic Shop AB      | WooCommerce        | DHL,Schenker       | {Klarna}               | puppeteer
Fashion Store AB    | Magento            | PostNord,Bring     | {Stripe,PayPal}        | firecrawl
```

---

## 🔍 Troubleshooting

### **Grafer visar ingen data:**
1. Kolla att migration körts: `\d leads` i Supabase SQL Editor
2. Kolla att data finns: `SELECT COUNT(*) FROM leads WHERE has_checkout = TRUE;`
3. Kolla API response: Browser DevTools → Network → `/api/analytics/overview`

### **Scraping sparar inte:**
1. Kolla server logs för fel
2. Verifiera att `update_lead_checkout_data()` function finns
3. Testa manuellt: `SELECT update_lead_checkout_data(...)`

---

Vill du att jag implementerar dashboard-graferna nu? 🚀
