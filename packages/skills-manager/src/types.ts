import type { PackageManager } from './package-manager.js'

export type ServerProvider = 'supabase' | 'cloudflare' | 'firebase'

export type TemplateTokens = {
  appName: string
  displayName: string
  packageManager: PackageManager
  packageManagerField: string
  packageManagerCommand: string
  packageManagerRunCommand: string
  packageManagerExecCommand: string
  verifyCommand: string
}

export type GeneratedWorkspaceHints = {
  serverProvider: ServerProvider | null
  manualExtraSkills?: string[]
}

export type GeneratedWorkspaceOptions = {
  hasBackoffice: boolean
  serverProvider: ServerProvider | null
  hasTrpc: boolean
}
