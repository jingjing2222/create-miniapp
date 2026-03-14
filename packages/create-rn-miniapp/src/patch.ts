import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  patchPackageJsonSource,
  patchBackofficeAppSource,
  patchBackofficeMainSource,
  patchGraniteConfigSource,
  patchTsconfigModuleSource,
  patchWranglerConfigSource,
} from './ast.js'
import { getPackageManagerAdapter, type PackageManager } from './package-manager.js'
import type { ServerProvider } from './server-provider.js'
import {
  type TemplateTokens,
  applyServerPackageTemplate,
  applyWorkspaceProjectTemplate,
  getFirebaseWebSdkVersion,
  pathExists,
  removePathIfExists,
  SUPABASE_DEFAULT_FUNCTION_NAME,
} from './templates.js'

const STATIC_TOOLING_FILES = [
  'biome.json',
  '.biome.json',
  'eslint.config.js',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.json',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
] as const

const CLOUDFLARE_SERVER_LOCAL_FILES = [
  '.gitignore',
  '.prettierrc',
  '.editorconfig',
  '.vscode',
  'AGENTS.md',
] as const

const TOOLING_DEPENDENCIES = [
  '@biomejs/biome',
  '@eslint/js',
  'eslint',
  'eslint-config-prettier',
  'eslint-plugin-react',
  'eslint-plugin-react-hooks',
  'eslint-plugin-react-refresh',
  'typescript-eslint',
  'prettier',
] as const

const SUPABASE_JS_VERSION = '^2.57.4'
const FIREBASE_JS_VERSION = getFirebaseWebSdkVersion()
const DOTENV_VERSION = '^16.4.7'
const NODE_TYPES_VERSION = '^24.10.1'
const FALLBACK_GRANITE_PLUGIN_VERSION = '1.0.7'
const WRANGLER_PACKAGE_NAME = 'wrangler'
const CLOUDFLARE_ROOT_GITIGNORE_ENTRY = 'server/worker-configuration.d.ts'
const CLOUDFLARE_ROOT_BIOME_IGNORE_ENTRY = '**/server/worker-configuration.d.ts'
const FIREBASE_ROOT_GITIGNORE_ENTRY = 'server/functions/lib/'
const FIREBASE_ROOT_BIOME_IGNORE_ENTRY = '**/server/functions/lib/**'
const FIREBASE_YARN_PACKAGE_EXTENSION_KEY = '"@apphosting/build@*"'
const FIREBASE_YARN_PACKAGE_EXTENSION_BLOCK = [
  '  "@apphosting/build@*":',
  '    dependencies:',
  '      yaml: "^2.4.1"',
].join('\n')

const FRONTEND_ENV_TYPES = [
  'interface ImportMetaEnv {',
  '  readonly MINIAPP_SUPABASE_URL: string',
  '  readonly MINIAPP_SUPABASE_PUBLISHABLE_KEY: string',
  '}',
  '',
  'interface ImportMeta {',
  '  readonly env: ImportMetaEnv',
  '}',
  '',
].join('\n')

const FRONTEND_CLOUDFLARE_ENV_TYPES = [
  'interface ImportMetaEnv {',
  '  readonly MINIAPP_API_BASE_URL: string',
  '}',
  '',
  'interface ImportMeta {',
  '  readonly env: ImportMetaEnv',
  '}',
  '',
].join('\n')

const FRONTEND_FIREBASE_ENV_TYPES = [
  'interface ImportMetaEnv {',
  '  readonly MINIAPP_FIREBASE_API_KEY: string',
  '  readonly MINIAPP_FIREBASE_AUTH_DOMAIN: string',
  '  readonly MINIAPP_FIREBASE_PROJECT_ID: string',
  '  readonly MINIAPP_FIREBASE_STORAGE_BUCKET: string',
  '  readonly MINIAPP_FIREBASE_MESSAGING_SENDER_ID: string',
  '  readonly MINIAPP_FIREBASE_APP_ID: string',
  '  readonly MINIAPP_FIREBASE_MEASUREMENT_ID: string',
  '}',
  '',
  'interface ImportMeta {',
  '  readonly env: ImportMetaEnv',
  '}',
  '',
].join('\n')

const BACKOFFICE_ENV_TYPES = [
  '/// <reference types="vite/client" />',
  '',
  'interface ImportMetaEnv {',
  '  readonly VITE_SUPABASE_URL: string',
  '  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string',
  '}',
  '',
  'interface ImportMeta {',
  '  readonly env: ImportMetaEnv',
  '}',
  '',
].join('\n')

const BACKOFFICE_CLOUDFLARE_ENV_TYPES = [
  '/// <reference types="vite/client" />',
  '',
  'interface ImportMetaEnv {',
  '  readonly VITE_API_BASE_URL: string',
  '}',
  '',
  'interface ImportMeta {',
  '  readonly env: ImportMetaEnv',
  '}',
  '',
].join('\n')

const BACKOFFICE_FIREBASE_ENV_TYPES = [
  '/// <reference types="vite/client" />',
  '',
  'interface ImportMetaEnv {',
  '  readonly VITE_FIREBASE_API_KEY: string',
  '  readonly VITE_FIREBASE_AUTH_DOMAIN: string',
  '  readonly VITE_FIREBASE_PROJECT_ID: string',
  '  readonly VITE_FIREBASE_STORAGE_BUCKET: string',
  '  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string',
  '  readonly VITE_FIREBASE_APP_ID: string',
  '  readonly VITE_FIREBASE_MEASUREMENT_ID: string',
  '}',
  '',
  'interface ImportMeta {',
  '  readonly env: ImportMetaEnv',
  '}',
  '',
].join('\n')

const FRONTEND_SUPABASE_CLIENT = [
  "import { createClient, type SupabaseClient } from '@supabase/supabase-js'",
  '',
  'function isSafeHttpUrl(value: string) {',
  '  try {',
  '    const parsed = new URL(value)',
  "    return parsed.protocol === 'http:' || parsed.protocol === 'https:'",
  '  } catch {',
  '    return false',
  '  }',
  '}',
  '',
  'function resolveSupabaseUrl() {',
  "  const configured = import.meta.env.MINIAPP_SUPABASE_URL?.trim() ?? ''",
  '',
  '  if (!isSafeHttpUrl(configured)) {',
  '    throw new Error(',
  "      `[frontend] MINIAPP_SUPABASE_URL must be a valid http(s) URL. Received: ${configured || '<empty>'}`",
  '    )',
  '  }',
  '',
  '  return configured',
  '}',
  '',
  'function resolveSupabasePublishableKey() {',
  "  const configured = import.meta.env.MINIAPP_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''",
  '',
  '  if (!configured) {',
  "    throw new Error('[frontend] MINIAPP_SUPABASE_PUBLISHABLE_KEY is required.')",
  '  }',
  '',
  '  return configured',
  '}',
  '',
  'export const supabase: SupabaseClient = createClient(',
  '  resolveSupabaseUrl(),',
  '  resolveSupabasePublishableKey(),',
  '  {',
  '    auth: {',
  '      persistSession: false,',
  '      detectSessionInUrl: false,',
  '    },',
  '  },',
  ')',
  '',
].join('\n')

const FRONTEND_CLOUDFLARE_API_CLIENT = [
  'function isSafeHttpUrl(value: string) {',
  '  try {',
  '    const parsed = new URL(value)',
  "    return parsed.protocol === 'http:' || parsed.protocol === 'https:'",
  '  } catch {',
  '    return false',
  '  }',
  '}',
  '',
  'function resolveApiBaseUrl() {',
  "  const configured = import.meta.env.MINIAPP_API_BASE_URL?.trim() ?? ''",
  '',
  '  if (!isSafeHttpUrl(configured)) {',
  '    throw new Error(',
  "      `[frontend] MINIAPP_API_BASE_URL must be a valid http(s) URL. Received: ${configured || '<empty>'}`",
  '    )',
  '  }',
  '',
  "  return configured.replace(/\\/$/, '')",
  '}',
  '',
  'export const apiBaseUrl = resolveApiBaseUrl()',
  '',
  'export function resolveApiUrl(pathname: string) {',
  "  const normalizedPath = pathname.replace(/^\\//, '')",
  '  return new URL(normalizedPath, `${apiBaseUrl}/`).toString()',
  '}',
  '',
  'export async function apiFetch(pathname: string, init?: RequestInit) {',
  '  return fetch(resolveApiUrl(pathname), init)',
  '}',
  '',
].join('\n')

const FRONTEND_FIREBASE_APP = [
  "import { getApp, getApps, initializeApp } from 'firebase/app'",
  '',
  'const measurementId = import.meta.env.MINIAPP_FIREBASE_MEASUREMENT_ID?.trim()',
  '',
  'const firebaseConfig = {',
  '  apiKey: import.meta.env.MINIAPP_FIREBASE_API_KEY,',
  '  authDomain: import.meta.env.MINIAPP_FIREBASE_AUTH_DOMAIN,',
  '  projectId: import.meta.env.MINIAPP_FIREBASE_PROJECT_ID,',
  '  storageBucket: import.meta.env.MINIAPP_FIREBASE_STORAGE_BUCKET,',
  '  messagingSenderId: import.meta.env.MINIAPP_FIREBASE_MESSAGING_SENDER_ID,',
  '  appId: import.meta.env.MINIAPP_FIREBASE_APP_ID,',
  '  ...(measurementId ? { measurementId } : {}),',
  '}',
  '',
  'export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)',
  '',
].join('\n')

const FRONTEND_FIREBASE_FIRESTORE = [
  "import { getFirestore } from 'firebase/firestore'",
  "import { firebaseApp } from './firebase'",
  '',
  'export const firestore = getFirestore(firebaseApp)',
  '',
].join('\n')

const FRONTEND_FIREBASE_STORAGE = [
  "import { getStorage } from 'firebase/storage'",
  "import { firebaseApp } from './firebase'",
  '',
  'export const storage = getStorage(firebaseApp)',
  '',
].join('\n')

const BACKOFFICE_SUPABASE_CLIENT = [
  "import { createClient, type SupabaseClient } from '@supabase/supabase-js'",
  '',
  'function resolveSupabaseUrl() {',
  "  const value = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''",
  '',
  '  if (!value) {',
  "    throw new Error('[backoffice] VITE_SUPABASE_URL is required.')",
  '  }',
  '',
  '  return value',
  '}',
  '',
  'function resolveSupabasePublishableKey() {',
  "  const value = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''",
  '',
  '  if (!value) {',
  "    throw new Error('[backoffice] VITE_SUPABASE_PUBLISHABLE_KEY is required.')",
  '  }',
  '',
  '  return value',
  '}',
  '',
  'function isSafeHttpUrl(value: string) {',
  '  try {',
  '    const parsed = new URL(value)',
  "    return parsed.protocol === 'http:' || parsed.protocol === 'https:'",
  '  } catch {',
  '    return false',
  '  }',
  '}',
  '',
  'const supabaseUrl = resolveSupabaseUrl()',
  'if (!isSafeHttpUrl(supabaseUrl)) {',
  '  throw new Error(',
  '    `[backoffice] VITE_SUPABASE_URL must be a valid http(s) URL. Received: ${supabaseUrl}`',
  '  )',
  '}',
  '',
  'export const supabase: SupabaseClient = createClient(',
  '  supabaseUrl,',
  '  resolveSupabasePublishableKey(),',
  '  {',
  '    auth: {',
  '      persistSession: true,',
  '      autoRefreshToken: true,',
  '      detectSessionInUrl: false,',
  '    },',
  '  },',
  ')',
  '',
].join('\n')

const BACKOFFICE_CLOUDFLARE_API_CLIENT = [
  'function isSafeHttpUrl(value: string) {',
  '  try {',
  '    const parsed = new URL(value)',
  "    return parsed.protocol === 'http:' || parsed.protocol === 'https:'",
  '  } catch {',
  '    return false',
  '  }',
  '}',
  '',
  'function resolveApiBaseUrl() {',
  "  const configured = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''",
  '',
  '  if (!isSafeHttpUrl(configured)) {',
  '    throw new Error(',
  "      `[backoffice] VITE_API_BASE_URL must be a valid http(s) URL. Received: ${configured || '<empty>'}`",
  '    )',
  '  }',
  '',
  "  return configured.replace(/\\/$/, '')",
  '}',
  '',
  'export const apiBaseUrl = resolveApiBaseUrl()',
  '',
  'export function resolveApiUrl(pathname: string) {',
  "  const normalizedPath = pathname.replace(/^\\//, '')",
  '  return new URL(normalizedPath, `${apiBaseUrl}/`).toString()',
  '}',
  '',
  'export async function apiFetch(pathname: string, init?: RequestInit) {',
  '  return fetch(resolveApiUrl(pathname), init)',
  '}',
  '',
].join('\n')

const BACKOFFICE_FIREBASE_APP = [
  "import { getApp, getApps, initializeApp } from 'firebase/app'",
  '',
  'const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim()',
  '',
  'const firebaseConfig = {',
  '  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,',
  '  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,',
  '  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,',
  '  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,',
  '  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,',
  '  appId: import.meta.env.VITE_FIREBASE_APP_ID,',
  '  ...(measurementId ? { measurementId } : {}),',
  '}',
  '',
  'export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)',
  '',
].join('\n')

const BACKOFFICE_FIREBASE_FIRESTORE = [
  "import { getFirestore } from 'firebase/firestore'",
  "import { firebaseApp } from './firebase'",
  '',
  'export const firestore = getFirestore(firebaseApp)',
  '',
].join('\n')

const BACKOFFICE_FIREBASE_STORAGE = [
  "import { getStorage } from 'firebase/storage'",
  "import { firebaseApp } from './firebase'",
  '',
  'export const storage = getStorage(firebaseApp)',
  '',
].join('\n')

type PackageJson = {
  name?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

type WorkspacePatchOptions = {
  packageManager: PackageManager
  serverProvider: ServerProvider | null
}

async function readPackageJson(packageJsonPath: string) {
  return JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageJson
}

async function writeTextFile(filePath: string, contents: string) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, contents, 'utf8')
}

function renderSupabaseServerReadme(tokens: TemplateTokens) {
  return [
    '# server',
    '',
    '이 워크스페이스는 Supabase 프로젝트 연결, SQL migration, Edge Functions 배포를 관리하는 server 워크스페이스예요.',
    '',
    '## 디렉토리 구조',
    '',
    '```text',
    'server/',
    '  supabase/config.toml',
    '  supabase/migrations/',
    `  supabase/functions/${SUPABASE_DEFAULT_FUNCTION_NAME}/index.ts`,
    '  scripts/supabase-db-apply.mjs',
    '  scripts/supabase-functions-deploy.mjs',
    '  .env.local',
    '  package.json',
    '```',
    '',
    '## 주요 스크립트',
    '',
    `- \`${tokens.packageManagerCommand} run dev\`: 로컬 Supabase stack을 시작해요.`,
    `- \`${tokens.packageManagerCommand} run db:apply\`: \`server/.env.local\`의 \`SUPABASE_DB_PASSWORD\`를 사용해 linked remote project에 migration을 적용해요.`,
    `- \`${tokens.packageManagerCommand} run functions:serve\`: \`server/.env.local\`을 주입해 Edge Functions를 로컬에서 serve해요.`,
    `- \`${tokens.packageManagerCommand} run functions:deploy\`: \`server/.env.local\`의 \`SUPABASE_PROJECT_REF\`를 사용해 Edge Functions를 원격 Supabase project에 배포해요.`,
    `- \`${tokens.packageManagerCommand} run db:apply:local\`: 로컬 Supabase DB에 migration을 적용해요.`,
    `- \`${tokens.packageManagerCommand} run db:reset\`: 로컬 Supabase DB를 리셋해요.`,
    `- \`${tokens.packageManagerCommand} run test\`: placeholder 테스트를 실행해요.`,
    '',
    '## Miniapp / Backoffice 연결',
    '',
    '- miniapp frontend는 `frontend/src/lib/supabase.ts`에서 Supabase client를 생성해요.',
    '- miniapp frontend `.env.local`은 `frontend/.env.local`에 두고 `MINIAPP_SUPABASE_URL`, `MINIAPP_SUPABASE_PUBLISHABLE_KEY`를 사용해요.',
    '- frontend `granite.config.ts`는 `.env.local` 값을 읽어 `MINIAPP_SUPABASE_URL`, `MINIAPP_SUPABASE_PUBLISHABLE_KEY`를 주입해요.',
    `- miniapp frontend는 \`supabase.functions.invoke('${SUPABASE_DEFAULT_FUNCTION_NAME}')\` 형태로 Edge Function을 호출할 수 있어요.`,
    '- backoffice가 있으면 `backoffice/src/lib/supabase.ts`에서 별도 browser client를 생성해요.',
    '- backoffice `.env.local`은 `backoffice/.env.local`에 두고 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 사용해요.',
    '- backoffice도 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 사용해요.',
    `- backoffice도 동일하게 \`supabase.functions.invoke('${SUPABASE_DEFAULT_FUNCTION_NAME}')\`를 사용할 수 있어요.`,
    '',
    '## 운영 메모',
    '',
    '- 원격 SQL push를 계속하려면 `server/.env.local`의 `SUPABASE_DB_PASSWORD`를 채워주세요.',
    '- 다른 Edge Function을 추가하려면 `supabase functions new <name> --workdir .`로 생성한 뒤 `functions:deploy`를 다시 실행하면 돼요.',
    '- frontend/backoffice의 `.env.local`은 server provisioning 결과와 같은 Supabase project를 가리키게 맞춰두는 걸 권장해요.',
    '',
  ].join('\n')
}

function renderCloudflareServerReadme(tokens: TemplateTokens) {
  return [
    '# server',
    '',
    '이 워크스페이스는 Cloudflare Worker를 배포하는 server 워크스페이스예요.',
    '',
    '## 디렉토리 구조',
    '',
    '```text',
    'server/',
    '  src/index.ts',
    '  wrangler.jsonc',
    '  worker-configuration.d.ts',
    '  .env.local',
    '  package.json',
    '```',
    '',
    '## 주요 스크립트',
    '',
    `- \`${tokens.packageManagerCommand} run dev\`: 로컬 Worker 개발 서버를 실행해요.`,
    `- \`${tokens.packageManagerCommand} run build\`: \`wrangler deploy --dry-run\`으로 번들을 검증해요.`,
    `- \`${tokens.packageManagerCommand} run typecheck\`: \`wrangler types\`와 TypeScript 검사를 함께 실행해요.`,
    `- \`${tokens.packageManagerCommand} run deploy\`: \`wrangler.jsonc\` 기준으로 원격 Worker를 배포해요.`,
    `- \`${tokens.packageManagerCommand} run test\`: placeholder 테스트를 실행해요.`,
    '',
    '## Miniapp / Backoffice 연결',
    '',
    '- miniapp frontend는 `frontend/src/lib/api.ts`에서 API helper를 만들고 `MINIAPP_API_BASE_URL`을 사용해요.',
    '- miniapp frontend `.env.local`은 `frontend/.env.local`에 두고 `MINIAPP_API_BASE_URL`을 사용해요.',
    '- backoffice가 있으면 `backoffice/src/lib/api.ts`에서 `VITE_API_BASE_URL` 기반 helper를 사용해요.',
    '- backoffice `.env.local`은 `backoffice/.env.local`에 두고 `VITE_API_BASE_URL`을 사용해요.',
    '- provisioning이 성공하면 frontend/backoffice `.env.local`에 Worker URL이 자동으로 기록돼요.',
    '',
    '## 운영 메모',
    '',
    '- `worker-configuration.d.ts`는 `wrangler types`가 생성하는 파일이에요.',
    '- `server/.env.local`은 Cloudflare account/worker 메타데이터를 기록해요.',
    '- 후속 자동화가 필요하면 `server/.env.local`의 `CLOUDFLARE_API_TOKEN`을 직접 채워주세요.',
    '',
  ].join('\n')
}

function renderFirebaseServerReadme(tokens: TemplateTokens) {
  return [
    '# server',
    '',
    '이 워크스페이스는 Firebase Functions 배포와 Firebase 프로젝트 연결을 관리하는 server 워크스페이스예요.',
    '',
    '## 디렉토리 구조',
    '',
    '```text',
    'server/',
    '  firebase.json',
    '  .firebaserc',
    '  .env.local',
    '  functions/',
    '    src/index.ts',
    '    package.json',
    '    tsconfig.json',
    '  package.json',
    '```',
    '',
    '## 주요 스크립트',
    '',
    `- \`${tokens.packageManagerCommand} run build\`: \`server/functions\`의 TypeScript를 빌드해요.`,
    `- \`${tokens.packageManagerCommand} run typecheck\`: \`server/functions\` 타입 검사를 실행해요.`,
    `- \`${tokens.packageManagerCommand} run deploy\`: Firebase Functions를 현재 project로 배포해요.`,
    `- \`${tokens.packageManagerCommand} run logs\`: Firebase Functions 로그를 확인해요.`,
    '',
    '## Miniapp / Backoffice 연결',
    '',
    '- miniapp frontend는 `frontend/src/lib/firebase.ts`, `frontend/src/lib/firestore.ts`, `frontend/src/lib/storage.ts`에서 Firebase Web SDK를 초기화해요.',
    '- miniapp frontend `.env.local`은 `frontend/.env.local`에 두고 `MINIAPP_FIREBASE_API_KEY`, `MINIAPP_FIREBASE_AUTH_DOMAIN`, `MINIAPP_FIREBASE_PROJECT_ID`, `MINIAPP_FIREBASE_STORAGE_BUCKET`, `MINIAPP_FIREBASE_MESSAGING_SENDER_ID`, `MINIAPP_FIREBASE_APP_ID`, `MINIAPP_FIREBASE_MEASUREMENT_ID`를 사용해요.',
    '- frontend `granite.config.ts`는 `.env.local` 값을 읽어 같은 `MINIAPP_FIREBASE_*` 값을 주입해요.',
    '- backoffice가 있으면 `backoffice/src/lib/firebase.ts`, `backoffice/src/lib/firestore.ts`, `backoffice/src/lib/storage.ts`가 같은 Firebase project를 사용해요.',
    '- backoffice `.env.local`은 `backoffice/.env.local`에 두고 `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`를 사용해요.',
    '',
    '## 운영 메모',
    '',
    '- `server/.env.local`의 `FIREBASE_PROJECT_ID`, `FIREBASE_FUNCTION_REGION`은 배포 기준 메타데이터예요.',
    '- `server/.env.local`의 `GOOGLE_APPLICATION_CREDENTIALS`는 CI나 비대화형 배포가 필요할 때만 채우면 돼요.',
    '- `server/functions/src/index.ts`의 기본 HTTP 함수 이름은 `api`예요.',
    '',
  ].join('\n')
}

async function patchTsconfigModuleFile(
  filePath: string,
  options?: {
    includeNodeTypes?: boolean
  },
) {
  if (!(await pathExists(filePath))) {
    return
  }

  const source = await readFile(filePath, 'utf8')
  const next = patchTsconfigModuleSource(source, options)
  await writeFile(filePath, next, 'utf8')
}

function stripToolingFromPackageJson(packageJson: PackageJson) {
  for (const scriptName of ['lint', 'lint:fix', 'format', 'format:check']) {
    delete packageJson.scripts?.[scriptName]
  }

  for (const dependencyName of TOOLING_DEPENDENCIES) {
    delete packageJson.dependencies?.[dependencyName]
    delete packageJson.devDependencies?.[dependencyName]
  }

  return packageJson
}

async function patchPackageJsonFile(
  packageJsonPath: string,
  patch: Parameters<typeof patchPackageJsonSource>[1],
) {
  const source = await readFile(packageJsonPath, 'utf8')
  const next = patchPackageJsonSource(source, patch)
  await writeFile(packageJsonPath, next, 'utf8')
}

function resolveGranitePluginVersion(packageJson: PackageJson) {
  return (
    packageJson.devDependencies?.['@granite-js/plugin-hermes'] ??
    packageJson.devDependencies?.['@granite-js/plugin-router'] ??
    packageJson.dependencies?.['@granite-js/react-native'] ??
    FALLBACK_GRANITE_PLUGIN_VERSION
  )
}

function normalizePackageVersionSpec(versionSpec: string | undefined) {
  const match = versionSpec?.match(/\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?/)
  return match?.[0] ?? null
}

function resolveWranglerSchemaUrl(packageJson: PackageJson) {
  const version =
    normalizePackageVersionSpec(packageJson.devDependencies?.[WRANGLER_PACKAGE_NAME]) ?? 'latest'
  return `https://unpkg.com/${WRANGLER_PACKAGE_NAME}@${version}/config-schema.json`
}

async function ensureRootGitignoreEntry(targetRoot: string, entry: string) {
  const gitignorePath = path.join(targetRoot, '.gitignore')

  if (!(await pathExists(gitignorePath))) {
    return
  }

  const source = await readFile(gitignorePath, 'utf8')
  const lines = source.split(/\r?\n/)

  if (lines.includes(entry)) {
    return
  }

  const nextLines = [...lines]

  while (nextLines.length > 0 && nextLines.at(-1) === '') {
    nextLines.pop()
  }

  nextLines.push(entry, '')
  await writeFile(gitignorePath, nextLines.join('\n'), 'utf8')
}

async function ensureRootBiomeIgnoreEntry(targetRoot: string, entry: string) {
  const biomePath = path.join(targetRoot, 'biome.json')

  if (!(await pathExists(biomePath))) {
    return
  }

  const biomeJson = JSON.parse(await readFile(biomePath, 'utf8')) as {
    files?: {
      ignore?: string[]
    }
  }

  const ignore = biomeJson.files?.ignore ?? []

  if (ignore.includes(entry)) {
    return
  }

  biomeJson.files = {
    ...(biomeJson.files ?? {}),
    ignore: [...ignore, entry],
  }

  await writeFile(biomePath, `${JSON.stringify(biomeJson, null, 2)}\n`, 'utf8')
}

async function ensureRootYarnPackageExtension(targetRoot: string) {
  const yarnrcPath = path.join(targetRoot, '.yarnrc.yml')

  if (!(await pathExists(yarnrcPath))) {
    return
  }

  const source = await readFile(yarnrcPath, 'utf8')

  if (source.includes(FIREBASE_YARN_PACKAGE_EXTENSION_KEY)) {
    return
  }

  const normalizedSource = source.endsWith('\n') ? source : `${source}\n`
  const nextSource = normalizedSource.includes('packageExtensions:')
    ? `${normalizedSource}${FIREBASE_YARN_PACKAGE_EXTENSION_BLOCK}\n`
    : `${normalizedSource}\npackageExtensions:\n${FIREBASE_YARN_PACKAGE_EXTENSION_BLOCK}\n`

  await writeFile(yarnrcPath, nextSource, 'utf8')
}

async function removeToolingFiles(workspaceRoot: string, packageManager: PackageManager) {
  const adapter = getPackageManagerAdapter(packageManager)
  await Promise.all(
    [...STATIC_TOOLING_FILES, ...adapter.toolingFiles].map((fileName) =>
      removePathIfExists(path.join(workspaceRoot, fileName)),
    ),
  )
}

async function removeWorkspaceArtifacts(workspaceRoot: string, packageManager: PackageManager) {
  const adapter = getPackageManagerAdapter(packageManager)
  await Promise.all(
    adapter.workspaceArtifacts.map((fileName) =>
      removePathIfExists(path.join(workspaceRoot, fileName)),
    ),
  )
}

async function patchGraniteConfig(
  frontendRoot: string,
  tokens: TemplateTokens,
  serverProvider: ServerProvider | null,
) {
  const graniteConfigPath = path.join(frontendRoot, 'granite.config.ts')

  if (!(await pathExists(graniteConfigPath))) {
    return
  }

  const source = await readFile(graniteConfigPath, 'utf8')
  const next = patchGraniteConfigSource(source, tokens, serverProvider)

  await writeFile(graniteConfigPath, next, 'utf8')
}

async function patchWorkspaceTsconfigModules(
  workspaceRoot: string,
  filePatches: Array<{
    fileName: string
    includeNodeTypes?: boolean
  }>,
) {
  await Promise.all(
    filePatches.map(({ fileName, includeNodeTypes }) =>
      patchTsconfigModuleFile(path.join(workspaceRoot, fileName), { includeNodeTypes }),
    ),
  )
}

async function writeFrontendSupabaseBootstrap(frontendRoot: string) {
  await writeTextFile(path.join(frontendRoot, 'src', 'env.d.ts'), FRONTEND_ENV_TYPES)
  await writeTextFile(
    path.join(frontendRoot, 'src', 'lib', 'supabase.ts'),
    FRONTEND_SUPABASE_CLIENT,
  )
}

async function writeFrontendCloudflareBootstrap(frontendRoot: string) {
  await writeTextFile(path.join(frontendRoot, 'src', 'env.d.ts'), FRONTEND_CLOUDFLARE_ENV_TYPES)
  await writeTextFile(
    path.join(frontendRoot, 'src', 'lib', 'api.ts'),
    FRONTEND_CLOUDFLARE_API_CLIENT,
  )
}

async function writeFrontendFirebaseBootstrap(frontendRoot: string) {
  await writeTextFile(path.join(frontendRoot, 'src', 'env.d.ts'), FRONTEND_FIREBASE_ENV_TYPES)
  await writeTextFile(path.join(frontendRoot, 'src', 'lib', 'firebase.ts'), FRONTEND_FIREBASE_APP)
  await writeTextFile(
    path.join(frontendRoot, 'src', 'lib', 'firestore.ts'),
    FRONTEND_FIREBASE_FIRESTORE,
  )
  await writeTextFile(
    path.join(frontendRoot, 'src', 'lib', 'storage.ts'),
    FRONTEND_FIREBASE_STORAGE,
  )
}

async function writeBackofficeSupabaseBootstrap(backofficeRoot: string) {
  await writeTextFile(path.join(backofficeRoot, 'src', 'vite-env.d.ts'), BACKOFFICE_ENV_TYPES)
  await writeTextFile(
    path.join(backofficeRoot, 'src', 'lib', 'supabase.ts'),
    BACKOFFICE_SUPABASE_CLIENT,
  )
}

async function writeBackofficeCloudflareBootstrap(backofficeRoot: string) {
  await writeTextFile(
    path.join(backofficeRoot, 'src', 'vite-env.d.ts'),
    BACKOFFICE_CLOUDFLARE_ENV_TYPES,
  )
  await writeTextFile(
    path.join(backofficeRoot, 'src', 'lib', 'api.ts'),
    BACKOFFICE_CLOUDFLARE_API_CLIENT,
  )
}

async function writeBackofficeFirebaseBootstrap(backofficeRoot: string) {
  await writeTextFile(
    path.join(backofficeRoot, 'src', 'vite-env.d.ts'),
    BACKOFFICE_FIREBASE_ENV_TYPES,
  )
  await writeTextFile(
    path.join(backofficeRoot, 'src', 'lib', 'firebase.ts'),
    BACKOFFICE_FIREBASE_APP,
  )
  await writeTextFile(
    path.join(backofficeRoot, 'src', 'lib', 'firestore.ts'),
    BACKOFFICE_FIREBASE_FIRESTORE,
  )
  await writeTextFile(
    path.join(backofficeRoot, 'src', 'lib', 'storage.ts'),
    BACKOFFICE_FIREBASE_STORAGE,
  )
}

async function patchBackofficeEntryFiles(backofficeRoot: string) {
  const mainPath = path.join(backofficeRoot, 'src', 'main.tsx')
  const appPath = path.join(backofficeRoot, 'src', 'App.tsx')

  if (await pathExists(mainPath)) {
    const source = await readFile(mainPath, 'utf8')
    const next = patchBackofficeMainSource(source)

    await writeFile(mainPath, next, 'utf8')
  }

  if (await pathExists(appPath)) {
    const source = await readFile(appPath, 'utf8')
    const next = patchBackofficeAppSource(source)
    await writeFile(appPath, next, 'utf8')
  }
}

async function patchWranglerConfigSchema(serverRoot: string, packageJson: PackageJson) {
  const wranglerConfigPath = path.join(serverRoot, 'wrangler.jsonc')

  if (!(await pathExists(wranglerConfigPath))) {
    return
  }

  const source = await readFile(wranglerConfigPath, 'utf8')
  const next = patchWranglerConfigSource(source, {
    schemaUrl: resolveWranglerSchemaUrl(packageJson),
  })

  await writeFile(wranglerConfigPath, next, 'utf8')
}

async function ensureFrontendPackageJsonForWorkspace(
  frontendRoot: string,
  packageJson: PackageJson,
  serverProvider: ServerProvider | null,
) {
  const scripts: Record<string, string> = {}
  const dependencies: Record<string, string> = {}
  const devDependencies: Record<string, string> = {}

  if (!packageJson.scripts?.typecheck) {
    scripts.typecheck = 'tsc --noEmit'
  }

  if (!packageJson.scripts?.test) {
    scripts.test = `node -e "console.log('frontend test placeholder')"`
  }

  if (!packageJson.devDependencies?.['@types/node']) {
    devDependencies['@types/node'] = NODE_TYPES_VERSION
  }

  if (serverProvider === 'supabase') {
    if (!packageJson.dependencies?.['@supabase/supabase-js']) {
      dependencies['@supabase/supabase-js'] = SUPABASE_JS_VERSION
    }
  }

  if (serverProvider === 'firebase' && !packageJson.dependencies?.firebase) {
    dependencies.firebase = FIREBASE_JS_VERSION
  }

  if (
    serverProvider === 'supabase' ||
    serverProvider === 'cloudflare' ||
    serverProvider === 'firebase'
  ) {
    if (!packageJson.devDependencies?.['@granite-js/plugin-env']) {
      devDependencies['@granite-js/plugin-env'] = resolveGranitePluginVersion(packageJson)
    }
  }

  if (
    (serverProvider === 'supabase' ||
      serverProvider === 'cloudflare' ||
      serverProvider === 'firebase') &&
    !packageJson.devDependencies?.dotenv
  ) {
    devDependencies.dotenv = DOTENV_VERSION
  }

  await patchPackageJsonFile(path.join(frontendRoot, 'package.json'), {
    upsertTopLevel: [
      {
        key: 'name',
        value: packageJson.name,
      },
    ],
    upsertSections: {
      scripts,
      dependencies,
      devDependencies,
    },
  })
}

async function ensureBackofficePackageJsonForWorkspace(
  backofficeRoot: string,
  packageJson: PackageJson,
  serverProvider: ServerProvider | null,
) {
  const scripts: Record<string, string> = {
    typecheck: 'tsc -b --pretty false',
  }
  const dependencies: Record<string, string> = {}

  if (!packageJson.scripts?.test) {
    scripts.test = `node -e "console.log('backoffice test placeholder')"`
  }

  if (serverProvider === 'supabase') {
    if (!packageJson.dependencies?.['@supabase/supabase-js']) {
      dependencies['@supabase/supabase-js'] = SUPABASE_JS_VERSION
    }
  }

  if (serverProvider === 'firebase' && !packageJson.dependencies?.firebase) {
    dependencies.firebase = FIREBASE_JS_VERSION
  }

  await patchPackageJsonFile(path.join(backofficeRoot, 'package.json'), {
    upsertTopLevel: [
      {
        key: 'name',
        value: packageJson.name,
      },
    ],
    upsertSections: {
      scripts,
      dependencies,
    },
  })
}

export async function ensureFrontendSupabaseBootstrap(targetRoot: string, tokens: TemplateTokens) {
  const frontendRoot = path.join(targetRoot, 'frontend')
  const packageJsonPath = path.join(frontendRoot, 'package.json')
  const packageJson = await readPackageJson(packageJsonPath)

  await ensureFrontendPackageJsonForWorkspace(frontendRoot, packageJson, 'supabase')
  await patchGraniteConfig(frontendRoot, tokens, 'supabase')
  await patchWorkspaceTsconfigModules(frontendRoot, [
    {
      fileName: 'tsconfig.json',
      includeNodeTypes: true,
    },
  ])
  await writeFrontendSupabaseBootstrap(frontendRoot)
  await applyWorkspaceProjectTemplate(targetRoot, 'frontend', tokens)
}

export async function ensureBackofficeSupabaseBootstrap(
  targetRoot: string,
  tokens: TemplateTokens,
) {
  const backofficeRoot = path.join(targetRoot, 'backoffice')
  const packageJsonPath = path.join(backofficeRoot, 'package.json')
  const packageJson = await readPackageJson(packageJsonPath)

  await ensureBackofficePackageJsonForWorkspace(backofficeRoot, packageJson, 'supabase')
  await patchWorkspaceTsconfigModules(backofficeRoot, [
    { fileName: 'tsconfig.json' },
    { fileName: 'tsconfig.app.json' },
    { fileName: 'tsconfig.node.json' },
  ])
  await patchBackofficeEntryFiles(backofficeRoot)
  await writeBackofficeSupabaseBootstrap(backofficeRoot)
  await applyWorkspaceProjectTemplate(targetRoot, 'backoffice', tokens)
}

export async function ensureFrontendCloudflareBootstrap(
  targetRoot: string,
  tokens: TemplateTokens,
) {
  const frontendRoot = path.join(targetRoot, 'frontend')
  const packageJsonPath = path.join(frontendRoot, 'package.json')
  const packageJson = await readPackageJson(packageJsonPath)

  await ensureFrontendPackageJsonForWorkspace(frontendRoot, packageJson, 'cloudflare')
  await patchGraniteConfig(frontendRoot, tokens, 'cloudflare')
  await patchWorkspaceTsconfigModules(frontendRoot, [
    {
      fileName: 'tsconfig.json',
      includeNodeTypes: true,
    },
  ])
  await writeFrontendCloudflareBootstrap(frontendRoot)
  await applyWorkspaceProjectTemplate(targetRoot, 'frontend', tokens)
}

export async function ensureFrontendFirebaseBootstrap(targetRoot: string, tokens: TemplateTokens) {
  const frontendRoot = path.join(targetRoot, 'frontend')
  const packageJsonPath = path.join(frontendRoot, 'package.json')
  const packageJson = await readPackageJson(packageJsonPath)

  await ensureFrontendPackageJsonForWorkspace(frontendRoot, packageJson, 'firebase')
  await patchGraniteConfig(frontendRoot, tokens, 'firebase')
  await patchWorkspaceTsconfigModules(frontendRoot, [
    {
      fileName: 'tsconfig.json',
      includeNodeTypes: true,
    },
  ])
  await writeFrontendFirebaseBootstrap(frontendRoot)
  await applyWorkspaceProjectTemplate(targetRoot, 'frontend', tokens)
}

export async function ensureBackofficeCloudflareBootstrap(
  targetRoot: string,
  tokens: TemplateTokens,
) {
  const backofficeRoot = path.join(targetRoot, 'backoffice')
  const packageJsonPath = path.join(backofficeRoot, 'package.json')
  const packageJson = await readPackageJson(packageJsonPath)

  await ensureBackofficePackageJsonForWorkspace(backofficeRoot, packageJson, 'cloudflare')
  await patchWorkspaceTsconfigModules(backofficeRoot, [
    { fileName: 'tsconfig.json' },
    { fileName: 'tsconfig.app.json' },
    { fileName: 'tsconfig.node.json' },
  ])
  await patchBackofficeEntryFiles(backofficeRoot)
  await writeBackofficeCloudflareBootstrap(backofficeRoot)
  await applyWorkspaceProjectTemplate(targetRoot, 'backoffice', tokens)
}

export async function ensureBackofficeFirebaseBootstrap(
  targetRoot: string,
  tokens: TemplateTokens,
) {
  const backofficeRoot = path.join(targetRoot, 'backoffice')
  const packageJsonPath = path.join(backofficeRoot, 'package.json')
  const packageJson = await readPackageJson(packageJsonPath)

  await ensureBackofficePackageJsonForWorkspace(backofficeRoot, packageJson, 'firebase')
  await patchWorkspaceTsconfigModules(backofficeRoot, [
    { fileName: 'tsconfig.json' },
    { fileName: 'tsconfig.app.json' },
    { fileName: 'tsconfig.node.json' },
  ])
  await patchBackofficeEntryFiles(backofficeRoot)
  await writeBackofficeFirebaseBootstrap(backofficeRoot)
  await applyWorkspaceProjectTemplate(targetRoot, 'backoffice', tokens)
}

export async function patchFrontendWorkspace(
  targetRoot: string,
  tokens: TemplateTokens,
  options: WorkspacePatchOptions,
) {
  const frontendRoot = path.join(targetRoot, 'frontend')
  const packageJsonPath = path.join(frontendRoot, 'package.json')
  const packageJson = stripToolingFromPackageJson(await readPackageJson(packageJsonPath))

  packageJson.name = 'frontend'
  await patchPackageJsonFile(packageJsonPath, {
    upsertTopLevel: [
      {
        key: 'name',
        value: packageJson.name,
      },
    ],
    removeFromSections: {
      scripts: ['lint', 'lint:fix', 'format', 'format:check'],
      dependencies: [...TOOLING_DEPENDENCIES],
      devDependencies: [...TOOLING_DEPENDENCIES],
    },
  })
  await ensureFrontendPackageJsonForWorkspace(frontendRoot, packageJson, options.serverProvider)
  await removeToolingFiles(frontendRoot, options.packageManager)
  await removeWorkspaceArtifacts(frontendRoot, options.packageManager)
  await patchGraniteConfig(frontendRoot, tokens, options.serverProvider)
  await patchWorkspaceTsconfigModules(frontendRoot, [
    {
      fileName: 'tsconfig.json',
      includeNodeTypes: true,
    },
  ])

  if (options.serverProvider === 'supabase') {
    await writeFrontendSupabaseBootstrap(frontendRoot)
  }

  if (options.serverProvider === 'cloudflare') {
    await writeFrontendCloudflareBootstrap(frontendRoot)
  }

  if (options.serverProvider === 'firebase') {
    await writeFrontendFirebaseBootstrap(frontendRoot)
  }

  await applyWorkspaceProjectTemplate(targetRoot, 'frontend', tokens)
}

export async function patchBackofficeWorkspace(
  targetRoot: string,
  tokens: TemplateTokens,
  options: WorkspacePatchOptions,
) {
  const backofficeRoot = path.join(targetRoot, 'backoffice')
  const packageJsonPath = path.join(backofficeRoot, 'package.json')
  const packageJson = stripToolingFromPackageJson(await readPackageJson(packageJsonPath))

  packageJson.name = 'backoffice'
  await patchPackageJsonFile(packageJsonPath, {
    upsertTopLevel: [
      {
        key: 'name',
        value: packageJson.name,
      },
    ],
    removeFromSections: {
      scripts: ['lint', 'lint:fix', 'format', 'format:check'],
      dependencies: [...TOOLING_DEPENDENCIES],
      devDependencies: [...TOOLING_DEPENDENCIES],
    },
  })
  await ensureBackofficePackageJsonForWorkspace(backofficeRoot, packageJson, options.serverProvider)
  await patchWorkspaceTsconfigModules(backofficeRoot, [
    { fileName: 'tsconfig.json' },
    { fileName: 'tsconfig.app.json' },
    { fileName: 'tsconfig.node.json' },
  ])
  await patchBackofficeEntryFiles(backofficeRoot)
  await removeToolingFiles(backofficeRoot, options.packageManager)
  await removeWorkspaceArtifacts(backofficeRoot, options.packageManager)

  if (options.serverProvider === 'supabase') {
    await writeBackofficeSupabaseBootstrap(backofficeRoot)
  }

  if (options.serverProvider === 'cloudflare') {
    await writeBackofficeCloudflareBootstrap(backofficeRoot)
  }

  if (options.serverProvider === 'firebase') {
    await writeBackofficeFirebaseBootstrap(backofficeRoot)
  }

  await applyWorkspaceProjectTemplate(targetRoot, 'backoffice', tokens)
}

export async function patchSupabaseServerWorkspace(
  targetRoot: string,
  tokens: TemplateTokens,
  options: Pick<WorkspacePatchOptions, 'packageManager'>,
) {
  const serverRoot = path.join(targetRoot, 'server')
  await applyServerPackageTemplate(targetRoot, tokens)
  await writeTextFile(path.join(serverRoot, 'README.md'), renderSupabaseServerReadme(tokens))
  await removeToolingFiles(serverRoot, options.packageManager)
  await removeWorkspaceArtifacts(serverRoot, options.packageManager)
  await applyWorkspaceProjectTemplate(targetRoot, 'server', tokens)
}

export async function patchCloudflareServerWorkspace(
  targetRoot: string,
  tokens: TemplateTokens,
  options: Pick<WorkspacePatchOptions, 'packageManager'>,
) {
  const serverRoot = path.join(targetRoot, 'server')
  const packageJsonPath = path.join(serverRoot, 'package.json')
  const packageJson = await readPackageJson(packageJsonPath)

  await patchPackageJsonFile(packageJsonPath, {
    upsertTopLevel: [
      {
        key: 'name',
        value: 'server',
      },
    ],
    upsertSections: {
      scripts: {
        deploy: 'wrangler deploy',
        build: 'wrangler deploy --dry-run',
        typecheck: 'wrangler types && tsc --noEmit',
      },
    },
    removeFromSections: {
      scripts: ['deploy:remote'],
    },
  })
  await patchWranglerConfigSchema(serverRoot, packageJson)
  await writeTextFile(path.join(serverRoot, 'README.md'), renderCloudflareServerReadme(tokens))
  await ensureRootGitignoreEntry(targetRoot, CLOUDFLARE_ROOT_GITIGNORE_ENTRY)
  await ensureRootBiomeIgnoreEntry(targetRoot, CLOUDFLARE_ROOT_BIOME_IGNORE_ENTRY)
  await removePathIfExists(path.join(serverRoot, 'scripts', 'cloudflare-deploy.mjs'))

  await Promise.all(
    CLOUDFLARE_SERVER_LOCAL_FILES.map((fileName) =>
      removePathIfExists(path.join(serverRoot, fileName)),
    ),
  )
  await removeToolingFiles(serverRoot, options.packageManager)
  await removeWorkspaceArtifacts(serverRoot, options.packageManager)
  await applyWorkspaceProjectTemplate(targetRoot, 'server', tokens)
}

export async function patchFirebaseServerWorkspace(
  targetRoot: string,
  tokens: TemplateTokens,
  options: Pick<WorkspacePatchOptions, 'packageManager'>,
) {
  const serverRoot = path.join(targetRoot, 'server')

  await writeTextFile(path.join(serverRoot, 'README.md'), renderFirebaseServerReadme(tokens))
  await ensureRootGitignoreEntry(targetRoot, FIREBASE_ROOT_GITIGNORE_ENTRY)
  await ensureRootBiomeIgnoreEntry(targetRoot, FIREBASE_ROOT_BIOME_IGNORE_ENTRY)
  if (options.packageManager === 'yarn') {
    await ensureRootYarnPackageExtension(targetRoot)
  }
  await removeToolingFiles(serverRoot, options.packageManager)
  await removeWorkspaceArtifacts(serverRoot, options.packageManager)
  await removePathIfExists(path.join(serverRoot, '.eslintrc.js'))
  await applyWorkspaceProjectTemplate(targetRoot, 'server', tokens)
}

export function createRootPackageName(appName: string) {
  return `${appName}-workspace`
}
