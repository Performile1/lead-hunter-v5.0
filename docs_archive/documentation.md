# 📦 DHL Verified Lead Hunter - Systemdokumentation

**Version:** App: v4.3 | Protokoll: v6.7 (Batch) / v8.2 (Djup)
**Teknologi:** React (TypeScript), Tailwind CSS, Google Gemini API (`@google/genai`).
**Syfte:** Ett B2B Sales Intelligence-verktyg för att identifiera, kvalificera och segmentera potentiella kunder baserat på fraktpotential (5% av omsättning).

---

## 1. Systemöversikt & Arkitektur

Applikationen är en **Single Page Application (SPA)** som körs helt i webbläsaren men använder Google Gemini som backend-motor för datahämtning och analys.

### Kärnprinciper
1.  **AI-driven Datahämtning:** Använder LLM (Large Language Models) med Google Search Grounding för att hämta realtidsdata från Allabolag, Ratsit, Proff, Linkedin och Bolagsverket.
2.  **Strikt Segmentering:** Segmenterar automatiskt företag i **TS** (Telesales), **FS** (Field Sales) och **KAM** (Key Account Management) baserat på en **5%-regel** (Estimerad frakt = 5% av omsättning).
3.  **Lead Reservoir (Cache):** En lokal databas ("Cachen") sparar *alla* hittade företag för att minimera API-kostnader och möjliggöra återanvändning av leads.
4.  **Exkludering:** Förhindrar bearbetning av befintliga kunder och tidigare nedladdade leads.

---

## 2. Filstruktur & Komponenter

### `src/` (Roten)

#### `App.tsx` (Hjärnan)
Huvudkomponenten som orkestrerar hela flödet.
*   **State Management:** Hanterar `leads` (aktiv lista), `candidateCache` (reservoar), `existingCustomers` (exkluderingar) och `downloadedLeads` (historik).
*   **Persistens:** Synkroniserar all data till `localStorage`.
*   **`handleSearch`:** Logiken för sökning. Prioriterar Cache -> API. Hanterar "Vattenfallseffekten" i batch-sökning.
*   **`handleDownloadSingle` / `downloadCSV`:** Genererar CSV-filer och flyttar leads från Aktiv/Cache till Exkluderingslistan.
*   **`addToCache`:** Dedupliceringslogik för att spara leads.

#### `types.ts` (Datamodeller)
Definierar TypeScript-interfaces för applikationen.
*   **`LeadData`:** Huvudobjektet för ett företag (Namn, Omsättning, Segment, Beslutsfattare, Logistikprofil, etc.).
*   **`SearchFormData`:** Strukturen för användarens input.
*   **`Segment`:** Enum för TS, FS, KAM.

### `src/services/`

#### `geminiService.ts` (API-lagret)
Hanterar kommunikationen med Google Gemini.
*   **`generateLeads(formData)`:** Väljer rätt prompt (Djup/Snabb/Batch) och modell (`gemini-3-pro` vs `2.5-flash`).
*   **`generateWithRetry`:** Implementerar "Exponential Backoff" för att hantera 500/503-fel från API:et.
*   **`mapAiResponseToLeadData`:** **KRITISK FUNKTION.**
    *   Parsar rådata från AI.
    *   **Räknar ut Fraktbudget:** `(Omsättning * 0.05)`.
    *   **Tvingar Segment:** Överskriver AI:ns gissning med matematisk logik (t.ex. >5 MSEK frakt = KAM).
*   **`findPersonOnLinkedIn`:** Specialfunktion för att göra en riktad personsökning (använder `gemini-3-pro-preview`).
*   **`extractJSON`:** Robust RegEx/logik för att extrahera JSON ur AI:ns textsvars.

### `src/components/`

#### `InputForm.tsx`
Användargränssnittet för sökparametrar.
*   **Tab-system:** Växlar mellan "Enstaka" och "Batch".
*   **Chip Inputs:** Hanterar listor för sökord (Triggers, Roller).
*   **Demo-data:** Fyller i formuläret automatiskt via `OnboardingTour`.

#### `ResultsTable.tsx`
Tabellvyn för sökresultat.
*   **Sortering:** Klickbara kolumner (Omsättning, Segment, Namn).
*   **Filtrering:** Låser sig till segmentet man sökte på, samt Min. Omsättning-filter.
*   **Visuella Indikatorer:** Varning för Koncernkonflikt, Kreditvarning, Cache-ikon.

#### `LeadCard.tsx`
Detaljvyn ("Djupdykning").
*   Visar all data: Logistikprofil (B2B/B2C/Väg), Tech-stack, F-skatt, Moderbolag.
*   **LinkedIn-integration:** Knappar för att söka personer.

#### `Header.tsx`
Toppmeny.
*   Innehåller protokollväljaren (Djup/Snabb/Batch).
*   Knappar för att öppna modalerna (Cache, Exkludering, Riktad Sökning).

#### `CacheManager.tsx` (Reservoir)
Databasvyn.
*   Visar leads som hittats men inte matchade det *aktuella* filtret.
*   Tillåter: "Flytta till Arbetsvy" eller "Ladda ner & Exkludera".
*   Visar om ett företag redan ligger i arbetsvyn.

#### `ExclusionManager.tsx`
Hanterar "Svarta listan".
*   **Befintliga Kunder:** Manuell lista som användaren klistrar in.
*   **Historik:** Automatisk lista på företag som laddats ner tidigare.

#### `InclusionManager.tsx`
Hanterar Riktad Sökning.
*   Innehåller en komplett databas över **SNI 2007** (Svensk Näringsgrensindelning).
*   Låter användaren söka och välja branscher/nyckelord.

---

## 3. Protokoll & Prompts (`src/prompts/`)

Dessa filer innehåller systeminstruktionerna till AI:n.

### `deepAnalysis.ts` (v8.2)
*   **Användning:** Enstaka sökningar & Djupdykningar.
*   **Fokus:** Maximal detaljrikedom.
*   **Unika features:** Söker efter Tech-stack (E-handel), F-skatt, Ägarstruktur (Dotterbolag), Logistikprofil (Import/Export).
*   **Säkerhet:** Förbjuder Wikipedia, kräver verifierade källor (Allabolag/Bolagsverket).

### `batchProspecting.ts` (v6.7)
*   **Användning:** Batch-sökning (Standard).
*   **Fokus:** Hastighet & Volym.
*   **Logik:**
    *   Prioriterar Omsättning och Juridisk Status (Aktivt bolag).
    *   Om `includedKeywords` är tomt -> Söker brett (General Search).
    *   Om `includedKeywords` finns -> Strikt matchning.

### `quickScan.ts` (v6.3)
*   **Användning:** Gammal batch-metod (finns kvar som alternativ).
*   **Fokus:** Mellanting mellan hastighet och detalj (söker kontaktpersoner direkt).

---

## 4. Logiska Flöden

### Sökflödet (Batch)
1.  **Input:** Användaren väljer "Borås", "KAM" och "3 leads".
2.  **Exkludering:** Appen bygger en lista: `Befintliga Kunder + Nedladdad Historik + Aktiva Leads i Vyn`.
3.  **Cache-kontroll (Steg 1):**
    *   Appen tittar i `candidateCache`.
    *   Hittar den företag som matchar "Borås" + "KAM" + (Inte exkluderad)?
    *   **JA:** Flyttar dem direkt till vyn (Minskar API-anrop).
4.  **API-anrop (Steg 2):**
    *   Om målet ej är nått, anropas Gemini API.
    *   Prompten skapas med strikta omsättningskrav (t.ex. "MÅSTE ha >100 MSEK omsättning").
5.  **Bearbetning:**
    *   AI returnerar en lista.
    *   Appen beräknar segment (5% regeln).
    *   **Matchar segmentet?** -> Läggs till i `leads` (Aktiv vy).
    *   **Matchar INTE?** -> Läggs till i `candidateCache` (Sparas till senare).
6.  **Persistens:** Allt sparas löpande.

### Nedladdningsflödet
1.  Användaren klickar "Ladda ner" (Enskild eller Alla).
2.  **Generering:** CSV skapas och laddas ner.
3.  **Historik:** Företagsnamnet läggs till i `downloadedLeads`.
4.  **Rensning:** Företaget raderas från `leads` (Visning) OCH `candidateCache` (Reservoir).
5.  **Effekt:** Företaget kommer aldrig att dyka upp i sökningar igen (eftersom det nu ligger i exkluderingslistan).

---

## 5. Viktiga Variabler & State (LocalStorage)

| Nyckel | Syfte |
| :--- | :--- |
| `dhl_active_leads` | Företagen som just nu syns i resultatlistan. |
| `dhl_candidate_cache` | "Reservoaren". Alla hittade företag som inte bearbetats än. |
| `dhl_existing_customers` | "Svarta listan" med manuellt inlagda kunder. |
| `dhl_downloaded_leads` | Historik över företag som exporterats till CSV. |
| `dhl_included_keywords` | Valda SNI-koder/Branscher för riktad sökning. |
| `dhl_last_form_data` | Sparar senaste sökningen för att "Sök Mer"-knappen ska fungera. |

---

## 6. Kända Begränsningar & Felhantering

*   **Fel 400 (Invalid Argument):** Uppstår om man kombinerar `tools: googleSearch` med `responseMimeType: application/json`.
    *   *Lösning:* `geminiService.ts` tvingar bort mimeType när tools används.
*   **Fel 429 (Quota Exceeded):** Kan uppstå vid för många sökningar.
    *   *Lösning:* Appen har en inbyggd fördröjning i Batch-läget (utom Prospektering) och en `generateWithRetry`-funktion.
*   **Hallucinationer:** AI kan ibland gissa data.
    *   *Motåtgärd:* "Grounding" (Google Sök) är påslaget. Koden verifierar omsättning och räknar ut segment matematiskt istället för att lita på AI:ns text.
