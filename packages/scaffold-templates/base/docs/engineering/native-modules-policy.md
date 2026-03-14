# Granite Native Modules Policy

## 결론
- MiniApp의 네이티브 연동은 `@granite-js/native`가 re-export한 모듈만 사용한다.
- 개별 native 패키지를 직접 설치하거나 직접 import하지 않는다.
- 허용 범위를 벗어나는 네이티브 연동은 검토, 문서화, 테스트를 거친 뒤 추가한다.

## 사용 규칙
1. 네이티브 API는 먼저 Granite 공식 문서와 `@granite-js/native` 공개 경로에서 지원 여부를 확인한다.
2. direct import 금지
   - 금지: `react-native-webview`, `react-native-video` 같은 패키지를 직접 설치, 직접 import
   - 허용: `@granite-js/native/*` 경로를 통한 import
3. 사용 예시
   - `import { Video } from '@granite-js/native/react-native-video'`
   - `import * as Navigation from '@granite-js/native/@react-navigation/native'`
4. 새 네이티브 의존성이 필요하면 아래를 먼저 남긴다.
   - 왜 필요한지
   - 공식 지원 여부
   - 플랫폼 제약
   - 번들, 권한, 테스트 영향

## 체크리스트
- Granite 공식 문서에서 확인했는가
- `@granite-js/native` 경로로 import 가능한가
- 미지원 플랫폼 처리와 권한 거부 처리를 테스트에 포함했는가
