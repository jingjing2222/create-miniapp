# Workspace Topology

## 루트 구조
- `frontend`: AppInToss + Granite 기반 MiniApp
- `server`: optional provider workspace
- `backoffice`: optional Vite + React 운영 도구
- `packages/contracts`: optional tRPC boundary schema / type source
- `packages/app-router`: optional tRPC router / `AppRouter` source

## 역할 분리

### frontend
- MiniApp UI, route, client integration을 담당한다.
- provider 연결값은 각 workspace의 `.env.local`에서 읽는다.
- server runtime 구현을 직접 import하지 않는다.

### server
- provider별 원격 리소스 운영과 server-side runtime을 담당한다.
- deploy, db/functions, rules/indexes 같은 운영 스크립트의 source다.
- frontend/backoffice가 기대하는 env와 연결값을 제공한다.

### backoffice
- 브라우저 기반 운영 화면을 담당한다.
- MiniApp 전용 runtime 대신 browser/client 패턴을 따른다.
- server runtime 구현을 직접 import하지 않는다.

### packages/contracts
- boundary input/output schema와 경계 타입의 source of truth다.
- consumer는 root import만 사용하고 src 상대 경로를 내려가지 않는다.

### packages/app-router
- route shape와 `AppRouter` 타입의 source of truth다.
- Worker runtime과 client는 이 package를 기준으로 타입을 맞춘다.

## ownership
- env ownership: 각 workspace의 `.env.local`
- API / base URL ownership: provider workspace가 값을 정의하고 consumer workspace가 읽는다.
- import boundary:
  - `frontend` ↔ `server` 직접 import 금지
  - `backoffice` ↔ `server` 직접 import 금지
  - shared contract가 필요하면 `packages/contracts`, `packages/app-router`로 올린다.

## 참고 Skill
- MiniApp capability: `.agents/skills/core/miniapp/SKILL.md`
- Granite page/route patterns: `.agents/skills/core/granite/SKILL.md`
- TDS UI selection: `.agents/skills/core/tds/SKILL.md`
- provider 운영 가이드: `.agents/skills/optional/*/SKILL.md`
