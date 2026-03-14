import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '../../..')

test('version-packages formats workspace after changeset bump', () => {
  const packageJsonPath = path.join(repoRoot, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>
  }

  assert.equal(packageJson.scripts?.['version-packages'], 'changeset version && pnpm format')
})
