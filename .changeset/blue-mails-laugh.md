---
'create-rn-miniapp': patch
'@create-rn-miniapp/scaffold-templates': patch
---

Cloudflare server provisioning now guides users through selecting or creating a Worker, D1 database, and R2 bucket in one flow, then writes the resulting bindings and metadata back into the generated workspace.

Cloudflare and Firebase server workspaces now include deploy scripts that can read auth and project metadata from `server/.env.local`, making repeat deploys easier after initial provisioning.

Engineering docs and README copy were updated to explain the new Cloudflare D1/R2 flow and the token-based deploy behavior for Cloudflare and Firebase.
