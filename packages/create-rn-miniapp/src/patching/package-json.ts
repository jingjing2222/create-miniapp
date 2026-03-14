import { parse } from 'jsonc-parser'

const JSONC_PARSE_OPTIONS = {
  allowTrailingComma: true,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

type OrderedJsonEntry = {
  key: string
  value: unknown
}

type PackageJsonSectionName = 'scripts' | 'dependencies' | 'devDependencies'

function parseOrderedJsonObjectEntries(source: string) {
  const parsed = parse(source, [], JSONC_PARSE_OPTIONS)

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('루트 package.json을 JSON 객체로 파싱하지 못했습니다.')
  }

  return Object.entries(parsed).map(([key, value]) => ({ key, value }))
}

function upsertOrderedJsonEntry(
  entries: OrderedJsonEntry[],
  key: string,
  value: unknown,
  options?: {
    afterKey?: string
  },
) {
  const existingIndex = entries.findIndex((entry) => entry.key === key)
  const nextEntry = { key, value }

  if (existingIndex !== -1) {
    entries.splice(existingIndex, 1)
  }

  if (options?.afterKey) {
    const anchorIndex = entries.findIndex((entry) => entry.key === options.afterKey)

    if (anchorIndex !== -1) {
      entries.splice(anchorIndex + 1, 0, nextEntry)
      return
    }
  }

  if (existingIndex !== -1 && existingIndex <= entries.length) {
    entries.splice(existingIndex, 0, nextEntry)
    return
  }

  entries.push(nextEntry)
}

function removeOrderedJsonEntry(entries: OrderedJsonEntry[], key: string) {
  const existingIndex = entries.findIndex((entry) => entry.key === key)

  if (existingIndex !== -1) {
    entries.splice(existingIndex, 1)
  }
}

function stringifyOrderedJsonEntries(entries: OrderedJsonEntry[]) {
  const object: Record<string, unknown> = {}

  for (const entry of entries) {
    object[entry.key] = entry.value
  }

  return `${JSON.stringify(object, null, 2)}\n`
}

function readStringMapSection(entries: OrderedJsonEntry[], key: PackageJsonSectionName) {
  const value = entries.find((entry) => entry.key === key)?.value

  if (!isRecord(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, candidate]) => typeof candidate === 'string'),
  ) as Record<string, string>
}

export function patchPackageJsonSource(
  source: string,
  patch: {
    upsertTopLevel?: Array<{
      key: string
      value: unknown
      afterKey?: string
    }>
    removeTopLevel?: string[]
    upsertSections?: Partial<Record<PackageJsonSectionName, Record<string, string>>>
    removeFromSections?: Partial<Record<PackageJsonSectionName, string[]>>
  },
) {
  const entries = parseOrderedJsonObjectEntries(source)

  for (const key of patch.removeTopLevel ?? []) {
    removeOrderedJsonEntry(entries, key)
  }

  for (const sectionName of ['scripts', 'dependencies', 'devDependencies'] as const) {
    const existingSection = readStringMapSection(entries, sectionName)
    const nextSection = { ...existingSection }

    for (const key of patch.removeFromSections?.[sectionName] ?? []) {
      delete nextSection[key]
    }

    Object.assign(nextSection, patch.upsertSections?.[sectionName] ?? {})

    const hadSection = entries.some((entry) => entry.key === sectionName)
    if (hadSection || Object.keys(nextSection).length > 0) {
      upsertOrderedJsonEntry(entries, sectionName, nextSection)
    }
  }

  for (const entry of patch.upsertTopLevel ?? []) {
    upsertOrderedJsonEntry(entries, entry.key, entry.value, {
      afterKey: entry.afterKey,
    })
  }

  return stringifyOrderedJsonEntries(entries)
}

export function patchRootPackageJsonSource(
  source: string,
  patch: {
    packageManagerField: string
    scripts: Record<string, string>
    workspaces: string[] | null
  },
) {
  return patchPackageJsonSource(source, {
    upsertTopLevel: [
      {
        key: 'packageManager',
        value: patch.packageManagerField,
      },
      ...(patch.workspaces
        ? [
            {
              key: 'workspaces',
              value: patch.workspaces,
              afterKey: 'packageManager',
            },
          ]
        : []),
    ],
    removeTopLevel: patch.workspaces ? [] : ['workspaces'],
    upsertSections: {
      scripts: patch.scripts,
    },
  })
}
