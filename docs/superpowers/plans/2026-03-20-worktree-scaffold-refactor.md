# Worktree Scaffold Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** worktree 결정을 scaffold 전으로 이동하여 파일 이동 로직을 제거하고, worktree 환경에 맞는 하네스 문서를 optional 패턴으로 삽입한다.

**Architecture:** CLI option resolution 단계에서 worktree 여부를 확정 → scaffold 시작 시 bare repo + `main/` worktree를 먼저 세팅 → 모든 파일 생성은 `workspaceRoot` 기준 → optional docs 패턴으로 AGENTS.md, 하네스-실행가이드에 worktree 워크플로우 삽입.

**Tech Stack:** TypeScript, Node.js test runner, yargs, @clack/prompts

**Spec:** `docs/superpowers/specs/2026-03-19-worktree-scaffold-refactor-design.md`

---

## File Structure

| File | Role |
|------|------|
| `src/scaffold/worktree.ts` | `convertSingleRootToWorktreeLayout` 삭제, `initBareWorktreeLayout` 추가 |
| `src/scaffold/worktree.test.ts` | convert 테스트 → init 테스트 교체 |
| `src/scaffold/types.ts` | `worktree: boolean` (optional 제거) |
| `src/scaffold/index.ts` | scaffold 시작부에 worktree 세팅, `targetRoot` → `workspaceRoot` 치환 |
| `src/cli.ts` | `resolveCliOptions`에서 worktree 결정 호출, conflicts 추가 |
| `src/cli.test.ts` | worktree 결정 테스트 추가 |
| `src/index.ts` | `describeWorktreeSelection` undefined 분기 제거 |
| `src/templates/index.ts` | `OptionalDocsOptions.hasWorktree`, render 함수 확장, 하네스-실행가이드 마커 처리 |
| `src/templates/index.test.ts` | hasWorktree 테스트 추가 |
| `scaffold-templates/base/docs/engineering/하네스-실행가이드.md` | optional worktree 마커 추가 |
| `scaffold-templates/optional/worktree/docs/engineering/worktree-workflow.md` | 신규 |

모든 파일 경로는 `packages/create-rn-miniapp/` 기준. scaffold-templates는 `packages/scaffold-templates/` 기준.

---

### Task 1: `worktree.ts` — `convertSingleRootToWorktreeLayout` 삭제 + `initBareWorktreeLayout` 추가

**Files:**
- Modify: `packages/create-rn-miniapp/src/scaffold/worktree.ts`
- Modify: `packages/create-rn-miniapp/src/scaffold/worktree.test.ts`

- [ ] **Step 1: `worktree.ts`에서 `convertSingleRootToWorktreeLayout`과 `WORKTREE_BOOTSTRAP_STAGING_DIR` 삭제**

import에서 `mkdir`, `readdir`, `rename`, `rm` 제거 (더 이상 필요 없음). `convertSingleRootToWorktreeLayout` 함수 전체(108-152줄)와 `WORKTREE_BOOTSTRAP_STAGING_DIR` 상수(7줄) 삭제.

- [ ] **Step 2: `initBareWorktreeLayout` 함수 추가**

`worktree.ts`에 추가:

```typescript
import { execFileSync } from 'node:child_process'

function assertMinimumGitVersion(minimum: string) {
  const raw = execFileSync('git', ['--version'], { encoding: 'utf8' }).trim()
  const match = raw.match(/(\d+\.\d+\.\d+)/)
  const current = match?.[1] ?? '0.0.0'

  const [curMajor, curMinor] = current.split('.').map(Number)
  const [minMajor, minMinor] = minimum.split('.').map(Number)

  if (curMajor < minMajor || (curMajor === minMajor && curMinor < minMinor)) {
    throw new Error(
      `worktree 레이아웃에는 git ${minimum} 이상이 필요해요. 현재: ${current}`,
    )
  }
}

export async function initBareWorktreeLayout(controlRoot: string) {
  assertMinimumGitVersion('2.38.0')

  await runCommand({
    cwd: controlRoot,
    command: 'git',
    args: ['init', '--bare', '.bare'],
    label: 'worktree control root git 저장소 만들기',
  })
  await writeFile(path.join(controlRoot, '.git'), 'gitdir: ./.bare\n', 'utf8')
  await runCommand({
    cwd: controlRoot,
    command: 'git',
    args: ['worktree', 'add', '--orphan', MAIN_WORKTREE_DIRECTORY],
    label: '`main` worktree 만들기',
  })
  await writeControlRootShims(controlRoot)
}
```

import를 `{ writeFile }` from `'node:fs/promises'`로 정리. `execFileSync`는 `'node:child_process'`에서 import.

- [ ] **Step 3: `worktree.test.ts`에서 `convertSingleRootToWorktreeLayout` 테스트를 `initBareWorktreeLayout` 테스트로 교체**

기존 `convertSingleRootToWorktreeLayout` 테스트(107-146줄)를 삭제하고, 다음으로 교체:

```typescript
import {
  createWorktreeLayoutNote,
  initBareWorktreeLayout,
  MAIN_WORKTREE_DIRECTORY,
  resolveCreateWorktreeLayout,
} from './worktree.js'

test('initBareWorktreeLayout creates a bare repo with a main worktree and control root shims', async () => {
  const controlRoot = await mkdtemp(path.join(os.tmpdir(), 'create-rn-miniapp-worktree-'))

  try {
    await initBareWorktreeLayout(controlRoot)
    const workspaceRoot = path.join(controlRoot, MAIN_WORKTREE_DIRECTORY)

    assert.equal(await readFile(path.join(controlRoot, '.git'), 'utf8'), 'gitdir: ./.bare\n')
    assert.ok((await stat(path.join(controlRoot, '.bare'))).isDirectory())
    assert.ok((await stat(workspaceRoot)).isDirectory())
    assert.match(await readFile(path.join(controlRoot, 'AGENTS.md'), 'utf8'), /cd main/)
    assert.match(await readFile(path.join(controlRoot, 'AGENTS.md'), 'utf8'), /wt status/)
    assert.match(await readFile(path.join(controlRoot, 'README.md'), 'utf8'), /실제 MiniApp repo는 `main\/` 아래에 있어요/)
    assert.equal(runGit(workspaceRoot, ['symbolic-ref', '--short', 'HEAD']), 'main')
    assert.match(runGit(controlRoot, ['worktree', 'list', '--porcelain']), /main$/m)
  } finally {
    await rm(controlRoot, { recursive: true, force: true })
  }
})
```

import 정리: `convertSingleRootToWorktreeLayout` → `initBareWorktreeLayout`.

- [ ] **Step 4: 테스트 실행**

Run: `cd packages/create-rn-miniapp && npx tsx --test src/scaffold/worktree.test.ts`
Expected: 모든 테스트 PASS (resolveCreateWorktreeLayout 3개 + createWorktreeLayoutNote 1개 + initBareWorktreeLayout 1개)

- [ ] **Step 5: 커밋**

```bash
git add packages/create-rn-miniapp/src/scaffold/worktree.ts packages/create-rn-miniapp/src/scaffold/worktree.test.ts
git commit -m "refactor: replace convertSingleRootToWorktreeLayout with initBareWorktreeLayout"
```

---

### Task 2: `types.ts` + `cli.ts` — worktree 결정을 resolveCliOptions로 이동

**Files:**
- Modify: `packages/create-rn-miniapp/src/scaffold/types.ts:14` (`worktree?: boolean` → `worktree: boolean`)
- Modify: `packages/create-rn-miniapp/src/cli.ts:72-75,485,141-144`
- Modify: `packages/create-rn-miniapp/src/cli.test.ts`

- [ ] **Step 1: `types.ts`에서 `worktree` optional 제거**

```typescript
// before
worktree?: boolean

// after
worktree: boolean
```

- [ ] **Step 2: `cli.ts`의 `ResolvedCliOptions`에서 `worktree` 타입 변경**

`ResolvedCliOptions.worktree?: boolean` → `worktree: boolean`.

- [ ] **Step 3: `cli.ts`의 `resolveCliOptions`에서 worktree 결정 호출 추가**

`resolveCliOptions` 함수 끝부분, `return` 직전에 추가:

```typescript
import { resolveCreateWorktreeLayout } from './scaffold/worktree.js'

// ... 기존 코드 ...

const worktree = await resolveCreateWorktreeLayout({
  prompt,
  noGit: argv.noGit ?? false,
  yes: argv.yes,
  explicitWorktree: argv.worktree,
})

return {
  // ... 기존 필드 ...
  worktree,  // 기존 `worktree: argv.worktree` 대체
  // ...
} satisfies ResolvedCliOptions
```

- [ ] **Step 4: `cli.ts`의 `parseCliArgs`에서 `--add`와 `--worktree` conflicts 추가**

yargs 체인에 `.conflicts('add', 'worktree')` 추가 (`.option('worktree', ...)` 바로 뒤).

- [ ] **Step 5: `cli.ts`의 `--worktree` 옵션 describe 업데이트**

```typescript
// before
describe: '마지막 git 단계 직전에 control root + main worktree 레이아웃으로 전환',

// after
describe: 'scaffold 시작 시 control root + main worktree 레이아웃으로 세팅',
```

- [ ] **Step 6: `cli.test.ts`에 worktree 결정 테스트 추가**

기존 `resolveCliOptions asks for missing values` 테스트(90줄)의 패턴을 따라 추가:

```typescript
test('resolveCliOptions resolves worktree to false when yes flag is set', async () => {
  const prompts: CliPrompter = {
    async text() { return '' },
    async select() { return 'no' as never },
  }

  const resolved = await resolveCliOptions(
    {
      add: false,
      rootDir: '/tmp/workspace',
      outputDir: '/tmp/workspace',
      skipInstall: false,
      yes: true,
      help: false,
      version: false,
      name: 'test-app',
      displayName: 'Test App',
    },
    prompts,
    { npm_config_user_agent: 'pnpm/10.32.1 npm/? node/v25.6.1 darwin arm64' },
  )

  assert.equal(resolved.worktree, false)
})

test('resolveCliOptions resolves worktree to true when explicit worktree flag is set', async () => {
  const prompts: CliPrompter = {
    async text() { return '' },
    async select() { return 'no' as never },
  }

  const resolved = await resolveCliOptions(
    {
      add: false,
      rootDir: '/tmp/workspace',
      outputDir: '/tmp/workspace',
      skipInstall: false,
      yes: true,
      help: false,
      version: false,
      name: 'test-app',
      displayName: 'Test App',
      worktree: true,
    },
    prompts,
    { npm_config_user_agent: 'pnpm/10.32.1 npm/? node/v25.6.1 darwin arm64' },
  )

  assert.equal(resolved.worktree, true)
})
```

- [ ] **Step 7: 기존 `resolveCliOptions` 테스트들에서 `hasWorktree` 관련 assertion이 필요한지 확인, selectMessages에 worktree 프롬프트가 추가됐으면 기존 테스트 업데이트**

기존 테스트의 `selectMessages` assertion에 worktree 프롬프트가 포함될 수 있으므로 확인 필요. `yes: false`인 기존 테스트에서 `promptSelections`에 worktree 선택 값을 추가해야 할 수 있음 (default가 `single-root`이므로).

- [ ] **Step 8: typecheck + 테스트 실행**

Run: `cd packages/create-rn-miniapp && npx tsc --noEmit && npx tsx --test src/cli.test.ts`
Expected: typecheck PASS, 모든 테스트 PASS

- [ ] **Step 9: 커밋**

```bash
git add packages/create-rn-miniapp/src/scaffold/types.ts packages/create-rn-miniapp/src/cli.ts packages/create-rn-miniapp/src/cli.test.ts
git commit -m "refactor: move worktree decision to resolveCliOptions"
```

---

### Task 3: `scaffold/index.ts` — scaffold 시작부 변경 + targetRoot→workspaceRoot 치환

**Files:**
- Modify: `packages/create-rn-miniapp/src/scaffold/index.ts`

- [ ] **Step 1: import 변경**

```typescript
// before
import {
  convertSingleRootToWorktreeLayout,
  createWorktreeLayoutNote,
  resolveCreateWorktreeLayout,
} from './worktree.js'

// after
import {
  createWorktreeLayoutNote,
  initBareWorktreeLayout,
  MAIN_WORKTREE_DIRECTORY,
} from './worktree.js'
```

- [ ] **Step 2: `scaffoldWorkspace` 시작부 변경**

```typescript
// before (lines 47-58)
export async function scaffoldWorkspace(options: ScaffoldOptions) {
  const targetRoot = path.resolve(options.outputDir, options.appName)
  const notes: ProvisioningNote[] = []
  const trpcEnabled = options.withTrpc && options.serverProvider === 'cloudflare'
  const tokens = createTemplateTokens({ ... })
  let workspaceRoot = targetRoot

  await ensureEmptyDirectory(targetRoot)

// after
export async function scaffoldWorkspace(options: ScaffoldOptions) {
  const controlRoot = path.resolve(options.outputDir, options.appName)
  const notes: ProvisioningNote[] = []
  const trpcEnabled = options.withTrpc && options.serverProvider === 'cloudflare'
  const tokens = createTemplateTokens({ ... })
  const useWorktree = options.worktree && !options.noGit

  await ensureEmptyDirectory(controlRoot)

  let workspaceRoot: string

  if (useWorktree) {
    log.step('control root + main worktree 레이아웃 세팅')
    await initBareWorktreeLayout(controlRoot)
    workspaceRoot = path.join(controlRoot, MAIN_WORKTREE_DIRECTORY)
  } else {
    workspaceRoot = controlRoot
  }
```

- [ ] **Step 3: scaffold 본문의 모든 `targetRoot` → `workspaceRoot`로 변경**

치환 대상 (모두 `workspaceRoot`로):
- `path.join(targetRoot, 'server')` (line 61)
- `buildCreateCommandPhases({ ... targetRoot })` → `targetRoot: workspaceRoot` (line 66)
- `path.join(targetRoot, 'frontend')` (line 77)
- `maybePrepareServerWorkspace({ targetRoot })` → `targetRoot: workspaceRoot` (line 91)
- `applyRootTemplates(targetRoot, ...)` → `workspaceRoot` (line 97)
- `maybePrepareTrpcWorkspace({ targetRoot })` → `targetRoot: workspaceRoot` (line 99)
- `maybePatchServerWorkspace({ targetRoot })` → `targetRoot: workspaceRoot` (line 104)
- `syncRootWorkspaceManifest(targetRoot, ...)` (line 113, 168) → `workspaceRoot`
- `resolveRootWorkspaces(targetRoot)` (line 116, 171) → `workspaceRoot`
- `runCommand({ cwd: targetRoot, ... })` tRPC install (line 123) → `workspaceRoot`
- `maybeProvisionSupabaseProject({ targetRoot })` (line 131) → `workspaceRoot`
- `maybeProvisionCloudflareWorker({ targetRoot })` (line 138) → `workspaceRoot`
- `maybeProvisionFirebaseProject({ targetRoot })` (line 147) → `workspaceRoot`
- `path.join(targetRoot, 'backoffice')` (lines 163, 177, 188) → `workspaceRoot`
- `applyDocsTemplates(targetRoot, ...)` (line 174) → `workspaceRoot`
- `syncOptionalDocsTemplates(targetRoot, ...)` (line 175) → `workspaceRoot`
- `patchFrontendWorkspace(targetRoot, ...)` (line 181) → `workspaceRoot`
- `patchBackofficeWorkspace(targetRoot, ...)` (line 189) → `workspaceRoot`
- `maybeFinalizeSupabaseProvisioning({ targetRoot: ... })` (line 219) → `workspaceRoot`
- `maybeFinalizeCloudflareProvisioning({ targetRoot: ... })` (line 226) → `workspaceRoot`
- `maybeFinalizeFirebaseProvisioning({ targetRoot: ... })` (line 233) → `workspaceRoot`
- `buildRootFinalizePlan({ targetRoot: ... })` (line 251) → `workspaceRoot`

**주의:** `buildCreateCommandPhases`의 parameter name은 `targetRoot`이지만, value로 `workspaceRoot`를 전달:
```typescript
buildCreateCommandPhases({
  appName: options.appName,
  targetRoot: workspaceRoot,  // value가 workspaceRoot
  packageManager: options.packageManager,
  ...
})
```

- [ ] **Step 4: worktree 결정 로직 제거 + git 세팅 분기 변경**

기존 lines 197-214의 `resolveCreateWorktreeLayout` 호출 + `convertSingleRootToWorktreeLayout` 호출 블록을 삭제하고, 대신:

```typescript
if (!options.noGit && !useWorktree) {
  for (const command of buildRootGitSetupPlan({ targetRoot: workspaceRoot })) {
    log.step(command.label)
    await runCommand(command)
  }
}
```

- [ ] **Step 5: worktree note 생성 분기 변경**

```typescript
// before
if (shouldUseWorktreeLayout && workspaceRoot !== targetRoot) {
  notes.unshift(createWorktreeLayoutNote({ controlRoot: targetRoot, workspaceRoot }))
}

// after
if (useWorktree) {
  notes.unshift(createWorktreeLayoutNote({ controlRoot, workspaceRoot }))
}
```

- [ ] **Step 6: 리턴 타입 변경**

```typescript
// before
return { targetRoot, workspaceRoot, notes, worktree: shouldUseWorktreeLayout }

// after
return { controlRoot, workspaceRoot, notes, worktree: useWorktree }
```

- [ ] **Step 7: `addWorkspaces`의 `syncOptionalDocsTemplates` 호출에 `hasWorktree: false` 추가**

`addWorkspaces` 함수 내 `syncOptionalDocsTemplates` 호출 (line 387):

```typescript
// before
await syncOptionalDocsTemplates(targetRoot, tokens, {
  hasBackoffice: await pathExists(path.join(targetRoot, 'backoffice')),
  serverProvider: finalServerProvider,
  hasTrpc: trpcEnabled,
})

// after
await syncOptionalDocsTemplates(targetRoot, tokens, {
  hasBackoffice: await pathExists(path.join(targetRoot, 'backoffice')),
  serverProvider: finalServerProvider,
  hasTrpc: trpcEnabled,
  hasWorktree: false,
})
```

- [ ] **Step 8: `scaffoldWorkspace`의 `syncOptionalDocsTemplates` 호출에 `hasWorktree` 추가**

```typescript
await syncOptionalDocsTemplates(workspaceRoot, tokens, {
  hasBackoffice:
    options.withBackoffice && (await pathExists(path.join(workspaceRoot, 'backoffice'))),
  serverProvider: options.serverProvider,
  hasTrpc: trpcEnabled,
  hasWorktree: useWorktree,
})
```

- [ ] **Step 9: typecheck 실행**

Run: `cd packages/create-rn-miniapp && npx tsc --noEmit`
Expected: PASS (templates/index.ts의 `OptionalDocsOptions` 변경이 아직이므로 여기서 fail 가능 → Task 5와 함께 해결)

- [ ] **Step 10: 커밋**

```bash
git add packages/create-rn-miniapp/src/scaffold/index.ts
git commit -m "refactor: scaffold into workspaceRoot from the start, remove file-moving logic"
```

---

### Task 4: `index.ts` — `describeWorktreeSelection` 단순화 + 리턴 타입 대응

**Files:**
- Modify: `packages/create-rn-miniapp/src/index.ts`

- [ ] **Step 1: `describeWorktreeSelection`에서 undefined 분기 제거**

```typescript
// before
function describeWorktreeSelection(options: { noGit: boolean; worktree?: boolean }) {
  if (options.noGit) {
    return 'git을 안 만들기 때문에 이번엔 건너뛸게요'
  }
  if (options.worktree === true) {
    return '네, 마지막에 `main/` worktree로 바꿔둘게요'
  }
  if (options.worktree === false) {
    return '아니요, single-root로 둘게요'
  }
  return '마지막 git 단계 직전에 물어볼게요'
}

// after
function describeWorktreeSelection(options: { noGit: boolean; worktree: boolean }) {
  if (options.noGit) {
    return 'git을 안 만들기 때문에 이번엔 건너뛸게요'
  }
  if (options.worktree) {
    return '네, `main/` worktree로 세팅할게요'
  }
  return '아니요, single-root로 둘게요'
}
```

- [ ] **Step 2: `main()`에서 `result.targetRoot` → `result.controlRoot` 대응**

`outro` 라인에서 `result.workspaceRoot`를 이미 쓰고 있으므로 변경 불필요할 수 있음. 확인 후 `result.targetRoot` 참조가 있으면 `result.controlRoot`로 변경.

- [ ] **Step 3: 커밋**

```bash
git add packages/create-rn-miniapp/src/index.ts
git commit -m "refactor: simplify describeWorktreeSelection, remove undefined branch"
```

---

### Task 5: `templates/index.ts` — `OptionalDocsOptions.hasWorktree` + render 함수 확장

**Files:**
- Modify: `packages/create-rn-miniapp/src/templates/index.ts:34-38,1192-1269,1300-1321`
- Modify: `packages/create-rn-miniapp/src/templates/index.test.ts`

- [ ] **Step 1: `OptionalDocsOptions`에 `hasWorktree` 추가**

```typescript
// before (line 34-38)
export type OptionalDocsOptions = {
  hasBackoffice: boolean
  serverProvider: OptionalDocsServerProvider | null
  hasTrpc: boolean
}

// after
export type OptionalDocsOptions = {
  hasBackoffice: boolean
  serverProvider: OptionalDocsServerProvider | null
  hasTrpc: boolean
  hasWorktree: boolean
}
```

- [ ] **Step 2: `resolveOptionalDocTemplates`에 worktree 추가**

```typescript
// line ~1315 뒤에 추가
if (options.hasWorktree) {
  templates.push({
    templateDir: 'worktree',
  })
}
```

- [ ] **Step 3: `renderOptionalAgentsSection`에 worktree 추가**

```typescript
// line ~1228 뒤 (hasTrpc 블록 뒤)에 추가
if (options.hasWorktree) {
  lines.push(
    '- `docs/engineering/worktree-workflow.md`',
    '  - worktree 레이아웃에서 브랜치 생성, 동기화, 정리 흐름을 먼저 보는 문서',
  )
}
```

- [ ] **Step 4: `renderOptionalGoldenRulesSection`에 worktree 추가**

```typescript
// before
function renderOptionalGoldenRulesSection(options: OptionalDocsOptions) {
  if (!options.hasTrpc) {
    return ''
  }
  return [
    '8. Boundary types from schema only: ...',
  ].join('\n')
}

// after
function renderOptionalGoldenRulesSection(options: OptionalDocsOptions) {
  const lines: string[] = []
  let ruleNumber = 8

  if (options.hasTrpc) {
    lines.push(
      `${ruleNumber}. Boundary types from schema only: client-server 경계 타입은 Zod schema에서 \`z.infer\`로만 파생하고, 같은 DTO를 별도 type alias로 중복 정의하지 않는다.`,
    )
    ruleNumber++
  }

  if (options.hasWorktree) {
    lines.push(
      `${ruleNumber}. Worktree discipline: 새 작업은 \`wt add\`로 worktree를 만들어 시작하고, control root에서 직접 commit하지 않는다.`,
    )
    ruleNumber++
  }

  return lines.join('\n')
}
```

- [ ] **Step 5: `renderOptionalDocsIndexSection`에 worktree 추가**

```typescript
// line ~1265 뒤 (hasTrpc 블록 뒤)에 추가
if (options.hasWorktree) {
  lines.push('- Worktree workflow: `engineering/worktree-workflow.md`')
}
```

- [ ] **Step 6: 하네스-실행가이드 마커 처리를 `syncOptionalDocsTemplates`에 추가**

`syncOptionalDocsTemplates` 함수 끝부분(docsIndex 처리 뒤)에 추가:

파일 상단 마커 상수 근처 (line 70-75 부근, `OPTIONAL_AGENTS_START_MARKER` 등이 있는 곳)에 추가:

```typescript
const OPTIONAL_WORKTREE_WORKFLOW_START_MARKER = '<!-- optional-worktree-workflow:start -->'
const OPTIONAL_WORKTREE_WORKFLOW_END_MARKER = '<!-- optional-worktree-workflow:end -->'
const SINGLE_ROOT_FINALIZE_LINE = '14. 브랜치 생성, 커밋, 브랜치 푸시, PR 생성 순으로 마무리한다.'
```

`syncOptionalDocsTemplates` 함수 끝부분 (docsIndex 처리 뒤)에:
const harnessGuidePath = path.join(targetRoot, 'docs', 'engineering', '하네스-실행가이드.md')
if (await pathExists(harnessGuidePath)) {
  const harnessSource = await readFile(harnessGuidePath, 'utf8')
  let nextHarnessSource = replaceMarkedSection(harnessSource, {
    startMarker: OPTIONAL_WORKTREE_WORKFLOW_START_MARKER,
    endMarker: OPTIONAL_WORKTREE_WORKFLOW_END_MARKER,
    renderedSection: options.hasWorktree
      ? [
          '14. `wt add -c <branch> -b main`으로 worktree를 만들고, 그 안에서 구현, 커밋, 푸시, PR 생성.',
          '15. 작업이 끝나면 `wt remove <branch> -b`로 정리.',
        ].join('\n')
      : '',
    fallbackAnchor: SINGLE_ROOT_FINALIZE_LINE,
  })

  if (options.hasWorktree && nextHarnessSource.includes(SINGLE_ROOT_FINALIZE_LINE)) {
    nextHarnessSource = nextHarnessSource.replace(`\n${SINGLE_ROOT_FINALIZE_LINE}`, '')
  }

  await writeFile(harnessGuidePath, nextHarnessSource, 'utf8')
}
```

- [ ] **Step 7: 기존 `syncOptionalDocsTemplates` 테스트들의 `hasWorktree: false` 추가**

기존 3개 테스트 (427줄, 470줄, 493줄)의 `syncOptionalDocsTemplates` 호출에 `hasWorktree: false` 추가.

- [ ] **Step 8: worktree optional docs 테스트 추가**

```typescript
test('syncOptionalDocsTemplates injects worktree docs and golden rule when worktree is enabled', async (t) => {
  const targetRoot = await createTempTargetRoot(t)
  const tokens = createTokens('pnpm')

  await applyDocsTemplates(targetRoot, tokens)
  await syncOptionalDocsTemplates(targetRoot, tokens, {
    hasBackoffice: false,
    serverProvider: null,
    hasTrpc: false,
    hasWorktree: true,
  })

  const agents = await readFile(path.join(targetRoot, 'AGENTS.md'), 'utf8')
  const docsIndex = await readFile(path.join(targetRoot, 'docs', 'index.md'), 'utf8')
  const harnessGuide = await readFile(
    path.join(targetRoot, 'docs', 'engineering', '하네스-실행가이드.md'),
    'utf8',
  )

  assert.match(agents, /worktree-workflow\.md/)
  assert.match(agents, /8\. Worktree discipline:/)
  assert.match(docsIndex, /Worktree workflow/)
  assert.match(harnessGuide, /wt add -c/)
  assert.doesNotMatch(harnessGuide, /14\. 브랜치 생성, 커밋, 브랜치 푸시, PR 생성 순으로 마무리한다\./)
  assert.equal(
    await pathExists(path.join(targetRoot, 'docs', 'engineering', 'worktree-workflow.md')),
    true,
  )
})

test('syncOptionalDocsTemplates numbers worktree golden rule after trpc when both are enabled', async (t) => {
  const targetRoot = await createTempTargetRoot(t)
  const tokens = createTokens('pnpm')

  await applyDocsTemplates(targetRoot, tokens)
  await syncOptionalDocsTemplates(targetRoot, tokens, {
    hasBackoffice: false,
    serverProvider: 'cloudflare',
    hasTrpc: true,
    hasWorktree: true,
  })

  const agents = await readFile(path.join(targetRoot, 'AGENTS.md'), 'utf8')

  assert.match(agents, /8\. Boundary types from schema only:/)
  assert.match(agents, /9\. Worktree discipline:/)
})
```

- [ ] **Step 9: 테스트 실행**

Run: `cd packages/create-rn-miniapp && npx tsx --test src/templates/index.test.ts`
Expected: 모든 테스트 PASS

- [ ] **Step 10: 커밋**

```bash
git add packages/create-rn-miniapp/src/templates/index.ts packages/create-rn-miniapp/src/templates/index.test.ts
git commit -m "feat: add worktree optional docs to AGENTS.md, harness guide, and docs index"
```

---

### Task 6: scaffold-templates — 하네스-실행가이드 마커 + worktree-workflow.md

**Files:**
- Modify: `packages/scaffold-templates/base/docs/engineering/하네스-실행가이드.md:45`
- Create: `packages/scaffold-templates/optional/worktree/docs/engineering/worktree-workflow.md`

- [ ] **Step 1: `하네스-실행가이드.md`에 optional worktree 마커 추가**

Line 45 변경:

```markdown
<!-- before -->
14. 브랜치 생성, 커밋, 브랜치 푸시, PR 생성 순으로 마무리한다.

<!-- after -->
<!-- optional-worktree-workflow:start -->
<!-- optional-worktree-workflow:end -->
14. 브랜치 생성, 커밋, 브랜치 푸시, PR 생성 순으로 마무리한다.
```

- [ ] **Step 2: `worktree-workflow.md` 생성**

```markdown
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
```

- [ ] **Step 3: 커밋**

```bash
git add packages/scaffold-templates/base/docs/engineering/하네스-실행가이드.md packages/scaffold-templates/optional/worktree/docs/engineering/worktree-workflow.md
git commit -m "feat: add worktree workflow template and harness guide marker"
```

---

### Task 7: 전체 검증

- [ ] **Step 1: typecheck**

Run: `cd packages/create-rn-miniapp && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: 전체 테스트**

Run: `cd packages/create-rn-miniapp && npx tsx --test src/**/*.test.ts`
Expected: 모든 테스트 PASS

- [ ] **Step 3: lint**

Run: `cd packages/create-rn-miniapp && npx biome check src/`
Expected: PASS (또는 auto-fixable issues만)

- [ ] **Step 4: 최종 커밋 (필요시)**

lint fix가 있으면:
```bash
npx biome check src/ --write --unsafe
git add packages/create-rn-miniapp/src packages/scaffold-templates
git commit -m "chore: lint fix"
```
