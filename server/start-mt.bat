@echo off
echo Starting DHL Lead Hunter Backend (Multi-Tenant DB)...
echo Database: lead_hunter_mt
echo.

cd /d "%~dp0"
set DOTENV_CONFIG_PATH=.env.mt
node index.js

pause
