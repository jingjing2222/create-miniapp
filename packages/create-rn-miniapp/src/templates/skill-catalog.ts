type SkillReferenceMetadata = {
  agentsLabel: string
  topologyLabel: string
}

type CoreSkillMetadata = SkillReferenceMetadata & {
  frontendPolicyReferenceLabel: string
  referenceCatalogRelativePath?: string
}

type OptionalSkillMetadata = SkillReferenceMetadata

const CORE_SKILL_METADATA_BY_ID = {
  'miniapp-capabilities': {
    agentsLabel: 'MiniApp capability / 공식 API 탐색',
    topologyLabel: 'MiniApp capability',
    frontendPolicyReferenceLabel: '기능 축과 공식 문서 진입',
  },
  'granite-routing': {
    agentsLabel: 'route / page / navigation 패턴',
    topologyLabel: 'Granite page/route patterns',
    frontendPolicyReferenceLabel: 'route / navigation 패턴',
  },
  'tds-ui': {
    agentsLabel: 'TDS UI 선택과 form 패턴',
    topologyLabel: 'TDS UI selection',
    frontendPolicyReferenceLabel: 'TDS component 선택',
    referenceCatalogRelativePath: 'generated/catalog.json',
  },
} as const satisfies Record<string, CoreSkillMetadata>

const OPTIONAL_SKILL_METADATA_BY_ID = {
  'backoffice-react': {
    agentsLabel: 'backoffice React 작업',
    topologyLabel: 'Backoffice React workflow',
  },
  'cloudflare-worker': {
    agentsLabel: 'Cloudflare Worker 작업',
    topologyLabel: 'Cloudflare Worker 운영 가이드',
  },
  'supabase-project': {
    agentsLabel: 'Supabase project 작업',
    topologyLabel: 'Supabase 프로젝트 운영 가이드',
  },
  'firebase-functions': {
    agentsLabel: 'Firebase Functions 작업',
    topologyLabel: 'Firebase Functions 운영 가이드',
  },
  'trpc-boundary': {
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

export type CoreSkillDefinition = SkillReferenceDefinition & {
  id: CoreSkillId
  kind: 'core'
  frontendPolicyReferenceLabel: string
  referenceCatalogRelativePath?: string
}

export type OptionalSkillDefinition = SkillReferenceDefinition & {
  id: OptionalSkillId
  kind: 'optional'
}

export type SkillDefinition = CoreSkillDefinition | OptionalSkillDefinition

function createSkillReferenceDefinition<TId extends SkillId>(
  id: TId,
  metadata: SkillReferenceMetadata,
) {
  return {
    id,
    agentsLabel: metadata.agentsLabel,
    topologyLabel: metadata.topologyLabel,
  }
}

function resolveCoreSkillDefinition(id: CoreSkillId): CoreSkillDefinition {
  const metadata = CORE_SKILL_METADATA_BY_ID[id]
  const referenceCatalogRelativePath =
    'referenceCatalogRelativePath' in metadata ? metadata.referenceCatalogRelativePath : undefined

  return {
    ...createSkillReferenceDefinition(id, metadata),
    kind: 'core',
    frontendPolicyReferenceLabel: metadata.frontendPolicyReferenceLabel,
    ...(referenceCatalogRelativePath ? { referenceCatalogRelativePath } : {}),
  }
}

function createOptionalSkillDefinition(id: OptionalSkillId): OptionalSkillDefinition {
  return {
    ...createSkillReferenceDefinition(id, OPTIONAL_SKILL_METADATA_BY_ID[id]),
    kind: 'optional',
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
