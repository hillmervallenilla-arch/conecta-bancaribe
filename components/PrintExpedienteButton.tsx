"use client";
export default function PrintExpedienteButton(){return <button type="button" className="btn btn-primary pdf-no-print" onClick={()=>window.print()}>Imprimir / Guardar como PDF</button>}
