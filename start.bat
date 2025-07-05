@echo off
REM Drinking Nights Tracker - Windows Start Script

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    pause
    exit /b
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed. Please install npm first.
    pause
    exit /b
)

REM Set server to localhost for local testing
set HOST=localhost
set PORT=3000

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

REM Start the server
echo Starting Drinking Nights Tracker server on %HOST%:%PORT%...
node server.js

pause 