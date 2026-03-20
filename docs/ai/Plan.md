## 진행 예정: control root 복귀 + bootstrap clone 지원

### 결정
- `--worktree`는 다시 control-root 레이아웃을 만드는 옵션으로 되돌린다.
- 로컬 구조는 `root/main/<branch-worktree>` sibling 배치로 고정한다.
- Git 메타데이터는 `.bare` 대신 `.gitdata` 같은 분리 git dir로 관리한다.
- clone 사용자는 일반 `git clone` 뒤 수동 전환하지 않고, bootstrap 절차로 바로 control root를 만든다.
- commit-visible 문서는 `main/` 기준으로 유지하고, root의 `AGENTS.md`, `.claude/CLAUDE.md`, `README.md`는 로컬 bootstrap이 만드는 stub로 분리한다.

### 문제
- single-root + sibling worktree 방식은 clone은 단순하지만, IDE를 repo 하나만 열었을 때 `main`과 agent worktree를 함께 보기 어렵다.
- `../worktrees/...`나 `../<repo>-worktrees/...`는 상위 디렉토리에서 소유 관계가 흐려지고, 해당 폴더가 왜 생겼는지 직관이 떨어진다.
- AI 에이전트 관점에서는 “지금 이 repo의 기본 checkout은 무엇이고, 활성 worktree는 어디 있는가”가 구조만으로 드러나야 한다.
- repo 내부 nested worktree는 Biome, Nx, 에이전트의 repo root 탐색을 꼬이게 할 수 있어서 피해야 한다.
- 기존 single-root 계획 위에 문서를 더 얹는 방식으로는 이 가시성 문제를 해결하기 어렵다.

### 목표
- IDE를 `desktop/code/test` 하나만 열어도 `main/`과 agent 작업 디렉토리를 같은 depth sibling으로 함께 볼 수 있게 한다.
- clone-visible 원격 구조는 여전히 평범한 repo root를 유지한다.
- control root는 로컬 운영 방식으로만 만들고, bootstrap 절차는 README 맨 위에서 바로 이해되게 한다.
- `--worktree`로 생성한 레포와 clone 뒤 bootstrap한 레포가 같은 로컬 구조를 갖게 만든다.
- local-only stub와 commit-visible 문서의 역할을 분리해, clone 사용자 혼란과 local 운영 편의성을 동시에 맞춘다.

### 목표 구조
```text
<appName>/
  .gitdata/             # local-only separated git dir
  AGENTS.md             # local-only control-root stub
  .claude/CLAUDE.md     # local-only control-root stub
  README.md             # local-only control-root stub
  main/
    frontend/
    packages/contracts/   # optional
    packages/app-router/  # optional
    backoffice/           # optional
    server/               # optional
    docs/
    AGENTS.md
    README.md
    package.json
    nx.json
    biome.json
  feat-login/
  fix-auth-timeout/
```

### bootstrap 흐름
1. 원격 기본 clone/배포 구조는 지금처럼 평범한 repo root를 유지한다.
2. clone 사용자는 빈 디렉토리에서 bootstrap 절차를 실행한다.
3. bootstrap은 `git clone --separate-git-dir=.gitdata <repo-url> main`으로 `main/` checkout과 분리 git dir을 만든다.
4. bootstrap은 root stub 파일(`AGENTS.md`, `.claude/CLAUDE.md`, `README.md`)을 생성한다.
5. 이후 새 작업은 `git -C main worktree add -b <branch> ../<branch-dir> main`으로 시작한다.

### clone-visible 문서 방향
- commit되는 [README.md](/Users/kimhyeongjeong/Desktop/code/miniapp/create-rn-miniapp/README.md)는 bootstrap 전 상태에서는 repo root README이고, bootstrap 후에는 `main/README.md`가 된다.
- 따라서 clone 사용자를 위한 bootstrap 안내는 committed README 맨 위에 둔다.
- README 첫 섹션에서 아래를 바로 설명한다.
  - 일반 clone은 평범한 single-root checkout이라는 점
  - AI/멀티-agent 운영용 권장 방식은 control-root bootstrap이라는 점
  - bootstrap 명령 또는 `pnpm worktree:clone:bootstrap` 같은 helper 스크립트 사용법
- bootstrap이 끝난 뒤 root의 로컬 stub README는 “이 디렉토리는 control root이고 실제 작업은 `main/`과 sibling worktree에서 한다”만 짧게 안내한다.

### 구현 방향
1. create 경로에서 control-root 복귀
   - `packages/create-rn-miniapp/src/scaffold/index.ts`는 `--worktree`일 때 최종 산출물을 `<output>/<appName>/main` 아래에 놓도록 다시 분기한다.
   - root `<output>/<appName>`는 control root가 되고, git init 대신 separated git dir 기반 bootstrap을 수행한다.
   - 생성 직후 local stub도 같이 만든다.
2. git 저장소 초기화 방식 교체
   - 예전 `.bare` 직접 생성 대신, separated git dir 또는 동등한 로컬 git-dir 구성 로직을 사용한다.
   - `main/.git`는 포인터 파일이 되고, hooks는 `.gitdata/hooks`에 설치한다.
   - `post-merge` cleanup hook은 여전히 `main`에서 pull했을 때 merged clean worktree를 정리하도록 유지한다.
3. bootstrap 지원
   - 생성물 README 상단에 clone 후 control-root bootstrap 절차를 추가한다.
   - 가능하면 CLI 또는 generated script로 `worktree:clone:bootstrap`을 제공해 수동 Git 명령 나열을 줄인다.
   - bootstrap helper가 없다면 README에는 최소 명령 집합을 정확히 적고, local stub 생성까지 포함한다.
4. local stub / committed docs 분리
   - root `AGENTS.md`, `.claude/CLAUDE.md`, `README.md`는 local-only 생성물로 복귀시킨다.
   - `main/AGENTS.md`, `main/README.md`, `main/docs/**`는 commit-visible 기준 문서로 유지한다.
   - stub는 “실제 작업 루트는 `main/`”와 “새 worktree는 control root 바로 아래 sibling으로 만든다”만 안내한다.
5. worktree 규칙 재정의
   - 표준 시작 경로는 `../<branch-dir>`로 고정한다.
   - `<branch-dir>`는 브랜치명의 `/`를 `-`로 바꾼 1-depth slug를 쓴다.
   - IDE에서 root를 열면 `main/`과 branch worktree가 한눈에 보여야 한다.
6. `--add`와 inspector 재정비
   - `workspace-inspector`는 다시 control root를 first-class로 다뤄야 한다.
   - 입력 경로가 control root인지 `main/`인지 sibling worktree인지 구분해서 실제 작업 루트를 정확히 찾게 한다.
   - `--add`는 control root 레이아웃에서 `main/`을 수정 대상으로 삼고, local stub는 건드리지 않는다.

### 파일별 작업 계획
1. `packages/create-rn-miniapp/src/scaffold/index.ts`
   - `--worktree` create 흐름을 `controlRoot` + `mainRoot` + sibling worktree 구조로 복귀
   - single-root / control-root 분기를 다시 명확히 분리
2. `packages/create-rn-miniapp/src/scaffold/worktree.ts`
   - separated git dir bootstrap helper 추가
   - local stub 생성 helper 추가
   - `post-merge` hook 설치 위치를 `.gitdata` 기준으로 정리
3. `packages/create-rn-miniapp/src/workspace-inspector.ts`
   - control root, `main/`, sibling worktree 입력을 모두 해석하는 탐지 로직 재구성
4. `packages/create-rn-miniapp/src/cli.ts`
   - `--worktree` help를 다시 “control-root + main + worktrees 운영 모드”로 설명
   - interactive 설명도 “멀티-agent용 root/main/sibling-worktree 구조” 의미로 바꾼다
5. `packages/create-rn-miniapp/src/templates/index.ts`
   - committed 문서는 `main/` 기준으로 생성
   - optional worktree docs는 sibling worktree 기준 절차로 갱신
   - AGENTS golden rule과 하네스 실행가이드는 `main`과 sibling worktree를 명시
6. `README.md`
   - 맨 위에 clone 후 bootstrap 절차 추가
   - bootstrap 전/후 구조를 구분해서 설명
   - `--worktree` 생성 결과도 `root/main/<branch-worktree>` 구조로 다시 설명
7. local stub 템플릿
   - root `AGENTS.md`, `.claude/CLAUDE.md`, `README.md` 내용을 새로 정의
   - 필요하면 `packages/scaffold-templates` 안에 local stub 소스를 따로 둔다

### 테스트 계획
1. `packages/create-rn-miniapp/src/scaffold/worktree.test.ts`
   - separated git dir bootstrap 뒤 `main/` checkout과 sibling worktree 시작 명령이 실제로 동작하는지 검증
   - local stub 생성 결과 검증
2. `packages/create-rn-miniapp/src/scaffold/index.test.ts`
   - `--worktree` create 결과가 `controlRoot/main` 구조인지 검증
   - `--add`가 control root에서 `main/`만 수정하는지 검증
3. `packages/create-rn-miniapp/src/workspace-inspector.test.ts`
   - control root, `main/`, sibling worktree 입력 해석 케이스 추가
4. `packages/create-rn-miniapp/src/templates/index.test.ts`
   - AGENTS golden rule, 하네스 실행가이드, worktree 문서가 sibling worktree 기준으로 바뀌는지 검증
5. `packages/create-rn-miniapp/src/release.test.ts`
   - README 상단에 bootstrap 안내가 있는지 회귀 검증

### TDD 순서
1. README / 템플릿 테스트를 먼저 깨서 bootstrap 문구와 새 경로 규칙을 고정한다.
2. scaffold/worktree 테스트를 깨서 separated git dir + `main/` 구조를 고정한다.
3. workspace-inspector 테스트를 깨서 control root 해석을 고정한다.
4. 그다음 create / add implementation을 복귀시킨다.

### 오픈 포인트
- `.gitdata`라는 이름을 쓸지 `.bare`를 유지할지는 아직 결정 필요
  - 현재 추천: `.gitdata`
  - 이유: bare clone처럼 오해되지 않고, “분리된 git dir” 의미가 더 직접적
- bootstrap을 README 명령으로만 열지, helper script/CLI 명령까지 같이 제공할지 결정 필요
  - 현재 추천: helper script 제공
  - 이유: local stub 생성과 hook 설치까지 수동 절차가 길어지기 때문
- control-root local stub를 commit 대상에서 완전히 제외할지, generated ignore 규칙으로만 관리할지 결정 필요
  - 현재 추천: local-only 생성 + Git 추적 제외

### 고정 규칙 초안
- `--worktree` create 결과:
  - `root/main`이 기본 checkout이다.
  - `root/main` 옆 sibling으로 agent worktree를 만든다.
- 표준 시작 명령:
  - `git -C main worktree add -b <branch> ../<branch-dir> main`
- `<branch-dir>` 규칙:
  - 브랜치명의 `/`를 `-`로 바꾼 1-depth slug를 쓴다.
- clone 사용자의 첫 단계:
  - committed `main/README.md` 상단 bootstrap 절차를 먼저 따른다.

### 검증 계획
- 우선: 관련 단위 테스트 집중 실행
  - `pnpm test -- packages/create-rn-miniapp/src/scaffold/worktree.test.ts`
  - `pnpm test -- packages/create-rn-miniapp/src/scaffold/index.test.ts`
  - `pnpm test -- packages/create-rn-miniapp/src/workspace-inspector.test.ts`
  - `pnpm test -- packages/create-rn-miniapp/src/templates/index.test.ts`
  - `pnpm test -- packages/create-rn-miniapp/src/release.test.ts`
- 마무리: `pnpm verify`
