export type EvidenceReadResult =
  | { ok: true; data: Record<string, unknown>; requestId: string }
  | { ok: false; reason: "not_configured" | "invalid_request" | "unauthorized" | "not_found" | "unavailable" | "invalid_response" | "cancelled"; httpStatus: number | null };

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_RESPONSE_BYTES = 64 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 2000;
}
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function configuredGateway(): URL | null {
  const raw = import.meta.env.VITE_NOVA_TENANT_GATEWAY_URL;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

function isCalibrationRecord(value: unknown, tenantId: string, calibrationId: string): value is Record<string, unknown> {
  if (!isRecord(value) || value.id !== calibrationId || value.tenant_id !== tenantId ||
      !ID_PATTERN.test(String(value.site_id ?? "")) || !ID_PATTERN.test(String(value.source_id ?? "")) ||
      !isText(value.instrument_serial) || !isText(value.metric) || !isText(value.unit) ||
      !["laboratory", "field_comparison", "manufacturer", "reference_instrument", "other"].includes(String(value.calibration_method)) ||
      !isText(value.calibration_standard) || !isText(value.calibrated_at) || !isText(value.valid_until) ||
      !isFiniteNumber(value.range_min) || !isFiniteNumber(value.range_max) || value.range_min > value.range_max ||
      !isFiniteNumber(value.uncertainty) || value.uncertainty < 0 || !isText(value.evidence_ref) ||
      !isText(value.created_by_subject) || !["unverified", "verified", "rejected"].includes(String(value.status)) ||
      !isText(value.created_at) || !Array.isArray(value.events) || value.events.length === 0) return false;
  const eventsValid = value.events.every(event => isRecord(event) &&
    ["registered", "verified", "rejected", "revoked"].includes(String(event.event_type)) &&
    isText(event.actor_subject) &&
    (event.reviewer_role === null || event.reviewer_role === "measurement_reviewer") &&
    isText(event.evidence_ref) && (event.reason === null || isText(event.reason)) &&
    isText(event.request_id) && isText(event.occurred_at));
  if (!eventsValid) return false;
  const latest = value.events[value.events.length - 1] as Record<string, unknown>;
  return value.status === "verified" ? latest.event_type === "verified"
    : value.status === "rejected" ? latest.event_type === "rejected"
      : ["registered", "revoked"].includes(String(latest.event_type));
}

function isMeasurementQuality(value: unknown, tenantId: string, observationId: string): value is Record<string, unknown> {
  if (!isRecord(value) || value.id !== observationId || value.tenant_id !== tenantId ||
      value.observation_id !== observationId || !ID_PATTERN.test(String(value.source_id ?? "")) ||
      !isText(value.metric) || !isText(value.unit) || !isText(value.observation_verification_status) ||
      !Array.isArray(value.ingestion_quality_flags) ||
      !value.ingestion_quality_flags.every(flag => typeof flag === "string") ||
      !["covered_by_verified_calibration", "not_assessed"].includes(String(value.status))) return false;
  if (value.status === "not_assessed") return isText(value.reason);
  if (!isText(value.calibration_id) || !isText(value.calibrated_at) || !isText(value.valid_until) ||
      !isText(value.calibration_method) || !isText(value.calibration_standard) ||
      !isFiniteNumber(value.uncertainty) || value.uncertainty < 0 || !isText(value.evidence_ref) ||
      !isRecord(value.calibrated_range) || !isFiniteNumber(value.calibrated_range.minimum) ||
      !isFiniteNumber(value.calibrated_range.maximum) ||
      value.calibrated_range.minimum > value.calibrated_range.maximum ||
      value.calibrated_range.unit !== value.unit) return false;
  return true;
}

async function readEvidence(
  path: string,
  tenantId: string,
  resourceId: string,
  validator: (value: unknown, tenant: string, id: string) => value is Record<string, unknown>,
  signal?: AbortSignal,
): Promise<EvidenceReadResult> {
  const gateway = configuredGateway();
  if (!gateway) return { ok: false, reason: "not_configured", httpStatus: null };
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(new URL(path, gateway), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      const reason = response.status === 401 || response.status === 403 ? "unauthorized"
        : response.status === 404 ? "not_found"
          : response.status >= 500 ? "unavailable" : "invalid_response";
      return { ok: false, reason, httpStatus: response.status };
    }
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_RESPONSE_BYTES ||
        !(response.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
      return { ok: false, reason: "invalid_response", httpStatus: response.status };
    }
    const raw = await response.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_RESPONSE_BYTES) {
      return { ok: false, reason: "invalid_response", httpStatus: response.status };
    }
    let payload: unknown;
    try { payload = JSON.parse(raw); } catch {
      return { ok: false, reason: "invalid_response", httpStatus: response.status };
    }
    if (!isRecord(payload) || !isRecord(payload.data) || !isText(payload.request_id) ||
        payload.request_id !== response.headers.get("x-request-id") ||
        !validator(payload.data, tenantId, resourceId)) {
      return { ok: false, reason: "invalid_response", httpStatus: response.status };
    }
    return { ok: true, data: payload.data, requestId: payload.request_id };
  } catch (error) {
    if (controller.signal.aborted) return { ok: false, reason: "cancelled", httpStatus: null };
    return { ok: false, reason: "unavailable", httpStatus: null };
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function readSourceCalibration(
  tenantId: string, siteId: string, sourceId: string, calibrationId: string, signal?: AbortSignal,
): Promise<EvidenceReadResult> {
  if (![tenantId, siteId, sourceId, calibrationId].every(value => ID_PATTERN.test(value)) || tenantId.length > 120) {
    return Promise.resolve({ ok: false, reason: "invalid_request", httpStatus: null });
  }
  const path = "/api/v1/tenants/" + encodeURIComponent(tenantId) + "/sites/" +
    encodeURIComponent(siteId) + "/sources/" + encodeURIComponent(sourceId) +
    "/calibrations/" + encodeURIComponent(calibrationId);
  return readEvidence(path, tenantId, calibrationId, isCalibrationRecord, signal);
}

export function readObservationMeasurementQuality(
  tenantId: string, observationId: string, signal?: AbortSignal,
): Promise<EvidenceReadResult> {
  if (!ID_PATTERN.test(tenantId) || tenantId.length > 120 || !ID_PATTERN.test(observationId)) {
    return Promise.resolve({ ok: false, reason: "invalid_request", httpStatus: null });
  }
  const path = "/api/v1/tenants/" + encodeURIComponent(tenantId) +
    "/observations/" + encodeURIComponent(observationId) + "/measurement-quality";
  return readEvidence(path, tenantId, observationId, isMeasurementQuality, signal);
}
