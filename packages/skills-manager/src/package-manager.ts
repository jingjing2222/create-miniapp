export const PACKAGE_MANAGERS = ['pnpm', 'yarn', 'npm', 'bun'] as const

export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

const PACKAGE_MANAGER_FIELDS = {
  pnpm: 'pnpm@10.32.1',
  yarn: 'yarn@4.13.0',
  npm: 'npm@11.11.1',
  bun: 'bun@1.3.4',
} as const satisfies Record<PackageManager, string>

export function parsePackageManagerField(value: string | undefined): PackageManager {
  if (value?.startsWith('pnpm@')) {
    return 'pnpm'
  }

  if (value?.startsWith('yarn@')) {
    return 'yarn'
  }

  if (value?.startsWith('npm@')) {
    return 'npm'
  }

  if (value?.startsWith('bun@')) {
    return 'bun'
  }

  throw new Error(
    '지원하지 않는 package manager예요. root package.json의 `packageManager`를 확인해 주세요.',
  )
}

export function getPackageManagerContext(packageManager: PackageManager) {
  const runScript = (script: string) => {
    switch (packageManager) {
      case 'pnpm':
        return `pnpm ${script}`
      case 'yarn':
        return `yarn ${script}`
      case 'npm':
        return `npm run ${script}`
      case 'bun':
        return `bun run ${script}`
    }
  }

  return {
    packageManagerField: PACKAGE_MANAGER_FIELDS[packageManager],
    packageManagerCommand: packageManager,
    packageManagerRunCommand:
      packageManager === 'npm' ? 'npm run' : packageManager === 'bun' ? 'bun run' : packageManager,
    packageManagerExecCommand:
      packageManager === 'pnpm'
        ? 'pnpm exec'
        : packageManager === 'yarn'
          ? 'yarn exec'
          : packageManager === 'npm'
            ? 'npx'
            : 'bunx',
    verifyCommand:
      packageManager === 'pnpm'
        ? 'pnpm verify'
        : packageManager === 'yarn'
          ? 'yarn verify'
          : packageManager === 'npm'
            ? 'npm run verify'
            : 'bun run verify',
    runScript,
  }
}
