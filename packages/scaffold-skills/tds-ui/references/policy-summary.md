# Policy Summary

- truth source는 `generated/catalog.json`과 `generated/anomalies.json`이다.
- 선택 순서는 cluster 분류 -> doc-backed 후보 -> anomaly note 순서다.
- RN primitive를 직접 추천하지 않는다.
- export-only 추천 시에는 반드시 doc-backed fallback을 같이 쓴다.
- `paragraph`는 blocked-by-default다.

## Output Contract

1. 추천 컴포넌트
2. 선택 이유
3. 가장 가까운 대안과 왜 아닌지
4. controlled / uncontrolled 패턴
5. loading / error / empty / disabled / a11y 체크
6. docs URL + root export module
7. anomaly note 또는 export-only / docs-missing note

## Acceptance Prompts

- "검색어 입력 후 목록 필터링 화면" -> search-field + list + list-row
- "약관 여러 개 동의" -> checkbox
- "알림 설정 on/off" -> switch
- "월간 / 연간 전환" -> segmented-control
- "콘텐츠 탭 5개 이상 전환" -> tab + fluid
- "송금 금액 입력" -> amount-top + keypad
- "수량 조절" -> numeric-spinner
- "작업 완료 알림" -> toast
- "성공/실패 전체 화면" -> result
- "404/500 오류 화면" -> error-page
- "FAQ 펼침 목록" -> board-row
- "상단 네비게이션" -> navbar
- "막대 차트" -> chart
- "단계형 진행 UI" -> stepper-row
