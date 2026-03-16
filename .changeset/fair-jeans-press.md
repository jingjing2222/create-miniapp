---
"create-rn-miniapp": patch
"@create-rn-miniapp/scaffold-templates": patch
---

Add an optional tRPC overlay for Supabase and Cloudflare server providers.

- Prompt for optional tRPC setup when `supabase` or `cloudflare` is selected, and support the same flow with `--trpc`
- Generate a shared `packages/trpc` workspace so clients import `AppRouter` types from a workspace package instead of reaching into `server` with relative paths
- Wire Cloudflare Workers to import `@workspace/trpc` directly at runtime and keep Supabase Edge Functions in sync through a generated `trpc:sync` step
- Generate provider-specific `src/lib/trpc.ts` clients for `frontend` and `backoffice`
- Update generated server guides and root README to explain the new tRPC workspace and provider-specific behavior
