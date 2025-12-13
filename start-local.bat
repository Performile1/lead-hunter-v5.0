@echo off
echo ========================================
echo   DHL Lead Hunter - Local Start
echo ========================================
echo.

REM Kolla om node är installerat
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js är inte installerat!
    echo Ladda ned från: https://nodejs.org/
    pause
    exit /b 1
)

REM Kolla om PostgreSQL körs
psql -U postgres -c "SELECT 1" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] PostgreSQL verkar inte köra
    echo Försöker starta...
    pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start >nul 2>nul
    timeout /t 3 >nul
)

REM Kolla om databas finns
psql -U dhl_user -d dhl_lead_hunter -c "SELECT 1" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Databas 'dhl_lead_hunter' finns inte eller kan inte nås
    echo Kör: psql -U postgres -f DATABASE_SCHEMA.sql
    echo.
)

REM Kolla om .env-filer finns
if not exist ".env.local" (
    echo [WARNING] .env.local saknas
    echo Kopierar från .env.local.example...
    copy .env.local.example .env.local >nul
)

if not exist "server\.env" (
    echo [WARNING] server\.env saknas
    echo Kopierar från server\.env.example...
    copy server\.env.example server\.env >nul
    echo.
    echo [ACTION REQUIRED] Redigera server\.env och sätt:
    echo   - DB_PASSWORD
    echo   - JWT_SECRET
    echo.
    pause
)

REM Kolla om node_modules finns
if not exist "node_modules" (
    echo [INFO] Installerar frontend dependencies...
    call npm install
)

if not exist "server\node_modules" (
    echo [INFO] Installerar backend dependencies...
    cd server
    call npm install
    cd ..
)

echo.
echo ========================================
echo   Startar Backend och Frontend
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Tryck Ctrl+C i varje terminal för att stoppa
echo.

REM Starta backend i ny terminal
start "DHL Lead Hunter - Backend" cmd /k "cd server && npm run dev"

REM Vänta lite så backend hinner starta
timeout /t 5 >nul

REM Starta frontend i ny terminal
start "DHL Lead Hunter - Frontend" cmd /k "npm run dev"

REM Vänta lite så frontend hinner starta
timeout /t 3 >nul

REM Öppna browser
echo Öppnar browser...
timeout /t 2 >nul
start http://localhost:5173

echo.
echo ========================================
echo   System startat!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Två nya terminaler har öppnats.
echo Stäng dem för att stoppa servern.
echo.
pause
