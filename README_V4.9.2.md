# Conecta Bancaribe — V4.9.2

Candidata de validación construida sobre V4.9.1.

## Correcciones principales
- SMTP: Nodemailer usa `auth.pass` (corrección del defecto `Missing credentials for "PLAIN"`).
- `npm run test:mail` queda desacoplado de SQLite y valida configuración, conexión y envío.
- No se incluyen secretos: copie `.env.example` a `.env` y configure localmente.
- Trazabilidad: `NOTIFICACION_BRM_ENVIADA` / `NOTIFICACION_BRM_FALLIDA`, incluyendo messageId cuando existe.
- Adjuntos acumulativos: el cliente conserva selecciones previas y permite eliminar antes de enviar.
- Límite de 5 adjuntos se valida también contra los ya persistidos para la necesidad.
- Expediente 360: acciones separadas Ver (PDF inline cuando aplica) y Descargar.
- Evento de evidencia: `DOCUMENTO_ADJUNTADO`.

## Validación sugerida
1. Reutilizar una copia de la BD V4.6/V4.7 validada.
2. Crear `.env` local (no compartir ni versionar credenciales).
3. Ejecutar `npm run test:mail`.
4. Registrar una necesidad con 2 o más documentos seleccionados en cargas sucesivas.
5. Confirmar recepción del correo BRM.
6. Abrir Expediente 360 y probar Ver/Descargar.
7. Revisar trazabilidad de creación, documentos y notificación.
