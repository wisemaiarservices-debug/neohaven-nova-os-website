import test from "node:test";
import assert from "node:assert/strict";
import {isCalibrationGovernanceResponse} from "./novaCalibrationGovernanceClient.ts";
test("validates calibration reviewer assignment scope and role",()=>{
 const v={tenant_id:"t1",site_id:"s1",reviewer_subject:"r1",reviewer_role:"calibration_reviewer",status:"active"};
 assert.equal(isCalibrationGovernanceResponse(v,"t1","s1","a1","assign_reviewer",""),true);
 assert.equal(isCalibrationGovernanceResponse({...v,site_id:"s2"},"t1","s1","a1","assign_reviewer",""),false);
 assert.equal(isCalibrationGovernanceResponse({...v,reviewer_role:"tenant_admin"},"t1","s1","a1","assign_reviewer",""),false);
});
test("validates exact calibration identity and decision event",()=>{
 const v={tenant_id:"t1",site_id:"s1",asset_id:"a1",calibration_id:"c1",verification_status:"verified",event_type:"verified",reviewer_subject:"r1"};
 assert.equal(isCalibrationGovernanceResponse(v,"t1","s1","a1","verify","c1"),true);
 assert.equal(isCalibrationGovernanceResponse({...v,asset_id:"a2"},"t1","s1","a1","verify","c1"),false);
 assert.equal(isCalibrationGovernanceResponse({...v,calibration_id:"c2"},"t1","s1","a1","verify","c1"),false);
 assert.equal(isCalibrationGovernanceResponse({...v,event_type:"rejected"},"t1","s1","a1","verify","c1"),false);
});
