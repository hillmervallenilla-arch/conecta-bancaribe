# Changelog
## V4.6 · Conecta Bancaribe y Experiencia del Solicitante
- Mis Necesidades se convierte en bandeja navegable del solicitante.
- Vista de seguimiento con estados de negocio simplificados, sin exponer Gates internos.
- Reutiliza el Registro Maestro y la iniciativa vinculada: no recaptura información.
- Permite aportar información adicional al expediente con trazabilidad de autor y fecha.
- Habilita aceptación formal del entregable desde el Portal cuando la iniciativa llega a COMMIT/entrega.
- La aceptación reutiliza Plantilla 19 y alimenta `accept_confirmed_at`, preservando métricas existentes.
- Historial visible de eventos de la necesidad.
- Migración no destructiva: nueva tabla `need_updates`; todas las tablas y datos V4.5.2 permanecen compatibles.

## V4.7 · Administración de Seguridad y Permisos
- Nuevo RBAC configurable en base de datos: roles, permisos y asignación rol-permiso.
- Nuevo módulo `/administracion/seguridad` para activar/desactivar funcionalidades sin modificar código.
- Sidebar generado dinámicamente desde permisos efectivos.
- Nuevo rol demo ADMIN y grupos AD sugeridos por rol.
- Auditoría de cambios de autorización.
- Dashboard protegido por `DASHBOARD_VIEW`, permitiendo habilitarlo a Contrapartes desde Administración.
- Preparación para futura integración AD/SSO: el rol/grupo autenticado resuelve permisos en el Portal.
