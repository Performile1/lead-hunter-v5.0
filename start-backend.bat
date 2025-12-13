@echo off
echo ========================================
echo   Startar DHL Lead Hunter Backend
echo ========================================
echo.

cd server

echo [1/2] Kontrollerar dependencies...
if not exist "node_modules" (
    echo   [!] node_modules saknas, installerar...
    call npm install
) else (
    echo   [OK] node_modules finns
)

echo.
echo [2/2] Startar backend-server...
echo   Backend kommer att kora pa: http://localhost:3001
echo.

npm run dev
