import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getPackageManagerContext, type PackageManager } from './package-manager.js'

export const SKILLS_MANIFEST_RELATIVE_PATH = path.join('.create-rn-miniapp', 'skills.json')

function renderMirrorScriptSource() {
  return [
    "import { cp, mkdir, rm, stat } from 'node:fs/promises'",
    "import path from 'node:path'",
    "import { fileURLToPath } from 'node:url'",
    '',
    "const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')",
    "const canonicalSkillsDir = path.join(workspaceRoot, '.agents', 'skills')",
    "const claudeSkillsDir = path.join(workspaceRoot, '.claude', 'skills')",
    '',
    'async function ensureDirectory(targetPath) {',
    '  await mkdir(targetPath, { recursive: true })',
    '}',
    '',
    'async function assertExists(targetPath, label) {',
    '  try {',
    '    await stat(targetPath)',
    '  } catch {',
    "    throw new Error(label + ' 경로가 없습니다: ' + targetPath)",
    '  }',
    '}',
    '',
    'async function main() {',
    "  await assertExists(canonicalSkillsDir, 'canonical skills')",
    '  await ensureDirectory(path.dirname(claudeSkillsDir))',
    '  await rm(claudeSkillsDir, { recursive: true, force: true })',
    '  await cp(canonicalSkillsDir, claudeSkillsDir, { recursive: true })',
    '}',
    '',
    'await main()',
    '',
  ].join('\n')
}

function renderCheckScriptSource(mirrorCommand: string) {
  return [
    "import { readFile, readdir, stat } from 'node:fs/promises'",
    "import path from 'node:path'",
    "import { fileURLToPath } from 'node:url'",
    '',
    "const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')",
    "const canonicalSkillsDir = path.join(workspaceRoot, '.agents', 'skills')",
    "const claudeSkillsDir = path.join(workspaceRoot, '.claude', 'skills')",
    '',
    'async function listFiles(rootDir, currentDir = rootDir) {',
    '  const entries = await readdir(currentDir, { withFileTypes: true })',
    '  const files = []',
    '',
    '  for (const entry of entries) {',
    '    const absolutePath = path.join(currentDir, entry.name)',
    '',
    '    if (entry.isDirectory()) {',
    '      files.push(...(await listFiles(rootDir, absolutePath)))',
    '      continue',
    '    }',
    '',
    '    files.push(path.relative(rootDir, absolutePath))',
    '  }',
    '',
    '  return files.sort()',
    '}',
    '',
    'async function assertExists(targetPath, label) {',
    '  try {',
    '    await stat(targetPath)',
    '  } catch {',
    "    throw new Error(label + ' 경로가 없습니다: ' + targetPath)",
    '  }',
    '}',
    '',
    'async function main() {',
    "  await assertExists(canonicalSkillsDir, 'canonical skills')",
    "  await assertExists(claudeSkillsDir, 'claude mirror')",
    '',
    '  const canonicalFiles = await listFiles(canonicalSkillsDir)',
    '  const mirrorFiles = await listFiles(claudeSkillsDir)',
    '',
    '  const missingInMirror = canonicalFiles.filter((file) => !mirrorFiles.includes(file))',
    '  const extraInMirror = mirrorFiles.filter((file) => !canonicalFiles.includes(file))',
    '  const changedFiles = []',
    '',
    '  for (const file of canonicalFiles) {',
    '    if (!mirrorFiles.includes(file)) {',
    '      continue',
    '    }',
    '',
    '    const [canonicalSource, mirrorSource] = await Promise.all([',
    '      readFile(path.join(canonicalSkillsDir, file)),',
    '      readFile(path.join(claudeSkillsDir, file)),',
    '    ])',
    '',
    '    if (!canonicalSource.equals(mirrorSource)) {',
    '      changedFiles.push(file)',
    '    }',
    '  }',
    '',
    '  if (missingInMirror.length === 0 && extraInMirror.length === 0 && changedFiles.length === 0) {',
    '    return',
    '  }',
    '',
    "  const messages = ['Skill mirror가 canonical source와 일치하지 않습니다.']",
    '',
    '  if (missingInMirror.length > 0) {',
    "    messages.push('- mirror에 없는 파일: ' + missingInMirror.join(', '))",
    '  }',
    '',
    '  if (extraInMirror.length > 0) {',
    "    messages.push('- mirror에만 있는 파일: ' + extraInMirror.join(', '))",
    '  }',
    '',
    '  if (changedFiles.length > 0) {',
    "    messages.push('- 내용이 다른 파일: ' + changedFiles.join(', '))",
    '  }',
    '',
    `  messages.push(${JSON.stringify(`${mirrorCommand}로 mirror를 다시 동기화하세요.`)})`,
    '',
    "  throw new Error(messages.join('\\n'))",
    '}',
    '',
    'await main()',
    '',
  ].join('\n')
}

function renderRemoteManagerScriptSource(command: 'sync' | 'diff' | 'upgrade') {
  const isUpgrade = command === 'upgrade'

  return [
    "import { readFile } from 'node:fs/promises'",
    "import { spawn } from 'node:child_process'",
    "import path from 'node:path'",
    "import { fileURLToPath } from 'node:url'",
    '',
    "const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')",
    `const manifestPath = path.join(workspaceRoot, ${JSON.stringify(SKILLS_MANIFEST_RELATIVE_PATH)})`,
    "const rootPackageJsonPath = path.join(workspaceRoot, 'package.json')",
    '',
    'function resolvePackageManagerCommand(packageManager, packageSpec, args) {',
    '  switch (packageManager) {',
    "    case 'pnpm':",
    "      return { command: 'pnpm', args: ['dlx', packageSpec, ...args] }",
    "    case 'yarn':",
    "      return { command: 'yarn', args: ['dlx', packageSpec, ...args] }",
    "    case 'npm':",
    "      return { command: 'npx', args: ['-y', packageSpec, ...args] }",
    "    case 'bun':",
    "      return { command: 'bunx', args: [packageSpec, ...args] }",
    '    default:',
    "      throw new Error('지원하지 않는 package manager입니다: ' + packageManager)",
    '  }',
    '}',
    '',
    'async function main() {',
    "  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))",
    "  const rootPackageJson = JSON.parse(await readFile(rootPackageJsonPath, 'utf8'))",
    "  const packageManager = String(rootPackageJson.packageManager ?? '').split('@')[0]",
    "  const managerPackage = manifest.managerPackage ?? '@create-rn-miniapp/skills-manager'",
    ...(isUpgrade
      ? [
          "  const targetVersion = process.argv[2] ?? 'latest'",
          '  const invocation = resolvePackageManagerCommand(',
          '    packageManager,',
          "    managerPackage + '@' + targetVersion,",
          `    [${JSON.stringify(command)}, '--root-dir', '.', '--to', targetVersion],`,
          '  )',
        ]
      : [
          '  const managerVersion = manifest.managerVersion',
          '',
          '  if (!managerVersion) {',
          "    throw new Error('skills manifest에 managerVersion이 없습니다.')",
          '  }',
          '',
          '  const invocation = resolvePackageManagerCommand(',
          '    packageManager,',
          "    managerPackage + '@' + managerVersion,",
          `    [${JSON.stringify(command)}, '--root-dir', '.'],`,
          '  )',
        ]),
    '',
    '  await new Promise((resolve, reject) => {',
    '    const child = spawn(invocation.command, invocation.args, {',
    '      cwd: workspaceRoot,',
    "      stdio: 'inherit',",
    '    })',
    '',
    "    child.on('exit', (code) => {",
    '      if (code === 0) {',
    '        resolve(undefined)',
    '        return',
    '      }',
    '',
    `      reject(new Error(\`skills ${command}가 실패했습니다. exit code: \${code ?? 'unknown'}\`))`,
    '    })',
    "    child.on('error', reject)",
    '  })',
    '}',
    '',
    'await main()',
    '',
  ].join('\n')
}

export async function syncSkillsRootScripts(targetRoot: string, packageManager: PackageManager) {
  const context = getPackageManagerContext(packageManager)
  const scriptsRoot = path.join(targetRoot, 'scripts')
  const rootPackageJsonPath = path.join(targetRoot, 'package.json')
  const rootPackageJson = JSON.parse(await readFile(rootPackageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>
  }

  await mkdir(scriptsRoot, { recursive: true })
  await writeFile(path.join(scriptsRoot, 'mirror-skills.mjs'), renderMirrorScriptSource(), 'utf8')
  await writeFile(
    path.join(scriptsRoot, 'check-skills.mjs'),
    renderCheckScriptSource(context.runScript('skills:mirror')),
    'utf8',
  )
  await writeFile(
    path.join(scriptsRoot, 'sync-skills.mjs'),
    renderRemoteManagerScriptSource('sync'),
    'utf8',
  )
  await writeFile(
    path.join(scriptsRoot, 'diff-skills.mjs'),
    renderRemoteManagerScriptSource('diff'),
    'utf8',
  )
  await writeFile(
    path.join(scriptsRoot, 'upgrade-skills.mjs'),
    renderRemoteManagerScriptSource('upgrade'),
    'utf8',
  )

  rootPackageJson.scripts = {
    ...rootPackageJson.scripts,
    'skills:mirror': 'node ./scripts/mirror-skills.mjs',
    'skills:sync': 'node ./scripts/sync-skills.mjs',
    'skills:check': 'node ./scripts/check-skills.mjs',
    'skills:diff': 'node ./scripts/diff-skills.mjs',
    'skills:upgrade': 'node ./scripts/upgrade-skills.mjs',
  }

  await writeFile(rootPackageJsonPath, `${JSON.stringify(rootPackageJson, null, 2)}\n`, 'utf8')
}
