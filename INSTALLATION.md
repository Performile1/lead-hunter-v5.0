# 🚀 Installationsguide - Multi-LLM & API Integration

## Vad har implementerats?

✅ **Groq Integration** - Gratis LLM-fallback (Llama 3.1 70B)
✅ **Förbättrad Kronofogden Service** - Utökad konkurs/rekonstruktionskontroll
✅ **Bolagsverket Service** - Org.nr validering och normalisering
✅ **Skatteverket Service** - F-skatt kontroll (placeholder för framtida API)
✅ **SCB Service** - SNI-koder och branschstatistik (placeholder)
✅ **Multi-LLM Orchestrator** - Smart routing mellan LLM-providers
✅ **Kostnadsoptimering** - Automatisk fallback till gratis alternativ

---

## Steg 1: Installera Dependencies

```bash
npm install
```

Detta installerar:
- `groq-sdk` - För Groq API (Llama 3.1 70B)
- Alla befintliga dependencies

---

## Steg 2: Konfigurera API-nycklar

### 2.1 Kopiera exempel-filen

```bash
copy .env.local.example .env.local
```

### 2.2 Hämta API-nycklar

#### 🔑 **GEMINI API** (OBLIGATORISK - ni har redan)
- URL: https://aistudio.google.com/app/apikey
- Kostnad: Gratis tier finns, sedan betald
- Lägg till i `.env.local`:
  ```
  GEMINI_API_KEY=din_nyckel_här
  ```

#### 🔑 **GROQ API** (REKOMMENDERAD - GRATIS!)
1. Gå till: https://console.groq.com/
2. Skapa konto (gratis)
3. Gå till "API Keys"
4. Skapa ny nyckel
5. Lägg till i `.env.local`:
   ```
   GROQ_API_KEY=din_groq_nyckel_här
   ```

**Fördelar:**
- ✅ 14,400 requests/dag GRATIS
- ✅ 500+ tokens/sekund (extremt snabb)
- ✅ Llama 3.1 70B (bra kvalitet)
- ✅ Automatisk fallback när Gemini får kvotproblem

---

## Steg 3: Testa Installationen

### 3.1 Starta utvecklingsservern

```bash
npm run dev
```

### 3.2 Testa Groq-fallback

Öppna browser console (F12) och kör:

```javascript
// Testa om Groq är tillgängligt
import { isGroqAvailable } from './services/groqService';
console.log('Groq available:', isGroqAvailable());
```

### 3.3 Testa API-integration

Gör en sökning i applikationen. Om Gemini får kvotproblem kommer ni se:

```
🚀 Gemini Quota hit. Trying GROQ fallback (FREE & FAST)...
```

---

## Steg 4: Verifiera Nya Funktioner

### 4.1 Kronofogden-kontroll

När ni analyserar ett företag kommer systemet automatiskt att:
1. Validera organisationsnumret
2. Kontrollera mot Kronofogdens register
3. Visa varning om konkurs/rekonstruktion finns

**Exempel i console:**
```
✅ Inget ärende hos Kronofogden för IKEA AB
```

eller

```
⚠️ Kronofogden hit: Konkurs för Företag AB
```

### 4.2 Org.nr Validering

Systemet validerar nu org.nr med Luhn-algoritmen:

```javascript
import { validateOrgNumber } from './services/bolagsverketService';

validateOrgNumber('556016-0680'); // true (IKEA)
validateOrgNumber('123456-7890'); // false (ogiltigt)
```

---

## Steg 5: Kostnadsoptimering

### Automatisk Routing

Systemet väljer automatiskt bästa LLM baserat på:

1. **Kräver web search?** → Gemini (har grounding)
2. **Prioritet: Hastighet?** → Groq (500+ tokens/s)
3. **Prioritet: Kostnad?** → Groq (gratis)
4. **Prioritet: Kvalitet?** → Gemini

### Fallback-kedja

```
1. Försök Gemini
   ↓ (om 429/quota)
2. Försök Groq (GRATIS)
   ↓ (om Groq också misslyckas)
3. Gemini utan grounding
   ↓ (om fortfarande misslyckas)
4. Visa felmeddelande
```

---

## Steg 6: Övervaka Prestanda

### LLM Statistik

Systemet loggar automatiskt:
- Antal requests per provider
- Genomsnittlig latency
- Total kostnad
- Success rate

**Se statistik i console:**
```javascript
import { getLLMStats, formatLLMStats } from './services/llmOrchestrator';

console.log(formatLLMStats());
```

**Exempel output:**
```
📊 LLM Statistik:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Totalt requests: 150
Lyckade: 148 (98.7%)
Misslyckade: 2
Total kostnad: $2.45
Genomsnittlig latency: 1250ms

Provider-användning:
  • Gemini: 100 (67%)
  • Groq: 48 (32%)
  • OpenAI: 0 (0%)
  • Claude: 0 (0%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Steg 7: Framtida API:er (Valfritt)

### UC eller Allabolag API

För produktionsmiljö, rekommendera vi att lägga till:

**UC API:**
- Kostnad: Från 2,000 SEK/månad
- Data: Verifierad omsättning, kreditbetyg, nyckeltal
- Kontakt: https://www.uc.se/vara-tjanster/api

**Allabolag API:**
- Kostnad: Från 1,500 SEK/månad
- Data: Liknande UC
- Kontakt: https://www.allabolag.se/api

**Integration:**
Servicen är redan förberedd i `bolagsverketService.ts` och `skatteverketService.ts`

---

## Felsökning

### Problem: "GROQ_API_KEY saknas"

**Lösning:**
1. Kontrollera att `.env.local` finns
2. Verifiera att `GROQ_API_KEY=...` är korrekt
3. Starta om utvecklingsservern

### Problem: "Groq fallback failed"

**Lösning:**
- Groq har också kvotbegränsningar (14,400/dag)
- Systemet faller tillbaka till Gemini utan grounding
- Överväg att lägga till OpenAI som tredje fallback

### Problem: Kronofogden-check misslyckas

**Lösning:**
- Kronofogdens API kan vara nere ibland
- Systemet fortsätter utan Kronofogden-data
- Inget kritiskt fel

---

## Nästa Steg

### Kort sikt (1-2 veckor):
1. ✅ Testa Groq-fallback i produktion
2. ✅ Övervaka kostnader och prestanda
3. ✅ Samla statistik på provider-användning

### Medellång sikt (1 månad):
1. Utvärdera UC/Allabolag API (demo)
2. Implementera OpenAI som tredje fallback
3. Optimera prompts för Groq

### Lång sikt (2-3 månader):
1. Implementera Bolagsverket API när det blir tillgängligt
2. Lägg till Skatteverket F-skatt kontroll
3. Integrera SCB branschstatistik

---

## Support & Hjälp

**Dokumentation:**
- `RECOMMENDED_DATA_SOURCES.md` - Detaljerad guide om API:er
- `IMPLEMENTATION_GUIDE.md` - Kodexempel och best practices
- `SUMMARY_SWEDISH.md` - Svensk sammanfattning

**Frågor?**
Kontrollera console-loggar för detaljerad information om vad som händer.

---

## Sammanfattning av Förbättringar

### Före:
- ❌ Endast Gemini (single point of failure)
- ❌ Ingen fallback vid kvotproblem
- ❌ Grundläggande Kronofogden-check
- ❌ Ingen org.nr validering

### Efter:
- ✅ Multi-LLM med automatisk fallback
- ✅ Groq som gratis backup (14,400 requests/dag)
- ✅ Förbättrad Kronofogden-integration
- ✅ Org.nr validering med Luhn-algoritmen
- ✅ Kostnadsoptimering och statistik
- ✅ Redo för framtida API:er (UC, Allabolag, etc.)

**Uppskattat resultat:**
- 📉 50-70% lägre kostnader (tack vare Groq)
- 📈 99%+ uptime (tack vare fallback)
- ⚡ 2-3x snabbare batch-processing (Groq)
- ✅ Bättre datakvalitet (validering)

---

🎉 **Grattis! Er Lead Hunter är nu uppgraderad med multi-LLM och API-integration!**
