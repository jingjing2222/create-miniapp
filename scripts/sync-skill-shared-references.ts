import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  renderSharedFrontendPolicyReferenceMarkdown,
  SHARED_FRONTEND_POLICY_REFERENCE_PATH,
} from '../packages/create-rn-miniapp/src/templates/frontend-policy.js'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const frontendPolicyReferencePath = path.join(repoRoot, SHARED_FRONTEND_POLICY_REFERENCE_PATH)

async function main() {
  const currentSource = await readFile(frontendPolicyReferencePath, 'utf8')
  const nextSource = renderSharedFrontendPolicyReferenceMarkdown()

  if (currentSource !== nextSource) {
    await writeFile(frontendPolicyReferencePath, nextSource, 'utf8')
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
