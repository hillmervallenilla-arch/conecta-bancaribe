import db from "@/lib/db";import {NextResponse} from "next/server";
export async function POST(req:Request){const b=await req.json();const r=db.prepare("INSERT INTO initiatives(title,area,owner,value_statement,phase,status) VALUES(?,?,?,?,1,'Nueva')").run(b.title,b.area,b.owner||"",b.value_statement||"");return NextResponse.json({id:Number(r.lastInsertRowid)});}
