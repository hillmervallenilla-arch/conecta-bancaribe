Conecta Bancaribe · V4.11.0 CANDIDATA
Origen: V4.10. No sobrescribir la base validada V4.9.2.
Implementado: menú agrupado con scroll independiente y pie fijo; versión visible en login, menú y reportes; capacidad por área en reportes y ejecutivo; consulta por área/período y liberación estimada; Plantilla 20 transversal por área/período; validación transaccional de capacidad en COMMIT con bloqueo total ante déficit.
Limitaciones: no se completó compilación ni pruebas de integración en este entorno por instalación de dependencias agotada. No se implementó todavía el flujo explícito de liberación efectiva, proyección futura multi-período ni revisión integral de seguridad de endpoints heredados. Las cifras de períodos distintos no deben sumarse como capacidad simultánea.
Validar en copia de base: 1) login/menu de BRM y ADMIN; 2) publicar capacidad por área/período; 3) Plantilla 20 con varias áreas; 4) COMMIT suficiente; 5) COMMIT bloqueado por déficit; 6) concurrencia; 7) reportes/ejecutivo y fechas.
No incluir .env, credenciales ni datos reales en el ZIP.
