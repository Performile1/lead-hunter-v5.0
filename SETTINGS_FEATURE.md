# SuperAdmin Settings Feature

## Översikt
SuperAdmin Settings-vyn ger super admins möjlighet att hantera API-nycklar och environment variables direkt från webbgränssnittet, med automatisk synkronisering till både lokal `.env`-fil och Vercel.

## Funktioner

### API-nyckelhantering
- **GROQ_API_KEY** - För Groq AI-modeller
- **GEMINI_API_KEY** - För Google Gemini AI
- **OPENAI_API_KEY** - För OpenAI-modeller
- **ANTHROPIC_API_KEY** - För Claude AI
- **DATABASE_URL** - PostgreSQL-anslutning
- **JWT_SECRET** - För JWT-tokens

### Säkerhetsfunktioner
- Maskerade nycklar vid visning (visar endast första 4 och sista 4 tecken)
- Visa/dölj-knappar för varje nyckel
- Endast super admin har åtkomst
- Audit logging av alla ändringar

### Vercel-integration
För att aktivera automatisk uppdatering av Vercel environment variables, lägg till följande i din `.env`:

```env
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID=your_project_id_here
VERCEL_TEAM_ID=your_team_id_here  # Optional, om du använder team
```

#### Så här får du Vercel-credentials:

1. **VERCEL_TOKEN**:
   - Gå till https://vercel.com/account/tokens
   - Skapa en ny token med "Full Access" scope
   - Kopiera token (visas endast en gång!)

2. **VERCEL_PROJECT_ID**:
   - Gå till ditt projekt på Vercel
   - Settings → General
   - Kopiera "Project ID" under "Project Settings"

3. **VERCEL_TEAM_ID** (om du använder team):
   - Gå till Team Settings
   - Kopiera Team ID

## Användning

1. Logga in som super admin
2. Navigera till SuperAdmin Dashboard
3. Klicka på "System Inställningar"
4. Scrolla ner till "API-nycklar & Environment Variables"
5. Fyll i eller uppdatera nycklar
6. Klicka "Spara & Uppdatera Vercel"

## Teknisk implementation

### Frontend
- **Komponent**: `src/components/admin/SuperAdminSettings.tsx`
- **API-anrop**: `GET/POST /api/admin/env-vars`
- **State management**: React hooks (useState, useEffect)

### Backend
- **Route**: `server/routes/admin.js`
- **Endpoints**:
  - `GET /api/admin/env-vars` - Hämta maskerade nycklar
  - `POST /api/admin/env-vars` - Uppdatera nycklar
- **Funktioner**:
  - `maskApiKey()` - Maskerar API-nycklar
  - `maskDatabaseUrl()` - Maskerar databas-URL
  - `updateVercelEnvVars()` - Uppdaterar Vercel via API

### Säkerhet
- Endast super admin (role='admin' och tenant_id=null) har åtkomst
- Nycklar maskeras vid GET-requests
- Audit logging via `auditLog` middleware
- Sanitering av input via `sanitizeInput` middleware

## Felsökning

### "Vercel-integration ej konfigurerad"
- Kontrollera att `VERCEL_TOKEN` och `VERCEL_PROJECT_ID` finns i `.env`
- Verifiera att token har rätt behörigheter

### "Åtkomst nekad"
- Kontrollera att användaren är super admin
- Verifiera att `tenant_id` är null i databasen

### Nycklar uppdateras inte
- Kontrollera server-loggar för fel
- Verifiera att `.env`-filen är skrivbar
- Testa Vercel API-anslutning manuellt

## API-dokumentation

### GET /api/admin/env-vars
Hämtar maskerade environment variables.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "envVars": {
    "GROQ_API_KEY": "gsk_••••••••abcd",
    "GEMINI_API_KEY": "AIza••••••••xyz",
    ...
  }
}
```

### POST /api/admin/env-vars
Uppdaterar environment variables.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "envVars": {
    "GROQ_API_KEY": "gsk_new_key_here",
    "GEMINI_API_KEY": "AIzaSy_new_key_here"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Environment variables uppdaterade lokalt och i Vercel!",
  "vercelUpdated": true
}
```

## Framtida förbättringar
- [ ] Validering av API-nycklar innan sparande
- [ ] Test-funktion för varje API-nyckel
- [ ] Historik över nyckeländringar
- [ ] Notifikationer vid nyckeluppdateringar
- [ ] Batch-import av nycklar från fil
- [ ] Automatisk rotation av nycklar
