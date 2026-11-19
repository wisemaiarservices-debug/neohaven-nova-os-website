# NOVA OS Preview Integration Readiness Audit — 2026-11-19

## Scope and evidence

This is a repository/source audit of the Vercel preview deployment, not a live tenant integration test or independent security assessment.

- Vercel deployment: `dpl_3z5efwtuTkbuJo4RHhi6KHBnJSfp`
- Project: `nova-os`
- Preview commit: `89df8a0a78b575eb55213b91a0a25d506355845e`
- Preview branch: `fix/nova-sensor-source-response-scope`
- Preview URL: `https://nova-e0b733ykk-neo-haven-urban-labs.vercel.app`
- Deployment state reported by Vercel: `READY`
- Website CI on this commit: `43758686118`, build/TypeScript/governance tests/route smoke passed.

The preview is suitable for a guided UI walkthrough with synthetic or empty-state data. It is not yet approved for customer/tenant live testing.

## Verified frontend structure

- `src/routes/index.tsx` routes `/os` to `Dashboard` and `/console` to `EngineeringConsole`.
- `vercel.json` provides SPA rewrites for direct route navigation.
- `scripts/smoke-routes.mjs` checks the marketing root and workspace route responses.
- Dashboard labels the site as unselected and does not populate field telemetry with fabricated operational values.
- Engineering Console describes itself as safe mode; training, persistence and production deployment controls are not active.
- The Core health check and public catalogue are separate from private tenant evidence operations. A healthy API response must not be interpreted as field telemetry or tenant authorization.

## Integration dependency status

The browser-side evidence clients require `VITE_NOVA_TENANT_GATEWAY_URL` to be set to an HTTPS Cloudflare Access-protected gateway origin. The checked-in `.env.example` intentionally leaves it blank. The preview's Vercel deployment metadata does not prove this environment variable is configured, nor that an Access application, CORS allowlist, gateway Worker, or private Core origin is provisioned.

Therefore, until those prerequisites are separately verified, the following evidence actions should be treated as unavailable in the preview:
- observation verification and reviewer assignment;
- sensor-source mapping registration and review;
- calibration reviewer/evidence governance;
- measurement-quality policy registration and review;
- durable measurement assessment reads and writes.

The website's client code uses credentialed requests, `cache: no-store`, bounded JSON response bodies, request-ID correlation, and strict response scope checks. These are client safeguards, not substitutes for server-side authorization and tenant isolation.

## Cross-repository contract dependencies

The frontend response validators deliberately require authoritative scope fields:
- Website PR #11 depends on NOVA Core PR #178 for exact tenant/site/asset scope in quality-policy review responses.
- Website PR #12 depends on NOVA Core PR #179 for exact scope in sensor-source review responses and tenant identity in reviewer assignment/revocation responses.

At this audit checkpoint, Core PRs #178 and #179 and website PRs #11 and #12 are open, draft, and unmerged. Their recorded exact-head CI runs passed, but passing CI does not satisfy integration or independent review. Keep all four PRs draft until their dependency chain is reviewed and merged in a controlled sequence, then re-run downstream exact-head CI.

## Required pre-staging checks

1. Confirm the gateway Worker exists and its deployed route/origin is the intended private gateway; do not infer it from the public Core API hostname.
2. Verify Cloudflare Access application policy, allowed identity groups, service bindings, and exact browser origin CORS allowlist.
3. Verify `VITE_NOVA_TENANT_GATEWAY_URL` is set only in the intended preview environment; never put tokens or secrets in Vite variables.
4. Confirm the gateway derives actor identity from the verified Access session and never trusts actor identity supplied in request JSON or headers.
5. Confirm every write route enforces active tenant, membership, site grant, asset scope, reviewer independence, evidence state, idempotency, and audit history in Core.
6. Run disposable two-tenant end-to-end tests covering cross-tenant, cross-site and cross-asset denial; reviewer revocation; source/mapping/calibration/policy revocation; timeout/reload recovery; and duplicate/conflicting operations.
7. Verify browser CORS preflight and credentialed requests from the exact preview origin without broad wildcard origins.
8. Confirm synthetic test data only, rollback/revocation procedures, request tracing, and cleanup before any authorized staging session.

## Hosting and release boundaries

- This deployment is a Vercel preview and has not been promoted to production.
- The connected Vercel Hobby plan is not approved as a commercial production hosting arrangement.
- No production database, customer data, tenant credentials, Access policy, DNS, production alias, or paid resource was changed by this audit.
- Do not deploy or enable live tenant actions merely because the static preview is READY.
- Do not claim AI training, validated forecasts, scientific truth, live field telemetry, or autonomous infrastructure control based on this UI.

## Current decision

**Preview UI: ready for guided synthetic-data presentation.**

**Live tenant integration / staging: blocked pending gateway and Access verification, Core #178/#179 contract integration, independent security review, and authorized two-tenant end-to-end tests.**

**Production: not approved.**

## Detailed source-contract verification — 2026-11-19

The four dependent PR patches and the corresponding Core service/client source files were inspected at their recorded branches.

### Measurement-quality policy review

- Core PR #178 changes the review response to include `policy_id`, `tenant_id`, `site_id`, `asset_id`, lifecycle `status`, and `reviewer_subject`.
- The Core handler resolves the policy using the exact tenant/site/asset/policy tuple, requires an active assigned measurement reviewer, and rejects the original submitter reviewing their own policy.
- Website PR #11 validates the same identifiers and the expected lifecycle status before treating the response as successful.
- The browser client also requires a bounded JSON response, matching `request_id` and `x-request-id` header, and exact response scope.

### Sensor-source mapping review

- Core PR #179 changes mapping review responses to include `mapping_id`, `tenant_id`, `site_id`, `asset_id`, lifecycle `status`, and `reviewer_subject`.
- Reviewer assignment/revocation responses include `tenant_id`, `site_id`, `reviewer_subject`, and the resulting status.
- The Core handler requires an active assigned reviewer and rejects self-review by the mapping submitter.
- Website PR #12 validates exact tenant/site/asset scope, mapping identity and expected lifecycle status.
- The browser client also checks the bounded JSON envelope and request-ID correlation.

### What this establishes — and what it does not

The source-level request/response contracts are aligned for these two lifecycle actions, assuming the corresponding Core and website PRs are integrated in the intended dependency order. Their recorded unit/CI results support the code-level contract.

This inspection does not prove that the deployed gateway routes these requests to those exact Core handlers, that the browser environment has the gateway URL configured, that Cloudflare Access and CORS are correct, or that tenant identity is bound to the verified Access subject in the live Worker. It also does not validate reviewer membership or authorization against a live database. No live endpoint was called and no credentials were used.

The frontend currently fails closed when the gateway URL is absent or invalid. This is the correct preview default; do not fill it with the public Core API origin as a workaround.

## Cloudflare tenant gateway source audit — 2026-11-19

Reviewed the tenant gateway and private tenant API source/configuration on Core #266 head `e157555927f85a30a04366c4317a32b00b0fa42c`.

### Source-level safeguards observed

- Human Access tokens are independently verified by the gateway using RS256 and a configured issuer/audience; the verifier rejects service-token identity shapes, unsupported JWT algorithms/remote key headers, malformed/oversized JWKS, expired tokens and invalid time claims.
- The gateway constructs a fresh internal request. It does not forward browser cookies or caller-supplied identity headers; the verified subject, issuer/audience, timestamp, request ID, body digest and applicable token/idempotency digests are HMAC-signed.
- The private API is configured with `workers_dev = false` and `preview_urls = false`, and its Wrangler config declares no public route/custom domain. The gateway config likewise disables workers.dev/preview URLs and declares only the `TENANT_API` Service Binding to `nova-core-tenant-api`.
- Gateway source enforces exact-origin credentialed CORS, bounded JSON, explicit route allowlists and request-ID exposure. The local gateway integration suite exercises JWT verification, HMAC envelope forwarding, tenant/resource authorization, cross-tenant denial and caller identity-header/cookie isolation.

### Deployment and configuration blockers

- The repository's current `.github/workflows/cloudflare-worker-deploy.yml` deploys the separate Python Core API Worker. The inspected workflow tree contains no dedicated deploy workflow for the tenant gateway/private tenant API.
- `apps/tenant-gateway/wrangler.toml` contains the private Service Binding but no public route/custom hostname and no `[vars]` values for `ACCESS_ISSUER`, `ACCESS_AUDIENCE`, or `CORS_ALLOWED_ORIGINS`. The internal HMAC secret is intentionally not in source. The private API D1 binding and secrets are also intentionally absent from its production Wrangler config.
- The gateway README explicitly states that Access application/policy, secrets, D1, hostname and routes are not provisioned. The repository does not establish that any of these exist in the Cloudflare account.
- CORS documentation previously omitted `Authorization` and `Idempotency-Key`, although gateway code and tests allow them. Core PR #295 is a draft documentation-only correction that also makes the CORS variable and missing gateway deployment automation explicit.
- The Access application's real preflight behavior, service binding isolation at Cloudflare edge, secret parity, D1 deployment/migration state, actual environment variables, and custom hostname routing remain unverified.

### Decision

The source architecture is coherent enough to continue code review and local integration testing, but there is no verified deployed tenant gateway. Do not set the frontend gateway URL to the public Core API hostname, do not create a public Worker route as a shortcut, and do not enable live evidence actions until a separately reviewed Cloudflare deployment plan, exact Access/CORS configuration, private Worker binding, secret provisioning, disposable D1 tests and independent security review are complete.

This was a read-only source/configuration audit plus documentation PR creation. No Cloudflare account settings, Access policies, secrets, D1, hostnames, routes, deployment state, customer data or paid resources were touched.
