---
"create-rn-miniapp": patch
---

generator가 실행 시점 최신 upstream CLI 동작에 덜 흔들리도록 외부 CLI spec을 repo-owned manifest로 고정했어요.

`wrangler`, `firebase-tools`, `supabase`, `create-cloudflare` 같은 외부 CLI 호출을 exact spec으로 렌더하고,
root workspace topology도 hardcoded 디렉터리 순회 대신 실제 manifest 순서를 기준으로 읽도록 바꿨어요.
