import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { maybeWriteNpmWorkspaceConfig } from './helpers.js'

async function createTempWorkspaceRoot(t: test.TestContext) {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), 'create-rn-miniapp-scaffold-'))
  t.after(async () => {
    await rm(workspaceRoot, { recursive: true, force: true })
  })
  return workspaceRoot
}

test('maybeWriteNpmWorkspaceConfig writes workspace .npmrc only for npm', async (t) => {
  const npmWorkspaceRoot = await createTempWorkspaceRoot(t)
  const pnpmWorkspaceRoot = await createTempWorkspaceRoot(t)

  await maybeWriteNpmWorkspaceConfig(npmWorkspaceRoot, 'npm')
  await maybeWriteNpmWorkspaceConfig(pnpmWorkspaceRoot, 'pnpm')

  assert.equal(
    await readFile(path.join(npmWorkspaceRoot, '.npmrc'), 'utf8'),
    'legacy-peer-deps=true\n',
  )
  await assert.rejects(readFile(path.join(pnpmWorkspaceRoot, '.npmrc'), 'utf8'))
})
