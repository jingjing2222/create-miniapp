import path from 'node:path'
import { execa } from 'execa'
import yargs from 'yargs'
import { assertValidAppName, toDefaultDisplayName } from './layout.js'

export type ParsedCliArgs = {
  name?: string
  displayName?: string
  withServer?: boolean
  withBackoffice?: boolean
  outputDir: string
  skipInstall: boolean
  yes: boolean
  help: boolean
  version: boolean
}

export type TextPromptOptions = {
  message: string
  placeholder?: string
  initialValue?: string
  validate?: (value: string) => string | undefined
}

export type SelectPromptOptions<T extends string> = {
  message: string
  options: Array<{
    label: string
    value: T
  }>
  initialValue?: T
}

export type CliPrompter = {
  text(options: TextPromptOptions): Promise<string>
  select<T extends string>(options: SelectPromptOptions<T>): Promise<T>
}

export type ResolvedCliOptions = {
  appName: string
  displayName: string
  withServer: boolean
  withBackoffice: boolean
  outputDir: string
  skipInstall: boolean
}

export async function parseCliArgs(rawArgs: string[], cwd = process.cwd()) {
  const argv = await yargs(rawArgs)
    .scriptName('create-miniapp')
    .help(false)
    .version(false)
    .exitProcess(false)
    .strict()
    .fail(() => {
      throw new Error('옵션을 해석하지 못했습니다. `--help`로 사용법을 확인하세요.')
    })
    .option('name', {
      type: 'string',
      describe: 'Granite appName과 생성 디렉터리 이름',
    })
    .option('display-name', {
      type: 'string',
      describe: '사용자에게 보이는 앱 이름',
    })
    .option('with-server', {
      type: 'boolean',
      describe: '`server` 워크스페이스 포함',
    })
    .option('with-backoffice', {
      type: 'boolean',
      describe: '`backoffice` 워크스페이스 포함',
    })
    .option('output-dir', {
      type: 'string',
      default: cwd,
      describe: '생성할 모노레포의 상위 디렉터리',
    })
    .option('skip-install', {
      type: 'boolean',
      default: false,
      describe: '마지막 루트 `pnpm install` 생략',
    })
    .option('yes', {
      type: 'boolean',
      default: false,
      describe: '선택형 질문을 기본값으로 진행',
    })
    .option('help', {
      type: 'boolean',
      default: false,
      describe: '도움말 보기',
    })
    .option('version', {
      type: 'boolean',
      default: false,
      describe: '버전 보기',
    })
    .parse()

  return {
    name: argv.name,
    displayName: argv.displayName,
    withServer: argv.withServer,
    withBackoffice: argv.withBackoffice,
    outputDir: argv.outputDir,
    skipInstall: argv.skipInstall,
    yes: argv.yes,
    help: argv.help,
    version: argv.version,
  } satisfies ParsedCliArgs
}

export function formatCliHelp() {
  return [
    '사용법',
    '  create-miniapp [옵션]',
    '',
    '옵션',
    '  --name <app-name>              Granite appName과 생성 디렉터리 이름',
    '  --display-name <표시 이름>     사용자에게 보이는 앱 이름',
    '  --with-server                  `server` 워크스페이스 포함',
    '  --with-backoffice              `backoffice` 워크스페이스 포함',
    '  --output-dir <디렉터리>        생성할 모노레포의 상위 디렉터리',
    '  --skip-install                 마지막 루트 `pnpm install` 생략',
    '  --yes                          선택형 질문을 기본값으로 진행',
    '  --help                         도움말 보기',
    '  --version                      버전 보기',
    '',
    '예시',
    '  create-miniapp --name my-miniapp --display-name "내 미니앱"',
    '  create-miniapp --name my-miniapp --with-server --with-backoffice',
    '',
    '옵션으로 주어지지 않은 값은 인터랙티브 입력으로 이어집니다.',
  ].join('\n')
}

export async function resolveCliOptions(argv: ParsedCliArgs, prompt: CliPrompter) {
  const rawName =
    argv.name ??
    (argv.yes
      ? undefined
      : await prompt.text({
          message: 'appName을 입력하세요',
          placeholder: 'my-miniapp',
          validate(value) {
            const candidate = value?.trim() ?? ''

            return candidate.length === 0 || candidate.includes(' ')
              ? 'kebab-case appName이 필요합니다.'
              : undefined
          },
        }))

  if (!rawName) {
    throw new Error('appName은 필수입니다. `--name` 옵션을 주거나 입력에서 작성하세요.')
  }

  const appName = assertValidAppName(rawName)
  const displayName =
    argv.displayName ??
    (argv.yes
      ? toDefaultDisplayName(appName)
      : await prompt.text({
          message: 'displayName을 입력하세요',
          initialValue: toDefaultDisplayName(appName),
        }))

  const withServer =
    argv.withServer ??
    (argv.yes
      ? false
      : (await prompt.select({
          message: '`server` 워크스페이스를 같이 만들까요?',
          options: [
            { label: '예', value: 'yes' },
            { label: '아니오', value: 'no' },
          ],
          initialValue: 'no',
        })) === 'yes')

  const withBackoffice =
    argv.withBackoffice ??
    (argv.yes
      ? false
      : (await prompt.select({
          message: '`backoffice` 워크스페이스를 같이 만들까요?',
          options: [
            { label: '예', value: 'yes' },
            { label: '아니오', value: 'no' },
          ],
          initialValue: 'no',
        })) === 'yes')

  return {
    appName,
    displayName,
    withServer,
    withBackoffice,
    outputDir: path.resolve(argv.outputDir),
    skipInstall: argv.skipInstall,
  } satisfies ResolvedCliOptions
}

export function createExecaPrompter(): CliPrompter {
  return {
    async text(options) {
      while (true) {
        const value = await runPromptScript(buildTextPromptScript(options))
        const normalized = value.length === 0 ? (options.initialValue ?? '') : value
        const validationMessage = options.validate?.(normalized)

        if (!validationMessage) {
          return normalized
        }

        console.error(validationMessage)
      }
    },
    async select<T extends string>(options: SelectPromptOptions<T>) {
      const selection = await runPromptScript(buildSelectPromptScript(options))
      const index = Number(selection)
      const picked = options.options[index - 1]

      if (!picked) {
        throw new Error('선택 값을 해석하지 못했습니다.')
      }

      return picked.value
    },
  }
}

function buildTextPromptScript(options: TextPromptOptions) {
  const promptMessage = options.placeholder
    ? `${options.message} (${options.placeholder})`
    : options.message
  const initialValue = options.initialValue ?? ''

  return [
    `prompt_message=${toShellLiteral(promptMessage)}`,
    `initial_value=${toShellLiteral(initialValue)}`,
    'if [ -n "$initial_value" ]; then',
    '  printf "%s [%s]: " "$prompt_message" "$initial_value" >&2',
    'else',
    '  printf "%s: " "$prompt_message" >&2',
    'fi',
    'IFS= read -r answer || exit 130',
    'printf "%s" "$answer"',
  ].join('\n')
}

function buildSelectPromptScript<T extends string>(options: SelectPromptOptions<T>) {
  const defaultIndex = options.initialValue
    ? options.options.findIndex((option) => option.value === options.initialValue) + 1
    : 0

  return [
    ...options.options.map(
      (option, index) => `printf "%s\\n" ${toShellLiteral(`${index + 1}. ${option.label}`)} >&2`,
    ),
    'while true; do',
    defaultIndex > 0
      ? `  printf "%s [기본값: ${defaultIndex}]: " ${toShellLiteral(options.message)} >&2`
      : `  printf "%s: " ${toShellLiteral(options.message)} >&2`,
    '  IFS= read -r answer || exit 130',
    defaultIndex > 0 ? `  if [ -z "$answer" ]; then answer=${defaultIndex}; fi` : '',
    '  case "$answer" in',
    ...options.options.map(
      (option, index) => `    ${index + 1}) printf "%s" "${index + 1}"; exit 0 ;;`,
    ),
    '    *) printf "올바른 번호를 입력하세요.\\n" >&2 ;;',
    '  esac',
    'done',
  ]
    .filter(Boolean)
    .join('\n')
}

async function runPromptScript(script: string) {
  try {
    const { stdout } = await execa('bash', ['-lc', script], {
      stdin: 'inherit',
      stdout: 'pipe',
      stderr: 'inherit',
    })

    return stdout.trimEnd()
  } catch (error) {
    if (isPromptCancelled(error)) {
      throw new Error('입력을 취소했습니다.')
    }

    throw error
  }
}

function toShellLiteral(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`
}

function isPromptCancelled(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const candidate = error as {
    exitCode?: number
    signal?: string
    isCanceled?: boolean
  }

  return (
    candidate.exitCode === 130 || candidate.signal === 'SIGINT' || candidate.isCanceled === true
  )
}
