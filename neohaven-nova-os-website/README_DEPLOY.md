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
