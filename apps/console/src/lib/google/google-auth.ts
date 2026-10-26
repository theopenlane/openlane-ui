import { GoogleAuth } from 'google-auth-library'
import { getGoogleServiceAccountCredentials } from '@/lib/google/credentials'

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'

let auth: GoogleAuth | undefined

export const getGoogleAuth = (): GoogleAuth => {
  if (!auth) {
    const credentials = getGoogleServiceAccountCredentials() ?? undefined
    auth = new GoogleAuth({ credentials, scopes: [CLOUD_PLATFORM_SCOPE] })
  }
  return auth
}
