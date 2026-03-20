---
"create-rn-miniapp": patch
"@create-rn-miniapp/scaffold-templates": patch
---

`--worktree`는 local control root를 만들고, `.gitdata + main/ + sibling worktree` 구조로 운영하게 하는 옵션이에요.

- `--worktree` scaffold는 root에 `.gitdata/`, local stub `AGENTS.md`, `.claude/CLAUDE.md`, `README.md`, 그리고 실제 기본 checkout `main/`을 함께 생성
- `git init --separate-git-dir` 기반으로 control root를 초기화하고, `main/`에 baseline commit을 남겨 표준 `git -C main worktree add -b <branch> ../<branch-dir> main` 시작 명령이 바로 동작
- `.gitdata/hooks/post-merge`에 main에 반영된 clean worktree를 정리하는 cleanup hook 설치
- committed README 상단에 clone 후 control-root bootstrap 절차를 추가하고, `main/scripts/worktree/bootstrap-control-root.mjs`로 local stub를 다시 만들 수 있게 함
- `--add` 모드에서 control root, `main/`, sibling worktree 입력을 모두 `main/` 작업 루트로 해석하고 worktree 관련 문서를 유지
- legacy control-root 레이아웃을 읽는 최소 호환은 유지
- worktree 선택 시 AGENTS.md golden rule, docs index, 하네스 실행가이드, `worktree-workflow.md`를 control-root 기준 규칙으로 갱신
