import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import {
  buildSkillsInstallCommand,
  normalizeSelectedSkillIds,
  renderSkillsAddCommand,
  resolveRecommendedSkillIds,
} from './skills-install.js'

test('normalizeSelectedSkillIds keeps known ids and removes duplicates', () => {
  assert.deepEqual(normalizeSelectedSkillIds(['tds-ui', 'cloudflare-worker', 'tds-ui']), [
    'tds-ui',
    'cloudflare-worker',
  ])
})

test('resolveRecommendedSkillIds returns a flat recommended list for the current topology', () => {
  assert.deepEqual(
    resolveRecommendedSkillIds({
      serverProvider: 'cloudflare',
      hasBackoffice: true,
      hasTrpc: true,
    }),
    [
      'miniapp-capabilities',
      'granite-routing',
      'tds-ui',
      'backoffice-react',
      'cloudflare-worker',
      'trpc-boundary',
    ],
  )
})

test('renderSkillsAddCommand produces the standard npx skills command', () => {
  assert.equal(
    renderSkillsAddCommand(['miniapp-capabilities', 'granite-routing', 'tds-ui']),
    'npx skills add jingjing2222/create-rn-miniapp --skill miniapp-capabilities --skill granite-routing --skill tds-ui --copy',
  )
})

test('buildSkillsInstallCommand uses the package manager dlx adapter and local repo source in development', async () => {
  const targetRoot = '/tmp/ebook-miniapp'
  const command = await buildSkillsInstallCommand({
    packageManager: 'pnpm',
    targetRoot,
    skillIds: ['miniapp-capabilities', 'tds-ui'],
  })

  assert.ok(command)
  assert.equal(command.cwd, targetRoot)
  assert.equal(command.command, 'pnpm')
  assert.deepEqual(command.args, [
    'dlx',
    'skills',
    'add',
    path.resolve(import.meta.dirname, '../../..'),
    '--skill',
    'miniapp-capabilities',
    '--skill',
    'tds-ui',
    '--copy',
    '-y',
  ])
})
