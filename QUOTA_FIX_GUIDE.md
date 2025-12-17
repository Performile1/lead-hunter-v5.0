# 🚨 API Quota Exhausted - Snabbfix Guide

## Problem
Du får dessa fel:
1. ❌ **Gemini quota slut** - 20 requests/dag limit nådd
2. ❌ **Groq API-nyckel ogiltig** - 401 Unauthorized  
3. ❌ **Request queue inte aktiv** - Systemet använder inte kön än

## 🔧 Lösning 1: Fixa Groq API-nyckel (5 minuter)

### Steg 1: Skaffa ny Groq API-nyckel
1. Gå till: https://console.groq.com/keys
2. Logga in (eller skapa konto - GRATIS)
3. Klicka "Create API Key"
4. Kopiera nyckeln (börjar med `gsk_`)

### Steg 2: Uppdatera .env-filen
Öppna `c:\Users\A\Downloads\lead-hunter-v5.0\.env` och ersätt:

```env
# Gammal (ogiltig)
VITE_GROQ_API_KEY=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

# Ny (från Groq console)
VITE_GROQ_API_KEY=gsk_DIN_NYA_NYCKEL_HÄR
```

### Steg 3: Starta om utvecklingsservern
```bash
# Stoppa servern (Ctrl+C)
# Starta igen
npm run dev
```

### Steg 4: Testa
Sök efter ett företag - nu ska Groq fallback fungera när Gemini är slut!

---

## 🔧 Lösning 2: Öka Gemini Quota (Rekommenderat)

### Alternativ A: Vänta till imorgon
- Gemini free tier återställs varje dag
- 20 requests/dag per modell
- Kostar: $0

### Alternativ B: Uppgradera till betald plan
1. Gå till: https://ai.google.dev/pricing
2. Aktivera billing i Google Cloud Console
3. Få 1500 requests/timme istället för 20/dag
4. Kostnad: ~$0.075 per 1000 requests (mycket billigt!)

**Rekommendation:** Uppgradera till betald Gemini - kostar nästan ingenting men ger 75x mer kapacitet.

---

## 🔧 Lösning 3: Lägg till fler AI-tjänster

### DeepSeek (Billig backup)
```bash
# 1. Skaffa nyckel: https://platform.deepseek.com
# 2. Lägg till i .env:
VITE_DEEPSEEK_API_KEY=din_nyckel_här
```
**Kostnad:** $0.14 per 1M tokens (extremt billigt!)

### Claude (Högkvalitet backup)
```bash
# 1. Skaffa nyckel: https://console.anthropic.com
# 2. Lägg till i .env:
VITE_CLAUDE_API_KEY=din_nyckel_här
```
**Kostnad:** $3 per 1M tokens (bra kvalitet)

---

## 📊 Nuvarande Status

### Gemini
- **Status**: ❌ Quota slut (20/20 requests använt)
- **Återställs**: Imorgon (midnatt UTC)
- **Lösning**: Uppgradera till betald eller vänta

### Groq  
- **Status**: ❌ Ogiltig API-nyckel (401 error)
- **Lösning**: Skaffa ny nyckel från https://console.groq.com/keys
- **Kostnad**: GRATIS (14,400 requests/dag)

### Request Queue
- **Status**: ⚠️ Implementerad men inte integrerad i geminiService
- **Lösning**: Kommer i nästa deploy
- **Effekt**: Förhindrar framtida quota-problem

---

## 🎯 Rekommenderad Åtgärdsplan

### Omedelbart (5 min):
1. ✅ Skaffa ny Groq API-nyckel
2. ✅ Uppdatera `.env` med `VITE_GROQ_API_KEY`
3. ✅ Starta om servern

### Inom 24h:
4. ✅ Uppgradera Gemini till betald plan ($5-10/månad)
5. ✅ Lägg till DeepSeek som extra backup

### Långsiktigt:
6. ✅ Integrera request queue i geminiService (nästa deploy)
7. ✅ Övervaka användning via Request Queue Monitor

---

## 🔍 Verifiera att det fungerar

### Test 1: Groq fungerar
```javascript
// I browser console:
console.log(import.meta.env.VITE_GROQ_API_KEY);
// Ska visa din nya nyckel (börjar med gsk_)
```

### Test 2: Fallback aktiveras
1. Sök efter ett företag
2. Kolla console logs
3. Du ska se: "🚀 Gemini Quota hit. Trying GROQ fallback..."
4. Sedan: "✅ Groq analysis completed" (inte 401 error)

---

## 💡 Varför händer detta?

### Gemini Free Tier Limits:
- **20 requests/dag** per modell (gemini-2.5-flash)
- Räknas per Google Cloud projekt
- Återställs midnatt UTC
- För lite för produktion

### Groq API-nyckel:
- Nycklar kan bli ogiltiga om:
  - Projektet raderades
  - Nyckeln revokerades
  - Kontot suspenderades
- Lösning: Skapa ny nyckel

### Request Queue:
- Implementerad men inte integrerad än
- Kommer förhindra quota-spikes
- Nästa deploy aktiverar den

---

## 📞 Snabbhjälp

### Fel: "Invalid API Key" (Groq)
**Lösning:** Skaffa ny nyckel från https://console.groq.com/keys

### Fel: "Quota Exhausted" (Gemini)
**Lösning:** Uppgradera till betald eller vänta till imorgon

### Fel: "RESOURCE_EXHAUSTED"
**Lösning:** Samma som Quota Exhausted

### Fel: "429 Too Many Requests"
**Lösning:** Request queue kommer hantera detta automatiskt

---

## 🚀 Efter Fix

När du har fixat Groq-nyckeln kommer systemet:
1. ✅ Använda Gemini först (när quota finns)
2. ✅ Falla tillbaka till Groq automatiskt (14,400 requests/dag GRATIS)
3. ✅ Visa tydliga felmeddelanden om båda är slut
4. ✅ Köa requests för att undvika framtida quota-problem

**Total kapacitet med fix:**
- Gemini: 20/dag (gratis) eller 1500/timme (betald)
- Groq: 14,400/dag (gratis)
- **Totalt: 14,420+ requests/dag GRATIS!**

---

## 📋 Checklista

- [ ] Skaffat ny Groq API-nyckel
- [ ] Uppdaterat `.env` med `VITE_GROQ_API_KEY`
- [ ] Startat om servern (`npm run dev`)
- [ ] Testat att söka efter företag
- [ ] Verifierat att Groq fallback fungerar
- [ ] (Valfritt) Uppgraderat Gemini till betald
- [ ] (Valfritt) Lagt till DeepSeek backup

**När alla är checkade: Systemet fungerar igen!** ✅
