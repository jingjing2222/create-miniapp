---
name: tds-ui
description: Use when you are choosing TDS React Native components, form patterns, or UI boundaries for MiniApp screens. Do not use for route design, capability lookup, or provider runtime work.
---

# TDS UI Skill

이 Skill은 MiniApp UI를 구현할 때 어떤 TDS 컴포넌트를 쓸지 정하고, 공식 문서와 export를 대조할 때 씁니다.

## Use when

- `react-native` 기본 primitive 대신 어떤 TDS 컴포넌트를 써야 할지 결정할 때
- form/input/tab 같은 상호작용 UI를 설계할 때
- 공개 문서와 실제 export가 어긋나는지 확인할 때

## Do not use for

- MiniApp capability / 공식 API 탐색: `miniapp-capabilities`
- route path, navigation, page entry 설계: `granite-routing`
- provider runtime layout이나 원격 작업 판단: provider skill

## 읽는 순서

1. `references/catalog.md`에서 component slug, export, 문서 여부를 먼저 확인한다.
2. 강제 import/UI boundary는 `docs/engineering/frontend-policy.md`를 따른다.
3. MiniApp capability 확인이 먼저 필요하면 `miniapp-capabilities`로 돌아간다.

## 구현 전 체크

- controlled / uncontrolled 패턴이 문서 기준과 맞는가
- 입력 검증, 접근성, 로딩, 빈 상태를 같이 설계했는가
- TDS로 대체 가능한 RN 기본 UI를 직접 import하지 않았는가
