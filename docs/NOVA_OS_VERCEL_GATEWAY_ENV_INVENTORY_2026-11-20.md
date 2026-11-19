# NOVA OS website Vercel environment inventory

Date checked: 2026-11-20
Scope: the two Vercel projects linked to the public-facing `neohaven-nova-os-website` repository only. This is not a platform-wide or all-products inventory. No values were decrypted or retrieved.

## Website projects inspected

| Vercel project | Project ID | Environment-variable inventory result |
|---|---|---|
| `nova-os` | `prj_AicC5JnIcyxDeYLMq1gMadvyz2vt` | API returned an empty environment-variable list |
| `neohaven-nova-os-website` | `prj_M6A7bta3gUOpZYykfJmWz1xaHI2L` | API returned an empty environment-variable list |

The inspection used the Vercel project environment listing with decryption disabled. No environment-variable values, secret values, tokens or credentials were requested.

## What this finding means — and does not mean

The reviewed website feature source expects `VITE_NOVA_TENANT_GATEWAY_URL` to identify the HTTPS Cloudflare Access-protected tenant gateway. These two website-linked Vercel project inventories returned no variables, so there is no Vercel metadata evidence that this particular website deployment has that gateway URL configured.

This finding is limited to the website projects. It does **not** establish that NeoAgro, NeoGrid, NeoCell, NOVA Command Center, NOVA FieldOps or NOVA Core are unconfigured or unavailable. Those are separate repositories/services and must be audited using their own deployment and runtime contracts. It also does not establish that every feature in the website is unavailable; the website can still serve presentation, navigation and UI-only preview functions.

For the website's gateway-backed evidence actions, do not:
- substitute the public Core API URL;
- expose the private tenant API through a public Worker route;
- add wildcard CORS;
- create or guess a gateway hostname;
- create or update environment variables or redeploy without the exact authorized gateway origin and reviewed Cloudflare configuration.

## Remaining website-specific verification

Before gateway-backed actions in this website preview/staging surface, an authorized operator must provide/review:
1. The exact HTTPS gateway hostname and its Cloudflare Access application/policy.
2. The matching `CORS_ALLOWED_ORIGINS` allowlist for the exact website preview/staging origin.
3. The private tenant API Service Binding and D1 binding/migration state.
4. Required gateway and private API secret/configuration presence and parity, without disclosing secret values.
5. The correct website preview/staging deployment target and a fresh route/build validation after configuration.
6. A two-tenant synthetic staging run with independent review.

No environment variables were added, changed or deleted. No deployment, Cloudflare resource, Access policy, secret, database, customer data or paid service was touched.

## Website-specific release decision

**Website preview gateway integration: not verified / blocked for gateway-backed actions.** This does not set the readiness status of the wider NeoHaven ecosystem. See the ecosystem deployment-boundaries inventory in the `NeoHaven-repo-root` repository for the separate Core, product and console deployment map.
