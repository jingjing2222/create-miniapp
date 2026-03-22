# Repository Contract

## 루트 툴체인
- package manager: `{{packageManagerCommand}}`
- task runner: `nx`
- formatter / linter: `biome`
- 단일 검증 진입점: `{{verifyCommand}}`

## 문서와 Skill 우선순위
1. 계약과 강제 규칙은 `AGENTS.md`, `docs/index.md`, `docs/engineering/*`가 소유한다.
2. optional agent skill은 project-local로 설치되어 있을 때만 supplemental playbook으로 사용한다.
3. skill 설치와 업데이트는 루트 `README.md`와 표준 `npx skills ...` 흐름을 따른다.
4. 문서와 Skill이 충돌하면 문서와 검증 스크립트를 우선한다.

## Verify 정의
{{rootVerifyStepsMarkdown}}

## 운영 규칙
- 변경 전 `docs/ai/Plan.md`에 목표, 범위, 검증 계획을 남긴다.
- 로직 변경과 버그 수정은 실패 테스트 또는 재현 절차부터 남긴다.
- 구조와 경로가 바뀌면 `AGENTS.md`, `docs/index.md`, Skill 경로를 같이 맞춘다.
- 민감정보는 코드, 로그, 스크린샷, PR에 남기지 않는다.
- 공식 scaffold와 공식 공개 문서를 source of truth로 우선 확인한다.

## 완료 기준
- 변경 의도가 `Plan`과 맞는다.
- 필요한 테스트와 문서가 같이 갱신됐다.
- `{{verifyCommand}}`가 통과한다.
- 생성 구조 설명과 실제 파일 경로가 일치한다.
