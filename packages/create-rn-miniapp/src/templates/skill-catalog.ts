import { createProjectSkillDocPath, createProjectSkillGeneratedPath } from '../skills-contract.js'

type SkillReferenceMetadata = {
  templateDir: string
  docsPath: string
  agentsLabel: string
  topologyLabel: string
}

type CoreSkillMetadata = SkillReferenceMetadata & {
  frontendPolicyReferenceLabel: string
  referenceCatalogPath?: string
}

type OptionalSkillMetadata = SkillReferenceMetadata

const CORE_SKILL_METADATA_BY_ID = {
  'miniapp-capabilities': {
    templateDir: 'miniapp-capabilities',
    docsPath: createProjectSkillDocPath('miniapp-capabilities'),
    agentsLabel: 'MiniApp capability / 공식 API 탐색',
    topologyLabel: 'MiniApp capability',
    frontendPolicyReferenceLabel: '기능 축과 공식 문서 진입',
  },
  'granite-routing': {
    templateDir: 'granite-routing',
    docsPath: createProjectSkillDocPath('granite-routing'),
    agentsLabel: 'route / page / navigation 패턴',
    topologyLabel: 'Granite page/route patterns',
    frontendPolicyReferenceLabel: 'route / navigation 패턴',
  },
  'tds-ui': {
    templateDir: 'tds-ui',
    docsPath: createProjectSkillDocPath('tds-ui'),
    agentsLabel: 'TDS UI 선택과 form 패턴',
    topologyLabel: 'TDS UI selection',
    frontendPolicyReferenceLabel: 'TDS component 선택',
    referenceCatalogPath: createProjectSkillGeneratedPath('tds-ui', 'generated/catalog.json'),
  },
} as const satisfies Record<string, CoreSkillMetadata>

const OPTIONAL_SKILL_METADATA_BY_ID = {
  'backoffice-react': {
    templateDir: 'backoffice-react',
    docsPath: createProjectSkillDocPath('backoffice-react'),
    agentsLabel: 'backoffice React 작업',
    topologyLabel: 'Backoffice React workflow',
  },
  'cloudflare-worker': {
    templateDir: 'cloudflare-worker',
    docsPath: createProjectSkillDocPath('cloudflare-worker'),
    agentsLabel: 'Cloudflare Worker 작업',
    topologyLabel: 'Cloudflare Worker 운영 가이드',
  },
  'supabase-project': {
    templateDir: 'supabase-project',
    docsPath: createProjectSkillDocPath('supabase-project'),
    agentsLabel: 'Supabase project 작업',
    topologyLabel: 'Supabase 프로젝트 운영 가이드',
  },
  'firebase-functions': {
    templateDir: 'firebase-functions',
    docsPath: createProjectSkillDocPath('firebase-functions'),
    agentsLabel: 'Firebase Functions 작업',
    topologyLabel: 'Firebase Functions 운영 가이드',
  },
  'trpc-boundary': {
    templateDir: 'trpc-boundary',
    docsPath: createProjectSkillDocPath('trpc-boundary'),
    agentsLabel: 'tRPC boundary 변경',
    topologyLabel: 'tRPC boundary change flow',
  },
} as const satisfies Record<string, OptionalSkillMetadata>

export type CoreSkillId = keyof typeof CORE_SKILL_METADATA_BY_ID
export type OptionalSkillId = keyof typeof OPTIONAL_SKILL_METADATA_BY_ID
export type SkillId = CoreSkillId | OptionalSkillId

export type SkillReferenceDefinition = SkillReferenceMetadata & {
  id: SkillId
}

export type CoreSkillDefinition = SkillReferenceMetadata & {
  id: CoreSkillId
  kind: 'core'
  frontendPolicyReferenceLabel: string
  referenceCatalogPath?: string
}

export type OptionalSkillDefinition = SkillReferenceMetadata & {
  id: OptionalSkillId
  kind: 'optional'
}

export type SkillDefinition = CoreSkillDefinition | OptionalSkillDefinition

function resolveCoreSkillDefinition(id: CoreSkillId): CoreSkillDefinition {
  return {
    id,
    kind: 'core',
    ...CORE_SKILL_METADATA_BY_ID[id],
  }
}

function createOptionalSkillDefinition(id: OptionalSkillId): OptionalSkillDefinition {
  return {
    id,
    kind: 'optional',
    ...OPTIONAL_SKILL_METADATA_BY_ID[id],
  }
}

export const CORE_SKILL_DEFINITIONS = (Object.keys(CORE_SKILL_METADATA_BY_ID) as CoreSkillId[]).map(
  resolveCoreSkillDefinition,
)

export const OPTIONAL_SKILL_DEFINITIONS = (
  Object.keys(OPTIONAL_SKILL_METADATA_BY_ID) as OptionalSkillId[]
).map(createOptionalSkillDefinition)

export const SKILL_CATALOG: SkillDefinition[] = [
  ...CORE_SKILL_DEFINITIONS,
  ...OPTIONAL_SKILL_DEFINITIONS,
]

export function getSkillDefinition(id: SkillId) {
  if (id in CORE_SKILL_METADATA_BY_ID) {
    return resolveCoreSkillDefinition(id as CoreSkillId)
  }

  if (id in OPTIONAL_SKILL_METADATA_BY_ID) {
    return createOptionalSkillDefinition(id as OptionalSkillId)
  }

  throw new Error(`알 수 없는 skill id입니다: ${id}`)
}

export function getCoreSkillDefinition(id: CoreSkillId) {
  return resolveCoreSkillDefinition(id)
}

export function resolveOptionalSkillDefinition(id: OptionalSkillId) {
  return createOptionalSkillDefinition(id)
}
