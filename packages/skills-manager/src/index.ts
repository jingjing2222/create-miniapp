#!/usr/bin/env node

import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import yargs from 'yargs'
import { syncSkillsDoc } from './docs.js'
import { createTemplateTokens, pathExists } from './filesystem.js'
import { parsePackageManagerField } from './package-manager.js'
import { syncSkillsRootScripts } from './root.js'
import { getSkillDefinition, type SkillId } from './skill-catalog.js'
import { readSkillsManifest, syncManagedSkills } from './skills.js'
import { inspectWorkspace } from './workspace.js'
import type { GeneratedWorkspaceHints, GeneratedWorkspaceOptions, ServerProvider } from './types.js'

const IGNORED_DIFF_ENTRY_NAMES = new Set([
  '.git',
  '.nx',
  'node_modules',
  'dist',
  'coverage',
  '.DS_Store',
])

export type SkillsManagerCommandName = 'install' | 'sync' | 'diff' | 'upgrade'

export type ParsedSkillsManagerArgs = {
  command: SkillsManagerCommandName
  rootDir: string
  to?: string
  appName?: string
  displayName?: string
  packageManager?: import('./package-manager.js').PackageManager
  serverProvider?: ServerProvider | null
  manualExtraSkills: string[]
}

type SyncInput = {
  rootDir: string
  appName: string
  displayName: string
  packageManager: import('./package-manager.js').PackageManager
  serverProvider: ServerProvider | null
  manualExtraSkills?: string[]
}

type DiffResult = {
  hasChanges: boolean
  report: string
}

function assertCommandName(value: string | undefined): SkillsManagerCommandName {
  if (value === 'install' || value === 'sync' || value === 'diff' || value === 'upgrade') {
    return value
  }

  throw new Error('`skills-manager <install|sync|diff|upgrade>` 형식으로 실행해 주세요.')
}

async function listWorkspaceFiles(rootDir: string, currentDir = ''): Promise<string[]> {
  const absoluteDir = currentDir ? path.join(rootDir, currentDir) : rootDir
  const entries = await readdir(absoluteDir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (IGNORED_DIFF_ENTRY_NAMES.has(entry.name)) {
      continue
    }

    const relativePath = currentDir ? path.join(currentDir, entry.name) : entry.name
    const normalizedRelativePath = relativePath.split(path.sep).join('/')

    if (entry.isDirectory()) {
      files.push(...(await listWorkspaceFiles(rootDir, relativePath)))
      continue
    }

    files.push(normalizedRelativePath)
  }

  return files
}

async function copyWorkspaceForDiff(sourceRoot: string, targetRoot: string) {
  await cp(sourceRoot, targetRoot, {
    recursive: true,
    filter(sourcePath) {
      return !IGNORED_DIFF_ENTRY_NAMES.has(path.basename(sourcePath))
    },
  })
}

function buildDiffReport(options: { leftFiles: string[]; rightFiles: string[] }) {
  const reportLines: string[] = []
  const leftSet = new Set(options.leftFiles)
  const rightSet = new Set(options.rightFiles)

  for (const filePath of options.leftFiles) {
    if (!rightSet.has(filePath)) {
      reportLines.push(`- ${filePath}`)
    }
  }

  for (const filePath of options.rightFiles) {
    if (!leftSet.has(filePath)) {
      reportLines.push(`+ ${filePath}`)
    }
  }

  return reportLines
}

async function appendModifiedFiles(
  reportLines: string[],
  options: {
    leftRoot: string
    rightRoot: string
    files: string[]
  },
) {
  for (const filePath of options.files) {
    const [leftSource, rightSource] = await Promise.all([
      readFile(path.join(options.leftRoot, filePath)),
      readFile(path.join(options.rightRoot, filePath)),
    ])

    if (!leftSource.equals(rightSource)) {
      reportLines.push(`M ${filePath}`)
    }
  }
}

async function resolveGeneratedWorkspaceOptions(
  rootDir: string,
  serverProvider: ServerProvider | null,
): Promise<GeneratedWorkspaceOptions> {
  return {
    hasBackoffice: await pathExists(path.join(rootDir, 'backoffice')),
    serverProvider: (await pathExists(path.join(rootDir, 'server'))) ? serverProvider : null,
    hasTrpc:
      (await pathExists(path.join(rootDir, 'packages', 'contracts', 'package.json'))) &&
      (await pathExists(path.join(rootDir, 'packages', 'app-router', 'package.json'))),
  }
}

async function runSync(input: SyncInput) {
  const tokens = createTemplateTokens({
    appName: input.appName,
    displayName: input.displayName,
    packageManager: input.packageManager,
  })
  const hints: GeneratedWorkspaceHints = {
    serverProvider: input.serverProvider,
    manualExtraSkills: input.manualExtraSkills,
  }
  const options = await resolveGeneratedWorkspaceOptions(input.rootDir, input.serverProvider)

  await syncSkillsRootScripts(input.rootDir, input.packageManager)
  await syncManagedSkills(input.rootDir, tokens, hints)
  await syncSkillsDoc(input.rootDir, input.packageManager, options, hints)
}

async function validateManualSkillIds(rootDir: string) {
  const manifest = await readSkillsManifest(rootDir)

  if (!manifest) {
    return
  }

  for (const manualSkillId of manifest.manualExtraSkills) {
    try {
      getSkillDefinition(manualSkillId as SkillId)
    } catch {
      throw new Error(
        `manifest가 현재 catalog에 없는 manual skill id를 가리킵니다: ${manualSkillId}`,
      )
    }
  }
}

export async function parseSkillsManagerArgs(rawArgs: string[], cwd = process.cwd()) {
  const argv = await yargs(rawArgs)
    .help(false)
    .version(false)
    .exitProcess(false)
    .strictOptions()
    .fail(() => {
      throw new Error('skills-manager 명령 옵션을 읽지 못했어요.')
    })
    .option('root-dir', {
      type: 'string',
      default: cwd,
      describe: '대상 miniapp root',
    })
    .option('to', {
      type: 'string',
      describe: 'upgrade target version',
    })
    .option('app-name', {
      type: 'string',
      describe: 'install 시 scaffold appName',
    })
    .option('display-name', {
      type: 'string',
      describe: 'install 시 scaffold displayName',
    })
    .option('package-manager', {
      choices: ['pnpm', 'yarn', 'npm', 'bun'] as const,
      describe: 'install 시 사용할 package manager',
    })
    .option('server-provider', {
      choices: ['supabase', 'cloudflare', 'firebase'] as const,
      describe: 'install 시 사용할 server provider',
    })
    .option('manual-extra-skill', {
      type: 'array',
      string: true,
      default: [],
      describe: '추가 manual skill id 반복 지정',
    })
    .parse()

  return {
    command: assertCommandName(String(argv._[0] ?? '')),
    rootDir: path.resolve(String(argv.rootDir)),
    to: argv.to ? String(argv.to) : undefined,
    appName: argv['app-name'] ? String(argv['app-name']) : undefined,
    displayName: argv['display-name'] ? String(argv['display-name']) : undefined,
    packageManager: argv['package-manager']
      ? parsePackageManagerField(`${String(argv['package-manager'])}@0.0.0`)
      : undefined,
    serverProvider:
      argv['server-provider'] !== undefined
        ? (String(argv['server-provider']) as ServerProvider)
        : undefined,
    manualExtraSkills: (argv['manual-extra-skill'] as string[] | undefined) ?? [],
  } satisfies ParsedSkillsManagerArgs
}

export async function installSkillsWorkspace(input: SyncInput) {
  await runSync(input)
}

export async function syncSkillsWorkspace(rootDir: string) {
  const inspection = await inspectWorkspace(rootDir)

  await runSync({
    rootDir,
    appName: inspection.appName,
    displayName: inspection.displayName,
    packageManager: inspection.packageManager,
    serverProvider: inspection.serverProvider,
  })
}

export async function diffSkillsWorkspace(rootDir: string): Promise<DiffResult> {
  const tempParent = await mkdtemp(path.join(os.tmpdir(), 'create-rn-miniapp-skills-diff-'))
  const tempRoot = path.join(tempParent, 'workspace')

  try {
    await copyWorkspaceForDiff(rootDir, tempRoot)
    await syncSkillsWorkspace(tempRoot)

    const [currentFiles, syncedFiles] = await Promise.all([
      listWorkspaceFiles(rootDir),
      listWorkspaceFiles(tempRoot),
    ])
    const reportLines = buildDiffReport({
      leftFiles: currentFiles,
      rightFiles: syncedFiles,
    })
    const sharedFiles = currentFiles.filter((filePath) => syncedFiles.includes(filePath))

    await appendModifiedFiles(reportLines, {
      leftRoot: rootDir,
      rightRoot: tempRoot,
      files: sharedFiles,
    })

    return {
      hasChanges: reportLines.length > 0,
      report:
        reportLines.length > 0
          ? reportLines.join('\n')
          : 'skills sync 결과와 현재 workspace가 같습니다.',
    }
  } finally {
    await rm(tempParent, { recursive: true, force: true })
  }
}

export async function upgradeSkillsWorkspace(rootDir: string, _to: string) {
  await validateManualSkillIds(rootDir)
  await syncSkillsWorkspace(rootDir)
}

export async function runSkillsManager(rawArgs: string[]) {
  const args = await parseSkillsManagerArgs(rawArgs)

  if (!(await pathExists(args.rootDir))) {
    throw new Error(`rootDir를 찾지 못했어요: ${args.rootDir}`)
  }

  if (args.command === 'install') {
    if (!args.appName || !args.displayName || !args.packageManager) {
      throw new Error('install에는 --app-name, --display-name, --package-manager가 필요합니다.')
    }

    await installSkillsWorkspace({
      rootDir: args.rootDir,
      appName: args.appName,
      displayName: args.displayName,
      packageManager: args.packageManager,
      serverProvider: args.serverProvider ?? null,
      manualExtraSkills: args.manualExtraSkills,
    })
    return
  }

  if (args.command === 'sync') {
    await syncSkillsWorkspace(args.rootDir)
    return
  }

  if (args.command === 'diff') {
    const diff = await diffSkillsWorkspace(args.rootDir)

    console.log(diff.report)

    if (diff.hasChanges) {
      process.exitCode = 1
    }

    return
  }

  await upgradeSkillsWorkspace(args.rootDir, args.to ?? 'latest')
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  void runSkillsManager(process.argv.slice(2))
}
