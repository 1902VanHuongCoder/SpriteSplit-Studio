@echo off
title SpriteSplit Studio
echo Dang khoi dong SpriteSplit Studio...
cd /d "%~dp0"
python main.py
if errorlevel 1 (
    echo.
    echo Phat hien loi, dang thu mo bang trinh duyet...
    python main.py --browser
)
pause

