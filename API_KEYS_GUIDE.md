# 🔑 API-nycklar Guide - Steg för Steg

## Snabbstart (5 minuter)

### 1. Groq API (GRATIS - REKOMMENDERAD!)

#### Varför Groq?
- ✅ **14,400 requests/dag GRATIS**
- ✅ **500+ tokens/sekund** (extremt snabb)
- ✅ **Llama 3.1 70B** (bra kvalitet)
- ✅ **Automatisk fallback** när Gemini får problem

#### Så här får du Groq API-nyckel:

1. **Gå till:** https://console.groq.com/

2. **Skapa konto:**
   - Klicka "Sign Up"
   - Använd Google/GitHub eller email
   - Verifiera email

3. **Skapa API-nyckel:**
   - Klicka på "API Keys" i menyn
   - Klicka "Create API Key"
   - Ge den ett namn (t.ex. "DHL Lead Hunter")
   - Kopiera nyckeln (visas bara en gång!)

4. **Lägg till i .env.local:**
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

5. **Klart!** Starta om servern: `npm run dev`

---

## Detaljerad Guide för Alla API:er

### 🔵 Google Gemini (NI HAR REDAN)

**Status:** ✅ Redan konfigurerad

**Om ni behöver ny nyckel:**
1. Gå till: https://aistudio.google.com/app/apikey
2. Klicka "Create API Key"
3. Välj projekt eller skapa nytt
4. Kopiera nyckeln
5. Lägg till i `.env.local`:
   ```
   GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Kostnad:**
- Gratis tier: 15 requests/minut
- Betald: Från $0.35/1M tokens

---

### 🟢 Groq (GRATIS - HÖGSTA PRIORITET)

**Status:** 🆕 Nytt tillagt

**Steg:**
1. https://console.groq.com/
2. Sign up (gratis)
3. API Keys → Create API Key
4. Kopiera nyckel
5. Lägg till i `.env.local`:
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Kostnad:** GRATIS
- 14,400 requests/dag
- 30 requests/minut
- Ingen kreditkort krävs

**Modeller:**
- Llama 3.1 70B (rekommenderad)
- Llama 3.1 8B (snabbare)
- Mixtral 8x7B

---

### 🟠 OpenAI (VALFRITT - HÖGRE KVALITET)

**Status:** ⚪ Inte implementerad ännu (men förberedd)

**Steg:**
1. Gå till: https://platform.openai.com/signup
2. Skapa konto
3. Lägg till betalningsmetod (kreditkort krävs)
4. API Keys → Create new secret key
5. Kopiera nyckel
6. Lägg till i `.env.local`:
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Kostnad:**
- GPT-4o-mini: $0.15/1M input, $0.60/1M output
- GPT-4o: $2.50/1M input, $10/1M output

**När använda:**
- Komplex analys
- Icebreaker-generering
- Sentiment-analys

---

### 🔴 Kronofogden (GRATIS - REDAN IMPLEMENTERAD!)

**Status:** ✅ Fungerar utan API-nyckel

**Info:**
- Öppet API från Kronofogden
- Ingen registrering krävs
- Kontrollerar konkurs/rekonstruktion

**Endpoint:**
```
https://kronofogden.entryscape.net/rowstore/dataset/
```

**Användning:** Automatisk i systemet

---

### 🟡 Bolagsverket (GRATIS - DELVIS IMPLEMENTERAD)

**Status:** ⚠️ Inget publikt REST API ännu

**Info:**
- Bolagsverket har öppna datafiler
- Men inget REST API (2024)
- Servicen är förberedd för framtiden

**Alternativ:**
- Använd UC eller Allabolag API
- Vänta på Bolagsverkets API

---

### 🔵 UC API (BETALD - REKOMMENDERAD FÖR PRODUKTION)

**Status:** ⚪ Inte implementerad (men förberedd)

**Steg:**
1. Kontakta: https://www.uc.se/vara-tjanster/api
2. Begär offert och demo
3. Teckna avtal
4. Få API-nyckel och dokumentation
5. Lägg till i `.env.local`:
   ```
   UC_API_KEY=din_uc_nyckel_här
   ```

**Kostnad:**
- Setup: ~10,000 SEK
- Månadskostnad: Från 2,000 SEK
- Per request: 5-50 SEK

**Data:**
- ✅ Verifierad omsättning
- ✅ Kreditbetyg (AAA, AA, A, etc.)
- ✅ Nyckeltal (soliditet, kassalikviditet)
- ✅ Betalningsanmärkningar
- ✅ Koncernstruktur

---

### 🟢 Allabolag API (BETALD - ALTERNATIV TILL UC)

**Status:** ⚪ Inte implementerad (men förberedd)

**Steg:**
1. Kontakta: https://www.allabolag.se/api
2. Begär demo
3. Välj paket
4. Få API-nyckel
5. Lägg till i `.env.local`:
   ```
   ALLABOLAG_API_KEY=din_allabolag_nyckel_här
   ```

**Kostnad:**
- Från 1,500 SEK/månad
- Volymrabatter finns

**Data:**
- ✅ Omsättning
- ✅ Kreditbetyg
- ✅ Kontaktuppgifter
- ✅ Beslutsfattare (begränsat)

---

### 🟣 Skatteverket (GRATIS - MEN INGET API)

**Status:** ⚠️ Inget publikt REST API

**Info:**
- Skatteverket har F-skatt register
- Men inget API för automatisk kontroll
- Måste scrapa webbformulär (juridisk gråzon)

**Alternativ:**
- Använd UC/Allabolag (har avtal med Skatteverket)
- Manuell kontroll via: https://www.skatteverket.se/

---

### 📊 SCB (GRATIS - BEGRÄNSAT API)

**Status:** ⚪ Delvis implementerad

**Steg:**
1. API: https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/
2. Ingen registrering krävs
3. Använd direkt

**Data:**
- ✅ Branschkoder (SNI)
- ✅ Statistik per bransch
- ✅ Regional statistik

**Begränsning:**
- Ingen företagsspecifik data
- Endast aggregerad statistik

---

## Rekommenderad Konfiguration

### Minimal (Gratis)
```env
GEMINI_API_KEY=din_gemini_nyckel
GROQ_API_KEY=din_groq_nyckel
```

**Kostnad:** $0-20/månad
**Funktionalitet:** 90% av features

---

### Standard (Rekommenderad)
```env
GEMINI_API_KEY=din_gemini_nyckel
GROQ_API_KEY=din_groq_nyckel
OPENAI_API_KEY=din_openai_nyckel
```

**Kostnad:** $20-50/månad
**Funktionalitet:** 95% av features

---

### Premium (Produktion)
```env
GEMINI_API_KEY=din_gemini_nyckel
GROQ_API_KEY=din_groq_nyckel
OPENAI_API_KEY=din_openai_nyckel
UC_API_KEY=din_uc_nyckel
```

**Kostnad:** 2,000-5,000 SEK/månad
**Funktionalitet:** 100% av features + verifierad data

---

## Säkerhet

### ⚠️ VIKTIGT:

1. **Dela ALDRIG API-nycklar:**
   - Lägg INTE till `.env.local` i Git
   - Använd `.env.local.example` som mall

2. **Rotera nycklar regelbundet:**
   - Byt ut nycklar var 3:e månad
   - Radera gamla nycklar från providers

3. **Begränsa åtkomst:**
   - Använd olika nycklar för dev/prod
   - Sätt IP-restriktioner om möjligt

4. **Övervaka användning:**
   - Kolla dashboards regelbundet
   - Sätt upp alerts för ovanlig aktivitet

---

## Felsökning

### Problem: "API Key missing"

**Lösning:**
1. Kontrollera att `.env.local` finns
2. Verifiera att nyckelnamnet är korrekt
3. Starta om servern: `Ctrl+C` → `npm run dev`

### Problem: "Invalid API Key"

**Lösning:**
1. Kopiera nyckeln igen (inga mellanslag)
2. Kontrollera att nyckeln inte har utgått
3. Skapa ny nyckel om nödvändigt

### Problem: "Rate limit exceeded"

**Lösning:**
- Groq: Vänta 1 minut (30 requests/minut)
- Gemini: Vänta eller uppgradera plan
- Systemet byter automatiskt till fallback

---

## Sammanfattning

### Obligatoriska (Har ni redan):
- ✅ Gemini API

### Rekommenderade (Lägg till NU):
- 🟢 Groq API (GRATIS!)

### Valfria (Framtida):
- 🟠 OpenAI API (bättre kvalitet)
- 🔵 UC/Allabolag API (verifierad data)

**Nästa steg:**
1. Skaffa Groq API-nyckel (5 minuter)
2. Lägg till i `.env.local`
3. Starta om servern
4. Testa!

🎉 **Klart!**
