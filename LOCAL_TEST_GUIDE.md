# 🧪 Lokal Test Guide - DHL Lead Hunter

## 📋 Förberedelser

### 1. Kontrollera att du har:
- ✅ Node.js (v18+)
- ✅ PostgreSQL (v14+)
- ⚠️ Redis (valfritt, för caching)

### 2. Kolla versioner:
```bash
node --version    # Ska vara v18 eller högre
npm --version     # Ska vara v9 eller högre
psql --version    # Ska vara v14 eller högre
```

---

## 🗄️ Steg 1: Sätt upp Databasen

### A. Starta PostgreSQL
```bash
# Windows (om installerat som service)
# PostgreSQL startar automatiskt

# Eller starta manuellt
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
```

### B. Skapa databas och användare
```bash
# Öppna psql
psql -U postgres

# I psql-prompten:
CREATE DATABASE dhl_lead_hunter;
CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;
\q
```

### C. Kör migrations
```bash
# Från projektets root
psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql
```

### D. Verifiera
```bash
psql -U dhl_user -d dhl_lead_hunter

# I psql:
\dt                    # Lista alla tabeller
SELECT * FROM users;   # Ska vara tom
\q
```

---

## 🔧 Steg 2: Konfigurera Environment Variables

### A. Frontend (.env.local)
```bash
# Kopiera example-filen
copy .env.local.example .env.local

# Redigera .env.local
notepad .env.local
```

**Minimal konfiguration:**
```bash
# .env.local
VITE_API_URL=http://localhost:3001/api

# Valfritt (för LLM-funktioner)
GEMINI_API_KEY=din_nyckel_här
GROQ_API_KEY=din_nyckel_här
```

### B. Backend (server/.env)
```bash
cd server

# Kopiera example-filen
copy .env.example .env

# Redigera .env
notepad .env
```

**Minimal konfiguration:**
```bash
# server/.env

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

# JWT (generera en säker nyckel)
JWT_SECRET=din_super_hemliga_nyckel_minst_32_tecken_lång

# Session
SESSION_SECRET=din_session_secret_minst_32_tecken

# LLM (valfritt)
GEMINI_API_KEY=din_nyckel
GROQ_API_KEY=din_nyckel
```

---

## 📦 Steg 3: Installera Dependencies

### A. Frontend
```bash
# Från projektets root
npm install
```

### B. Backend
```bash
cd server
npm install
cd ..
```

---

## 🚀 Steg 4: Starta Systemet

### Alternativ 1: Starta Separat (Rekommenderat för utveckling)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

Du ska se:
```
🚀 DHL Lead Hunter API running on port 3001
📊 Environment: development
🔒 CORS enabled for: http://localhost:5173
```

**Terminal 2 - Frontend:**
```bash
# Från projektets root
npm run dev
```

Du ska se:
```
VITE v6.2.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Alternativ 2: Starta Med Ett Kommando

Skapa `start-local.bat`:
```batch
@echo off
echo Starting DHL Lead Hunter locally...

start cmd /k "cd server && npm run dev"
timeout /t 3
start cmd /k "npm run dev"

echo.
echo ✅ Backend: http://localhost:3001
echo ✅ Frontend: http://localhost:5173
echo.
```

Kör:
```bash
start-local.bat
```

---

## 🧪 Steg 5: Testa Systemet

### A. Öppna Browser
```
http://localhost:5173
```

### B. Skapa Test-Användare

**Alternativ 1: Via API (Postman/curl)**
```bash
curl -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@dhl.se\",\"password\":\"Test123!\",\"full_name\":\"Test User\",\"role\":\"admin\"}"
```

**Alternativ 2: Direkt i databasen**
```sql
-- Öppna psql
psql -U dhl_user -d dhl_lead_hunter

-- Skapa admin-användare (lösenord: Test123!)
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES (
  'admin@dhl.se',
  '$2b$10$YourHashedPasswordHere',
  'Admin User',
  'admin',
  'active'
);
```

**Alternativ 3: Använd seed-script**
```bash
cd server
npm run db:seed
```

### C. Logga In
1. Öppna http://localhost:5173
2. Logga in med:
   - Email: `admin@dhl.se`
   - Password: `Test123!`

### D. Testa Funktioner

**1. Sök Leads:**
- Klicka på "Enstaka" tab
- Fyll i företagsnamn: "Boozt AB"
- Klicka "KÖR PROTOKOLL"

**2. Admin Settings:**
- Klicka på "Verktyg" → "Visa Systemstatus"
- Testa olika inställningar

**3. Lead Actions:**
- Klicka på ett lead
- Testa "Starta Analys"
- Testa "Ladda ned"
- Testa "Radera"

---

## 🔍 Felsökning

### Problem: Backend startar inte

**Fel:** `Error: connect ECONNREFUSED`
```bash
# Kolla om PostgreSQL körs
psql -U postgres -c "SELECT version();"

# Starta PostgreSQL om den inte körs
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start
```

**Fel:** `JWT_SECRET is not defined`
```bash
# Kontrollera att server/.env finns och innehåller JWT_SECRET
cd server
type .env | findstr JWT_SECRET
```

### Problem: Frontend kan inte nå backend

**Fel:** `Failed to fetch`
```bash
# 1. Kolla att backend körs
curl http://localhost:3001/api/health

# 2. Kolla CORS-inställningar i server/.env
ALLOWED_ORIGINS=http://localhost:5173

# 3. Kolla att VITE_API_URL är rätt i .env.local
VITE_API_URL=http://localhost:3001/api
```

### Problem: Database connection error

**Fel:** `password authentication failed`
```bash
# 1. Kolla lösenord i server/.env
DB_PASSWORD=SecurePassword123!

# 2. Testa anslutning manuellt
psql -U dhl_user -d dhl_lead_hunter

# 3. Om det inte fungerar, återskapa användaren
psql -U postgres
DROP USER IF EXISTS dhl_user;
CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;
```

### Problem: Port redan används

**Fel:** `Port 3001 is already in use`
```bash
# Hitta process som använder porten
netstat -ano | findstr :3001

# Döda processen (ersätt PID med rätt nummer)
taskkill /PID <PID> /F

# Eller ändra port i server/.env
PORT=3002
```

---

## 📊 Verifiera Installation

### Checklist:
- [ ] PostgreSQL körs
- [ ] Databas `dhl_lead_hunter` finns
- [ ] Tabeller skapade (kör `\dt` i psql)
- [ ] Backend startar på port 3001
- [ ] Frontend startar på port 5173
- [ ] Kan öppna http://localhost:5173
- [ ] Kan logga in
- [ ] Kan se leads-lista
- [ ] Kan öppna admin-settings

### Test API Endpoints:
```bash
# Health check
curl http://localhost:3001/api/health

# Login (ska ge 401 utan credentials)
curl http://localhost:3001/api/auth/login

# Leads (ska ge 401 utan token)
curl http://localhost:3001/api/leads
```

---

## 🎯 Snabbstart (TL;DR)

```bash
# 1. Skapa databas
psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;"
psql -U postgres -c "CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;"

# 2. Kör migrations
psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql

# 3. Kopiera env-filer
copy .env.local.example .env.local
copy server\.env.example server\.env

# 4. Redigera server/.env (sätt DB_PASSWORD och JWT_SECRET)
notepad server\.env

# 5. Installera dependencies
npm install
cd server && npm install && cd ..

# 6. Starta (två terminaler)
# Terminal 1:
cd server && npm run dev

# Terminal 2:
npm run dev

# 7. Öppna browser
start http://localhost:5173
```

---

## 🎊 Klart!

Om allt fungerar ska du nu se:
- ✅ Backend körs på http://localhost:3001
- ✅ Frontend körs på http://localhost:5173
- ✅ Kan logga in
- ✅ Kan söka leads
- ✅ Kan använda admin-settings

**Nästa steg:**
- Lägg till API-nycklar för LLM (Gemini/Groq)
- Testa scraping-funktioner
- Aktivera Crawl4AI
- Skapa fler användare

---

## 📝 Användbara Kommandon

```bash
# Starta backend
cd server && npm run dev

# Starta frontend
npm run dev

# Kolla databas
psql -U dhl_user -d dhl_lead_hunter

# Visa tabeller
psql -U dhl_user -d dhl_lead_hunter -c "\dt"

# Visa användare
psql -U dhl_user -d dhl_lead_hunter -c "SELECT * FROM users;"

# Rensa databas
psql -U dhl_user -d dhl_lead_hunter -c "TRUNCATE leads, decision_makers, audit_log CASCADE;"

# Starta om PostgreSQL
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" restart

# Kolla loggar
# Backend: server/logs/
# Frontend: Browser Console (F12)
```

---

**Status:** ✅ Redo att testa lokalt! 🚀
