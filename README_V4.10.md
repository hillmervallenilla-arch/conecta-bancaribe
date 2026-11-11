# V4.10 · Gestión de Capacidad y Trabajo en Ejecución

Candidata construida sobre la baseline funcional validada V4.9.2.

## Cambios
- Segunda puerta de entrada: `Registrar iniciativa en ejecución` para TECH_OWNER y BRM.
- Entrada directa a fase 4 / Delivery, sin 8 preguntas ni gates previos.
- Campos: descripción, categoría, líder técnico, fechas, recursos, FTE comprometidos, estado y fuente.
- Trazabilidad de quién registra vs. quién es responsable técnico.
- Capacidad total declarada por área/período.
- Capacidad comprometida calculada automáticamente desde asignaciones activas.
- Capacidad disponible = total - comprometida.
- Drill-down de capacidad hacia iniciativas consumidoras.
- Fechas original/vigente y estructura para reprogramaciones/liberación.
- Permisos dinámicos: WORK_IN_PROGRESS_CREATE, CAPACITY_MANAGE, CAPACITY_VIEW.

## Nota
V4.10 es candidata hasta completar pruebas funcionales. V4.9.2 permanece congelada como baseline validada.
