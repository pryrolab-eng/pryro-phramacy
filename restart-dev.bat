@echo off
echo Restarting Next.js dev server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
cd /d d:\pryrox
start cmd /k npm run dev
