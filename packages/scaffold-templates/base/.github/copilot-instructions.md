# GitHub Copilot Instructions

이 저장소의 기준 문서는 `AGENTS.md`입니다. Copilot은 아래 순서를 따라야 합니다.

1. `AGENTS.md`를 먼저 읽는다.
2. 구조와 정책은 `docs/index.md`, `docs/engineering/*`를 따른다.
3. 현재 작업 범위는 `docs/ai/Plan.md`에서 확인한다.
4. 작업 플레이북과 외부 플랫폼 참고 자료는 `.agents/skills/`를 기준으로 사용한다.

강제 규칙:
- 작업 전 `docs/ai/Plan.md`를 갱신한다.
- 로직 변경과 버그 수정은 실패 테스트 또는 재현 절차부터 남긴다.
- 완료 기준은 `{{verifyCommand}}` 통과다.
- 문서와 실제 경로가 어긋나면 코드보다 문서를 먼저 바로잡는다.
- 민감정보를 생성물이나 제안 코드에 포함하지 않는다.
