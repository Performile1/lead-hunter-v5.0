# 🚀 Deployment Guide - Lead Hunter v5.0

## Deployment till Vercel + Supabase

### 1. Supabase Setup (Database)

#### Skapa Projekt
1. Gå till [supabase.com](https://supabase.com)
2. Skapa nytt projekt
3. Välj region (närmast dina användare)
4. Kopiera **Connection String** från Settings → Database

#### Kör Migrations
1. Öppna SQL Editor i Supabase
2. Kör följande migrations i ordning:

**Migration 1: Multi-Tenant System**
```sql
-- Klistra in innehållet från:
-- server/migrations/003_multi_tenant_system.sql
```

**Migration 2: Add Subdomain**
```sql
-- Klistra in innehållet från:
-- server/migrations/004_add_subdomain_to_tenants.sql
```

**Migration 3: Error Reports**
```sql
-- Klistra in innehållet från:
-- server/migrations/005_error_reports_simple.sql
```

#### Skapa DHL-Sweden Tenant
```sql
INSERT INTO tenants (
  id,
  company_name,
  domain,
  subdomain,
  primary_color,
  secondary_color,
  search_term,
  status
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'DHL Sweden',
  'dhl.se',
  'dhl-sweden',
  '#D40511',
  '#FFCC00',
  'DHL',
  'active'
);
```

#### Skapa Admin-användare
```sql
INSERT INTO users (
  email,
  password_hash,
  full_name,
  role,
  tenant_id,
  status
) VALUES (
  'admin@dhl.se',
  -- Använd bcrypt hash av ditt lösenord
  '$2b$10$...',
  'DHL Admin',
  'admin',
  '11111111-1111-1111-1111-111111111111',
  'active'
);
```

### 2. Vercel Setup (Frontend + Backend)

#### Installera Vercel CLI
```bash
npm i -g vercel
```

#### Login
```bash
vercel login
```

#### Deploy
```bash
# Från projektmappen
cd "C:\Users\A\Downloads\lead-hunter-v5.0"

# Deploy
vercel

# Följ prompten:
# - Set up and deploy? Yes
# - Which scope? [Ditt konto]
# - Link to existing project? No
# - Project name? leadhunter
# - Directory? ./
# - Override settings? No
```

#### Sätt Environment Variables
```bash
# Database
vercel env add DATABASE_URL
# Klistra in Supabase Connection String

vercel env add PGHOST
vercel env add PGUSER
vercel env add PGPASSWORD
vercel env add PGDATABASE
vercel env add PGPORT

# JWT
vercel env add JWT_SECRET
# Generera: openssl rand -base64 32

# API Keys
vercel env add GEMINI_API_KEY
vercel env add GROQ_API_KEY

# Frontend
vercel env add VITE_API_URL
# Sätt till din Vercel backend URL

vercel env add VITE_GEMINI_API_KEY
vercel env add VITE_GROQ_API_KEY

# Server Config
vercel env add PORT
# Värde: 3001

vercel env add NODE_ENV
# Värde: production

vercel env add ALLOWED_ORIGINS
# Värde: https://your-app.vercel.app
```

#### Production Deploy
```bash
vercel --prod
```

### 3. Alternativ: Separata Deployments

#### Frontend (Vercel)
```bash
# Deploy endast frontend
vercel --prod
```

#### Backend (Railway.app)
1. Gå till [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Välj din repo
4. Root directory: `server`
5. Lägg till environment variables
6. Deploy

#### Backend (Render.com)
1. Gå till [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Root directory: `server`
5. Build command: `npm install`
6. Start command: `npm start`
7. Lägg till environment variables
8. Create Web Service

### 4. Custom Domain (Optional)

#### Vercel
1. Settings → Domains
2. Lägg till din domän
3. Uppdatera DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

#### Supabase Custom Domain
1. Settings → Custom Domains
2. Följ instruktioner

### 5. Verifikation

#### Testa Deployment
```bash
# Öppna din app
https://your-app.vercel.app

# Testa tenant login
https://your-app.vercel.app/?tenant=dhl-sweden

# Testa Super Admin
https://your-app.vercel.app
```

#### Kontrollera Logs
```bash
# Vercel logs
vercel logs

# Railway logs
# Se i Railway dashboard

# Supabase logs
# Se i Supabase dashboard
```

### 6. CI/CD med GitHub Actions

Skapa `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 7. Monitoring

#### Vercel Analytics
- Aktivera i Vercel dashboard
- Settings → Analytics → Enable

#### Supabase Monitoring
- Database → Performance
- Logs → Query Performance

#### Error Tracking (Optional)
- Sentry.io
- LogRocket
- Datadog

### 8. Backup Strategy

#### Database Backups
```bash
# Supabase har automatiska backups
# Settings → Database → Backups

# Manuell backup
pg_dump $DATABASE_URL > backup.sql
```

#### Code Backups
- GitHub är din backup
- Tagga releases:
```bash
git tag -a v5.0.0 -m "Release v5.0.0"
git push origin v5.0.0
```

## 🆘 Troubleshooting

### Build Fails
```bash
# Kontrollera logs
vercel logs

# Testa lokalt
npm run build
```

### Database Connection Error
- Verifiera CONNECTION_STRING
- Kontrollera IP whitelist i Supabase
- Testa connection:
```bash
psql $DATABASE_URL
```

### Environment Variables Saknas
```bash
# Lista alla env vars
vercel env ls

# Lägg till saknade
vercel env add VARIABLE_NAME
```

## 📊 Performance Tips

1. **Enable Caching**
   - Vercel Edge Network
   - CDN för static assets

2. **Database Optimization**
   - Index på ofta sökta kolumner
   - Connection pooling

3. **Code Splitting**
   - Lazy loading av komponenter
   - Route-based splitting

4. **Image Optimization**
   - Next.js Image component
   - WebP format

## 🔒 Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables säkra
- [ ] CORS konfigurerat
- [ ] Rate limiting aktiverat
- [ ] SQL injection skydd
- [ ] XSS skydd
- [ ] CSRF tokens
- [ ] Helmet.js konfigurerat
