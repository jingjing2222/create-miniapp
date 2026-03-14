# TDS React Native Index (MiniApp Precheck)

- 마지막 업데이트: 2026-03-07
- 마지막 업데이트: 2026-03-14
- 목적: MiniApp UI 구현 전 TDS 컴포넌트 사용 기준을 빠르게 확인하기 위한 인덱스
- 문서 베이스: `https://tossmini-docs.toss.im/tds-react-native/components/<component>/`
- 패키지 베이스: `@toss/tds-react-native@2.0.2` (`dist/cjs/components/*` 기준)
- 확인 근거:
  - 로컬 설치 패키지: `@toss/tds-react-native@2.0.2`
  - Apps-in-Toss SDK 2.0.1 업그레이드 가이드(공식):
    - `https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/SDK2.0.1.html`

## 구현 전 확인 규칙
1. UI 구현 시작 전에 이 문서 + 원문 링크를 먼저 확인한다.
2. 컴포넌트 상태 관리는 문서 권장 방식(`value`+`onChange` 또는 `defaultValue`)을 따른다.
3. 컴포넌트 제약(스크롤/사이즈/접근성/폼 검증)을 코드와 테스트에 반영한다.
4. 네이티브 관련 import는 별도 정책 문서 `native-modules-policy.md`를 따른다.

## Tab 컴포넌트 핵심 요약 (원문 기반)
출처: https://tossmini-docs.toss.im/tds-react-native/components/tab/

- `Tab`은 다중 콘텐츠 전환 UI
- 주요 props
  - `fluid: boolean` (아이템 많을 때 가로 스크롤)
  - `size: 'large' | 'small'`
  - `defaultValue: string` (내부 상태)
  - `value: string` + `onChange: (value: string) => void` (외부 상태)
- `Tab.Item` 주요 props
  - `value: string`
  - `children: React.ReactNode`
  - `redBean: boolean`
  - `onPress`, `style`

## TDS 컴포넌트 전체 인덱스 (패키지 스캔 기반)
아래 목록은 `@toss/tds-react-native@2.0.2`의 `dist/cjs/components` 최상위 디렉터리를 기준으로 작성.

- agreement — https://tossmini-docs.toss.im/tds-react-native/components/agreement/
- amount-top — https://tossmini-docs.toss.im/tds-react-native/components/amount-top/
- asset — https://tossmini-docs.toss.im/tds-react-native/components/asset/
- badge — https://tossmini-docs.toss.im/tds-react-native/components/badge/
- board-row — https://tossmini-docs.toss.im/tds-react-native/components/board-row/
- border — https://tossmini-docs.toss.im/tds-react-native/components/border/
- bottom-cta — https://tossmini-docs.toss.im/tds-react-native/components/bottom-cta/
- bottom-info — https://tossmini-docs.toss.im/tds-react-native/components/bottom-info/
- bottom-sheet — https://tossmini-docs.toss.im/tds-react-native/components/bottom-sheet/
- button — https://tossmini-docs.toss.im/tds-react-native/components/button/
- carousel — https://tossmini-docs.toss.im/tds-react-native/components/carousel/
- chart — https://tossmini-docs.toss.im/tds-react-native/components/chart/
- checkbox — https://tossmini-docs.toss.im/tds-react-native/components/checkbox/
- dialog — https://tossmini-docs.toss.im/tds-react-native/components/dialog/
- dropdown — https://tossmini-docs.toss.im/tds-react-native/components/dropdown/
- error-page — https://tossmini-docs.toss.im/tds-react-native/components/error-page/
- fixed-bottom-cta — https://tossmini-docs.toss.im/tds-react-native/components/fixed-bottom-cta/
- gradient — https://tossmini-docs.toss.im/tds-react-native/components/gradient/
- grid-list — https://tossmini-docs.toss.im/tds-react-native/components/grid-list/
- highlight — https://tossmini-docs.toss.im/tds-react-native/components/highlight/
- icon — https://tossmini-docs.toss.im/tds-react-native/components/icon/
- icon-button — https://tossmini-docs.toss.im/tds-react-native/components/icon-button/
- keypad — https://tossmini-docs.toss.im/tds-react-native/components/keypad/
- list — https://tossmini-docs.toss.im/tds-react-native/components/list/
- list-footer — https://tossmini-docs.toss.im/tds-react-native/components/list-footer/
- list-header — https://tossmini-docs.toss.im/tds-react-native/components/list-header/
- list-row — https://tossmini-docs.toss.im/tds-react-native/components/list-row/
- loader — https://tossmini-docs.toss.im/tds-react-native/components/loader/
- navbar — https://tossmini-docs.toss.im/tds-react-native/components/navbar/
- numeric-spinner — https://tossmini-docs.toss.im/tds-react-native/components/numeric-spinner/
- paragraph — https://tossmini-docs.toss.im/tds-react-native/components/paragraph/
- post — https://tossmini-docs.toss.im/tds-react-native/components/post/
- progress-bar — https://tossmini-docs.toss.im/tds-react-native/components/progress-bar/
- radio — https://tossmini-docs.toss.im/tds-react-native/components/radio/
- rating — https://tossmini-docs.toss.im/tds-react-native/components/rating/
- result — https://tossmini-docs.toss.im/tds-react-native/components/result/
- search-field — https://tossmini-docs.toss.im/tds-react-native/components/search-field/
- segmented-control — https://tossmini-docs.toss.im/tds-react-native/components/segmented-control/
- shadow — https://tossmini-docs.toss.im/tds-react-native/components/shadow/
- skeleton — https://tossmini-docs.toss.im/tds-react-native/components/skeleton/
- slider — https://tossmini-docs.toss.im/tds-react-native/components/slider/
- stepper-row — https://tossmini-docs.toss.im/tds-react-native/components/stepper-row/
- switch — https://tossmini-docs.toss.im/tds-react-native/components/switch/
- tab — https://tossmini-docs.toss.im/tds-react-native/components/tab/
- table-row — https://tossmini-docs.toss.im/tds-react-native/components/table-row/
- text-button — https://tossmini-docs.toss.im/tds-react-native/components/text-button/
- text-field — https://tossmini-docs.toss.im/tds-react-native/components/text-field/
- toast — https://tossmini-docs.toss.im/tds-react-native/components/toast/
- tooltip — https://tossmini-docs.toss.im/tds-react-native/components/tooltip/
- top — https://tossmini-docs.toss.im/tds-react-native/components/top/
- txt — https://tossmini-docs.toss.im/tds-react-native/components/txt/

> 참고: 일부 URL은 문서 사이트 정보구조 변경으로 404가 날 수 있다. 그 경우 공식 패키지 export와 최신 문서를 함께 확인한다.
