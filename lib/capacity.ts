import db from "@/lib/db";
export const ACTIVE_DELIVERY_STATUSES=["En desarrollo","En pruebas","Bloqueada","Próxima a completar","En ejecución"];
export function capacityRecords(){
 const declarations=db.prepare("SELECT * FROM area_capacity_periods WHERE status='Vigente' ORDER BY area,period DESC").all() as any[];
 return declarations.map(c=>{
  const allocations=db.prepare(`SELECT a.*,i.title,i.delivery_status,i.current_due_date FROM initiative_capacity_allocations a JOIN initiatives i ON i.id=a.initiative_id WHERE a.area=? AND a.status='ACTIVA' AND (a.period=? OR a.period='' OR ?='')`).all(c.area,c.period,c.period) as any[];
  const committed=allocations.reduce((s,a)=>s+Number(a.capacity_amount||0),0);
  const total=Number(c.total_capacity||0); return {...c,committed_capacity:committed,available_capacity:total-committed,utilization:total?Math.round(committed*100/total):0,allocations};
 });
}
export function trafficLight(due:string,status:string){if(!due||["Completada","Aceptada","Cerrada"].includes(status))return {level:"SIN_FECHA",days:0,label:"Sin alerta"};const today=new Date();today.setHours(0,0,0,0);const d=new Date(due+"T00:00:00");const days=Math.ceil((d.getTime()-today.getTime())/86400000);if(days<0)return {level:"ROJO",days,label:`Vencida por ${Math.abs(days)} días`};if(days<=7)return {level:"NARANJA",days,label:`Vence en ${days} días`};if(days<=15)return {level:"AMARILLO",days,label:`Vence en ${days} días`};return {level:"VERDE",days,label:`${days} días restantes`};}

export type CapacityRequest={area:string;period:string;capacity_amount:number;start_date:string;planned_release_date:string};
export function validateCapacity(requests:CapacityRequest[],excludeInitiativeId=0){
 const errors:string[]=[];const seen=new Set<string>();
 for(const r of requests){const key=r.area+"|"+r.period;if(seen.has(key))errors.push(`Área/período duplicado: ${key}`);seen.add(key);
  if(!r.area||!/^\d{4}-\d{2}$/.test(r.period)||!Number.isFinite(r.capacity_amount)||r.capacity_amount<=0||!/^\d{4}-\d{2}-\d{2}$/.test(r.start_date)||!/^\d{4}-\d{2}-\d{2}$/.test(r.planned_release_date)||r.planned_release_date<r.start_date||!r.start_date.startsWith(r.period))errors.push(`Asignación inválida: ${key}`);
  const c=db.prepare("SELECT total_capacity FROM area_capacity_periods WHERE area=? AND period=? AND status='Vigente'").get(r.area,r.period) as any;
  if(!c){errors.push(`No existe capacidad publicada para ${key}`);continue;}
  const used=db.prepare("SELECT COALESCE(SUM(capacity_amount),0) AS used FROM initiative_capacity_allocations WHERE area=? AND (period=? OR period='') AND status='ACTIVA' AND initiative_id<>?").get(r.area,r.period,excludeInitiativeId) as any;
  const free=Number(c.total_capacity)-Number(used.used);if(r.capacity_amount>free+1e-8)errors.push(`${r.area} (${r.period}): requiere ${r.capacity_amount} FTE, disponibles ${free} FTE; déficit ${(r.capacity_amount-free).toFixed(2)} FTE`);
 }return errors;
}
