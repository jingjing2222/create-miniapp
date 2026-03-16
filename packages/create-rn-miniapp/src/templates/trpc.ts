import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
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

export async function applyTrpcWorkspaceTemplate(
  targetRoot: string,
  tokens: TemplateTokens,
  options: ApplyTrpcWorkspaceTemplateOptions,
) {
  const contractsRoot = path.join(targetRoot, CONTRACTS_WORKSPACE_PATH)
  const appRouterRoot = path.join(targetRoot, APP_ROUTER_WORKSPACE_PATH)

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
}
