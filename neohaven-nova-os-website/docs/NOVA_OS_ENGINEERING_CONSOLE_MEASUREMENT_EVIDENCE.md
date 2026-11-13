# NOVA OS Engineering Console — measurement evidence

The Engineering Console adds a Measurement evidence tab and the Operator Workspace has a direct link to /console?tab=evidence.

## Configuration

Set VITE_NOVA_TENANT_GATEWAY_URL to the HTTPS origin of the private NOVA tenant gateway. The gateway must explicitly allow the exact deployed NOVA OS origin in CORS_ALLOWED_ORIGINS and remain protected by Cloudflare Access. Leave the setting blank until those origins and Access policies are provisioned. The public NOVA Core health API URL is not a substitute for the private tenant gateway.

The browser uses the current Cloudflare Access session cookie with credentials included. It does not store bearer tokens, set identity headers or persist tenant/customer data in local storage.

## Read workflow

Operators enter exact tenant, site, source, calibration and observation IDs issued by NOVA Core. The page performs:
- GET source calibration detail and bounded reviewer history.
- GET observation measurement-quality assessment.

The client rejects responses above 64 KiB, requires JSON, correlates body request_id with the exposed x-request-id header, and validates tenant/resource identity and record schemas before rendering. No tenant discovery or list API is inferred.

## Safety

The page is read-only. It cannot create, verify, reject or revoke calibration records, upload evidence, alter observations or initiate operations. Calibration coverage and observation verification are shown separately. A covered calibration is advisory provenance, not proof of measurement accuracy or scientific suitability.

Core PRs #96–#98 remain draft/unmerged. Live reads require those contracts to be merged, deployed, and configured with an authorized gateway origin and Access policy. No production deployment or origin allowlist is performed by this change.
