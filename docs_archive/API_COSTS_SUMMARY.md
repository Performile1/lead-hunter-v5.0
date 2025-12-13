# 💰 API Kostnader - Sammanfattning

## 🆓 GRATIS API:er (Offentliga)

### 1. Bolagsverket API ✅
**Kostnad:** GRATIS
**Status:** ✅ Redan implementerat
**Data:**
- Företagsinformation
- Årsredovisningar
- Styrelseregister
- Dotterbolag
- Adressändringar

**Användning:** Grundläggande företagsdata

---

### 2. Kronofogden API ✅
**Kostnad:** GRATIS
**Status:** ✅ Redan implementerat
**Data:**
- Betalningsanmärkningar
- Skulder
- Konkurser
- Ackord

**Användning:** Kreditkontroll, risk-bedömning

---

### 3. Arbetsförmedlingen API ✅
**Kostnad:** GRATIS
**Status:** ❌ Inte implementerat
**API:** https://jobsearch.api.jobtechdev.se
**Data:**
- Platsannonser per företag
- Rekryteringstrender
- Jobbkategorier
- Publiceringsdatum

**Användning:** 
- Trigger för expansion (rekrytering = tillväxt)
- Identifiera växande företag

**Implementation:**
```bash
# Ingen API-nyckel krävs!
curl "https://jobsearch.api.jobtechdev.se/search?employer=556123-4567"
```

---

### 4. Skatteverket ⚠️
**Kostnad:** GRATIS (men ingen officiell API)
**Status:** ❌ Inte implementerat
**Data:**
- Momsregistrering
- F-skatt
- Arbetsgivarregistrering

**Användning:** Verifiera att företaget är aktivt

**OBS:** Skatteverket har ingen officiell API, men data är offentlig och kan scrapar från deras webbplats.

---

## 🆓 GRATIS API:er (Free Tier)

### 5. Hunter.io ✅
**Kostnad:** GRATIS (Free Tier)
**Status:** ✅ Implementerat nu!

**Free Tier Limits:**
- 50 email verifications/månad
- 25 email searches/månad
- Domain search (obegränsat)

**Paid Tiers:**
- $49/månad: 1,000 verifications
- $99/månad: 5,000 verifications
- $199/månad: 10,000 verifications

**Data:**
- Email-verifiering
- Email-sökning (hitta email för person)
- Domain patterns
- SMTP check
- Deliverability score

**Användning:**
- Verifiera emails till beslutsfattare
- Hitta emails baserat på namn + företag
- Validera kontaktuppgifter

**Rekommendation:** Börja med FREE tier! ✅

---

## 💳 BETALDA API:er

### 6. Ratsit API
**Kostnad:** ~2,000 - 5,000 kr/månad
**Status:** ❌ Inte implementerat
**Data:**
- Direkta telefonnummer
- Mobilnummer
- Adresser
- Beslutsfattare

**Användning:** Telefonnummer till beslutsfattare

**Alternativ:** Hitta.se, Eniro

---

### 7. Merinfo API
**Kostnad:** ~3,000 - 7,000 kr/månad
**Status:** ❌ Inte implementerat
**Data:**
- VD, CFO, Logistikchef
- Verifierade kontaktuppgifter
- Organisationsschema
- Beslutsfattare med roller

**Användning:** Beslutsfattare med kontaktuppgifter

---

### 8. UC (Upplysningscentralen)
**Kostnad:** ~5,000 - 10,000 kr/månad
**Status:** ❌ Inte implementerat
**Data:**
- Kreditbetyg (AAA, AA, A, B, C)
- Betalningshistorik
- Riskklass
- Rekommenderad kreditgräns

**Användning:** Djupare kreditkontroll

**Alternativ:** Creditsafe, Bisnode

---

### 9. BuiltWith API
**Kostnad:** ~$300/månad (~3,000 kr)
**Status:** ❌ Inte implementerat
**Data:**
- Teknologier på webbplats
- CRM-system
- E-handelsplattformar
- Marketing automation
- Analytics tools

**Användning:** Teknologisignaler, identifiera tech stack

**Alternativ:** Wappalyzer

---

### 10. LinkedIn Sales Navigator API
**Kostnad:** ~$80/användare/månad (~800 kr)
**Status:** ❌ Inte implementerat
**Data:**
- Beslutsfattare (verifierade)
- LinkedIn-profiler
- Jobbhistorik
- Utbildning
- Kontaktnätverk

**Användning:** Hitta och verifiera beslutsfattare

**OBS:** Kräver Sales Navigator-licens

---

## 📊 Kostnadsjämförelse

### Scenario 1: Minimal (Endast Gratis)
**Månadskostnad:** 0 kr

**Inkluderar:**
- ✅ Bolagsverket
- ✅ Kronofogden
- ✅ Arbetsförmedlingen
- ✅ Hunter.io (Free tier - 50 verifications)

**Begränsningar:**
- Inga direkta telefonnummer
- Begränsad email-verifiering (50/månad)
- Inga teknologisignaler

---

### Scenario 2: Budget (Gratis + Hunter.io Paid)
**Månadskostnad:** ~500 kr

**Inkluderar:**
- ✅ Alla gratis API:er
- ✅ Hunter.io Paid ($49 = 1,000 verifications)

**Fördelar:**
- Email-verifiering för alla leads
- Email-sökning för beslutsfattare
- Fortfarande inga telefonnummer

---

### Scenario 3: Standard (Gratis + Kontaktdata)
**Månadskostnad:** ~7,500 kr

**Inkluderar:**
- ✅ Alla gratis API:er
- ✅ Hunter.io Paid ($49)
- ✅ Ratsit API (~3,000 kr)
- ✅ Merinfo API (~4,000 kr)

**Fördelar:**
- Direkta telefonnummer
- Verifierade emails
- Beslutsfattare med kontaktuppgifter

**Detta är MINIMUM för att konkurrera med Vainu/Tembi!**

---

### Scenario 4: Premium (Full Stack)
**Månadskostnad:** ~20,000 kr

**Inkluderar:**
- ✅ Alla gratis API:er
- ✅ Hunter.io Paid ($99 = 5,000 verifications)
- ✅ Ratsit API (~3,000 kr)
- ✅ Merinfo API (~4,000 kr)
- ✅ UC API (~8,000 kr)
- ✅ BuiltWith API (~3,000 kr)

**Fördelar:**
- Komplett kontaktdata
- Teknologisignaler
- Djup kreditkontroll
- Full paritet med Vainu/Tembi

---

## 🎯 Rekommendation

### Fas 1: Starta med GRATIS (0 kr/månad)
**Implementera nu:**
1. ✅ Arbetsförmedlingen API (GRATIS)
2. ✅ Hunter.io Free Tier (50 verifications/månad)
3. ✅ Utöka Bolagsverket-användning (styrelseändringar)

**Resultat:**
- Expansionssignaler (platsannonser)
- Email-verifiering (begränsad)
- Styrelseändringar

**Kostnad:** 0 kr/månad ✅

---

### Fas 2: Uppgradera till Budget (500 kr/månad)
**När:** Efter 1-2 månader
**Lägg till:**
- Hunter.io Paid ($49/månad)

**Resultat:**
- 1,000 email verifications/månad
- Email-sökning för alla beslutsfattare

**Kostnad:** ~500 kr/månad

---

### Fas 3: Standard (7,500 kr/månad)
**När:** Efter 3-6 månader
**Lägg till:**
- Ratsit API (~3,000 kr)
- Merinfo API (~4,000 kr)

**Resultat:**
- Direkta telefonnummer
- Verifierade beslutsfattare
- Konkurrenskraftig mot Vainu/Tembi

**Kostnad:** ~7,500 kr/månad

---

### Fas 4: Premium (20,000 kr/månad)
**När:** Efter 6-12 månader
**Lägg till:**
- UC API (~8,000 kr)
- BuiltWith API (~3,000 kr)

**Resultat:**
- Full paritet med Vainu/Tembi
- Teknologisignaler
- Djup kreditkontroll

**Kostnad:** ~20,000 kr/månad

---

## 📋 Nuvarande Status

### ✅ Implementerat (GRATIS)
- Bolagsverket API
- Kronofogden API

### ✅ Implementerat Nu (GRATIS)
- Hunter.io service (Free tier klar!)

### ❌ Inte Implementerat (GRATIS)
- Arbetsförmedlingen API
- Skatteverket (scraping)

### ❌ Inte Implementerat (BETALD)
- Ratsit API
- Merinfo API
- UC API
- BuiltWith API
- LinkedIn Sales Navigator

---

## 🎉 Sammanfattning

### Gratis API:er vi kan använda NU:
1. ✅ Bolagsverket (redan implementerat)
2. ✅ Kronofogden (redan implementerat)
3. ✅ Hunter.io Free Tier (implementerat nu!)
4. ⭐ Arbetsförmedlingen (implementera nästa!)
5. ⭐ Skatteverket (scraping)

### Total kostnad för att börja: 0 kr! ✅

### Nästa steg:
1. Implementera Arbetsförmedlingen API (GRATIS)
2. Testa Hunter.io Free Tier (50 verifications/månad)
3. Efter 1-2 månader: Uppgradera Hunter.io till $49/månad
4. Efter 3-6 månader: Lägg till Ratsit + Merinfo för telefonnummer

**Rekommendation:** Börja med GRATIS-nivån och uppgradera baserat på behov! 🚀
