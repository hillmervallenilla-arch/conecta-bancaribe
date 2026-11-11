"use client";

type Props={d:any};
const fmt=(v:any)=>{if(!v)return "Pendiente"; try{return new Date(v).toLocaleString("es-VE")}catch{return String(v)}};
export default function Expediente360({d}:Props){
 const i=d.initiative,m=d.masterRecord||{},t=d.telemetry||{},v=d.valueChecks||{};
 const stages=[
  {n:"01",title:"Objetivo / contexto",ok:Boolean(i.value_statement),main:i.value_statement||"Sin declaración de valor",sub:m.requester_area||i.area},
  {n:"02",title:"Necesidad",ok:Boolean(m.master_id),main:m.master_id?`${m.master_id} · ${m.title}`:"Sin Registro Maestro",sub:m.expected_result||"Resultado esperado pendiente"},
  {n:"03",title:"Clasificación",ok:Boolean(d.classificationReady),main:d.classificationReady?`${m.work_type} · ${m.driver_origin}`:"Clasificación pendiente",sub:m.attention_route||"Ruta por definir"},
  {n:"04",title:"READY",ok:Boolean(i.ready_transitioned_at),main:i.ready_transitioned_at?"Preparada para decisión":`${d.readyCount||0}/${d.readyTotal||4} evidencias`,sub:fmt(i.ready_transitioned_at)},
  {n:"05",title:"Decisión / capacidad",ok:Boolean(i.commit_confirmed_at),main:i.commit_confirmed_at?"Compromiso confirmado":`${d.commitCount||0}/${d.commitTotal||4} condiciones`,sub:d.capacity?`Disponible: ${d.capacity.available_capacity}`:"Capacidad pendiente"},
  {n:"06",title:"Entrega / aceptación",ok:Boolean(d.acceptReady),main:d.acceptReady?"Entregable aceptado":`${d.acceptCount||0}/3 condiciones`,sub:d.acceptReady?"Evidencia de aceptación completa":"Pendiente de aceptación usuaria"},
  {n:"07",title:"Outcome / valor",ok:Boolean(v.measurement),main:v.measurement?"Medición 90/180 registrada":"Medición de valor pendiente",sub:`Línea base ${v.baseline?"✓":"○"} · Beneficio ${v.benefit?"✓":"○"} · Producción ${v.production?"✓":"○"}`}
 ];
 return <section className="card p-5 mb-5">
  <div className="flex justify-between items-start gap-4"><div><span className="text-xs font-bold text-[#007caa]">EXPEDIENTE 360°</span><h2 className="text-2xl font-black text-[#003f6b]">De la necesidad al valor realizado</h2><p className="text-sm mt-1">Vista única de la cadena de decisión, evidencia y valor. Cada bloque reutiliza datos ya registrados en ValueFlow.</p></div><span className="badge phase1">V4.3</span></div>
  <div className="grid grid-cols-7 gap-2 mt-5">{stages.map((s:any)=><div key={s.n} className={`rounded-xl border p-3 min-h-36 ${s.ok?"bg-green-50":"bg-white"}`}><div className="text-xs font-black text-[#007caa]">{s.n}</div><div className="font-black text-sm mt-1">{s.ok?"✓ ":"○ "}{s.title}</div><div className="text-xs font-bold mt-3">{s.main}</div><div className="text-xs text-slate-500 mt-2">{s.sub}</div></div>)}</div>
  <div className="grid grid-cols-4 gap-3 mt-5">
   <div className="rounded-xl bg-[#f3f8fb] p-4"><div className="text-xs font-bold text-[#007caa]">TIEMPO INTAKE → READY</div><div className="text-xl font-black">{t.intakeToReadyDays??"—"} <span className="text-xs">días</span></div></div>
   <div className="rounded-xl bg-[#f3f8fb] p-4"><div className="text-xs font-bold text-[#007caa]">READY → COMMIT</div><div className="text-xl font-black">{t.readyToCommitDays??"—"} <span className="text-xs">días</span></div></div>
   <div className="rounded-xl bg-[#f3f8fb] p-4"><div className="text-xs font-bold text-[#007caa]">EDAD DE LA NECESIDAD</div><div className="text-xl font-black">{t.needAgeDays??"—"} <span className="text-xs">días</span></div></div>
   <div className="rounded-xl bg-[#f3f8fb] p-4"><div className="text-xs font-bold text-[#007caa]">TRAZABILIDAD</div><div className="text-xl font-black">{stages.filter(x=>x.ok).length}/7</div></div>
  </div>
  {m?.id&&<div className="mt-5 rounded-xl border p-4"><div className="font-black">Documentos de soporte del solicitante</div><p className="text-sm mt-1 mb-3">Evidencias anexadas al registrar la necesidad.</p>{d.attachments?.length?<div>{d.attachments.map((a:any)=><div key={a.id} className="flex items-center justify-between gap-3 border-t py-2 text-sm"><div><b>📎 {a.file_name}</b><div className="text-xs text-slate-500">{(a.file_size/1024/1024).toFixed(1)} MB · {a.uploaded_by||"Solicitante"} · {fmt(a.created_at)}</div></div><div className="flex gap-2"><a className="btn btn-soft" target="_blank" rel="noreferrer" href={`/api/needs/${m.id}/attachments/${a.id}?mode=view`}>Ver</a><a className="btn btn-soft" href={`/api/needs/${m.id}/attachments/${a.id}`}>Descargar</a></div></div>)}</div>:<div className="text-sm text-slate-500">No se anexaron documentos.</div>}</div>}
  <div className="mt-5 rounded-xl border p-4"><div className="font-black">Trazabilidad navegable</div><p className="text-sm mt-1">Registro Maestro → clasificación → artefactos/Gates → capacidad y decisión → Bitácora → aceptación → medición 90/180. Los bloques detallados permanecen debajo para consultar la evidencia que sustenta esta vista.</p></div>
 </section>
}
