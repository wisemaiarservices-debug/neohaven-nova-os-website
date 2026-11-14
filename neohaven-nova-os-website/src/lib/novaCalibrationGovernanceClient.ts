export type CalibrationGovernanceResult =
 | {ok:true;data:Record<string,unknown>;requestId:string}
 | {ok:false;reason:"not_configured"|"invalid_request"|"unauthorized"|"not_found"|"unavailable"|"invalid_response"|"cancelled";httpStatus:number|null};
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;const MAX=65536;
const rec=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const txt=(v:unknown,n=2000):v is string=>typeof v==="string"&&v.length>0&&v.length<=n&&v.trim()===v&&!/[\u0000-\u001f\u007f]/.test(v);
function baseUrl():URL|null{const raw=import.meta.env.VITE_NOVA_TENANT_GATEWAY_URL;if(typeof raw!=="string"||!raw.trim())return null;try{const u=new URL(raw.trim());return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash?u:null}catch{return null}}
export type CalibrationAction="assign_reviewer"|"revoke_reviewer"|"verify"|"reject"|"revoke";
export function isCalibrationGovernanceResponse(v:unknown,tenant:string,site:string,asset:string,action:CalibrationAction,calibrationId:string):v is Record<string,unknown>{
 if(!rec(v))return false;
 if(action==="assign_reviewer"||action==="revoke_reviewer")return v.tenant_id===tenant&&v.site_id===site&&v.reviewer_subject!==undefined&&txt(v.reviewer_subject,200)&&v.reviewer_role==="calibration_reviewer"&&v.status===(action==="assign_reviewer"?"active":"revoked");
 const event=action==="verify"?"verified":action==="reject"?"rejected":"revoked";
 return v.tenant_id===tenant&&v.site_id===site&&v.asset_id===asset&&v.calibration_id===calibrationId&&v.verification_status===event&&v.event_type===event&&txt(v.reviewer_subject,200);
}
export async function submitCalibrationGovernance(input:{tenant:string;site:string;asset:string;action:CalibrationAction;calibrationId?:string;reviewerSubject?:string;evidenceRef:string;reason?:string;signal?:AbortSignal}):Promise<CalibrationGovernanceResult>{
 const {tenant,site,asset,action}=input;
 if(![tenant,site,asset].every(x=>ID.test(x)&&x.length<=120)||!txt(input.evidenceRef,500)||
 ((action==="assign_reviewer"||action==="revoke_reviewer")&&!txt(input.reviewerSubject,200))||
 ((action==="verify"||action==="reject"||action==="revoke")&&(!input.calibrationId||!ID.test(input.calibrationId)))||
 ((action==="reject"||action==="revoke"||action==="revoke_reviewer")&&!txt(input.reason,2000)))return {ok:false,reason:"invalid_request",httpStatus:null};
 const base=baseUrl();if(!base)return {ok:false,reason:"not_configured",httpStatus:null};
 const root="/api/v1/tenants/"+encodeURIComponent(tenant)+"/sites/"+encodeURIComponent(site)+"/assets/"+encodeURIComponent(asset);
 const reviewer=action==="assign_reviewer"||action==="revoke_reviewer";
 const path=reviewer?root+"/calibration-reviewers/"+(action==="assign_reviewer"?"assign":"revoke"):root+"/calibrations/"+encodeURIComponent(input.calibrationId!)+"/verification";
 const body=reviewer?{site_id:site,reviewer_subject:input.reviewerSubject,evidence_ref:input.evidenceRef,...(action==="revoke_reviewer"?{reason:input.reason}:{})}:{decision:action,evidence_ref:input.evidenceRef,...(input.reason?{reason:input.reason}:{})};
 const c=new AbortController(),abort=()=>c.abort();input.signal?.addEventListener("abort",abort,{once:true});const timer=window.setTimeout(()=>c.abort(),8000);
 try{
  const r=await fetch(new URL(path,base),{method:"POST",credentials:"include",cache:"no-store",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(body),signal:c.signal});
  if(!r.ok)return {ok:false,reason:r.status===401||r.status===403?"unauthorized":r.status===404?"not_found":r.status>=500?"unavailable":"invalid_response",httpStatus:r.status};
  if(Number(r.headers.get("content-length")||0)>MAX||!(r.headers.get("content-type")||"").toLowerCase().includes("application/json"))return {ok:false,reason:"invalid_response",httpStatus:r.status};
  const raw=await r.text();if(new TextEncoder().encode(raw).byteLength>MAX)return {ok:false,reason:"invalid_response",httpStatus:r.status};
  let payload:unknown;try{payload=JSON.parse(raw)}catch{return {ok:false,reason:"invalid_response",httpStatus:r.status}}
  if(!rec(payload)||!rec(payload.data)||!txt(payload.request_id)||payload.request_id!==r.headers.get("x-request-id")||!isCalibrationGovernanceResponse(payload.data,tenant,site,asset,action,input.calibrationId??""))return {ok:false,reason:"invalid_response",httpStatus:r.status};
  return {ok:true,data:payload.data,requestId:payload.request_id};
 }catch{return {ok:false,reason:c.signal.aborted?"cancelled":"unavailable",httpStatus:null}}
 finally{window.clearTimeout(timer);input.signal?.removeEventListener("abort",abort)}
}
