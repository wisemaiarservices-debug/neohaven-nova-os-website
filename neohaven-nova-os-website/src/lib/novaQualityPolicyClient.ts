export type QualityPolicyResult={ok:true;data:Record<string,unknown>;requestId:string}|{ok:false;reason:"not_configured"|"invalid_request"|"unauthorized"|"not_found"|"unavailable"|"invalid_response"|"cancelled";httpStatus:number|null};
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;const rec=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==="object"&&!Array.isArray(v);const txt=(v:unknown,n=2000):v is string=>typeof v==="string"&&v.length>0&&v.length<=n&&v.trim()===v&&!/[\u0000-\u001f\u007f]/.test(v);
function gateway():URL|null{const raw=import.meta.env.VITE_NOVA_TENANT_GATEWAY_URL;if(typeof raw!=="string"||!raw.trim())return null;try{const u=new URL(raw.trim());return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash?u:null}catch{return null}}
export type QualityPolicyAction="register"|"verify"|"reject"|"revoke";
export function isQualityPolicyResponse(v:unknown,tenant:string,site:string,asset:string,action:QualityPolicyAction,policyId:string):v is Record<string,unknown>{
 if(!rec(v))return false;
 if(action==="register")return v.id===policyId&&v.tenant_id===tenant&&v.site_id===site&&v.asset_id===asset&&v.status==="registered_unverified"&&txt(v.sensor_id)&&txt(v.parameter)&&txt(v.unit)&&txt(v.version);
 const status=action==="verify"?"verified":action==="reject"?"rejected":"revoked";
 return v.policy_id===policyId&&v.status===status&&txt(v.reviewer_subject,200);
}
export async function submitQualityPolicy(input:{tenant:string;site:string;asset:string;action:QualityPolicyAction;policyId:string;sensorId?:string;parameter?:string;unit?:string;version?:string;minimum?:string;maximum?:string;from?:string;to?:string;method?:string;evidenceRef:string;reason?:string;signal?:AbortSignal}):Promise<QualityPolicyResult>{
 const {tenant,site,asset,action,policyId}=input;
 const num=(v?:string)=>v===undefined||v===""?undefined:Number(v);
 const min=num(input.minimum),max=num(input.maximum);
 if(![tenant,site,asset,policyId].every(x=>ID.test(x)&&x.length<=120)||!txt(input.evidenceRef,500)||
 (action==="register"&&(!txt(input.sensorId,160)||!ID.test(input.sensorId)||!txt(input.parameter,120)||!txt(input.unit,48)||!txt(input.version,80)||(!Number.isFinite(min)&&!Number.isFinite(max))||(min!==undefined&&!Number.isFinite(min))||(max!==undefined&&!Number.isFinite(max))||(min!==undefined&&max!==undefined&&min>max)||!input.from||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.from)||!Number.isFinite(Date.parse(input.from))||(input.to!==undefined&&input.to!==""&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input.to)||!Number.isFinite(Date.parse(input.to))||input.to<=input.from))||!txt(input.method,160)))||
 (action!=="verify"&&action!=="register"&&!txt(input.reason,2000)))return {ok:false,reason:"invalid_request",httpStatus:null};
 const base=gateway();if(!base)return {ok:false,reason:"not_configured",httpStatus:null};
 const root="/api/v1/tenants/"+encodeURIComponent(tenant)+"/sites/"+encodeURIComponent(site)+"/assets/"+encodeURIComponent(asset)+"/measurement-quality-policies";
 const path=action==="register"?root:root+"/"+encodeURIComponent(policyId)+"/verification";
 const body=action==="register"?{id:policyId,sensor_id:input.sensorId,parameter:input.parameter,unit:input.unit,version:input.version,...(min!==undefined?{minimum_value:min}:{}),...(max!==undefined?{maximum_value:max}:{}),effective_from:input.from,effective_to:input.to||null,method:input.method,evidence_ref:input.evidenceRef}:{decision:action,evidence_ref:input.evidenceRef,...(input.reason?{reason:input.reason}:{})};
 const c=new AbortController(),abort=()=>c.abort();input.signal?.addEventListener("abort",abort,{once:true});const timer=window.setTimeout(()=>c.abort(),8000);
 try{const r=await fetch(new URL(path,base),{method:"POST",credentials:"include",cache:"no-store",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(body),signal:c.signal});
 if(!r.ok)return {ok:false,reason:r.status===401||r.status===403?"unauthorized":r.status===404?"not_found":r.status>=500?"unavailable":"invalid_response",httpStatus:r.status};
 if(Number(r.headers.get("content-length")||0)>65536||!(r.headers.get("content-type")||"").toLowerCase().includes("application/json"))return {ok:false,reason:"invalid_response",httpStatus:r.status};
 const raw=await r.text();if(new TextEncoder().encode(raw).byteLength>65536)return {ok:false,reason:"invalid_response",httpStatus:r.status};let p:unknown;try{p=JSON.parse(raw)}catch{return {ok:false,reason:"invalid_response",httpStatus:r.status}}
 if(!rec(p)||!rec(p.data)||!txt(p.request_id)||p.request_id!==r.headers.get("x-request-id")||!isQualityPolicyResponse(p.data,tenant,site,asset,action,policyId))return {ok:false,reason:"invalid_response",httpStatus:r.status};
 return {ok:true,data:p.data,requestId:p.request_id};
 }catch{return {ok:false,reason:c.signal.aborted?"cancelled":"unavailable",httpStatus:null}}finally{window.clearTimeout(timer);input.signal?.removeEventListener("abort",abort)}
}
