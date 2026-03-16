---
"create-rn-miniapp": patch
"@create-rn-miniapp/scaffold-templates": patch
---

Refactor the optional tRPC overlay to separate shared contracts from the shared router package.

- Replace the single `packages/trpc` workspace with `packages/contracts` and `packages/app-router`
- Wire Supabase and Cloudflare tRPC scaffolds to the new shared package layout
- Rewrite generated README and engineering docs so API schema and `AppRouter` responsibilities stay clear
