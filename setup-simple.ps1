# DHL Lead Hunter - Setup med Automatisk Installation
# Kor med: .\setup-simple.ps1
# MASTE koras som Administrator!

$ErrorActionPreference = "Stop"
$ProjectRoot = "c:\Users\A\Downloads\lead-hunter-v5.0"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  DHL Lead Hunter - Setup" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Kolla om PowerShell kors som Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] Detta script maste koras som Administrator!" -ForegroundColor Red
    Write-Host "    Hogerklicka pa PowerShell och valj 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Navigera till projekt
Set-Location $ProjectRoot

# 1. Kolla dependencies
Write-Host "[1/9] Kollar dependencies..." -ForegroundColor Cyan

# Kolla Node.js
$nodeInstalled = $false
try {
    $nodeCmd = Get-Command node -ErrorAction Stop
    $nodeVersion = & node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
        $nodeInstalled = $true
    }
} catch {
    Write-Host "  [X] Node.js ar inte installerat!" -ForegroundColor Red
}

if (-not $nodeInstalled) {
    Write-Host ""
    Write-Host "  Installera Node.js manuellt:" -ForegroundColor Yellow
    Write-Host "  1. Ga till: https://nodejs.org/" -ForegroundColor White
    Write-Host "  2. Ladda ned LTS-versionen" -ForegroundColor White
    Write-Host "  3. Installera och starta om PowerShell" -ForegroundColor White
    Write-Host "  4. Kor detta script igen" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Kolla npm
try {
    $npmCmd = Get-Command npm -ErrorAction Stop
    $npmVersion = & npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] npm: v$npmVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "  [X] npm ar inte tillgangligt!" -ForegroundColor Red
    exit 1
}

# Kolla Chocolatey
$chocoInstalled = $false
try {
    $chocoCmd = Get-Command choco -ErrorAction Stop
    $chocoVersion = & choco --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Chocolatey: v$chocoVersion" -ForegroundColor Green
        $chocoInstalled = $true
    }
} catch {
    Write-Host "  [X] Chocolatey ar inte installerat!" -ForegroundColor Red
}

# Installera Chocolatey om det saknas
if (-not $chocoInstalled) {
    Write-Host "  [->] Installerar Chocolatey..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Uppdatera PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        # Verifiera installation
        $chocoCmd = Get-Command choco -ErrorAction Stop
        Write-Host "  [OK] Chocolatey installerat!" -ForegroundColor Green
        $chocoInstalled = $true
    } catch {
        Write-Host "  [X] Kunde inte installera Chocolatey: $_" -ForegroundColor Red
        Write-Host "      Installera manuellt: https://chocolatey.org/install" -ForegroundColor Yellow
        exit 1
    }
}

# Kolla PostgreSQL
$pgInstalled = $false
try {
    $psqlCmd = Get-Command psql -ErrorAction Stop
    $pgVersion = & psql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] PostgreSQL: $pgVersion" -ForegroundColor Green
        $pgInstalled = $true
        
        # Kontrollera och starta tjansten direkt om PostgreSQL redan finns
        Write-Host "  [->] Kontrollerar PostgreSQL-tjanst..." -ForegroundColor Cyan
        $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($pgService) {
            # Konfigurera pg_hba.conf for trust mode om det behovs
            $pgDataDir = "C:\Program Files\PostgreSQL\18\data"
            if (-not (Test-Path $pgDataDir)) {
                $pgDataDir = "C:\PostgreSQL\18\data"
            }
            
            $pgHbaPath = Join-Path $pgDataDir "pg_hba.conf"
            if (Test-Path $pgHbaPath) {
                $hbaContent = Get-Content $pgHbaPath -Raw
                if ($hbaContent -notmatch "trust") {
                    Write-Host "  [->] Konfigurerar PostgreSQL autentisering..." -ForegroundColor Yellow
                    $newHbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
"@
                    $newHbaContent | Set-Content $pgHbaPath -Encoding UTF8
                    Write-Host "  [OK] Autentisering konfigurerad" -ForegroundColor Green
                    
                    # Starta om tjansten for att ladda ny konfiguration
                    if ($pgService.Status -eq "Running") {
                        Write-Host "  [->] Startar om PostgreSQL-tjanst..." -ForegroundColor Yellow
                        Restart-Service $pgService.Name
                        Start-Sleep -Seconds 5
                        Write-Host "  [OK] PostgreSQL-tjanst omstartad" -ForegroundColor Green
                    }
                }
            }
            
            if ($pgService.Status -ne "Running") {
                Write-Host "  [->] Startar PostgreSQL-tjanst..." -ForegroundColor Yellow
                Start-Service $pgService.Name
                Start-Sleep -Seconds 5
                Write-Host "  [OK] PostgreSQL-tjanst startad" -ForegroundColor Green
            } else {
                Write-Host "  [OK] PostgreSQL-tjanst kor" -ForegroundColor Green
            }
            
            # Skapa pgpass.conf for automatisk losenordshantering
            Write-Host "  [->] Konfigurerar losenordshantering..." -ForegroundColor Yellow
            $pgpassFile = "$env:APPDATA\postgresql\pgpass.conf"
            $pgpassDir = Split-Path $pgpassFile
            if (-not (Test-Path $pgpassDir)) {
                New-Item -ItemType Directory -Path $pgpassDir -Force | Out-Null
            }
            "localhost:5432:*:postgres:postgres" | Set-Content $pgpassFile -Encoding ASCII
            Write-Host "  [OK] Losenord konfigurerat (pgpass.conf)" -ForegroundColor Green
        } else {
            Write-Host "  [!] PostgreSQL-tjanst finns inte, initierar..." -ForegroundColor Yellow
            
            # Hitta PostgreSQL data directory
            $pgDataDir = "C:\Program Files\PostgreSQL\18\data"
            if (-not (Test-Path $pgDataDir)) {
                $pgDataDir = "C:\PostgreSQL\18\data"
            }
            
            # Initiera PostgreSQL om data directory inte finns
            if (-not (Test-Path "$pgDataDir\postgresql.conf")) {
                Write-Host "  [->] Initierar PostgreSQL databas..." -ForegroundColor Yellow
                $pgBinPath = Split-Path (Get-Command psql -ErrorAction Stop).Source
                $initdbPath = Join-Path $pgBinPath "initdb.exe"
                
                if (Test-Path $initdbPath) {
                    New-Item -ItemType Directory -Path $pgDataDir -Force | Out-Null
                    & $initdbPath -D $pgDataDir -U postgres --pwfile=<(echo "postgres") -E UTF8 --locale=C 2>&1 | Out-Null
                    Write-Host "  [OK] PostgreSQL databas initierad" -ForegroundColor Green
                }
            }
            
            # Konfigurera pg_hba.conf for lokal anslutning
            $pgHbaPath = Join-Path $pgDataDir "pg_hba.conf"
            if (Test-Path $pgHbaPath) {
                Write-Host "  [->] Konfigurerar PostgreSQL autentisering..." -ForegroundColor Yellow
                $hbaContent = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
"@
                $hbaContent | Set-Content $pgHbaPath -Encoding UTF8
                Write-Host "  [OK] Autentisering konfigurerad (trust mode)" -ForegroundColor Green
            }
            
            # Registrera och starta tjansten
            Write-Host "  [->] Registrerar PostgreSQL-tjanst..." -ForegroundColor Yellow
            $pgBinPath = Split-Path (Get-Command psql -ErrorAction Stop).Source
            $pgCtlPath = Join-Path $pgBinPath "pg_ctl.exe"
            
            if (Test-Path $pgCtlPath) {
                & $pgCtlPath register -N "postgresql-x64-18" -D $pgDataDir 2>&1 | Out-Null
                Start-Sleep -Seconds 2
                Start-Service "postgresql-x64-18" -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 5
                Write-Host "  [OK] PostgreSQL-tjanst registrerad och startad" -ForegroundColor Green
                
                # Satt losenord for postgres anvandare
                Write-Host "  [->] Satter losenord for postgres anvandare..." -ForegroundColor Yellow
                $env:PGPASSWORD = ""
                & psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>&1 | Out-Null
                $env:PGPASSWORD = "postgres"
                Write-Host "  [OK] Losenord satt till: postgres" -ForegroundColor Green
            } else {
                Write-Host "  [!] Kunde inte registrera tjanst" -ForegroundColor Yellow
                Write-Host "      Starta PostgreSQL manuellt med: pg_ctl -D `"$pgDataDir`" start" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "  [X] PostgreSQL ar inte installerat!" -ForegroundColor Red
}

# Installera PostgreSQL om det saknas
if (-not $pgInstalled) {
    Write-Host "  [->] Installerar PostgreSQL (detta tar 2-5 minuter)..." -ForegroundColor Yellow
    Write-Host "      Losenord for 'postgres' anvandare: postgres" -ForegroundColor Cyan
    
    $chocoOutput = & choco install postgresql --params '/Password:postgres' -y 2>&1
    
    # Kolla om PostgreSQL redan var installerat
    if ($chocoOutput -match "already installed") {
        Write-Host "  [OK] PostgreSQL redan installerat (v18.1.0)" -ForegroundColor Green
        Write-Host "      Losenord for 'postgres': postgres" -ForegroundColor Cyan
        
        # Forsok hitta PostgreSQL i Program Files
        $pgPaths = @(
            "C:\Program Files\PostgreSQL\18\bin",
            "C:\Program Files\PostgreSQL\17\bin",
            "C:\Program Files\PostgreSQL\16\bin",
            "C:\Program Files (x86)\PostgreSQL\18\bin",
            "C:\Program Files (x86)\PostgreSQL\17\bin"
        )
        
        $pgFound = $false
        foreach ($pgPath in $pgPaths) {
            if (Test-Path "$pgPath\psql.exe") {
                Write-Host "  [->] Hittade PostgreSQL i: $pgPath" -ForegroundColor Cyan
                $env:Path = "$pgPath;" + $env:Path
                $pgFound = $true
                $pgInstalled = $true
                break
            }
        }
        
        if (-not $pgFound) {
            Write-Host "  [!] PostgreSQL ar installerat men kunde inte hittas automatiskt." -ForegroundColor Yellow
            Write-Host "      Lagg till PostgreSQL bin-mappen i PATH manuellt." -ForegroundColor Yellow
            Write-Host "      Vanligtvis: C:\Program Files\PostgreSQL\18\bin" -ForegroundColor Yellow
            Write-Host ""
            exit 1
        }
        
        # Starta PostgreSQL-tjansten om den inte kor
        Write-Host "  [->] Kontrollerar PostgreSQL-tjanst..." -ForegroundColor Cyan
        $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($pgService) {
            if ($pgService.Status -ne "Running") {
                Write-Host "  [->] Startar PostgreSQL-tjanst..." -ForegroundColor Yellow
                Start-Service $pgService.Name
                Start-Sleep -Seconds 3
                Write-Host "  [OK] PostgreSQL-tjanst startad" -ForegroundColor Green
            } else {
                Write-Host "  [OK] PostgreSQL-tjanst kor redan" -ForegroundColor Green
            }
        } else {
            Write-Host "  [!] PostgreSQL-tjanst finns inte, initierar databas..." -ForegroundColor Yellow
            
            # Hitta PostgreSQL data directory
            $pgDataDir = "C:\Program Files\PostgreSQL\18\data"
            if (-not (Test-Path $pgDataDir)) {
                $pgDataDir = "C:\PostgreSQL\18\data"
            }
            
            # Initiera PostgreSQL om data directory inte finns
            if (-not (Test-Path "$pgDataDir\postgresql.conf")) {
                Write-Host "  [->] Initierar PostgreSQL databas..." -ForegroundColor Yellow
                $pgBinPath = Split-Path (Get-Command psql -ErrorAction Stop).Source
                $initdbPath = Join-Path $pgBinPath "initdb.exe"
                
                if (Test-Path $initdbPath) {
                    & $initdbPath -D $pgDataDir -U postgres -W -E UTF8 --locale=C
                    Write-Host "  [OK] PostgreSQL databas initierad" -ForegroundColor Green
                }
            }
            
            # Registrera och starta tjansten
            Write-Host "  [->] Registrerar PostgreSQL-tjanst..." -ForegroundColor Yellow
            $pgBinPath = Split-Path (Get-Command psql -ErrorAction Stop).Source
            $pgCtlPath = Join-Path $pgBinPath "pg_ctl.exe"
            
            if (Test-Path $pgCtlPath) {
                & $pgCtlPath register -N "postgresql-x64-18" -D $pgDataDir -U postgres
                Start-Sleep -Seconds 2
                Start-Service "postgresql-x64-18" -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 3
                Write-Host "  [OK] PostgreSQL-tjanst registrerad och startad" -ForegroundColor Green
            } else {
                Write-Host "  [!] Kunde inte registrera tjanst automatiskt" -ForegroundColor Yellow
                Write-Host "      Kor manuellt: pg_ctl register -N postgresql-x64-18 -D $pgDataDir" -ForegroundColor Yellow
            }
        }
    } else {
        # Ny installation
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "  [OK] PostgreSQL installerat!" -ForegroundColor Green
        Write-Host "      Losenord for 'postgres': postgres" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  [!] VIKTIGT: Starta om PowerShell som Admin och kor scriptet igen!" -ForegroundColor Yellow
        Write-Host "      PostgreSQL PATH uppdateras forst efter omstart." -ForegroundColor Yellow
        Write-Host ""
        exit 0
    }
}

Write-Host ""

# 2. Skapa databas
Write-Host "[2/9] Skapar databas..." -ForegroundColor Cyan

try {
    # Kolla om databas redan finns
    $dbExists = psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='dhl_lead_hunter'" 2>$null
    
    if ($dbExists -eq "1") {
        Write-Host "  [!] Databas finns redan. Vill du aterskapa den? (y/n)" -ForegroundColor Yellow
        $response = Read-Host
        
        if ($response -eq "y") {
            psql -U postgres -c "DROP DATABASE dhl_lead_hunter;" | Out-Null
            Write-Host "  [OK] Gammal databas raderad" -ForegroundColor Green
        } else {
            Write-Host "  [->] Hoppar over databas-skapande" -ForegroundColor Yellow
            $skipDb = $true
        }
    }
    
    if (-not $skipDb) {
        psql -U postgres -c "CREATE DATABASE dhl_lead_hunter;" | Out-Null
        Write-Host "  [OK] Databas skapad" -ForegroundColor Green
    }
} catch {
    Write-Host "  [X] Kunde inte skapa databas: $_" -ForegroundColor Red
    Write-Host "      Kontrollera att PostgreSQL-tjansten kor." -ForegroundColor Yellow
    exit 1
}

# 3. Skapa anvandare
Write-Host "[3/9] Skapar databas-anvandare..." -ForegroundColor Cyan

try {
    # Kolla om anvandare finns
    $userExists = psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='dhl_user'" 2>$null
    
    if ($userExists -eq "1") {
        Write-Host "  [->] Anvandare finns redan" -ForegroundColor Yellow
    } else {
        psql -U postgres -c "CREATE USER dhl_user WITH PASSWORD 'SecurePassword123!';" | Out-Null
        Write-Host "  [OK] Anvandare skapad" -ForegroundColor Green
    }
    
    # Ge rattigheter
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dhl_lead_hunter TO dhl_user;" | Out-Null
    Write-Host "  [OK] Rattigheter tilldelade" -ForegroundColor Green
} catch {
    Write-Host "  [X] Kunde inte skapa anvandare: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Kor migrations
Write-Host "[4/9] Kor database migrations..." -ForegroundColor Cyan

try {
    if (-not $skipDb) {
        psql -U dhl_user -d dhl_lead_hunter -f DATABASE_SCHEMA.sql | Out-Null
        Write-Host "  [OK] Tabeller skapade" -ForegroundColor Green
    } else {
        Write-Host "  [->] Hoppar over migrations" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [X] Kunde inte kora migrations: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 5. Kopiera env-filer
Write-Host "[5/9] Kopierar environment-filer..." -ForegroundColor Cyan

# Frontend .env.local
if (Test-Path ".env.local") {
    Write-Host "  [->] .env.local finns redan" -ForegroundColor Yellow
} else {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "  [OK] .env.local skapad" -ForegroundColor Green
}

# Backend .env
if (Test-Path "server\.env") {
    Write-Host "  [->] server\.env finns redan" -ForegroundColor Yellow
} else {
    Copy-Item "server\.env.example" "server\.env"
    Write-Host "  [OK] server\.env skapad" -ForegroundColor Green
    
    # Uppdatera JWT_SECRET och SESSION_SECRET
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    $envContent = Get-Content "server\.env"
    $envContent = $envContent -replace "JWT_SECRET=.*", "JWT_SECRET=$jwtSecret"
    $envContent = $envContent -replace "SESSION_SECRET=.*", "SESSION_SECRET=$sessionSecret"
    $envContent | Set-Content "server\.env"
    
    Write-Host "  [OK] JWT_SECRET och SESSION_SECRET genererade" -ForegroundColor Green
}

Write-Host ""

# 6. Installera frontend dependencies
Write-Host "[6/9] Installerar frontend dependencies..." -ForegroundColor Cyan

if (Test-Path "node_modules") {
    Write-Host "  [->] node_modules finns redan" -ForegroundColor Yellow
} else {
    npm install | Out-Null
    Write-Host "  [OK] Frontend dependencies installerade" -ForegroundColor Green
}

Write-Host ""

# 7. Installera backend dependencies
Write-Host "[7/9] Installerar backend dependencies..." -ForegroundColor Cyan

Set-Location "server"

if (Test-Path "node_modules") {
    Write-Host "  [->] node_modules finns redan" -ForegroundColor Yellow
} else {
    npm install | Out-Null
    Write-Host "  [OK] Backend dependencies installerade" -ForegroundColor Green
}

Set-Location $ProjectRoot

Write-Host ""

# 8. Lagg till test-data
Write-Host "[8/9] Lagger till test-data..." -ForegroundColor Cyan

try {
    if (-not $skipDb) {
        Set-Location "server"
        npm run db:seed-test | Out-Null
        Set-Location $ProjectRoot
        Write-Host "  [OK] Test-data tillagd" -ForegroundColor Green
        Write-Host "    - 5 anvandare skapade" -ForegroundColor Gray
        Write-Host "    - 5 leads skapade" -ForegroundColor Gray
    } else {
        Write-Host "  [->] Hoppar over test-data" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [X] Kunde inte lagga till test-data: $_" -ForegroundColor Red
    Set-Location $ProjectRoot
}

Write-Host ""

# 9. Verifiera installation
Write-Host "[9/9] Verifierar installation..." -ForegroundColor Cyan

try {
    $userCount = psql -U dhl_user -d dhl_lead_hunter -tAc "SELECT COUNT(*) FROM users;" 2>$null
    $leadCount = psql -U dhl_user -d dhl_lead_hunter -tAc "SELECT COUNT(*) FROM leads;" 2>$null
    
    Write-Host "  [OK] Databas: $userCount anvandare, $leadCount leads" -ForegroundColor Green
    Write-Host "  [OK] Frontend: node_modules finns" -ForegroundColor Green
    Write-Host "  [OK] Backend: node_modules finns" -ForegroundColor Green
} catch {
    Write-Host "  [!] Kunde inte verifiera: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  [OK] Setup Klar!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test-anvandare:" -ForegroundColor Cyan
Write-Host "  Email:    admin@dhl.se" -ForegroundColor White
Write-Host "  Password: Test123!" -ForegroundColor White
Write-Host ""
Write-Host "Starta systemet:" -ForegroundColor Cyan
Write-Host "  .\start-local.bat" -ForegroundColor White
Write-Host ""
Write-Host "  Eller manuellt:" -ForegroundColor Gray
Write-Host "  Terminal 1: cd server && npm run dev" -ForegroundColor Gray
Write-Host "  Terminal 2: npm run dev" -ForegroundColor Gray
Write-Host ""