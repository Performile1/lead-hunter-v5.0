# Vercel Cache Clear Instructions

## Problem
Vercel serverar fortfarande gammal cached version av Dashboard.tsx trots att fixes finns i GitHub repo.

## Symptom
```
Uncaught TypeError: Cannot read properties of undefined (reading 'reduce')
```

## Root Cause
- Dashboard.tsx fix finns i commit `84d2671`
- Vercel cachar den gamla build-versionen
- Flera version bumps har inte hjälpt

## Solution: Manual Cache Clear

### Steg 1: Gå till Vercel Dashboard
1. Öppna https://vercel.com/dashboard
2. Logga in med ditt konto
3. Hitta projektet **lead-hunter-v5-0**

### Steg 2: Gå till Deployments
1. Klicka på projektet
2. Klicka på **"Deployments"** i sidomenyn
3. Hitta den senaste deployment (version 5.0.2, commit `3ad6003`)

### Steg 3: Redeploy med Cache Clear
1. Klicka på **"..."** (tre prickar) på senaste deployment
2. Välj **"Redeploy"**
3. **VIKTIGT:** Bocka i **"Clear cache and redeploy"**
4. Klicka på **"Redeploy"**

### Steg 4: Vänta på Build
- Builden tar ~2-3 minuter
- Du kan följa progress i Vercel Dashboard
- När den är klar, se till att status är **"Ready"**

### Steg 5: Testa
1. Öppna https://lead-hunter-v5-0.vercel.app
2. **Hårt ladda om sidan:** `Ctrl + Shift + R` (Windows) eller `Cmd + Shift + R` (Mac)
3. Öppna Console (F12)
4. Du ska **INTE** se TypeError längre

## Förväntat Resultat

### Före Cache Clear
```
❌ TypeError: Cannot read properties of undefined (reading 'reduce')
❌ index-DpKnB2WR.js (gammal cached version)
❌ Vit skärm/krasch
```

### Efter Cache Clear
```
✅ Ingen TypeError
✅ index-[NEW_HASH].js (ny version)
✅ Dashboard laddar korrekt
✅ Session restored
```

## Alternativ Lösning (Om Redeploy inte fungerar)

### Option A: Manuell Build Trigger
1. Gå till **Settings → Git**
2. Klicka på **"Disconnect"** (koppla bort GitHub)
3. Klicka på **"Connect"** (koppla tillbaka GitHub)
4. Detta tvingar en helt ny deployment

### Option B: Lokal Build Test
```bash
# Testa att builden fungerar lokalt
cd c:\Users\A\Downloads\lead-hunter-v5.0
npm run build

# Kolla att dist/index.html innehåller rätt filer
ls dist/

# Testa preview
npm run preview
```

Om lokal build fungerar men Vercel inte, är det definitivt ett cache-problem.

## Verifiering

Efter cache clear, kör dessa kommandon i browser console:

```javascript
// Kolla att Dashboard har rätt kod
console.log(Dashboard.toString().includes('safeLeads'));
// Ska returnera: true

// Kolla att leads har default value
console.log(Dashboard.toString().includes('leads = []'));
// Ska returnera: true
```

## Support

Om problemet kvarstår efter cache clear:
1. Kontakta Vercel support
2. Eller överväg att skapa ett nytt Vercel-projekt från scratch
3. Eller deploya till annan plattform (Netlify, Railway, etc.)

---

**Skapad:** 2025-12-20 19:40  
**Version:** 5.0.2  
**Commit:** 3ad6003
