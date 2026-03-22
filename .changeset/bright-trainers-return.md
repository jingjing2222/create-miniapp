---
"create-rn-miniapp": patch
"@create-rn-miniapp/agent-skills": patch
"@create-rn-miniapp/scaffold-templates": patch
"@create-rn-miniapp/skills-manager": patch
---

`skills-manager` 패키지를 추가해 스킬 동기화 흐름을 별도 CLI로 분리했습니다.

- 생성물의 `skills:sync`, `skills:diff`, `skills:upgrade` wrapper가 `create-rn-miniapp` 대신 `@create-rn-miniapp/skills-manager`를 호출합니다.
- skill manifest와 `docs/skills.md`가 generator 버전 대신 manager 버전을 기준으로 기록되도록 정리했습니다.
- `create-rn-miniapp`의 로컬 `skills` 서브커맨드를 제거하고, release/dev-publish 경로에 새 공개 패키지를 포함했습니다.
