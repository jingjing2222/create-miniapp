import { parse } from 'jsonc-parser'

const JSONC_PARSE_OPTIONS = {
  allowTrailingComma: true,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function patchTsconfigModuleSource(
  source: string,
  options?: {
    includeNodeTypes?: boolean
  },
) {
  const parsed = parse(source, [], JSONC_PARSE_OPTIONS)

  if (!isRecord(parsed)) {
    return source
  }

  const next = { ...parsed }
  const compilerOptions = isRecord(next.compilerOptions) ? { ...next.compilerOptions } : {}

  compilerOptions.module = 'esnext'

  if (options?.includeNodeTypes) {
    const existingTypes = Array.isArray(compilerOptions.types)
      ? compilerOptions.types.filter((value): value is string => typeof value === 'string')
      : []

    if (!existingTypes.includes('node')) {
      existingTypes.push('node')
    }

    compilerOptions.types = existingTypes
  }

  next.compilerOptions = compilerOptions

  return `${JSON.stringify(next, null, 2)}\n`
}

export function patchWranglerConfigSource(
  source: string,
  patch: {
    schemaUrl?: string
    name?: string
  },
) {
  const parsed = parse(source, [], JSONC_PARSE_OPTIONS)

  if (!isRecord(parsed)) {
    return source
  }

  const next = { ...parsed }

  if (patch.schemaUrl) {
    next.$schema = patch.schemaUrl
  }

  if (patch.name) {
    next.name = patch.name
  }

  return `${JSON.stringify(next, null, 2)}\n`
}
