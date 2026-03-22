import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parsePackageManagerField, type PackageManager } from './package-manager.js'
import { pathExists } from './filesystem.js'
import type { ServerProvider } from './types.js'

const APP_ROUTER_WORKSPACE_PATH = path.join('packages', 'app-router')
const CONTRACTS_WORKSPACE_PATH = path.join('packages', 'contracts')
const SERVER_SCAFFOLD_STATE_RELATIVE_PATH = path.join('.create-rn-miniapp', 'state.json')

type ServerScaffoldState = {
  serverProvider: ServerProvider
  trpc: boolean
  backoffice: boolean
}

type RootPackageJson = {
  packageManager?: string
}

export type WorkspaceInspection = {
  rootDir: string
  packageManager: PackageManager
  appName: string
  displayName: string
  hasBackoffice: boolean
  hasTrpc: boolean
  serverProvider: ServerProvider | null
}

function toDefaultDisplayName(appName: string) {
  return appName
    .split('-')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

function readGraniteConfigMetadata(source: string) {
  const appNameMatch = source.match(/appName:\s*['"`]([^'"`]+)['"`]/)
  const displayNameMatch = source.match(/displayName:\s*['"`]([^'"`]+)['"`]/)

  return {
    appName: appNameMatch?.[1] ?? null,
    displayName: displayNameMatch?.[1] ?? null,
  }
}

async function detectServerProvider(rootDir: string): Promise<ServerProvider | null> {
  if (await pathExists(path.join(rootDir, 'server', 'wrangler.jsonc'))) {
    return 'cloudflare'
  }

  if (await pathExists(path.join(rootDir, 'server', 'wrangler.toml'))) {
    return 'cloudflare'
  }

  if (await pathExists(path.join(rootDir, 'server', 'firebase.json'))) {
    return 'firebase'
  }

  if (await pathExists(path.join(rootDir, 'server', 'supabase', 'config.toml'))) {
    return 'supabase'
  }

  return null
}

async function readServerScaffoldState(rootDir: string): Promise<ServerScaffoldState | null> {
  const statePath = path.join(rootDir, 'server', SERVER_SCAFFOLD_STATE_RELATIVE_PATH)

  if (!(await pathExists(statePath))) {
    return null
  }

  return JSON.parse(await readFile(statePath, 'utf8')) as ServerScaffoldState
}

export async function inspectWorkspace(rootDir: string): Promise<WorkspaceInspection> {
  const resolvedRootDir = path.resolve(rootDir)
  const packageJsonPath = path.join(resolvedRootDir, 'package.json')
  const graniteConfigPath = path.join(resolvedRootDir, 'frontend', 'granite.config.ts')

  if (!(await pathExists(packageJsonPath))) {
    throw new Error(`root package.json을 찾지 못했어요: ${resolvedRootDir}`)
  }

  if (!(await pathExists(graniteConfigPath))) {
    throw new Error(`frontend/granite.config.ts를 찾지 못했어요: ${resolvedRootDir}`)
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as RootPackageJson
  const graniteConfigSource = await readFile(graniteConfigPath, 'utf8')
  const metadata = readGraniteConfigMetadata(graniteConfigSource)

  if (!metadata.appName) {
    throw new Error('frontend/granite.config.ts에서 appName을 읽지 못했어요.')
  }

  const detectedServerProvider = await detectServerProvider(resolvedRootDir)
  const state = detectedServerProvider ? await readServerScaffoldState(resolvedRootDir) : null

  return {
    rootDir: resolvedRootDir,
    packageManager: parsePackageManagerField(packageJson.packageManager),
    appName: metadata.appName,
    displayName: metadata.displayName ?? toDefaultDisplayName(metadata.appName),
    hasBackoffice:
      state?.backoffice ?? (await pathExists(path.join(resolvedRootDir, 'backoffice'))),
    hasTrpc:
      state?.trpc ??
      ((await pathExists(path.join(resolvedRootDir, CONTRACTS_WORKSPACE_PATH, 'package.json'))) &&
        (await pathExists(path.join(resolvedRootDir, APP_ROUTER_WORKSPACE_PATH, 'package.json')))),
    serverProvider: state?.serverProvider ?? detectedServerProvider,
  }
}
