# V4.8 — Executive Management Cockpit

Evolución incremental sobre V4.7 validada.

## Incluye
- Rol `EXECUTIVE` / grupo objetivo `GG-BRM-PORTAL-EXECUTIVE`.
- Usuario demo: `VP Ejecutivo Demo`.
- Permiso dinámico `EXECUTIVE_DASHBOARD_VIEW`.
- Menú `Dashboard Ejecutivo 360°` administrable desde Seguridad y Permisos.
- Dashboard global en `/dashboard-ejecutivo`.
- KPIs, flujo, capacidad, atención ejecutiva, tendencias 6 meses y cobertura del Centro de Reportes.
- Drill-down a Expediente 360° para alertas con iniciativa.
- Compatibilidad no destructiva con la base SQLite utilizada por V4.6/V4.7.

## Prueba recomendada
1. Reutilizar una copia de `data/prototipo.db` validada en V4.7.
2. Iniciar V4.8. La inicialización agrega el rol/permisos faltantes con `INSERT OR IGNORE`.
3. Entrar como `VP Ejecutivo Demo` y abrir `Dashboard Ejecutivo 360°`.
4. Entrar como Administrador de Seguridad y retirar/agregar `Dashboard Ejecutivo 360°` al rol EXECUTIVE para validar RBAC dinámico.
5. Verificar que necesidades, iniciativas y trazabilidad histórica continúan visibles.

## Nota
El alcance global en este prototipo se implementa mediante un rol ejecutivo de solo lectura que consume datasets globales. En producción, el alcance de datos debe formalizarse como autorización separada del permiso funcional (por ejemplo `GLOBAL`, `AREA`, `OWN`) y aplicarse también en APIs/consultas SQL Server.
