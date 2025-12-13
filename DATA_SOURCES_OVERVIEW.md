# 📊 Data Sources Overview - Vad Hämtas?

## 🎯 Komplett Översikt

Systemet hämtar **ALL relevant företagsdata** från flera källor automatiskt!

---

## 📋 Data Som Hämtas

### 1. 👥 **Kontaktpersoner / Decision Makers**

#### Från Allabolag API:
```javascript
{
  name: "Anna Svensson",
  title: "VD",
  role: "Verkställande Direktör",
  verified: true,
  source: "allabolag"
}
```

**Hämtar:**
- ✅ VD (Verkställande Direktör)
- ✅ Styrelseordförande
- ✅ Styrelseledamöter
- ✅ Suppleanter
- ✅ Firmatecknare
- ✅ Revisorer

#### Från UC API:
```javascript
{
  name: "Erik Johansson",
  title: "CFO",
  position: "Ekonomichef",
  verified: true,
  source: "uc"
}
```

**Hämtar:**
- ✅ Ledningsgrupp
- ✅ Nyckelpersoner
- ✅ Befattningshavare

#### Från LinkedIn (via AI):
```javascript
{
  name: "Maria Andersson",
  title: "Head of Logistics",
  linkedin_url: "https://linkedin.com/in/maria-andersson",
  email: "maria.andersson@company.se",
  phone: "+46 70 123 45 67",
  verified: false,
  source: "linkedin_ai"
}
```

**Hämtar:**
- ✅ Logistics Manager
- ✅ Supply Chain Manager
- ✅ E-commerce Manager
- ✅ Operations Manager

---

### 2. 📰 **Nyheter & Press**

#### Från Tavily Search API:
```javascript
{
  title: "Boozt expanderar till Norge",
  content: "E-handelsbolaget Boozt öppnar nytt lager i Oslo...",
  url: "https://www.di.se/...",
  published_date: "2024-12-01",
  source: "Dagens Industri",
  score: 0.95
}
```

**Källor:**
- ✅ Dagens Industri (di.se)
- ✅ Breakit (breakit.se)
- ✅ eHandel (ehandel.se)
- ✅ Mynewsdesk (mynewsdesk.com)
- ✅ Företagets egna pressrum

**Kategorier:**
- ✅ Expansion / Tillväxt
- ✅ Nya marknader
- ✅ Logistik-investeringar
- ✅ E-commerce-satsningar
- ✅ Finansiella resultat
- ✅ Nya produkter/tjänster

#### Från Företagets Hemsida:
```javascript
{
  latest_news: [
    {
      title: "Q3 Results 2024",
      date: "2024-11-15",
      summary: "Revenue up 25%..."
    }
  ]
}
```

---

### 3. 💰 **Ekonomisk Data**

#### Från Allabolag:
```javascript
{
  revenue_tkr: 2500000,        // Omsättning (tkr)
  revenue_last_year: 2000000,  // Föregående år
  revenue_growth: 25,          // Tillväxt %
  profit_tkr: 150000,          // Resultat
  profit_margin: 6,            // Marginal %
  equity_tkr: 500000,          // Eget kapital
  debt_tkr: 200000,            // Skulder
  employees: 450,              // Anställda
  employees_growth: 15         // Tillväxt anställda %
}
```

#### Från UC:
```javascript
{
  credit_rating: "AAA",        // Kreditbetyg
  credit_score: 95,            // Poäng (0-100)
  payment_remarks: 0,          // Betalningsanmärkningar
  kronofogden_check: "OK",     // Kronofogden
  risk_class: "Låg risk",      // Riskklass
  recommended_credit: 500000   // Rekommenderad kredit
}
```

---

### 4. 🏢 **Företagsinformation**

#### Grunddata:
```javascript
{
  company_name: "Boozt AB",
  org_number: "556793-3674",
  legal_form: "Aktiebolag",
  registration_date: "2006-01-15",
  status: "Aktiv",
  
  // Adress
  address: "Mäster Samuelsgatan 36",
  postal_code: "111 57",
  city: "Stockholm",
  country: "Sverige",
  
  // Kontakt
  phone_number: "+46 8 123 456 78",
  email: "info@boozt.com",
  website_url: "https://www.boozt.com",
  
  // Industri
  industry: "E-handel",
  sni_code: "47.91",
  sni_description: "Detaljhandel via postorder eller Internet"
}
```

---

### 5. 🛒 **E-commerce & Logistik Data**

#### Från Website Scraping:
```javascript
{
  // E-commerce Platform
  ecommerce_platform: "Shopify Plus",
  platform_version: "2024.1",
  
  // Leverantörer
  shipping_providers: [
    {
      name: "DHL",
      services: ["Express", "Parcel"],
      is_primary: false
    },
    {
      name: "PostNord",
      services: ["Varubrev", "Paket"],
      is_primary: true
    },
    {
      name: "Budbee",
      services: ["Home Delivery"],
      is_primary: false
    }
  ],
  
  // Leveransalternativ
  delivery_options: [
    "Hemleverans",
    "Paketombud",
    "Postbox",
    "Click & Collect"
  ],
  
  // Returer
  return_policy: "365 dagar öppet köp",
  free_returns: true,
  
  // Marknader
  markets: ["SE", "NO", "DK", "FI"],
  
  // Betalning
  payment_methods: ["Klarna", "Swish", "Card"],
  
  // Technologies
  technologies_used: [
    "Shopify Plus",
    "Google Analytics",
    "Facebook Pixel",
    "Klaviyo",
    "Trustpilot"
  ]
}
```

---

### 6. 🎯 **AI-Genererad Analys**

#### Från LLM (Gemini/Groq/GPT):
```javascript
{
  // Sales Pitch
  sales_pitch: "Boozt är en snabbväxande nordisk e-handelsaktör med stark tillväxt (+25% YoY). Med 450 anställda och expansion till Norge finns stort behov av skalbar logistiklösning. Nuvarande leverantör PostNord kan kompletteras med DHL för expressförsändelser och internationell expansion.",
  
  // Opportunity Score
  opportunity_score: 85,
  opportunity_factors: [
    "Stark tillväxt (25%)",
    "Expansion till nya marknader",
    "Stor ordervolym (>10,000/dag)",
    "Använder inte DHL som primär leverantör",
    "Internationell ambition"
  ],
  
  // Triggers
  triggers: [
    {
      type: "expansion",
      description: "Expanderar till Norge Q1 2025",
      priority: "high",
      source: "news"
    },
    {
      type: "growth",
      description: "25% omsättningstillväxt",
      priority: "high",
      source: "financials"
    },
    {
      type: "technology",
      description: "Ny e-commerce platform (Shopify Plus)",
      priority: "medium",
      source: "website"
    }
  ],
  
  // Pain Points
  pain_points: [
    "Behöver snabbare leveranser för premium-kunder",
    "Internationell expansion kräver global partner",
    "Returer från Norge/Danmark komplicerat"
  ],
  
  // Competitive Analysis
  competitive_analysis: {
    current_providers: ["PostNord", "Budbee"],
    dhl_advantage: [
      "Globalt nätverk för internationell expansion",
      "Express-tjänster för premium-segment",
      "Bättre tracking och kundupplevelse"
    ],
    estimated_value: "2.5M SEK/år"
  }
}
```

---

### 7. 📈 **Triggers & Signaler**

#### Automatiskt Identifierade:
```javascript
{
  triggers: [
    // Expansion
    {
      type: "market_expansion",
      title: "Expanderar till Norge",
      description: "Öppnar nytt lager i Oslo Q1 2025",
      priority: "high",
      estimated_impact: "Behöver ny logistikpartner",
      source: "news",
      date: "2024-12-01"
    },
    
    // Tillväxt
    {
      type: "revenue_growth",
      title: "25% omsättningstillväxt",
      description: "Stark tillväxt senaste året",
      priority: "high",
      estimated_impact: "Ökad fraktvolym",
      source: "financials",
      date: "2024-11-15"
    },
    
    // Anställningar
    {
      type: "hiring",
      title: "Söker Logistics Manager",
      description: "Ny rekrytering för logistik",
      priority: "medium",
      estimated_impact: "Omstrukturering av logistik",
      source: "linkedin",
      date: "2024-11-20"
    },
    
    // Teknologi
    {
      type: "technology_change",
      title: "Ny e-commerce platform",
      description: "Migrerat till Shopify Plus",
      priority: "medium",
      estimated_impact: "Möjlighet för integration",
      source: "website",
      date: "2024-10-01"
    },
    
    // Konkurrent
    {
      type: "competitor_activity",
      title: "Zalando ökar marknadsandel",
      description: "Konkurrent satsar på snabbare leveranser",
      priority: "medium",
      estimated_impact: "Behöver matcha leveranstider",
      source: "news",
      date: "2024-11-25"
    }
  ]
}
```

---

## 🔄 Komplett Data Flow

```
┌─────────────────────────────────────────┐
│  ANVÄNDARE KLICKAR "ANALYSERA"          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  1. FÖRETAGSDATA APIs                   │
├─────────────────────────────────────────┤
│  Allabolag API:                         │
│  ✅ Ekonomi (omsättning, vinst, etc.)   │
│  ✅ Befattningshavare (VD, CFO, etc.)   │
│  ✅ Styrelse                            │
│  ✅ Kontaktuppgifter                    │
│                                         │
│  UC API:                                │
│  ✅ Kreditbetyg                         │
│  ✅ Betalningsanmärkningar              │
│  ✅ Kronofogden                         │
│  ✅ Ledningsgrupp                       │
│                                         │
│  Bolagsverket (Gratis):                 │
│  ✅ Grunddata                           │
│  ✅ Registreringsdatum                  │
│  ✅ Juridisk form                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. NYHETER & PRESS                     │
├─────────────────────────────────────────┤
│  Tavily Search API:                     │
│  ✅ Senaste nyheterna (DI, Breakit)     │
│  ✅ Pressmeddelanden                    │
│  ✅ Expansion/tillväxt                  │
│  ✅ Logistik-investeringar              │
│  ✅ E-commerce-satsningar               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. WEBSITE SCRAPING                    │
├─────────────────────────────────────────┤
│  HybridScraperService:                  │
│  ✅ E-commerce platform                 │
│  ✅ Nuvarande leverantörer              │
│  ✅ Leveransalternativ                  │
│  ✅ Marknader (SE, NO, DK, etc.)        │
│  ✅ Technologies                        │
│  ✅ Returer & policy                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. AI-ANALYS                           │
├─────────────────────────────────────────┤
│  LLM (Gemini/Groq/GPT):                 │
│  ✅ Sales pitch                         │
│  ✅ Opportunity score                   │
│  ✅ Triggers & signaler                 │
│  ✅ Pain points                         │
│  ✅ Competitive analysis                │
│  ✅ Estimated deal value                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. LINKEDIN ENRICHMENT (AI)            │
├─────────────────────────────────────────┤
│  AI-baserad sökning:                    │
│  ✅ Logistics Manager                   │
│  ✅ Supply Chain Manager                │
│  ✅ E-commerce Manager                  │
│  ✅ Email-gissning                      │
│  ✅ Telefon-gissning                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. DATABAS UPDATE                      │
├─────────────────────────────────────────┤
│  PostgreSQL:                            │
│  ✅ leads (all företagsdata)            │
│  ✅ decision_makers (kontaktpersoner)   │
│  ✅ triggers (signaler)                 │
│  ✅ latest_news (nyheter JSON)          │
│  ✅ data_verified = true                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  7. FRONTEND VISAR ALLT! ✅             │
└─────────────────────────────────────────┘
```

---

## 📊 Exempel: Boozt AB

### Komplett Data Som Hämtas:

```javascript
{
  // GRUNDDATA
  company_name: "Boozt AB",
  org_number: "556793-3674",
  website_url: "https://www.boozt.com",
  
  // EKONOMI (från Allabolag)
  revenue_tkr: 2500000,
  revenue_growth: 25,
  employees: 450,
  credit_rating: "AAA",
  
  // KONTAKTPERSONER (från Allabolag + LinkedIn AI)
  decision_makers: [
    {
      name: "Hermann Cordes",
      title: "VD",
      email: "hermann.cordes@boozt.com",
      linkedin_url: "https://linkedin.com/in/hermann-cordes",
      verified: true,
      source: "allabolag"
    },
    {
      name: "Sandra Gadd",
      title: "CFO",
      email: "sandra.gadd@boozt.com",
      verified: true,
      source: "allabolag"
    },
    {
      name: "Lars Olsson",
      title: "Head of Logistics",
      email: "lars.olsson@boozt.com",
      phone: "+46 70 123 45 67",
      linkedin_url: "https://linkedin.com/in/lars-olsson-logistics",
      verified: false,
      source: "linkedin_ai"
    }
  ],
  
  // NYHETER (från Tavily)
  latest_news: [
    {
      title: "Boozt expanderar till Norge med nytt lager",
      content: "E-handelsbolaget Boozt investerar 50 miljoner i nytt lager i Oslo...",
      url: "https://www.di.se/...",
      published_date: "2024-12-01",
      source: "Dagens Industri"
    },
    {
      title: "Boozt rapporterar rekordtillväxt Q3",
      content: "25% omsättningstillväxt och 450 anställda...",
      url: "https://www.breakit.se/...",
      published_date: "2024-11-15",
      source: "Breakit"
    }
  ],
  
  // E-COMMERCE (från Scraping)
  ecommerce_platform: "Shopify Plus",
  shipping_providers: ["PostNord", "Budbee", "DHL"],
  markets: ["SE", "NO", "DK", "FI"],
  delivery_options: ["Hemleverans", "Paketombud", "Click & Collect"],
  
  // AI-ANALYS (från Gemini/Groq)
  sales_pitch: "Boozt är en snabbväxande nordisk e-handelsaktör...",
  opportunity_score: 85,
  triggers: [
    {
      type: "expansion",
      description: "Expanderar till Norge Q1 2025",
      priority: "high"
    },
    {
      type: "growth",
      description: "25% omsättningstillväxt",
      priority: "high"
    }
  ],
  
  // METADATA
  data_source: "allabolag",
  data_verified: true,
  analysis_date: "2024-12-11T10:00:00Z"
}
```

---

## ✅ Sammanfattning

### Vad Hämtas Automatiskt:

**Kontaktpersoner:**
- ✅ VD, CFO, Styrelse (från Allabolag/UC)
- ✅ Logistics Manager, Supply Chain Manager (från LinkedIn AI)
- ✅ Email, telefon, LinkedIn (verifierat + AI-gissat)

**Nyheter:**
- ✅ Senaste nyheterna (Tavily Search)
- ✅ Pressmeddelanden
- ✅ Expansion, tillväxt, investeringar

**Ekonomi:**
- ✅ Omsättning, vinst, tillväxt
- ✅ Anställda
- ✅ Kreditbetyg
- ✅ Betalningsanmärkningar

**E-commerce:**
- ✅ Platform (Shopify, WooCommerce, etc.)
- ✅ Nuvarande leverantörer
- ✅ Marknader
- ✅ Technologies

**AI-Analys:**
- ✅ Sales pitch
- ✅ Opportunity score
- ✅ Triggers
- ✅ Pain points
- ✅ Competitive analysis

**Allt sparas i databasen och visas i UI!** 🎉

---

**Status:** ✅ Systemet hämtar ALLT! 🌐
