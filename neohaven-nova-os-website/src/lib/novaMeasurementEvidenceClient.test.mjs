import test from "node:test";
import assert from "node:assert/strict";
import { buildObservationQualityPath, isMeasurementQuality, isObservationVerification, isObservationReviewerChange } from "./novaMeasurementEvidenceClient.ts";

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

test("validates the exact tenant, observation and Core assessment contract", () => {
  assert.equal(isMeasurementQuality(assessment, "tenant-a", "obs-1"), true);
  assert.equal(isMeasurementQuality(assessment, "tenant-b", "obs-1"), false);
  assert.equal(isMeasurementQuality(assessment, "tenant-a", "obs-2"), false);
  assert.equal(isMeasurementQuality({ ...assessment, status: "covered_by_verified_calibration" }, "tenant-a", "obs-1"), false);
  assert.equal(isMeasurementQuality({ ...assessment, method_version: "9.9.9" }, "tenant-a", "obs-1"), false);
});

test("requires complete verified evidence for passed and failed policy outcomes", () => {
  const failed = { ...assessment, status: "failed", reason_code: "outside_approved_policy_bounds" };
  assert.equal(isMeasurementQuality(failed, "tenant-a", "obs-1"), true);
  assert.equal(isMeasurementQuality({ ...failed, calibration_id: null }, "tenant-a", "obs-1"), false);
  assert.equal(isMeasurementQuality({ ...assessment, calibration_id: null }, "tenant-a", "obs-1"), false);
  assert.equal(isMeasurementQuality({ ...assessment, policy_id: 42 }, "tenant-a", "obs-1"), false);
});

test("accepts explicit not-assessed reasons with nullable evidence links", () => {
  const reasons = [
    "observation_not_verified", "observation_measurement_fields_invalid", "observation_provenance_invalid",
    "non_field_evidence", "ambiguous_sensor_mapping", "verified_sensor_mapping_missing",
    "ambiguous_verified_calibration", "verified_calibration_missing_or_expired",
    "ambiguous_quality_policy", "approved_quality_policy_missing",
  ];
  for (const reason_code of reasons) {
    assert.equal(isMeasurementQuality({
      ...assessment, status: "not_assessed", reason_code,
      mapping_id: null, calibration_id: null, policy_id: null,
    }, "tenant-a", "obs-1"), true, reason_code);
  }
  assert.equal(isMeasurementQuality({
    ...assessment, status: "not_assessed", reason_code: "unknown_reason",
  }, "tenant-a", "obs-1"), false);
});

test("builds the exact POST assessment path and rejects malformed identifiers", () => {
  assert.equal(buildObservationQualityPath("tenant-a", "obs-1"),
    "/api/v1/tenants/tenant-a/observations/obs-1/measurement-quality-assessment");
  assert.equal(buildObservationQualityPath("tenant/a", "obs-1"), null);
  assert.equal(buildObservationQualityPath("tenant-a", "../obs"), null);
});

const verification = {
  tenant_id: "tenant-a",
  observation_id: "obs-1",
  site_id: "site-1",
  reviewer_subject: "reviewer@example.test",
};

test("validates observation verification state transitions exactly", () => {
  const transitions = [
    ["verify", "verified", "verified"],
    ["reject", "rejected", "rejected"],
    ["revoke", "unverified", "revoked"],
  ];
  for (const [decision, verification_status, event_type] of transitions) {
    assert.equal(isObservationVerification({
      ...verification, verification_status, event_type,
    }, "tenant-a", "obs-1", decision), true);
  }
});

test("rejects cross-tenant, wrong-observation and mismatched review outcomes", () => {
  assert.equal(isObservationVerification({
    ...verification, verification_status: "verified", event_type: "verified",
  }, "tenant-b", "obs-1", "verify"), false);
  assert.equal(isObservationVerification({
    ...verification, verification_status: "verified", event_type: "verified",
  }, "tenant-a", "obs-2", "verify"), false);
  assert.equal(isObservationVerification({
    ...verification, verification_status: "rejected", event_type: "rejected",
  }, "tenant-a", "obs-1", "verify"), false);
});

const reviewerChange = {
  tenant_id: "tenant-a", site_id: "site-1", reviewer_subject: "reviewer@example.test",
  reviewer_role: "measurement_reviewer",
};

test("validates exact tenant/site/reviewer scope and assignment lifecycle responses", () => {
  assert.equal(isObservationReviewerChange({
    ...reviewerChange, status: "active", event_type: "assigned",
  }, "tenant-a", "site-1", "reviewer@example.test", "assign"), true);
  assert.equal(isObservationReviewerChange({
    ...reviewerChange, status: "revoked", event_type: "revoked",
  }, "tenant-a", "site-1", "reviewer@example.test", "revoke"), true);
  assert.equal(isObservationReviewerChange({
    ...reviewerChange, status: "active", event_type: "assigned",
  }, "tenant-b", "site-1", "reviewer@example.test", "assign"), false);
  assert.equal(isObservationReviewerChange({
    ...reviewerChange, status: "active", event_type: "assigned",
  }, "tenant-a", "site-2", "reviewer@example.test", "assign"), false);
  assert.equal(isObservationReviewerChange({
    ...reviewerChange, status: "active", event_type: "assigned",
  }, "tenant-a", "site-1", "other@example.test", "assign"), false);
  assert.equal(isObservationReviewerChange({
    ...reviewerChange, status: "active", event_type: "assigned", reviewer_role: "tenant_admin",
  }, "tenant-a", "site-1", "reviewer@example.test", "assign"), false);
});
