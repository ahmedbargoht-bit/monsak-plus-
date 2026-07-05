@echo off
chcp 65001 >nul
set "FILE=%~dp0mansek-admin.html"
set "TITLE=لوحة التحكم - الطحان للتمور"

:: ── جرب Chrome أولاً ──
set "CHROME1=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "CHROME2=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
set "CHROME3=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"

if exist "%CHROME1%" (
  start "" "%CHROME1%" --app="file:///%FILE:\=/%" --window-size=1400,900 --window-position=50,30
  goto :end
)
if exist "%CHROME2%" (
  start "" "%CHROME2%" --app="file:///%FILE:\=/%" --window-size=1400,900 --window-position=50,30
  goto :end
)
if exist "%CHROME3%" (
  start "" "%CHROME3%" --app="file:///%FILE:\=/%" --window-size=1400,900 --window-position=50,30
  goto :end
)

:: ── جرب Edge ──
set "EDGE1=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
set "EDGE2=C:\Program Files\Microsoft\Edge\Application\msedge.exe"

if exist "%EDGE1%" (
  start "" "%EDGE1%" --app="file:///%FILE:\=/%" --window-size=1400,900 --window-position=50,30
  goto :end
)
if exist "%EDGE2%" (
  start "" "%EDGE2%" --app="file:///%FILE:\=/%" --window-size=1400,900 --window-position=50,30
  goto :end
)

:: ── fallback: فتح عادي في المتصفح الافتراضي ──
start "" "%FILE%"

:end
