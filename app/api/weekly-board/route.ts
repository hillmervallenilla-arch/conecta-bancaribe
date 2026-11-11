export const dynamic="force-dynamic";
export const revalidate=0;
import db from "@/lib/db";import {NextResponse} from "next/server";

function enrich(h:any){
 if(!h)return h;
 let snapshot:any={};
 try{snapshot=JSON.parse(h.snapshot_json||"{}")}catch{}
 return {...h,snapshot};
}
export async function GET(){
 const board=db.prepare("SELECT * FROM weekly_boards WHERE status='Activa' ORDER BY id DESC LIMIT 1").get() as any;
 const rawHistory=db.prepare("SELECT * FROM weekly_boards WHERE status='Cerrada' ORDER BY id DESC").all() as any[];
 const history=rawHistory.map(enrich);
 const items=board?db.prepare("SELECT wi.*,i.title initiative_title FROM weekly_board_items wi LEFT JOIN initiatives i ON i.id=wi.initiative_id WHERE wi.board_id=? ORDER BY wi.id DESC").all(board.id):[];
 const initiatives=db.prepare("SELECT id,title,area,phase,status FROM initiatives ORDER BY title").all();
 return NextResponse.json({board,items,history,initiatives},{headers:{"Cache-Control":"no-store, no-cache, must-revalidate"}});
}
export async function POST(req:Request){
 const b=await req.json();
 let board=db.prepare("SELECT * FROM weekly_boards WHERE status='Activa' ORDER BY id DESC LIMIT 1").get() as any;
 if(!board){
   const r=db.prepare("INSERT INTO weekly_boards(week,manager,areas,start_date,end_date) VALUES(?,?,?,?,?)").run(b.week||"",b.manager||"",b.areas||"",b.start_date||"",b.end_date||"");
   board={id:Number(r.lastInsertRowid)};
 }
 if(b.action==="save"){
   db.prepare("UPDATE weekly_boards SET week=?,manager=?,areas=?,start_date=?,end_date=?,routine_json=?,close_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .run(b.week||"",b.manager||"",b.areas||"",b.start_date||"",b.end_date||"",JSON.stringify(b.routine||[]),JSON.stringify(b.close||{}),board.id);
   const saved=db.prepare("SELECT * FROM weekly_boards WHERE id=?").get(board.id) as any;
   return NextResponse.json({ok:true,id:board.id,board:saved,routine:JSON.parse(saved.routine_json||"[]"),close:JSON.parse(saved.close_json||"{}")},{headers:{"Cache-Control":"no-store"}});
 }
 if(b.action==="add"){
   const tx=db.transaction(()=>{
     const routine=Array.from({length:20},(_,i)=>Boolean((b.routine||[])[i]));
     const closeData={adv:b.close?.adv||"",blk:b.close?.blk||"",dec:b.close?.dec||"",next:b.close?.next||""};
     // Agregar al tablero no debe alterar la rutina que el Gestor ya marcó.
     // Persistimos primero exactamente el estado visible y luego insertamos el compromiso.
     db.prepare("UPDATE weekly_boards SET week=?,manager=?,areas=?,start_date=?,end_date=?,routine_json=?,close_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(b.week||"",b.manager||"",b.areas||"",b.start_date||"",b.end_date||"",JSON.stringify(routine),JSON.stringify(closeData),board.id);
     db.prepare("INSERT INTO weekly_board_items(board_id,title,area,status,situation,next_action,owner,due_date,initiative_id) VALUES(?,?,?,?,?,?,?,?,?)")
      .run(board.id,b.title,b.area||"",b.status||"En seguimiento",b.situation||"",b.next_action||"",b.owner||"",b.due_date||"",b.initiative_id||null);
     if(b.initiative_id){
       db.prepare("INSERT INTO initiative_activity(initiative_id,event_type,title,detail) VALUES(?,?,?,?)").run(Number(b.initiative_id),"BITACORA","Seguimiento semanal registrado",`${b.status||"En seguimiento"} · ${b.title}${b.next_action?` · Próxima acción: ${b.next_action}`:""}`);
     }
   });
   tx();
   const saved=db.prepare("SELECT * FROM weekly_boards WHERE id=?").get(board.id) as any;
   return NextResponse.json({ok:true,board:saved,routine:JSON.parse(saved.routine_json||"[]"),close:JSON.parse(saved.close_json||"{}")},{headers:{"Cache-Control":"no-store"}});
 }
 if(b.action==="close"){
   if(!b.start_date||!b.end_date) return NextResponse.json({ok:false,error:"El período semanal es obligatorio"},{status:400});
   const tx=db.transaction(()=>{
     const routine=Array.from({length:20},(_,i)=>Boolean((b.routine||[])[i]));
     const closeData={adv:b.close?.adv||"",blk:b.close?.blk||"",dec:b.close?.dec||"",next:b.close?.next||""};
     // Persistimos primero el estado completo que el usuario está viendo.
     db.prepare("UPDATE weekly_boards SET week=?,manager=?,areas=?,start_date=?,end_date=?,routine_json=?,close_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(b.week||"",b.manager||"",b.areas||"",b.start_date,b.end_date,JSON.stringify(routine),JSON.stringify(closeData),board.id);

     const allItems=db.prepare("SELECT * FROM weekly_board_items WHERE board_id=? ORDER BY id").all(board.id) as any[];
     const statuses=["En seguimiento","Detenido","Escalar","Cerrado"];
     const counts=Object.fromEntries(statuses.map(s=>[s,allItems.filter(i=>i.status===s).length]));
     const snapshot={
       start_date:b.start_date,end_date:b.end_date,manager:b.manager||"",areas:b.areas||"",
       routine,routine_pct:Math.round(routine.filter(Boolean).length/20*100),
       counts,items:allItems,close:closeData
     };
     db.prepare("UPDATE weekly_boards SET snapshot_json=?,status='Cerrada',closed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(JSON.stringify(snapshot),board.id);

     const carry=allItems.filter(i=>["En seguimiento","Detenido","Escalar"].includes(i.status));
     const r2=db.prepare("INSERT INTO weekly_boards(week,manager,areas,start_date,end_date,routine_json,close_json) VALUES('',?,?,? ,?,'[]','{}')")
      .run(b.manager||"",b.areas||"","","");
     const nid=Number(r2.lastInsertRowid);
     const ins=db.prepare("INSERT INTO weekly_board_items(board_id,title,area,status,situation,next_action,owner,due_date,initiative_id) VALUES(?,?,?,?,?,?,?,?,?)");
     carry.forEach(i=>ins.run(nid,i.title,i.area,i.status,i.situation,i.next_action,i.owner,i.due_date,i.initiative_id));
     return {carried:carry.length,routine_pct:snapshot.routine_pct};
   });
   const result=tx();
   return NextResponse.json({ok:true,...result});
 }
 return NextResponse.json({ok:false},{status:400});
}
