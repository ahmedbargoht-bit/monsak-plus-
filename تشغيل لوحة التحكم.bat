@echo off
setlocal
set "FILE=%~dp0mt-admin.html"
set "URL=file:///%FILE:\=/%"
set "C1=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "C2=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "C3=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
set "E1=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "E2=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "B="
if exist "%C1%" set "B=%C1%"
if not defined B if exist "%C2%" set "B=%C2%"
if not defined B if exist "%C3%" set "B=%C3%"
if not defined B if exist "%E1%" set "B=%E1%"
if not defined B if exist "%E2%" set "B=%E2%"
if defined B (
  start "" "%B%" --app="%URL%" --window-size=1400,900 --window-position=50,30
) else (
  start "" "%FILE%"
)
endlocal
