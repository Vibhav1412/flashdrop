@echo off
title FlashDrop - Backend Database Functions Menu (PES CSE Evaluation)
cd /d "%~dp0"
echo =====================================================================
echo  FLASHDROP BACKEND DATABASE FUNCTIONS EXAMINER MENU
echo  Connecting to MySQL 8.0 and Redis 7.2...
echo =====================================================================
echo.
node scripts/backend_functions_menu.js
pause
