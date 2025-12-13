# 🎨 Färgsystem - Multi-Tenant Lead Hunter

## Översikt

Systemet använder **två typer av färger**:
1. **Tenant-specifika färger** - Ändras baserat på vilket företag som loggar in
2. **Standard UI-färger** - Alltid samma, oavsett tenant

---

## 🏢 Tenant-Specifika Färger

Dessa färger ändras dynamiskt baserat på tenant:

### CSS-Variabler
```css
--tenant-primary: #D40511    /* Huvudfärg (DHL Röd) */
--tenant-secondary: #FFCC00  /* Sekundärfärg (DHL Gul) */
```

### Användning
- **Primary:** Knappar, headers, accenter, fokus-states
- **Secondary:** Bakgrunder, highlights, dekorativa element

### Exempel på Tenants
- **DHL Freight:** Röd (#D40511) + Gul (#FFCC00)
- **DHL Express:** Gul (#FFCC00) + Röd (#D40511) (omvänt)
- **PostNord:** Blå + Gul
- **Bring:** Grön + Vit
- **Schenker:** Röd + Svart

### Hur det fungerar
1. När användare loggar in på en subdomän (t.ex. `dhl-sweden.leadhunter.com`)
2. Frontend hämtar tenant-info från backend
3. CSS-variabler uppdateras dynamiskt:
```javascript
document.documentElement.style.setProperty('--tenant-primary', '#D40511');
document.documentElement.style.setProperty('--tenant-secondary', '#FFCC00');
```

---

## 🎯 Standard UI-Färger

Dessa färger är **alltid samma** oavsett tenant:

### Grön - Success/Klar ✅
```css
--ui-success: #10B981
```
**Användning:**
- Bekräftelser
- Slutförda uppgifter
- Positiva meddelanden
- "Klar"-knappar
- Framgångsindikatorer

**Exempel:**
- "Lead sparat!"
- "Användare skapad"
- Status: Aktiv
- Checkboxar (checked)

---

### Röd - Error/Fel ❌
```css
--ui-error: #EF4444
```
**Användning:**
- Felmeddelanden
- Kritiska varningar
- Raderingsknappar
- Valideringsfel
- Negativa indikatorer

**Exempel:**
- "Ogiltigt lösenord"
- "Radera användare"
- Status: Inaktiv
- Formulärfel

---

### Orange - Warning/Varning ⚠️
```css
--ui-warning: #F59E0B
```
**Användning:**
- Varningar
- Uppmärksamhet krävs
- Pending-status
- Viktiga meddelanden

**Exempel:**
- "Kontot löper ut snart"
- "Bekräfta åtgärd"
- Status: Pending
- Quota-varningar

---

### Svart/Grå - Text 📝
```css
--ui-text: #1F2937           /* Primär text */
--ui-text-secondary: #6B7280 /* Sekundär text */
```
**Användning:**
- All text-innehåll
- Rubriker
- Beskrivningar
- Labels

---

## 📋 Användningsexempel

### HTML/JSX med Tailwind
```jsx
{/* Tenant-specifik knapp */}
<button className="bg-[#D40511] hover:bg-[#a0040d] text-white">
  Primär Åtgärd
</button>

{/* Success-knapp (alltid grön) */}
<button className="bg-success hover:bg-success-hover text-white">
  Spara
</button>

{/* Error-knapp (alltid röd) */}
<button className="bg-error hover:bg-error-hover text-white">
  Radera
</button>

{/* Warning-badge (alltid orange) */}
<span className="bg-warning text-white px-2 py-1 rounded">
  Varning
</span>

{/* Success-meddelande */}
<div className="bg-success/10 border-l-4 border-success p-4">
  <p className="text-success">✅ Åtgärden lyckades!</p>
</div>

{/* Error-meddelande */}
<div className="bg-error/10 border-l-4 border-error p-4">
  <p className="text-error">❌ Ett fel uppstod</p>
</div>
```

### Med CSS-klasser
```jsx
{/* Använd CSS-variabler direkt */}
<div style={{ backgroundColor: 'var(--tenant-primary)' }}>
  Tenant-specifik bakgrund
</div>

<div className="bg-success">
  Alltid grön bakgrund
</div>
```

---

## 🎨 Färgpalett - Komplett

### Tenant-Specifika
| Färg | Variabel | Standard | Användning |
|------|----------|----------|------------|
| Primary | `--tenant-primary` | #D40511 | Huvudfärg, knappar, headers |
| Secondary | `--tenant-secondary` | #FFCC00 | Accenter, highlights |
| Primary Hover | `--tenant-primary-hover` | #A0040D | Hover-state för primary |
| Secondary Hover | `--tenant-secondary-hover` | #E6B800 | Hover-state för secondary |

### Standard UI
| Färg | Variabel | Hex | Användning |
|------|----------|-----|------------|
| Success | `--ui-success` | #10B981 | Klar, bekräftat, positivt |
| Error | `--ui-error` | #EF4444 | Fel, radering, negativt |
| Warning | `--ui-warning` | #F59E0B | Varning, uppmärksamhet |
| Info | `--ui-info` | #3B82F6 | Information, neutral |
| Text | `--ui-text` | #1F2937 | Primär text |
| Text Secondary | `--ui-text-secondary` | #6B7280 | Sekundär text |
| Border | `--ui-border` | #D1D5DB | Ramar, dividers |
| Background | `--ui-background` | #F9FAFB | Sidbackgrund |
| White | `--ui-white` | #FFFFFF | Kort, modaler |

---

## 🔧 Implementation

### 1. CSS-fil
Alla färger definieras i: `src/styles/tenant-theme.css`

### 2. Dynamisk uppdatering
När tenant detekteras:
```javascript
// I LoginPage.tsx eller App.tsx
useEffect(() => {
  if (tenantInfo) {
    document.documentElement.style.setProperty(
      '--tenant-primary', 
      tenantInfo.primaryColor
    );
    document.documentElement.style.setProperty(
      '--tenant-secondary', 
      tenantInfo.secondaryColor
    );
  }
}, [tenantInfo]);
```

### 3. Tailwind Config
Lägg till i `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'tenant-primary': 'var(--tenant-primary)',
        'tenant-secondary': 'var(--tenant-secondary)',
        'success': 'var(--ui-success)',
        'error': 'var(--ui-error)',
        'warning': 'var(--ui-warning)',
        'info': 'var(--ui-info)',
      }
    }
  }
}
```

---

## ✅ Best Practices

### DO ✅
- Använd tenant-färger för branding (headers, knappar, logo)
- Använd standard UI-färger för feedback (success, error, warning)
- Behåll samma layout och struktur för alla tenants
- Testa med olika tenant-färger för kontrast

### DON'T ❌
- Ändra inte standard UI-färger baserat på tenant
- Blanda inte tenant-färger med UI-feedback-färger
- Hårdkoda inte färger i komponenter
- Ändra inte layout baserat på tenant

---

## 🧪 Testning

### Testa med olika tenants:
```bash
# DHL Freight (Röd + Gul)
http://localhost:5173

# DHL Express (Gul + Röd)
# Ändra tenant-färger i databasen och testa

# PostNord (Blå + Gul)
# Skapa tenant med andra färger
```

### Verifiera att:
- ✅ Success-meddelanden är alltid gröna
- ✅ Error-meddelanden är alltid röda
- ✅ Warning-badges är alltid orange
- ✅ Tenant-knappar använder tenant-färger
- ✅ Layout är identisk för alla tenants

---

## 📝 Sammanfattning

**Princip:** 
- **Layout = Fast** (samma för alla)
- **Tenant-färger = Dynamiska** (ändras per tenant)
- **UI-färger = Fasta** (alltid samma betydelse)

Detta ger ett konsekvent användargränssnitt där användare alltid vet att:
- Grönt = Bra/Klar
- Rött = Fel/Varning
- Orange = Uppmärksamhet
- Tenant-färger = Företagets identitet
