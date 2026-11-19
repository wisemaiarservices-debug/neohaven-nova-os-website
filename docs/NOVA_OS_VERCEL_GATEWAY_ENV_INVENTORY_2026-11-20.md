# NOVA OS Vercel gateway environment inventory

Date checked: 2026-11-20
Scope: read-only Vercel project environment-variable metadata inventory. No values were decrypted or retrieved.

## Projects inspected

| Vercel project | Project ID | Environment-variable inventory result |
|---|---|---|
| `nova-os` | `prj_AicC5JnIcyxDeYLMq1gMadvyz2vt` | API returned an empty environment-variable list |
| `neohaven-nova-os-website` | `prj_M6A7bta3gUOpZYykfJmWz1xaHI2L` | API returned an empty environment-variable list |

The inspection used the Vercel project environment listing with decryption disabled. No environment-variable values, secret values, tokens or credentials were requested.

## Consequence for the tenant gateway

The website source expects `VITE_NOVA_TENANT_GATEWAY_URL` to identify the HTTPS Cloudflare Access-protected tenant gateway. The checked Vercel project inventories returned no environment variables, so there is no Vercel metadata evidence that this gateway URL is configured for either linked project.

This is a concrete integration blocker. Do not:
- substitute the public Core API URL;
- expose the private tenant API through a public Worker route;
- add wildcard CORS;
- create or guess a gateway hostname;
- create or update environment variables or redeploy without the exact authorized gateway origin and reviewed Cloudflare configuration.

The preview deployment remains useful for a guided UI-only walkthrough within its existing synthetic/empty-state scope. It is not evidence of live tenant data integration.

## Remaining verification

Before any gateway-backed test, an authorized operator must provide/review:
1. The exact HTTPS gateway hostname and its Cloudflare Access application/policy.
2. The matching `CORS_ALLOWED_ORIGINS` allowlist for the exact Vercel preview/staging origin.
3. The private tenant API Service Binding and D1 binding/migration state.
4. Required gateway and private API secret/configuration presence and parity, without disclosing secret values.
5. The correct preview/staging deployment target and a fresh route/build validation after configuration.
6. A two-tenant synthetic staging run with independent review.

No environment variables were added, changed or deleted. No deployment, Cloudflare resource, Access policy, secret, database, customer data or paid service was touched.

## Release decision

**Gateway-backed preview/staging integration: BLOCKED.** This metadata inventory is evidence only of the Vercel variable-list response at the time checked; it does not establish Cloudflare account state, gateway deployment state or runtime behavior.
