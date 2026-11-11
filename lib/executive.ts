import db from "@/lib/db";
import {capacityRecords} from "@/lib/capacity";
import {dashboardData} from "@/lib/metrics";
import {reportsData} from "@/lib/reports";
const age=(d?:string)=>d?Math.max(0,Math.floor((Date.now()-new Date(d).getTime())/86400000)):0;
const monthKey=(d:any)=>String(d||"").slice(0,7);
export function executiveDashboardData(){
 const d=dashboardData(); const reports=reportsData();
 const needs=db.prepare("SELECT * FROM needs ORDER BY created_at").all() as any[];
 const initiatives=db.prepare("SELECT * FROM initiatives ORDER BY created_at").all() as any[];
 const weekly=db.prepare("SELECT * FROM weekly_board_items ORDER BY updated_at DESC").all() as any[];
 const capacity=capacityRecords();
 const measurements=db.prepare("SELECT * FROM value_measurements").all() as any[];
 const now=new Date(), months:string[]=[]; for(let k=5;k>=0;k--){const x=new Date(now.getFullYear(),now.getMonth()-k,1);months.push(`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}`)}
 const trend=months.map(m=>({month:m,needs:needs.filter(n=>monthKey(n.created_at)===m).length,commit:initiatives.filter(i=>i.commit_confirmed_at&&monthKey(i.commit_confirmed_at)===m).length,accept:initiatives.filter(i=>i.accept_confirmed_at&&monthKey(i.accept_confirmed_at)===m).length,value:measurements.filter(v=>monthKey(v.measurement_date||v.updated_at)===m).length}));
 const nByInit=new Map(needs.filter(n=>n.initiative_id).map(n=>[n.initiative_id,n]));
 const blocked=weekly.filter(w=>["detenido","bloqueado","escalar"].some(k=>String(w.status).toLowerCase().includes(k)));
 const overdue=weekly.filter(w=>w.due_date&&new Date(w.due_date)<now&&!String(w.status).toLowerCase().includes("cerr"));
 const attention=[
  ...blocked.map(w=>{const i:any=initiatives.find(x=>x.id===w.initiative_id);const n:any=i?nByInit.get(i.id):null;return {severity:"Crítica",kind:"Bloqueo",nv:n?.master_id||`INIT-${w.initiative_id||"—"}`,title:w.title,detail:w.situation||"Bloqueo operativo",owner:w.owner||i?.owner||"Sin responsable",days:age(w.created_at),initiativeId:w.initiative_id||null}}),
  ...overdue.filter(w=>!blocked.some(b=>b.id===w.id)).map(w=>{const i:any=initiatives.find(x=>x.id===w.initiative_id);const n:any=i?nByInit.get(i.id):null;return {severity:"Atención",kind:"Vencimiento",nv:n?.master_id||`INIT-${w.initiative_id||"—"}`,title:w.title,detail:`Compromiso vencido ${w.due_date}`,owner:w.owner||i?.owner||"Sin responsable",days:age(w.due_date),initiativeId:w.initiative_id||null}}),
  ...needs.filter(n=>!n.assigned_brm&&age(n.created_at)>=3).map(n=>({severity:"Atención",kind:"Demanda",nv:n.master_id,title:n.title,detail:"Necesidad sin BRM asignado",owner:"Sin asignar",days:age(n.created_at),initiativeId:n.initiative_id||null})),
  ...initiatives.filter(i=>i.commit_confirmed_at&&!i.accept_confirmed_at&&age(i.commit_confirmed_at)>=30).map(i=>{const n:any=nByInit.get(i.id);return {severity:"Atención",kind:"Entrega",nv:n?.master_id||`INIT-${i.id}`,title:i.title,detail:"COMMIT sin aceptación formal por 30+ días",owner:i.owner||"—",days:age(i.commit_confirmed_at),initiativeId:i.id}})
 ].sort((a,b)=>(a.severity===b.severity?b.days-a.days:a.severity==="Crítica"?-1:1)).slice(0,12);
 const capByArea=capacity.map(c=>({area:c.area,total:Number(c.total_capacity||0),committed:Number(c.committed_capacity||0),available:Number(c.available_capacity||0),utilization:Number(c.total_capacity)?Math.round(Number(c.committed_capacity)*100/Number(c.total_capacity)):0}));
 const reportSummary=reports.map(r=>({key:r.key,title:r.title,tag:r.tag,description:r.description,metrics:r.metrics}));
 return {...d,attention,trend,capByArea,reportSummary,generatedAt:new Date().toISOString()};
}
