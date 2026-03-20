# docs index

문서 루트는 얇게 유지하고, 상세 규칙은 하위 문서와 Skill로 분리합니다.

## 문서 구조
- `ai/`: `Plan`, `Status`, `Decisions`, `Prompt`
- `product/`: 제품 요구사항
- `engineering/`: 강제 규칙과 구조 정책

## engineering 문서
- `engineering/repo-contract.md`
- `engineering/frontend-policy.md`
- `engineering/workspace-topology.md`

## Skill 구조
- canonical source: `.agents/skills/`
- Claude mirror: `.claude/skills/`

core skills:
- `.agents/skills/core/miniapp/SKILL.md`
- `.agents/skills/core/granite/SKILL.md`
- `.agents/skills/core/tds/SKILL.md`

optional skills:
- `.agents/skills/optional/backoffice-react/SKILL.md`
- `.agents/skills/optional/server-cloudflare/SKILL.md`
- `.agents/skills/optional/server-supabase/SKILL.md`
- `.agents/skills/optional/server-firebase/SKILL.md`
- `.agents/skills/optional/trpc-boundary/SKILL.md`

## verify
- `{{packageManagerRunCommand}} format:check`
- `{{packageManagerRunCommand}} lint`
- `{{packageManagerRunCommand}} typecheck`
- `{{packageManagerRunCommand}} test`
- `{{packageManagerRunCommand}} frontend:policy:check`
- `{{packageManagerRunCommand}} skills:check`

## 운영 메모
- 새 규칙은 먼저 `engineering/*`에 들어갈지, Skill로 분리할지 구분한다.
- 문서 경로를 바꾸면 `AGENTS.md`, `CLAUDE.md`, Copilot instructions, Skill 경로를 같이 갱신한다.
