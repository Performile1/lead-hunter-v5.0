@echo off
echo Startar om PostgreSQL-tjansten...
net stop postgresql-x64-18
timeout /t 3 /nobreak >nul
net start postgresql-x64-18
echo PostgreSQL-tjansten omstartad!
pause
