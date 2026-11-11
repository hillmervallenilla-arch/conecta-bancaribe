import "dotenv/config";
import {getMailConfig,verifyMailConnection} from "../lib/mail";
async function main(){
 try{
  const cfg=getMailConfig();
  console.log("[SMTP] Configuración encontrada"); console.log(`[SMTP] Servidor: ${cfg.host}:${cfg.port}`); console.log(`[SMTP] Usuario: ${cfg.user}`); console.log(`[SMTP] Destino: ${cfg.recipient}`); console.log("[SMTP] Verificando conexión...");
  const {transport}=await verifyMailConnection(); console.log("✓ Autenticación SMTP correcta"); console.log("[SMTP] Enviando correo de prueba...");
  const info=await transport.sendMail({from:{name:cfg.fromName,address:cfg.fromAddress},to:cfg.recipient,subject:"Prueba SMTP · Conecta Bancaribe",text:"Configuración SMTP validada correctamente para el demo de Conecta Bancaribe."});
  console.log("✓ CORREO ENVIADO"); console.log(`Message ID: ${info.messageId}`); console.log(`Destinatario: ${cfg.recipient}`);
 }catch(e:any){console.error("✗ ERROR SMTP:",e?.code||"",e?.response||e?.message||e);process.exit(1)}
}
main();
