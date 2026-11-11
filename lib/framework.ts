export const phases = [
 {id:1,slug:"relate",name:"RELATE",subtitle:"Relación y Contexto",verbs:"Conocer · Conectar · Entender · Anticipar",templates:[1,2,11]},
 {id:2,slug:"shape",name:"SHAPE",subtitle:"Necesidad y Demanda",verbs:"Escuchar · Clarificar · Registrar · Clasificar · Preparar",templates:[3,4,6,7]},
 {id:3,slug:"decide-enable",name:"DECIDE & ENABLE",subtitle:"Decisión y Capacidad",verbs:"Comparar · Priorizar · Verificar capacidad · Decidir · Comprometer",templates:[5,8,9,13,18]},
 {id:4,slug:"deliver-realize",name:"DELIVER & REALIZE",subtitle:"Entrega y Valor",verbs:"Observar · Comunicar · Desbloquear · Aceptar · Medir · Aprender",templates:[10,12,14,19]}
] as const;

export const templates = [
 {id:1,name:"Acuerdo de relacionamiento por área",phase:1,fields:["Área de negocio","Contraparte principal","Objetivos del área","Canal de entrada de demanda","Cadencia de relacionamiento","Acuerdos de trabajo"]},
 {id:2,name:"Mapa de interlocutores y cadencia",phase:1,fields:["Interlocutores clave","Rol / influencia","Necesidades de información","Cadencia","Riesgos de relacionamiento"]},
 {id:3,name:"Registro y clarificación de la necesidad",phase:2,fields:["Problema u oportunidad","Área afectada y frecuencia","Resultado esperado","Indicador de éxito","Riesgo de no actuar","Fecha límite / origen","Sistema o servicio afectado","Hipótesis de solución"]},
 {id:4,name:"Criterios de clasificación",phase:2,fields:["Ruta propuesta","Justificación","Impacto","Urgencia","Complejidad estimada"]},
 {id:5,name:"Verificación del caso de negocio",phase:3,fields:["Objetivo estratégico","Beneficio esperado","Alcance","Supuestos","Costos / esfuerzo","Riesgos","Indicadores de valor","Completitud"]},
 {id:6,name:"Ficha de requerimiento",phase:2,fields:["Descripción funcional","Criterios de aceptación","Requisitos no funcionales","Dependencias","Restricciones"]},
 {id:7,name:"Criterios de listo y terminado",phase:2,fields:["Criterios READY","Evidencias READY","Criterios DONE","Evidencias DONE","Observaciones"]},
 {id:8,name:"Criterios de priorización",phase:3,fields:["Valor de negocio (25)","Riesgo / regulatorio (20)","Urgencia (15)","Cliente (15)","Alineación estratégica (15)","Esfuerzo / complejidad (-10)","Capacidad disponible","Prioridad resultante"]},
 {id:9,name:"Agenda, minuta y aviso de decisión",phase:3,fields:["Comité / fecha","Agenda","Decisión","Responsable","Fecha compromiso","Pendientes","Aviso al solicitante"]},
 {id:10,name:"Guion y minuta de estatus",phase:4,fields:["Avances","Bloqueos","Decisiones requeridas","Próximas acciones","Responsables y fechas"]},
 {id:11,name:"Guion de sesión de planeación",phase:1,fields:["Objetivos de negocio","Prioridades del período","Necesidades potenciales","Dependencias","Riesgos","Acuerdos"]},
 {id:12,name:"Medición de valor a 90 y 180 días",phase:4,fields:["Indicador de desempeño","Outcome esperado","Valor esperado","Resultado a 90 días","Resultado a 180 días","Limitaciones de solución","Limitaciones organizacionales","Acciones para recuperar valor"]},
 {id:13,name:"Matriz de escalamiento",phase:3,fields:["Situación","Nivel de escalamiento","Decisión requerida","Responsable","Fecha límite","Resultado"]},
 {id:14,name:"Acta de mejora continua",phase:4,fields:["Hallazgo","Causa","Acción de mejora 1","Acción de mejora 2","Acción de mejora 3","Responsable","Fecha de revisión"]},
 {id:18,name:"Registro de excepciones",phase:3,fields:["Excepción","Prioridad afectada","Quién autoriza","Justificación","Qué desplaza","Vigencia"]},
 {id:19,name:"Acta de aceptación del entregable",phase:4,fields:["Entregable","Fecha de despliegue","Criterios aceptados","Aceptación del usuario","Observaciones","Fecha de aceptación","Responsable de aceptación"]}
] as const;
export const getTemplate=(id:number)=>templates.find(t=>t.id===id);
