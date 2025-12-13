# 🔧 Setup Commands - Alla Kommandon Med Rätt Sökvägar

## 📍 Viktigt: Alla kommandon körs från projektets root
```
c:\Users\A\Downloads\lead-hunter-v5.0
```

---

## 1️⃣ DATABAS SETUP

### A. Skapa Databas och Användare
```powershell
# Öppna PowerShell som Administrator
# Navigera till projektmappen
cd c:\Users\A\Downloads\lead-hunter-v5.0

# Skapa databas
psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;"

# Skapa användare
psql -U postgres -c "CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';"

# Ge rättigheter
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;"

# Verifiera
psql -U postgres -c "\l" | findstr dhl_lead_hunter
```

### B. Kör Migrations (Skapa Tabeller)
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0
psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql
```

### C. Lägg Till Test-Data
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0
cd server
npm run db:seed-test
cd ..
```

### D. Verifiera Databas
```powershell
# Kolla tabeller
psql -U dhl_user -d dhl_lead_hunter -c "\dt"

# Kolla användare
psql -U dhl_user -d dhl_lead_hunter -c "SELECT email, role FROM users;"

# Kolla leads
psql -U dhl_user -d dhl_lead_hunter -c "SELECT company_name, segment FROM leads;"
```

---

## 2️⃣ ENVIRONMENT VARIABLES

### A. Frontend (.env.local)
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0

# Kopiera example-fil
copy .env.local.example .env.local

# Öppna för redigering
notepad .env.local
```

**Minimal innehåll:**
```env
VITE_API_URL=http://localhost:3001/api
```

### B. Backend (server/.env)
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0

# Kopiera example-fil
copy server\.env.example server\.env

# Öppna för redigering
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

# JWT (ÄNDRA DETTA!)
JWT_SECRET=min_super_hemliga_nyckel_som_ar_minst_32_tecken_lang_123456

# Session (ÄNDRA DETTA!)
SESSION_SECRET=min_session_secret_som_ar_minst_32_tecken_lang_123456
```

---

## 3️⃣ INSTALLERA DEPENDENCIES

### A. Frontend Dependencies
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0
npm install
```

### B. Backend Dependencies
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0
cd server
npm install
cd ..
```

### C. Verifiera Installation
```powershell
# Kolla frontend packages
dir node_modules | findstr lucide-react

# Kolla backend packages
dir server\node_modules | findstr express
```

---

## 4️⃣ STARTA SYSTEMET

### Alternativ A: Automatisk Start (Enklast)
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0
.\start-local.bat
```

### Alternativ B: Manuell Start (Två Terminaler)

**Terminal 1 - Backend:**
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0
npm run dev
```

### Alternativ C: PowerShell Script (Båda samtidigt)
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0

# Starta backend i bakgrunden
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\A\Downloads\lead-hunter-v5.0\server'; npm run dev"

# Vänta 5 sekunder
Start-Sleep -Seconds 5

# Starta frontend i bakgrunden
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\A\Downloads\lead-hunter-v5.0'; npm run dev"

# Vänta 3 sekunder
Start-Sleep -Seconds 3

# Öppna browser
Start-Process "http://localhost:5173"
```

---

## 5️⃣ TESTA SYSTEMET

### A. Kolla Backend Health
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0
curl http://localhost:3001/api/health
```

**Förväntat svar:**
```json
{"status":"ok","timestamp":"2024-12-11T09:41:00.000Z","version":"1.0.0"}
```

### B. Kolla Frontend
```powershell
# Öppna browser
start http://localhost:5173
```

### C. Test Login
```powershell
# Använd curl för att testa login
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@dhl.se\",\"password\":\"Test123!\"}"
```

---

## 6️⃣ DATABAS KOMMANDON

### Koppla Till Databas
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0
psql -U dhl_user -d dhl_lead_hunter
```

### Användbara SQL Queries (i psql)
```sql
-- Lista alla tabeller
\dt

-- Visa användare
SELECT email, role, status FROM users;

-- Visa leads
SELECT company_name, segment, status FROM leads;

-- Räkna leads per segment
SELECT segment, COUNT(*) FROM leads GROUP BY segment;

-- Visa decision makers
SELECT dm.name, dm.title, l.company_name 
FROM decision_makers dm 
JOIN leads l ON dm.lead_id = l.id;

-- Visa system settings
SELECT setting_key, setting_value FROM system_settings;

-- Avsluta psql
\q
```

### Rensa Databas (Om du vill börja om)
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0

# Radera all data
psql -U dhl_user -d dhl_lead_hunter -c "TRUNCATE users, leads, decision_makers, audit_log, system_settings CASCADE;"

# Kör seed igen
cd server
npm run db:seed-test
cd ..
```

### Återskapa Databas (Fullständig reset)
```powershell
# Från: c:\Users\A\Downloads\lead-hunter-v5.0

# Radera databas
psql -U postgres -c "DROP DATABASE IF EXISTS dhl_lead_hunter;"

# Skapa ny
psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;"

# Kör migrations
psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql

# Lägg till test-data
cd server
npm run db:seed-test
cd ..
```

---

## 7️⃣ FELSÖKNING

### Problem: "psql: command not found"
```powershell
# Lägg till PostgreSQL i PATH
# Öppna System Environment Variables
# Lägg till: C:\Program Files\PostgreSQL\15\bin

# Eller använd full sökväg
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres
```

### Problem: "npm: command not found"
```powershell
# Installera Node.js från: https://nodejs.org/
# Starta om PowerShell efter installation

# Verifiera
node --version
npm --version
```

### Problem: Port 3001 redan används
```powershell
# Hitta process
netstat -ano | findstr :3001

# Döda process (ersätt PID)
taskkill /PID <PID> /F

# Eller ändra port i server\.env
notepad server\.env
# Ändra: PORT=3002
```

### Problem: Port 5173 redan används
```powershell
# Hitta process
netstat -ano | findstr :5173

# Döda process
taskkill /PID <PID> /F
```

### Problem: "password authentication failed"
```powershell
# Återskapa användare
psql -U postgres -c "DROP USER IF EXISTS dhl_user;"
psql -U postgres -c "CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;"

# Uppdatera server\.env
notepad server\.env
# Sätt: DB_PASSWORD=SecurePassword123!
```

### Problem: Backend startar inte
```powershell
# Kolla loggar
cd server
npm run dev

# Kolla .env-filen
type .env | findstr JWT_SECRET
type .env | findstr DB_PASSWORD

# Testa databas-anslutning
psql -U dhl_user -d dhl_lead_hunter -c "SELECT 1;"
```

---

## 8️⃣ STOPPA SYSTEMET

### Stoppa Servrar
```powershell
# I varje terminal där servern körs:
Ctrl + C

# Eller hitta och döda processer
netstat -ano | findstr :3001
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Stoppa PostgreSQL (Om du vill)
```powershell
# Stoppa service
net stop postgresql-x64-15

# Eller via pg_ctl
pg_ctl -D "C:\Program Files\PostgreSQL\15\data" stop
```

---

## 9️⃣ KOMPLETT SETUP (Från Början)

### Kör Alla Kommandon i Ordning:
```powershell
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

# 8. Starta systemet
.\start-local.bat

# 9. Öppna browser
start http://localhost:5173

# 10. Logga in
# Email: admin@dhl.se
# Password: Test123!
```

---

## 🔟 ANVÄNDBARA SHORTCUTS

### Skapa Alias (PowerShell Profile)
```powershell
# Öppna PowerShell profile
notepad $PROFILE

# Lägg till:
function dhl-start {
    cd c:\Users\A\Downloads\lead-hunter-v5.0
    .\start-local.bat
}

function dhl-db {
    psql -U dhl_user -d dhl_lead_hunter
}

function dhl-reset {
    cd c:\Users\A\Downloads\lead-hunter-v5.0
    psql -U postgres -c "DROP DATABASE IF EXISTS dhl_lead_hunter;"
    psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;"
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;"
    psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql
    cd server
    npm run db:seed-test
    cd ..
}

# Spara och ladda om
. $PROFILE

# Använd:
dhl-start   # Starta systemet
dhl-db      # Öppna databas
dhl-reset   # Återskapa databas
```

---

## ✅ VERIFIERING

### Kolla Att Allt Fungerar:
```powershell
# 1. Databas
psql -U dhl_user -d dhl_lead_hunter -c "SELECT COUNT(*) FROM users;"
# Förväntat: 5 användare

# 2. Backend
curl http://localhost:3001/api/health
# Förväntat: {"status":"ok",...}

# 3. Frontend
start http://localhost:5173
# Förväntat: Login-sida visas

# 4. Login
# Email: admin@dhl.se
# Password: Test123!
# Förväntat: Dashboard visas med 5 leads
```

---

**Status:** ✅ Alla kommandon klara med korrekta sökvägar! 🚀
