import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { patchRootPackageJsonSource } from '../patching/package-json.js'
import { getPackageManagerAdapter } from '../package-manager.js'
import type { PackageManager } from '../package-manager.js'
import type { ServerProvider } from '../providers/index.js'
import type { TemplateTokens } from './index.js'

export const APP_ROUTER_WORKSPACE_PATH = 'packages/app-router' as const
export const APP_ROUTER_PACKAGE_NAME = '@workspace/app-router'
export const APP_ROUTER_WORKSPACE_DEPENDENCY = 'workspace:*'
export const CONTRACTS_WORKSPACE_PATH = 'packages/contracts' as const
export const CONTRACTS_PACKAGE_NAME = '@workspace/contracts'
export const CONTRACTS_WORKSPACE_DEPENDENCY = 'workspace:*'
export const TRPC_CLIENT_VERSION = '^11.13.4'
export const TRPC_SERVER_VERSION = '^11.13.4'
export const ZOD_VERSION = '^4.3.6'
const NX_PROJECT_SCHEMA_URL =
  'https://raw.githubusercontent.com/nrwl/nx/master/packages/nx/schemas/project-schema.json'

type SupportedTrpcProvider = Extract<ServerProvider, 'supabase' | 'cloudflare'>

type ApplyTrpcWorkspaceTemplateOptions = {
  serverProvider: SupportedTrpcProvider
}

async function writeJsonFile(targetPath: string, value: unknown) {
  await mkdir(path.dirname(targetPath), { recursive: true })
  await writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function writeTextFile(targetPath: string, contents: string) {
  await mkdir(path.dirname(targetPath), { recursive: true })
  await writeFile(targetPath, contents, 'utf8')
}

function renderSharedWorkspaceTsconfig() {
  return {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      skipLibCheck: true,
      allowImportingTsExtensions: true,
      rewriteRelativeImportExtensions: true,
      declaration: true,
      outDir: 'dist',
      rootDir: 'src',
      composite: true,
      noEmitOnError: true,
    },
    include: ['src/**/*.ts'],
  }
}

function renderContractsPackageJson(packageManager: PackageManager) {
  const adapter = getPackageManagerAdapter(packageManager)

  return {
    name: CONTRACTS_PACKAGE_NAME,
    private: true,
    version: '0.1.0',
    type: 'module',
    sideEffects: false,
    packageManager: adapter.packageManagerField,
    exports: {
      '.': {
        types: './src/index.ts',
        default: './src/index.ts',
      },
    },
    types: './src/index.ts',
    scripts: {
      build: 'tsc -p tsconfig.json',
      typecheck: 'tsc -p tsconfig.json --noEmit',
      test: `node -e "console.log('contracts workspace test placeholder')"`,
    },
    dependencies: {
      zod: ZOD_VERSION,
    },
  }
}

function renderAppRouterPackageJson(packageManager: PackageManager) {
  const adapter = getPackageManagerAdapter(packageManager)

  return {
    name: APP_ROUTER_PACKAGE_NAME,
    private: true,
    version: '0.1.0',
    type: 'module',
    sideEffects: false,
    packageManager: adapter.packageManagerField,
    exports: {
      '.': {
        types: './src/index.ts',
        default: './src/index.ts',
      },
    },
    types: './src/index.ts',
    scripts: {
      build: 'tsc -p tsconfig.json',
      typecheck: 'tsc -p tsconfig.json --noEmit',
      test: `node -e "console.log('app-router workspace test placeholder')"`,
    },
    dependencies: {
      '@trpc/server': TRPC_SERVER_VERSION,
      [CONTRACTS_PACKAGE_NAME]: CONTRACTS_WORKSPACE_DEPENDENCY,
    },
  }
}

function renderSharedWorkspaceProjectJson(
  packageManager: PackageManager,
  options: {
    name: 'contracts' | 'app-router'
    sourceRoot: string
    workspacePath: typeof CONTRACTS_WORKSPACE_PATH | typeof APP_ROUTER_WORKSPACE_PATH
  },
) {
  const adapter = getPackageManagerAdapter(packageManager)

  return {
    name: options.name,
    $schema: NX_PROJECT_SCHEMA_URL,
    sourceRoot: options.sourceRoot,
    targets: {
      build: {
        command: adapter.runScriptInDirectoryCommand(options.workspacePath, 'build'),
      },
      typecheck: {
        command: adapter.runScriptInDirectoryCommand(options.workspacePath, 'typecheck'),
      },
      test: {
        command: adapter.runScriptInDirectoryCommand(options.workspacePath, 'test'),
      },
    },
  }
}

function renderContractsReadme() {
  return [
    '# packages/contracts',
    '',
    '이 워크스페이스는 client-server boundary contract의 source of truth예요.',
    '',
    '- Zod schema는 여기서만 정의해요.',
    '- boundary type은 `z.infer`로만 파생해요.',
    '- 같은 DTO를 `interface`나 별도 수동 type alias로 중복 선언하지 않아요.',
    '',
    '## 구조',
    '',
    '```text',
    'packages/contracts/',
    '  src/example.ts',
    '  src/index.ts',
    '```',
    '',
    '## 운영 메모',
    '',
    '- 경계 타입이 바뀌면 먼저 여기 schema를 수정해요.',
    '- client와 server는 같은 schema를 runtime과 type 양쪽에서 공유해요.',
    '- 루트 `verify`에는 boundary type checker가 같이 들어 있어서, 같은 경계 타입을 다른 workspace에서 다시 선언하면 바로 막아요.',
    '',
  ].join('\n')
}

function renderAppRouterReadme(options: ApplyTrpcWorkspaceTemplateOptions) {
  return [
    '# packages/app-router',
    '',
    '이 워크스페이스는 tRPC router와 `AppRouter` 타입의 source of truth예요.',
    '',
    '- `packages/contracts`의 schema를 써서 procedure input/output을 맞춰요.',
    '- `frontend`와 `backoffice`는 server를 직접 참조하지 않고 여기서 `AppRouter` 타입만 가져와요.',
    ...(options.serverProvider === 'supabase'
      ? [
          '- 지금 선택한 provider는 `supabase`라서, function-local `deno.json`의 `imports`가 이 워크스페이스와 `packages/contracts`를 직접 가리켜요.',
        ]
      : [
          '- 지금 선택한 provider는 `cloudflare`라서, Worker runtime이 이 워크스페이스를 직접 import해요.',
        ]),
    '',
    '## 구조',
    '',
    '```text',
    'packages/app-router/',
    '  src/context.ts',
    '  src/init.ts',
    '  src/routers/example.ts',
    '  src/root.ts',
    '  src/index.ts',
    '```',
    '',
    '## 운영 메모',
    '',
    '- route shape를 바꾸고 싶으면 먼저 `packages/contracts`와 `packages/app-router`를 확인해요.',
    '- 루트 `verify`는 `packages/contracts`의 boundary type 이름을 기준으로 중복 선언을 같이 검사해요.',
    '- provider-specific runtime adapter는 각 `server` workspace 안에 남겨요.',
    '',
  ].join('\n')
}

function renderContractsExampleSource() {
  return [
    "import { z } from 'zod'",
    '',
    'export const ExamplePingOutputSchema = z.object({',
    '  ok: z.literal(true),',
    "  message: z.literal('pong'),",
    '})',
    '',
    'export const ExampleEchoInputSchema = z.object({',
    '  message: z.string().min(1),',
    '})',
    '',
    'export const ExampleEchoOutputSchema = z.object({',
    '  message: z.string().min(1),',
    '  requestId: z.string().nullable(),',
    '})',
    '',
    'export type ExamplePingOutput = z.infer<typeof ExamplePingOutputSchema>',
    'export type ExampleEchoInput = z.infer<typeof ExampleEchoInputSchema>',
    'export type ExampleEchoOutput = z.infer<typeof ExampleEchoOutputSchema>',
    '',
  ].join('\n')
}

function renderContractsIndexSource() {
  return [
    "export { ExampleEchoInputSchema, ExampleEchoOutputSchema, ExamplePingOutputSchema } from './example.ts'",
    "export type { ExampleEchoInput, ExampleEchoOutput, ExamplePingOutput } from './example.ts'",
    '',
  ].join('\n')
}

function renderAppRouterContextSource() {
  return ['export type AppTrpcContext = {', '  requestId: string | null', '}', ''].join('\n')
}

function renderAppRouterInitSource() {
  return [
    "import { initTRPC } from '@trpc/server'",
    "import type { AppTrpcContext } from './context.ts'",
    '',
    'const t = initTRPC.context<AppTrpcContext>().create()',
    '',
    'export const createTRPCRouter = t.router',
    'export const publicProcedure = t.procedure',
    '',
  ].join('\n')
}

function renderAppRouterExampleRouterSource() {
  return [
    "import { ExampleEchoInputSchema, ExampleEchoOutputSchema, ExamplePingOutputSchema } from '@workspace/contracts'",
    "import { createTRPCRouter, publicProcedure } from '../init.ts'",
    '',
    'export const exampleRouter = createTRPCRouter({',
    '  ping: publicProcedure.output(ExamplePingOutputSchema).query(() => ({',
    '    ok: true,',
    "    message: 'pong',",
    '  })),',
    '  echo: publicProcedure',
    '    .input(ExampleEchoInputSchema)',
    '    .output(ExampleEchoOutputSchema)',
    '    .query(({ ctx, input }) => ({',
    '      message: input.message,',
    '      requestId: ctx.requestId,',
    '    })),',
    '})',
    '',
  ].join('\n')
}

function renderAppRouterRootSource() {
  return [
    "import { createTRPCRouter } from './init.ts'",
    "import { exampleRouter } from './routers/example.ts'",
    '',
    'export const appRouter = createTRPCRouter({',
    '  example: exampleRouter,',
    '})',
    '',
    'export type AppRouter = typeof appRouter',
    '',
  ].join('\n')
}

function renderAppRouterIndexSource() {
  return [
    "export { appRouter } from './root.ts'",
    "export type { AppRouter } from './root.ts'",
    "export type { AppTrpcContext } from './context.ts'",
    '',
  ].join('\n')
}

function renderBoundaryTypesCheckScript() {
  return [
    "import { readdirSync, readFileSync, statSync } from 'node:fs'",
    "import path from 'node:path'",
    "import process from 'node:process'",
    '',
    'const rootDir = process.cwd()',
    "const contractsRoot = path.join(rootDir, 'packages', 'contracts', 'src')",
    'const scanRootCandidates = [',
    "  path.join(rootDir, 'frontend'),",
    "  path.join(rootDir, 'backoffice'),",
    "  path.join(rootDir, 'server'),",
    "  path.join(rootDir, 'packages', 'app-router'),",
    ']',
    "const allowedExtensions = new Set(['.ts', '.tsx', '.mts', '.cts'])",
    "const ignoredDirectoryNames = new Set(['node_modules', 'dist', '.nx', '.turbo', 'coverage'])",
    '',
    'function walkTypescriptFiles(targetDir, collector = []) {',
    '  let entries = []',
    '',
    '  try {',
    '    entries = readdirSync(targetDir, { withFileTypes: true })',
    '  } catch {',
    '    return collector',
    '  }',
    '',
    '  for (const entry of entries) {',
    '    if (entry.isDirectory()) {',
    '      if (ignoredDirectoryNames.has(entry.name)) {',
    '        continue',
    '      }',
    '',
    '      walkTypescriptFiles(path.join(targetDir, entry.name), collector)',
    '      continue',
    '    }',
    '',
    '    const extension = path.extname(entry.name)',
    '    if (!allowedExtensions.has(extension)) {',
    '      continue',
    '    }',
    '',
    '    collector.push(path.join(targetDir, entry.name))',
    '  }',
    '',
    '  return collector',
    '}',
    '',
    'function toRepoPath(filePath) {',
    "  return path.relative(rootDir, filePath).split(path.sep).join('/')",
    '}',
    '',
    'function readFileOrThrow(filePath) {',
    "  return readFileSync(filePath, 'utf8')",
    '}',
    '',
    'function collectContractTypes() {',
    '  const violations = []',
    '  const boundaryTypeNames = new Set()',
    '  const contractFiles = walkTypescriptFiles(contractsRoot)',
    '',
    '  for (const filePath of contractFiles) {',
    '    const source = readFileOrThrow(filePath)',
    '',
    '    for (const match of source.matchAll(/\\bexport\\s+interface\\s+([A-Za-z0-9_]+)/g)) {',
    '      violations.push({',
    '        filePath: toRepoPath(filePath),',
    '        name: match[1],',
    "        reason: 'packages/contracts에서는 export interface를 쓰지 말고 Zod schema에서 z.infer로만 boundary type을 파생해야 해요.',",
    '      })',
    '    }',
    '',
    '    for (const match of source.matchAll(/\\bexport\\s+type\\s+([A-Za-z0-9_]+)\\s*=/g)) {',
    '      const name = match[1]',
    '      const snippet = source.slice(match.index, match.index + 400)',
    '',
    '      if (!/z\\.infer\\s*</.test(snippet)) {',
    '        violations.push({',
    '          filePath: toRepoPath(filePath),',
    '          name,',
    "          reason: 'packages/contracts의 export type은 z.infer<typeof ...Schema>로만 선언해야 해요.',",
    '        })',
    '        continue',
    '      }',
    '',
    '      boundaryTypeNames.add(name)',
    '    }',
    '  }',
    '',
    '  return {',
    '    boundaryTypeNames,',
    '    violations,',
    '  }',
    '}',
    '',
    'function collectDuplicateBoundaryTypes(boundaryTypeNames) {',
    '  const violations = []',
    '  const scannedRoots = scanRootCandidates.filter((candidate) => {',
    '    try {',
    '      return statSync(candidate).isDirectory()',
    '    } catch {',
    '      return false',
    '    }',
    '  })',
    '',
    '  for (const scanRoot of scannedRoots) {',
    '    const files = walkTypescriptFiles(scanRoot)',
    '',
    '    for (const filePath of files) {',
    '      const source = readFileOrThrow(filePath)',
    '      const repoPath = toRepoPath(filePath)',
    '',
    '      for (const boundaryTypeName of boundaryTypeNames) {',
    '        const declarationPattern = new RegExp(',
    '          `\\\\b(?:export\\\\s+)?(?:declare\\\\s+)?(?:type\\\\s+${boundaryTypeName}\\\\s*=|interface\\\\s+${boundaryTypeName}\\\\b)`,',
    "          'm',",
    '        )',
    '',
    '        if (!declarationPattern.test(source)) {',
    '          continue',
    '        }',
    '',
    '        violations.push({',
    '          filePath: repoPath,',
    '          name: boundaryTypeName,',
    "          reason: '같은 boundary type을 다른 workspace에서 다시 선언하지 말고 packages/contracts의 schema와 z.infer 결과를 그대로 가져와야 해요.',",
    '        })',
    '      }',
    '    }',
    '  }',
    '',
    '  return violations',
    '}',
    '',
    'const { boundaryTypeNames, violations } = collectContractTypes()',
    'violations.push(...collectDuplicateBoundaryTypes(boundaryTypeNames))',
    '',
    'if (violations.length > 0) {',
    "  console.error('Boundary types from schema only: client-server 경계 타입은 packages/contracts의 Zod schema에서 z.infer로만 파생해야 해요.')",
    "  console.error('중복 선언이나 수동 DTO 정의를 정리하고 다시 verify를 실행해 주세요.\\n')",
    '',
    '  for (const violation of violations) {',
    '    console.error(`- ${violation.name} (${violation.filePath})`)',
    '    console.error(`  ${violation.reason}`)',
    '  }',
    '',
    '  process.exit(1)',
    '}',
    '',
    "console.log('[boundary-types] packages/contracts를 기준으로 경계 타입 중복 선언이 없는지 확인했어요.')",
    '',
  ].join('\n')
}

export async function applyTrpcWorkspaceTemplate(
  targetRoot: string,
  tokens: TemplateTokens,
  options: ApplyTrpcWorkspaceTemplateOptions,
) {
  const adapter = getPackageManagerAdapter(tokens.packageManager)
  const contractsRoot = path.join(targetRoot, CONTRACTS_WORKSPACE_PATH)
  const appRouterRoot = path.join(targetRoot, APP_ROUTER_WORKSPACE_PATH)
  const rootPackageJsonPath = path.join(targetRoot, 'package.json')

  await writeJsonFile(
    path.join(contractsRoot, 'package.json'),
    renderContractsPackageJson(tokens.packageManager),
  )
  await writeJsonFile(path.join(contractsRoot, 'tsconfig.json'), renderSharedWorkspaceTsconfig())
  await writeJsonFile(
    path.join(contractsRoot, 'project.json'),
    renderSharedWorkspaceProjectJson(tokens.packageManager, {
      name: 'contracts',
      sourceRoot: `${CONTRACTS_WORKSPACE_PATH}/src`,
      workspacePath: CONTRACTS_WORKSPACE_PATH,
    }),
  )
  await writeTextFile(path.join(contractsRoot, 'README.md'), renderContractsReadme())
  await writeTextFile(path.join(contractsRoot, 'src', 'example.ts'), renderContractsExampleSource())
  await writeTextFile(path.join(contractsRoot, 'src', 'index.ts'), renderContractsIndexSource())

  await writeJsonFile(
    path.join(appRouterRoot, 'package.json'),
    renderAppRouterPackageJson(tokens.packageManager),
  )
  await writeJsonFile(path.join(appRouterRoot, 'tsconfig.json'), renderSharedWorkspaceTsconfig())
  await writeJsonFile(
    path.join(appRouterRoot, 'project.json'),
    renderSharedWorkspaceProjectJson(tokens.packageManager, {
      name: 'app-router',
      sourceRoot: `${APP_ROUTER_WORKSPACE_PATH}/src`,
      workspacePath: APP_ROUTER_WORKSPACE_PATH,
    }),
  )
  await writeTextFile(path.join(appRouterRoot, 'README.md'), renderAppRouterReadme(options))
  await writeTextFile(path.join(appRouterRoot, 'src', 'context.ts'), renderAppRouterContextSource())
  await writeTextFile(path.join(appRouterRoot, 'src', 'init.ts'), renderAppRouterInitSource())
  await writeTextFile(
    path.join(appRouterRoot, 'src', 'routers', 'example.ts'),
    renderAppRouterExampleRouterSource(),
  )
  await writeTextFile(path.join(appRouterRoot, 'src', 'root.ts'), renderAppRouterRootSource())
  await writeTextFile(path.join(appRouterRoot, 'src', 'index.ts'), renderAppRouterIndexSource())
  await writeTextFile(
    path.join(targetRoot, 'scripts', 'verify-boundary-types.mjs'),
    renderBoundaryTypesCheckScript(),
  )

  const rootPackageJsonSource = await readFile(rootPackageJsonPath, 'utf8')
  const rootPackageJson = JSON.parse(rootPackageJsonSource) as {
    scripts?: Record<string, string>
    workspaces?: string[]
  }
  const rootVerifyScript = adapter.rootVerifyScript()
  const nextRootPackageJsonSource = patchRootPackageJsonSource(rootPackageJsonSource, {
    packageManagerField: adapter.packageManagerField,
    scripts: {
      ...(rootPackageJson.scripts ?? {}),
      'boundary-types:check': 'node ./scripts/verify-boundary-types.mjs',
      verify: `${rootVerifyScript} && ${adapter.runScript('boundary-types:check')}`,
    },
    workspaces:
      adapter.workspaceManifestFile === null ? (rootPackageJson.workspaces ?? null) : null,
  })

  await writeFile(rootPackageJsonPath, nextRootPackageJsonSource, 'utf8')
}
