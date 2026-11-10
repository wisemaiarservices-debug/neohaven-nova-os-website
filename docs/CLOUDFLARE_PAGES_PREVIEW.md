# NOVA OS — Cloudflare Pages Free preview

## Why this path

Vercel has rate-limited new preview builds for this team and presents an upgrade-to-Pro notice. No upgrade will be made. Cloudflare Pages Free is the proposed static-hosting target for the Vite NOVA OS and Engineering Console.

Cloudflare's current Pages Free limits include 500 builds per month, one concurrent build, up to 20,000 files per site and 25 MiB per file. Static asset requests are free and unlimited. The deployment workflow in this repository is manual-only and uses Direct Upload through Wrangler; it does not create a Git-integrated Pages project.

## One-time account setup

1. In Cloudflare, confirm the account remains on the Free plan.
2. Create a Pages project named `nova-os` using **Direct Upload** (not Git integration).
3. Create a scoped Cloudflare API token that can deploy Pages projects.
4. In this GitHub repository, add Actions secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

Never paste the token into source code or chat.

## Manual preview deployment

Open **Actions → Deploy NOVA OS preview to Cloudflare Pages → Run workflow**.

The workflow:
- Builds the Vite app from `neohaven-nova-os-website`.
- Uploads the static `dist` directory to Pages project `nova-os`.
- Deploys to branch `feature-preview`, not the production branch.

The expected preview hostname is `feature-preview.nova-os.pages.dev` after the first successful deployment. Confirm the URL in Cloudflare's deployment output rather than assuming it exists beforehand.

## Important boundaries

- No Cloudflare account has been connected and no Pages deployment has been executed.
- The existing Vercel preview remains available; Vercel production has not been changed.
- The NOVA OS and Engineering Console must be opened on the same hostname to share their browser-local API registry.
- This workflow deploys static frontend assets only. It does not deploy NOVA Core API; that has a separate manual Cloudflare Python Worker workflow in the `nova-core` repository.
- NeoAgro's Next.js application needs a separate hosting assessment; do not point it at this Vite static workflow.
- Keep Cloudflare on Free. Do not enable paid features or upgrade the plan.


## Direct Upload choice

This workflow uses a Direct Upload Pages project so GitHub Actions controls when a deployment happens. Cloudflare documents that a Git-integrated Pages project cannot later be switched to Direct Upload; if you prefer automatic Cloudflare Git previews and builds instead, create a separate Git-integrated project rather than changing this one after setup.
