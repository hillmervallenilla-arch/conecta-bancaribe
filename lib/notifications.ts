import db from "@/lib/db";
import {createMailTransport,getMailConfig} from "@/lib/mail";
export const BRM_DEMO_RECIPIENT=process.env.BRM_NOTIFICATION_RECIPIENT||"hvallenilla@bancaribe.com.ve";
export async function notifyNewNeed(need:any){
 const recipient=process.env.BRM_NOTIFICATION_RECIPIENT||BRM_DEMO_RECIPIENT; const subject=`Nueva solicitud de necesidad | ${need.master_id}`; const app=process.env.APP_URL||"http://localhost:3000";
 const body=`Nueva necesidad registrada en Conecta Bancaribe\n\nID: ${need.master_id}\nSolicitante: ${need.requester}\nÁrea: ${need.requester_area}\nPreclasificación: ${need.requester_classification||"No indicada"}\nBreve descripción: ${need.title}\nEstado: Pendiente BRM\n\nAcción requerida: revisar la necesidad desde el BRM Inbox.\n${app}/portal/necesidad/${need.id}\n`;
 if(String(process.env.MAIL_ENABLED||"false")!=="true")return {ok:true,status:"DESHABILITADA",recipient};
 try{const cfg=getMailConfig();const info=await createMailTransport(cfg).sendMail({from:{name:cfg.fromName,address:cfg.fromAddress},to:recipient,subject,text:body});db.prepare("INSERT INTO notification_log(need_id,notification_type,recipient,subject,status,detail) VALUES(?,?,?,?,?,?)").run(need.id,"NUEVA_NECESIDAD_BRM",recipient,subject,"ENVIADA",String(info.messageId||""));return {ok:true,status:"ENVIADA",recipient,messageId:info.messageId};}
 catch(e:any){db.prepare("INSERT INTO notification_log(need_id,notification_type,recipient,subject,status,detail) VALUES(?,?,?,?,?,?)").run(need.id,"NUEVA_NECESIDAD_BRM",recipient,subject,"ERROR",String(e?.message||e));return {ok:false,status:"ERROR",recipient,error:String(e?.message||e)};}
}
