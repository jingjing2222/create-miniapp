# Granite SSoT (Single Source of Truth)

- owner: miniapp engineering
- scope: `frontend` 라우팅/페이지 구조/검증 파이프라인
- last_verified: 2026-02-26
- rules_file: `./granite-rules.yml`

## 1) Routing Policy (고정 경로 강제)

### 원칙
1. MiniApp 라우트는 **고정 path**만 사용한다.
2. App Router 스타일 동적 세그먼트(`/$param`)를 금지한다.
3. 파라미터 전달은 `navigation.navigate('/fixed-path', { ... })` + `createRoute(... validateParams ...)`로 처리한다.

### 금지 패턴
- `/$[a-zA-Z]` 형태 경로 문자열
- 파일명/라우트명에 `$` 세그먼트 사용 (예: `book.$bookId`, `$bookId.tsx`)

### 허용 대안
- `/book-detail` 같은 고정 경로
- `validateParams`로 입력 검증 후 `Route.useParams()` 사용

## 2) Pages Structure Policy

### 원칙
- `frontend/pages/*`: entry layer
- `frontend/src/pages/*`: implementation layer

### 규칙
1. `frontend/pages/*`는 `frontend/src/pages/*`를 re-export 또는 얇은 엔트리만 유지한다.
2. 비즈니스 로직과 화면 구현은 `frontend/src/pages/*`에 둔다.
3. 엔트리/구현 파일명은 고정 경로 정책과 정합해야 한다.

## 3) Validation Policy

작업 완료 전 아래를 모두 통과해야 한다.

1. `router.gen.ts` 동기화 확인
   - route key와 entry 파일 구조가 일치해야 함
2. 정적 검증
   - `pnpm verify`

## 4) Forbidden vs Allowed

| 분류 | 금지 | 허용 |
|---|---|---|
| route path | `/book/$bookId` | `/book-detail` |
| entry filename | `pages/book/$bookId.tsx` | `pages/book-detail.tsx` |
| impl filename | `src/pages/book/$bookId.tsx` | `src/pages/book-detail.tsx` |
| navigation | `navigate('/book/$bookId', ...)` | `navigate('/book-detail', { bookId })` |

## 5) Granite Reference Evidence

- 인덱스: `./appsintoss-granite-api-index.md`
- 네이티브 모듈 정책: `./native-modules-policy.md`

### 근거 섹션
- Routing / navigation / params validation 관련 가이드
- 생성 라우터(`router.gen.ts`)와 pages 엔트리 연결 규칙

### Last verified
- 2026-02-26
