import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import type { CommandSpec } from './command-spec.js'
import { getPackageManagerAdapter, type PackageManager } from './package-manager.js'
import type { ServerProvider } from './providers/index.js'
import { PROJECT_SKILLS_DIR_CANDIDATES, SKILLS_SOURCE_REPO } from './skills-contract.js'
import { resolveRecommendedSkillDefinitions } from './templates/feature-catalog.js'
import { SKILL_CATALOG, getSkillDefinition, type SkillId } from './templates/skill-catalog.js'

type SkillRecommendationContext = {
  serverProvider: ServerProvider | null
  hasBackoffice: boolean
  hasTrpc: boolean
}

async function pathExists(targetPath: string) {
  try {
    await stat(targetPath)
    return true
  } catch {
    return false
  }
}

async function resolveInstalledProjectSkillIds(targetRoot: string) {
  const installed = new Set<string>()

  for (const relativeDir of PROJECT_SKILLS_DIR_CANDIDATES) {
    const skillsRoot = path.join(targetRoot, relativeDir)

    if (!(await pathExists(skillsRoot))) {
      continue
    }

    const entries = await readdir(skillsRoot, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      if (await pathExists(path.join(skillsRoot, entry.name, 'SKILL.md'))) {
        installed.add(entry.name)
      }
    }
  }

  return [...installed].sort((left, right) => left.localeCompare(right))
}

export async function hasInstalledProjectSkills(targetRoot: string) {
  for (const relativeDir of PROJECT_SKILLS_DIR_CANDIDATES) {
    const skillsRoot = path.join(targetRoot, relativeDir)

    if (!(await pathExists(skillsRoot))) {
      continue
    }

    if ((await readdir(skillsRoot)).length > 0) {
      return true
    }
  }

  return false
}

export async function listInstalledProjectSkills(targetRoot: string) {
  return await resolveInstalledProjectSkillIds(targetRoot)
}

export function normalizeSelectedSkillIds(rawSkillIds: string[] | undefined) {
  const normalized: SkillId[] = []
  const seen = new Set<string>()

  for (const rawSkillId of rawSkillIds ?? []) {
    const definition = getSkillDefinition(rawSkillId as SkillId)

    if (seen.has(definition.id)) {
      continue
    }

    normalized.push(definition.id)
    seen.add(definition.id)
  }

  return normalized
}

export function resolveRecommendedSkillIds(context: SkillRecommendationContext) {
  return resolveRecommendedSkillDefinitions({
    hasBackoffice: context.hasBackoffice,
    serverProvider: context.serverProvider,
    hasTrpc: context.hasTrpc,
  }).map((skill) => skill.id)
}

export function resolveSelectableSkills() {
  return SKILL_CATALOG
}

export function renderSkillsAddCommand(skillIds: string[]) {
  const baseArgs = [
    'npx',
    'skills',
    'add',
    SKILLS_SOURCE_REPO,
    ...skillIds.flatMap((skillId) => ['--skill', skillId]),
    '--copy',
  ]

  return baseArgs.join(' ')
}

async function resolveSkillsSource() {
  const localRepoRoot = path.resolve(import.meta.dirname, '../../..')

  if (await pathExists(path.join(localRepoRoot, 'skills'))) {
    return localRepoRoot
  }

  return SKILLS_SOURCE_REPO
}

export async function buildSkillsInstallCommand(options: {
  packageManager: PackageManager
  targetRoot: string
  skillIds: SkillId[]
}): Promise<CommandSpec | null> {
  if (options.skillIds.length === 0) {
    return null
  }

  const adapter = getPackageManagerAdapter(options.packageManager)
  const source = await resolveSkillsSource()

  return {
    cwd: options.targetRoot,
    ...adapter.dlx('skills', [
      'add',
      source,
      ...options.skillIds.flatMap((skillId) => ['--skill', skillId]),
      '--copy',
      '-y',
    ]),
    label: '추천 agent skills 설치하기',
  }
}
