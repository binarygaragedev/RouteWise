@echo off
REM RouteWise AI - Quick Demo Setup Script (Windows)
REM Run this before your contest presentation

echo 🚀 ROUTEWISE AI - CONTEST DEMO SETUP
echo ======================================

REM Check if app is running
echo 📋 Checking if app is running...
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ App is running on http://localhost:3001
) else (
    echo ❌ App not running. Starting now...
    start /b npm run dev
    echo ⏳ Waiting for app to start...
    timeout /t 10 /nobreak >nul
)

echo.
echo 🌐 DEMO URLS - Open these in separate browser tabs:
echo ======================================================
echo 📱 Passenger Dashboard: http://localhost:3001/dashboard
echo 🚕 Driver Dashboard:    http://localhost:3001/driver-dashboard
echo 🎛️  Admin Panel:         http://localhost:3001/admin
echo 🚨 Emergency Center:    http://localhost:3001/emergency

echo.
echo 🤖 AI AGENTS TEST:
echo ==================
echo 1. Go to Passenger Dashboard
echo 2. Login with Auth0
echo 3. Click '🚀 Test Production APIs' button
echo 4. Watch real OpenAI response!

echo.
echo 📊 FULL DEMO COMMAND:
echo ====================
echo Run this to show all agents working:
echo npm run demo

echo.
echo 🎯 DEMO READY! Good luck in your contest! 🏆
pause