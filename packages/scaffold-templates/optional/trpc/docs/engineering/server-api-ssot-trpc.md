# server API SSOT: tRPC

이 문서는 tRPC를 같이 만든 경우에만 봐요.

## 결론
- server API 경계의 source of truth는 `packages/contracts`예요.
- route shape와 `AppRouter` 타입의 source of truth는 `packages/app-router`예요.
- frontend, backoffice, server는 서로를 직접 참조하지 않고 위 두 shared package를 기준으로 맞춰요.

## 가장 먼저 볼 파일
- `packages/contracts/src/index.ts`
- `packages/app-router/src/index.ts`
- `packages/app-router/src/root.ts`

## 어떻게 이해하면 되나요
- boundary input/output을 바꾸고 싶으면 먼저 `packages/contracts`의 Zod schema를 수정해요.
- client-server 경계 타입은 schema에서 `z.infer`로만 파생하고, 같은 DTO를 별도 type alias로 중복 선언하지 않아요.
- route 구조를 바꾸고 싶으면 `packages/app-router`를 수정해요.
- `example.ts`나 `routers/example.ts` 같은 샘플 파일은 언제든 바뀌거나 사라질 수 있으니, 문서를 볼 때는 엔트리 파일인 `index.ts`, `root.ts`를 먼저 기준으로 잡아요.
- client 타입은 `frontend/src/lib/trpc.ts`, `backoffice/src/lib/trpc.ts`에서 `AppRouter`로 따라와요.
- `packages/contracts`, `packages/app-router`는 `tsdown`으로 `dist`를 만들어요. consumer는 `src` 상대 경로로 내려가지 말고 package root import만 써요.
- server runtime adapter는 provider별로 다르지만, boundary contract과 API shape의 SSOT는 계속 shared package 두 개예요.

## provider별 메모
- Cloudflare는 Worker runtime이 `@workspace/app-router`를 직접 import하고, router는 내부에서 `@workspace/contracts`를 사용해요.
- Supabase는 `server/supabase/functions/api/deno.json`의 `imports`가 `@workspace/app-router`, `@workspace/contracts`를 shared package source에 직접 연결해요.
