---
'create-rn-miniapp': patch
'@create-rn-miniapp/scaffold-templates': patch
---

Cloudflare server provisioning now guides users through selecting or creating a Worker, D1 database, and R2 bucket in one flow, then writes the resulting bindings and metadata back into the generated workspace.

Cloudflare and Firebase server workspaces now include deploy scripts that can read auth and project metadata from `server/.env.local`, making repeat deploys easier after initial provisioning.

Cloudflare provisioning notes now explain exactly where to create an API token, which template to start from, and where to paste the secret into `server/.env.local`.

Firebase provisioning now retries Cloud Build default service account checks for up to five attempts with visible TUI progress after Blaze billing or Cloud Build setup, so newly created projects do not fail too early on eventual-consistency delays.

Engineering docs, README copy, and user-facing TUI notes were updated together so the provisioning flow reads in the same softer `~요` tone across Cloudflare and Firebase.
