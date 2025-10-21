@echo off
echo ================================
echo RouteWise AI - Setup Verification
echo ================================
echo.

echo Checking directory structure...
echo.

if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [MISSING] package.json
)

if exist "lib\auth0.ts" (
    echo [OK] lib\auth0.ts found
) else (
    echo [MISSING] lib\auth0.ts
)

if exist "agents\BaseAgent.ts" (
    echo [OK] agents\BaseAgent.ts found
) else (
    echo [MISSING] agents\BaseAgent.ts
)

if exist "services\spotify.ts" (
    echo [OK] services\spotify.ts found
) else (
    echo [MISSING] services\spotify.ts
)

echo.
echo Checking files that need to be copied from artifacts...
echo.

if exist "agents\RidePreparationAgent.ts" (
    echo [OK] agents\RidePreparationAgent.ts found
) else (
    echo [TODO] agents\RidePreparationAgent.ts - Copy from artifact 'agents_ride_prep'
)

if exist "scripts\demo.ts" (
    echo [OK] scripts\demo.ts found
) else (
    echo [TODO] scripts\demo.ts - Copy from artifact 'demo_script'
)

if exist "agents\ConsentNegotiationAgent.ts" (
    echo [OK] agents\ConsentNegotiationAgent.ts found
) else (
    echo [TODO] agents\ConsentNegotiationAgent.ts - Copy from artifact 'agents_consent'
)

if exist "agents\SafetyMonitoringAgent.ts" (
    echo [OK] agents\SafetyMonitoringAgent.ts found
) else (
    echo [TODO] agents\SafetyMonitoringAgent.ts - Copy from artifact 'agents_safety'
)

if exist "app\api\agent\prepare-ride\route.ts" (
    echo [OK] app\api\agent\prepare-ride\route.ts found
) else (
    echo [TODO] app\api\agent\prepare-ride\route.ts - Copy from artifact 'api_prepare_ride'
)

if exist "app\api\agent\negotiate-consent\route.ts" (
    echo [OK] app\api\agent\negotiate-consent\route.ts found
) else (
    echo [TODO] app\api\agent\negotiate-consent\route.ts - Copy from artifact 'api_consent'
)

echo.
echo Checking environment configuration...
echo.

if exist ".env.local" (
    echo [OK] .env.local found
) else (
    echo [TODO] .env.local - Copy from .env.example and configure
)

if exist "node_modules" (
    echo [OK] node_modules found - dependencies installed
) else (
    echo [TODO] Run: npm install
)

echo.
echo ================================
echo Next Steps:
echo ================================
echo 1. Copy missing files from conversation artifacts
echo 2. Copy .env.example to .env.local and configure
echo 3. Run: npm install
echo 4. Run: npm run demo
echo.
echo See ARTIFACT_REFERENCE.md for copy instructions
echo See SETUP_INSTRUCTIONS.md for detailed setup
echo.
pause
