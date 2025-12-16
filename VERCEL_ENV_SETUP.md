# Vercel Environment Variables Setup

För att applikationen ska fungera i Vercel måste du lägga till följande environment variables:

## Steg 1: Gå till Vercel Dashboard
1. Öppna ditt projekt på [vercel.com](https://vercel.com)
2. Gå till **Settings** → **Environment Variables**

## Steg 2: Lägg till följande variabler

### REQUIRED - Frontend API Keys
Dessa behövs för att lead search ska fungera:

```
VITE_GEMINI_API_KEY = AIzaSyCHHVIjyMPUT6jXyanTE_z1II54f3JSJGg
VITE_GROQ_API_KEY = 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
```

### REQUIRED - Backend API Keys
Dessa behövs för serverless functions:

```
DATABASE_URL = postgresql://postgres.nkejygbqvqcciqfdbabe:[YOUR-PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
JWT_SECRET = C3sy1MoW8dflVYz4J5AnBHge0NqKQbGx
JWT_EXPIRES_IN = 7d
```

### OPTIONAL - Enhanced Features
Dessa kan läggas till senare för extra funktionalitet:

```
VITE_OPENAI_API_KEY = (valfritt)
VITE_CLAUDE_API_KEY = (valfritt)
NEWS_API_KEY = (valfritt)
BUILTWITH_API_KEY = (valfritt)
```

## Steg 3: Sätt Environment för alla
För varje variabel, välj:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

## Steg 4: Redeploy
Efter att du lagt till variablerna:
1. Gå till **Deployments**
2. Klicka på den senaste deploymenten
3. Klicka **Redeploy**

## Lokal Development
För lokal utveckling, skapa en `.env` fil i projektets root:

```bash
cp .env.example .env
```

Redigera `.env` och lägg till dina API-nycklar.

**VIKTIGT:** `.env` filen är gitignored och kommer INTE pushas till GitHub.
