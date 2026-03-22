export const SKILLS_SOURCE_REPO = 'jingjing2222/create-rn-miniapp'
export const PROJECT_SKILLS_CANONICAL_DIR = '.agents/skills'
export const PROJECT_SKILLS_MIRROR_DIR = '.claude/skills'
export const PROJECT_SKILLS_DIR_CANDIDATES = [
  PROJECT_SKILLS_CANONICAL_DIR,
  PROJECT_SKILLS_MIRROR_DIR,
] as const
export const SKILLS_LIST_COMMAND = 'npx skills list'
export const SKILLS_CHECK_COMMAND = 'npx skills check'
export const SKILLS_UPDATE_COMMAND = 'npx skills update'

const PROJECT_SKILLS_CANONICAL_DIR_TOKEN = '{{projectSkillsCanonicalDir}}'
const PROJECT_SKILLS_MIRROR_DIR_TOKEN = '{{projectSkillsMirrorDir}}'

export function createProjectSkillDocPath(skillId: string) {
  return `${PROJECT_SKILLS_CANONICAL_DIR}/${skillId}/SKILL.md`
}

export function createProjectSkillDirectoryPath(skillId: string) {
  return `${PROJECT_SKILLS_CANONICAL_DIR}/${skillId}`
}

export function createProjectSkillGeneratedPath(skillId: string, relativePath: string) {
  return `${PROJECT_SKILLS_CANONICAL_DIR}/${skillId}/${relativePath}`
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

export function createProjectSkillTemplateExtraTokens() {
  return {
    [PROJECT_SKILLS_CANONICAL_DIR_TOKEN]: PROJECT_SKILLS_CANONICAL_DIR,
    [PROJECT_SKILLS_MIRROR_DIR_TOKEN]: PROJECT_SKILLS_MIRROR_DIR,
  }
}
