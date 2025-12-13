# 🎨 DHL Corporate Identity Guide

## 🎯 Officiella DHL Färger

### Primära Färger

#### DHL Red (Huvudfärg)
```css
/* Officiell DHL Röd */
--dhl-red: #D40511;
--dhl-red-rgb: 212, 5, 17;

/* Användning */
background-color: #D40511;
color: #D40511;
```

#### DHL Yellow (Sekundär)
```css
/* Officiell DHL Gul */
--dhl-yellow: #FFCC00;
--dhl-yellow-rgb: 255, 204, 0;

/* Användning */
background-color: #FFCC00;
color: #FFCC00;
```

### Sekundära Färger

#### Grå-skala
```css
--dhl-black: #000000;
--dhl-dark-gray: #333333;
--dhl-medium-gray: #666666;
--dhl-light-gray: #CCCCCC;
--dhl-white: #FFFFFF;
```

### Accent-färger (För digitala gränssnitt)

```css
/* Success */
--dhl-green: #00A651;

/* Warning */
--dhl-orange: #FF6600;

/* Info */
--dhl-blue: #0066CC;

/* Error (använd DHL Red) */
--dhl-error: #D40511;
```

---

## 📐 Typografi

### Officiell Font: Delivery

**DHL använder sin egen font "Delivery"**

#### Fallback Web Fonts:
```css
/* Primär (om Delivery inte finns) */
font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;

/* Alternativ */
font-family: 'Open Sans', 'Roboto', sans-serif;
```

#### Font-storlekar
```css
/* Headings */
--font-size-h1: 48px;
--font-size-h2: 36px;
--font-size-h3: 28px;
--font-size-h4: 24px;
--font-size-h5: 20px;
--font-size-h6: 18px;

/* Body */
--font-size-base: 16px;
--font-size-small: 14px;
--font-size-xs: 12px;

/* Line height */
--line-height-base: 1.5;
--line-height-heading: 1.2;
```

---

## 🎨 Design System

### Spacing
```css
/* DHL använder 8px grid system */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

### Border Radius
```css
/* DHL föredrar skarpa hörn eller subtila rundningar */
--radius-none: 0px;
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 8px;
--radius-full: 9999px; /* För pills/badges */
```

### Shadows
```css
/* Subtila skuggor */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## 🖼️ Logo-användning

### DHL Logo Regler

#### Clearspace
- Minst 1x logotypens höjd runt logon
- Aldrig placera text eller element inom clearspace

#### Minsta storlek
- Digital: 120px bredd
- Print: 25mm bredd

#### Färgvarianter
1. **Primär**: Röd text på gul bakgrund
2. **Inverterad**: Vit text på röd bakgrund
3. **Svart-vit**: Svart text på vit bakgrund

#### Förbjudet
- ❌ Ändra färger
- ❌ Rotera logon
- ❌ Lägg till effekter
- ❌ Ändra proportioner
- ❌ Placera på komplexa bakgrunder

---

## 🎨 Tailwind Config för DHL

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        dhl: {
          red: '#D40511',
          yellow: '#FFCC00',
          black: '#000000',
          'dark-gray': '#333333',
          'medium-gray': '#666666',
          'light-gray': '#CCCCCC',
          white: '#FFFFFF',
          green: '#00A651',
          orange: '#FF6600',
          blue: '#0066CC',
        }
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
      }
    }
  }
}
```

---

## 🎨 CSS Variables

```css
/* styles/dhl-theme.css */
:root {
  /* Primära färger */
  --dhl-red: #D40511;
  --dhl-yellow: #FFCC00;
  
  /* Grå-skala */
  --dhl-black: #000000;
  --dhl-dark-gray: #333333;
  --dhl-medium-gray: #666666;
  --dhl-light-gray: #CCCCCC;
  --dhl-white: #FFFFFF;
  
  /* Accent */
  --dhl-green: #00A651;
  --dhl-orange: #FF6600;
  --dhl-blue: #0066CC;
  
  /* Typografi */
  --font-family-base: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-size-base: 16px;
  --line-height-base: 1.5;
  
  /* Spacing */
  --spacing-unit: 8px;
  
  /* Transitions */
  --transition-base: 150ms ease-in-out;
}
```

---

## 🎨 Komponent-exempel

### Primary Button (DHL Style)
```tsx
<button className="
  bg-dhl-red 
  text-white 
  px-6 py-3 
  font-semibold 
  uppercase 
  tracking-wide
  hover:bg-opacity-90
  transition-all
  border-none
  rounded-none
">
  Sök Leads
</button>
```

### Secondary Button
```tsx
<button className="
  bg-dhl-yellow 
  text-dhl-black 
  px-6 py-3 
  font-semibold 
  uppercase 
  tracking-wide
  hover:bg-opacity-90
  transition-all
  border-none
  rounded-none
">
  Avbryt
</button>
```

### Header
```tsx
<header className="
  bg-dhl-red 
  text-white 
  py-4 
  px-6
  shadow-md
">
  <div className="flex items-center justify-between">
    <img src="/dhl-logo.svg" alt="DHL" className="h-12" />
    <h1 className="text-2xl font-bold uppercase tracking-wide">
      Lead Hunter
    </h1>
  </div>
</header>
```

### Card
```tsx
<div className="
  bg-white 
  border-l-4 
  border-dhl-red 
  shadow-md 
  p-6
  hover:shadow-lg
  transition-shadow
">
  <h3 className="text-dhl-red font-bold text-xl mb-2">
    Företag AB
  </h3>
  <p className="text-dhl-dark-gray">
    Innehåll här...
  </p>
</div>
```

### Badge/Tag
```tsx
<span className="
  inline-block
  bg-dhl-yellow 
  text-dhl-black 
  px-3 py-1 
  text-xs 
  font-bold 
  uppercase
  rounded-full
">
  KAM
</span>
```

---

## 📱 Responsive Design

### Breakpoints (DHL Standard)
```css
/* Mobile first */
--breakpoint-sm: 640px;   /* Tablet */
--breakpoint-md: 768px;   /* Tablet landscape */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

---

## ✅ DHL Design Checklist

### Färger
- [ ] Använd DHL Red (#D40511) för primära actions
- [ ] Använd DHL Yellow (#FFCC00) för sekundära actions
- [ ] Använd grå-skala för text och bakgrunder
- [ ] Undvik andra färger (förutom status-färger)

### Typografi
- [ ] Använd Helvetica Neue eller Arial
- [ ] Använd uppercase för viktiga rubriker
- [ ] Använd bold för emphasis
- [ ] Håll line-height på 1.5 för läsbarhet

### Layout
- [ ] Använd 8px grid system
- [ ] Ge tillräckligt whitespace
- [ ] Håll content inom max-width (1280px)
- [ ] Använd konsekvent spacing

### Komponenter
- [ ] Skarpa hörn eller subtila rundningar (max 4px)
- [ ] Subtila skuggor
- [ ] Tydliga hover-states
- [ ] Snabba transitions (150ms)

### Logo
- [ ] Respektera clearspace
- [ ] Använd korrekt storlek (min 120px)
- [ ] Använd korrekt färgvariant
- [ ] Aldrig modifiera logon

---

## 🎨 Exempel: DHL-Themed Components

### Navigation
```tsx
<nav className="bg-dhl-red text-white">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      <img src="/dhl-logo-white.svg" alt="DHL" className="h-10" />
      <div className="flex gap-6">
        <a href="#" className="hover:text-dhl-yellow transition-colors uppercase font-semibold">
          Dashboard
        </a>
        <a href="#" className="hover:text-dhl-yellow transition-colors uppercase font-semibold">
          Leads
        </a>
        <a href="#" className="hover:text-dhl-yellow transition-colors uppercase font-semibold">
          Admin
        </a>
      </div>
    </div>
  </div>
</nav>
```

### Alert/Notification
```tsx
{/* Success */}
<div className="bg-dhl-green text-white p-4 border-l-4 border-dhl-yellow">
  <p className="font-semibold">✓ Lead skapad framgångsrikt</p>
</div>

{/* Error */}
<div className="bg-dhl-red text-white p-4 border-l-4 border-dhl-yellow">
  <p className="font-semibold">✗ Ett fel uppstod</p>
</div>

{/* Warning */}
<div className="bg-dhl-orange text-white p-4 border-l-4 border-dhl-yellow">
  <p className="font-semibold">⚠ Varning: Kontrollera data</p>
</div>
```

### Table
```tsx
<table className="w-full">
  <thead className="bg-dhl-red text-white">
    <tr>
      <th className="px-4 py-3 text-left uppercase font-bold">Företag</th>
      <th className="px-4 py-3 text-left uppercase font-bold">Segment</th>
      <th className="px-4 py-3 text-left uppercase font-bold">Omsättning</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3">Test AB</td>
      <td className="px-4 py-3">
        <span className="bg-dhl-yellow text-dhl-black px-2 py-1 rounded-full text-xs font-bold">
          KAM
        </span>
      </td>
      <td className="px-4 py-3">50 MSEK</td>
    </tr>
  </tbody>
</table>
```

---

## 🎯 Implementation Plan

### Fas 1: Grundläggande Färger ✅
- [ ] Uppdatera Tailwind config
- [ ] Skapa CSS variables
- [ ] Uppdatera primära knappar
- [ ] Uppdatera header/navigation

### Fas 2: Komponenter ✅
- [ ] Uppdatera alla knappar
- [ ] Uppdatera cards
- [ ] Uppdatera badges/tags
- [ ] Uppdatera tabeller

### Fas 3: Typografi ✅
- [ ] Implementera Helvetica Neue
- [ ] Uppdatera font-storlekar
- [ ] Uppdatera headings
- [ ] Uppercase för viktiga element

### Fas 4: Layout ✅
- [ ] Implementera 8px grid
- [ ] Uppdatera spacing
- [ ] Uppdatera border-radius
- [ ] Uppdatera shadows

### Fas 5: Logo & Branding ✅
- [ ] Lägg till DHL logo
- [ ] Respektera clearspace
- [ ] Korrekt storlek
- [ ] Färgvarianter

---

## 📚 Resurser

### Officiella DHL Brand Guidelines
- DHL Corporate Design Manual
- DHL Logo Downloads
- DHL Color Palette
- DHL Typography Guidelines

### Web Resources
- DHL Group Website: https://www.dhl.com
- DHL Brand Portal (intern)
- DHL Design System (intern)

---

## 🎉 Sammanfattning

### DHL Corporate Identity Nyckelpunkter:

1. **Färger**
   - Primär: DHL Red (#D40511)
   - Sekundär: DHL Yellow (#FFCC00)
   - Grå-skala för text

2. **Typografi**
   - Helvetica Neue / Arial
   - Uppercase för rubriker
   - Bold för emphasis

3. **Design**
   - 8px grid system
   - Skarpa eller subtila hörn
   - Subtila skuggor
   - Tydliga hover-states

4. **Logo**
   - Respektera clearspace
   - Min 120px bredd
   - Aldrig modifiera

**Implementera detta för konsekvent DHL-branding!** 🚚
