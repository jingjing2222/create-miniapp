# Apps-in-Toss / Granite API Index (Quick)

빠르게 API 후보를 찾기 위한 요약 인덱스입니다.

- 마지막 업데이트: 2026-02-27
- 참조 원칙: 공식 문서만 사용 (`granite.run`, `developers-apps-in-toss.toss.im`)

## Quick Start
1. 먼저 카테고리에서 후보 API를 찾는다.
2. 링크된 공식 문서에서 시그니처/권한/제약을 확인한다.
3. 구현 시 예외 케이스(권한 거부, 미지원 플랫폼)를 테스트에 포함한다.

## Essential Links
- AppInToss React Native tutorial: https://developers-apps-in-toss.toss.im/tutorials/react-native.html
- Granite RN Reference (KR): https://www.granite.run/ko/reference/react-native/
- Granite `defineConfig`: https://www.granite.run/reference/react-native/config/defineConfig.html
- Apps-in-Toss Framework Overview: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/overview
- Apps-in-Toss Full LLM export: https://developers-apps-in-toss.toss.im/llms-full.txt

## Granite 우선 API (Tavily + 원문 확인)
- defineConfig (앱 스킴/플러그인/빌드 설정): https://www.granite.run/reference/react-native/config/defineConfig.html
- useVisibilityChange (화면 visible/hidden 변화 콜백): https://www.granite.run/ko/reference/react-native/screen-control/useVisibilityChange.html
- Video (오디오 포커스 대응 비디오 컴포넌트): https://www.granite.run/ko/reference/react-native/ui/Video.html
- ScrollViewInertialBackground (iOS bounce 영역 배경 처리): https://www.granite.run/ko/reference/react-native/ui/ScrollViewInertialBackground.html

## Category → APIs

### 화면 이동/제어
- routing: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면%20이동/routing
- openURL: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면%20이동/openURL
- closeView: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면%20제어/closeView
- useBackEvent: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면%20제어/useBackEvent

### 환경 확인
- getPlatformOS: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경%20확인/getPlatformOS
- getTossAppVersion: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경%20확인/getTossAppVersion
- isMinVersionSupported: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경%20확인/isMinVersionSupported
- getSchemeUri: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경%20확인/getSchemeUri

### 권한/보안
- permission: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/권한/permission
- setSecureScreen: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면%20제어/setSecureScreen

### 위치/저장소/네트워크
- getCurrentLocation: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치%20정보/getCurrentLocation
- startUpdateLocation: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치%20정보/startUpdateLocation
- useGeolocation: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치%20정보/useGeolocation
- http: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/네트워크/http
- Storage: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/저장소/Storage

### 공유/성장
- share: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/share
- getTossShareLink: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/getTossShareLink
- contactsViral: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/contactsViral

### 분석/광고/결제
- Analytics: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/분석/Analytics
- IntegratedAd: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd
- IAP: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱%20결제/IAP
- TossPay: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/TossPay

## Notes
- 이 문서는 구현 결정을 위한 "첫 인덱스"다. 최종 계약은 공식 원문이 기준이다.
- 로컬 생성 파일/패키지 내부 경로를 근거로 문서화하지 않는다.
