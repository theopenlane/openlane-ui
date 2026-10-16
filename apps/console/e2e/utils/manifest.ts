import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const AUTH_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.auth')

export const MANIFEST_PATH = path.join(AUTH_DIR, 'manifest.json')

export type SeededRoleKey = 'admin' | 'superadmin' | 'member' | 'readonly'

export interface AuthManifest {
  runId: string
  ownerEmail: string
  password: string
  sharedOrgId: string
  sharedOrgName: string
  roleEmails: Record<SeededRoleKey, string>
  sharedControlId: string
  sharedControlRefCode: string
  demoEmail: string
  demoPassword: string
}

export const readManifest = (): AuthManifest => JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as AuthManifest
