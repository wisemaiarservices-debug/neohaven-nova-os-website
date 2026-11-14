import test from "node:test";
import assert from "node:assert/strict";
import { isSensorMappingResponse, isCanonicalUtcTimestamp } from "./novaSensorSourceClient.ts";
const registered={id:"mapping-1",tenant_id:"tenant-a",site_id:"site-a",asset_id:"asset-a",source_id:"source-a",sensor_id:"sensor-a",parameter:"air_temperature",unit:"degC",status:"registered_unverified"};
test("accepts only exact tenant/site/asset and registered-unverified mapping response",()=>{
 assert.equal(isSensorMappingResponse(registered,"tenant-a","site-a","asset-a","register"),true);
 assert.equal(isSensorMappingResponse({...registered,tenant_id:"tenant-b"},"tenant-a","site-a","asset-a","register"),false);
 assert.equal(isSensorMappingResponse({...registered,site_id:"site-b"},"tenant-a","site-a","asset-a","register"),false);
 assert.equal(isSensorMappingResponse({...registered,asset_id:"asset-b"},"tenant-a","site-a","asset-a","register"),false);
 assert.equal(isSensorMappingResponse({...registered,status:"verified"},"tenant-a","site-a","asset-a","register"),false);
});
test("accepts only matching mapping id and lifecycle decision",()=>{
 const verified={mapping_id:"mapping-1",status:"verified",reviewer_subject:"reviewer"};
 assert.equal(isSensorMappingResponse(verified,"tenant-a","site-a","asset-a","verify","mapping-1"),true);
 assert.equal(isSensorMappingResponse({...verified,mapping_id:"mapping-2"},"tenant-a","site-a","asset-a","verify","mapping-1"),false);
 assert.equal(isSensorMappingResponse({...verified,status:"rejected"},"tenant-a","site-a","asset-a","verify","mapping-1"),false);
});

test("accepts only canonical UTC millisecond timestamps",()=>{assert.equal(isCanonicalUtcTimestamp("2026-11-14T11:00:00.000Z"),true);assert.equal(isCanonicalUtcTimestamp("2026-11-14T11:00:00Z"),false);assert.equal(isCanonicalUtcTimestamp("2026-11-14T12:00:00.000+01:00"),false);assert.equal(isCanonicalUtcTimestamp("not-a-date"),false)});
