import db from "@/lib/db";

const pct=(a:number,b:number)=>b?Math.round(a*100/b):0;
const parse=(s:any)=>{try{return JSON.parse(s||"{}")}catch{return {}}};
const ms=(a?:string|null,b?:string|null)=>{if(!a||!b)return null;const x=new Date(a).getTime(),y=new Date(b).getTime();if(Number.isNaN(x)||Number.isNaN(y))return null;return Math.max(0,y-x)};
export const formatDuration=(n:number|null)=>{if(n===null)return "—";const min=n/60000;if(min<60)return `${Math.max(1,Math.round(min))} min`;const h=min/60;if(h<24)return `${h<10?h.toFixed(1):Math.round(h)} h`;const d=h/24;return `${d<10?d.toFixed(1):Math.round(d)} d`;};
const avgMs=(xs:(number|null)[])=>{const a=xs.filter((x):x is number=>x!==null);return a.length?Math.round(a.reduce((s,x)=>s+x,0)/a.length):null};
const acceptedDecision=(s:any)=>{const x=String(s||"").trim().toLowerCase();return !!x&&!x.startsWith("no ")&&!x.includes("no se acepta")&&(x==="se acepta"||x==="aceptado"||x==="aceptada"||x.includes("acepta con observaciones")||x.includes("aceptado con observaciones"));};

export function dashboardData(personalName?:string){
 const allNeeds=db.prepare("SELECT * FROM needs ORDER BY created_at DESC").all() as any[];
 const allInitiatives=db.prepare("SELECT * FROM initiatives ORDER BY updated_at DESC").all() as any[];
 const templates=db.prepare("SELECT * FROM template_records").all() as any[];
 const weekly=db.prepare("SELECT * FROM weekly_board_items").all() as any[];
 const capacity=db.prepare("SELECT * FROM capacity_records").all() as any[];
 const measurements=db.prepare("SELECT * FROM value_measurements").all() as any[];
 const brms=db.prepare("SELECT id,name,email,area FROM users WHERE role='BRM' AND active=1 ORDER BY name").all() as any[];
 const byInitiative=new Map<number,any[]>(); for(const t of templates){const a=byInitiative.get(t.initiative_id)||[];a.push(t);byInitiative.set(t.initiative_id,a)}
 const personalNeedIds=personalName?new Set(allNeeds.filter(n=>n.assigned_brm===personalName).map(n=>n.id)):null;
 const personalInitiativeIds=personalName?new Set(allInitiatives.filter(i=>i.owner===personalName||allNeeds.some(n=>personalNeedIds?.has(n.id)&&n.initiative_id===i.id)).map(i=>i.id)):null;
 const needs=personalName?allNeeds.filter(n=>n.assigned_brm===personalName||(n.initiative_id&&personalInitiativeIds?.has(n.initiative_id))):allNeeds;
 const initiatives=personalName?allInitiatives.filter(i=>personalInitiativeIds?.has(i.id)):allInitiatives;
 const ids=new Set(initiatives.map(i=>i.id));
 const scopedWeekly=personalName?weekly.filter(w=>w.initiative_id&&ids.has(w.initiative_id)):weekly;
 const linked=needs.filter(n=>n.initiative_id); const ready=initiatives.filter(i=>i.ready_transitioned_at); const commit=initiatives.filter(i=>i.commit_confirmed_at);
 const accepted=initiatives.filter(i=>{if(i.accept_confirmed_at)return true;const r=(byInitiative.get(i.id)||[]).find((x:any)=>x.template_id===19);return acceptedDecision(parse(r?.data).acceptance_decision)});
 const m90=new Set(measurements.filter(m=>String(m.measurement_cut)==="90").map(m=>m.initiative_id));
 const m180=new Set(measurements.filter(m=>String(m.measurement_cut)==="180").map(m=>m.initiative_id));
 const readyTimes=ready.map(i=>{const n=allNeeds.find(n=>n.initiative_id===i.id);return ms(n?.created_at||i.created_at,i.ready_transitioned_at)});
 const commitTimes=commit.map(i=>ms(i.ready_transitioned_at,i.commit_confirmed_at));
 const acceptTimes=accepted.map(i=>ms(i.commit_confirmed_at,i.accept_confirmed_at||((byInitiative.get(i.id)||[]).find((x:any)=>x.template_id===19)?.updated_at)));
 const cycleTimes=accepted.map(i=>{const n=allNeeds.find(n=>n.initiative_id===i.id);return ms(n?.created_at||i.created_at,i.accept_confirmed_at||((byInitiative.get(i.id)||[]).find((x:any)=>x.template_id===19)?.updated_at))});
 const blocked=scopedWeekly.filter(w=>["detenido","bloqueado","escalar"].some(k=>String(w.status).toLowerCase().includes(k)));
 const overdue=scopedWeekly.filter(w=>w.due_date&&new Date(w.due_date)<new Date()&&!String(w.status).toLowerCase().includes("cerr"));
 const typeCounts:Record<string,number>={}; needs.forEach(n=>{const k=n.work_type||"Por clasificar";typeCounts[k]=(typeCounts[k]||0)+1});
 const stageCounts={Intake:needs.filter(n=>!n.initiative_id).length,SHAPE:initiatives.filter(i=>!i.ready_transitioned_at).length,READY:initiatives.filter(i=>i.ready_transitioned_at&&!i.commit_confirmed_at).length,COMMIT:commit.length,Aceptadas:accepted.length,"Medición 90d":accepted.filter(i=>m90.has(i.id)).length,"Medición 180d":accepted.filter(i=>m180.has(i.id)).length};
 const capRows=personalName?capacity.filter(c=>needs.some(n=>n.requester_area===c.area)||initiatives.some(i=>i.area===c.area)):capacity;
 const cap={total:capRows.reduce((s,c)=>s+Number(c.total_capacity||0),0),committed:capRows.reduce((s,c)=>s+Number(c.committed_capacity||0),0),available:capRows.reduce((s,c)=>s+Number(c.available_capacity||0),0)};
 const brmNames=personalName?[personalName]:[...new Set([...brms.map(b=>b.name),...allNeeds.map(n=>n.assigned_brm).filter(Boolean),...allInitiatives.map(i=>i.owner).filter(Boolean)])];
 const brmRows=brmNames.map(name=>{const ns=allNeeds.filter(n=>n.assigned_brm===name);const is=allInitiatives.filter(i=>i.owner===name||ns.some(n=>n.initiative_id===i.id));const iids=new Set(is.map(i=>i.id));const wi=weekly.filter(w=>w.initiative_id&&iids.has(w.initiative_id));const bl=wi.filter(w=>["detenido","bloqueado","escalar"].some(k=>String(w.status).toLowerCase().includes(k))).length;const ov=wi.filter(w=>w.due_date&&new Date(w.due_date)<new Date()&&!String(w.status).toLowerCase().includes("cerr")).length;const pending=is.filter(i=>!m90.has(i.id)&&!m180.has(i.id)).length;return {name,area:brms.find(b=>b.name===name)?.area||ns[0]?.requester_area||"—",portfolio:is.length||ns.length,wip:is.filter(i=>!String(i.status).toLowerCase().includes("cerr")).length,blocked:bl,overdue:ov,ready:is.filter(i=>i.ready_transitioned_at).length,commit:is.filter(i=>i.commit_confirmed_at).length,valuePending:pending,health:bl>1||ov>2?"Crítica":bl||ov?"Atención":"Saludable"};});
 return {kpis:{needs:needs.length,active:initiatives.length,avgIntakeReady:formatDuration(avgMs(readyTimes)),avgReadyCommit:formatDuration(avgMs(commitTimes)),avgCommitAccept:formatDuration(avgMs(acceptTimes)),avgCycle:formatDuration(avgMs(cycleTimes)),blocked:blocked.length,overdue:overdue.length,acceptance:pct(accepted.length,commit.length),measurement90:pct(accepted.filter(i=>m90.has(i.id)).length,accepted.length),measurement180:pct(accepted.filter(i=>m180.has(i.id)).length,accepted.length),traceability:pct(linked.length,needs.length)},typeCounts,stageCounts,capacity:cap,brmRows,recent:needs.slice(0,6)};
}
