import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCalibrationPath,
  buildObservationQualityPath,
  isCalibrationRecord,
  isMeasurementQuality,
} from "./novaMeasurementEvidenceClient.ts";

const calibration = {
  id: "cal-1", tenant_id: "tenant-a", site_id: "site-a", source_id: "sensor-a",
  instrument_serial: "SN-001", metric: "ec", unit: "dS/m",
  calibration_method: "laboratory", calibration_standard: "Reference standard",
  calibrated_at: "2026-05-01T10:00:00.000Z", valid_until: "2027-05-01T10:00:00.000Z",
  range_min: 0, range_max: 10, uncertainty: 0.05, evidence_ref: "lab-report:report-1",
  created_by_subject: "owner@example.test", status: "verified", created_at: "2026-05-01T11:00:00Z",
  events: [
    { event_type: "registered", actor_subject: "owner@example.test", reviewer_role: null,
      evidence_ref: "lab-report:report-1", reason: null, request_id: "req-1", occurred_at: "2026-05-01T11:00:00Z" },
    { event_type: "verified", actor_subject: "reviewer@example.test", reviewer_role: "measurement_reviewer",
      evidence_ref: "inspection:review", reason: null, request_id: "req-2", occurred_at: "2026-05-02T11:00:00Z" },
  ],
};
const quality = {
  id: "obs-1", tenant_id: "tenant-a", observation_id: "obs-1", source_id: "sensor-a",
  metric: "ec", unit: "dS/m", observation_verification_status: "unverified",
  ingestion_quality_flags: ["sensor_calibration_due"], status: "covered_by_verified_calibration",
  calibration_id: "cal-1", calibrated_at: calibration.calibrated_at, valid_until: calibration.valid_until,
  calibration_method: "laboratory", calibration_standard: "Reference standard",
  uncertainty: 0.05, evidence_ref: "lab-report:report-1",
  calibrated_range: { minimum: 0, maximum: 10, unit: "dS/m" },
};

test("validates scoped calibration records and their latest review event", () => {
  assert.equal(isCalibrationRecord(calibration, "tenant-a", "cal-1"), true);
  assert.equal(isCalibrationRecord(calibration, "tenant-b", "cal-1"), false);
  assert.equal(isCalibrationRecord(calibration, "tenant-a", "cal-2"), false);
  assert.equal(isCalibrationRecord({ ...calibration, range_max: Infinity }, "tenant-a", "cal-1"), false);
  assert.equal(isCalibrationRecord({ ...calibration, status: "unverified" }, "tenant-a", "cal-1"), false);
});

test("validates calibration coverage without conflating observation verification", () => {
  assert.equal(isMeasurementQuality(quality, "tenant-a", "obs-1"), true);
  assert.equal(isMeasurementQuality(quality, "tenant-b", "obs-1"), false);
  const pending = { ...quality, status: "not_assessed", reason: "calibration_pending_human_review" };
  delete pending.calibration_id;
  assert.equal(isMeasurementQuality(pending, "tenant-a", "obs-1"), true);
  assert.equal(isMeasurementQuality({ ...pending, reason: undefined }, "tenant-a", "obs-1"), false);
});

test("builds fixed gateway paths and rejects malformed identifiers", () => {
  assert.equal(buildCalibrationPath("tenant-a", "site-a", "sensor-a", "cal-1"),
    "/api/v1/tenants/tenant-a/sites/site-a/sources/sensor-a/calibrations/cal-1");
  assert.equal(buildObservationQualityPath("tenant-a", "obs-1"),
    "/api/v1/tenants/tenant-a/observations/obs-1/measurement-quality");
  assert.equal(buildCalibrationPath("tenant/a", "site-a", "sensor-a", "cal-1"), null);
  assert.equal(buildObservationQualityPath("tenant-a", "../obs"), null);
});
