export const SKILLS_SOURCE_REPO = 'jingjing2222/create-rn-miniapp'
export const PROJECT_SKILLS_CANONICAL_DIR = '.agents/skills'
export const PROJECT_SKILLS_MIRROR_DIR = '.claude/skills'
export const PROJECT_SKILLS_LOCAL_DIR = 'skills'
export const PROJECT_SKILLS_DIR_CANDIDATES = [
  PROJECT_SKILLS_CANONICAL_DIR,
  PROJECT_SKILLS_LOCAL_DIR,
  PROJECT_SKILLS_MIRROR_DIR,
] as const
export const SKILLS_LIST_COMMAND = 'npx skills list'
export const SKILLS_CHECK_COMMAND = 'npx skills check'
export const SKILLS_UPDATE_COMMAND = 'npx skills update'

export function createProjectSkillDocPath(
  skillId: string,
  skillsRoot = PROJECT_SKILLS_CANONICAL_DIR,
) {
  return `${skillsRoot}/${skillId}/SKILL.md`
}

export function createProjectSkillDirectoryPath(
  skillId: string,
  skillsRoot = PROJECT_SKILLS_CANONICAL_DIR,
) {
  return `${skillsRoot}/${skillId}`
}

export function createProjectSkillGeneratedPath(
  skillId: string,
  relativePath: string,
  skillsRoot = PROJECT_SKILLS_CANONICAL_DIR,
) {
  return `${skillsRoot}/${skillId}/${relativePath}`
}

export function createSkillsAddArgs(options: {
  source: string
  skillIds: readonly string[]
  copy?: boolean
  yes?: boolean
}) {
  return [
    'add',
    options.source,
    ...options.skillIds.flatMap((skillId) => ['--skill', skillId]),
    ...(options.copy === false ? [] : ['--copy']),
    ...(options.yes === true ? ['-y'] : []),
  ]
}
