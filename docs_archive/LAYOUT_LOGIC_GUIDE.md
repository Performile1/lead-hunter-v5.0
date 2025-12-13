# 📐 Layout Logic Guide - DHL Lead Hunter

## 🎯 Översikt

Denna guide förklarar den exakta logiken för hur UI:t fungerar när användaren söker och klickar på leads.

---

## 🔄 User Flow

### 1️⃣ Initial State (Ingen sökning)

```
┌──────────────┬─────────────────────────────────┐
│              │                                 │
│  SearchPanel │  Welcome Screen                 │
│  (sticky)    │  "Välkommen till DHL Lead..."  │
│              │                                 │
└──────────────┴─────────────────────────────────┘
```

**State:**
- `allLeads = []`
- `selectedLead = null`
- `isSearching = false`

**Visar:**
- SearchPanel (vänster)
- Welcome screen med instruktioner (höger)

---

### 2️⃣ Under Sökning

```
┌──────────────┬─────────────────────────────────┐
│              │                                 │
│  SearchPanel │  Loading Spinner                │
│  (sticky)    │  "Söker efter leads..."         │
│              │                                 │
└──────────────┴─────────────────────────────────┘
```

**State:**
- `allLeads = []`
- `selectedLead = null`
- `isSearching = true`

**Visar:**
- SearchPanel (vänster)
- Loading spinner med text (höger)

---

### 3️⃣ Sökning Klar - LeadList Visas

```
┌──────────────┬─────────────────────────────────┐
│              │  ┌─────────────────────────────┐ │
│  SearchPanel │  │ LEAD LISTA (10 leads)       │ │
│  (sticky)    │  ├─────────────────────────────┤ │
│              │  │ ▶ RevolutionRace AB   [85]  │ │
│              │  │ ▶ Boozt Fashion AB    [75]  │ │
│              │  │ ▶ Ellos AB            [65]  │ │
│              │  │ ▶ ...                       │ │
│              │  └─────────────────────────────┘ │
└──────────────┴─────────────────────────────────┘
```

**State:**
- `allLeads = [lead1, lead2, lead3, ...]`
- `selectedLead = null`
- `isSearching = false`

**Visar:**
- SearchPanel (vänster, sticky)
- LeadList med alla resultat (höger, full height)

**LeadList Features:**
- Varje lead är klickbar
- Visar: Företagsnamn, Org.nr, Segment, Stad, Omsättning
- Visar: DHL-status (✓ eller ✗)
- Visar: Triggers badge (antal)
- Visar: Opportunity Score (höger)
- Visar: Revenue change (+17.9% grön eller -5% röd)
- Hover-effekt
- Ingen lead är vald (ingen röd border)

---

### 4️⃣ Lead Klickat - LeadCard Öppnas OVANFÖR LeadList

```
┌──────────────┬─────────────────────────────────┐
│              │  [← Tillbaka till lista]        │
│  SearchPanel │  ┌─────────────────────────────┐ │
│  (sticky)    │  │ LEADCARD (expanderat)       │ │
│              │  │ RevolutionRace AB           │ │
│              │  │ ┌─────┬─────┬─────┐         │ │
│              │  │ │ Eko │ AI  │ Bes │         │ │
│              │  │ │ nomi│ Sälj│ luts│         │ │
│              │  │ │     │     │ fatt│         │ │
│              │  │ └─────┴─────┴─────┘         │ │
│              │  └─────────────────────────────┘ │
│              │                                 │
│              │  ┌─────────────────────────────┐ │
│              │  │ ANDRA LEADS (kompakt)       │ │
│              │  ├─────────────────────────────┤ │
│              │  │ ▶ Boozt Fashion AB    [75]  │ │
│              │  │ ▶ Ellos AB            [65]  │ │
│              │  │ ▶ ...                       │ │
│              │  └─────────────────────────────┘ │
└──────────────┴─────────────────────────────────┘
```

**State:**
- `allLeads = [lead1, lead2, lead3, ...]`
- `selectedLead = lead1` (RevolutionRace AB)
- `isSearching = false`

**Visar:**
- SearchPanel (vänster, sticky)
- **"Tillbaka till lista" knapp** (höger, topp)
- **LeadCard** (höger, expanderat, full 3-kolumns layout)
- **LeadList** (höger, under LeadCard, kompakt läge)

**LeadCard Features:**
- Full 3-kolumns layout
- Alla knappar: Ny Analys, Rapportera, Redigera
- Alla data synliga
- Knappar fungerar (onRefresh, onReport, onEdit)

**LeadList Features (Kompakt läge):**
- Titel ändras till "Andra Leads"
- Max-height: 500px (scrollbar om fler)
- Valt lead har röd border-left
- Andra leads klickbara
- Klick på annat lead → byter selectedLead

---

### 5️⃣ Klicka "Tillbaka till lista"

```
┌──────────────┬─────────────────────────────────┐
│              │  ┌─────────────────────────────┐ │
│  SearchPanel │  │ LEAD LISTA (10 leads)       │ │
│  (sticky)    │  ├─────────────────────────────┤ │
│              │  │ ▶ RevolutionRace AB   [85]  │ │
│              │  │ ▶ Boozt Fashion AB    [75]  │ │
│              │  │ ▶ Ellos AB            [65]  │ │
│              │  │ ▶ ...                       │ │
│              │  └─────────────────────────────┘ │
└──────────────┴─────────────────────────────────┘
```

**State:**
- `allLeads = [lead1, lead2, lead3, ...]`
- `selectedLead = null` ← Nollställd!
- `isSearching = false`

**Visar:**
- Tillbaka till state 3️⃣
- LeadCard försvinner
- LeadList expanderar till full height
- Titel ändras tillbaka till "Lead Lista"

---

## 🎨 Visual States

### LeadList - Normal Mode
- **Titel:** "Lead Lista"
- **Max-height:** 800px
- **Border:** 2px slate-300
- **Items:** Full info (namn, org.nr, segment, stad, omsättning, change, triggers, score)

### LeadList - Compact Mode (när lead är valt)
- **Titel:** "Andra Leads"
- **Max-height:** 500px
- **Border:** 2px slate-300
- **Items:** Samma info, men mindre utrymme
- **Selected item:** Röd border-left + röd bakgrund

### LeadCard
- **3-kolumns layout**
- **Border-top:** 4px röd (#D40511)
- **Knappar:** Ny Analys, Rapportera, Redigera
- **Alla data:** Ekonomi, AI Säljanalys, Beslutsfattare

---

## 🔧 Implementation Details

### State Management

```typescript
const [allLeads, setAllLeads] = useState<Lead[]>([]);
const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
const [isSearching, setIsSearching] = useState(false);
```

### Key Functions

```typescript
// När sökning är klar
const handleSearch = async (params) => {
  setIsSearching(true);
  const leads = await fetchLeads(params);
  setAllLeads(leads);
  setSelectedLead(null); // Visa lista först!
  setIsSearching(false);
};

// När användare klickar på lead i lista
const handleLeadClick = (lead: Lead) => {
  setSelectedLead(lead); // Öppna LeadCard
};

// När användare klickar "Tillbaka till lista"
const handleBackToList = () => {
  setSelectedLead(null); // Stäng LeadCard
};
```

### Conditional Rendering

```typescript
{/* Welcome Screen */}
{!isSearching && allLeads.length === 0 && (
  <WelcomeScreen />
)}

{/* Loading */}
{isSearching && allLeads.length === 0 && (
  <LoadingSpinner />
)}

{/* Results */}
{allLeads.length > 0 && (
  <>
    {/* LeadCard (om vald) */}
    {selectedLead && (
      <div>
        <BackButton onClick={() => setSelectedLead(null)} />
        <ImprovedLeadCard lead={selectedLead} />
      </div>
    )}
    
    {/* LeadList (alltid synlig) */}
    <LeadList
      leads={allLeads}
      selectedLeadId={selectedLead?.id}
      onLeadClick={handleLeadClick}
      isCompact={!!selectedLead}
    />
  </>
)}
```

---

## 📊 Component Props

### LeadList Props

```typescript
interface LeadListProps {
  leads: Lead[];              // Alla leads att visa
  selectedLeadId?: string;    // ID på valt lead (för highlight)
  onLeadClick: (lead: Lead) => void;  // Callback när lead klickas
  isCompact?: boolean;        // true = kompakt läge (500px), false = full (800px)
}
```

### ImprovedLeadCard Props

```typescript
interface ImprovedLeadCardProps {
  lead: Lead;                 // Lead att visa
  onRefresh?: () => void;     // Callback för "Ny Analys"
  onReport?: () => void;      // Callback för "Rapportera"
  onEdit?: () => void;        // Callback för "Redigera"
}
```

### SearchPanel Props

```typescript
interface SearchPanelProps {
  onSearch: (params: SearchParams) => void;  // Callback när sökning körs
  isLoading?: boolean;        // true = visa loading state
}
```

---

## 🎯 User Experience Flow

1. **Användare öppnar sidan** → Ser welcome screen
2. **Användare fyller i sökpanel** → Väljer enstaka/batch, fyller i fält
3. **Användare klickar "Kör Protokoll"** → Ser loading spinner
4. **Sökning klar** → Ser lista med alla leads
5. **Användare klickar på ett lead** → LeadCard öppnas OVANFÖR listan
6. **Användare scrollar ner** → Ser andra leads i kompakt lista
7. **Användare klickar på annat lead** → LeadCard uppdateras, lista kvarstår
8. **Användare klickar "Tillbaka till lista"** → LeadCard stängs, lista expanderar
9. **Användare klickar "Ny Analys"** → Lead uppdateras, lista uppdateras
10. **Användare gör ny sökning** → Allt nollställs, ny lista visas

---

## ✅ Fördelar med denna Layout

### 1. Översikt först
- Användaren ser alla resultat innan de väljer
- Kan jämföra opportunity scores
- Kan se triggers och DHL-status

### 2. Kontext bevaras
- Listan försvinner aldrig helt
- Användaren ser alltid andra leads
- Enkelt att byta mellan leads

### 3. Effektiv navigation
- Sticky SearchPanel → alltid tillgänglig
- "Tillbaka till lista" → tydlig exit
- Klickbara leads i kompakt lista → snabb switch

### 4. Responsiv
- Fungerar på desktop (2-kolumns)
- Fungerar på tablet (stack)
- Fungerar på mobil (stack)

---

## 🎨 Färgkodning

### LeadList
- **Normal item:** Vit bakgrund, slate border
- **Hover item:** Ljusgrå bakgrund
- **Selected item:** Röd bakgrund (red-50), röd border-left (4px #D40511)

### Badges
- **Segment KAM:** Röd bakgrund, vit text
- **Segment FS:** Blå bakgrund, blå text
- **Segment TS:** Grön bakgrund, grön text
- **Segment DM:** Grå bakgrund, grå text
- **DHL Ja:** Grön checkmark
- **DHL Nej:** Röd X
- **Triggers:** Orange badge med antal

### Opportunity Score
- **80-100:** Röd text (🔥 KONTAKTA NU!)
- **60-79:** Orange text (⭐ Kontakta snart)
- **40-59:** Gul text (👀 Bevaka)
- **0-39:** Grå text (❌ Låg prioritet)

---

## 📝 Sammanfattning

**Layout-logik:**
1. ✅ SearchPanel alltid sticky (vänster)
2. ✅ LeadList visas efter sökning (höger, full height)
3. ✅ LeadCard öppnas OVANFÖR LeadList när lead klickas
4. ✅ LeadList blir kompakt (500px) när LeadCard är öppen
5. ✅ "Tillbaka till lista" stänger LeadCard, expanderar LeadList
6. ✅ Klick på annat lead i kompakt lista → byter selectedLead

**Komponenter:**
- ✅ `LeadSearchPage.tsx` - Main container med logik
- ✅ `SearchPanel.tsx` - Sökpanel (sticky)
- ✅ `LeadList.tsx` - Lista med leads (normal/kompakt)
- ✅ `ImprovedLeadCard.tsx` - Expanderat lead-kort (3-kolumns)

**Status:** ✅ **PRODUCTION-READY!**

Allt är implementerat och redo att användas! 🎊
