@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ============================================================
echo  Conecta Bancaribe Framework - Bancaribe - V3.0
echo ============================================================
set "NODE_DIR=C:\Program Files\nodejs"
set "NODE_EXE=%NODE_DIR%\node.exe"
if not exist "%NODE_EXE%" goto :node_error
set "PATH=%NODE_DIR%;%PATH%"
echo [1/5] Node validado:
"%NODE_EXE%" --version
echo [2/5] npm:
call npm --version
if errorlevel 1 goto :error
if not exist "node_modules" (
 echo [3/5] Instalando dependencias...
 call npm install
 if errorlevel 1 goto :error
) else (echo [3/5] node_modules existente.)
echo [4/5] Validando better-sqlite3...
set "BINDING=node_modules\better-sqlite3\build\Release\better_sqlite3.node"
if not exist "%BINDING%" (
 echo Binding no encontrado. Aprobando y reconstruyendo...
 call npm install-scripts approve better-sqlite3
 if errorlevel 1 goto :sqlite_error
 call npm rebuild better-sqlite3 --foreground-scripts
 if errorlevel 1 goto :sqlite_error
)
if not exist "%BINDING%" goto :sqlite_error
"%NODE_EXE%" -e "const Database=require('better-sqlite3');const db=new Database(':memory:');db.close();"
if errorlevel 1 goto :sqlite_error
echo [OK] better-sqlite3 operativo.
echo [5/5] Iniciando Conecta Bancaribe...
if exist ".next" rmdir /s /q ".next"
echo Aplicacion: http://localhost:3000
echo Para detener: Ctrl+C
call npm run dev
goto :eof
:node_error
echo [ERROR] No se encontro C:\Program Files\nodejs\node.exe
echo No se utilizara el Node de CA/PEC.
pause
exit /b 1
:sqlite_error
echo [ERROR] better-sqlite3 no quedo operativo.
echo Consulte GUIA_INSTALACION_WINDOWS.md
pause
exit /b 2
:error
echo [ERROR] Fallo durante el arranque.
pause
exit /b 1
