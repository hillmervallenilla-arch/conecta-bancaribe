# Conecta Bancaribe V4.7

## Administración de Seguridad y Permisos

V4.7 parte de V4.6 e incorpora un RBAC configurable desde la propia aplicación.

### Nuevo módulo
`/administracion/seguridad`

El administrador puede habilitar o retirar funcionalidades existentes por rol sin modificar `Sidebar.tsx` ni recompilar la aplicación. El menú se construye a partir de `security_role_permissions`.

### Usuario demo administrador
- Nombre: Administrador Seguridad
- Rol: ADMIN
- Área: Seguridad TI

El login continúa siendo demo en esta versión del prototipo. En producción debe sustituirse por SSO/Directorio Activo.

### Tablas nuevas
- `security_roles`
- `security_permissions`
- `security_role_permissions`
- `security_audit`

### Ejemplo solicitado
Para habilitar **Dashboard Gestión y Valor** a **Contraparte del Área**:
1. Iniciar sesión como Administrador Seguridad.
2. Abrir `Seguridad y Permisos`.
3. Buscar `Dashboard Gestión y Valor / DASHBOARD_VIEW`.
4. Activar la casilla de `AREA_COUNTERPART`.
5. La opción aparecerá en el menú de la contraparte y `/dashboard` validará el mismo permiso en servidor.

### Límite importante
La configuración dinámica permite asignar o retirar funcionalidades **que ya existen y están registradas en el catálogo de permisos**. Crear una funcionalidad totalmente nueva sigue requiriendo desarrollo; una vez creada y registrada, su asignación a roles sí es desasistida.

### Producción
AD/SSO autentica y devuelve identidad/grupos. El Portal mapea el grupo a rol(es) y resuelve permisos desde la BD. La autorización debe comprobarse también en cada API/servicio, no sólo en el menú.
