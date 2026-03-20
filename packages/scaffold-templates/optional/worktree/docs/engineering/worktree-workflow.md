# Worktree 워크플로우

## 레이아웃 구조

이 프로젝트는 worktree 레이아웃으로 만들어졌어요.

```
project/
  .bare/          ← bare git 저장소
  .git            ← gitdir: ./.bare
  AGENTS.md       ← control root 안내 (git에 안 올라감)
  README.md       ← control root 안내 (git에 안 올라감)
  main/           ← 기본 브랜치 worktree (실제 작업 공간)
    package.json
    frontend/
    server/
    docs/
```

`main/` 안이 실제 git repo의 루트예요. GitHub에서는 `main/` 없이 flat하게 보여요.

## 새 작업 시작

```bash
wt add -c <branch-name> -b main
```

`main/`과 같은 레벨에 새 worktree가 생겨요.

## 상태 확인

```bash
wt status
```

모든 worktree의 브랜치와 상태를 한눈에 볼 수 있어요.

## 동기화

```bash
wt pull
```

모든 worktree에서 remote 변경사항을 가져와요.

## 정리

```bash
wt remove <branch-name> -b
```

작업이 끝난 worktree를 브랜치와 함께 정리해요.

## 주의사항

- control root에서 직접 `git commit`이나 `git push`를 하지 마세요.
- 실제 작업은 항상 `main/` 또는 추가 worktree 안에서 진행하세요.
- 각 worktree 안의 `AGENTS.md`를 먼저 읽고 시작하세요.
