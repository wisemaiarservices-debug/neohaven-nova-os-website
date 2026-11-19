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
