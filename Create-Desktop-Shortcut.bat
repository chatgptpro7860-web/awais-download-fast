@echo off
title Awais Download Fast - Create Desktop Shortcut
color 0B

echo ========================================================
echo       AWAIS DOWNLOAD FAST - DESKTOP SHORTCUT CREATOR
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
set TARGET_EXE=%SCRIPT_DIR%Awais-Download-Fast.exe
set TARGET_VBS=%SCRIPT_DIR%Awais-Download-Fast.vbs
set TARGET_BAT=%SCRIPT_DIR%start.bat
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Awais Download Fast.lnk

if exist "%TARGET_EXE%" (
    set LAUNCH_TARGET=%TARGET_EXE%
) else if exist "%TARGET_VBS%" (
    set LAUNCH_TARGET=%TARGET_VBS%
) else (
    set LAUNCH_TARGET=%TARGET_BAT%
)

echo Target Launcher: %LAUNCH_TARGET%
echo.

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%LAUNCH_TARGET%'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.Description = 'Awais Download Fast - High Speed Universal Video & MP3 Downloader'; $Shortcut.Save()"

if %errorlevel% equ 0 (
    echo [SUCCESS] Desktop Shortcut created successfully on your Desktop!
    echo Location: %SHORTCUT_PATH%
    echo.
    echo You can now launch Awais Download Fast directly by double clicking
    echo the icon on your Desktop anytime - completely standalone!
) else (
    echo [ERROR] Could not create shortcut automatically.
)

echo.
pause
