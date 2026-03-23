---
"create-rn-miniapp": patch
---

Supabase remote DB 적용을 로컬 migration 기준으로 더 안전하게 제한했습니다.

- 로컬 `server/supabase/migrations`에 SQL migration이 있을 때만 remote `db push`를 자동 실행합니다.
- migration이 없는 초기 scaffold에서는 remote history와 충돌할 수 있는 자동 `db push`를 건너뜁니다.
- finalize 안내 문구도 실제 skip 이유가 로컬 migration 부재라는 점이 드러나게 정리했습니다.
