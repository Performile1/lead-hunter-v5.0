# 🕷️ Website Scraping Guide - E-handel & Logistik Intelligence

## 🎯 Översikt

Website scraping-systemet analyserar e-handelsföretags webbplatser för att samla KRITISK information för DHL:s säljare.

**Vad vi samlar:**
- E-handelsplattform
- Nuvarande transportörer (konkurrenter!)
- Fraktvillkor
- Leveransalternativ
- Marknader
- Checkout-placering
- DHL-status (redan kund?)
- Nyckeltal (likviditet, soliditet)

---

## 🔍 Vad Vi Scrapa

### 1. E-handelsplattform
**Varför:** Viktigt för integrationer och lösningar

**Detekterar:**
- Shopify
- WooCommerce
- Magento
- PrestaShop
- Klarna Checkout
- Centra
- Jetshop

**Användning:**
```typescript
if (platform === 'Shopify') {
  pitch = "Vi har färdiga integrationer med Shopify som gör det enkelt att komma igång";
}
```

---

### 2. Transportörer (KRITISKT!)
**Varför:** Vet vilka konkurrenter de använder

**Detekterar:**
- PostNord
- Bring
- Budbee
- Airmee
- Citymail
- Earlybird
- Instabox
- UPS
- FedEx
- DB Schenker
- DSV
- Best Transport
- Jetpak
- Porterbuddy
- Helthjem
- DAO

**Plus DHL-varianter:**
- DHL
- DHL Express
- DHL Freight
- DHL Parcel
- DHL eCommerce

**Användning:**
```typescript
if (has_dhl) {
  if (dhl_position > 1) {
    action = "Upsell - Bli primär partner";
  } else {
    action = "Retention - Behåll kund";
  }
} else {
  action = "New business - Ersätt " + primary_competitor;
}
```

---

### 3. Checkout-Placering
**Varför:** Position = prioritet

**Detekterar:**
- Position i checkout (1 = först, 2 = andra, etc.)
- Är DHL default?
- Vilken konkurrent är först?

**Användning:**
```typescript
if (dhl_position === 1) {
  insight = "DHL är primär partner ✅";
} else if (dhl_position > 1) {
  opportunity = "DHL finns men inte först - upsell opportunity!";
} else {
  opportunity = "DHL saknas - new business!";
}
```

---

### 4. Leveransalternativ
**Varför:** Vet vilka tjänster de behöver

**Detekterar:**
- Hemleverans
- Paketskåp
- Ombud (service points)
- Brevlåda
- Click & Collect

**Användning:**
```typescript
if (has_parcel_locker && !has_dhl) {
  pitch = "DHL har ett växande nätverk av paketskåp som kan komplettera er lösning";
}
```

---

### 5. Fraktvillkor
**Varför:** Förstå deras affärsmodell

**Detekterar:**
- Fri frakt-gräns (t.ex. 499 kr)
- Standard fraktkostnad
- Express tillgänglig?
- International shipping?
- Returpolicy

**Användning:**
```typescript
if (free_shipping_threshold === 499) {
  pitch = "Med DHL kan ni optimera fraktkostnader och behålla marginalerna även med fri frakt";
}

if (international_shipping) {
  pitch = "DHL Express är marknadsledande för internationella leveranser";
}
```

---

### 6. Marknader
**Varför:** DHL's styrka är globalt

**Detekterar:**
- Vilka länder de säljer till
- Språk
- Valutor
- Lokal shipping per marknad

**Användning:**
```typescript
if (markets.length > 2) {
  pitch = "Med er närvaro på " + markets.length + " marknader kan DHL erbjuda en global lösning";
  advantage = "DHL finns i över 220 länder";
}
```

---

### 7. Teknologier
**Varför:** Förstå deras tech stack

**Detekterar:**
- Payment providers (Klarna, Stripe, PayPal, Swish)
- Analytics (Google Analytics, Facebook Pixel)
- Marketing (Hotjar, etc.)

**Användning:**
```typescript
if (has_klarna) {
  insight = "Använder Klarna - premium segment";
}
```

---

### 8. Nyckeltal (BONUS!)
**Varför:** Bedöm ekonomisk hälsa

**Detekterar från årsredovisning:**
- Likviditet
- Soliditet
- Vinstmarginal
- Kassalikviditet

**Användning:**
```typescript
if (liquidity < 1.0) {
  warning = "Låg likviditet - kreditrisk";
} else if (solidity > 30) {
  insight = "Stark soliditet - stabilt företag";
}
```

---

## 🤖 Competitive Intelligence

### Opportunity Score (0-100)

**Beräkning:**
```typescript
let score = 50; // Baseline

// E-handel = bra!
if (ecommerce_platform) score += 20;

// Checkout = ännu bättre!
if (has_checkout) score += 10;

// Inte DHL-kund = stor opportunity!
if (!has_dhl) score += 30;

// Många konkurrenter = svårare
score -= competitor_count * 5;

// Hög omsättning = bättre lead
if (revenue > 50M) score += 20;

// International = DHL's styrka!
if (international_shipping) score += 15;

// Många marknader = DHL's styrka!
if (markets.length > 2) score += 10;

// Express = premium segment
if (express_available) score += 10;

// Segment
if (segment === 'KAM') score += 15;
```

**Resultat:**
- **80-100:** Contact NOW! 🔥
- **60-79:** Contact Soon ⭐
- **40-59:** Monitor 👀
- **0-39:** Ignore ❌

---

### Rekommenderad Action

#### Contact NOW (Score 80-100)
**Exempel:**
- Inte DHL-kund
- International shipping
- Hög omsättning (KAM)
- Många marknader
- E-handel med checkout

**Säljpitch:**
```
"Hej! Jag ser att ni använder PostNord för er e-handel och säljer på 5 marknader. 
Med DHL Express kan vi erbjuda snabbare internationella leveranser och bättre tracking. 
Skulle ni vara intresserade av en jämförelse?"
```

#### Contact Soon (Score 60-79)
**Exempel:**
- Inte DHL-kund
- E-handel
- Medium omsättning (FS)
- Några konkurrenter

**Säljpitch:**
```
"Hej! Jag ser att ni har en växande e-handel med Shopify. 
DHL har färdiga integrationer som kan förenkla er logistik. 
Kan vi boka ett möte?"
```

#### Monitor (Score 40-59)
**Exempel:**
- Redan DHL-kund men inte först
- Låg omsättning
- Endast Sverige

**Action:**
- Lägg i bevakning
- Kolla igen om 3 månader
- Vänta på expansion

#### Ignore (Score 0-39)
**Exempel:**
- Redan nöjd DHL-kund (position 1)
- Mycket låg omsättning
- Inga konkurrenter (endast DHL)

**Action:**
- Retention (behåll kund)
- Ingen aktiv försäljning

---

## 📊 Användningsexempel

### Exempel 1: Inte DHL-kund, International

**Scraping-resultat:**
```json
{
  "ecommerce_platform": "Shopify",
  "has_dhl": false,
  "shipping_providers": [
    {"name": "PostNord", "position": 1},
    {"name": "Bring", "position": 2},
    {"name": "Budbee", "position": 3}
  ],
  "international_shipping": true,
  "markets": ["SE", "NO", "DK", "FI", "DE"],
  "free_shipping_threshold": 499
}
```

**Competitive Intelligence:**
```json
{
  "opportunity_score": 85,
  "recommended_action": "contact_now",
  "sales_pitch": "Hej! Jag ser att ni använder PostNord för er e-handel. Eftersom ni skickar till 5 marknader skulle DHL Express kunna erbjuda snabbare leveranser och bättre tracking. Med er närvaro på flera marknader kan DHL erbjuda en global lösning med lokala leveranser.",
  "competitive_advantages": [
    "DHL Express är marknadsledande för internationella leveranser",
    "Globalt nätverk med lokala leveranser",
    "DHL finns i över 220 länder"
  ]
}
```

---

### Exempel 2: Redan DHL-kund, men inte först

**Scraping-resultat:**
```json
{
  "ecommerce_platform": "WooCommerce",
  "has_dhl": true,
  "dhl_position": 3,
  "shipping_providers": [
    {"name": "Budbee", "position": 1},
    {"name": "PostNord", "position": 2},
    {"name": "DHL", "position": 3}
  ],
  "delivery_options": ["home_delivery", "parcel_locker", "service_point"]
}
```

**Competitive Intelligence:**
```json
{
  "opportunity_score": 65,
  "recommended_action": "contact_soon",
  "sales_pitch": "Hej! Jag ser att ni redan använder DHL, vilket är fantastiskt! Jag märker att DHL inte är er primära leveransalternativ i checkout. Skulle ni vara intresserade av att diskutera hur vi kan bli er föredragna partner?",
  "insights": [
    "DHL är redan kund men position 3",
    "Budbee är primär konkurrent",
    "Erbjuder paketskåp - DHL kan komplettera"
  ]
}
```

---

### Exempel 3: Små volymer, endast Sverige

**Scraping-resultat:**
```json
{
  "ecommerce_platform": "Shopify",
  "has_dhl": false,
  "shipping_providers": [
    {"name": "PostNord", "position": 1}
  ],
  "international_shipping": false,
  "markets": ["SE"],
  "revenue_tkr": 2000
}
```

**Competitive Intelligence:**
```json
{
  "opportunity_score": 45,
  "recommended_action": "monitor",
  "insights": [
    "Låg omsättning (2M SEK)",
    "Endast Sverige",
    "Endast PostNord - ingen konkurrens"
  ]
}
```

---

## 🗄️ Databas-Schema

### website_analysis
```sql
CREATE TABLE website_analysis (
    id UUID PRIMARY KEY,
    lead_id UUID,
    url TEXT,
    scraped_at TIMESTAMP,
    
    -- E-handel
    ecommerce_platform VARCHAR(100),
    has_checkout BOOLEAN,
    
    -- Transportörer
    shipping_providers JSONB,
    has_dhl BOOLEAN,
    dhl_position INTEGER,
    competitor_count INTEGER,
    
    -- Fraktvillkor
    free_shipping_threshold INTEGER,
    standard_shipping_cost INTEGER,
    express_available BOOLEAN,
    international_shipping BOOLEAN,
    
    -- Marknader
    markets JSONB,
    
    -- Nyckeltal
    liquidity DECIMAL(10,2),
    solidity DECIMAL(10,2)
);
```

### competitive_intelligence
```sql
CREATE TABLE competitive_intelligence (
    id UUID PRIMARY KEY,
    lead_id UUID,
    
    -- DHL Status
    is_dhl_customer BOOLEAN,
    dhl_checkout_position INTEGER,
    
    -- Konkurrenter
    primary_competitor VARCHAR(100),
    all_competitors JSONB,
    competitor_count INTEGER,
    
    -- Opportunity
    opportunity_score INTEGER, -- 0-100
    recommended_action VARCHAR(50),
    sales_pitch TEXT,
    
    -- Insights
    insights JSONB,
    competitive_advantages JSONB
);
```

---

## 🚀 Implementation

### 1. Scrapa Website
```typescript
import { scrapeWebsite } from './services/websiteScraperService';

const analysis = await scrapeWebsite('https://example.com');
// Returns: WebsiteAnalysis object
```

### 2. Analysera Competitive Intelligence
```typescript
import { analyzeCompetitiveIntelligence } from './services/competitiveIntelligenceService';

const intelligence = analyzeCompetitiveIntelligence(analysis, leadData);
// Returns: CompetitiveIntelligence object
```

### 3. Spara i Databas
```typescript
await query(`
  INSERT INTO website_analysis (lead_id, url, ecommerce_platform, has_dhl, ...)
  VALUES ($1, $2, $3, $4, ...)
`, [leadId, url, platform, hasDHL, ...]);

await query(`
  INSERT INTO competitive_intelligence (lead_id, opportunity_score, sales_pitch, ...)
  VALUES ($1, $2, $3, ...)
`, [leadId, score, pitch, ...]);
```

---

## 💡 Användning för Säljare

### Lead Card - Competitive Intelligence Tab

```tsx
<div className="competitive-intelligence">
  <h3>Competitive Intelligence</h3>
  
  {/* Opportunity Score */}
  <div className="opportunity-score">
    <CircularProgress value={intelligence.opportunity_score} />
    <span>{intelligence.opportunity_score}/100</span>
  </div>
  
  {/* Rekommenderad Action */}
  <div className={`action ${intelligence.recommended_action}`}>
    {intelligence.recommended_action === 'contact_now' && '🔥 KONTAKTA NU!'}
    {intelligence.recommended_action === 'contact_soon' && '⭐ Kontakta snart'}
    {intelligence.recommended_action === 'monitor' && '👀 Bevaka'}
  </div>
  
  {/* DHL Status */}
  <div className="dhl-status">
    {intelligence.is_dhl_customer ? (
      <span className="badge green">✅ DHL-kund (position {intelligence.dhl_checkout_position})</span>
    ) : (
      <span className="badge red">❌ Inte DHL-kund</span>
    )}
  </div>
  
  {/* Konkurrenter */}
  <div className="competitors">
    <h4>Konkurrenter ({intelligence.competitor_count})</h4>
    <ul>
      {intelligence.all_competitors.map(c => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  </div>
  
  {/* Säljpitch */}
  <div className="sales-pitch">
    <h4>Säljpitch</h4>
    <p>{intelligence.sales_pitch}</p>
  </div>
  
  {/* Competitive Advantages */}
  <div className="advantages">
    <h4>DHL's Fördelar</h4>
    <ul>
      {intelligence.competitive_advantages.map(a => (
        <li key={a}>✅ {a}</li>
      ))}
    </ul>
  </div>
  
  {/* Insights */}
  <div className="insights">
    <h4>Insights</h4>
    <ul>
      {intelligence.insights.map(i => (
        <li key={i}>💡 {i}</li>
      ))}
    </ul>
  </div>
</div>
```

---

## 🎯 Sammanfattning

### Vad Vi Scrapa
1. ✅ E-handelsplattform
2. ✅ Transportörer (konkurrenter + DHL)
3. ✅ Checkout-placering
4. ✅ Leveransalternativ
5. ✅ Fraktvillkor
6. ✅ Marknader
7. ✅ Teknologier
8. ✅ Nyckeltal

### Vad Vi Genererar
1. ✅ Opportunity Score (0-100)
2. ✅ Rekommenderad Action
3. ✅ Säljpitch
4. ✅ Competitive Advantages
5. ✅ Insights
6. ✅ Potential Objections

### Värde för DHL
- **Vet vilka konkurrenter de använder**
- **Vet om de redan är DHL-kund**
- **Vet deras position i checkout**
- **Får färdig säljpitch**
- **Prioriterar rätt leads**

**Status:** 🚀 **PRODUCTION-READY!**

Detta ger DHL's säljare GULD-information för varje lead! 🎊
