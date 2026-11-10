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


## NOVA Operations Console

The public website remains at `/`. The operational demonstration console is available at `/console` after deployment.

The console includes:
- NOVA Core overview and screening flags
- NeoAgro climate connector interface for the NOVA NASA POWER daily endpoint
- NeoGrid energy system view
- NeoCell connected infrastructure view
- Data provenance and verification panel
- Assumption-only scenario exploration

### Vercel project configuration

This repository contains the Vite application in the `neohaven-nova-os-website` subdirectory. Configure the Vercel project with:

- Root Directory: `neohaven-nova-os-website`
- Framework Preset: Vite
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: `dist`

The included `vercel.json` rewrite keeps direct navigation and refreshes on `/console` working.

### Optional API connection

Set `VITE_NOVA_API_URL` to the public base URL of the deployed NOVA Core API. The browser console checks `/health` and uses the existing `/api/v1/data/weather/nasa-power/daily` endpoint when a user supplies coordinates.

The API must explicitly allow the dashboard origin through CORS. Do not put secrets in `VITE_*` variables: Vite exposes them to browser users. Keep private credentials in server-side environment variables only.

### Data integrity

All seeded dashboard metrics are illustrative UI fixtures, not actual site telemetry. NASA POWER is gridded/model-derived data and must not be described as a ground-station measurement. The scenario controls currently capture assumptions only; they do not calculate forecasts, optimized dispatch, savings or engineering recommendations. Human review remains mandatory.
