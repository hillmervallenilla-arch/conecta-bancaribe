# Conecta Bancaribe V4.11.3 — Docker Linux (prueba de concepto)

## Estado
Paquete para **validación técnica**, no listo para Producción. Se ha conservado el código funcional original V4.11.3. La aplicación sigue usando SQLite, login DEMO y persistencia en volumen Docker. La integración con SQL Server 2022 y Microsoft Entra ID **no está implementada** en este paquete.

## Requisitos
- Servidor Linux con Docker Engine y plugin Docker Compose.
- Acceso autorizado a un repositorio de paquetes npm durante la construcción o imagen construida previamente en un entorno autorizado.
- Recursos y reglas de red aprobados por Infraestructura y Seguridad.

## Instalación
1. Descomprimir en el servidor Linux.
2. Ejecutar `cp .env.docker.example .env` y ajustar los parámetros autorizados; nunca guardar secretos en el repositorio.
3. Ejecutar `docker compose build`.
4. Ejecutar `docker compose up -d`.
5. Consultar `docker compose logs -f conecta`.
6. Verificar localmente `http://127.0.0.1:3000` desde el host. Para usuarios remotos configurar proxy inverso con HTTPS y acceso corporativo.
7. Detener con `docker compose down` (sin `-v`, para preservar el volumen).

## Advertencias y limitaciones
- **No exponer directamente a Internet.** El puerto se publica solo en loopback para integrar un proxy inverso autorizado.
- La aplicación usa una cookie de sesión DEMO basada en ID de usuario; **no** es autenticación corporativa segura. Restringir pruebas a un entorno aislado y datos ficticios.
- La base de datos se crea en `/app/data/prototipo.db` al inicializar el módulo y se conserva en el volumen `conecta_demo_data`. Los datos de ejemplo de la demo pueden inicializarse automáticamente.
- La base de datos incluida en el ZIP original **no se incorpora** a esta imagen, para evitar distribuir datos del entorno anterior. Si se requiere migrar datos de prueba, hacer copia y restauración controlada.
- La configuración SMTP está deshabilitada por defecto. Nunca reutilizar credenciales de ejemplos.
- Los anexos requieren pruebas de persistencia y seguridad; revisar dónde se guardan antes de autorizar su uso.
- La imagen está basada en Debian (glibc), compatible con el módulo nativo `better-sqlite3`; la construcción requiere npm.
- Este paquete **no ha superado una construcción y ejecución Docker real** en este entorno. Infraestructura debe ejecutar las pruebas.

## Pruebas mínimas
- `docker compose config` valida el manifiesto.
- `docker compose build` termina sin errores.
- `docker compose up -d` inicia el servicio y el puerto local responde.
- Navegación, login demo, roles, formularios, reportes, expediente PDF y anexos.
- Reinicio con `docker compose restart conecta` y comprobación de persistencia SQLite.
- Logs, permisos del volumen, exposición de puertos, correo deshabilitado y secretos.

## Siguiente etapa: candidata productiva
Migrar consultas y modelo de datos de `better-sqlite3` a SQL Server 2022; definir migraciones y respaldo; implementar autenticación corporativa Entra ID; validar controles RBAC, secretos, HTTPS, observabilidad, adjuntos y continuidad. La contenerización por sí sola no resuelve estos requisitos.
