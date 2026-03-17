---
"create-rn-miniapp": patch
"@create-rn-miniapp/scaffold-templates": patch
---

Refine the Supabase server scaffold path.

- remove Supabase from the supported tRPC provider set and keep `--trpc` Cloudflare-only
- replace the Supabase server `typecheck` placeholder with a real Edge Function entrypoint check that runs `deno check`
- update generated Supabase docs and READMEs to match the provider-native workflow
