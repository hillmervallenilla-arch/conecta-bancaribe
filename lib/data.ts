import db from "./db";
export type Initiative={id:number;title:string;area:string;owner:string;phase:number;status:string;value_statement:string;created_at:string;updated_at:string};
export function listInitiatives(){return db.prepare("SELECT * FROM initiatives ORDER BY updated_at DESC").all() as Initiative[]}
export function getInitiative(id:number){return db.prepare("SELECT * FROM initiatives WHERE id=?").get(id) as Initiative|undefined}
export function getRecords(id:number){return db.prepare("SELECT * FROM template_records WHERE initiative_id=?").all(id) as any[]}
