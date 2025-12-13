# 🚀 GitHub Setup Guide - Lead Hunter v5.0

## Snabbstart: Pusha till GitHub

```bash
# 1. Navigera till projektmappen
cd "C:\Users\A\Downloads\lead-hunter-v5.0"

# 2. Initiera Git (om inte redan gjort)
git init

# 3. Lägg till remote (din repo)
git remote add origin https://github.com/Performile1/Leadhunter.git

# 4. Lägg till alla filer
git add .

# 5. Första commit
git commit -m "Initial commit - Lead Hunter v5.0 Multi-Tenant Platform

- Multi-tenant architecture with Super Admin and Tenant Admin
- DHL-Sweden as reference tenant
- User management for tenant admins
- Lead search and analysis
- Customer management
- Settings and customization
- Complete backend API with PostgreSQL"

# 6. Pusha till GitHub
git branch -M main
git push -u origin main
```

## ⚠️ Viktigt Innan Du Pushar

### 1. Kontrollera .env filer
Säkerställ att `.env` filer INTE pushas:
```bash
# Dessa ska INTE finnas i Git:
.env
.env.local
server/.env
server/.env.local
```

### 2. Skapa .env.example
Skapa exempel-filer för andra utvecklare (redan skapade).

## 📝 Efter Push

### 1. Lägg till Repository Description
På GitHub:
- **Description:** "Multi-tenant AI-powered sales intelligence platform with lead generation and customer management"
- **Topics:** `lead-generation`, `sales-intelligence`, `multi-tenant`, `react`, `typescript`, `nodejs`, `postgresql`, `ai`

### 2. Skapa GitHub Secrets (för CI/CD)
Settings → Secrets and variables → Actions:
- `DATABASE_URL`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`

## 🔄 Framtida Updates

```bash
# Hämta senaste ändringar
git pull origin main

# Gör ändringar...

# Commit och pusha
git add .
git commit -m "Beskrivning av ändring"
git push origin main
```

## 🚀 Deploy till Vercel

Se `DEPLOYMENT.md` för fullständig guide.

## 📚 Dokumentation

- `README.md` - Projektöversikt
- `DEPLOYMENT.md` - Deployment guide
- `GITHUB_SETUP.md` - Denna fil
- `CHANGELOG.md` - Versionshistorik
