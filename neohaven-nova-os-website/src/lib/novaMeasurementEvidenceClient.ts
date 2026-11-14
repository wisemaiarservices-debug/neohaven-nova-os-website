export type EvidenceReadResult =
  | { ok: true; data: Record<string, unknown>; requestId: string }
  | { ok: false; reason: "not_configured" | "invalid_request" | "unauthorized" | "not_found" | "unavailable" | "invalid_response" | "cancelled"; httpStatus: number | null };

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;
const MAX_RESPONSE_BYTES = 64 * 1024;
const REASONS_BY_STATUS: Record<string, readonly string[]> = {
  passed: ["within_approved_policy_bounds"],
  failed: ["outside_approved_policy_bounds"],
  not_assessed: [
    "observation_not_verified",
    "observation_measurement_fields_invalid",
    "observation_provenance_invalid",
    "non_field_evidence",
    "ambiguous_sensor_mapping",
    "verified_sensor_mapping_missing",
    "ambiguous_verified_calibration",
    "verified_calibration_missing_or_expired",
    "ambiguous_quality_policy",
    "approved_quality_policy_missing",
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 2000 && value.trim() === value;
}
function configuredGateway(): URL | null {
  const raw = import.meta.env.VITE_NOVA_TENANT_GATEWAY_URL;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
    return url;
  } catch { return null; }
}

export function isMeasurementQuality(value: unknown, tenantId: string, observationId: string): value is Record<string, unknown> {
  if (!isRecord(value) || value.tenant_id !== tenantId || value.observation_id !== observationId ||
      !isText(value.id) || !isText(value.status) || !Object.hasOwn(REASONS_BY_STATUS, value.status) ||
      !isText(value.reason_code) || !REASONS_BY_STATUS[value.status].includes(value.reason_code) ||
      value.method_version !== "1.0.0") return false;
  for (const key of ["mapping_id", "calibration_id", "policy_id"]) {
    if (value[key] !== null && !isText(value[key])) return false;
  }
  if (value.status !== "not_assessed" &&
      (!isText(value.mapping_id) || !isText(value.calibration_id) || !isText(value.policy_id))) return false;
  return true;
}

const OBSERVATION_DECISIONS = {
  verify: { verification_status: "verified", event_type: "verified" },
  reject: { verification_status: "rejected", event_type: "rejected" },
  revoke: { verification_status: "unverified", event_type: "revoked" },
} as const;

export function isObservationVerification(
  value: unknown, tenantId: string, observationId: string, decision: keyof typeof OBSERVATION_DECISIONS,
): value is Record<string, unknown> {
  const expected = OBSERVATION_DECISIONS[decision];
  return isRecord(value) && value.tenant_id === tenantId && value.observation_id === observationId &&
    isText(value.site_id) && value.verification_status === expected.verification_status &&
    value.event_type === expected.event_type && isText(value.reviewer_subject);
}

export async function submitObservationVerification(
  tenantId: string, observationId: string, decision: keyof typeof OBSERVATION_DECISIONS,
  evidenceRef: string, reason: string, signal?: AbortSignal,
): Promise<EvidenceReadResult> {
  const path = ID_PATTERN.test(tenantId) && tenantId.length <= 120 && ID_PATTERN.test(observationId)
    ? "/api/v1/tenants/" + encodeURIComponent(tenantId) + "/observations/" +
      encodeURIComponent(observationId) + "/verification" : null;
  if (!path || !isText(evidenceRef) || evidenceRef.length > 500 ||
      (decision !== "verify" && !isText(reason)) || (reason && reason.length > 2000)) {
    return { ok: false, reason: "invalid_request", httpStatus: null };
  }
  const gateway = configuredGateway();
  if (!gateway) return { ok: false, reason: "not_configured", httpStatus: null };
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const body = { decision, evidence_ref: evidenceRef, ...(reason ? { reason } : {}) };
    const response = await fetch(new URL(path, gateway), {
      method: "POST", credentials: "include", cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: controller.signal,
    });
    if (!response.ok) {
      const failure = response.status === 401 || response.status === 403 ? "unauthorized"
        : response.status === 404 ? "not_found"
          : response.status >= 500 ? "unavailable" : "invalid_response";
      return { ok: false, reason: failure, httpStatus: response.status };
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
        !isObservationVerification(payload.data, tenantId, observationId, decision)) {
      return { ok: false, reason: "invalid_response", httpStatus: response.status };
    }
    return { ok: true, data: payload.data, requestId: payload.request_id };
  } catch {
    if (controller.signal.aborted) return { ok: false, reason: "cancelled", httpStatus: null };
    return { ok: false, reason: "unavailable", httpStatus: null };
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export function buildObservationQualityPath(tenantId: string, observationId: string): string | null {
  if (!ID_PATTERN.test(tenantId) || tenantId.length > 120 || !ID_PATTERN.test(observationId)) return null;
  return "/api/v1/tenants/" + encodeURIComponent(tenantId) + "/observations/" +
    encodeURIComponent(observationId) + "/measurement-quality-assessment";
}

export async function readObservationMeasurementQuality(
  tenantId: string, observationId: string, signal?: AbortSignal,
): Promise<EvidenceReadResult> {
  const path = buildObservationQualityPath(tenantId, observationId);
  if (!path) return { ok: false, reason: "invalid_request", httpStatus: null };
  const gateway = configuredGateway();
  if (!gateway) return { ok: false, reason: "not_configured", httpStatus: null };
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(new URL(path, gateway), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: "{}",
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
        !isMeasurementQuality(payload.data, tenantId, observationId)) {
      return { ok: false, reason: "invalid_response", httpStatus: response.status };
    }
    return { ok: true, data: payload.data, requestId: payload.request_id };
  } catch {
    if (controller.signal.aborted) return { ok: false, reason: "cancelled", httpStatus: null };
    return { ok: false, reason: "unavailable", httpStatus: null };
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
