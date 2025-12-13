# DHL Lead Hunter - Komplett Setup Script
# Kör med: .\setup.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = "c:\Users\A\Downloads\lead-hunter-v5.0"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  DHL Lead Hunter - Setup" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Navigera till projekt
Set-Location $ProjectRoot

# 1. Kolla dependencies
Write-Host "[1/9] Kollar dependencies..." -ForegroundColor Cyan

# Funktion för att installera Chocolatey
function Install-Chocolatey {
    Write-Host "  → Installerar Chocolatey (pakethanterare)..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "  ✓ Chocolatey installerat" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "  ✗ Kunde inte installera Chocolatey: $_" -ForegroundColor Red
        return $false
    }
}

# Kolla om Chocolatey finns (behövs för automatisk installation)
$chocoInstalled = $false
try {
    $chocoCmd = Get-Command choco -ErrorAction Stop
    $chocoInstalled = $true
} catch {
    # Chocolatey finns inte
}

# Kolla Node.js
$nodeInstalled = $false
try {
    $nodeCmd = Get-Command node -ErrorAction Stop
    $nodeVersion = & node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {
    Write-Host "  ✗ Node.js är inte installerat!" -ForegroundColor Red
}

if (-not $nodeInstalled) {
    Write-Host "  → Vill du installera Node.js automatiskt? (y/n)" -ForegroundColor Yellow
    $installNode = Read-Host
    
    if ($installNode -eq "y") {
        if (-not $chocoInstalled) {
            Write-Host "  → Chocolatey behövs för automatisk installation" -ForegroundColor Yellow
            Write-Host "  → Installera Chocolatey? (y/n)" -ForegroundColor Yellow
            $installChoco = Read-Host
            if ($installChoco -eq "y") {
                $chocoInstalled = Install-Chocolatey
            }
        }
        
        if ($chocoInstalled) {
            Write-Host "  → Installerar Node.js (detta kan ta några minuter)..." -ForegroundColor Yellow
            try {
                & choco install nodejs -y | Out-Null
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                Write-Host "  ✓ Node.js installerat" -ForegroundColor Green
                $nodeInstalled = $true
            } catch {
                Write-Host "  ✗ Kunde inte installera Node.js: $_" -ForegroundColor Red
            }
        }
    }
    
    if (-not $nodeInstalled) {
        Write-Host "  → Ladda ned manuellt från: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

# Kolla npm (kommer med Node.js)
try {
    $npmCmd = Get-Command npm -ErrorAction Stop
    $npmVersion = & npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ npm: v$npmVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ npm är inte tillgängligt!" -ForegroundColor Red
    exit 1
}

# Kolla PostgreSQL
$pgInstalled = $false
try {
    $psqlCmd = Get-Command psql -ErrorAction Stop
    $pgVersion = & psql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ PostgreSQL: $pgVersion" -ForegroundColor Green
        $pgInstalled = $true
    }
} catch {
    Write-Host "  ✗ PostgreSQL är inte installerat!" -ForegroundColor Red
}

if (-not $pgInstalled) {
    Write-Host "  → Vill du installera PostgreSQL automatiskt? (y/n)" -ForegroundColor Yellow
    $installPg = Read-Host
    
    if ($installPg -eq "y") {
        if (-not $chocoInstalled) {
            Write-Host "  → Chocolatey behövs för automatisk installation" -ForegroundColor Yellow
            Write-Host "  → Installera Chocolatey? (y/n)" -ForegroundColor Yellow
            $installChoco = Read-Host
            if ($installChoco -eq "y") {
                $chocoInstalled = Install-Chocolatey
            }
        }
        
        if ($chocoInstalled) {
            Write-Host "  → Installerar PostgreSQL (detta kan ta några minuter)..." -ForegroundColor Yellow
            Write-Host "  → Standard lösenord för 'postgres' användare: postgres" -ForegroundColor Cyan
            try {
                & choco install postgresql --params '/Password:postgres' -y | Out-Null
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                Write-Host "  ✓ PostgreSQL installerat" -ForegroundColor Green
                Write-Host "  ℹ Lösenord för 'postgres': postgres" -ForegroundColor Cyan
                $pgInstalled = $true
            } catch {
                Write-Host "  ✗ Kunde inte installera PostgreSQL: $_" -ForegroundColor Red
            }
        }
    }
    
    if (-not $pgInstalled) {
        Write-Host "  → Ladda ned manuellt från: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# 2. Skapa databas
Write-Host "[2/9] Skapar databas..." -ForegroundColor Cyan

try {
    # Kolla om databas redan finns
    $dbExists = psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='dhl_lead_hunter'" 2>$null
    
    if ($dbExists -eq "1") {
        Write-Host "  ⚠ Databas finns redan. Vill du återskapa den? (y/n)" -ForegroundColor Yellow
        $response = Read-Host
        
        if ($response -eq "y") {
            psql -U postgres -c "DROP DATABASE dhl_lead_hunter;" | Out-Null
            Write-Host "  ✓ Gammal databas raderad" -ForegroundColor Green
        } else {
            Write-Host "  → Hoppar över databas-skapande" -ForegroundColor Yellow
            $skipDb = $true
        }
    }
    
    if (-not $skipDb) {
        psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;" | Out-Null
        Write-Host "  ✓ Databas skapad" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Kunde inte skapa databas: $_" -ForegroundColor Red
    exit 1
}

# 3. Skapa användare
Write-Host "[3/9] Skapar databas-användare..." -ForegroundColor Cyan

try {
    # Kolla om användare finns
    $userExists = psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='dhl_user'" 2>$null
    
    if ($userExists -eq "1") {
        Write-Host "  → Användare finns redan" -ForegroundColor Yellow
    } else {
        psql -U postgres -c "CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';" | Out-Null
        Write-Host "  ✓ Användare skapad" -ForegroundColor Green
    }
    
    # Ge rättigheter
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;" | Out-Null
    Write-Host "  ✓ Rättigheter tilldelade" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Kunde inte skapa användare: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Kör migrations
Write-Host "[4/9] Kör database migrations..." -ForegroundColor Cyan

try {
    if (-not $skipDb) {
        psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql | Out-Null
        Write-Host "  ✓ Tabeller skapade" -ForegroundColor Green
    } else {
        Write-Host "  → Hoppar över migrations" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Kunde inte köra migrations: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 5. Kopiera env-filer
Write-Host "[5/9] Kopierar environment-filer..." -ForegroundColor Cyan

# Frontend .env.local
if (Test-Path ".env.local") {
    Write-Host "  → .env.local finns redan" -ForegroundColor Yellow
} else {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "  ✓ .env.local skapad" -ForegroundColor Green
}

# Backend .env
if (Test-Path "server\.env") {
    Write-Host "  → server\.env finns redan" -ForegroundColor Yellow
} else {
    Copy-Item "server\.env.example" "server\.env"
    Write-Host "  ✓ server\.env skapad" -ForegroundColor Green
    
    # Uppdatera JWT_SECRET och SESSION_SECRET
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    $envContent = Get-Content "server\.env"
    $envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$jwtSecret"
    $envContent = $envContent -replace "SESSION_SECRET=.*", "SESSION_SECRET=$sessionSecret"
    $envContent | Set-Content "server\.env"
    
    Write-Host "  ✓ JWT_SECRET och SESSION_SECRET genererade" -ForegroundColor Green
}

Write-Host ""

# 6. Installera frontend dependencies
Write-Host "[6/9] Installerar frontend dependencies..." -ForegroundColor Cyan

if (Test-Path "node_modules") {
    Write-Host "  → node_modules finns redan" -ForegroundColor Yellow
} else {
    npm install | Out-Null
    Write-Host "  ✓ Frontend dependencies installerade" -ForegroundColor Green
}

Write-Host ""

# 7. Installera backend dependencies
Write-Host "[7/9] Installerar backend dependencies..." -ForegroundColor Cyan

Set-Location "server"

if (Test-Path "node_modules") {
    Write-Host "  → node_modules finns redan" -ForegroundColor Yellow
} else {
    npm install | Out-Null
    Write-Host "  ✓ Backend dependencies installerade" -ForegroundColor Green
}

Set-Location $ProjectRoot

Write-Host ""

# 8. Lägg till test-data
Write-Host "[8/9] Lägger till test-data..." -ForegroundColor Cyan

try {
    if (-not $skipDb) {
        Set-Location "server"
        npm run db:seed-test | Out-Null
        Set-Location $ProjectRoot
        Write-Host "  ✓ Test-data tillagd" -ForegroundColor Green
        Write-Host "    - 5 användare skapade" -ForegroundColor Gray
        Write-Host "    - 5 leads skapade" -ForegroundColor Gray
    } else {
        Write-Host "  → Hoppar över test-data" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Kunde inte lägga till test-data: $_" -ForegroundColor Red
    Set-Location $ProjectRoot
}

Write-Host ""

# 9. Verifiera installation
Write-Host "[9/9] Verifierar installation..." -ForegroundColor Cyan

try {
    $userCount = psql -U dhl_user -d dhl_lead_hunter -tAc "SELECT COUNT(*) FROM users;" 2>$null
    $leadCount = psql -U dhl_user -d dhl_lead_hunter -tAc "SELECT COUNT(*) FROM leads;" 2>$null
    
    Write-Host "  ✓ Databas: $userCount användare, $leadCount leads" -ForegroundColor Green
    Write-Host "  ✓ Frontend: node_modules finns" -ForegroundColor Green
    Write-Host "  ✓ Backend: node_modules finns" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Kunde inte verifiera: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Setup Klar!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Test-användare:" -ForegroundColor Cyan
Write-Host "  Email:    admin@dhl.se" -ForegroundColor White
Write-Host "  Password: Test123!" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  🌐 NÄSTA STEG: Aktivera Verklig Data" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Systemet fungerar nu med test-data." -ForegroundColor White
Write-Host "För att hämta VERKLIG data från API:er:" -ForegroundColor White
Write-Host ""
Write-Host "1. Hämta GRATIS API-nycklar:" -ForegroundColor Cyan
Write-Host "   - Gemini: https://aistudio.google.com/app/apikey" -ForegroundColor Gray
Write-Host "   - Groq:   https://console.groq.com/keys" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Lägg till i server\.env:" -ForegroundColor Cyan
Write-Host "   notepad server\.env" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Lägg till raderna:" -ForegroundColor Cyan
Write-Host "   GEMINI_API_KEY=AIzaSy...din_nyckel" -ForegroundColor Gray
Write-Host "   GROQ_API_KEY=gsk_...din_nyckel" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Starta om backend" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nu hämtas automatiskt:" -ForegroundColor Green
Write-Host "  ✓ Kontaktpersoner (VD, CFO, Logistics Manager)" -ForegroundColor White
Write-Host "  ✓ Nyheter (expansion, tillväxt, investeringar)" -ForegroundColor White
Write-Host "  ✓ Ekonomi (omsättning, kreditbetyg)" -ForegroundColor White
Write-Host "  ✓ E-commerce data (platform, leverantörer)" -ForegroundColor White
Write-Host "  ✓ AI-analys (sales pitch, opportunity score)" -ForegroundColor White
Write-Host ""
Write-Host "Se: REAL_DATA_SETUP.md för detaljer" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starta systemet:" -ForegroundColor Cyan
Write-Host "  .\start-local.bat" -ForegroundColor White
Write-Host ""
Write-Host "  Eller manuellt:" -ForegroundColor Gray
Write-Host "  Terminal 1: cd server && npm run dev" -ForegroundColor Gray
Write-Host "  Terminal 2: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "📚 Dokumentation:" -ForegroundColor Cyan
Write-Host "  QUICK_START.md           - Snabbstart" -ForegroundColor White
Write-Host "  REAL_DATA_SETUP.md       - API-nycklar & verklig data" -ForegroundColor White
Write-Host "  DATA_SOURCES_OVERVIEW.md - Vad hämtas?" -ForegroundColor White
Write-Host "  SETUP_COMMANDS.md        - Alla kommandon" -ForegroundColor White
Write-Host ""

# Fråga om användaren vill starta nu
Write-Host "Vill du starta systemet nu? (y/n)" -ForegroundColor Yellow
$startNow = Read-Host

if ($startNow -eq "y") {
    Write-Host ""
    Write-Host "Startar systemet..." -ForegroundColor Cyan
    .\start-local.bat
}
