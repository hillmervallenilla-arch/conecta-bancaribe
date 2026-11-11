import {cookies} from "next/headers";
import db from "@/lib/db";
export type Role="BUSINESS_USER"|"AREA_COUNTERPART"|"BRM"|"DEMAND_MANAGER"|"TECH_OWNER"|"GOVERNANCE"|"AUDITOR"|"EXECUTIVE"|"ADMIN";
export type SessionUser={id:number,name:string,email:string,area:string,role:Role,permissions:string[]};
export async function currentUser():Promise<SessionUser|null>{
 const c=await cookies();const id=Number(c.get("brm_user")?.value||0);if(!id)return null;
 const u=db.prepare("SELECT id,name,email,area,role FROM users WHERE id=? AND active=1").get(id) as any;if(!u)return null;
 const permissions=(db.prepare(`SELECT p.code FROM security_permissions p JOIN security_role_permissions rp ON rp.permission_id=p.id JOIN security_roles r ON r.id=rp.role_id WHERE r.code=? AND r.active=1 AND p.active=1 AND rp.granted=1 ORDER BY p.menu_order`).all(u.role) as any[]).map(x=>x.code);
 return {...u,permissions};
}
export function hasPermission(u:SessionUser|null,permission:string){return Boolean(u?.permissions?.includes(permission));}
export function menuForUser(u:SessionUser){return db.prepare(`SELECT p.code,p.menu_label label,p.menu_href href,p.menu_icon icon,p.category,p.menu_order FROM security_permissions p JOIN security_role_permissions rp ON rp.permission_id=p.id JOIN security_roles r ON r.id=rp.role_id WHERE r.code=? AND r.active=1 AND p.active=1 AND rp.granted=1 AND p.menu_href<>'' ORDER BY p.menu_order`).all(u.role) as any[];}
export const roleLabel:Record<Role,string>={BUSINESS_USER:"Usuario de Negocio",AREA_COUNTERPART:"Contraparte del Área",BRM:"BRM / Gestor de Relación",DEMAND_MANAGER:"Gestor de Demanda",TECH_OWNER:"Responsable Técnico",GOVERNANCE:"Gobierno / Administrador",AUDITOR:"Auditor / Consulta",EXECUTIVE:"Ejecutivo / Vista Global",ADMIN:"Administrador de Seguridad"};
