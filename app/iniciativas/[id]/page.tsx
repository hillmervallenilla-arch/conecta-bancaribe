import InitiativeExpediente from "@/components/InitiativeExpediente";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <InitiativeExpediente id={Number(id)}/>}
