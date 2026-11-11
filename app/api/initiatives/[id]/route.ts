import {validateCapacity,CapacityRequest} from "@/lib/capacity";
import db from "@/lib/db";import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params; const iid=Number(id);
 const initiative=db.prepare("SELECT * FROM initiatives WHERE id=?").get(iid) as any;
 if(!initiative)return NextResponse.json({error:"No encontrada"},{status:404});
 const weekly=db.prepare("SELECT wi.*,wb.start_date,wb.end_date,wb.status board_status,wb.closed_at FROM weekly_board_items wi JOIN weekly_boards wb ON wb.id=wi.board_id WHERE wi.initiative_id=? ORDER BY wi.id DESC").all(iid);
 const templates=db.prepare("SELECT * FROM template_records WHERE initiative_id=? ORDER BY template_id").all(iid);
 const processTemplates=db.prepare("SELECT * FROM process_template_records ORDER BY template_id").all() as any[];
 const activity=db.prepare("SELECT * FROM initiative_activity WHERE initiative_id=? ORDER BY id DESC").all(iid);
 const masterRecord=db.prepare("SELECT * FROM needs WHERE initiative_id=? ORDER BY id DESC LIMIT 1").get(iid) as any;
 const attachments=masterRecord?db.prepare("SELECT id,file_name,file_type,file_size,uploaded_by,created_at FROM need_attachments WHERE need_id=? ORDER BY id DESC").all(masterRecord.id):[];
 const tmap:any=Object.fromEntries((templates as any[]).map((r:any)=>[Number(r.template_id),r]));
 const pmap:any=Object.fromEntries(processTemplates.map((r:any)=>[Number(r.template_id),r]));
 const requiredReady=[3,4,6,7];
 const requiredFields:any={
 3:["record_id","record_date","requester","arrival_channel","user_request","problem","affected_frequency","current_consequence","since_when","expected_improvement","resolution_check","business_indicator","benefit_validator","deadline_origin","regulatory_mandate","systems_areas","dependencies","inaction","consequence_horizon","exposure","solution_outline","solution_systems","architecture_confirm","proposed_path","path_reason","architecture_control","security_control"],
 4:["effort_threshold","duration_threshold","investment_threshold","areas_threshold","outside_budget","new_product_rule","classification_questions","exception_rules","review_date","review_changes","review_owner"],
 6:["requirement_id","requirement_type","requester","registration_date","affected_service","need","current_behavior","expected_behavior","reproduction","benefit","acceptance_criteria","performance","availability","security","auditability","capacity","compatibility","deadline","regulatory_label","dependencies","period_impact"],
 7:["ready_criteria","project_extra","done_criteria","exceptions"]
};
 const artifactComplete=(n:number,r:any)=>{if(!r?.data)return false;try{const p=JSON.parse(r.data);if(p.field1!==undefined||p.field2!==undefined)return Boolean(String(p.field1??"").trim()&&String(p.field2??"").trim());return requiredFields[n].every((k:string)=>String(p[k]??"").trim().length>0)}catch{return false}};
 const readyArtifactChecks:any=Object.fromEntries(requiredReady.map(n=>[n,artifactComplete(n,[4,7].includes(n)?pmap[n]:tmap[n])]));
 const readyCount=Object.values(readyArtifactChecks).filter(Boolean).length;
 const classificationReady=Boolean(masterRecord?.classification_status==="Confirmada"&&masterRecord?.work_type&&masterRecord?.attention_route);
 const ready=readyCount===requiredReady.length&&classificationReady;
 const capacity=db.prepare("SELECT * FROM capacity_records WHERE area=? AND status='Vigente'").get(initiative.area) as any;
 const requiredCommit=[5,8,9,20];
 const commitArtifactChecks:any={
   5:Boolean(tmap[5]?.data&&String(tmap[5].data)!=="{}"),
   8:Boolean(pmap[8]?.data&&String(pmap[8].data)!=="{}"),
   9:Boolean(tmap[9]?.data&&String(tmap[9].data)!=="{}"),
   20:Boolean(tmap[20]?.data&&String(tmap[20].data)!=="{}")
 };
 const commitCount=Object.values(commitArtifactChecks).filter(Boolean).length;
 const commitReady=Boolean(initiative.ready_transitioned_at)&&commitCount===requiredCommit.length;
 const parse=(r:any)=>{try{return JSON.parse(r?.data||"{}")}catch{return {}}};
 const p6=parse(tmap[6]),p19=parse(tmap[19]);
 const acceptChecks:any={
   criteria:Boolean(String(p6.acceptance_criteria||p19.acceptance||"").trim()),
   decision:(()=>{const x=String(p19.acceptance_decision||"").trim().toLowerCase();if(!x||x.startsWith("no ")||x.includes("no se acepta"))return false;return x==="se acepta"||x==="aceptado"||x==="aceptada"||x.includes("acepta con observaciones")||x.includes("aceptado con observaciones")})(),
   deployment:Boolean(String(p19.deployment_date||"").trim())
 };
 const acceptCount=Object.values(acceptChecks).filter(Boolean).length;
 const acceptReady=Boolean(initiative.commit_confirmed_at)&&acceptCount===3;
 const p12=parse(tmap[12]);
 const valueChecks:any={baseline:Boolean(String(parse(tmap[5]).baseline||"").trim()),benefit:Boolean(String(masterRecord?.expected_result||"").trim()),production:Boolean(String(p19.deployment_date||"").trim()),measurement:Boolean(String(p12.measurement_cut||"").trim()&&String(p12.measurement_date||"").trim())};
 const days=(a:any,b:any)=>{if(!a||!b)return null;const x=new Date(a).getTime(),y=new Date(b).getTime();if(Number.isNaN(x)||Number.isNaN(y))return null;return Math.max(0,Math.round((y-x)/86400000))};
 const telemetry:any={
   needCreatedAt:masterRecord?.created_at||null,
   classificationConfirmedAt:masterRecord?.classification_confirmed_at||null,
   readyAt:initiative.ready_transitioned_at||null,
   commitAt:initiative.commit_confirmed_at||null,
   acceptAt:initiative.accept_confirmed_at||null,
   intakeToReadyDays:days(masterRecord?.created_at,initiative.ready_transitioned_at),
   readyToCommitDays:days(initiative.ready_transitioned_at,initiative.commit_confirmed_at),
   needAgeDays:masterRecord?.created_at?days(masterRecord.created_at,new Date().toISOString()):null
 };
 return NextResponse.json({initiative,masterRecord,attachments,weekly,templates,processTemplates,activity,ready,
   readyCount,readyTotal:4,readyArtifactChecks,requiredReady:[3,4,6,7],classificationReady,capacity,
   commitReady,commitCount,commitTotal:4,commitArtifactChecks,requiredCommit,
   acceptReady,acceptCount,acceptChecks,valueChecks,telemetry},{headers:{"Cache-Control":"no-store"}});
}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const iid=Number(id);const b=await req.json();const current=db.prepare("SELECT * FROM initiatives WHERE id=?").get(iid) as any;if(!current)return NextResponse.json({error:"No encontrada"},{status:404});
 if(b.action==="advance_ready"){
   const check=await computeGates(iid);if(!check.ready)return NextResponse.json({error:"La iniciativa aún no cumple Gate READY"},{status:409});
   const now=new Date().toISOString();const tx=db.transaction(()=>{db.prepare("UPDATE initiatives SET phase=3,status='En decisión',ready_transitioned_at=COALESCE(ready_transitioned_at,?),updated_at=CURRENT_TIMESTAMP WHERE id=?").run(now,iid);db.prepare("INSERT INTO initiative_activity(initiative_id,event_type,title,detail) VALUES(?,?,?,?)").run(iid,"READY","Gate READY confirmado","La iniciativa pasó formalmente a DECIDE & ENABLE para priorización, decisión y verificación de capacidad.")});tx();return NextResponse.json({ok:true,phase:3});
 }
 if(b.action==="commit"){
   const check=await computeGates(iid);if(!check.commitReady)return NextResponse.json({error:"Aún faltan evidencias para COMMIT"},{status:409});
   const saved=db.prepare("SELECT data FROM template_records WHERE initiative_id=? AND template_id=20").get(iid) as any;
   let allocations:CapacityRequest[]=[];try{allocations=JSON.parse(JSON.parse(saved?.data||"{}").capacity_allocations||"[]")}catch{}
   if(!Array.isArray(allocations)||!allocations.length)return NextResponse.json({error:"Complete las asignaciones por área en la Plantilla 20"},{status:409});
   const now=new Date().toISOString();const tx=db.transaction(()=>{const issues=validateCapacity(allocations,iid);if(issues.length)throw new Error(issues.join("; "));db.prepare("UPDATE initiative_capacity_allocations SET status='REEMPLAZADA',updated_at=CURRENT_TIMESTAMP WHERE initiative_id=? AND status='ACTIVA'").run(iid);for(const a of allocations)db.prepare("INSERT INTO initiative_capacity_allocations(initiative_id,area,period,capacity_amount,start_date,planned_release_date,status,source) VALUES(?,?,?,?,?,?,'ACTIVA','COMMIT')").run(iid,a.area,a.period,Number(a.capacity_amount),a.start_date,a.planned_release_date);db.prepare("UPDATE initiatives SET phase=4,status='Comprometida',commit_confirmed_at=COALESCE(commit_confirmed_at,?),updated_at=CURRENT_TIMESTAMP WHERE id=?").run(now,iid);db.prepare("INSERT INTO initiative_activity(initiative_id,event_type,title,detail) VALUES(?,?,?,?)").run(iid,"COMMIT","Gate COMMIT confirmado","Prioridad, decisión y capacidad quedaron alineadas. La iniciativa pasa a DELIVER & REALIZE.")});try{tx()}catch(e:any){return NextResponse.json({error:e?.message||"Capacidad insuficiente"},{status:409})}return NextResponse.json({ok:true,phase:4});
 }
 return NextResponse.json({error:"Acción no soportada"},{status:400});
}
async function computeGates(iid:number){
 const i=db.prepare("SELECT * FROM initiatives WHERE id=?").get(iid) as any;const ts=db.prepare("SELECT * FROM template_records WHERE initiative_id=?").all(iid) as any[];const ps=db.prepare("SELECT * FROM process_template_records").all() as any[];const tm:any=Object.fromEntries(ts.map(r=>[Number(r.template_id),r])),pm:any=Object.fromEntries(ps.map(r=>[Number(r.template_id),r]));
 const has=(r:any)=>Boolean(r?.data&&String(r.data)!=="{}");const mr=db.prepare("SELECT * FROM needs WHERE initiative_id=? ORDER BY id DESC LIMIT 1").get(iid) as any;const classificationReady=Boolean(mr?.classification_status==="Confirmada"&&mr?.work_type&&mr?.attention_route);const ready=classificationReady&&has(tm[3])&&has(pm[4])&&has(tm[6])&&has(pm[7]);const commitReady=Boolean(i.ready_transitioned_at)&&has(tm[5])&&has(pm[8])&&has(tm[9])&&has(tm[20]);return {ready,commitReady};
}
