@echo off
rem Double-click to play. Starts the local server and opens the game in your browser.
cd /d "%~dp0"
start "" http://localhost:8080
node server\dev-server.js
pause
