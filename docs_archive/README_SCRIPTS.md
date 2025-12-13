# 📜 Scripts & Commands Guide

## 🎯 Översikt

Alla scripts och kommandon för att sätta upp och köra DHL Lead Hunter lokalt.

---

## 📁 Tillgängliga Scripts

### 1. **setup.bat** (Windows Batch)
**Första gången - Komplett setup**

```bash
# Dubbelklicka på filen eller kör:
setup.bat
```

**Gör:**
- ✅ Kollar Node.js, npm, PostgreSQL
- ✅ Skapar databas `dhl_lead_hunter`
- ✅ Skapar användare `dhl_user`
- ✅ Kör migrations (DATABASE_SCHEMA.sql)
- ✅ Kopierar .env-filer
- ✅ Installerar npm packages
- ✅ Lägger till test-data (5 användare, 5 leads)
- ✅ Verifierar installation
- ✅ Frågar om du vill starta direkt

**Sökväg:** `c:\Users\A\Downloads\lead-hunter-v5.0\setup.bat`

---

### 2. **setup.ps1** (PowerShell)
**Samma som setup.bat men med mer funktionalitet**

```powershell
# Högerklicka → "Run with PowerShell" eller:
.\setup.ps1
```

**Extra funktioner:**
- ✅ Genererar automatiskt JWT_SECRET och SESSION_SECRET
- ✅ Bättre felhantering
- ✅ Färgad output
- ✅ Mer detaljerad feedback

**Sökväg:** `c:\Users\A\Downloads\lead-hunter-v5.0\setup.ps1`

---

### 3. **start-local.bat** (Windows Batch)
**Starta systemet efter setup**

```bash
# Dubbelklicka på filen eller kör:
start-local.bat
```

**Gör:**
- ✅ Kollar dependencies
- ✅ Kollar PostgreSQL
- ✅ Kollar .env-filer
- ✅ Startar backend i ny terminal
- ✅ Startar frontend i ny terminal
- ✅ Öppnar browser på http://localhost:5173

**Sökväg:** `c:\Users\A\Downloads\lead-hunter-v5.0\start-local.bat`

---

## 📋 NPM Scripts

### Frontend (från root)

```bash
# Utveckling
npm run dev
# → Startar Vite dev server på http://localhost:5173

# Bygga för produktion
npm run build
# → Skapar optimerad build i /dist

# Preview production build
npm run preview
# → Startar preview server
```

### Backend (från server/)

```bash
# Utveckling (med nodemon)
cd server
npm run dev
# → Startar Express API på http://localhost:3001

# Produktion
cd server
npm start
# → Startar Express API utan nodemon

# Database migrations
cd server
npm run db:migrate
# → Kör migrations (om script finns)

# Seed test-data
cd server
npm run db:seed-test
# → Lägger till 5 användare och 5 leads

# Testing
cd server
npm test
npm run test:watch
npm run test:coverage
```

---

## 🗄️ Database Commands

### Från projektets root: `c:\Users\A\Downloads\lead-hunter-v5.0`

### Skapa Databas
```bash
psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;"
psql -U postgres -c "CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;"
```

### Kör Migrations
```bash
psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql
```

### Lägg Till Test-Data
```bash
cd server
npm run db:seed-test
cd ..
```

### Koppla Till Databas
```bash
psql -U dhl_user -d dhl_lead_hunter
```

### Användbara SQL Queries (i psql)
```sql
-- Lista tabeller
\dt

-- Visa användare
SELECT email, role, status FROM users;

-- Visa leads
SELECT company_name, segment, status FROM leads;

-- Räkna per segment
SELECT segment, COUNT(*) FROM leads GROUP BY segment;

-- Avsluta
\q
```

### Rensa Databas
```bash
psql -U dhl_user -d dhl_lead_hunter -c "TRUNCATE users, leads, decision_makers, audit_log, system_settings CASCADE;"
```

### Återskapa Databas
```bash
psql -U postgres -c "DROP DATABASE IF EXISTS dhl_lead_hunter;"
psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;"
psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql
cd server
npm run db:seed-test
cd ..
```

---

## 🔧 Environment Variables

### Frontend (.env.local)

**Sökväg:** `c:\Users\A\Downloads\lead-hunter-v5.0\.env.local`

```bash
# Kopiera från example
copy .env.local.example .env.local

# Redigera
notepad .env.local
```

**Minimal innehåll:**
```env
VITE_API_URL=http://localhost:3001/api
```

### Backend (server/.env)

**Sökväg:** `c:\Users\A\Downloads\lead-hunter-v5.0\server\.env`

```bash
# Kopiera från example
copy server\.env.example server\.env

# Redigera
notepad server\.env
```

**Minimal innehåll (VIKTIGT!):**
```env
# Database
DATABASE_URL=postgresql://dhl_user:SecurePassword123!@localhost:5432/dhl_lead_hunter
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dhl_lead_hunter
DB_USER=dhl_user
DB_PASSWORD=SecurePassword123!

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173

# JWT (ÄNDRA!)
JWT_SECRET=min_super_hemliga_nyckel_som_ar_minst_32_tecken_lang

# Session (ÄNDRA!)
SESSION_SECRET=min_session_secret_som_ar_minst_32_tecken_lang
```

---

## 🚀 Komplett Setup (Manuellt)

### Alla kommandon i ordning från root:

```bash
# 1. Navigera till projekt
cd c:\Users\A\Downloads\lead-hunter-v5.0

# 2. Skapa databas
psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;"
psql -U postgres -c "CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;"

# 3. Kör migrations
psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql

# 4. Kopiera env-filer
copy .env.local.example .env.local
copy server\.env.example server\.env

# 5. Redigera server\.env (VIKTIGT!)
notepad server\.env
# Sätt: DB_PASSWORD, JWT_SECRET, SESSION_SECRET

# 6. Installera dependencies
npm install
cd server
npm install
cd ..

# 7. Lägg till test-data
cd server
npm run db:seed-test
cd ..

# 8. Starta backend (Terminal 1)
cd server
npm run dev

# 9. Starta frontend (Terminal 2)
# Öppna ny terminal i: c:\Users\A\Downloads\lead-hunter-v5.0
npm run dev

# 10. Öppna browser
start http://localhost:5173
```

---

## 🔍 Verifiera Installation

### Kolla Backend
```bash
# Health check
curl http://localhost:3001/api/health

# Förväntat svar:
# {"status":"ok","timestamp":"...","version":"1.0.0"}
```

### Kolla Databas
```bash
# Räkna användare
psql -U dhl_user -d dhl_lead_hunter -c "SELECT COUNT(*) FROM users;"
# Förväntat: 5

# Räkna leads
psql -U dhl_user -d dhl_lead_hunter -c "SELECT COUNT(*) FROM leads;"
# Förväntat: 5
```

### Kolla Frontend
```bash
# Öppna browser
start http://localhost:5173

# Logga in med:
# Email: admin@dhl.se
# Password: Test123!
```

---

## 🛠️ Felsökning

### Problem: Port redan används

**Backend (3001):**
```bash
# Hitta process
netstat -ano | findstr :3001

# Döda process
taskkill /PID <PID> /F
```

**Frontend (5173):**
```bash
# Hitta process
netstat -ano | findstr :5173

# Döda process
taskkill /PID <PID> /F
```

### Problem: PostgreSQL körs inte
```bash
# Kolla status
psql -U postgres -c "SELECT 1"

# Starta service
net start postgresql-x64-15

# Eller via pg_ctl
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
```

### Problem: Kan inte logga in
```bash
# Kör seed-script igen
cd c:\Users\A\Downloads\lead-hunter-v5.0\server
npm run db:seed-test
cd ..
```

### Problem: "psql: command not found"
```bash
# Lägg till i PATH:
# C:\Program Files\PostgreSQL\15\bin

# Eller använd full sökväg:
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
```

---

## 📊 Sammanfattning

### Setup (Första gången)
```bash
setup.bat          # Enklast - gör allt automatiskt
# eller
setup.ps1          # PowerShell-version med mer funktioner
```

### Starta (Varje gång)
```bash
start-local.bat    # Enklast - startar båda servrar
# eller manuellt:
cd server && npm run dev    # Terminal 1
npm run dev                 # Terminal 2
```

### Test-Användare
```
Email:    admin@dhl.se
Password: Test123!
```

### URLs
```
Backend:  http://localhost:3001
Frontend: http://localhost:5173
```

---

## 📚 Dokumentation

- **Quick Start:** `QUICK_START.md` - 5-minuters guide
- **Setup Commands:** `SETUP_COMMANDS.md` - Alla kommandon
- **Local Test:** `LOCAL_TEST_GUIDE.md` - Detaljerad guide
- **Integration:** `INTEGRATION_COMPLETE_GUIDE.md` - API & integration
- **UI Guide:** `COMPLETE_DASHBOARD_GUIDE.md` - UI-komponenter

---

**Status:** ✅ Alla scripts och kommandon klara! 🚀
