import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  buildCloudflareWorkersDevUrl,
  finalizeCloudflareProvisioning,
  formatCloudflareManualSetupNote,
  writeCloudflareLocalEnvFiles,
} from './cloudflare-provision.js'

test('buildCloudflareWorkersDevUrl builds a workers.dev URL from worker and account subdomain', () => {
  assert.equal(
    buildCloudflareWorkersDevUrl('ebook-miniapp', 'team-ebook'),
    'https://ebook-miniapp.team-ebook.workers.dev',
  )
})

test('formatCloudflareManualSetupNote includes frontend and backoffice env guidance', () => {
  const note = formatCloudflareManualSetupNote({
    targetRoot: '/tmp/ebook-miniapp',
    hasBackoffice: true,
    workerName: 'ebook-miniapp',
  })

  assert.equal(note.title, 'Cloudflare API URL 안내')
  assert.match(note.body, /frontend\/\.env\.local/)
  assert.match(note.body, /backoffice\/\.env\.local/)
  assert.match(note.body, /MINIAPP_API_BASE_URL=<배포된 Worker URL>/)
  assert.match(note.body, /VITE_API_BASE_URL=<배포된 Worker URL>/)
})

test('writeCloudflareLocalEnvFiles writes frontend and backoffice .env.local files', async () => {
  const targetRoot = await mkdtemp(path.join(os.tmpdir(), 'create-rn-miniapp-cloudflare-'))

  try {
    await writeCloudflareLocalEnvFiles({
      targetRoot,
      hasBackoffice: true,
      apiBaseUrl: 'https://ebook-miniapp.team-ebook.workers.dev',
    })

    const frontendEnv = await readFile(path.join(targetRoot, 'frontend', '.env.local'), 'utf8')
    const backofficeEnv = await readFile(path.join(targetRoot, 'backoffice', '.env.local'), 'utf8')

    assert.equal(
      frontendEnv,
      ['MINIAPP_API_BASE_URL=https://ebook-miniapp.team-ebook.workers.dev', ''].join('\n'),
    )
    assert.equal(
      backofficeEnv,
      ['VITE_API_BASE_URL=https://ebook-miniapp.team-ebook.workers.dev', ''].join('\n'),
    )
  } finally {
    await rm(targetRoot, { recursive: true, force: true })
  }
})

test('finalizeCloudflareProvisioning writes env files when api base url is available', async () => {
  const targetRoot = await mkdtemp(path.join(os.tmpdir(), 'create-rn-miniapp-cloudflare-finalize-'))

  try {
    const notes = await finalizeCloudflareProvisioning({
      targetRoot,
      provisionedWorker: {
        workerName: 'ebook-miniapp',
        apiBaseUrl: 'https://ebook-miniapp.team-ebook.workers.dev',
        mode: 'existing',
      },
    })

    const frontendEnv = await readFile(path.join(targetRoot, 'frontend', '.env.local'), 'utf8')

    assert.equal(
      frontendEnv,
      ['MINIAPP_API_BASE_URL=https://ebook-miniapp.team-ebook.workers.dev', ''].join('\n'),
    )
    assert.equal(notes[0]?.title, 'Cloudflare API URL 작성 완료')
  } finally {
    await rm(targetRoot, { recursive: true, force: true })
  }
})

test('finalizeCloudflareProvisioning falls back to manual setup guidance when api url is unavailable', async () => {
  const targetRoot = await mkdtemp(path.join(os.tmpdir(), 'create-rn-miniapp-cloudflare-manual-'))

  try {
    const notes = await finalizeCloudflareProvisioning({
      targetRoot,
      provisionedWorker: {
        workerName: 'ebook-miniapp',
        apiBaseUrl: null,
        mode: 'existing',
      },
    })

    assert.equal(notes[0]?.title, 'Cloudflare API URL 안내')
    assert.match(notes[0]?.body ?? '', /ebook-miniapp/)
    assert.match(notes[0]?.body ?? '', /frontend\/\.env\.local/)
  } finally {
    await rm(targetRoot, { recursive: true, force: true })
  }
})
