# V4.11.3 · Candidata

- Accesos superiores de inicio rediseñados como botones tipo píldora.
- «Nueva iniciativa» abre `/portal/nueva`, el formulario validado de ocho preguntas; no utiliza el modal de alta directa.
- «Iniciativa en ejecución» conserva `/delivery/en-ejecucion/nueva`.
- Exportación de expediente desde la cabecera a una vista de impresión protegida por el permiso `INITIATIVES_VIEW`. El navegador permite «Guardar como PDF».
- El PDF presenta identificación, necesidad de origen cuando existe, capacidad, contenido de plantillas, lista de anexos, seguimiento e historial. No fusiona archivos adjuntos.
- La exportación es de solo lectura y no modifica estados ni datos.

## Pruebas recomendadas
1. Abrir los dos botones de inicio y comprobar las rutas.
2. Abrir un expediente con permiso y pulsar «Exportar expediente PDF»; guardar como PDF desde el navegador.
3. Comprobar iniciativas con y sin registro maestro, plantillas y capacidad.
4. Verificar que usuarios sin `INITIATIVES_VIEW` no accedan a la vista de exportación.
