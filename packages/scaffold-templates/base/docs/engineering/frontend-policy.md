# Frontend Policy

이 문서는 `frontend`에서 반드시 지켜야 하는 강제 규칙 문서입니다.

## 라우팅 규칙
1. App Router 스타일 동적 세그먼트(`/$param`)는 금지한다.
2. Granite router의 `:param` path params와 `validateParams`는 허용한다.
3. route path, 파일명, navigation 문자열 어디에도 `$param` 패턴을 남기지 않는다.
4. route/page 구조를 바꾸면 `router.gen.ts` 동기화까지 확인한다.

## 페이지 구조 규칙
- `frontend/pages/*`: entry layer
- `frontend/src/pages/*`: implementation layer

규칙:
- entry layer는 re-export 또는 얇은 route entry만 둔다.
- 화면 구현과 비즈니스 로직은 `frontend/src/pages/*`에 둔다.
- 파일명과 route path는 고정 경로 또는 Granite `:param` 규칙과 정합해야 한다.

## Native / UI import 규칙
1. 네이티브 연동은 `@granite-js/native`가 re-export한 경로만 사용한다.
2. `react-native-webview`, `react-native-video` 같은 개별 native 패키지를 직접 import하지 않는다.
3. AsyncStorage는 예외 없이 금지하고 `@apps-in-toss/framework` storage API를 사용한다.
4. `react-native` 기본 UI primitive는 직접 import하지 않는다.
   - 대표 금지 대상: `ActivityIndicator`, `Alert`, `Button`, `Modal`, `Switch`, `Text`, `TextInput`, `Touchable*`
   - `Pressable`은 정말 필요한 경우에만 이유를 남기고 사용한다.
5. UI는 TDS 또는 Granite가 제공하는 컴포넌트를 우선한다.

## 정책 검사 스크립트
- `$param` route 패턴 검사는 `{{packageManagerRunCommand}} frontend:policy:check`가 담당한다.
- import/UI 경계 규칙은 root `biome.json`이 막는다.

## 구현 전 참고 경로
- 기능 축과 공식 문서 진입: `.agents/skills/core/miniapp/SKILL.md`
- route / navigation 패턴: `.agents/skills/core/granite/SKILL.md`
- TDS component 선택: `.agents/skills/core/tds/SKILL.md`

## 완료 전 체크
- route path와 파일명에 `$param` 패턴이 없는가
- `router.gen.ts`가 현재 entry 구조와 맞는가
- direct native import와 금지된 RN 기본 UI import가 없는가
- 필요한 permission/loading/error/analytics 고려를 `Plan`에 남겼는가
