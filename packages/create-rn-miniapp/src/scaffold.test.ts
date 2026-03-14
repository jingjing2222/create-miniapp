import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { buildRootFinalizePlan } from './scaffold.js'

test('buildRootFinalizePlan keeps pnpm root finalize steps minimal', () => {
  const targetRoot = path.join('/tmp', 'ebook')
  const plan = buildRootFinalizePlan({
    targetRoot,
    packageManager: 'pnpm',
  })

  assert.deepEqual(
    plan.map((step) => step.label),
    ['루트 pnpm install', '루트 biome check --write --unsafe'],
  )
  assert.deepEqual(plan[0], {
    cwd: targetRoot,
    command: 'pnpm',
    args: ['install'],
    label: '루트 pnpm install',
  })
})

test('buildRootFinalizePlan adds yarn sdk generation after root install', () => {
  const targetRoot = path.join('/tmp', 'ebook')
  const plan = buildRootFinalizePlan({
    targetRoot,
    packageManager: 'yarn',
  })

  assert.deepEqual(
    plan.map((step) => step.label),
    ['루트 yarn install', '루트 yarn sdks 생성', '루트 biome check --write --unsafe'],
  )
  assert.deepEqual(plan[1], {
    cwd: targetRoot,
    command: 'yarn',
    args: ['dlx', '@yarnpkg/sdks', 'base'],
    label: '루트 yarn sdks 생성',
  })
})
