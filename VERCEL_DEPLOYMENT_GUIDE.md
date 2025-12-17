# 🚀 Vercel Deployment Guide - Lead Hunter v5.0

**Syfte:** Automatisk deployment enligt protokoll (inga manuella knappar)  
**Målgrupp:** Utvecklingsteam  
**Version:** 5.0  
**Datum:** 2025-12-17

---

## 🎯 **PROTOKOLL: Automatisk deployment**

### **Våra regler:**
- ✅ Allt ska vara automatiskt
- ✅ Allt ska vara konfigurerat i kod eller Vercel
- ✅ Inga manuella steg i UI
- ✅ Inga knappar att klicka

---

## 📋 **STEG 1: Lägg till API-nycklar i Vercel (EN GÅNG)**

### **1.1 Logga in på Vercel**
```
https://vercel.com/dashboard
```

### **1.2 Välj projekt**
- Klicka på: `lead-hunter-v5.0`

### **1.3 Gå till Environment Variables**
- Settings → Environment Variables

### **1.4 Lägg till KRITISKA variabler**

**Lägg till följande (EN GÅNG):**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_GEMINI_API_KEY` | `AIzaSy...` | ✅ Production, ✅ Preview, ❌ Development |
| `VITE_GROQ_API_KEY` | `gsk_...` | ✅ Production, ✅ Preview, ❌ Development |
| `VITE_FIRECRAWL_API_KEY` | `fc-0fe3e552a23248159a621397d9a29b1b` | ✅ Production, ✅ Preview, ❌ Development |

**Viktigt:**
- ✅ Välj **Production** och **Preview**
- ❌ Välj INTE **Development** (använd lokal `.env`)

### **1.5 Lägg till REKOMMENDERADE variabler (valfritt)**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_DEEPSEEK_API_KEY` | `din_nyckel` | ✅ Production, ✅ Preview |
| `VITE_ALGOLIA_APP_ID` | `din_app_id` | ✅ Production, ✅ Preview |
| `VITE_ALGOLIA_API_KEY` | `din_nyckel` | ✅ Production, ✅ Preview |
| `VITE_ALGOLIA_INDEX_NAME` | `leads` | ✅ Production, ✅ Preview |
| `VITE_NEWS_API_KEY` | `din_nyckel` | ✅ Production, ✅ Preview |

### **1.6 Första deployment**
- Klicka **Redeploy** efter att ha lagt till variabler
- Vänta på deployment (1-2 min)

---

## 🔄 **STEG 2: Automatisk deployment (varje git push)**

### **2.1 Hur det fungerar:**

```bash
# Lokal utveckling
git add .
git commit -m "Din commit-message"
git push origin master

# Vercel gör automatiskt:
# 1. Detekterar push till master
# 2. Bygger projektet
# 3. Kör tester (om konfigurerade)
# 4. Deployar till production
# 5. Skickar notifikation
```

### **2.2 Deployment-flöde:**

```
git push → GitHub → Vercel Webhook → Build → Deploy → Live
```

**Tid:** ~2-3 minuter per deployment

### **2.3 Deployment-status:**

**Se status:**
- Gå till: https://vercel.com/dashboard
- Klicka på projektet
- Se **Deployments**-tab

**Status-ikoner:**
- 🟢 **Ready** - Deployment lyckades
- 🟡 **Building** - Bygger just nu
- 🔴 **Error** - Deployment misslyckades

---

## 📊 **STEG 3: Verifiera deployment**

### **3.1 Kontrollera production URL:**

```
https://your-app.vercel.app
```

### **3.2 Verifiera API-nycklar i production:**

**Öppna browser console (F12):**
```javascript
// Ska visa början av nyckeln
console.log('Gemini:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...');
console.log('Groq:', import.meta.env.VITE_GROQ_API_KEY?.substring(0, 10) + '...');
console.log('Firecrawl:', import.meta.env.VITE_FIRECRAWL_API_KEY?.substring(0, 10) + '...');
```

**Förväntat resultat:**
```
Gemini: AIzaSy...
Groq: gsk_...
Firecrawl: fc-0fe3e55...
```

### **3.3 Testa funktionalitet:**

1. Logga in som Super Admin
2. Sök efter ett lead
3. Verifiera att AI-analys fungerar
4. Kontrollera att Firecrawl-data hämtas

---

## 🔧 **STEG 4: Lokal utveckling**

### **4.1 Lokal .env (root):**

```env
# === KRITISKA API-NYCKLAR ===
VITE_GEMINI_API_KEY=AIzaSy...din_nyckel_här
VITE_GROQ_API_KEY=gsk_...din_nyckel_här
VITE_FIRECRAWL_API_KEY=fc-0fe3e552a23248159a621397d9a29b1b

# === REKOMMENDERADE ===
VITE_DEEPSEEK_API_KEY=din_deepseek_nyckel_här
VITE_ALGOLIA_APP_ID=din_algolia_app_id
VITE_ALGOLIA_API_KEY=din_algolia_nyckel
VITE_ALGOLIA_INDEX_NAME=leads
```

### **4.2 Starta lokal server:**

```bash
npm run dev
```

### **4.3 Testa lokalt:**

```
http://localhost:5173
```

---

## 🚨 **FELSÖKNING**

### **Problem: Deployment misslyckades**

**Lösning:**
1. Gå till Vercel Dashboard → Deployments
2. Klicka på misslyckad deployment
3. Se **Build Logs**
4. Fixa felet lokalt
5. Push igen

**Vanliga fel:**
- TypeScript-fel
- Missing dependencies
- Build timeout (öka i Vercel settings)

### **Problem: API-nycklar fungerar inte i production**

**Lösning:**
1. Kontrollera att nyckeln finns i Vercel Environment Variables
2. Kontrollera att Environment är satt till "Production"
3. Redeploy projektet
4. Vänta 1-2 minuter
5. Hard refresh i browser (Ctrl+Shift+R)

### **Problem: "VITE_* is undefined" i production**

**Lösning:**
1. Kontrollera att variabeln har `VITE_` prefix
2. Kontrollera att variabeln finns i Vercel
3. Redeploy
4. Rensa browser cache

---

## 📋 **CHECKLISTA**

### **Initial setup (EN GÅNG):**

- [ ] Logga in på Vercel
- [ ] Välj projekt: `lead-hunter-v5.0`
- [ ] Lägg till `VITE_GEMINI_API_KEY` i Environment Variables
- [ ] Lägg till `VITE_GROQ_API_KEY` i Environment Variables
- [ ] Lägg till `VITE_FIRECRAWL_API_KEY` i Environment Variables
- [ ] Välj Environment: Production + Preview
- [ ] Klicka Redeploy
- [ ] Vänta på deployment (1-2 min)
- [ ] Verifiera i production URL
- [ ] Testa funktionalitet

### **Varje deployment (automatiskt):**

- [ ] Gör ändringar lokalt
- [ ] Testa lokalt (`npm run dev`)
- [ ] Commit: `git commit -m "message"`
- [ ] Push: `git push origin master`
- [ ] Vercel deployar automatiskt (2-3 min)
- [ ] Verifiera i production URL

---

## 🎯 **SAMMANFATTNING**

### **Vad som är automatiskt:**
- ✅ Deployment vid varje git push
- ✅ Build process
- ✅ Environment variables injection
- ✅ Production URL update
- ✅ Notifikationer

### **Vad som är manuellt (EN GÅNG):**
- ⚠️ Lägg till API-nycklar i Vercel (första gången)
- ⚠️ Konfigurera projekt-inställningar (första gången)

### **Vad som ALDRIG är manuellt:**
- ❌ Deployment-process
- ❌ Build-process
- ❌ Environment variables per deployment
- ❌ API-nyckel-hantering i UI

---

## 💡 **TIPS**

### **Preview Deployments:**
- Varje branch får automatiskt en preview URL
- Testa ändringar innan merge till master
- Preview URL: `https://lead-hunter-v5-0-git-branch-name.vercel.app`

### **Rollbacks:**
- Gå till Vercel Dashboard → Deployments
- Klicka på tidigare deployment
- Klicka "Promote to Production"
- Instant rollback (ingen ny build)

### **Custom Domain:**
- Gå till Settings → Domains
- Lägg till din domän
- Följ DNS-instruktioner
- Automatisk HTTPS

---

**Version:** 5.0  
**Status:** Protokoll-compliant deployment guide  
**Nästa steg:** Lägg till API-nycklar i Vercel (EN GÅNG)

