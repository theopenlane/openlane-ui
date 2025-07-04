import { openlaneAPIUrl } from '@repo/dally/auth'
import Credentials from 'next-auth/providers/credentials'
import { setSessionCookie } from '../utils/set-session-cookie'
import { getDashboardData } from '@/app/api/getDashboardData/route'

type PasskeyCredentials = {
  email: string
  session: string
  accessToken: string
  refreshToken: string
}

// Passkey credentials provider
export const passKeyProvider = Credentials({
  id: 'passkey',
  name: 'passkey',
  credentials: {
    email: { label: 'Email', type: 'email' },
    session: { label: 'Session', type: 'text' },
    accessToken: { label: 'Access Token', type: 'text' },
    refreshToken: { label: 'Refresh Token', type: 'text' },
  },
  async authorize(rawCredentials) {
    try {
      const { email, session, accessToken, refreshToken } = rawCredentials ?? {}

      if (typeof email !== 'string' || typeof session !== 'string' || typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
        throw new Error('Missing or invalid credential fields.')
      }

      const credentials: PasskeyCredentials = {
        email,
        session,
        accessToken,
        refreshToken,
      }

      const uData = await fetch(`${openlaneAPIUrl}/oauth/userinfo`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      })

      if (!uData.ok) {
        console.error('Failed to fetch user info')
        return null
      }

      const data = await uData.json()
      const dashboardData = await getDashboardData(credentials.accessToken, credentials.session)

      const isTfaEnabled = data.edges?.setting?.is_tfa_enabled || false

      setSessionCookie(credentials.session)

      return {
        id: data.id || credentials.email,
        email: credentials.email,
        isTfaEnabled,
        isOnboarding: dashboardData?.organizations?.edges?.length === 1,
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        ...data,
      }
    } catch (error) {
      console.error('Authorization failed:', error)
      return null
    }
  },
})
