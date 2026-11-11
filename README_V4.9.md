# Conecta Bancaribe V4.9

Base: V4.8 Executive Cockpit. Migraciones no destructivas sobre la BD V4.6/V4.7/V4.8.

## Incluye
- Preclasificación original del solicitante, separada de la clasificación BRM.
- Adjuntos de soporte: PDF, Word, Excel y PowerPoint; máximo demo 5 archivos / 10 MB c/u.
- Confirmación visible con ID único después del registro.
- Notificación BRM de demo dirigida a `hvallenilla@bancaribe.com.ve`. Por seguridad del entorno de demostración, se genera un `.eml` en `data/mail-outbox`; producción debe sustituirlo por Microsoft Graph o relay corporativo aprobado.
- Preparación de esquema de usuario para Microsoft Entra ID (`entra_object_id`, `user_principal_name`, `last_login_at`) y `.env.example`.

## Entra ID
V4.9 mantiene `AUTH_MODE=DEMO` para no romper la validación local. La activación real de Entra requiere App Registration, Tenant ID, Client ID, redirect URI y credencial/certificado aprobados por Seguridad. Para una web app Node/Next se debe implementar Authorization Code/OIDC con una biblioteca Microsoft soportada.

## Producción documental
Los adjuntos se guardan localmente solo en el demo. En producción, `need_attachments.storage_path` debe convertirse en identificador/URL del repositorio documental corporativo y aplicarse antimalware, límites y políticas de retención.

## V4.9.1 · Ajustes de adjuntos y correo real
- El botón **+ Anexar documentos** acumula archivos sin reemplazar los previamente seleccionados.
- La lista de documentos permanece visible y permite eliminar archivos antes del envío.
- El Expediente 360° BRM muestra **Documentos de soporte del solicitante** con descarga autorizada.
- El correo del demo se envía realmente por SMTP Gmail usando Nodemailer.
- La contraseña de aplicación se configura únicamente en `.env`; nunca debe incluirse en el ZIP o repositorio.
- Prueba de correo: `npm run test:mail`.
