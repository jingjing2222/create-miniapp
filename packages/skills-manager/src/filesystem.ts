import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPackageManagerContext } from './package-manager.js'
import type { TemplateTokens } from './types.js'

const BINARY_TEMPLATE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const require = createRequire(import.meta.url)

export type TemplateReplacementTokens = Record<string, string>

export type CopyDirectoryWithTokensOptions = {
  relativeDir?: string
  skipRelativePaths?: Set<string>
  extraTokens?: TemplateReplacementTokens
}

function resolvePackageRoot(packageName: string, fallbackPackageJsonRelativePath: string) {
  try {
    return path.dirname(require.resolve(`${packageName}/package.json`))
  } catch {
    const fallbackPackageJsonPath = fileURLToPath(
      new URL(fallbackPackageJsonRelativePath, import.meta.url),
    )

    return path.dirname(fallbackPackageJsonPath)
  }
}

export function resolveSkillsPackageRoot() {
  return resolvePackageRoot('@create-rn-miniapp/agent-skills', '../../agent-skills/package.json')
}

export function resolveManagerPackageRoot() {
  return resolvePackageRoot('@create-rn-miniapp/skills-manager', '../package.json')
}

export function replaceTemplateTokens(
  source: string,
  tokens: TemplateTokens,
  extraTokens: TemplateReplacementTokens = {},
) {
  let rendered = source
    .replaceAll('{{appName}}', tokens.appName)
    .replaceAll('{{displayName}}', tokens.displayName)
    .replaceAll('{{packageManager}}', tokens.packageManager)
    .replaceAll('{{packageManagerField}}', tokens.packageManagerField)
    .replaceAll('{{packageManagerCommand}}', tokens.packageManagerCommand)
    .replaceAll('{{packageManagerRunCommand}}', tokens.packageManagerRunCommand)
    .replaceAll('{{packageManagerExecCommand}}', tokens.packageManagerExecCommand)
    .replaceAll('{{verifyCommand}}', tokens.verifyCommand)

  for (const [key, value] of Object.entries(extraTokens)) {
    rendered = rendered.replaceAll(key, value)
  }

  return rendered
}

export async function copyFileWithTokens(
  sourcePath: string,
  targetPath: string,
  tokens: TemplateTokens,
  extraTokens: TemplateReplacementTokens = {},
) {
  if (BINARY_TEMPLATE_EXTENSIONS.has(path.extname(sourcePath).toLowerCase())) {
    await mkdir(path.dirname(targetPath), { recursive: true })
    await cp(sourcePath, targetPath)
    return
  }

  const contents = await readFile(sourcePath, 'utf8')
  await mkdir(path.dirname(targetPath), { recursive: true })
  await writeFile(targetPath, replaceTemplateTokens(contents, tokens, extraTokens), 'utf8')
}

export async function copyDirectoryWithTokens(
  sourceDir: string,
  targetDir: string,
  tokens: TemplateTokens,
  options?: CopyDirectoryWithTokensOptions,
) {
  const entries = await readdir(sourceDir, { withFileTypes: true })
  const relativeDir = options?.relativeDir ?? ''

  await mkdir(targetDir, { recursive: true })

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)
    const relativePath = (relativeDir ? path.join(relativeDir, entry.name) : entry.name)
      .split(path.sep)
      .join('/')

    if (options?.skipRelativePaths?.has(relativePath)) {
      continue
    }

    if (entry.isDirectory()) {
      await copyDirectoryWithTokens(sourcePath, targetPath, tokens, {
        ...options,
        relativeDir: relativePath,
      })
      continue
    }

    await copyFileWithTokens(sourcePath, targetPath, tokens, options?.extraTokens)
  }
}

export async function pathExists(targetPath: string) {
  try {
    await stat(targetPath)
    return true
  } catch {
    return false
  }
}

export async function copyDirectory(sourceDir: string, targetDir: string) {
  await cp(sourceDir, targetDir, { recursive: true })
}

export async function writeJsonFile(targetPath: string, value: unknown) {
  await mkdir(path.dirname(targetPath), { recursive: true })
  await writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function createTemplateTokens(options: {
  appName: string
  displayName: string
  packageManager: import('./package-manager.js').PackageManager
}): TemplateTokens {
  const packageManager = getPackageManagerContext(options.packageManager)

  return {
    appName: options.appName,
    displayName: options.displayName,
    packageManager: options.packageManager,
    packageManagerField: packageManager.packageManagerField,
    packageManagerCommand: packageManager.packageManagerCommand,
    packageManagerRunCommand: packageManager.packageManagerRunCommand,
    packageManagerExecCommand: packageManager.packageManagerExecCommand,
    verifyCommand: packageManager.verifyCommand,
  }
}
