"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import InitiativeTemplates from "@/components/InitiativeTemplates";
import ProcessRules from "@/components/ProcessRules";
import CapacityByArea from "@/components/CapacityByArea";
import ClassificationRouting from "@/components/ClassificationRouting";
import Expediente360 from "@/components/Expediente360";
const phases=["","RELATE","SHAPE","DECIDE & ENABLE","DELIVER & REALIZE"];
export default function InitiativeExpediente({id}:{id:number}){
 const [d,setD]=useState<any>(null);
 const load=()=>fetch(`/api/initiatives/${id}`,{cache:"no-store"}).then(r=>r.json()).then(setD);
 useEffect(()=>{load()},[id]);
 if(!d)return <div className="p-7">Cargando expediente…</div>;
 const i=d.initiative, checks=d.readyChecks||{};
 async function transition(action:string){const r=await fetch(`/api/initiatives/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});const x=await r.json().catch(()=>({}));if(!r.ok){alert(x.error||"No fue posible completar la transición");return}await load()}

 return <div className="p-7">
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><span className="badge phase1">EXPEDIENTE BRM</span><h1 className="text-3xl font-black text-[#003f6b] mt-2">{i.title}</h1><p>{i.area} · {i.owner||"Sin gestor"} · {i.status}</p></div><Link className="home-action home-action-secondary" href={`/iniciativas/${id}/exportar`} target="_blank" rel="noopener noreferrer">↧ Exportar expediente PDF</Link></div>
  <div className="grid grid-cols-4 gap-3 mb-5">{[1,2,3,4].map(n=><div key={n} className={"card p-4 "+(i.phase===n?"ring-2 ring-[#00a6b2]":"")}><b>{phases[n]}</b><div className="text-xs mt-1">{i.phase===n?"Fase actual":i.phase>n?"Recorrida":"Pendiente"}</div></div>)}</div>
  <section className="card p-5 mb-5"><div className="flex justify-between items-start gap-4"><div><h2 className="text-xl font-black">Resumen de valor</h2><p className="mt-2">{i.value_statement||"Sin declaración de valor."}</p></div><span className={"badge "+(d.ready?"phase4":"phase2")}>{d.ready?"READY · Preparada para decisión":"READY · En preparación"}</span></div></section>

  {d.masterRecord&&<section className="card p-5 mb-5 border-l-4 border-[#00a6b2]"><div className="flex justify-between"><div><span className="text-xs font-bold text-[#007caa]">REGISTRO MAESTRO</span><h2 className="text-xl font-black">{d.masterRecord.master_id} · {d.masterRecord.title}</h2></div><span className="badge">Fuente única</span></div><div className="grid grid-cols-4 gap-3 mt-4 text-sm"><div><b>Solicitante</b><p>{d.masterRecord.requester}</p></div><div><b>Área</b><p>{d.masterRecord.requester_area}</p></div><div><b>Calidad de captura</b><p>{d.masterRecord.quality_score}%</p></div><div><b>Estado</b><p>{d.masterRecord.status}</p></div></div><p className="text-xs mt-3 text-slate-500">Los artefactos reutilizan estos datos. No deben solicitar nuevamente información ya declarada en el Registro Maestro.</p></section>}

  {d.masterRecord&&<ClassificationRouting need={d.masterRecord} onSaved={load}/>}

  <Expediente360 d={d}/>

  <section className="card p-5 mb-5"><div className="flex justify-between items-start"><div><h2 className="text-xl font-black">Mapa de datos · trazabilidad del valor</h2><p className="text-sm mt-1">Cada evidencia conserva su origen y se reutiliza en las etapas posteriores sin volver a solicitarla.</p></div><span className="badge phase1">V4.2 · Herencia integral</span></div><div className="grid grid-cols-6 gap-2 mt-4 text-center text-xs font-bold">{["Registro Maestro","SHAPE","READY","COMMIT","Aceptación","Valor 90/180"].map((x,n)=><div key={x} className="rounded-xl border p-3 bg-[#f3f8fb]"><div className="text-[#007caa]">{n+1}</div>{x}</div>)}</div><div className="mt-4 text-sm"><b>Cadena:</b> {d.masterRecord?.master_id||"Sin NV"} → necesidad → criterios de aceptación → decisión/capacidad → aceptación del usuario → resultado y valor.</div></section>

  <InitiativeTemplates id={id} records={d.templates||[]} onSaved={load} initiative={i} masterRecord={d.masterRecord} capacity={d.capacity}/>

  <ProcessRules onSaved={load}/>

  <section className="card p-5 mb-5">
   <div className="flex justify-between items-start gap-5">
    <div><h2 className="text-xl font-black">Gate READY · Preparación para decisión</h2>
     <p className="text-sm mt-1">READY combina evidencia propia de la iniciativa (03 y 06) con reglas globales vigentes del proceso (04 y 07). Las reglas no se vuelven a capturar por expediente.</p>
    </div>
    <div className="text-right"><span className={"badge "+(d.ready?"phase4":"phase2")}>{d.ready?"READY · Preparada para decisión":"READY · En preparación"}</span><div className="text-sm mt-2"><b>{d.readyCount||0}/{d.readyTotal||4}</b> artefactos obligatorios</div></div>
   </div>
   <div className="grid grid-cols-5 gap-3 mt-4"><div className={"rounded-xl border p-3 "+(d.classificationReady?"bg-green-50":"bg-white")}><div className="text-xs font-bold text-[#007caa]">ENRUTAMIENTO</div><b>{d.classificationReady?"✓":"○"} Clasificación confirmada</b><div className="text-xs mt-1">{d.classificationReady?"Tipo y ruta definidos":"Pendiente · requerida para READY"}</div></div>
    {[[3,"Necesidad · iniciativa"],[4,"Clasificación · global"],[6,"Requerimiento · iniciativa"],[7,"Criterios READY · global"]].map(([n,l]:any)=>{
      const ok=Boolean(d.readyArtifactChecks?.[n]);
      return <div key={n} className={"rounded-xl border p-3 "+(ok?"bg-green-50":"bg-white")}><div className="text-xs font-bold text-[#007caa]">PLANTILLA {String(n).padStart(2,"0")}</div><b>{ok?"✓":"○"} {l}</b><div className="text-xs mt-1">{ok?"Completada":"Pendiente · requerida para READY"}</div></div>
    })}
   </div>
  </section>

  {d.ready && !i.ready_transitioned_at && <section className="card p-5 mb-5 border-2 border-[#00a6b2]"><h2 className="text-xl font-black">Transición READY → DECIDE & ENABLE</h2><p className="text-sm mt-1">La preparación está completa. Confirmar esta transición registra la decisión en el historial y habilita formalmente el Gate COMMIT.</p><button onClick={()=>transition("advance_ready")} className="btn btn-primary mt-3">Confirmar READY y pasar a decisión</button></section>}

  {i.ready_transitioned_at && <>
   <CapacityByArea initiativeArea={i.area} onSaved={load}/>
   <section className="card p-5 mb-5"><div className="flex justify-between items-start gap-5"><div><h2 className="text-xl font-black">Gate COMMIT · Prioridad + decisión + capacidad</h2><p className="text-sm mt-1">COMMIT confirma que la iniciativa no solo es prioritaria: existe decisión explícita y capacidad publicada para asumir el compromiso.</p></div><div className="text-right"><span className={"badge "+(d.commitReady?"phase4":"phase2")}>{d.commitReady?"COMMIT · Listo para comprometer":"COMMIT · En preparación"}</span><div className="text-sm mt-2"><b>{d.commitCount||0}/{d.commitTotal||4}</b> condiciones</div></div></div><div className="grid grid-cols-4 gap-3 mt-4">{[[5,"Caso de negocio · iniciativa"],[8,"Priorización · global"],[9,"Decisión de comité · iniciativa"],[20,"Capacidad · área"]].map(([n,l]:any)=>{const ok=Boolean(d.commitArtifactChecks?.[n]);return <div key={n} className={"rounded-xl border p-3 "+(ok?"bg-green-50":"bg-white")}><div className="text-xs font-bold text-[#007caa]">PLANTILLA {String(n).padStart(2,"0")}</div><b>{ok?"✓":"○"} {l}</b><div className="text-xs mt-1">{ok?"Disponible":"Pendiente para COMMIT"}</div></div>})}</div>{d.commitReady&&!i.commit_confirmed_at&&<button onClick={()=>transition("commit")} className="btn btn-primary mt-4">Confirmar COMMIT e iniciar Delivery</button>}{i.commit_confirmed_at&&<div className="mt-4 rounded-xl bg-green-50 p-4 font-bold">✓ Compromiso confirmado · iniciativa habilitada para DELIVER & REALIZE</div>}</section>
  </>}

  {i.commit_confirmed_at&&<section className="card p-5 mb-5"><div className="flex justify-between items-start gap-5"><div><h2 className="text-xl font-black">Gate ACCEPT · Aceptación del entregable</h2><p className="text-sm mt-1">Los criterios declarados en la Plantilla 06 viajan automáticamente a la Plantilla 19. La aceptación corresponde al área usuaria y habilita la medición de valor.</p></div><div className="text-right"><span className={"badge "+(d.acceptReady?"phase4":"phase2")}>{d.acceptReady?"ACCEPT · Evidencia completa":"ACCEPT · En preparación"}</span><div className="text-sm mt-2"><b>{d.acceptCount||0}/3</b> condiciones</div></div></div><div className="grid grid-cols-3 gap-3 mt-4">{[["criteria","Criterios heredados desde 06"],["decision","Decisión explícita del usuario"],["deployment","Fecha de producción confirmada"]].map(([k,l]:any)=>{const ok=Boolean(d.acceptChecks?.[k]);return <div key={k} className={"rounded-xl border p-3 "+(ok?"bg-green-50":"bg-white")}><b>{ok?"✓":"○"} {l}</b></div>})}</div>{d.acceptReady&&<div className="mt-4 rounded-xl bg-green-50 p-4"><b>✓ Entregable aceptado.</b> La Plantilla 12 reutiliza la fecha de producción, el beneficio comprometido, la línea base y el indicador esperado para los cortes 90/180.</div>}</section>}

  <div className="grid grid-cols-2 gap-5">
   <section className="card p-5"><h2 className="text-xl font-black mb-3">Bitácora Semanal del Gestor</h2>{d.weekly.length?d.weekly.map((w:any)=><div className="border-b py-3" key={w.id}><div className="flex justify-between"><b>{w.title}</b><span className="badge phase4">{w.status}</span></div><p className="text-sm">{w.area} · {w.owner||"Sin responsable"}</p>{w.situation&&<p className="text-sm"><b>Situación:</b> {w.situation}</p>}{w.next_action&&<p className="text-sm"><b>Próxima acción:</b> {w.next_action}</p>}<p className="text-xs mt-1">{w.board_status==="Cerrada"?"Histórico":"Semana activa"}</p></div>):<p>Sin seguimientos vinculados.</p>}</section>
   <section className="card p-5"><h2 className="text-xl font-black mb-3">Historial del expediente</h2>{d.activity.length?d.activity.map((a:any)=><div className="border-b py-3" key={a.id}><b>{a.title}</b><p className="text-sm">{a.detail}</p><p className="text-xs">{a.created_at}</p></div>):<p>El historial se construirá a medida que la iniciativa avance.</p>}</section>
  </div>
 </div>
}
