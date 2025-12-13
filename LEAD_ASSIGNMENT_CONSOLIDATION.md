# 🔄 LeadAssignment Konsolidering - Analys

## 📋 Nuvarande Situation

### 3 Separata LeadAssignment-komponenter:

1. **`src/components/admin/LeadAssignment.tsx`** (3.7 KB)
   - För admins
   - Tilldela leads till alla användare i tenant
   - Bulk assignment
   - Filter per roll

2. **`src/components/terminal/LeadAssignment.tsx`** (12.5 KB)
   - För terminalchefer
   - Tilldela leads till säljare på sin terminal
   - Begränsad till terminal-scope
   - Mer detaljerad vy

3. **`src/components/managers/TeamView.tsx`** (7.6 KB)
   - För managers
   - Innehåller assignment-logik för team
   - Integrerad med team-översikt

---

## 🤔 Vad Händer Om Vi Slår Ihop Dem?

### ✅ Fördelar

1. **Mindre Kodduplicering**
   - En komponent istället för tre
   - Enklare att underhålla
   - Bugfixar behöver bara göras en gång

2. **Konsekvent UX**
   - Samma gränssnitt för alla roller
   - Enklare för användare att lära sig
   - Mindre förvirring

3. **Enklare Testing**
   - En komponent att testa
   - Färre edge cases
   - Bättre test coverage

4. **Lättare att Lägga Till Features**
   - Nya features blir tillgängliga för alla roller automatiskt
   - Mindre risk för feature-divergens

### ❌ Nackdelar

1. **Ökad Komplexitet**
   - En komponent med många conditional renders
   - Svårare att förstå koden
   - Mer if/else-logik

2. **Performance**
   - Laddar potentiellt mer data än nödvändigt
   - Större bundle size
   - Mer props att hantera

3. **Risk för Regression**
   - Ändringar för en roll kan påverka andra
   - Svårare att isolera buggar
   - Mer omfattande testing krävs

4. **Mindre Flexibilitet**
   - Svårare att göra roll-specifika anpassningar
   - Kan bli för generisk
   - Risk för "one size fits none"

---

## 🎯 Rekommendation: BEHÅLL SEPARATA

### Varför?

**1. Olika Use Cases**
- **Admin:** Ser hela tenant, behöver bulk operations
- **Terminal Manager:** Ser endast sin terminal, behöver lokal vy
- **Manager:** Ser endast sitt team, integrerat med team-översikt

**2. Olika Data Scope**
```javascript
// Admin
const users = await fetch('/api/users'); // Alla users
const leads = await fetch('/api/leads'); // Alla leads

// Terminal Manager
const users = await fetch('/api/users?terminal=X'); // Terminal users
const leads = await fetch('/api/leads?terminal=X'); // Terminal leads

// Manager
const users = await fetch('/api/users?team=Y'); // Team users
const leads = await fetch('/api/leads?team=Y'); // Team leads
```

**3. Olika UI Behov**
- Admin behöver filter per tenant, subscription tier, etc.
- Terminal Manager behöver geografisk vy, postnummer-filter
- Manager behöver team-hierarki, prestanda-metrics

---

## 💡 Alternativ Lösning: Shared Components

Istället för att slå ihop allt, **dela upp i återanvändbara delar**:

### Skapa Shared Components:

```
src/components/common/
├── LeadAssignmentTable.tsx      # Tabell för leads
├── UserSelector.tsx              # Dropdown för användare
├── BulkAssignmentModal.tsx      # Modal för bulk assignment
└── AssignmentHistory.tsx        # Historik över assignments
```

### Använd i Varje Roll-Specifik Komponent:

```tsx
// Admin version
import { LeadAssignmentTable, UserSelector, BulkAssignmentModal } from '../common';

export const AdminLeadAssignment = () => {
  const users = useUsers({ scope: 'all' });
  const leads = useLeads({ scope: 'all' });
  
  return (
    <div>
      <AdminFilters />
      <LeadAssignmentTable leads={leads} users={users} />
      <BulkAssignmentModal />
    </div>
  );
};

// Terminal version
export const TerminalLeadAssignment = () => {
  const users = useUsers({ scope: 'terminal' });
  const leads = useLeads({ scope: 'terminal' });
  
  return (
    <div>
      <TerminalMap />
      <LeadAssignmentTable leads={leads} users={users} />
    </div>
  );
};
```

---

## 📊 Jämförelse

| Aspekt | Separata | Unified | Shared Components |
|--------|----------|---------|-------------------|
| Kodduplicering | Hög | Låg | Medel |
| Komplexitet | Låg | Hög | Medel |
| Flexibilitet | Hög | Låg | Hög |
| Underhåll | Svårt | Lätt | Medel |
| Performance | Bra | OK | Bra |
| Testing | Svårt | Medel | Lätt |
| **Rekommendation** | ❌ | ❌ | ✅ |

---

## 🚀 Implementation Plan (Om Shared Components)

### Fas 1: Identifiera Gemensamma Delar
- [ ] Lead table rendering
- [ ] User selection logic
- [ ] Assignment API calls
- [ ] Success/error handling

### Fas 2: Skapa Shared Components
- [ ] `LeadAssignmentTable.tsx`
- [ ] `UserSelector.tsx`
- [ ] `BulkAssignmentModal.tsx`
- [ ] `AssignmentHistory.tsx`

### Fas 3: Refactor Befintliga Komponenter
- [ ] Admin: Använd shared components
- [ ] Terminal: Använd shared components
- [ ] Manager: Använd shared components

### Fas 4: Testing
- [ ] Unit tests för shared components
- [ ] Integration tests för varje roll
- [ ] E2E tests

### Fas 5: Cleanup
- [ ] Ta bort duplicerad kod
- [ ] Uppdatera dokumentation
- [ ] Performance audit

---

## ✅ Slutsats

**REKOMMENDATION:** Behåll separata komponenter men **skapa shared components** för gemensam funktionalitet.

**Fördelar:**
- ✅ Behåller flexibilitet per roll
- ✅ Minskar kodduplicering där det är meningsfullt
- ✅ Enklare att testa
- ✅ Bättre performance
- ✅ Lättare att underhålla

**Nästa Steg:**
1. Identifiera exakt vilka delar som är gemensamma
2. Skapa shared components
3. Refactor en komponent i taget
4. Testa grundligt
5. Deploy

**Estimerad Tid:** 2-3 dagar
**Risk:** Låg (inkrementell approach)
**ROI:** Hög (mindre underhåll framöver)
