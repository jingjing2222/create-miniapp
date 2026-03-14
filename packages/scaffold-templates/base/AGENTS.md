# AGENTS.md

> 이 문서는 `docs/engineering/에이전트전략.md`를 루트 실행 안내서 형태로 압축한 에이전트 운영 기준입니다.
> 원본 전략 문서가 상위 source of truth이며, 이 파일은 실무 체크리스트와 진입점 역할을 합니다.

---

## 0) Golden Rules
1. Plan first: 구현 전에 `docs/ai/Plan.md`를 먼저 갱신한다.
2. TDD first: 로직 변경이나 버그 수정은 가능한 한 실패하는 테스트나 재현 절차부터 만든다.
3. Self-verify first: `pnpm verify`를 통과하지 못하면 완료로 간주하지 않는다.
4. Small diffs: 한 커밋, 한 PR은 하나의 목적만 가진다.
5. Docs as source of truth: 불명확하면 코드보다 문서를 먼저 갱신한다.
6. No secrets: 키, 토큰, 내부 URL, 민감정보를 코드, 로그, PR에 남기지 않는다.
7. Official docs first: Granite, `@apps-in-toss/framework`, TDS는 공식 공개 문서를 먼저 확인한다.

---

## 1) Quick Links
- Product spec: `docs/product/기능명세서.md`
- Agent strategy: `docs/engineering/에이전트전략.md`
- Harness guide: `docs/engineering/하네스-실행가이드.md`
- AppsInToss + Granite full index: `docs/engineering/appsintoss-granite-full-api-index.md`
- AppsInToss + Granite quick index: `docs/engineering/appsintoss-granite-api-index.md`
- TDS RN index: `docs/engineering/tds-react-native-index.md`
- Granite SSoT: `docs/engineering/granite-ssot.md`
- Native modules policy: `docs/engineering/native-modules-policy.md`
- AI harness stack:
  - `docs/ai/Plan.md`
  - `docs/ai/Status.md`
  - `docs/ai/Implement.md`
  - `docs/ai/Decisions.md`
  - `docs/ai/Prompt.md`

---

## 2) Repo Mental Model
- `frontend`: AppInToss + Granite 기반 MiniApp 사용자 런타임
- `backoffice`: optional Vite 기반 운영 도구
- `server`: optional Supabase workspace
- `docs`: 제품, 엔지니어링, AI 하네스 문서

현재 기준선:
- 루트 툴체인: `pnpm + nx + biome`
- frontend 생성 기준: AppInToss React Native tutorial + `@apps-in-toss/framework` + TDS
- 내부 워크스페이스는 자체 lint, format를 들지 않고 루트 검증에 맞춘다

규칙:
- UI와 비즈니스 로직을 분리한다.
- MiniApp 구현 전에 Granite/AppInToss/TDS 문서를 먼저 확인한다.
- `@apps-in-toss/framework` 공개 문서와 튜토리얼 절차를 먼저 확인한다.
- 공식 CLI가 만든 결과 위에 patch와 overlay만 얹는다.
- 지원되지 않는 API를 만들거나 추측하지 않는다.

---

## 3) Ticket Workflow
1. 작업 시작 전 `docs/ai/Plan.md`에 목표, 범위, DoD를 작성한다.
2. 영향 파일, 리스크, 검증 계획을 적는다.
3. TDD 기준선을 잡는다.
   - 가능하면 실패하는 테스트부터 추가한다.
   - 테스트가 바로 어려우면 최소한 재현 절차와 기대 결과를 `Plan` 또는 `Status`에 남긴다.
4. MiniApp 기능 구현 전 `docs/engineering/appsintoss-granite-full-api-index.md`를 먼저 검색, 확인해 기존 지원 API를 재사용 가능한지 판단한다.
5. UI 구현이 포함되면 `docs/engineering/tds-react-native-index.md`와 원문 TDS 문서를 먼저 확인해 컴포넌트 제약과 상태 관리 방식을 맞춘다.
6. 구현한다.
7. `pnpm verify`를 실행한다.
8. `docs/ai/Status.md`를 최신 1페이지로 갱신한다.
9. 브랜치 생성, 커밋, 브랜치 푸시, PR 생성 순으로 마무리한다.
10. UI 변경 PR이면 스크린샷이나 영상 증빙을 PR 본문에 첨부한다.

---

## 4) Self-Verify Gate
최소 통과 기준:
- format
- lint
- typecheck
- test
- Granite, `@apps-in-toss/framework`, TDS 참조 문서 링크 정합성
- 문서와 실제 구조 동기화

실패 반복 시:
- 접근 범위를 줄인다.
- 실패 원인과 생략 사유를 `docs/ai/Status.md`에 기록한다.
- 필요 시 Planner 단계로 돌아간다.

---

## 5) Roles
- Planner mode: 작업 분해, 수용 조건, 리스크 정의
- Worker mode: 구현과 테스트 통과
- Judge mode: 회귀와 누락 검토

혼자 작업해도 역할을 섞지 말고 순차적으로 수행한다.

---

## 6) Commit And Branch Policy
- 기본 접두사: `feat:`, `fix:`, `docs:`, `chore:`
- 한 커밋은 한 의도만 담는다.
- 기본 정책: 기능 브랜치에서 작업 후 PR로 병합한다.
- `main` 직접 푸시는 금지한다.
- PR은 최소 `pnpm verify` 통과 후 올린다.

---

## 7) MiniApp Execution Rules
- frontend 작업 전 Granite, `@apps-in-toss/framework`, TDS 인덱스 문서를 먼저 확인한다.
- 공식 문서 링크에서 시그니처, 플랫폼 제약, 권한 요구사항을 재확인한다.
- UI는 TDS 컴포넌트를 우선 사용한다.
- 네이티브 모듈은 `docs/engineering/native-modules-policy.md`를 따른다.
- 라우팅과 페이지 구조는 `docs/engineering/granite-ssot.md`를 따른다.

---

## 8) Operating Notes
- 장기 작업은 채팅보다 `Prompt`, `Plan`, `Status`, `Decisions` 파일 스택에 남긴다.
- 상태 문서는 append보다 최신 상태 재작성 우선이다.
- 품질 문제가 생기면 코드만 고치지 말고 하네스 문서와 체크리스트도 같이 강화한다.
