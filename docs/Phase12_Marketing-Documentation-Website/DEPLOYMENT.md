# CoDRAG Deployment & DNS Strategy

## Overview
We will deploy the four CoDRAG web applications (`marketing`, `docs`, `support`, `payments`) as static/hybrid sites using **Vercel** or **Netlify**, fronted by **Cloudflare** for DNS and edge caching.

## Domain Structure
- **Primary Domain**: `codrag.io` (Marketing site)
- **Subdomains**:
  - `docs.codrag.io` (Documentation)
  - `payments.codrag.io` (Licensing & checkout)
- **Legacy Redirect**: `codrag.ai` -> `codrag.io` (via Cloudflare Page Rules)

## Deployment Providers

### Option A: Vercel (Recommended for Next.js)
Since all apps are built with Next.js App Router, Vercel offers the best zero-config deployment.

1. **Connect GitHub Repo**: Connect `EricBintner/CoDRAG` to Vercel.
2. **Configure Projects**: Create 3 separate Vercel projects from the same monorepo, setting the **Root Directory** for each:
   - **Marketing**: `websites/apps/marketing`
   - **Docs**: `websites/apps/docs`
   - **Payments**: `websites/apps/payments`
3. **Build Command**: Vercel detects Next.js automatically.
   - Override command: `cd ../../.. && npx turbo run build --filter=@codrag/marketing` (adjust filter for each app)
   - Or rely on Vercel's monorepo support (it usually handles `turbo` well if configured).

### Option B: Netlify
Good alternative, especially if using static exports (`output: 'export'`).

1. **Base Directory**: `websites/apps/marketing` (etc.)
2. **Build Command**: `npm run build`
3. **Publish Directory**: `.next` (or `out` if static export)

## DNS Configuration (Cloudflare)

### 1. Main Records
| Type | Name | Content | Proxy Status | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| CNAME | `@` | `cname.vercel-dns.com` | Proxied | Root domain (marketing) |
| CNAME | `www` | `codrag.io` | Proxied | WWW redirect |
| CNAME | `docs` | `cname.vercel-dns.com` | Proxied | Docs subdomain |
| CNAME | `payments` | `cname.vercel-dns.com` | Proxied | Payments subdomain |

### 2. Redirect Rules
- **Rule 1**: `codrag.ai/*` -> `https://codrag.io/$1` (301 Permanent)
- **Rule 2**: `www.codrag.io/*` -> `https://codrag.io/$1` (301 Permanent)

## Environment Variables
Set these in the Vercel/Netlify dashboard for the respective projects:

**Global (All Apps):**
- `NEXT_PUBLIC_SITE_URL`: The production URL (e.g., `https://docs.codrag.io`)

**Support App:**
- `GITHUB_TOKEN`: Fine-grained Personal Access Token with read-only access to Discussions/Metadata for the repo.

**Payments App:**
- `NEXT_PUBLIC_CODRAG_CHECKOUT_URL`: Lemon Squeezy checkout URL
- `LEMONSQUEEZY_API_KEY`: (Secret) API key for recovery
- `LEMONSQUEEZY_STORE_ID`: Store ID

## Preview Deployments
Enable **Preview Deployments** on Vercel/Netlify for PRs. This allows testing changes to `packages/ui` across all sites before merging.
