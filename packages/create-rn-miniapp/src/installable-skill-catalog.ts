import { APPS_IN_TOSS_SKILLS_SOURCE_REPO, SKILLS_SOURCE_REPO } from './skills/contract.js'
import {
  SKILL_CATALOG as LOCAL_SKILL_CATALOG,
  type SkillDefinition as LocalSkillDefinition,
  type SkillId as LocalSkillId,
} from './templates/skill-catalog.js'

type OfficialSkillMetadata = {
  agentsLabel: string
  description: string
  readmeDescription: string
}

const OFFICIAL_SKILL_METADATA_BY_ID = {
  'docs-search': {
    agentsLabel: 'Apps-in-Toss / TDS 공식 문서 검색',
    description:
      '공식 Apps-in-Toss와 TDS 문서에서 capability, component, API 존재 여부를 확인할 때',
    readmeDescription:
      '공식 Apps-in-Toss와 TDS 문서에서 capability, component, API 존재 여부를 확인할 때',
  },
  'project-validator': {
    agentsLabel: 'AppInToss 프로젝트 구조 검증',
    description: '생성된 AppInToss workspace 구조, 필수 파일, import 경계 drift를 점검할 때',
    readmeDescription: '생성된 AppInToss workspace 구조, 필수 파일, import 경계 drift를 점검할 때',
  },
} as const satisfies Record<string, OfficialSkillMetadata>

const LOCAL_SKILL_README_DESCRIPTION_BY_ID = {
  'granite-routing': 'Granite route 경로, page entry, param, navigation 흐름을 바꿀 때',
  'tds-ui': 'TDS 컴포넌트 선택, form 패턴, UI boundary를 정할 때',
  'backoffice-react':
    'backoffice 화면을 list, detail, form, dashboard, bulk action 구조로 나눌지 정할 때',
  'cloudflare-worker':
    'Cloudflare Worker 서버에서 runtime, binding, env, client 연결 drift를 진단할 때',
  'supabase-project':
    'Supabase 서버에서 DB, RLS, Edge Function, env, project ref drift를 분류할 때',
  'firebase-functions':
    'Firebase 서버에서 callable, HTTP, trigger 선택과 project, region, emulator drift를 진단할 때',
  'trpc-boundary': 'tRPC contract, app router shape, client/server import boundary를 바꿀 때',
} as const satisfies Record<LocalSkillId, string>

export type OfficialSkillId = keyof typeof OFFICIAL_SKILL_METADATA_BY_ID
export type InstallableSkillId = LocalSkillId | OfficialSkillId

export type InstallableSkillDefinition = {
  id: InstallableSkillId
  agentsLabel: string
  description: string
  readmeDescription: string
  sourceRepo: string
}

function createOfficialSkillDefinition<TId extends OfficialSkillId>(
  id: TId,
): InstallableSkillDefinition {
  return {
    id,
    agentsLabel: OFFICIAL_SKILL_METADATA_BY_ID[id].agentsLabel,
    description: OFFICIAL_SKILL_METADATA_BY_ID[id].description,
    readmeDescription: OFFICIAL_SKILL_METADATA_BY_ID[id].readmeDescription,
    sourceRepo: APPS_IN_TOSS_SKILLS_SOURCE_REPO,
  }
}

function createLocalSkillDefinition(skill: LocalSkillDefinition): InstallableSkillDefinition {
  return {
    id: skill.id,
    agentsLabel: skill.agentsLabel,
    description: skill.description,
    readmeDescription: LOCAL_SKILL_README_DESCRIPTION_BY_ID[skill.id],
    sourceRepo: SKILLS_SOURCE_REPO,
  }
}

export const OFFICIAL_SKILL_DEFINITIONS = (
  Object.keys(OFFICIAL_SKILL_METADATA_BY_ID) as OfficialSkillId[]
).map(createOfficialSkillDefinition)

export const INSTALLABLE_SKILL_CATALOG: InstallableSkillDefinition[] = [
  ...OFFICIAL_SKILL_DEFINITIONS,
  ...LOCAL_SKILL_CATALOG.map(createLocalSkillDefinition),
]

const INSTALLABLE_SKILL_DEFINITION_BY_ID = new Map(
  INSTALLABLE_SKILL_CATALOG.map((skill) => [skill.id, skill] as const),
)

export function getInstallableSkillDefinition(id: InstallableSkillId | string) {
  const definition = INSTALLABLE_SKILL_DEFINITION_BY_ID.get(id as InstallableSkillId)

  if (!definition) {
    throw new Error(`알 수 없는 skill id입니다: ${id}`)
  }

  return definition
}

export function resolveAlwaysRecommendedSkillDefinitions() {
  return OFFICIAL_SKILL_DEFINITIONS
}
