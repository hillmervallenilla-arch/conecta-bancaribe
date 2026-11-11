# Conecta Bancaribe — Guía Windows V2.1.1

Entorno validado: Node.js 24.21.0 x64, npm 12.0.2 y better-sqlite3 12.2.0.

## Conflicto detectado
El equipo posee dos Node:
- `C:\Program Files (x86)\CA\SharedComponents\PEC\bin\node.exe` — no usar.
- `C:\Program Files\nodejs\node.exe` — Node validado.

El BAT antepone explícitamente el segundo al PATH.

## Arranque
Ejecute `INICIAR_BRM_VALUEFLOW.bat`.

El BAT valida el Node, npm, el binding exacto
`node_modules\better-sqlite3\build\Release\better_sqlite3.node`,
prueba SQLite en memoria, limpia `.next` y arranca Next.js.

## Recuperación manual
```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm install-scripts approve better-sqlite3
npm rebuild better-sqlite3 --foreground-scripts
Test-Path ".\node_modules\better-sqlite3\build\Release\better_sqlite3.node"
```
El último comando debe devolver `True`.

No ejecutar `npm audit fix --force` como parte del arranque.
