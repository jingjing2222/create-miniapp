import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  buildSkillsInstallCommand,
  hasInstalledProjectSkills,
  listInstalledProjectSkills,
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

test('project-local skill detection ignores non-skill files and derives presence from actual skill directories', async (t) => {
  const targetRoot = await mkdtemp(path.join(os.tmpdir(), 'create-rn-miniapp-skills-install-'))

  t.after(async () => {
    await rm(targetRoot, { recursive: true, force: true })
  })

  await mkdir(path.join(targetRoot, '.agents', 'skills'), { recursive: true })
  await mkdir(path.join(targetRoot, '.claude', 'skills'), { recursive: true })
  await writeFile(path.join(targetRoot, '.agents', 'skills', 'README.md'), 'not a skill\n', 'utf8')
  await writeFile(path.join(targetRoot, '.claude', 'skills', 'notes.txt'), 'mirror note\n', 'utf8')

  assert.equal(await hasInstalledProjectSkills(targetRoot), false)
  assert.deepEqual(await listInstalledProjectSkills(targetRoot), [])
})
