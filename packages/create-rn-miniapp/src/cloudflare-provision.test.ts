import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  buildCloudflareWorkersDevUrl,
  finalizeCloudflareProvisioning,
  formatCloudflareManualSetupNote,
  writeCloudflareServerLocalEnvFile,
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
    accountId: 'account-123',
    workerName: 'ebook-miniapp',
  })

  assert.equal(note.title, 'Cloudflare API URL 안내')
  assert.match(note.body, /frontend\/\.env\.local/)
  assert.match(note.body, /backoffice\/\.env\.local/)
  assert.match(note.body, /server\/\.env\.local/)
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

test('writeCloudflareServerLocalEnvFile creates server env file and preserves an existing API token', async () => {
  const targetRoot = await mkdtemp(path.join(os.tmpdir(), 'create-rn-miniapp-cloudflare-server-'))

  try {
    await writeCloudflareServerLocalEnvFile({
      targetRoot,
      accountId: 'account-123',
      workerName: 'ebook-miniapp',
      apiBaseUrl: 'https://ebook-miniapp.team-ebook.workers.dev',
    })

    const initialServerEnv = await readFile(path.join(targetRoot, 'server', '.env.local'), 'utf8')

    assert.equal(
      initialServerEnv,
      [
        '# Used by server/package.json deploy for remote Cloudflare Worker deploys.',
        'CLOUDFLARE_ACCOUNT_ID=account-123',
        'CLOUDFLARE_WORKER_NAME=ebook-miniapp',
        'CLOUDFLARE_API_BASE_URL=https://ebook-miniapp.team-ebook.workers.dev',
        'CLOUDFLARE_API_TOKEN=',
        '',
      ].join('\n'),
    )

    await writeFile(
      path.join(targetRoot, 'server', '.env.local'),
      [
        '# Used by server/package.json deploy for remote Cloudflare Worker deploys.',
        'CLOUDFLARE_ACCOUNT_ID=old-account',
        'CLOUDFLARE_WORKER_NAME=old-worker',
        'CLOUDFLARE_API_BASE_URL=https://old-worker.old-subdomain.workers.dev',
        'CLOUDFLARE_API_TOKEN=secret-token',
        'EXTRA=value',
        '',
      ].join('\n'),
      'utf8',
    )

    await writeCloudflareServerLocalEnvFile({
      targetRoot,
      accountId: 'next-account',
      workerName: 'next-worker',
      apiBaseUrl: 'https://next-worker.next-subdomain.workers.dev',
    })

    const updatedServerEnv = await readFile(path.join(targetRoot, 'server', '.env.local'), 'utf8')

    assert.match(updatedServerEnv, /^CLOUDFLARE_ACCOUNT_ID=next-account$/m)
    assert.match(updatedServerEnv, /^CLOUDFLARE_WORKER_NAME=next-worker$/m)
    assert.match(
      updatedServerEnv,
      /^CLOUDFLARE_API_BASE_URL=https:\/\/next-worker\.next-subdomain\.workers\.dev$/m,
    )
    assert.match(updatedServerEnv, /^CLOUDFLARE_API_TOKEN=secret-token$/m)
    assert.match(updatedServerEnv, /^EXTRA=value$/m)
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
        accountId: 'account-123',
        workerName: 'ebook-miniapp',
        apiBaseUrl: 'https://ebook-miniapp.team-ebook.workers.dev',
        mode: 'existing',
      },
    })

    const frontendEnv = await readFile(path.join(targetRoot, 'frontend', '.env.local'), 'utf8')
    const serverEnv = await readFile(path.join(targetRoot, 'server', '.env.local'), 'utf8')

    assert.equal(
      frontendEnv,
      ['MINIAPP_API_BASE_URL=https://ebook-miniapp.team-ebook.workers.dev', ''].join('\n'),
    )
    assert.match(serverEnv, /^CLOUDFLARE_ACCOUNT_ID=account-123$/m)
    assert.match(serverEnv, /^CLOUDFLARE_WORKER_NAME=ebook-miniapp$/m)
    assert.equal(notes[0]?.title, 'Cloudflare API URL 작성 완료')
    assert.match(notes[0]?.body ?? '', /server\/\.env\.local/)
    assert.match(notes[0]?.body ?? '', /deploy/)
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
        accountId: 'account-123',
        workerName: 'ebook-miniapp',
        apiBaseUrl: null,
        mode: 'existing',
      },
    })

    const serverEnv = await readFile(path.join(targetRoot, 'server', '.env.local'), 'utf8')

    assert.equal(notes[0]?.title, 'Cloudflare API URL 안내')
    assert.match(notes[0]?.body ?? '', /ebook-miniapp/)
    assert.match(notes[0]?.body ?? '', /frontend\/\.env\.local/)
    assert.match(notes[0]?.body ?? '', /server\/\.env\.local/)
    assert.match(serverEnv, /^CLOUDFLARE_ACCOUNT_ID=account-123$/m)
  } finally {
    await rm(targetRoot, { recursive: true, force: true })
  }
})
