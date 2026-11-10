# NeoHaven NOVA OS Website Deployment

This is a static Vite + React + TypeScript website. It has no backend, database, authentication, or paid service requirement.

## Local Validation

```bash
npm install
npm run build
npm run preview
```

The production output is written to:

```text
dist
```

## Vercel

1. Import the repository or upload the project.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy.

## Netlify

1. Create a new site from the repository or upload the project.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Deploy.

## Cloudflare Pages

1. Create a Pages project.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Build output directory: `dist`.
5. Deploy.

## GitHub Pages

1. Run `npm run build`.
2. Publish the contents of `dist` using GitHub Pages or a Pages workflow.
3. If deploying to a repository subpath, set the Vite `base` option before building.

## Recommended Free Hosting

Vercel is the simplest default for this static investor-facing site. Cloudflare Pages is also a strong option if DNS and edge performance are the priority.


## NOVA Platform Routes

The public NeoHaven website remains at `/`. The platform has two distinct application surfaces:

- `/console` — **NOVA Engineering Console**. Internal workbench for API endpoint registration and health checks, data-source and dataset cataloguing, model experiment specifications, and deployment inspection.
- `/os` — **NOVA OS**. Operational system linking NOVA Core with NeoAgro, NeoCell and NeoGrid. Each module can be opened as a standalone product or used as an embedded module inside NOVA OS.

### Engineering Console scope and safety

The current V1 workbench is intentionally browser-local:
- API base URLs and non-secret integration metadata are stored in local browser storage.
- API health checks call the registered endpoint's `/health` route. A successful health check proves reachability only.
- Data-source and dataset entries are catalog metadata. The local CSV inspector checks headers, row widths and a SHA-256 fingerprint in the browser, then saves metadata only; it does not upload, retain or ingest raw files.
- Model experiments are specifications only. No model training is claimed or executed.
- Deployment records are last-known deployment snapshots; open the deployment/product link to verify current status.
- Do not enter API keys, passwords, tokens, private URLs or other credentials in the browser workbench. Secrets belong in server-side environment variables or a secure secret manager.
- Training runners, shared database persistence, CI artifact ingestion and deployment promotion require secure backend integrations. Production promotion remains subject to human approval.

### NOVA OS module navigation

The NOVA OS sidebar opens the standalone NeoAgro, NeoCell and NeoGrid products in a new tab. The adjacent **Use in NOVA OS** action opens the embedded module view within the operational system. This preserves both standalone product use and cross-module operations in NOVA OS.

### Vercel project configuration

This repository contains the Vite application in the `neohaven-nova-os-website` subdirectory. Configure the Vercel project with:

- Root Directory: `neohaven-nova-os-website`
- Framework Preset: Vite
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: `dist`

The SPA rewrite supports direct navigation and refresh on `/console` and `/os`.

### NOVA Core API connection

The NOVA OS NeoAgro connector uses the existing `/api/v1/data/weather/nasa-power/daily` endpoint when a user supplies site coordinates. The API must allow the dashboard origin through CORS.

Do not put secrets in `VITE_*` variables: Vite exposes them to browser users. Keep private credentials server-side.

### Data integrity

All seeded operational metrics are illustrative UI fixtures, not actual site telemetry. NASA POWER values are gridded/model-derived data, not ground-station measurements. Scenario controls capture assumptions only; they do not calculate forecasts, optimized dispatch, savings or engineering recommendations. Human review remains mandatory.


### Shared browser-local API registry

The Engineering Console and NOVA OS use the same `neohaven.nova.workbench.v1` browser-local registry. Navigate between `/console` and `/os` on the same hostname (the internal links do this automatically) so both routes can read the same localStorage records. Different preview or production hostnames have separate browser storage. This V1 registry is not shared across users or devices; a secure shared backend is a later phase.
