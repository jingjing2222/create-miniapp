import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { CliPrompter } from '../cli.js'
import { runCommand } from '../commands.js'
import type { ProvisioningNote } from '../server-project.js'

const WORKTREE_BOOTSTRAP_STAGING_DIR = '.create-rn-miniapp-worktree-bootstrap'
export const MAIN_WORKTREE_DIRECTORY = 'main'

function createControlRootAgentsStub(workspaceDirectory: string) {
  return [
    '# AGENTS.md',
    '',
    '이 경로는 create-rn-miniapp이 만든 worktree control root예요.',
    `실제 repo root와 하네스 문서는 \`${workspaceDirectory}/\` 아래에 있어요.`,
    '',
    '## Start Here',
    `1. \`cd ${workspaceDirectory}\``,
    '2. 필요하면 원하는 worktree로 이동해요.',
    '3. 해당 worktree 안의 `AGENTS.md`를 먼저 읽어요.',
    '',
    '## Do Not',
    '- control root에서 `git commit`',
    '- control root에서 `git push`',
    '',
  ].join('\n')
}

function createControlRootReadmeStub(workspaceDirectory: string) {
  return [
    '# Worktree Control Root',
    '',
    '이 경로는 로컬 worktree를 관리하는 control root예요.',
    `실제 MiniApp repo는 \`${workspaceDirectory}/\` 아래에 있어요.`,
    '',
    '## Start',
    `- \`cd ${workspaceDirectory}\``,
    '- 실제 코드 수정, commit, push는 worktree 안에서만 진행해요.',
    '',
  ].join('\n')
}

async function writeControlRootShims(controlRoot: string) {
  await writeFile(
    path.join(controlRoot, 'AGENTS.md'),
    createControlRootAgentsStub(MAIN_WORKTREE_DIRECTORY),
    'utf8',
  )
  await writeFile(
    path.join(controlRoot, 'README.md'),
    createControlRootReadmeStub(MAIN_WORKTREE_DIRECTORY),
    'utf8',
  )
}

export function createWorktreeLayoutNote(options: { controlRoot: string; workspaceRoot: string }) {
  return {
    title: 'worktree 레이아웃으로 준비했어요',
    body: [
      `control root: ${options.controlRoot}`,
      `main worktree: ${options.workspaceRoot}`,
      '실제 repo 작업은 `main/` 안에서 진행해 주세요.',
    ].join('\n'),
  } satisfies ProvisioningNote
}

export async function resolveCreateWorktreeLayout(options: {
  prompt: CliPrompter
  noGit: boolean
  yes: boolean
  explicitWorktree?: boolean
}) {
  if (options.noGit) {
    return false
  }

  if (options.explicitWorktree !== undefined) {
    return options.explicitWorktree
  }

  if (options.yes) {
    return false
  }

  return (
    (await options.prompt.select({
      message: '`main` 브랜치로 마무리하기 전에 worktree 레이아웃으로 바꿔둘까요?',
      options: [
        { label: '아니요, 지금은 single-root로 둘게요', value: 'single-root' },
        { label: '네, `main/` worktree로 바꿔둘게요', value: 'worktree' },
      ],
      initialValue: 'single-root',
    })) === 'worktree'
  )
}

export async function convertSingleRootToWorktreeLayout(targetRoot: string) {
  const controlRoot = path.resolve(targetRoot)
  const stagingRoot = path.join(controlRoot, WORKTREE_BOOTSTRAP_STAGING_DIR)
  const workspaceRoot = path.join(controlRoot, MAIN_WORKTREE_DIRECTORY)

  await mkdir(stagingRoot, { recursive: true })

  const existingEntries = await readdir(controlRoot, { withFileTypes: true })

  for (const entry of existingEntries) {
    if (entry.name === WORKTREE_BOOTSTRAP_STAGING_DIR) {
      continue
    }

    await rename(path.join(controlRoot, entry.name), path.join(stagingRoot, entry.name))
  }

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

  const stagedEntries = await readdir(stagingRoot, { withFileTypes: true })

  for (const entry of stagedEntries) {
    await rename(path.join(stagingRoot, entry.name), path.join(workspaceRoot, entry.name))
  }

  await rm(stagingRoot, { recursive: true, force: true })
  await writeControlRootShims(controlRoot)

  return {
    controlRoot,
    workspaceRoot,
  }
}
