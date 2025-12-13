# 🔧 ADMIN & FUNKTIONSGUIDE

## 📋 INNEHÅLL

1. [Admin-funktioner](#admin-funktioner)
2. [Lead-allokering](#lead-allokering)
3. [Notifikationer](#notifikationer)
4. [Tiers i kundlista](#tiers-i-kundlista)
5. [Email & Meddelanden](#email--meddelanden)
6. [SSO (Single Sign-On)](#sso-single-sign-on)
7. [Saknade funktioner](#saknade-funktioner)

---

## 🔐 ADMIN-FUNKTIONER

### Var hittar jag admin-inställningar?

**Nuvarande status:** ⚠️ Admin-panel saknas i UI

**Vad som finns i backend:**
- ✅ Användare i databas (`users` tabell)
- ✅ Roller: admin, terminalchef, säljare
- ✅ API-nycklar i `.env`

**Vad som saknas:**
- ❌ Admin-panel i frontend
- ❌ UI för att lägga till användare
- ❌ UI för att hantera API-nycklar
- ❌ UI för cronjobs

### Lösning: Skapa Admin-panel

**Behöver implementeras:**

1. **Admin-meny** (höger övre hörn)
   - Användare
   - API-nycklar
   - Cronjobs
   - Systemstatus
   - Inställningar

2. **Användare-sida** (`/admin/users`)
   - Lista alla användare
   - Lägg till ny användare
   - Redigera roller (admin, terminalchef, säljare)
   - Aktivera/inaktivera användare

3. **API-nycklar** (`/admin/api-keys`)
   - Visa alla API-nycklar (maskerade)
   - Testa API-nycklar
   - Uppdatera nycklar

4. **Cronjobs** (`/admin/cronjobs`)
   - Lista alla cronjobs
   - Skapa ny cronjob
   - Aktivera/inaktivera
   - Se senaste körning

---

## 👥 LEAD-ALLOKERING

### Hur fungerar det nu?

**Nuvarande status:** ⚠️ Delvis implementerat

**Vad som finns:**
- ✅ `assignedTo` fält i databas
- ✅ Leads kan tilldelas användare
- ✅ Filter för "Mina leads" vs "Alla leads"

**Vad som saknas:**
- ❌ UI för att allokera leads
- ❌ Notifikation när lead tilldelas
- ❌ Historik över allokeringar

### Hur ska det fungera?

#### Som Admin:
1. Öppna lead i LeadCard
2. Se "Tilldela till" dropdown
3. Välj säljare från lista
4. Säljaren får notifikation

#### Som Terminalchef:
1. Samma som admin men bara för sin terminal
2. Kan bara tilldela till säljare på sin terminal

#### Som Säljare:
1. Ser "Mina leads" som standard
2. Kan filtrera på "Alla leads" (läsrättigheter)
3. Kan inte allokera leads

### Var ser säljare sina tilldelade leads?

**Ska implementeras:**

1. **Dashboard** (`/dashboard`)
   - "Mina leads" (tilldelade till mig)
   - "Nya leads" (tilldelade senaste 7 dagarna)
   - "Aktiva leads" (pågående)
   - "Vunna leads" (konverterade)

2. **Leadlist med filter**
   - "Mina leads" (default för säljare)
   - "Ej tilldelade"
   - "Alla leads" (admin/terminalchef)

3. **Notifikation**
   - Badge på "Mina leads" (antal nya)
   - Toast när nytt lead tilldelas

---

## 🔔 NOTIFIKATIONER

### Var ser jag notiser?

**Nuvarande status:** ❌ Inte implementerat

**Behöver implementeras:**

1. **Notifikations-ikon** (höger övre hörn)
   - Badge med antal olästa
   - Dropdown med senaste notiser
   - "Se alla" länk

2. **Typer av notiser:**
   - 🆕 Nytt lead tilldelat
   - ✅ Cronjob klart
   - 📊 Ny data på bevakad kund
   - 💬 Nytt meddelande
   - ⚠️ Systemvarning

3. **Notifikations-sida** (`/notifications`)
   - Lista alla notiser
   - Filtrera på typ
   - Markera som läst/oläst
   - Rensa gamla

### Bevakade kunder

**Behöver implementeras:**

1. **"Bevaka kund" knapp** på LeadCard
2. **Bevakningsinställningar:**
   - Ny omsättning
   - Nya beslutsfattare
   - Ny nyhetsartikel
   - Konkurrent-aktivitet
   - Trigger-händelse

3. **Notifikation när något händer:**
   - "RevolutionRace har ny VD"
   - "Gymgrossisten omsättning +25%"
   - "Ellos expanderar till Norge"

---

## 🏆 TIERS I KUNDLISTA

### Vad betyder tiers?

**Tiers = Kundkategorier baserat på potential/värde**

**Tier 1 - KAM (Key Account Management)**
- Stora kunder (>50 MSEK omsättning)
- Strategiskt viktiga
- Personlig kontakt
- Högsta prioritet

**Tier 2 - Mellankunder**
- Medelstora kunder (10-50 MSEK)
- Standarduppföljning
- Regelbunden kontakt

**Tier 3 - Småkunder**
- Små kunder (<10 MSEK)
- Självbetjäning
- Lägre prioritet

**Tier 4 - Prospekt**
- Potentiella kunder
- Ej kund ännu
- Nurturing-fas

### Hur sätts tier?

**Automatiskt baserat på:**
- Omsättning
- Opportunity Score
- Antal anställda
- Bransch
- Använder DHL redan?

**Manuellt:**
- Admin/Terminalchef kan ändra tier
- Baserat på strategiska skäl

---

## 📧 EMAIL & MEDDELANDEN

### Kan vi skicka email från systemet?

**Nuvarande status:** ❌ Inte implementerat

**Behöver implementeras:**

1. **Email-integration**
   - SMTP-konfiguration i .env
   - Email-templates
   - Skicka email från LeadCard

2. **Email-typer:**
   - Introduktionsmail till lead
   - Uppföljningsmail
   - Offert/Pitch
   - Påminnelse

3. **Email-tracking:**
   - Öppningsfrekvens
   - Klick på länkar
   - Svar

### Meddelanden mellan användare?

**Behöver implementeras:**

1. **Intern chat** (`/messages`)
   - Meddelanden mellan användare
   - Gruppchatt per terminal
   - Notifikationer

2. **Kommentarer på leads**
   - Kommentera på LeadCard
   - Tagga kollegor (@namn)
   - Historik

---

## 🔐 SSO (Single Sign-On)

### Varför saknas SSO?

**Nuvarande status:** ❌ Inte implementerat

**Vad som finns:**
- ✅ Basic email/password login
- ✅ JWT-tokens

**Vad som saknas:**
- ❌ Microsoft Azure AD / Entra ID
- ❌ Google Workspace
- ❌ SAML 2.0

### Implementera SSO

**Steg 1: Välj provider**
- Microsoft Azure AD (rekommenderat för DHL)
- Google Workspace
- Okta

**Steg 2: Konfigurera**
```env
# .env
SSO_ENABLED=true
SSO_PROVIDER=azure
AZURE_TENANT_ID=din_tenant_id
AZURE_CLIENT_ID=din_client_id
AZURE_CLIENT_SECRET=din_client_secret
```

**Steg 3: Uppdatera login**
- Lägg till "Logga in med Microsoft" knapp
- Redirect till Azure AD
- Callback och skapa JWT

---

## 🐛 SAKNADE FUNKTIONER & BUGGAR

### 1. DHL Logo i login
**Status:** ❌ Saknas
**Fix:** Lägg till logo i `Login.tsx`

### 2. "Lägg till kund" fungerar inte
**Status:** 🐛 Bug
**Fix:** Fixa submit-funktion i kundlista

### 3. Kundlista utseende
**Status:** ⚠️ Dåligt UI
**Fix:** Använd samma design som leadlist

### 4. Kontaktpersoner i leadlist
**Status:** ❌ Saknas
**Fix:** Lägg till kolumn för kontaktpersoner

### 5. Omsättning 2024 vs 2023
**Status:** 🐛 Bug
**Fix:** Visa senaste året automatiskt

### 6. Stäng LeadCard
**Status:** ❌ Saknas
**Fix:** Lägg till X-knapp och "Tillbaka" länk

### 7. Checkout position för RevolutionRace
**Status:** 🐛 Bug
**Fix:** Felsök hybrid scraping

---

## 🚀 PRIORITERAD IMPLEMENTATION

### Fas 1: Kritiska buggar (1-2 dagar)
1. ✅ Fixa checkout position
2. ✅ Lägg till DHL logo
3. ✅ Stäng-knapp på LeadCard
4. ✅ Fixa "Lägg till kund"
5. ✅ Visa kontaktpersoner i leadlist
6. ✅ Fixa omsättning 2024

### Fas 2: Admin-funktioner (3-5 dagar)
1. Skapa admin-panel
2. Användare-hantering
3. Lead-allokering UI
4. Notifikationssystem

### Fas 3: Kommunikation (5-7 dagar)
1. Email-integration
2. Intern chat
3. Kommentarer på leads

### Fas 4: SSO & Avancerat (1-2 veckor)
1. SSO-integration
2. Bevakade kunder
3. Cronjobs UI
4. Rapporter & Analytics

---

## 📝 NÄSTA STEG

**Vad vill du att jag fixar först?**

1. **Kritiska buggar** (checkout, logo, stäng-knapp, etc.)
2. **Admin-panel** (användare, allokering, notiser)
3. **Email & Chat** (kommunikation)
4. **SSO** (säkerhet)

**Säg bara vilket nummer så börjar jag!** 🚀
