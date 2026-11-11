import db from "@/lib/db";import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const iid=Number(id);
 const rows=db.prepare("SELECT * FROM template_records WHERE initiative_id=? ORDER BY template_id").all(iid) as any[];
 return NextResponse.json({records:rows},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const {id}=await params;const iid=Number(id);const b=await req.json();const tid=Number(b.template_id);
  if(!iid||!tid)return NextResponse.json({error:"Identificador de iniciativa o plantilla inválido"},{status:400});
  const initiative=db.prepare("SELECT * FROM initiatives WHERE id=?").get(iid) as any;
  if(!initiative)return NextResponse.json({error:"Iniciativa no encontrada"},{status:404});
  const canonical=String(initiative.external_id||initiative.code||initiative.initiative_code||`INI-${String(iid).padStart(5,"0")}`);
  const payload={...(b.payload||{})};
  for(const key of ["initiative_code",...(tid===19?["receiver_process_id"]:[]),...(tid===12?["business_case_id"]:[])]){
   if(payload[key]&&String(payload[key]).trim()!==canonical)return NextResponse.json({error:`El identificador ${key} debe coincidir con el expediente: ${canonical}`},{status:400});
   payload[key]=canonical;
  }
  const data=JSON.stringify(payload);
  const old=db.prepare("SELECT id FROM template_records WHERE initiative_id=? AND template_id=?").get(iid,tid) as any;
  const tx=db.transaction(()=>{
   if(old){
    db.prepare("UPDATE template_records SET data=?,status='Completada',updated_at=CURRENT_TIMESTAMP,revision_count=COALESCE(revision_count,0)+1 WHERE id=?").run(data,old.id);
    db.prepare("INSERT INTO initiative_activity(initiative_id,event_type,title,detail) VALUES(?,?,?,?)").run(iid,"ARTEFACTO",`Plantilla ${String(tid).padStart(2,"0")} actualizada`,"Se modificó información del artefacto.");
   }else{
    db.prepare("INSERT INTO template_records(initiative_id,template_id,data,status,revision_count) VALUES(?,?,?,'Completada',0)").run(iid,tid,data);
    db.prepare("INSERT INTO initiative_activity(initiative_id,event_type,title,detail) VALUES(?,?,?,?)").run(iid,"ARTEFACTO",`Plantilla ${String(tid).padStart(2,"0")} completada`,"Artefacto registrado por primera vez.");
   }
   // Plantilla 19: registra el instante formal de aceptación cuando la decisión es positiva.
   if(tid===19){
    const p=b.payload||{};const x=String(p.acceptance_decision||"").trim().toLowerCase();
    const accepted=!!x&&!x.startsWith("no ")&&!x.includes("no se acepta")&&(x==="se acepta"||x==="aceptado"||x==="aceptada"||x.includes("acepta con observaciones")||x.includes("aceptado con observaciones"));
    if(accepted&&String(p.deployment_date||"").trim()) db.prepare("UPDATE initiatives SET accept_confirmed_at=COALESCE(accept_confirmed_at,?),updated_at=CURRENT_TIMESTAMP WHERE id=?").run(new Date().toISOString(),iid);
   }
   // Plantilla 12: cada corte 90/180 queda persistido por separado; 180 no sobrescribe 90.
   if(tid===12){
    const p=b.payload||{};const raw=String(p.measurement_cut||"").trim();const cut=raw.match(/180/)?"180":raw.match(/90/)?"90":"";
    if(cut&&String(p.measurement_date||"").trim()) db.prepare(`INSERT INTO value_measurements(initiative_id,measurement_cut,measurement_date,data) VALUES(?,?,?,?) ON CONFLICT(initiative_id,measurement_cut) DO UPDATE SET measurement_date=excluded.measurement_date,data=excluded.data,updated_at=CURRENT_TIMESTAMP`).run(iid,cut,String(p.measurement_date),data);
   }
  });tx();
  return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 }catch(e:any){console.error("template-save",e);return NextResponse.json({error:e?.message||"Error al guardar"},{status:500})}
}
