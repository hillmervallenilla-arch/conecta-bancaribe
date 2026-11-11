import Database from "better-sqlite3"; import fs from "fs"; import path from "path";
const dir=path.join(process.cwd(),"data"); fs.mkdirSync(dir,{recursive:true});
const db=new Database(path.join(dir,"prototipo.db")); db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS initiatives(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,area TEXT NOT NULL,owner TEXT DEFAULT '',phase INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'Nueva',value_statement TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS weekly_boards(id INTEGER PRIMARY KEY AUTOINCREMENT,week TEXT NOT NULL,manager TEXT DEFAULT '',areas TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'Activa',routine_json TEXT NOT NULL DEFAULT '[]',close_json TEXT NOT NULL DEFAULT '{}',closed_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS weekly_board_items(id INTEGER PRIMARY KEY AUTOINCREMENT,board_id INTEGER NOT NULL,title TEXT NOT NULL,area TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'En seguimiento',situation TEXT DEFAULT '',next_action TEXT DEFAULT '',owner TEXT DEFAULT '',due_date TEXT DEFAULT '',initiative_id INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS initiative_activity(id INTEGER PRIMARY KEY AUTOINCREMENT,initiative_id INTEGER NOT NULL,event_type TEXT NOT NULL,title TEXT NOT NULL,detail TEXT DEFAULT '',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS template_records(id INTEGER PRIMARY KEY AUTOINCREMENT,initiative_id INTEGER NOT NULL,template_id INTEGER NOT NULL,data TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'Borrador',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(initiative_id,template_id));

CREATE TABLE IF NOT EXISTS capacity_records(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 area TEXT NOT NULL UNIQUE,
 period TEXT NOT NULL DEFAULT '',
 total_capacity REAL NOT NULL DEFAULT 0,
 committed_capacity REAL NOT NULL DEFAULT 0,
 available_capacity REAL NOT NULL DEFAULT 0,
 wip_limit INTEGER NOT NULL DEFAULT 0,
 owner TEXT NOT NULL DEFAULT '',
 publication_date TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'Vigente',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS process_template_records(id INTEGER PRIMARY KEY AUTOINCREMENT,template_id INTEGER NOT NULL UNIQUE,data TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'Borrador',revision_count INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);

// Migraciones incrementales de Bitácora Semanal del Gestor (V2.1.3)
const boardCols=(db.prepare("PRAGMA table_info(weekly_boards)").all() as any[]).map(c=>c.name);
if(!boardCols.includes("start_date")) db.exec("ALTER TABLE weekly_boards ADD COLUMN start_date TEXT DEFAULT ''");
if(!boardCols.includes("end_date")) db.exec("ALTER TABLE weekly_boards ADD COLUMN end_date TEXT DEFAULT ''");
if(!boardCols.includes("snapshot_json")) db.exec("ALTER TABLE weekly_boards ADD COLUMN snapshot_json TEXT NOT NULL DEFAULT '{}'");

const count=(db.prepare("SELECT COUNT(*) c FROM initiatives").get() as {c:number}).c;
if(!count){const ins=db.prepare("INSERT INTO initiatives(title,area,owner,phase,status,value_statement) VALUES(?,?,?,?,?,?)");
 [["Mejora onboarding digital","Canales Digitales","BRM Canales",1,"En curso","Reducir fricción de incorporación"],
 ["Integración API comercios","Medios de Pagos","BRM Pagos",2,"En análisis","Acelerar integración de comercios"],
 ["Migración de core de pagos","Core Central","BRM Core",3,"En comité","Reducir riesgo tecnológico"],
 ["Tokenización de tarjetas","Medios de Pagos","BRM Pagos",4,"En ejecución","Mejorar seguridad y experiencia"]].forEach(x=>ins.run(...x));}

// V3.1 · Gate READY (migración no destructiva)
const readyCols = [
  ["problem_opportunity","TEXT DEFAULT ''"],
  ["expected_result","TEXT DEFAULT ''"],
  ["success_indicator","TEXT DEFAULT ''"],
  ["inaction_risk","TEXT DEFAULT ''"],
  ["demand_route","TEXT DEFAULT ''"],
  ["ready_evidence","TEXT DEFAULT ''"],
  ["ready_confirmed_at","TEXT"]
];
const initiativeCols = db.prepare("PRAGMA table_info(initiatives)").all().map((c:any)=>c.name);
for (const [name,type] of readyCols) {
  if (!initiativeCols.includes(name)) db.exec(`ALTER TABLE initiatives ADD COLUMN ${name} ${type}`);
}


// V3.2 · compatibilidad de artefactos por iniciativa
const trCols = db.prepare("PRAGMA table_info(template_records)").all().map((c:any)=>c.name);
if (!trCols.includes("updated_at")) db.exec("ALTER TABLE template_records ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP");


// V3.3 · trazabilidad del ciclo de vida de artefactos
const trColsV33 = db.prepare("PRAGMA table_info(template_records)").all().map((c:any)=>c.name);
if (!trColsV33.includes("created_at")) db.exec("ALTER TABLE template_records ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP");
if (!trColsV33.includes("revision_count")) db.exec("ALTER TABLE template_records ADD COLUMN revision_count INTEGER DEFAULT 0");

export default db;


// V3.6 · Transición READY y Gate COMMIT
const initiativeColsV36 = db.prepare("PRAGMA table_info(initiatives)").all().map((c:any)=>c.name);
if (!initiativeColsV36.includes("ready_transitioned_at")) db.exec("ALTER TABLE initiatives ADD COLUMN ready_transitioned_at TEXT");
if (!initiativeColsV36.includes("commit_confirmed_at")) db.exec("ALTER TABLE initiatives ADD COLUMN commit_confirmed_at TEXT");

// V4.0 · Conecta Bancaribe + Registro Maestro de Necesidades
// La necesidad existe antes que la iniciativa. Solo al ser tomada por un BRM se crea/vincula el expediente RELATE.
db.exec(`
CREATE TABLE IF NOT EXISTS needs(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 master_id TEXT UNIQUE,
 requester TEXT NOT NULL DEFAULT '',
 requester_area TEXT NOT NULL DEFAULT '',
 title TEXT NOT NULL DEFAULT '',
 current_situation TEXT NOT NULL DEFAULT '',
 affected_people_process TEXT NOT NULL DEFAULT '',
 frequency TEXT NOT NULL DEFAULT '',
 expected_result TEXT NOT NULL DEFAULT '',
 success_indicator TEXT NOT NULL DEFAULT '',
 deadline_reason TEXT NOT NULL DEFAULT '',
 inaction_risk TEXT NOT NULL DEFAULT '',
 proposed_solution TEXT NOT NULL DEFAULT '',
 original_json TEXT NOT NULL DEFAULT '{}',
 status TEXT NOT NULL DEFAULT 'Pendiente BRM',
 route_suggestion TEXT NOT NULL DEFAULT 'Por evaluar',
 quality_score INTEGER NOT NULL DEFAULT 0,
 assigned_brm TEXT NOT NULL DEFAULT '',
 initiative_id INTEGER,
 approved_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS need_activity(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 need_id INTEGER NOT NULL,
 event_type TEXT NOT NULL,
 title TEXT NOT NULL,
 detail TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);


// V4.1 · Identidad demo, roles y Registro Maestro integrado
const needColsV41 = db.prepare("PRAGMA table_info(needs)").all().map((c:any)=>c.name);
if (!needColsV41.includes("requester_email")) db.exec("ALTER TABLE needs ADD COLUMN requester_email TEXT NOT NULL DEFAULT ''");
db.exec(`
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE,
 area TEXT NOT NULL DEFAULT '',
 role TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);
const userCount=(db.prepare("SELECT COUNT(*) c FROM users").get() as {c:number}).c;
if(!userCount){
 const ins=db.prepare("INSERT INTO users(name,email,area,role) VALUES(?,?,?,?)");
 [
  ["Ana Funcional","ana.funcional@bancaribe.demo","Canales","BUSINESS_USER"],
  ["Carlos Contraparte","carlos.contraparte@bancaribe.demo","Canales","AREA_COUNTERPART"],
  ["María BRM","maria.brm@bancaribe.demo","Canales","BRM"],
  ["Diego Demanda","diego.demanda@bancaribe.demo","Tecnología","DEMAND_MANAGER"],
  ["Laura Técnica","laura.tecnica@bancaribe.demo","Tecnología","TECH_OWNER"],
  ["Sofía Gobierno","sofia.gobierno@bancaribe.demo","Gobierno TI","GOVERNANCE"]
 ].forEach(x=>ins.run(...x));
}

// V4.2.1 · Clasificación y Enrutamiento en SHAPE
const needColsV421 = db.prepare("PRAGMA table_info(needs)").all().map((c:any)=>c.name);
for (const [name, ddl] of [
 ["work_type", "TEXT NOT NULL DEFAULT ''"],
 ["driver_origin", "TEXT NOT NULL DEFAULT 'Negocio'"],
 ["attention_route", "TEXT NOT NULL DEFAULT ''"],
 ["controls_json", "TEXT NOT NULL DEFAULT '[]'"],
 ["classification_status", "TEXT NOT NULL DEFAULT 'Pendiente'"],
 ["classification_confidence", "REAL NOT NULL DEFAULT 0"],
 ["classification_reason", "TEXT NOT NULL DEFAULT ''"],
 ["classification_confirmed_by", "TEXT NOT NULL DEFAULT ''"],
 ["classification_confirmed_at", "TEXT"]
] as any[]) if (!needColsV421.includes(name)) db.exec(`ALTER TABLE needs ADD COLUMN ${name} ${ddl}`);

// V4.4.1 · Métricas temporales y mediciones de valor versionadas
const initiativeColsV441 = db.prepare("PRAGMA table_info(initiatives)").all().map((c:any)=>c.name);
if (!initiativeColsV441.includes("accept_confirmed_at")) db.exec("ALTER TABLE initiatives ADD COLUMN accept_confirmed_at TEXT");
db.exec(`
CREATE TABLE IF NOT EXISTS value_measurements(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 initiative_id INTEGER NOT NULL,
 measurement_cut TEXT NOT NULL,
 measurement_date TEXT NOT NULL DEFAULT '',
 data TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(initiative_id,measurement_cut)
);
`);
// Compatibilidad: si ya existía una aceptación válida, conserva como fecha el último guardado de Plantilla 19.
for (const r of db.prepare("SELECT initiative_id,data,updated_at FROM template_records WHERE template_id=19").all() as any[]) {
 try { const p=JSON.parse(r.data||"{}"); const x=String(p.acceptance_decision||"").trim().toLowerCase(); const ok=x&&!x.startsWith("no ")&&!x.includes("no se acepta")&&(x==="se acepta"||x==="aceptado"||x==="aceptada"||x.includes("acepta con observaciones")||x.includes("aceptado con observaciones")); if(ok) db.prepare("UPDATE initiatives SET accept_confirmed_at=COALESCE(accept_confirmed_at,?) WHERE id=?").run(r.updated_at,r.initiative_id); } catch {}
}

// V4.6 · Experiencia del Solicitante (migración no destructiva)
db.exec(`
CREATE TABLE IF NOT EXISTS need_updates(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 need_id INTEGER NOT NULL,
 author_name TEXT NOT NULL DEFAULT '',
 author_role TEXT NOT NULL DEFAULT '',
 update_type TEXT NOT NULL DEFAULT 'INFO',
 message TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

// V4.7 · Administración dinámica de Seguridad y Permisos (RBAC)
db.exec(`
CREATE TABLE IF NOT EXISTS security_roles(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 code TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 ad_group TEXT NOT NULL DEFAULT '',
 description TEXT NOT NULL DEFAULT '',
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS security_permissions(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 code TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 menu_label TEXT NOT NULL DEFAULT '',
 menu_href TEXT NOT NULL DEFAULT '',
 menu_icon TEXT NOT NULL DEFAULT '•',
 menu_order INTEGER NOT NULL DEFAULT 100,
 category TEXT NOT NULL DEFAULT 'General',
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS security_role_permissions(
 role_id INTEGER NOT NULL,
 permission_id INTEGER NOT NULL,
 granted INTEGER NOT NULL DEFAULT 1,
 updated_by TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(role_id,permission_id)
);
CREATE TABLE IF NOT EXISTS security_audit(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 actor_user_id INTEGER,
 actor_name TEXT NOT NULL DEFAULT '',
 action TEXT NOT NULL,
 role_code TEXT NOT NULL DEFAULT '',
 permission_code TEXT NOT NULL DEFAULT '',
 old_value TEXT NOT NULL DEFAULT '',
 new_value TEXT NOT NULL DEFAULT '',
 detail TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

const securityRoles=[
 ["BUSINESS_USER","Usuario de Negocio","GG-BRM-PORTAL-BUSINESS-USER"],
 ["AREA_COUNTERPART","Contraparte del Área","GG-BRM-PORTAL-AREA-COUNTERPART"],
 ["BRM","Business Relationship Manager","GG-BRM-PORTAL-BRM"],
 ["DEMAND_MANAGER","Gestor de Demanda","GG-BRM-PORTAL-DEMAND-MANAGER"],
 ["TECH_OWNER","Responsable Técnico","GG-BRM-PORTAL-TECH-OWNER"],
 ["GOVERNANCE","Gobierno / Control","GG-BRM-PORTAL-GOVERNANCE"],
 ["AUDITOR","Auditor / Consulta","GG-BRM-PORTAL-AUDITOR"],
 ["EXECUTIVE","Ejecutivo / Vista Global","GG-BRM-PORTAL-EXECUTIVE"],
 ["ADMIN","Administrador de Seguridad","GG-BRM-PORTAL-ADMIN"]
];
const insRole=db.prepare("INSERT OR IGNORE INTO security_roles(code,name,ad_group) VALUES(?,?,?)");
securityRoles.forEach(x=>insRole.run(...x));

const securityPermissions=[
 ["PORTAL_VIEW","Portal de Negocio","Portal de Negocio","/portal","◎",10,"Portal"],
 ["NEED_CREATE","Registrar necesidad","Registrar necesidad","/portal/nueva","＋",20,"Portal"],
 ["BRM_INBOX","Bandeja BRM","Bandeja BRM","/brm/bandeja","▤",30,"Gestión"],
 ["INITIATIVES_VIEW","Iniciativas","Iniciativas","/","☷",40,"Gestión"],
 ["MY_MANAGEMENT_VIEW","Mi Gestión BRM","Mi Gestión","/mi-gestion","◫",50,"Analítica"],
 ["DASHBOARD_VIEW","Dashboard Gestión y Valor","Dashboard Gestión y Valor","/dashboard","◫",60,"Analítica"],
 ["EXECUTIVE_DASHBOARD_VIEW","Dashboard Ejecutivo 360°","Dashboard Ejecutivo 360°","/dashboard-ejecutivo","◆",65,"Analítica"],
 ["REPORTS_VIEW","Centro de Reportes","Reportes","/reportes","▥",70,"Analítica"],
 ["WEEKLY_BOARD_VIEW","Bitácora Semanal","Bitácora Semanal","/tablero-semanal","▣",80,"Gestión"],
 ["PHASE_RELATE","Fase RELATE","Relación y planeación","/fase/1","♙",110,"ValueFlow"],
 ["PHASE_SHAPE","Fase SHAPE","Clasificación","/fase/2","◇",120,"ValueFlow"],
 ["PHASE_DECIDE","Fase DECIDE","Priorización y decisión","/fase/3","◆",130,"ValueFlow"],
 ["PHASE_DELIVER","Fase DELIVER","Entrega y capacidad","/fase/4","▦",140,"ValueFlow"],
 ["PHASE_ACCEPT","Fase ACCEPT","Aceptación y valor","/fase/5","✓",150,"ValueFlow"],
 ["SECURITY_ADMIN","Administración de Seguridad","Seguridad y Permisos","/administracion/seguridad","⚙",900,"Administración"]
];
const insPerm=db.prepare("INSERT OR IGNORE INTO security_permissions(code,name,menu_label,menu_href,menu_icon,menu_order,category) VALUES(?,?,?,?,?,?,?)");
securityPermissions.forEach(x=>insPerm.run(...x));

const defaults:any={
 BUSINESS_USER:["PORTAL_VIEW","NEED_CREATE"],
 AREA_COUNTERPART:["PORTAL_VIEW","NEED_CREATE","PHASE_RELATE"],
 BRM:["BRM_INBOX","INITIATIVES_VIEW","MY_MANAGEMENT_VIEW","REPORTS_VIEW","WEEKLY_BOARD_VIEW","PHASE_RELATE","PHASE_SHAPE","PHASE_DECIDE","PHASE_DELIVER","PHASE_ACCEPT"],
 DEMAND_MANAGER:["DASHBOARD_VIEW","REPORTS_VIEW","BRM_INBOX","PHASE_SHAPE","PHASE_DECIDE"],
 TECH_OWNER:["INITIATIVES_VIEW","PHASE_DELIVER"],
 GOVERNANCE:["DASHBOARD_VIEW","REPORTS_VIEW","INITIATIVES_VIEW","BRM_INBOX","WEEKLY_BOARD_VIEW","PHASE_DECIDE"],
 AUDITOR:["DASHBOARD_VIEW","REPORTS_VIEW","INITIATIVES_VIEW"],
 EXECUTIVE:["EXECUTIVE_DASHBOARD_VIEW","DASHBOARD_VIEW","REPORTS_VIEW","INITIATIVES_VIEW"],
 ADMIN:securityPermissions.map(x=>x[0])
};
const rpCount=(db.prepare("SELECT COUNT(*) c FROM security_role_permissions").get() as any).c;
if(!rpCount){
 const grant=db.prepare(`INSERT OR IGNORE INTO security_role_permissions(role_id,permission_id,granted,updated_by)
 SELECT r.id,p.id,1,'V4.7 seed' FROM security_roles r,security_permissions p WHERE r.code=? AND p.code=?`);
 Object.entries(defaults).forEach(([role,perms]:any)=>perms.forEach((p:string)=>grant.run(role,p)));
}
const adminExists=(db.prepare("SELECT COUNT(*) c FROM users WHERE role='ADMIN'").get() as any).c;
if(!adminExists) db.prepare("INSERT INTO users(name,email,area,role) VALUES(?,?,?,?)").run("Administrador Seguridad","admin.seguridad@bancaribe.demo","Seguridad TI","ADMIN");
const executiveExists=(db.prepare("SELECT COUNT(*) c FROM users WHERE role='EXECUTIVE'").get() as any).c;
if(!executiveExists) db.prepare("INSERT INTO users(name,email,area,role) VALUES(?,?,?,?)").run("VP Ejecutivo Demo","vp.ejecutivo@bancaribe.demo","Bancaribe","EXECUTIVE");


// V4.9 · Evidencias, preclasificación del solicitante, notificaciones e identidad Entra-ready
const needColsV49 = db.prepare("PRAGMA table_info(needs)").all().map((c:any)=>c.name);
if (!needColsV49.includes("requester_classification")) db.exec("ALTER TABLE needs ADD COLUMN requester_classification TEXT NOT NULL DEFAULT ''");
const userColsV49 = db.prepare("PRAGMA table_info(users)").all().map((c:any)=>c.name);
if (!userColsV49.includes("entra_object_id")) db.exec("ALTER TABLE users ADD COLUMN entra_object_id TEXT NOT NULL DEFAULT ''");
if (!userColsV49.includes("user_principal_name")) db.exec("ALTER TABLE users ADD COLUMN user_principal_name TEXT NOT NULL DEFAULT ''");
if (!userColsV49.includes("last_login_at")) db.exec("ALTER TABLE users ADD COLUMN last_login_at TEXT");
db.exec(`
CREATE TABLE IF NOT EXISTS need_attachments(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 need_id INTEGER NOT NULL,
 file_name TEXT NOT NULL,
 file_type TEXT NOT NULL DEFAULT '',
 file_size INTEGER NOT NULL DEFAULT 0,
 storage_path TEXT NOT NULL DEFAULT '',
 uploaded_by TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notification_log(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 need_id INTEGER,
 notification_type TEXT NOT NULL,
 recipient TEXT NOT NULL DEFAULT '',
 subject TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'PENDIENTE',
 detail TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

// V4.10 · Gestión de Capacidad por Área + incorporación directa de trabajo en ejecución
const initiativeColsV410 = db.prepare("PRAGMA table_info(initiatives)").all().map((c:any)=>c.name);
for (const [name, ddl] of [
 ["entry_mode", "TEXT NOT NULL DEFAULT 'VALUEFLOW'"],
 ["category", "TEXT NOT NULL DEFAULT ''"],
 ["technical_owner", "TEXT NOT NULL DEFAULT ''"],
 ["source_information", "TEXT NOT NULL DEFAULT ''"],
 ["description", "TEXT NOT NULL DEFAULT ''"],
 ["start_date", "TEXT NOT NULL DEFAULT ''"],
 ["original_due_date", "TEXT NOT NULL DEFAULT ''"],
 ["current_due_date", "TEXT NOT NULL DEFAULT ''"],
 ["committed_capacity", "REAL NOT NULL DEFAULT 0"],
 ["committed_resources", "REAL NOT NULL DEFAULT 0"],
 ["capacity_area", "TEXT NOT NULL DEFAULT ''"],
 ["delivery_status", "TEXT NOT NULL DEFAULT ''"],
 ["registered_by", "TEXT NOT NULL DEFAULT ''"],
 ["registered_by_role", "TEXT NOT NULL DEFAULT ''"],
 ["reschedule_count", "INTEGER NOT NULL DEFAULT 0"],
 ["completed_at", "TEXT"]
] as any[]) if (!initiativeColsV410.includes(name)) db.exec(`ALTER TABLE initiatives ADD COLUMN ${name} ${ddl}`);

db.exec(`
CREATE TABLE IF NOT EXISTS area_capacity_periods(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 area TEXT NOT NULL,
 period TEXT NOT NULL,
 total_capacity REAL NOT NULL DEFAULT 0,
 unit TEXT NOT NULL DEFAULT 'FTE',
 owner TEXT NOT NULL DEFAULT '',
 publication_date TEXT NOT NULL DEFAULT '',
 notes TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'Vigente',
 updated_by TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(area,period)
);
CREATE TABLE IF NOT EXISTS initiative_capacity_allocations(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 initiative_id INTEGER NOT NULL,
 area TEXT NOT NULL,
 period TEXT NOT NULL DEFAULT '',
 capacity_amount REAL NOT NULL DEFAULT 0,
 resource_count REAL NOT NULL DEFAULT 0,
 start_date TEXT NOT NULL DEFAULT '',
 planned_release_date TEXT NOT NULL DEFAULT '',
 actual_release_date TEXT,
 status TEXT NOT NULL DEFAULT 'ACTIVA',
 source TEXT NOT NULL DEFAULT 'DELIVERY',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

const v410Perms=[
 ["WORK_IN_PROGRESS_CREATE","Registrar iniciativa en ejecución","Registrar iniciativa en ejecución","/delivery/en-ejecucion/nueva","＋",35,"Gestión"],
 ["CAPACITY_MANAGE","Gestionar capacidad del área","Capacidad de mi Área","/capacidad","▦",145,"Gestión"],
 ["CAPACITY_VIEW","Consultar capacidad","Capacidad tecnológica","/capacidad","▦",146,"Analítica"]
];
v410Perms.forEach(x=>insPerm.run(...x));
const grantV410=db.prepare(`INSERT OR IGNORE INTO security_role_permissions(role_id,permission_id,granted,updated_by)
 SELECT r.id,p.id,1,'V4.10 seed' FROM security_roles r,security_permissions p WHERE r.code=? AND p.code=?`);
[["TECH_OWNER","WORK_IN_PROGRESS_CREATE"],["TECH_OWNER","CAPACITY_MANAGE"],["TECH_OWNER","CAPACITY_VIEW"],
 ["BRM","WORK_IN_PROGRESS_CREATE"],["BRM","CAPACITY_MANAGE"],["BRM","CAPACITY_VIEW"],
 ["DEMAND_MANAGER","CAPACITY_VIEW"],["GOVERNANCE","CAPACITY_VIEW"],["EXECUTIVE","CAPACITY_VIEW"],["AUDITOR","CAPACITY_VIEW"],
 ["ADMIN","WORK_IN_PROGRESS_CREATE"],["ADMIN","CAPACITY_MANAGE"],["ADMIN","CAPACITY_VIEW"]].forEach(x=>grantV410.run(...x));
