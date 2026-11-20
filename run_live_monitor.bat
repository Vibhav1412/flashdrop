@echo off
title FlashDrop - Real-Time Mission Control Live Monitor (MySQL 8.0 + Redis 7.2)
cd /d "%~dp0"
echo =====================================================================
echo  FLASHDROP DUAL-ENGINE REAL-TIME MISSION CONTROL MONITOR
echo  Connecting to MySQL 8.0 (127.0.0.1:3306) and Redis 7.2 (127.0.0.1:6379)...
echo  Keep this CMD window open side-by-side with your browser!
echo =====================================================================
echo.
node scripts/live_monitor.js
pause
