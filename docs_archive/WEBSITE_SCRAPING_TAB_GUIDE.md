# 🌐 Website Scraping Tab - Komplett Guide

## 🎯 Översikt

EnhancedLeadCard har nu en **HELT NY TAB** som visar ALL data från website scraping!

**Tab:** 🌐 Website Scraping

---

## 📊 Vad Visas i Website Scraping Tab

### 1. 📍 Scraping Info
**Visar:**
- URL som scrapades
- Tidsstämpel (när scraping gjordes)
- Klickbar länk till webbplatsen

```tsx
┌─────────────────────────────────────┐
│ Scrapade webbplats                  │
│ https://example.com 🔗              │
│                    2024-12-10 23:45 │
└─────────────────────────────────────┘
```

---

### 2. 🛒 E-handel & Checkout
**Visar:**
- **E-handelsplattform** (Shopify, WooCommerce, Magento, etc.)
- **Checkout** (Ja/Nej med grön/grå färgkodning)
- **Checkout-providers** (Klarna, Stripe, etc.)

```tsx
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ E-handels-   │ │ Checkout     │ │ Checkout-    │
│ plattform    │ │ ✅ Ja        │ │ providers    │
│ Shopify      │ │              │ │ Klarna       │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

### 3. 🚚 Transportörer i Checkout (KRITISKT!)

#### DHL Status (Stor Box)
**Grön box om DHL finns:**
```tsx
┌─────────────────────────────────────┐
│ ✅ DHL är listad!                   │
│ Position i checkout: #2             │
└─────────────────────────────────────┘
```

**Röd box om DHL saknas:**
```tsx
┌─────────────────────────────────────┐
│ ⚠️ DHL saknas!                      │
│ Opportunity för new business       │
└─────────────────────────────────────┘
```

#### Alla Transportörer (Lista)
**För varje transportör visas:**
- Namn
- **Position i checkout** (#1, #2, #3, etc.)
- **Logo hittad** (🖼️ Logo badge)
- **Sidor där nämnd** (t.ex. /shipping, /checkout)
- **Typ** (DHL / KONKURRENT / ANNAN)

**Färgkodning:**
- **Grön** = DHL
- **Röd** = Konkurrent (PostNord, Bring, Budbee, etc.)
- **Grå** = Annan

```tsx
┌─────────────────────────────────────┐
│ 🚚 PostNord  Position #1  🖼️ Logo  │
│ Nämnd på: /checkout, /shipping     │
│                      [KONKURRENT]   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚚 DHL       Position #2  🖼️ Logo  │
│ Nämnd på: /checkout                │
│                           [DHL]     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚚 Budbee    Position #3  🖼️ Logo  │
│ Nämnd på: /checkout, /frakt        │
│                      [KONKURRENT]   │
└─────────────────────────────────────┘
```

---

### 4. 📦 Leveransalternativ
**Visar alla leveransalternativ som finns:**

- 🏠 **Hemleverans**
- 📦 **Paketskåp**
- 🏪 **Ombud** (service points)
- 📬 **Brevlåda**
- 🏢 **Upphämtning** (Click & Collect)

**För varje alternativ:**
- Provider (om känd)
- Kostnad (om synlig)
- Leveranstid (om synlig)

```tsx
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🏠 Hem-      │ │ 📦 Paket-    │ │ 🏪 Ombud     │
│ leverans     │ │ skåp         │ │              │
│ Provider:    │ │ Provider:    │ │ Provider:    │
│ PostNord     │ │ Instabox     │ │ DHL          │
│ Kostnad: 49kr│ │ Kostnad: 39kr│ │ Kostnad: 0kr │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

### 5. 💰 Fraktvillkor
**Visar:**
- **Fri frakt över** (t.ex. 499 kr) - Grön
- **Standard frakt** (t.ex. 49 kr) - Gul
- **Express** (Ja/Nej) - Blå/Grå
- **International** (Ja/Nej) - Lila/Grå
- **Returpolicy** (text om tillgänglig)

```tsx
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Fri frakt    │ │ Standard     │ │ Express      │ │ International│
│ över         │ │ frakt        │ │              │ │              │
│ 499 kr       │ │ 49 kr        │ │ ✅ Ja        │ │ ✅ Ja        │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────┐
│ Returpolicy                         │
│ 30 dagars öppet köp. Gratis retur. │
└─────────────────────────────────────┘
```

---

### 6. 🌍 Marknader
**Visar alla marknader de säljer på:**

För varje marknad:
- **Land** (SE, NO, DK, FI, DE, etc.)
- **Språk** (sv, no, da, fi, de)
- **Valuta** (SEK, NOK, DKK, EUR)
- **Lokal frakt** (✅ om tillgänglig)

```tsx
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ SE       │ │ NO       │ │ DK       │ │ FI       │
│ Språk: sv│ │ Språk: no│ │ Språk: da│ │ Språk: fi│
│ Valuta:  │ │ Valuta:  │ │ Valuta:  │ │ Valuta:  │
│ SEK      │ │ NOK      │ │ DKK      │ │ EUR      │
│ ✅ Lokal │ │ ✅ Lokal │ │ ✅ Lokal │ │ ✅ Lokal │
│ frakt    │ │ frakt    │ │ frakt    │ │ frakt    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

### 7. 💻 Teknologier
**Grupperat per kategori:**

#### 🛒 E-handel
- Shopify (95%)
- WooCommerce (90%)

#### 💳 Betalning
- Klarna (95%)
- Stripe (90%)
- Swish (85%)

#### 📊 Analytics
- Google Analytics (95%)
- Facebook Pixel (90%)

#### 📢 Marketing
- Hotjar (85%)
- Mailchimp (80%)

#### 🚚 Shipping
- Shipmondo (90%)
- Unifaun (85%)

#### 🔧 Övrigt
- Cloudflare (95%)

**Format:**
```tsx
┌─────────────────────────────────────┐
│ 🛒 E-HANDEL                         │
│ [Shopify (95%)] [WooCommerce (90%)] │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💳 BETALNING                        │
│ [Klarna (95%)] [Stripe (90%)]       │
│ [Swish (85%)]                       │
└─────────────────────────────────────┘
```

---

### 8. 📈 Nyckeltal (från webbplats)
**Om tillgängligt från årsredovisning på webbplatsen:**

- **Likviditet** (t.ex. 1.5)
- **Soliditet** (t.ex. 45%)
- **Vinstmarginal** (t.ex. 12%)
- **Källa** (t.ex. "https://example.com/investor-relations")

```tsx
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Likviditet   │ │ Soliditet    │ │ Vinstmarginal│
│ 1.5          │ │ 45%          │ │ 12%          │
└──────────────┘ └──────────────┘ └──────────────┘

Källa: https://example.com/investor-relations
```

---

## 🎨 Färgkodning

### Transportörer
- **Grön** = DHL (bg-green-50 border-green-500)
- **Röd** = Konkurrent (bg-red-50 border-red-500)
- **Grå** = Annan (bg-gray-50 border-gray-400)

### Status
- **Grön** = Positivt (DHL finns, checkout finns, etc.)
- **Röd** = Negativt (DHL saknas, varning)
- **Blå** = Information
- **Lila** = E-handel/plattform
- **Gul** = Fraktkostnad

---

## 📋 Komplett Exempel

### Företag: Example AB (E-handel)

```tsx
🌐 WEBSITE SCRAPING - KOMPLETT ANALYS

┌─────────────────────────────────────┐
│ Scrapade webbplats                  │
│ https://example.se 🔗               │
│                    2024-12-10 23:45 │
└─────────────────────────────────────┘

🛒 E-HANDEL & CHECKOUT
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ E-handels-   │ │ Checkout     │ │ Checkout-    │
│ plattform    │ │ ✅ Ja        │ │ providers    │
│ Shopify      │ │              │ │ Klarna       │
└──────────────┘ └──────────────┘ └──────────────┘

🚚 TRANSPORTÖRER I CHECKOUT

┌─────────────────────────────────────┐
│ ⚠️ DHL SAKNAS!                      │
│ Opportunity för new business       │
└─────────────────────────────────────┘

Alla transportörer:

┌─────────────────────────────────────┐
│ 🚚 PostNord  Position #1  🖼️ Logo  │
│ Nämnd på: /checkout, /shipping     │
│                      [KONKURRENT]   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚚 Bring     Position #2  🖼️ Logo  │
│ Nämnd på: /checkout                │
│                      [KONKURRENT]   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🚚 Budbee    Position #3  🖼️ Logo  │
│ Nämnd på: /checkout, /frakt        │
│                      [KONKURRENT]   │
└─────────────────────────────────────┘

📦 LEVERANSALTERNATIV
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🏠 Hem-      │ │ 📦 Paket-    │ │ 🏪 Ombud     │
│ leverans     │ │ skåp         │ │              │
│ Provider:    │ │ Provider:    │ │ Provider:    │
│ PostNord     │ │ Instabox     │ │ PostNord     │
│ Kostnad: 49kr│ │ Kostnad: 39kr│ │ Kostnad: 0kr │
└──────────────┘ └──────────────┘ └──────────────┘

💰 FRAKTVILLKOR
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Fri frakt    │ │ Standard     │ │ Express      │ │ International│
│ över         │ │ frakt        │ │              │ │              │
│ 499 kr       │ │ 49 kr        │ │ ✅ Ja        │ │ ✅ Ja        │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────┐
│ Returpolicy                         │
│ 30 dagars öppet köp. Gratis retur. │
└─────────────────────────────────────┘

🌍 MARKNADER (5)
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ SE       │ │ NO       │ │ DK       │ │ FI       │ │ DE       │
│ Språk: sv│ │ Språk: no│ │ Språk: da│ │ Språk: fi│ │ Språk: de│
│ Valuta:  │ │ Valuta:  │ │ Valuta:  │ │ Valuta:  │ │ Valuta:  │
│ SEK      │ │ NOK      │ │ DKK      │ │ EUR      │ │ EUR      │
│ ✅ Lokal │ │ ✅ Lokal │ │ ✅ Lokal │ │ ✅ Lokal │ │ ✅ Lokal │
│ frakt    │ │ frakt    │ │ frakt    │ │ frakt    │ │ frakt    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

💻 TEKNOLOGIER (8)

┌─────────────────────────────────────┐
│ 🛒 E-HANDEL                         │
│ [Shopify (95%)]                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 💳 BETALNING                        │
│ [Klarna (95%)] [Stripe (90%)]       │
│ [Swish (85%)]                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📊 ANALYTICS                        │
│ [Google Analytics (95%)]            │
│ [Facebook Pixel (90%)]              │
└─────────────────────────────────────┘
```

---

## 🎯 Värde för DHL

### 1. Konkurrensanalys
- **Ser exakt vilka konkurrenter de använder**
- **Vet position i checkout** (viktigare = lägre nummer)
- **Vet om DHL redan finns** (retention vs new business)

### 2. Säljargument
- **Fri frakt-gräns** → "Vi kan hjälpa er optimera fraktkostnader"
- **International shipping** → "DHL Express är marknadsledande"
- **Många marknader** → "DHL finns i över 220 länder"
- **Express tillgänglig** → "DHL Express - snabbast på marknaden"

### 3. Opportunity Scoring
- **DHL saknas** → Hög opportunity score
- **DHL finns men position 3** → Upsell opportunity
- **DHL position 1** → Retention

### 4. Tech Stack
- **Vet vilken e-handelsplattform** → Kan erbjuda rätt integration
- **Vet betalningsproviders** → Förstår deras setup
- **Vet analytics** → Kan erbjuda tracking-lösningar

---

## 📊 Data Coverage

### Website Scraping Tab visar:
- ✅ URL & tidsstämpel
- ✅ E-handelsplattform
- ✅ Checkout (ja/nej)
- ✅ Checkout-providers
- ✅ **DHL status** (stor box)
- ✅ **Alla transportörer** (med position)
- ✅ **Logo-status** per transportör
- ✅ **Sidor där nämnd** per transportör
- ✅ **Leveransalternativ** (5 typer)
- ✅ **Fraktvillkor** (4 metrics)
- ✅ **Returpolicy**
- ✅ **Marknader** (land, språk, valuta)
- ✅ **Teknologier** (grupperat per kategori)
- ✅ **Nyckeltal** (från webbplats)

**Total coverage:** 100% av scraping-data! ✅

---

## 🚀 Status

**Status:** ✅ **PRODUCTION-READY!**

**Fil:** `src/components/leads/EnhancedLeadCard.tsx`

**Tabs:** 5 st
1. 📊 Översikt
2. 👥 Kontakter
3. 🎯 Konkurrens
4. 🌐 **Website Scraping** (NY!)
5. 📅 Historik

**Användning:**
```tsx
import { EnhancedLeadCard } from './components/leads/EnhancedLeadCard';

<EnhancedLeadCard 
  lead={leadWithWebsiteAnalysis} 
  onClose={handleClose} 
/>
```

**Om ingen scraping-data finns:**
- Visar meddelande: "Ingen website scraping-data tillgänglig"
- Knapp: "Starta Scraping"

---

## 🎉 Sammanfattning

**Ny tab:** 🌐 Website Scraping
**Sektioner:** 8 st
**Data points:** 50+ olika metrics
**Färgkodning:** Grön (DHL), Röd (konkurrent), Blå (info)
**Ikoner:** 15+ olika ikoner för olika datatyper

**Detta ger säljare KOMPLETT insyn i företagets webbplats och logistik-setup!** 🎊
