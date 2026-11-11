Conecta Bancaribe — V4.11.2 CANDIDATA

Cambios:
- Validación visible de título y campos obligatorios en registro de necesidades, con retorno al paso incompleto.
- Directiva "use client" al inicio de componentes que la necesitan.
- Identificador de iniciativa visible y heredado en artefactos; plantilla 19 y plantilla 12 utilizan el identificador canónico del expediente.
- API de plantillas valida el identificador recibido contra la iniciativa y rechaza códigos discrepantes.
- Apertura inicial de la pestaña Entrega / Valor para facilitar iniciativas que ingresan directamente a Delivery.

Identificador: INI-<ID interno con 5 dígitos>, salvo que exista un código explícito en el expediente.

VALIDACIÓN: comprobación sintáctica TS/TSX efectuada. No se ejecutó npm build ni pruebas funcionales: faltan dependencias instaladas y el entorno no dispone de caché para instalarlas. No sustituir la base validada sin prueba local. Respaldar base SQLite antes de iniciar.
