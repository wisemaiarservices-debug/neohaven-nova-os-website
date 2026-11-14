import test from "node:test";
import assert from "node:assert/strict";
import { buildObservationQualityPath, isMeasurementQuality } from "./novaMeasurementEvidenceClient.ts";

const assessment = {
  id: "assessment-1",
  tenant_id: "tenant-a",
  observation_id: "obs-1",
  status: "passed",
  reason_code: "within_approved_policy_bounds",
  mapping_id: "mapping-1",
  calibration_id: "calibration-1",
  policy_id: "policy-1",
  method_version: "1.0.0",
};

test("validates the current Core assessment contract and exact tenant/observation scope", () => {
  assert.equal(isMeasurementQuality(assessment, "tenant-a", "obs-1"), true);
  assert.equal(isMeasurementQuality(assessment, "tenant-b", "obs-1"), false);
  assert.equal(isMeasurementQuality(assessment, "tenant-a", "obs-2"), false);
  assert.equal(isMeasurementQuality({ ...assessment, status: "covered_by_verified_calibration" }, "tenant-a", "obs-1"), false);
});

test("accepts failed and not_assessed results with explicit reason and nullable evidence links", () => {
  for (const status of ["failed", "not_assessed"]) {
    assert.equal(isMeasurementQuality({
      ...assessment, status, reason_code: status === "failed" ? "outside_approved_policy_bounds" : "verified_calibration_missing_or_expired",
      mapping_id: null, calibration_id: null, policy_id: null,
    }, "tenant-a", "obs-1"), true);
  }
});

test("rejects passed assessments without the complete evidence chain", () => {
  assert.equal(isMeasurementQuality({ ...assessment, calibration_id: null }, "tenant-a", "obs-1"), false);
  assert.equal(isMeasurementQuality({ ...assessment, policy_id: 42 }, "tenant-a", "obs-1"), false);
});

test("builds the exact POST assessment path and rejects malformed identifiers", () => {
  assert.equal(buildObservationQualityPath("tenant-a", "obs-1"),
    "/api/v1/tenants/tenant-a/observations/obs-1/measurement-quality-assessment");
  assert.equal(buildObservationQualityPath("tenant/a", "obs-1"), null);
  assert.equal(buildObservationQualityPath("tenant-a", "../obs"), null);
});
