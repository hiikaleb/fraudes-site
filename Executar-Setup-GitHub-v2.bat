@echo off
setlocal
title Setup GitHub - Windows 11 v2

cd /d "%~dp0"

echo.
echo ============================================================
echo             SETUP GITHUB - WINDOWS 11 v2
echo ============================================================
echo.
echo Este programa permite escolher a pasta do projeto.
echo Ele NAO vai usar C:\Windows\System32.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Setup-GitHub-v2.ps1"

set "EXITCODE=%ERRORLEVEL%"

echo.
echo ============================================================
if "%EXITCODE%"=="0" (
    echo                  PROCESSO CONCLUIDO
) else (
    echo                    ERRO
    echo Codigo de saida: %EXITCODE%
)
echo ============================================================
echo.
pause
exit /b %EXITCODE%
