@echo off
rem Double-click to publish the changes in this folder (HOLLOW) to GitHub and the website.
rem Only files inside this game's folder are included.
cd /d "%~dp0"
git add -A .
git diff --cached --quiet
if not errorlevel 1 (
  echo Nothing new to publish.
  pause
  exit /b 0
)
git commit -m "Update HOLLOW %date% %time%"
git push origin main
if errorlevel 1 (
  echo.
  echo PUSH FAILED - read the message above.
  pause
  exit /b 1
)
echo.
echo Published. The website updates in about a minute:
echo https://redfire3248.github.io/Commando/hollow/
pause
