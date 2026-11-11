# Conecta Bancaribe V4.11.3 — Docker Linux POC

**Uso exclusivo en entorno corporativo autorizado. No es una versión certificada para producción.**

Este repositorio contiene la aplicación de demostración y archivos Docker. Autenticación DEMO y SQLite siguen activos; Microsoft Entra ID y SQL Server 2022 son objetivos pendientes.

## Antes de publicar
1. Obtener aprobación formal para el uso de GitHub y la organización corporativa de destino.
2. Revisar manualmente todo el código, documentación, historial, imágenes, datos de demostración y licencias de terceros para detectar información sensible o restringida.
3. Ejecutar escaneo de secretos y análisis de dependencias según políticas del banco.
4. Confirmar que ningún archivo `.env`, credencial, token, certificado privado o base de datos real será publicado.
5. Crear repositorio **privado**, habilitar MFA, revisión de acceso y protección de ramas.

## Publicación inicial (desde la raíz)
```bash
git init
git branch -M main
git add .
git status
git commit -m "Conecta Bancaribe V4.11.3 Docker Linux POC"
git remote add origin https://github.com/ORGANIZACION/conecta-bancaribe.git
git push -u origin main
```
Sustituir ORGANIZACION solo cuando la cuenta corporativa autorizada esté definida. No se han creado repositorios remotos.

## Prueba Docker en host Linux autorizado
```bash
cp .env.docker.example .env
# Revisar y ajustar .env; nunca confirmar este archivo en Git
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=100
```
El servicio publica el puerto 3000 solo en `127.0.0.1`; el acceso remoto necesita proxy inverso aprobado. Revisar la guía `GUIA_DOCKER_LINUX.md`.

## Versionado sugerido
- `main`: línea técnica validada, mediante pull requests
- `develop`: integración de cambios
- `feature/entra-id`: integración de autenticación
- `feature/sqlserver-2022`: migración de persistencia
- Etiqueta inicial sugerida: `v4.11.3-docker-poc`

## Estado de verificación
El paquete fue organizado y analizado estáticamente. No se realizó `docker build`, ejecución de Next.js ni auditoría exhaustiva de seguridad.
