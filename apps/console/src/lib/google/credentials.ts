import { googleAPIKey } from '@repo/dally/ai'

export type GoogleServiceAccountCredentials = { client_email: string; private_key: string; project_id?: string }

let cached: GoogleServiceAccountCredentials | null | undefined

export const getGoogleServiceAccountCredentials = (): GoogleServiceAccountCredentials | null => {
  if (cached !== undefined) return cached

  if (!googleAPIKey) {
    cached = null
    return cached
  }

  try {
    cached = JSON.parse(Buffer.from(googleAPIKey, 'base64').toString('utf8')) as GoogleServiceAccountCredentials
  } catch (err) {
    console.error('google service account credential parse error:', err instanceof Error ? err.message : err)
    cached = null
  }

  return cached
}
