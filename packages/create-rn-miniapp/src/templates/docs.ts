import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  resolveTemplatesPackageRoot,
  copyDirectoryWithTokens,
  copyFileWithTokens,
} from './filesystem.js'
import {
  resolveEnabledWorkspaceFeatures,
  resolveSelectedOptionalSkillDefinitions,
} from './feature-catalog.js'
import { renderFrontendPolicyMarkdown } from './frontend-policy.js'
import { resolveGeneratedWorkspaceOptions } from './generated-workspace.js'
import { createRootTemplateExtraTokens, renderRootVerifyStepsMarkdown } from './root.js'
import { CORE_SKILL_DEFINITIONS } from './skills.js'
import type { GeneratedWorkspaceHints, GeneratedWorkspaceOptions, TemplateTokens } from './types.js'

type CodeOwnedDocDefinition = {
  relativePath: string
  render: (tokens: TemplateTokens, options: GeneratedWorkspaceOptions) => string
}

function renderBulletList(items: string[]) {
  if (items.length === 0) {
    return ''
  }

  return `${items.map((item) => `- ${item}`).join('\n')}\n`
}

function renderSection(title: string, body: string) {
  return `## ${title}\n${body.trimEnd()}`
}

function renderAgentsWorkspaceModelSection(options: GeneratedWorkspaceOptions) {
  return renderBulletList([
    ...resolveEnabledWorkspaceFeatures(options).flatMap((feature) => feature.agentsLines ?? []),
    '`docs`: 계약, 정책, 제품, 상태 문서',
  ])
}

function renderAgentsSkillRoutingSection(options: GeneratedWorkspaceOptions) {
  const items = [
    ...CORE_SKILL_DEFINITIONS.map((skill) => `${skill.agentsLabel}: \`${skill.docsPath}\``),
    ...resolveSelectedOptionalSkillDefinitions(options).map(
      (skill) => `${skill.agentsLabel}: \`${skill.docsPath}\``,
    ),
  ]

  return renderBulletList(items)
}

function renderDocsIndexSkillStructureSection(options: GeneratedWorkspaceOptions) {
  const optionalSkills = resolveSelectedOptionalSkillDefinitions(options)
  const lines = [
    '- canonical source: `.agents/skills/`',
    '- Claude mirror: `.claude/skills/`',
    '',
    'core skills:',
    ...CORE_SKILL_DEFINITIONS.map((skill) => `- \`${skill.docsPath}\``),
  ]

  if (optionalSkills.length > 0) {
    lines.push('', 'optional skills:', ...optionalSkills.map((skill) => `- \`${skill.docsPath}\``))
  }

  return `${lines.join('\n')}\n`
}

function renderTopologyRootSection(options: GeneratedWorkspaceOptions) {
  return renderBulletList(
    resolveEnabledWorkspaceFeatures(options).flatMap((feature) => feature.topologyRootLines ?? []),
  )
}

function renderTopologyRolesSection(options: GeneratedWorkspaceOptions) {
  const blocks = resolveEnabledWorkspaceFeatures(options).flatMap((feature) =>
    (feature.roleSections ?? []).map((section) =>
      [`### ${section.heading}`, ...section.lines(options)].join('\n'),
    ),
  )

  return `${blocks.join('\n\n')}\n`
}

function renderTopologyOwnershipSection(options: GeneratedWorkspaceOptions) {
  const lines = [
    '- env ownership: 각 workspace의 `.env.local`',
    ...resolveEnabledWorkspaceFeatures(options).flatMap(
      (feature) => feature.ownershipLines?.(options) ?? [],
    ),
  ]
  const importBoundaryRules = resolveEnabledWorkspaceFeatures(options).flatMap(
    (feature) => feature.importBoundaryRules?.(options) ?? [],
  )

  if (importBoundaryRules.length > 0) {
    lines.push('- import boundary:')
    lines.push(...importBoundaryRules.map((rule) => `  - ${rule}`))
  }

  return `${lines.join('\n')}\n`
}

function renderTopologySkillsSection(options: GeneratedWorkspaceOptions) {
  const items = [
    ...CORE_SKILL_DEFINITIONS.map((skill) => `${skill.topologyLabel}: \`${skill.docsPath}\``),
    ...resolveSelectedOptionalSkillDefinitions(options).map(
      (skill) => `${skill.topologyLabel}: \`${skill.docsPath}\``,
    ),
  ]

  return renderBulletList(items)
}

function renderAgentsMarkdown(_tokens: TemplateTokens, options: GeneratedWorkspaceOptions) {
  return [
    '# AGENTS.md',
    '',
    '이 문서는 생성물 루트의 빠른 진입점입니다. 상세 저장소 계약과 완료 기준은 `docs/engineering/repo-contract.md`가 소유하고, workspace별 정책은 `docs/engineering/*`가 소유합니다.',
    '',
    '## Repository Contract',
    '- 상세 저장소 계약: `docs/engineering/repo-contract.md`',
    '- frontend 정책: `docs/engineering/frontend-policy.md`',
    '- workspace 구조: `docs/engineering/workspace-topology.md`',
    '- canonical skills: `.agents/skills/*`',
    '- Claude mirror: `.claude/skills/*`',
    '',
    '## Start Here',
    '1. `docs/ai/Plan.md`',
    '2. `docs/ai/Status.md`',
    '3. `docs/ai/Decisions.md`',
    '4. `docs/index.md`',
    '5. `docs/product/기능명세서.md`',
    '',
    renderSection('Workspace Model', renderAgentsWorkspaceModelSection(options)),
    '',
    renderSection('Skill Routing', renderAgentsSkillRoutingSection(options)),
    '',
    '## Done',
    '- 세부 완료 기준은 `docs/engineering/repo-contract.md`를 따른다.',
    '- frontend 변경은 `docs/engineering/frontend-policy.md`까지 같이 확인한다.',
    '',
  ].join('\n')
}

function renderDocsIndexMarkdown(tokens: TemplateTokens, options: GeneratedWorkspaceOptions) {
  return [
    '# docs index',
    '',
    '문서 루트는 얇게 유지하고, 상세 규칙은 하위 문서와 Skill로 분리합니다.',
    '',
    '## 문서 구조',
    '- `ai/`: `Plan`, `Status`, `Decisions`, `Prompt`',
    '- `product/`: 제품 요구사항',
    '- `engineering/`: 강제 규칙과 구조 정책',
    '',
    '## engineering 문서',
    '- `engineering/repo-contract.md`',
    '- `engineering/frontend-policy.md`',
    '- `engineering/workspace-topology.md`',
    '',
    renderSection('Skill 구조', renderDocsIndexSkillStructureSection(options)),
    '',
    renderSection('verify', renderRootVerifyStepsMarkdown(tokens.packageManager)),
    '',
    '## 운영 메모',
    '- 새 규칙은 먼저 `engineering/*`에 들어갈지, Skill로 분리할지 구분한다.',
    '- 문서 경로를 바꾸면 `AGENTS.md`, `CLAUDE.md`, Copilot instructions, Skill 경로를 같이 갱신한다.',
    '',
  ].join('\n')
}

function renderWorkspaceTopologyMarkdown(options: GeneratedWorkspaceOptions) {
  return [
    '# Workspace Topology',
    '',
    renderSection('루트 구조', renderTopologyRootSection(options)),
    '',
    renderSection('역할 분리', renderTopologyRolesSection(options)),
    '',
    renderSection('ownership', renderTopologyOwnershipSection(options)),
    '',
    renderSection('참고 Skill', renderTopologySkillsSection(options)),
    '',
  ].join('\n')
}

const CODE_OWNED_DOC_DEFINITIONS: CodeOwnedDocDefinition[] = [
  {
    relativePath: 'AGENTS.md',
    render: renderAgentsMarkdown,
  },
  {
    relativePath: 'docs/index.md',
    render: renderDocsIndexMarkdown,
  },
  {
    relativePath: 'docs/engineering/workspace-topology.md',
    render: (_tokens, options) => renderWorkspaceTopologyMarkdown(options),
  },
  {
    relativePath: 'docs/engineering/frontend-policy.md',
    render: (tokens) => renderFrontendPolicyMarkdown(tokens.packageManagerRunCommand),
  },
]

function resolveCodeOwnedDocsInsideDocsSet() {
  return new Set(
    CODE_OWNED_DOC_DEFINITIONS.filter((definition) =>
      definition.relativePath.startsWith('docs/'),
    ).map((definition) => definition.relativePath.slice('docs/'.length)),
  )
}

async function writeCodeOwnedMarkdown(targetRoot: string, relativePath: string, source: string) {
  const targetPath = path.join(targetRoot, ...relativePath.split('/'))
  await mkdir(path.dirname(targetPath), { recursive: true })
  await writeFile(targetPath, source, 'utf8')
}

export async function applyDocsTemplates(
  targetRoot: string,
  tokens: TemplateTokens,
  hints: GeneratedWorkspaceHints,
) {
  const templatesRoot = resolveTemplatesPackageRoot()
  const baseTemplateDir = path.join(templatesRoot, 'base')
  const options = await resolveGeneratedWorkspaceOptions(targetRoot, hints)
  const extraTokens = createRootTemplateExtraTokens(tokens.packageManager)

  await copyFileWithTokens(
    path.join(baseTemplateDir, 'CLAUDE.md'),
    path.join(targetRoot, 'CLAUDE.md'),
    tokens,
    extraTokens,
  )
  await copyDirectoryWithTokens(
    path.join(baseTemplateDir, '.github'),
    path.join(targetRoot, '.github'),
    tokens,
    { extraTokens },
  )
  await copyDirectoryWithTokens(
    path.join(baseTemplateDir, 'docs'),
    path.join(targetRoot, 'docs'),
    tokens,
    {
      skipRelativePaths: resolveCodeOwnedDocsInsideDocsSet(),
      extraTokens,
    },
  )

  for (const definition of CODE_OWNED_DOC_DEFINITIONS) {
    await writeCodeOwnedMarkdown(
      targetRoot,
      definition.relativePath,
      definition.render(tokens, options),
    )
  }
}
