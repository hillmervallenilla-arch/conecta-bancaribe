"use client";
import {useEffect,useMemo,useState} from "react";
const routineTasks=["Revisar el tablero: qué se movió y qué lleva días detenido","Responder al negocio, aunque sea para confirmar que ya se atiende","Identificar lo trabado y pedir ayuda el mismo día","Registrar acuerdos, responsables y fechas mientras están frescos"];
const fmt=(d:string)=>{if(!d)return "—";const [y,m,day]=d.split("-");return `${day}/${m}/${y}`};
const weekLabel=(h:any)=>h?.start_date?`del ${fmt(h.start_date)} al ${fmt(h.end_date)}`:(h?.week||"—");
const esc=(v:any)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]||c));
function calcEnd(start:string){if(!start)return "";const d=new Date(start+"T12:00:00");d.setDate(d.getDate()+6);return d.toISOString().slice(0,10)}
export default function WeeklyBoard(){
 const [board,setBoard]=useState<any>(null),[items,setItems]=useState<any[]>([]),[history,setHistory]=useState<any[]>([]),[initiatives,setInitiatives]=useState<any[]>([]),[selected,setSelected]=useState<any>(null),[msg,setMsg]=useState("");
 const [routine,setRoutine]=useState<boolean[]>(Array(20).fill(false)); const [close,setClose]=useState<any>({adv:"",blk:"",dec:"",next:""});
 async function load(){
  const response=await fetch("/api/weekly-board",{cache:"no-store"});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  const d=await response.json();
  setBoard(d.board||{week:"",manager:"",areas:"",start_date:"",end_date:""});
  setItems(d.items||[]);setHistory(d.history||[]);setInitiatives(d.initiatives||[]);
  if(d.board){
    try{
      const saved=JSON.parse(d.board.routine_json||"[]");
      const normalized=Array.from({length:20},(_,i)=>Boolean(saved[i]));
      setRoutine(normalized);
    }catch{setRoutine(Array(20).fill(false))}
    try{setClose({...{adv:"",blk:"",dec:"",next:""},...JSON.parse(d.board.close_json||"{}")})}catch{setClose({adv:"",blk:"",dec:"",next:""})}
  }else{
    setRoutine(Array(20).fill(false));setClose({adv:"",blk:"",dec:"",next:""});
  }
}
 useEffect(()=>{load()},[]);
 async function save(){
  try{
    const response=await fetch("/api/weekly-board",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"save",...board,routine,close})});
    if(!response.ok){throw new Error(`HTTP ${response.status}`)}
    await load();
    setMsg("Guardado en SQLite");setTimeout(()=>setMsg(""),1500);
  }catch(err){console.error("Error guardando tablero semanal",err);setMsg("Error al guardar");setTimeout(()=>setMsg(""),2500)}
}
 async function add(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  const form=e.currentTarget;
  const f=Object.fromEntries(new FormData(form));
  try{
    const response=await fetch("/api/weekly-board",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"add",...f,...board,routine:[...routine],close:{...close}})});
    if(!response.ok){throw new Error(`HTTP ${response.status}`)}
    form.reset();
    await load();
    setMsg("Asunto agregado");
    setTimeout(()=>setMsg(""),1500);
  }catch(err){
    console.error("Error agregando asunto semanal",err);
    setMsg("No se pudo agregar el asunto");
    setTimeout(()=>setMsg(""),2500);
  }
}
 async function closeWeek(){
  if(!board?.start_date||!board?.end_date){setMsg("Selecciona la fecha inicial de la semana antes de cerrar");setTimeout(()=>setMsg(""),3000);return}
  if(!confirm(`¿Cerrar la semana ${weekLabel(board)}? Los asuntos pendientes pasarán a la siguiente.`))return;
  try{
    const response=await fetch("/api/weekly-board",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"close",...board,routine:[...routine],close:{...close}})});
    if(!response.ok){const detail=await response.text();throw new Error(`HTTP ${response.status}: ${detail}`)}
    setRoutine(Array(20).fill(false));setClose({adv:"",blk:"",dec:"",next:""});
    await load();
    setMsg("Semana cerrada y archivada");setTimeout(()=>setMsg(""),1800);
  }catch(err){console.error("Error cerrando semana",err);setMsg("No se pudo cerrar la semana");setTimeout(()=>setMsg(""),3000)}
}
 const counts=useMemo(()=>Object.fromEntries(["En seguimiento","Detenido","Escalar","Cerrado"].map(s=>[s,items.filter(i=>i.status===s).length])),[items]);
 function printHistory(h:any){
   const s=h.snapshot||{};const rows=(s.items||[]).map((i:any)=>`<tr><td>${esc(i.title)}</td><td>${esc(i.area)}</td><td>${esc(i.status)}</td><td>${esc(i.situation)}</td><td>${esc(i.next_action)}</td><td>${esc(i.owner)}</td><td>${esc(fmt(i.due_date))}</td></tr>`).join("");
   const c=s.counts||{};const cl=s.close||{};
   const w=window.open("","_blank");if(!w)return;
   w.document.write(`<html><head><title>Bitácora Semanal del Gestor · ${esc(weekLabel(h))}</title><style>@page{size:landscape;margin:12mm}body{font-family:Arial;padding:20px;color:#123b58;font-size:12px}h1{color:#003f6b;margin-bottom:4px}h2{color:#007caa}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ccdce5;padding:6px;vertical-align:top}th{background:#003f6b;color:#fff}.kpis{display:flex;gap:10px}.k{border:1px solid #ccdce5;padding:8px;min-width:110px}.close{display:grid;grid-template-columns:1fr 1fr;gap:8px}.box{border:1px solid #ccdce5;padding:8px;white-space:pre-wrap}</style></head><body>
   <h1>BANCARIBE · Conecta Bancaribe</h1><h2>Bitácora Semanal del Gestor · Semana ${esc(weekLabel(h))}</h2>
   <p><b>Gestor:</b> ${esc(h.manager||s.manager||"—")} · <b>Áreas:</b> ${esc(h.areas||s.areas||"—")} · <b>Cierre:</b> ${esc(h.closed_at||"—")}</p>
   <h2>1. Resumen semanal</h2><div class="kpis"><div class="k"><b>Rutina</b><br>${esc(s.routine_pct??0)}%</div><div class="k"><b>En seguimiento</b><br>${esc(c["En seguimiento"]??0)}</div><div class="k"><b>Detenidos</b><br>${esc(c["Detenido"]??0)}</div><div class="k"><b>Escalar</b><br>${esc(c["Escalar"]??0)}</div><div class="k"><b>Cerrados</b><br>${esc(c["Cerrado"]??0)}</div></div>
   <h2>2. Asuntos y compromisos</h2><table><thead><tr><th>Necesidad / iniciativa</th><th>Área</th><th>Estado</th><th>Situación / bloqueo</th><th>Próxima acción</th><th>Responsable</th><th>Fecha</th></tr></thead><tbody>${rows||'<tr><td colspan="7">Sin asuntos registrados.</td></tr>'}</tbody></table>
   <h2>3. Cierre semanal</h2><div class="close"><div class="box"><b>Avances</b><br>${esc(cl.adv||"—")}</div><div class="box"><b>Bloqueos</b><br>${esc(cl.blk||"—")}</div><div class="box"><b>Decisiones / escalaciones</b><br>${esc(cl.dec||"—")}</div><div class="box"><b>Compromisos próxima semana</b><br>${esc(cl.next||"—")}</div></div>
   <script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()
 }
 return <div className="p-7"><header className="mb-5"><span className="badge phase4">PLANTILLA 17</span><h1 className="text-3xl font-black text-[#003f6b] mt-2">Bitácora Semanal del Gestor</h1><p>Observabilidad, compromisos y gestión temprana de bloqueos · Persistencia central en SQLite.</p></header>
 <div className="grid grid-cols-5 gap-3 mb-5">{[["Rutina",Math.round(routine.filter(Boolean).length/20*100)+"%"],["En seguimiento",counts["En seguimiento"]||0],["Detenidos",counts.Detenido||0],["Escalar",counts.Escalar||0],["Cerrados",counts.Cerrado||0]].map(([a,b])=><div className="card p-4" key={a}><b className="text-2xl text-[#003f6b]">{b}</b><div className="text-sm">{a}</div></div>)}</div>
 <section className="card p-5 mb-5"><div className="grid grid-cols-4 gap-3"><label>Desde<input type="date" className="input" value={board?.start_date||""} onChange={e=>{const start=e.target.value;setBoard({...board,start_date:start,end_date:calcEnd(start),week:start?`del ${fmt(start)} al ${fmt(calcEnd(start))}`:""})}}/></label><label>Hasta<input type="date" className="input" value={board?.end_date||""} readOnly/></label><label>Gestor<input className="input" value={board?.manager||""} onChange={e=>setBoard({...board,manager:e.target.value})}/></label><label>Áreas<input className="input" value={board?.areas||""} onChange={e=>setBoard({...board,areas:e.target.value})}/></label></div><button onClick={save} className="btn btn-primary mt-3">Guardar semana</button><span className="ml-3 text-green-700">{msg}</span></section>
 <section className="card p-5 mb-5"><h2 className="text-xl font-black mb-3">01 · Rutina diaria</h2><div className="overflow-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">Rutina</th>{["Lun","Mar","Mié","Jue","Vie"].map(d=><th key={d}>{d}</th>)}</tr></thead><tbody>{routineTasks.map((t,ti)=><tr className="border-t" key={t}><td className="py-3">{t}</td>{[0,1,2,3,4].map(di=>{const i=ti*5+di;return <td className="text-center" key={di}><input type="checkbox" checked={!!routine[i]} onChange={e=>{const n=[...routine];n[i]=e.target.checked;setRoutine(n)}}/></td>})}</tr>)}</tbody></table></div></section>
 <div className="grid grid-cols-[380px_1fr] gap-5 mb-5"><form onSubmit={add} className="card p-5"><h2 className="text-xl font-black mb-3">02 · Registrar compromiso</h2><label className="block text-sm mb-2">Iniciativa vinculada<select name="initiative_id" className="input"><option value="">Sin vincular</option>{initiatives.map((i:any)=><option key={i.id} value={i.id}>{i.title} · {i.area}</option>)}</select></label>{[["title","Necesidad / iniciativa"],["area","Área"],["situation","Situación / bloqueo"],["next_action","Próxima acción"],["owner","Responsable"],["due_date","Fecha objetivo"]].map(([n,l])=><label className="block text-sm mb-2" key={n}>{l}<input name={n} required={n==="title"} type={n==="due_date"?"date":"text"} className="input"/></label>)}<label className="text-sm">Estado<select name="status" className="input">{["En seguimiento","Detenido","Escalar","Cerrado"].map(x=><option key={x}>{x}</option>)}</select></label><button className="btn btn-primary mt-3">Agregar al tablero</button></form>
 <section className="card p-5"><h2 className="text-xl font-black mb-3">03 · Tablero de atención</h2>{items.length?items.map(i=><div key={i.id} className="border-b py-3"><div className="flex justify-between"><b>{i.title}</b><span className="badge phase4">{i.status}</span></div><div className="text-sm">{i.initiative_title&&<><b>Iniciativa:</b> {i.initiative_title} · </>}{i.area} · {i.owner||"Sin responsable"} {i.due_date&&"· "+i.due_date}</div>{i.situation&&<p className="text-sm mt-1"><b>Situación:</b> {i.situation}</p>}{i.next_action&&<p className="text-sm"><b>Próxima acción:</b> {i.next_action}</p>}</div>):<p>Sin asuntos registrados.</p>}</section></div>
 <section className="card p-5 mb-5"><h2 className="text-xl font-black mb-3">04 · Cierre semanal</h2><div className="grid grid-cols-2 gap-3">{[["adv","Avances"],["blk","Bloqueos"],["dec","Decisiones / escalaciones"],["next","Compromisos próxima semana"]].map(([k,l])=><label key={k}>{l}<textarea className="input min-h-24" value={close[k]||""} onChange={e=>setClose({...close,[k]:e.target.value})}/></label>)}</div><div className="mt-3 flex gap-2"><button onClick={save} className="btn btn-soft">Guardar</button><button onClick={closeWeek} className="btn btn-primary">Cerrar semana</button></div></section>
 <section className="card p-5"><h2 className="text-xl font-black mb-3">05 · Histórico de semanas</h2><div className="grid grid-cols-[300px_1fr] gap-4"><div>{history.map(h=><button onClick={()=>setSelected(h)} key={h.id} className="block w-full text-left border rounded-lg p-3 mb-2"><b>Semana {weekLabel(h)}</b><div className="text-xs">{h.manager} · {h.closed_at}</div></button>)}</div><div className="border rounded-xl p-4">{selected?<><div className="flex justify-between"><div><h3 className="font-black text-lg">Semana {weekLabel(selected)}</h3><p>{selected.manager} · {selected.areas}</p></div><button className="btn btn-primary" onClick={()=>printHistory(selected)}>Imprimir / PDF</button></div><p className="mt-4"><b>Fecha de cierre:</b> {selected.closed_at}</p>
{selected.snapshot&&<><div className="grid grid-cols-5 gap-2 mt-4">{[["Rutina",(selected.snapshot.routine_pct??0)+"%"],["En seguimiento",selected.snapshot.counts?.["En seguimiento"]??0],["Detenidos",selected.snapshot.counts?.Detenido??0],["Escalar",selected.snapshot.counts?.Escalar??0],["Cerrados",selected.snapshot.counts?.Cerrado??0]].map(([a,b])=><div className="border rounded-lg p-2" key={a}><b>{b}</b><div className="text-xs">{a}</div></div>)}</div>
<div className="overflow-auto mt-4"><table className="w-full text-xs"><thead><tr><th>Necesidad / iniciativa</th><th>Área</th><th>Estado</th><th>Situación</th><th>Próxima acción</th><th>Responsable</th><th>Fecha</th></tr></thead><tbody>{(selected.snapshot.items||[]).map((i:any)=><tr className="border-t" key={i.id}><td>{i.title}</td><td>{i.area}</td><td>{i.status}</td><td>{i.situation}</td><td>{i.next_action}</td><td>{i.owner}</td><td>{fmt(i.due_date)}</td></tr>)}</tbody></table></div>
<div className="grid grid-cols-2 gap-2 mt-4">{[["Avances",selected.snapshot.close?.adv],["Bloqueos",selected.snapshot.close?.blk],["Decisiones / escalaciones",selected.snapshot.close?.dec],["Compromisos próxima semana",selected.snapshot.close?.next]].map(([a,b])=><div className="border rounded-lg p-3" key={a}><b>{a}</b><p className="whitespace-pre-wrap">{b||"—"}</p></div>)}</div></>}</>:<p>Selecciona una semana archivada.</p>}</div></div></section>
 </div>}
