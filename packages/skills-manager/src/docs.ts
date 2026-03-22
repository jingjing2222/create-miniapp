import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getPackageManagerContext, type PackageManager } from './package-manager.js'
import { resolveManagerPackageRoot, resolveSkillsPackageRoot } from './filesystem.js'
import { readSkillsManifest, resolveManagedSkillSelections } from './skills.js'
import type { GeneratedWorkspaceHints, GeneratedWorkspaceOptions } from './types.js'

type SkillsDocState = {
  managerPackage: string
  managerVersion: string
  catalogPackage: string
  catalogVersion: string
  customSkillPolicy: string
  resolvedSkills: Array<{ id: string; mode: string }>
}

async function readPackageIdentity(packageJsonPath: string) {
  return JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
    name: string
    version: string
  }
}

async function resolveSkillsDocState(
  targetRoot: string,
  options: GeneratedWorkspaceOptions,
  hints: GeneratedWorkspaceHints,
): Promise<SkillsDocState> {
  const manifest = await readSkillsManifest(targetRoot)

  if (manifest) {
    return {
      managerPackage: manifest.managerPackage,
      managerVersion: manifest.managerVersion,
      catalogPackage: manifest.catalogPackage,
      catalogVersion: manifest.catalogVersion,
      customSkillPolicy: manifest.customSkillPolicy,
      resolvedSkills: manifest.resolvedSkills.map((entry) => ({
        id: entry.id,
        mode: entry.mode,
      })),
    }
  }

  const managerPackage = await readPackageIdentity(
    path.join(resolveManagerPackageRoot(), 'package.json'),
  )
  const catalogPackage = await readPackageIdentity(
    path.join(resolveSkillsPackageRoot(), 'package.json'),
  )
  const resolvedSkills = resolveManagedSkillSelections(options, hints.manualExtraSkills ?? []).map(
    (entry) => ({
      id: entry.definition.id,
      mode: entry.mode,
    }),
  )

  return {
    managerPackage: managerPackage.name,
    managerVersion: managerPackage.version,
    catalogPackage: catalogPackage.name,
    catalogVersion: catalogPackage.version,
    customSkillPolicy: 'preserve-unmanaged-siblings',
    resolvedSkills,
  }
}

export async function syncSkillsDoc(
  targetRoot: string,
  packageManager: PackageManager,
  options: GeneratedWorkspaceOptions,
  hints: GeneratedWorkspaceHints,
) {
  const adapter = getPackageManagerContext(packageManager)
  const state = await resolveSkillsDocState(targetRoot, options, hints)
  const managedSkillLines = state.resolvedSkills.map((entry) => `- \`${entry.id}\` (${entry.mode})`)
  const source = [
    '# Skills',
    '',
    'Skill inventory와 ownership 규칙은 이 문서가 단일 source of truth다.',
    '',
    '## Managed Snapshot',
    '- canonical source: `.agents/skills/*`',
    '- Claude mirror: `.claude/skills/*`',
    `- manager package: \`${state.managerPackage}@${state.managerVersion}\``,
    `- catalog package: \`${state.catalogPackage}@${state.catalogVersion}\``,
    `- custom skill policy: \`${state.customSkillPolicy}\``,
    '',
    '## Managed Skills',
    ...(managedSkillLines.length > 0 ? managedSkillLines : ['- 없음']),
    '',
    '## Commands',
    `- mirror: \`${adapter.runScript('skills:mirror')}\``,
    `- check: \`${adapter.runScript('skills:check')}\``,
    `- sync: \`${adapter.runScript('skills:sync')}\``,
    `- diff: \`${adapter.runScript('skills:diff')}\``,
    `- upgrade: \`${adapter.runScript('skills:upgrade')}\``,
    '',
    '## Ownership',
    '- `.agents/skills` 아래에서 manifest에 있는 id만 managed snapshot이다.',
    '- manifest에 없는 sibling entry는 unmanaged custom skill로 취급하고 sync/upgrade에서 보존한다.',
    '- `.claude/skills`는 직접 수정하지 않는다. mirror는 `skills:mirror`가 관리한다.',
    '',
  ].join('\n')

  await mkdir(path.join(targetRoot, 'docs'), { recursive: true })
  await writeFile(path.join(targetRoot, 'docs', 'skills.md'), source, 'utf8')
}
