@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   DHL Lead Hunter - Setup
echo ========================================
echo.

REM Navigera till projektmappen
cd /d c:\Users\A\Downloads\lead-hunter-v5.0

REM 1. Kolla dependencies
echo [1/9] Kollar dependencies...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   X Node.js ar inte installerat!
    echo     Ladda ned fran: https://nodejs.org/
    pause
    exit /b 1
)
echo   √ Node.js installerat

where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   X PostgreSQL ar inte installerat!
    echo     Ladda ned fran: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)
echo   √ PostgreSQL installerat

echo.

REM 2. Skapa databas
echo [2/9] Skapar databas...

psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   √ Databas skapad
) else (
    echo   - Databas finns redan eller kunde inte skapas
)

REM 3. Skapa användare
echo [3/9] Skapar databas-anvandare...

psql -U postgres -c "CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   √ Anvandare skapad
) else (
    echo   - Anvandare finns redan
)

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;" >nul 2>nul
echo   √ Rattigheter tilldelade

echo.

REM 4. Kör migrations
echo [4/9] Kor database migrations...

psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   √ Tabeller skapade
) else (
    echo   - Tabeller finns redan eller kunde inte skapas
)

echo.

REM 5. Kopiera env-filer
echo [5/9] Kopierar environment-filer...

if exist .env.local (
    echo   - .env.local finns redan
) else (
    copy .env.local.example .env.local >nul
    echo   √ .env.local skapad
)

if exist server\.env (
    echo   - server\.env finns redan
) else (
    copy server\.env.example server\.env >nul
    echo   √ server\.env skapad
    echo.
    echo   [VIKTIGT] Redigera server\.env och satt:
    echo     - DB_PASSWORD=SecurePassword123!
    echo     - JWT_SECRET=din_hemliga_nyckel_minst_32_tecken
    echo     - SESSION_SECRET=din_session_secret_minst_32_tecken
    echo.
    echo   Tryck Enter for att oppna filen...
    pause >nul
    notepad server\.env
)

echo.

REM 6. Installera frontend dependencies
echo [6/9] Installerar frontend dependencies...

if exist node_modules (
    echo   - node_modules finns redan
) else (
    call npm install
    echo   √ Frontend dependencies installerade
)

echo.

REM 7. Installera backend dependencies
echo [7/9] Installerar backend dependencies...

if exist server\node_modules (
    echo   - node_modules finns redan
) else (
    cd server
    call npm install
    cd ..
    echo   √ Backend dependencies installerade
)

echo.

REM 8. Lägg till test-data
echo [8/9] Lagger till test-data...

cd server
call npm run db:seed-test
cd ..
echo   √ Test-data tillagd

echo.

REM 9. Verifiera
echo [9/9] Verifierar installation...

psql -U dhl_user -d dhl_lead_hunter -c "SELECT COUNT(*) FROM users;" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   √ Databas fungerar
) else (
    echo   X Databas-problem
)

if exist node_modules (
    echo   √ Frontend dependencies OK
)

if exist server\node_modules (
    echo   √ Backend dependencies OK
)

echo.
echo ========================================
echo   √ Setup Klar!
echo ========================================
echo.
echo Test-anvandare:
echo   Email:    admin@dhl.se
echo   Password: Test123!
echo.
echo ========================================
echo   NASTA STEG: Aktivera Verklig Data
echo ========================================
echo.
echo Systemet fungerar nu med test-data.
echo For att hamta VERKLIG data fran API:er:
echo.
echo 1. Hamta GRATIS API-nycklar:
echo    - Gemini: https://aistudio.google.com/app/apikey
echo    - Groq:   https://console.groq.com/keys
echo.
echo 2. Lagg till i server\.env:
echo    notepad server\.env
echo.
echo 3. Lagg till raderna:
echo    GEMINI_API_KEY=AIzaSy...din_nyckel
echo    GROQ_API_KEY=gsk_...din_nyckel
echo.
echo 4. Starta om backend
echo.
echo Nu hamtas automatiskt:
echo   √ Kontaktpersoner (VD, CFO, Logistics Manager)
echo   √ Nyheter (expansion, tillvaxt, investeringar)
echo   √ Ekonomi (omsattning, kreditbetyg)
echo   √ E-commerce data (platform, leverantorer)
echo   √ AI-analys (sales pitch, opportunity score)
echo.
echo Se: REAL_DATA_SETUP.md for detaljer
echo.
echo ========================================
echo.
echo Starta systemet:
echo   start-local.bat
echo.
echo   Eller manuellt:
echo   Terminal 1: cd server ^&^& npm run dev
echo   Terminal 2: npm run dev
echo.
echo URLs:
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:5173
echo.
echo Dokumentation:
echo   QUICK_START.md        - Snabbstart
echo   REAL_DATA_SETUP.md    - API-nycklar ^& verklig data
echo   DATA_SOURCES_OVERVIEW.md - Vad hamtas?
echo   SETUP_COMMANDS.md     - Alla kommandon
echo.

set /p START="Vill du starta systemet nu? (y/n): "
if /i "%START%"=="y" (
    echo.
    echo Startar systemet...
    call start-local.bat
)

pause
