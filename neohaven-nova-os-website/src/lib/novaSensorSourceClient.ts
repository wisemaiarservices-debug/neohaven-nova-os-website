export type SensorSourceResult =
  | { ok: true; data: Record<string, unknown>; requestId: string }
  | { ok: false; reason: "not_configured" | "invalid_request" | "unauthorized" | "not_found" | "unavailable" | "invalid_response" | "cancelled"; httpStatus: number | null };

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX = 64 * 1024;
function record(v: unknown): v is Record<string, unknown> { return v !== null && typeof v === "object" && !Array.isArray(v); }
function text(v: unknown, max=2000): v is string { return typeof v === "string" && v.length > 0 && v.length <= max && v.trim() === v && !/[\u0000-\u001f\u007f]/.test(v); }
function gateway(): URL | null {
  const raw = import.meta.env.VITE_NOVA_TENANT_GATEWAY_URL;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try { const u = new URL(raw.trim()); return u.protocol === "https:" && !u.username && !u.password && !u.search && !u.hash ? u : null; }
  catch { return null; }
}
export type SensorMappingAction = "register" | "verify" | "reject" | "revoke";
export function isSensorMappingResponse(v: unknown, tenant: string, site: string, asset: string, action: SensorMappingAction, mappingId?: string): v is Record<string, unknown> {
  if (!record(v)) return false;
  if (action === "register") return v.tenant_id === tenant && v.site_id === site && v.asset_id === asset &&
    text(v.id) && v.status === "registered_unverified" && text(v.source_id) && text(v.sensor_id) &&
    text(v.parameter) && text(v.unit);
  const status = action === "verify" ? "verified" : action === "reject" ? "rejected" : "revoked";
  return v.mapping_id === mappingId && v.status === status && text(v.reviewer_subject);
}
export async function submitSensorSourceMapping(input: {
 tenantId:string; siteId:string; assetId:string; action:SensorMappingAction; mappingId?:string;
 sourceId?:string; sensorId?:string; parameter?:string; unit?:string; effectiveFrom?:string;
 effectiveTo?:string; mappingMethod?:string; evidenceRef:string; reason?:string; signal?:AbortSignal;
}): Promise<SensorSourceResult> {
 const {tenantId,siteId,assetId,action}=input;
 if (![tenantId,siteId,assetId].every(x=>ID.test(x)&&x.length<=120) || !text(input.evidenceRef,500) ||
   (action==="register" && (![input.sourceId,input.sensorId].every(x=>!!x&&ID.test(x)) ||
     !text(input.parameter,120)||!text(input.unit,48)||!text(input.mappingMethod,160)||
     !input.effectiveFrom||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.effectiveFrom)||!Number.isFinite(Date.parse(input.effectiveFrom))||
     (input.effectiveTo!==undefined && input.effectiveTo!=="" && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.effectiveTo)||!Number.isFinite(Date.parse(input.effectiveTo))||input.effectiveTo<=input.effectiveFrom)))) ||
   (action!=="register" && (!input.mappingId||!ID.test(input.mappingId))) ||
   (action!=="verify" && action!=="register" && !text(input.reason,2000))) return {ok:false,reason:"invalid_request",httpStatus:null};
 const base=gateway(); if(!base)return {ok:false,reason:"not_configured",httpStatus:null};
 const root="/api/v1/tenants/"+encodeURIComponent(tenantId)+"/sites/"+encodeURIComponent(siteId)+"/assets/"+encodeURIComponent(assetId)+"/sensor-source-mappings";
 const path=action==="register"?root:root+"/"+encodeURIComponent(input.mappingId!)+"/verification";
 const body=action==="register"?{id:input.mappingId,source_id:input.sourceId,sensor_id:input.sensorId,parameter:input.parameter,unit:input.unit,effective_from:input.effectiveFrom,effective_to:input.effectiveTo||null,mapping_method:input.mappingMethod,evidence_ref:input.evidenceRef}:{decision:action,evidence_ref:input.evidenceRef,...(input.reason?{reason:input.reason}:{})};
 const controller=new AbortController(), abort=()=>controller.abort(); input.signal?.addEventListener("abort",abort,{once:true});
 const timer=window.setTimeout(()=>controller.abort(),8000);
 try {
  const response=await fetch(new URL(path,base),{method:"POST",credentials:"include",cache:"no-store",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(body),signal:controller.signal});
  if(!response.ok)return {ok:false,reason:response.status===401||response.status===403?"unauthorized":response.status===404?"not_found":response.status>=500?"unavailable":"invalid_response",httpStatus:response.status};
  if(Number(response.headers.get("content-length")||0)>MAX||!(response.headers.get("content-type")||"").toLowerCase().includes("application/json"))return {ok:false,reason:"invalid_response",httpStatus:response.status};
  const raw=await response.text(); if(new TextEncoder().encode(raw).byteLength>MAX)return {ok:false,reason:"invalid_response",httpStatus:response.status};
  let payload:unknown;try{payload=JSON.parse(raw)}catch{return {ok:false,reason:"invalid_response",httpStatus:response.status}}
  if(!record(payload)||!record(payload.data)||!text(payload.request_id)||payload.request_id!==response.headers.get("x-request-id")||!isSensorMappingResponse(payload.data,tenantId,siteId,assetId,action,input.mappingId))return {ok:false,reason:"invalid_response",httpStatus:response.status};
  return {ok:true,data:payload.data,requestId:payload.request_id};
 } catch {return {ok:false,reason:controller.signal.aborted?"cancelled":"unavailable",httpStatus:null}}
 finally {window.clearTimeout(timer);input.signal?.removeEventListener("abort",abort)}
}
