---
"create-rn-miniapp": patch
"@create-rn-miniapp/scaffold-templates": patch
---

Fix Cloudflare server env scaffolding so the public Worker URL is no longer written to `server/.env.local`.

- Keep the public Worker URL in frontend/backoffice env files only
- Preserve Cloudflare deploy metadata in `server/.env.local` without `CLOUDFLARE_API_BASE_URL`
- Remove legacy `CLOUDFLARE_API_BASE_URL` entries on subsequent server env writes
