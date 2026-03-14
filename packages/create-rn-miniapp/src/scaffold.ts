import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { log } from '@clack/prompts'
import { buildCommandPlan, runCommand, type CommandSpec } from './commands.js'
import { getPackageManagerAdapter, type PackageManager } from './package-manager.js'
import { patchBackofficeWorkspace, patchFrontendWorkspace, patchServerWorkspace } from './patch.js'
import type { ServerProvider } from './server-provider.js'
import {
  type TemplateTokens,
  applyDocsTemplates,
  applyRootTemplates,
  ensureEmptyDirectory,
  pathExists,
} from './templates.js'

export type ScaffoldOptions = {
  packageManager: PackageManager
  appName: string
  displayName: string
  outputDir: string
  serverProvider: ServerProvider | null
  withBackoffice: boolean
  skipInstall: boolean
}

export function buildRootFinalizePlan(options: {
  targetRoot: string
  packageManager: PackageManager
}) {
  const packageManager = getPackageManagerAdapter(options.packageManager)
  const plan: CommandSpec[] = [
    {
      cwd: options.targetRoot,
      ...packageManager.install(),
      label: `루트 ${options.packageManager} install`,
    },
  ]

  if (options.packageManager === 'yarn') {
    plan.push({
      cwd: options.targetRoot,
      ...packageManager.dlx('@yarnpkg/sdks', ['base']),
      label: '루트 yarn sdks 생성',
    })
  }

  plan.push({
    cwd: options.targetRoot,
    ...packageManager.exec('biome', ['check', '.', '--write', '--unsafe']),
    label: '루트 biome check --write --unsafe',
  })

  return plan
}

export async function scaffoldWorkspace(options: ScaffoldOptions) {
  const targetRoot = path.resolve(options.outputDir, options.appName)
  const packageManager = getPackageManagerAdapter(options.packageManager)
  const tokens: TemplateTokens = {
    appName: options.appName,
    displayName: options.displayName,
    packageManager: options.packageManager,
    packageManagerCommand: options.packageManager,
    packageManagerExecCommand: `${options.packageManager} exec`,
    verifyCommand: packageManager.verifyCommand(),
  }

  await ensureEmptyDirectory(targetRoot)

  if (options.serverProvider) {
    await mkdir(path.join(targetRoot, 'server'), { recursive: true })
  }

  const plan = buildCommandPlan({
    appName: options.appName,
    targetRoot,
    packageManager: options.packageManager,
    serverProvider: options.serverProvider,
    withBackoffice: options.withBackoffice,
  })

  for (const command of plan) {
    log.step(command.label)
    await runCommand(command)
  }

  await applyRootTemplates(targetRoot, tokens)
  await applyDocsTemplates(targetRoot, tokens)
  await patchFrontendWorkspace(targetRoot, tokens, {
    packageManager: options.packageManager,
    serverProvider: options.serverProvider,
  })

  if (options.withBackoffice && (await pathExists(path.join(targetRoot, 'backoffice')))) {
    await patchBackofficeWorkspace(targetRoot, tokens, {
      packageManager: options.packageManager,
      serverProvider: options.serverProvider,
    })
  }

  if (options.serverProvider && (await pathExists(path.join(targetRoot, 'server')))) {
    await patchServerWorkspace(targetRoot, tokens, {
      packageManager: options.packageManager,
    })
  }

  if (!options.skipInstall) {
    for (const command of buildRootFinalizePlan({
      targetRoot,
      packageManager: options.packageManager,
    })) {
      log.step(command.label)
      await runCommand(command)
    }
  }

  return { targetRoot }
}
