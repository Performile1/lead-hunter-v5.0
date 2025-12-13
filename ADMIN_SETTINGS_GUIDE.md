# Admin Settings Guide - Systeminställningar

## 🎨 ÖVERSIKT

AdminSettings är en kraftfull komponent för att anpassa DHL Lead Hunter's utseende och branding. Admin-användare kan ändra färgschema, anpassa login-text och ladda upp egen logotyp.

---

## 📍 ÅTKOMST

**Var:** Header → Verktyg-menyn → "Systeminställningar"

**Behörighet:** Endast **ADMIN**-användare

**Ikon:** ⚙️ Settings med röd "ADMIN"-badge

---

## 🎨 FÄRGSCHEMA

### Fördefinierade Teman

**1. DHL Standard** (Default)
- Primary: `#D40511` (DHL Röd)
- Secondary: `#FFCC00` (DHL Gul)
- Accent: `#000000` (Svart)
- Background: `#FFFFFF` (Vit)
- Text: `#1F2937` (Mörkgrå)

**2. Mörkt Tema**
- Primary: `#D40511` (DHL Röd)
- Secondary: `#FFCC00` (DHL Gul)
- Accent: `#1F2937` (Mörkgrå)
- Background: `#111827` (Nästan svart)
- Text: `#F9FAFB` (Ljusgrå)

**3. Ljust Tema**
- Primary: `#3B82F6` (Blå)
- Secondary: `#60A5FA` (Ljusblå)
- Accent: `#1E40AF` (Mörkblå)
- Background: `#F9FAFB` (Ljusgrå)
- Text: `#111827` (Mörkgrå)

**4. Custom** (Anpassat)
- Välj egna färger för alla komponenter
- Färgväljare + hex-input
- Full kontroll över varje färg

### Hur Ändra Färgschema

1. Öppna **Systeminställningar**
2. Klicka på önskat tema i listan
3. För **Custom**: Använd färgväljare eller skriv hex-kod
4. Klicka **Förhandsgranska** för att se resultatet
5. Klicka **Spara** för att tillämpa

**Färgkomponenter:**
- **Primary** - Huvudfärg (knappar, rubriker)
- **Secondary** - Sekundär färg (accenter, highlights)
- **Accent** - Accentfärg (borders, ikoner)
- **Background** - Bakgrundsfärg
- **Text** - Textfärg

---

## 📝 LOGIN-TEXT

Anpassa texten som visas på login-sidan.

### Redigerbara Fält

**1. Titel**
- Default: "DHL Lead Hunter"
- Visas som stor rubrik på login-sidan
- Max 50 tecken rekommenderat

**2. Undertitel**
- Default: "Sales Intelligence Platform"
- Visas under titeln
- Max 100 tecken rekommenderat

**3. Välkomstmeddelande**
- Default: "Välkommen till DHL Lead Hunter - din kraftfulla plattform för leadgenerering och kundanalys."
- Längre beskrivande text
- Max 300 tecken rekommenderat

**4. Footer-text**
- Default: "© 2024 DHL. Alla rättigheter förbehållna."
- Visas längst ner på login-sidan
- Max 100 tecken rekommenderat

### Hur Ändra Login-text

1. Öppna **Systeminställningar**
2. Scrolla till **Login-text** sektionen
3. Redigera önskade fält
4. Klicka **Förhandsgranska** för att se resultatet
5. Klicka **Spara** för att tillämpa

**Tips:**
- Håll texten kort och koncis
- Använd företagets branding och ton
- Testa förhandsgranskningen innan du sparar

---

## 🖼️ LOGOTYP

Ladda upp egen logotyp som visas i topbar och på login-sidan.

### Specifikationer

**Rekommenderad storlek:** 200x60px

**Format som stöds:**
- PNG (rekommenderat för transparens)
- JPG/JPEG
- SVG (vektorformat)
- WebP

**Max filstorlek:** 5MB

**Placering:**
- Topbar (Header)
- Login-sida (ovanför formulär)

### Hur Ladda Upp Logo

1. Öppna **Systeminställningar**
2. Gå till **Logotyp** sektionen
3. Klicka **Ladda upp logo**
4. Välj bildfil från din dator
5. Förhandsgranska resultatet
6. Klicka **Spara** för att tillämpa

**Tips:**
- Använd transparent bakgrund (PNG)
- Optimera bilden för webben
- Testa olika storlekar för bästa resultat
- Logo visas automatiskt i Header efter sparande

---

## 👁️ FÖRHANDSGRANSKNING

Innan du sparar kan du förhandsgranska alla ändringar.

### Hur Använda Förhandsgranskning

1. Gör dina ändringar (färg, text, logo)
2. Klicka **Förhandsgranska**
3. Se en mockup av login-sidan med dina ändringar
4. Stäng förhandsgranskning om du vill justera
5. Klicka **Spara** när du är nöjd

**Förhandsgranskningen visar:**
- Login-formulär med nya färger
- Anpassad text (titel, undertitel, meddelande, footer)
- Uppladdad logo
- Knappar och inputs med nya färger

---

## 💾 SPARA INSTÄLLNINGAR

### Sparningsprocess

1. Klicka **Spara**-knappen (röd, högst upp till höger)
2. Systemet laddar upp logo (om ändrad)
3. Systemet sparar färgschema i databasen
4. Systemet sparar login-text i databasen
5. Bekräftelse visas: "✅ Inställningar sparade!"
6. Sidan laddas om automatiskt
7. Nya inställningar tillämpas direkt

**Vad sparas:**
- Färgschema (alla 5 färger)
- Login-text (alla 4 fält)
- Logo-URL (om uppladdad)
- Tidsstämpel och admin-användare

---

## 🔄 ÅTERSTÄLL TILL STANDARD

Återställ alla inställningar till DHL-standard.

### Hur Återställa

1. Klicka **Återställ**-knappen (grå, högst upp)
2. Bekräfta i dialogrutan
3. Alla inställningar återställs till:
   - DHL Standard färgschema
   - Original login-text
   - Ingen custom logo

**Varning:** Denna åtgärd kan inte ångras!

---

## 🔧 TEKNISK INFORMATION

### Backend API

**GET /api/settings**
- Hämtar alla systeminställningar
- Returnerar färgschema, login-text, logo-URL

**PUT /api/settings**
- Uppdaterar systeminställningar
- Body: `{ colorScheme, loginText, logoUrl, customLogo }`

**POST /api/settings/upload-logo**
- Laddar upp logo-fil
- Multipart form-data
- Returnerar: `{ url, filename }`

### Databas

**Tabell:** `system_settings`

**Nycklar:**
- `ui_color_scheme` (JSON)
- `ui_login_text` (JSON)
- `ui_logo_url` (string)
- `ui_custom_logo` (boolean)

### CSS Variables

Färgschema tillämpas via CSS custom properties:

```css
:root {
  --color-primary: #D40511;
  --color-secondary: #FFCC00;
  --color-accent: #000000;
  --color-background: #FFFFFF;
  --color-text: #1F2937;
}
```

Dessa uppdateras automatiskt när inställningar sparas.

---

## 📁 FILER

**Frontend:**
- `components/AdminSettings.tsx` - Huvudkomponent
- `components/Header.tsx` - Meny-integration
- `App.tsx` - State management

**Backend:**
- `server/routes/settings.js` - API endpoints
- `server/public/uploads/logos/` - Logo-lagring

---

## 🎯 ANVÄNDNINGSFALL

### Use Case 1: Byta till Mörkt Tema

**Scenario:** Företaget vill ha mörkt tema för bättre ergonomi.

**Steg:**
1. Öppna Systeminställningar
2. Välj "Mörkt tema"
3. Förhandsgranska
4. Spara
5. Sidan laddas om med mörkt tema

**Resultat:** Hela systemet använder mörka färger.

---

### Use Case 2: Anpassa Branding

**Scenario:** Företaget vill använda egen branding.

**Steg:**
1. Öppna Systeminställningar
2. Välj "Custom" färgschema
3. Ange företagets färger (hex-koder)
4. Ändra login-text till företagsnamn
5. Ladda upp företagets logo
6. Förhandsgranska allt
7. Spara

**Resultat:** Systemet matchar företagets branding.

---

### Use Case 3: Säsongsanpassning

**Scenario:** Julkampanj med speciella färger.

**Steg:**
1. Öppna Systeminställningar
2. Välj "Custom"
3. Ange jul-färger (röd, grön, vit)
4. Ändra välkomstmeddelande: "God Jul! Välkommen till vår julkampanj..."
5. Ladda upp jul-logo
6. Spara

**Resultat:** Systemet har jultema.

**Efter kampanj:** Klicka "Återställ" för att gå tillbaka till standard.

---

## ⚠️ VIKTIGA NOTERINGAR

### Behörigheter

- **Endast ADMIN** kan ändra inställningar
- Andra roller ser inte "Systeminställningar" i menyn
- API-endpoints kräver admin-autentisering

### Prestanda

- Logo-filer optimeras automatiskt
- Färgschema tillämpas via CSS variables (snabbt)
- Inga prestanda-problem vid byte av tema

### Säkerhet

- Alla uploads valideras (filtyp, storlek)
- Endast bildformat tillåts
- Filer sparas i säker mapp
- Admin-åtgärder loggas

### Kompatibilitet

- Fungerar i alla moderna browsers
- Responsiv design (desktop, tablet, mobil)
- Stöd för dark mode och light mode
- Tillgänglighet (WCAG-kompatibel)

---

## 🐛 FELSÖKNING

### Problem: Inställningar sparas inte

**Lösning:**
1. Kontrollera att du är inloggad som ADMIN
2. Kontrollera backend-anslutning (port 3001)
3. Kolla browser console för fel
4. Verifiera databas-anslutning

### Problem: Logo visas inte

**Lösning:**
1. Kontrollera filformat (PNG, JPG, SVG)
2. Kontrollera filstorlek (max 5MB)
3. Verifiera att upload lyckades (kolla response)
4. Kontrollera att `public/uploads/logos/` finns
5. Ladda om sidan

### Problem: Färger tillämpas inte

**Lösning:**
1. Klicka "Spara" (inte bara förhandsgranska)
2. Vänta på bekräftelse
3. Ladda om sidan manuellt om auto-reload misslyckas
4. Rensa browser cache

### Problem: Förhandsgranskning fungerar inte

**Lösning:**
1. Kontrollera att alla fält är ifyllda
2. Verifiera att färgkoder är giltiga hex-värden
3. Stäng och öppna förhandsgranskning igen

---

## 📞 SUPPORT

**Vid problem:**
1. Kolla denna guide först
2. Kontrollera browser console för felmeddelanden
3. Verifiera backend-logs
4. Kontakta systemadministratör

**Loggar:**
- Browser: F12 → Console
- Backend: `server/logs/`
- Databas: Kolla `system_settings` tabell

---

## ✅ CHECKLISTA

### Innan du ändrar inställningar:

- [ ] Du är inloggad som ADMIN
- [ ] Backend körs på port 3001
- [ ] Databas är tillgänglig
- [ ] Du har förberett logo-fil (om relevant)
- [ ] Du har färgkoder klara (om custom)

### Efter ändring:

- [ ] Förhandsgranskad
- [ ] Sparat
- [ ] Bekräftelse mottagen
- [ ] Sida omladdad
- [ ] Verifierat att ändringar syns
- [ ] Testat login-sida
- [ ] Testat Header-logo

---

## 🚀 BEST PRACTICES

### Färgschema

✅ **Gör:**
- Använd företagets officiella färger
- Testa kontrast (text mot bakgrund)
- Förhandsgranska innan du sparar
- Dokumentera färgkoder

❌ **Undvik:**
- För låg kontrast (svårt att läsa)
- För många färger (rörigt)
- Extremt ljusa/mörka färger
- Slumpmässiga färger

### Login-text

✅ **Gör:**
- Håll det kort och professionellt
- Använd företagets ton
- Inkludera relevant information
- Korrekturläs innan du sparar

❌ **Undvik:**
- För långa texter
- Stavfel och grammatikfel
- Irrelevant information
- Informell ton (om inte avsiktligt)

### Logo

✅ **Gör:**
- Använd högkvalitativ bild
- Optimera för webben
- Använd transparent bakgrund (PNG)
- Testa olika storlekar

❌ **Undvik:**
- För stora filer (långsam laddning)
- Låg upplösning (pixligt)
- Fel proportioner (sträckt)
- Icke-professionella bilder

---

## 📊 EXEMPEL

### Exempel 1: Företag med Blå Profil

```json
{
  "colorScheme": {
    "name": "Custom",
    "primary": "#0066CC",
    "secondary": "#3399FF",
    "accent": "#003366",
    "background": "#FFFFFF",
    "text": "#333333"
  },
  "loginText": {
    "title": "Acme Corp Lead Hunter",
    "subtitle": "Sales Intelligence Platform",
    "welcomeMessage": "Välkommen till Acme Corp's leadgenereringsplattform.",
    "footerText": "© 2024 Acme Corp. All rights reserved."
  }
}
```

### Exempel 2: Minimalistiskt Tema

```json
{
  "colorScheme": {
    "name": "Custom",
    "primary": "#000000",
    "secondary": "#666666",
    "accent": "#CCCCCC",
    "background": "#FFFFFF",
    "text": "#333333"
  },
  "loginText": {
    "title": "Lead Hunter",
    "subtitle": "Simple. Powerful. Effective.",
    "welcomeMessage": "Log in to start generating leads.",
    "footerText": "Powered by AI"
  }
}
```

---

**Lycka till med att anpassa ditt system! 🎨**
