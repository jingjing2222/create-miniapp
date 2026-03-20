# CLAUDE.md

이 저장소의 기본 계약은 `AGENTS.md`가 소유합니다. Claude 계열 에이전트는 아래 순서로 작업합니다.

1. 먼저 `AGENTS.md`를 읽고 hard rules와 done 기준을 따른다.
2. 현재 목표와 범위는 `docs/ai/Plan.md`, 최신 상태는 `docs/ai/Status.md`에서 확인한다.
3. 작업 플레이북과 외부 플랫폼 지식은 `.claude/skills/` 아래 mirror된 Skill을 사용한다.
4. `.claude/skills/`는 `.agents/skills/`의 mirror이므로, drift가 의심되면 `{{packageManagerRunCommand}} skills:check` 또는 `{{packageManagerRunCommand}} skills:sync`를 먼저 실행한다.

우선순위:
- 계약/정책: `AGENTS.md`, `docs/index.md`, `docs/engineering/*`
- 작업 상태: `docs/ai/*`
- 플레이북/카탈로그: `.claude/skills/*`

민감정보는 코드, 로그, PR, 문서에 남기지 않는다.
